import "server-only";
// «Dame una idea»: UNA publicación para AHORA, sin programar nada para más adelante.
//   1) idea = la recomendación de artículo con más prioridad (el estratega ya cruza la web, la guía,
//      las visitas, Search Console y el radar) y, al momento, su brief: cómo quedará (titular,
//      palabras clave, secciones y listón SEO). Llega a Telegram y al panel a la vez.
//   2) «✍️ Redactar y publicar ahora» (panel o Telegram) = se redacta y se PUBLICA en la web.
//      Solo si el control de calidad lo frena queda en borrador, con «🚀 Publicar ahora».
// El brief se enlaza a la idea en n8n (Guardar brief usa rec_id), así panel y Telegram ven lo mismo.
import { sql } from "../db";
import { publicador, lanzarRadar } from "../gateway";
import { editar, type Origen } from "../acciones";
import { ahoraWp } from "../wp";
import { generarQuePublicar } from "./generar";
import { rec as leerRec, type Rec } from "./datos";

export type Propuesta = {
  titular: string; resumen_linea: string; keyword_principal: string; keywords_secundarias: string[]; preguntas: string[];
  interes: number; motivo: string; categoria: string; publico: string; canibaliza?: { post_id: number; titulo: string } | null;
};
export type EstadoBrief = { id: string; status: string; post_id: number | null; post_url: string | null; seo_score: number | null; error: string | null; propuesta: Propuesta | null };
export type Otra = { id: number; titulo: string; keyword: string; pilar: string | null; noticia: boolean };
export type Idea = { rec: Rec; brief: EstadoBrief | null; desde: string; atascada: boolean; otras: Otra[] };

const CLAVE = "idea_actual";

async function guardar(recId: number | string | null) {
  await sql`insert into seo.settings (key, value) values (${CLAVE}, ${sql.json({ rec_id: recId, desde: new Date().toISOString() } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/** La idea que se está viendo ahora, con su brief (cómo quedará) y en qué punto está. */
export async function ideaActual(): Promise<Idea | null> {
  const [fila] = await sql<{ value: { rec_id: number | null; desde: string } }[]>`select value from seo.settings where key = ${CLAVE}`;
  if (!fila?.value?.rec_id) return null;
  const r = await leerRec(fila.value.rec_id);
  if (!r) return null;
  const [b] = r.brief_id
    ? await sql<EstadoBrief[]>`select id, status, post_id, post_url, seo_score, error,
        jsonb_build_object('titular', brief->'titular', 'resumen_linea', brief->'resumen_linea', 'keyword_principal', brief->'keyword_principal',
          'keywords_secundarias', coalesce(brief->'keywords_secundarias', '[]'), 'preguntas', coalesce(brief->'preguntas', '[]'), 'interes', brief->'interes',
          'motivo', brief->'motivo', 'categoria', brief->'categoria', 'publico', brief->'publico', 'canibaliza', brief->'canibaliza') as propuesta
        from seo.briefs where id = ${r.brief_id}::uuid`
    : [];
  // pedida hace más de 10 minutos y sin brief = algo se quedó a medias: se ofrece pedir otra
  const atascada = r.estado === "en_brief" && !b && Date.now() - new Date(fila.value.desde).getTime() > 10 * 60 * 1000;
  return { rec: r, brief: b ?? null, desde: fila.value.desde, atascada, otras: await otrasIdeas(r.id) };
}

/** Las 5 siguientes mejores ideas de artículo (para elegir otra sin volver a pedir). */
export async function otrasIdeas(salvo: number | string): Promise<Otra[]> {
  const f = await sql<{ id: number; titulo: string; keyword: string; pilar: string | null; radar_id: number | null }[]>`
    select id, titulo, keyword, pilar, radar_id from seo.qp_recs where estado = 'abierta' and destino = 'articulo' and id <> ${String(salvo)}::bigint
    order by prioridad desc, id limit 5`;
  return f.map((x) => ({ id: Number(x.id), titulo: x.titulo, keyword: x.keyword, pilar: x.pilar, noticia: !!x.radar_id }));
}

/**
 * Noticias frescas al pedir una idea: si la última búsqueda tiene más de 18 h, lanza el radar ahora
 * (manual: funciona aunque la búsqueda diaria esté apagada) y espera a que termine (máx. ~3 min).
 */
export async function asegurarNoticias(): Promise<"recientes" | "buscadas" | "sin_respuesta"> {
  const hora = async () => {
    const [e] = await sql<{ h: string | null }[]>`select value->>'hora' h from seo.settings where key = 'radar_estado'`;
    return e?.h ? Date.parse(e.h) : 0;
  };
  const antes = await hora();
  if (Date.now() - antes < 18 * 3600 * 1000) return "recientes";
  await lanzarRadar();
  const inicio = Date.now();
  // el radar marca su hora al empezar; se espera a que deje de entrar material nuevo
  let ultimo = -1, quietos = 0;
  while (Date.now() - inicio < 180_000) {
    await new Promise((r) => setTimeout(r, 10_000));
    if ((await hora()) <= antes) continue;
    const [c] = await sql<{ n: number }[]>`select count(*)::int n from seo.radar where created_at > to_timestamp(${inicio / 1000})`;
    if (c.n > 0 && c.n === ultimo) { if (++quietos >= 2) return "buscadas"; } else quietos = 0;
    ultimo = c.n;
  }
  return ultimo > 0 ? "buscadas" : "sin_respuesta";
}

const candidata = async (saltar: (number | string)[]) =>
  (await sql<{ id: string }[]>`select id from seo.qp_recs where estado = 'abierta' and destino = 'articulo'
    and not (id = any(${saltar.map(String)}::bigint[])) order by prioridad desc, id limit 1`)[0]?.id ?? null;

/**
 * Una idea nueva para publicar ya, y su brief en marcha (llega a Telegram y al panel en ~1 minuto).
 * La de antes, si no se llegó a redactar, queda «saltada» (o «no interesa», que sí enseña al estratega)
 * y su brief pendiente se descarta.
 */
export async function darIdea(o: { origin: Origen; descartarActual?: "saltada" | "no_interesa"; recId?: number | string; conNoticias?: boolean }) {
  const actual = await ideaActual();
  const sinRedactar = actual && (!actual.brief || actual.brief.status === "pending" || actual.brief.status === "rejected");
  if (actual && sinRedactar && actual.rec.estado !== "publicada") {
    if (o.descartarActual === "no_interesa") {
      const { votar } = await import("./datos");
      await votar(actual.rec.id, "no_interesa", o.origin);
    } else await sql`update seo.qp_recs set estado = 'saltada' where id = ${actual.rec.id} and estado in ('abierta', 'interesa', 'en_brief')`;
    if (actual.brief?.status === "pending") await publicador({ action: "reject", brief_id: actual.brief.id }).catch(() => null);
  }
  const saltar = actual ? [actual.rec.id] : [];
  let id: string | null = null;
  if (o.recId) {
    // elegida de entre las «otras 5»
    const [x] = await sql<{ id: string }[]>`select id from seo.qp_recs where id = ${String(o.recId)}::bigint and estado = 'abierta'`;
    id = x?.id ?? null;
    if (!id) throw new Error("Esa idea ya no está disponible. Pide ideas otra vez.");
  } else {
    // noticias frescas (si las de ayer ya están, no se vuelve a buscar) y después el estratega
    if (o.conNoticias !== false) await asegurarNoticias().catch((e) => console.error("radar", e));
    // 0 € si nada ha cambiado desde el último lote (reutiliza los candidatos)
    await generarQuePublicar({ origin: o.origin });
    id = await candidata(saltar);
  }
  if (!id) {
    await generarQuePublicar({ origin: o.origin, forzar: true }); // temas nuevos (~0,03 €)
    id = await candidata(saltar);
  }
  if (!id) throw new Error("Ahora mismo no encuentro un tema que no hayas visto ya. Prueba a cambiar los temas preferidos.");
  // se reclama de forma atómica (dos clics no lanzan dos briefs)
  const [r] = await sql<Rec[]>`update seo.qp_recs set estado = 'en_brief' where id = ${id} and estado = 'abierta'
    returning id, keyword, secundarias, intencion, publico, pilar, destino, destino_ref, enlaces, cta, titulo, tipo, radar_id`;
  if (!r) throw new Error("Esa idea la acaba de coger otra petición. Vuelve a pulsar.");
  await guardar(r.id);
  // Si nace de una noticia, el redactor la recibe entera (titular, fuente, enlace y resumen) para basarse en ella y citarla.
  const [n] = r.radar_id
    ? await sql<{ title: string; source: string; url: string; resumen: string | null; snippet: string | null; published_at: Date | null }[]>`
        select title, source, url, resumen, snippet, published_at from seo.radar where id = ${r.radar_id}`
    : [];
  if (n) await sql`update seo.radar set status = 'seen' where id = ${r.radar_id} and status = 'new'`;
  const notas = n
    ? `ARTÍCULO A PARTIR DE UNA NOTICIA RECIENTE. Noticia: «${n.title}» (${n.source}${n.published_at ? `, ${n.published_at.toISOString().slice(0, 10)}` : ""}). Enlace: ${n.url}. Resumen: ${(n.resumen || n.snippet || "").slice(0, 600)}. Explica qué ha pasado con datos solo de la noticia, qué significa para una empresa industrial española o de Murcia y qué puede hacer ya; cita y enlaza la fuente; nada inventado.`
    : undefined;
  try {
    await publicador({
      action: "brief_pista", rec_id: Number(r.id),
      pista: {
        keyword: r.keyword, secundarias: r.secundarias, intencion: r.intencion, publico: r.publico, pilar: r.pilar, categoria: r.pilar,
        destino: r.destino, destino_ref: r.destino_ref, enlaces: r.enlaces, cta: r.cta, titulo: r.titulo, tipo: r.tipo, notas,
      },
    });
  } catch (e) {
    await sql`update seo.qp_recs set estado = 'abierta' where id = ${r.id} and brief_id is null`;
    throw e;
  }
  return r.id;
}

/** «✍️ Redactar y publicar ahora»: el mismo botón que el de Telegram (se redacta y se publica). */
export async function redactarIdea(recId: number | string) {
  const i = await ideaActual();
  if (!i || String(i.rec.id) !== String(recId)) throw new Error("Esa idea ya no es la actual");
  if (!i.brief) throw new Error("La propuesta aún se está preparando; en un minuto aparece aquí y en Telegram");
  if (i.brief.status !== "pending") throw new Error(i.brief.status === "generating" ? "Ya se está redactando" : "Esta idea ya no se puede redactar");
  await publicador({ action: "publish", brief_id: i.brief.id });
}

/** «🚀 Publicar ahora» cuando el control de calidad la dejó en borrador. */
export async function publicarIdea(recId: number | string, origin: Origen) {
  const i = await ideaActual();
  if (!i || String(i.rec.id) !== String(recId) || !i.brief?.post_id) throw new Error("Esta idea aún no tiene artículo");
  if (i.brief.status !== "draft") throw new Error("Este artículo ya no está en borrador");
  await editar(i.brief.post_id, { status: "publish", date: ahoraWp() }, { origin, tipo: "post", motivo: "Publicado desde «Dame una idea»" });
  await sql`update seo.qp_recs set estado = 'publicada' where id = ${recId}`;
  await sql`update seo.briefs set status = 'published', updated_at = now() where id = ${i.brief.id}::uuid`;
  return i.brief.post_id;
}

/** Cierra la tarjeta de la idea (lo publicado o en borrador sigue en WordPress, en Artículos). */
export async function cerrarIdea() {
  await guardar(null);
}

/** Un borrador de una idea que se publica desde otro sitio (editor, Telegram): panel al día. */
export async function marcarIdeaPublicada(postId: number) {
  await sql`update seo.briefs set status = 'published', updated_at = now() where post_id = ${postId} and status = 'draft'`;
  await sql`update seo.qp_recs set estado = 'publicada' where brief_id in (select id from seo.briefs where post_id = ${postId})`;
}
