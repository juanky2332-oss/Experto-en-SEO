import { NextResponse, type NextRequest } from "next/server";
import { mismaClave } from "@/lib/sesion";
import { inventario, guardarFoto } from "@/lib/seo/inventario";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { guardarGsc, ultimaGsc, enviarSitemap, vigilarIndexacion } from "@/lib/gsc";
import { MAPA_KEYWORDS } from "@/lib/que-publicar/mapa";
import { compartirNuevos, renovarToken } from "@/lib/redes";
import { getRitmo, guardarRitmo, toca } from "@/lib/ritmo";
import { darIdea, ideaActual } from "@/lib/que-publicar/idea";

export const maxDuration = 300;

// Vercel Cron (vercel.json, 8:00): foto SEO diaria (callada) y, el día que toca del ritmo, informe si algo ha cambiado e idea para publicar.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!mismaClave(auth, process.env.CRON_SECRET)) return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  const inv = await inventario();
  // foto diaria de Search Console (28 días); si falla o no está configurado, el resto sigue igual
  let gsc: number | null = null;
  try {
    gsc = await guardarGsc();
  } catch (e) {
    console.error("gsc", e);
  }
  const [ayer] = await sql<{ score: number }[]>`select score from seo.score_history where post_id = 0 and fecha < current_date order by fecha desc limit 1`;
  const antes = new Map((await sql<{ post_id: number; score: number }[]>`select post_id, score from seo.post_scores`).map((r) => [r.post_id, r.score]));
  await guardarFoto(inv);
  const caidasDia = inv.posts.filter((p) => p.status === "publish" && antes.has(p.id) && antes.get(p.id)! - p.analisis.score >= 10);
  const criticos = inv.posts.filter((p) => p.status === "publish" && p.analisis.problemas.some((x) => x.codigo === "enlaces_rotos" || x.codigo === "anio_erroneo"));
  // Informe SEO: solo el día que toca (cada 3 días, src/lib/ritmo.ts) y solo si algo ha cambiado desde el último
  const ritmo = await getRitmo();
  const tocaHoy = toca(ritmo);
  let informe = false;
  if (tocaHoy && !ritmo.pausas.seo) {
    let g: Awaited<ReturnType<typeof ultimaGsc>> = null;
    try {
      g = await ultimaGsc();
    } catch (e) {
      console.error("gsc-resumen", e);
    }
    const antes = ritmo.ultimo_seo;
    // caídas contra la foto del ÚLTIMO informe (no contra ayer): así no se pierde una caída de un día que no tocaba
    const caidas = antes?.scores
      ? inv.posts.filter((p) => p.status === "publish" && antes.scores![p.id] !== undefined && antes.scores![p.id] - p.analisis.score >= 10)
      : caidasDia;
    const clics = g?.clics ?? null;
    // Google cambia un poco cada día: solo cuenta si se mueve de verdad (≥5 clics y ≥20 %)
    const base = antes?.clics ?? 0;
    const cambioGsc = !!g && Math.abs(g.clics - base) >= Math.max(5, Math.round(base * 0.2));
    const cambioCriticos = criticos.length !== (antes?.criticos ?? 0);
    if (caidas.length || cambioGsc || cambioCriticos) {
      const delta = ayer ? inv.salud - ayer.score : 0;
      const difClics = g && antes?.clics != null ? g.clics - antes.clics : null;
      await telegram(
        `📈 <b>Informe SEO</b>\nSalud media: <b>${inv.salud}/100</b>${ayer ? ` (${delta >= 0 ? "+" : ""}${delta})` : ""}\n` +
          (g ? `\n🔎 Google (28 días hasta ${g.fecha}): <b>${g.clics}</b> clics${difClics !== null ? ` (${difClics >= 0 ? "+" : ""}${difClics})` : ""} · <b>${g.impresiones}</b> impresiones\n` : "") +
          (caidas.length ? `\n⬇️ Han empeorado:\n${caidas.slice(0, 5).map((p) => `• ${esc(p.title)} → ${p.analisis.score} (/post ${p.id})`).join("\n")}\n` : "") +
          (criticos.length ? `\n⚠️ ${criticos.length} artículos con enlaces rotos o años erróneos (/articulos)\n` : cambioCriticos ? "\n✅ Ya no quedan artículos con enlaces rotos ni años erróneos\n" : "") +
          `\n${process.env.APP_URL ?? ""}`,
      );
      informe = true;
    }
    // la foto solo se renueva cuando se avisa: lo que cambie poco a poco se va sumando hasta que merezca la pena
    if (informe || !antes) {
      const scores = Object.fromEntries(inv.posts.filter((p) => p.status === "publish").map((p) => [p.id, p.analisis.score]));
      await guardarRitmo({ ultimo_seo: { salud: inv.salud, clics, criticos: criticos.length, scores } });
    }
  }
  // Publicación del blog: el día que toca, una idea con «Redactar y publicar» (si no hay otra esperando respuesta)
  let idea = false;
  if (tocaHoy && !ritmo.pausas.publicaciones) {
    try {
      const actual = await ideaActual();
      const esperando = actual && actual.rec.estado !== "publicada" && !actual.atascada && (!actual.brief || actual.brief.status === "pending");
      if (!esperando) {
        await darIdea({ origin: "sistema" });
        idea = true;
      }
    } catch (e) {
      console.error("idea", e);
    }
  }
  // Indexación (permiso completo en Search Console desde 11-11-2026): el día del ritmo se reenvía el mapa del sitio
  // y se revisan las páginas que venden y los artículos publicados; aviso solo si alguna lleva 7+ días fuera de Google.
  let indexacion: { revisadas: number; fuera: number } | null = null;
  if (tocaHoy && !ritmo.pausas.seo) {
    try {
      await enviarSitemap();
      const SITE = "https://transformaconia.com";
      const urls = [...MAPA_KEYWORDS.map((e) => SITE + e.url), ...inv.posts.filter((p) => p.status === "publish").map((p) => p.link)];
      const v = await vigilarIndexacion(urls);
      indexacion = { revisadas: v.revisadas, fuera: v.fuera.length };
      const [aviso] = await sql<{ value: { urls: string[] } }[]>`select value from seo.settings where key = 'indexacion_aviso'`;
      const nuevas = v.fuera.filter((x) => !(aviso?.value?.urls ?? []).includes(x.url));
      if (nuevas.length) {
        const lineas = nuevas.slice(0, 8).map((x) => `• ${esc(x.url.replace(SITE, ""))} — ${esc(x.estado)} (${x.dias} días)`).join("\n");
        await telegram(`🔎 <b>Páginas que Google no está indexando</b> (7 días o más)\n${lineas}\n\nLas reviso y te digo qué hago.`);
      }
      await sql`insert into seo.settings (key, value) values ('indexacion_aviso', ${sql.json({ urls: v.fuera.map((x) => x.url) } as never)})
        on conflict (key) do update set value = excluded.value, updated_at = now()`;
    } catch (e) {
      console.error("indexacion", e);
    }
  }
  // Ya no hay plan semanal ni lote automático de «Qué publicar» (24-10-2026): las ideas se piden
  // cuando él quiere («Dame una idea») y se publican en ese momento.
  // Noticias nuevas del blog → propuesta por Telegram para subirlas a Instagram (publicación + historia)
  let redes = 0;
  try {
    redes = (await compartirNuevos(process.env.APP_URL || req.nextUrl.origin)).length;
  } catch (e) {
    console.error("redes", e);
  }
  // Los reels salen solos el día que toca (/api/cron/instagram); aquí solo se renueva el permiso de Instagram (caduca a los 60 días)
  try {
    await renovarToken();
  } catch (e) {
    console.error("ig_token", e);
  }
  return NextResponse.json({ ok: true, salud: inv.salud, caidas: caidasDia.length, gsc, redes, toca: tocaHoy, informe, idea, indexacion });
}
