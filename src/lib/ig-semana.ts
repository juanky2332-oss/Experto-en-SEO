import "server-only";
import { createHmac } from "node:crypto";
import { sql } from "@/lib/db";
import { telegram } from "@/lib/gateway";
import { hoyMadrid } from "@/lib/ritmo";

// Programa semanal de Instagram (16-11-2026, pedido del dueño): cada domingo a las 18:00 le llega a Telegram lo que va a salir
// la semana siguiente (lunes a domingo) y, si no hay nada programado o queda poco, un aviso para que pida preparar más.
// La vista previa (vídeo + portada + texto exacto de cada día y el banco de historias) se sirve en vivo en /api/ig/previa.

type Tarea = { tipo: string; ref?: string | null; detalle: string };
type Dia = { f: string; titulo: string; tareas: Tarea[]; estado: string };
type Pieza = { id: string; tipo: string; titulo: string; texto: string; video_url: string | null; portada_url: string | null; estado: string; datos: { imagenes?: string[] } | null };

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const nombre = (f: string) => { const d = new Date(f + "T12:00:00Z"); return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()}-${d.getUTCMonth() + 1}`; };
const sumar = (f: string, n: number) => { const d = new Date(f + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Clave de la vista previa: derivada de CRON_SECRET, para no exponer la clave y no añadir variables nuevas. */
export const clavePrevia = () => createHmac("sha256", process.env.CRON_SECRET ?? "").update("ig-previa").digest("hex").slice(0, 20);
export const urlPrevia = () => `${(process.env.APP_URL ?? "").replace(/\/$/, "")}/api/ig/previa?k=${clavePrevia()}`;

/** Lunes siguiente a hoy (si hoy es domingo, mañana). */
function lunesSiguiente(hoy = hoyMadrid()) {
  const d = new Date(hoy + "T12:00:00Z").getUTCDay(); // 0 domingo
  return sumar(hoy, d === 0 ? 1 : 8 - d);
}

/** Resumen de la semana siguiente para Telegram. */
export async function programaSemana() {
  const ini = lunesSiguiente();
  const fin = sumar(ini, 6);
  const dias = await sql<Dia[]>`select fecha::text f, titulo, tareas, estado from seo.ig_plan where fecha between ${ini}::date and ${fin}::date order by fecha`;
  const piezas = Object.fromEntries((await sql<Pieza[]>`select id, tipo, titulo, texto, video_url, portada_url, estado, datos from seo.ig_cola where tipo in ('reel', 'carrusel')`).map((p) => [p.id, p]));
  const [{ cola }] = await sql<{ cola: number }[]>`select count(*)::int cola from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto') and (fecha is null or fecha > ${fin}::date)`;
  const [{ hist }] = await sql<{ hist: number }[]>`select count(*)::int hist from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null`;
  const [{ ult }] = await sql<{ ult: string | null }[]>`select max(fecha)::text ult from seo.ig_plan where estado in ('pendiente', 'propuesto', 'aprobado')`;

  const lineas: string[] = [];
  for (let i = 0; i < 7; i++) {
    const f = sumar(ini, i);
    const d = dias.find((x) => x.f === f);
    if (!d) { lineas.push(`<b>${nombre(f)}</b> · descanso`); continue; }
    const ref = d.tareas.find((t) => t.ref)?.ref;
    const p = ref ? piezas[ref] : null;
    const extras = [d.tareas.some((t) => t.tipo === "historia") && "historias", d.tareas.some((t) => t.tipo === "seguir") && "seguir, comentar y me gusta"].filter(Boolean).join(" · ");
    lineas.push(`<b>${nombre(f)}</b> · ${p ? `${p.tipo === "carrusel" ? "🖼" : "🎬"} ${esc(p.titulo)}${p.estado !== "pendiente" ? ` (${esc(p.estado)})` : ""}` : ref ? `⚠️ ${esc(ref)} no está en la cola` : "sin publicación"}${extras ? `\n   ${extras}` : ""}`);
  }

  const avisos: string[] = [];
  const reels = dias.filter((d) => d.tareas.some((t) => t.ref)).length;
  if (!dias.length) avisos.push("⚠️ <b>No hay nada programado para esta semana.</b>");
  else if (reels < 2) avisos.push(`⚠️ Solo hay ${reels} publicación(es) en el feed esta semana.`);
  if (!dias.some((d) => d.tareas.some((t) => t.tipo === "seguir"))) avisos.push("⚠️ No hay días de seguir y comentar programados.");
  if (cola < 3) avisos.push(`⚠️ Después de esta semana solo quedan ${cola} publicación(es) en la cola${ult ? ` (el plan llega hasta el ${nombre(ult)})` : ""}.`);
  if (hist < 5) avisos.push(`⚠️ Quedan ${hist} historias en el banco.`);
  if (avisos.length) avisos.push("Cuando abras Claude Code, dime <b>«prepara dos semanas de Instagram»</b> y lo dejo todo listo: reels, historias, publicaciones, empresas para seguir, comentarios y me gusta.");

  const texto = `📅 <b>Instagram: semana del ${nombre(ini)} al ${nombre(fin)}</b>\n\n${lineas.join("\n")}\n\n👀 Vista previa con vídeos y textos: ${urlPrevia()}${avisos.length ? `\n\n${avisos.join("\n")}` : "\n\n✅ Todo listo para la semana."}`;
  await telegram(texto);
  return { ok: true, semana: [ini, fin], dias: dias.length, reels, cola, historias: hist, avisos: avisos.length };
}

/** Página de vista previa: cada día del plan desde hoy con su vídeo, portada y texto, y el banco de historias en orden. */
export async function htmlPrevia() {
  const hoy = hoyMadrid();
  const plan = await sql<Dia[]>`select fecha::text f, titulo, tareas, estado from seo.ig_plan where fecha >= ${hoy}::date order by fecha limit 40`;
  const piezas = Object.fromEntries((await sql<Pieza[]>`select id, tipo, titulo, texto, video_url, portada_url, estado, datos from seo.ig_cola where tipo in ('reel', 'carrusel')`).map((p) => [p.id, p]));
  const banco = await sql<{ id: string; titulo: string; video_url: string | null; historia_url: string | null }[]>`select id, titulo, video_url, historia_url from seo.ig_cola
    where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null order by orden`;
  const ICO: Record<string, string> = { reel: "🎬", historia: "📲", seguir: "➕", comentar: "💬", preparar: "🛠" };
  const pieza = (e?: Pieza) => {
    if (!e) return '<p class="aviso">⚠️ La pieza no está en la cola.</p>';
    const media = e.video_url
      ? `<video controls playsinline preload="none" poster="${esc(e.portada_url)}"><source src="${esc(e.video_url)}" type="video/mp4"></video>`
      : (e.datos?.imagenes ?? []).length
        ? `<div class="carrusel">${e.datos!.imagenes!.map((u) => `<img src="${esc(u)}" loading="lazy" alt="">`).join("")}</div>`
        : e.portada_url ? `<img src="${esc(e.portada_url)}" loading="lazy" alt="">` : "";
    return `<div class="pieza"><div class="media">${media}</div><div class="texto"><div class="estado ${esc(e.estado)}">${esc(e.estado)}</div><h3>${esc(e.titulo)}</h3><pre>${esc(e.texto)}</pre></div></div>`;
  };
  const dias = plan.map((d) => {
    const ref = d.tareas.find((t) => t.ref)?.ref;
    return `<section class="dia"><h2>${esc(nombre(d.f))} <small>${esc(d.titulo)}</small></h2><ul class="tareas">${d.tareas.map((t) => `<li>${ICO[t.tipo] ?? "•"} ${esc(t.detalle)}</li>`).join("")}</ul>${ref ? pieza(piezas[ref]) : ""}</section>`;
  }).join("\n");
  const historias = banco.map((h, i) => `<figure class="hist"><span class="n">${i + 1}</span>${h.video_url
    ? `<video controls playsinline preload="none"><source src="${esc(h.video_url)}" type="video/mp4"></video>`
    : `<img src="${esc(h.historia_url)}" loading="lazy" alt="">`}<figcaption>${esc(h.titulo)}</figcaption></figure>`).join("");
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Instagram · lo que va a salir</title>
<style>:root{--bg:#0b0614;--card:#160d24;--line:#2b1d40;--txt:#f1ecf8;--dim:#a99bbd;--acc:#b05cff}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px}main{max-width:980px;margin:0 auto}h1{font-size:26px;margin:8px 0 4px}p.sub{color:var(--dim);margin:0 0 24px}.dia{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;margin:0 0 18px}.dia h2{margin:0 0 8px;font-size:20px;text-transform:capitalize}.dia h2 small{color:var(--dim);font-weight:500;font-size:14px;text-transform:none;margin-left:6px}.tareas{margin:0 0 12px;padding-left:0;list-style:none;color:var(--dim);font-size:14px}.pieza{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:18px;align-items:start}.media video,.media img{width:100%;border-radius:14px;background:#000;display:block}.carrusel{display:flex;gap:8px;overflow-x:auto}.carrusel img{width:200px;flex:0 0 auto}.texto h3{margin:0 0 8px;font-size:17px}pre{white-space:pre-wrap;font:inherit;font-size:15px;margin:0;background:#0f0819;border:1px solid var(--line);border-radius:12px;padding:12px}.estado{display:inline-block;font-size:12px;padding:2px 10px;border-radius:99px;background:#2b1d40;color:var(--dim);margin-bottom:6px}.estado.publicado{background:#12c26b33;color:#5fe0a0}.aviso{color:#ffb4c4}.hists{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.hist{margin:0;position:relative}.hist video,.hist img{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:12px;background:#000;display:block}.hist figcaption{font-size:13px;color:var(--dim);margin-top:6px}.hist .n{position:absolute;top:8px;left:8px;background:var(--acc);color:#fff;border-radius:99px;font-size:12px;padding:1px 8px;z-index:1}@media(max-width:640px){.pieza{grid-template-columns:1fr}.media{max-width:280px}}</style></head><body><main>
<h1>Instagram: lo que va a salir</h1><p class="sub">En vivo desde el plan diario y la cola (${esc(new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }))}). Reels a las 21:00; historias a las 13:10 de los días que tocan.</p>
${dias || "<p>No hay nada planificado.</p>"}
<section class="dia"><h2>Banco de historias <small>salen en este orden</small></h2><div class="hists">${historias || "<p>Vacío.</p>"}</div></section></main></body></html>`;
}
