import "server-only";
// ESTADÍSTICAS DE INSTAGRAM para el Radar (17-11-2026, él: «entre Instagram y el Radar, la app definitiva»).
// Guarda en seo.ig_metricas cada publicación con sus números (las HISTORIAS solo dan datos 24 h: se fotografían
// cada noche para no perderlas) y monta un resumen: cuenta, publicaciones, evolución diaria y nuestra actividad.
// Lo sirve /api/ig/estadisticas (clave del Radar); n8n lo refresca cada noche a las 23:30.
import { sql } from "./db";

const IG = "https://graph.instagram.com/v23.0";
type Cred = { token: string; user_id: string };
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });

async function cred(): Promise<Cred | null> {
  const [r] = await sql<{ value: Cred }[]>`select value from seo.settings where key = 'ig_token'`;
  return r?.value?.token ? r.value : null;
}
const ig = async <T>(c: Cred, path: string): Promise<T> => {
  const r = await fetch(`${IG}/${path}${path.includes("?") ? "&" : "?"}access_token=${c.token}`, { signal: AbortSignal.timeout(20_000) });
  return (await r.json()) as T;
};

let creada = false;
async function tabla() {
  if (creada) return;
  await sql`create table if not exists seo.ig_metricas (
    id text primary key, tipo text not null, publicado_at timestamptz, datos jsonb not null default '{}', actualizado timestamptz not null default now())`;
  creada = true;
}

type Media = { id: string; media_type: string; media_product_type?: string; timestamp: string; caption?: string; permalink?: string; like_count?: number; comments_count?: number; thumbnail_url?: string; media_url?: string };
type Ins = { data?: { name: string; values?: { value: number }[]; total_value?: { value: number } }[]; error?: { message: string } };
const valores = (i: Ins) => Object.fromEntries((i.data ?? []).map((d) => [d.name, d.values?.[0]?.value ?? d.total_value?.value ?? 0]));

const METRICAS: Record<string, string> = {
  REELS: "views,reach,saved,shares,total_interactions,ig_reels_avg_watch_time,ig_reels_video_view_total_time",
  FEED: "views,reach,saved,shares,total_interactions",
  STORY: "views,reach,replies,shares,total_interactions,navigation",
};

/** Baja todo de Instagram y lo guarda (publicaciones + historias vivas + cuenta). */
export async function refrescar() {
  await tabla();
  const c = await cred();
  if (!c) throw new Error("Instagram no está conectado");
  const campos = "id,media_type,media_product_type,timestamp,caption,permalink,like_count,comments_count,thumbnail_url,media_url";
  // publicaciones (hasta 100)
  let lista: Media[] = [];
  let url: string | null = `me/media?fields=${campos}&limit=50`;
  for (let i = 0; i < 2 && url; i++) {
    const r: { data?: Media[]; paging?: { next?: string } } = await ig(c, url);
    lista = lista.concat(r.data ?? []);
    url = r.paging?.next ? r.paging.next.replace(/^https:\/\/graph\.instagram\.com\/v[\d.]+\//, "").replace(/&?access_token=[^&]+/, "") : null;
  }
  // historias vivas (solo duran 24 h: por eso se guardan)
  const st: { data?: Media[] } = await ig(c, `me/stories?fields=${campos}`);
  const historias = (st.data ?? []).map((m) => ({ ...m, media_product_type: "STORY" }));
  for (const m of [...lista, ...historias]) {
    const tipo = m.media_product_type === "STORY" ? "STORY" : m.media_product_type === "REELS" ? "REELS" : "FEED";
    const ins: Ins = await ig(c, `${m.id}/insights?metric=${METRICAS[tipo]}`);
    const v = valores(ins);
    const datos = {
      tipo: tipo === "FEED" ? (m.media_type === "CAROUSEL_ALBUM" ? "carrusel" : "imagen") : tipo === "REELS" ? "reel" : "historia",
      texto: (m.caption ?? "").slice(0, 600), enlace: m.permalink ?? null, miniatura: m.thumbnail_url ?? (m.media_type === "IMAGE" ? m.media_url : null) ?? null,
      likes: m.like_count ?? 0, comentarios: m.comments_count ?? 0,
      vistas: v.views ?? 0, alcance: v.reach ?? 0, guardados: v.saved ?? 0, compartidos: v.shares ?? 0, interacciones: v.total_interactions ?? 0,
      respuestas: v.replies ?? 0, retencionMs: v.ig_reels_avg_watch_time ?? null, tiempoTotalMs: v.ig_reels_video_view_total_time ?? null,
      error: ins.error?.message ?? null,
    };
    // si una historia ya caducó y no devuelve datos, se conserva la última foto buena
    await sql`insert into seo.ig_metricas (id, tipo, publicado_at, datos, actualizado) values (${m.id}, ${datos.tipo}, ${m.timestamp}, ${sql.json(datos as never)}, now())
      on conflict (id) do update set datos = case when excluded.datos->>'error' is not null and seo.ig_metricas.datos->>'error' is null then seo.ig_metricas.datos else excluded.datos end, actualizado = now()`;
  }
  // cuenta + evolución de 30 días
  const yo: { followers_count?: number; follows_count?: number; media_count?: number; username?: string } = await ig(c, "me?fields=followers_count,follows_count,media_count,username");
  const hasta = Math.floor(Date.now() / 1000), desde = hasta - 29 * 86400;
  const alc: { data?: { name: string; values?: { value: number; end_time: string }[] }[] } = await ig(c, `${c.user_id}/insights?metric=reach&period=day&since=${desde}&until=${hasta}`);
  const seg: { data?: { name: string; values?: { value: number; end_time: string }[] }[] } = await ig(c, `${c.user_id}/insights?metric=follower_count&period=day&since=${desde}&until=${hasta}`);
  const tot: Ins = await ig(c, `${c.user_id}/insights?metric=profile_views,website_clicks,accounts_engaged,total_interactions,views&period=day&metric_type=total_value&since=${desde}&until=${hasta}`);
  const dia = (x: { end_time: string }) => new Date(new Date(x.end_time).getTime() - 3600_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const cuenta = {
    usuario: yo.username, seguidores: yo.followers_count ?? 0, seguidos: yo.follows_count ?? 0, publicaciones: yo.media_count ?? 0,
    alcanceDiario: Object.fromEntries((alc.data?.[0]?.values ?? []).map((x) => [dia(x), x.value])),
    seguidoresNuevosDiario: Object.fromEntries((seg.data?.[0]?.values ?? []).map((x) => [dia(x), x.value])),
    totales30: valores(tot),
  };
  // seguidores de cada día (se guarda uno por día: la API no da el histórico)
  const [h] = await sql<{ value: Record<string, number> }[]>`select value from seo.settings where key = 'ig_seguidores'`;
  const hist = { ...(h?.value ?? {}), [hoy()]: cuenta.seguidores };
  await sql`insert into seo.settings (key, value) values ('ig_seguidores', ${sql.json(hist)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await sql`insert into seo.settings (key, value) values ('ig_cuenta', ${sql.json({ ...cuenta, generado: new Date().toISOString() } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return { publicaciones: lista.length, historias: historias.length };
}

/** El resumen que pinta el Radar. Refresca solo si lo guardado tiene más de 2 horas (o si se pide). */
export async function estadisticas(forzar = false) {
  await tabla();
  const [cu] = await sql<{ value: Record<string, unknown> & { generado?: string } }[]>`select value from seo.settings where key = 'ig_cuenta'`;
  if (forzar || !cu?.value?.generado || Date.now() - Date.parse(cu.value.generado) > 2 * 3600_000) await refrescar();
  const [cuenta] = await sql<{ value: Record<string, unknown> }[]>`select value from seo.settings where key = 'ig_cuenta'`;
  const [hist] = await sql<{ value: Record<string, number> }[]>`select value from seo.settings where key = 'ig_seguidores'`;
  const medias = await sql<{ id: string; tipo: string; publicado_at: Date; datos: Record<string, unknown> }[]>`select id, tipo, publicado_at, datos from seo.ig_metricas order by publicado_at desc`;
  // nuestra actividad (seguir, comentar, me gusta) por día
  const acc = await sql<{ fecha: string; tipo: string; n: number }[]>`select fecha::text, tipo, count(*)::int n from seo.ig_acciones
    where fecha > current_date - 60 and tipo in ('seguir', 'comentar', 'megusta', 'responder') group by 1, 2 order by 1`;
  return {
    cuenta: cuenta?.value ?? null,
    seguidoresHistorico: hist?.value ?? {},
    publicaciones: medias.map((m) => ({ id: m.id, tipo: m.tipo, fecha: m.publicado_at.toISOString(), ...m.datos })),
    actividad: acc,
  };
}

/**
 * Lo aprendido de las publicaciones (cada domingo, en el programa de la semana): mejor franja horaria, mejor día,
 * qué tipo funciona y qué hashtags acompañan a las publicaciones con más visualizaciones. Se guarda en
 * seo.settings «ig_aprendizaje» para preparar las siguientes (hashtags y horas). Con pocos datos, son pistas.
 */
export async function aprendizaje(): Promise<string[]> {
  await refrescar().catch((e) => console.error("estadísticas", e));
  const pubs = await sql<{ tipo: string; publicado_at: Date; datos: { vistas?: number; texto?: string } }[]>`select tipo, publicado_at, datos from seo.ig_metricas where tipo <> 'historia'`;
  if (pubs.length < 3) return [];
  const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const hora = (d: Date) => Number(d.toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).slice(11, 13));
  const franja = (h: number) => (h < 12 ? "mañana" : h < 15 ? "mediodía" : h < 19 ? "tarde" : "noche");
  const grupo = <K extends string>(clave: (p: (typeof pubs)[number]) => K) => {
    const m = new Map<K, number[]>();
    for (const p of pubs) m.set(clave(p), [...(m.get(clave(p)) ?? []), p.datos.vistas ?? 0]);
    return [...m.entries()].map(([k, v]) => ({ k, media: media(v), n: v.length })).sort((a, b) => b.media - a.media);
  };
  const franjas = grupo((p) => franja(hora(p.publicado_at)));
  const dias = grupo((p) => ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][new Date(p.publicado_at.toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).replace(" ", "T")).getDay()]);
  const tipos = grupo((p) => p.tipo);
  const tags = new Map<string, number[]>();
  for (const p of pubs) for (const t of new Set((p.datos.texto ?? "").toLowerCase().match(/#[\p{L}\p{N}_]+/gu) ?? [])) tags.set(t, [...(tags.get(t) ?? []), p.datos.vistas ?? 0]);
  const topTags = [...tags.entries()].filter(([t]) => t !== "#publi" && t !== "#tuerqui").map(([t, v]) => ({ t, media: media(v), n: v.length })).sort((a, b) => b.media - a.media).slice(0, 6);
  await sql`insert into seo.settings (key, value) values ('ig_aprendizaje', ${sql.json({ franjas, dias, tipos, hashtags: topTags, publicaciones: pubs.length, generado: new Date().toISOString() } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const r = (x: { media: number }) => Math.round(x.media);
  const l: string[] = [];
  if (franjas.length > 1) l.push(`🕘 Mejor franja: <b>${franjas[0].k}</b> (${r(franjas[0])} visualizaciones de media) · peor: ${franjas.at(-1)!.k} (${r(franjas.at(-1)!)})`);
  if (dias.length > 1) l.push(`📆 Mejor día: <b>${dias[0].k}</b> (${r(dias[0])})`);
  if (tipos.length > 1) l.push(`🎞 Lo que más se ve: <b>${tipos[0].k}</b> (${r(tipos[0])})`);
  if (topTags.length) l.push(`#️⃣ Hashtags que mejor van: ${topTags.slice(0, 5).map((x) => `${x.t} (${r(x)})`).join(" · ")}`);
  l.push(`Con ${pubs.length} publicaciones: son pistas, se afinan cada semana.`);
  return l;
}
