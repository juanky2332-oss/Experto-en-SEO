import "server-only";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { revisarTexto } from "@/lib/ig-calidad";

// Instagram: reels y carruseles de la fábrica de vídeos, historias (/api/ig/historia) y noticias del blog (publicación 4:5 + historia 9:16).
// Antes de subir cualquier cosa pasa el control de calidad (src/lib/ig-calidad.ts): reglas de marca y que no repita las últimas.
// Nada se sube sin que él diga que sí: todo entra en seo.ig_cola, se le propone por Telegram
// (vídeo o enlaces + texto) con «✅ Subir a Instagram» / «❌ No subir», y al pulsar se publica por la API.
// Las imágenes de noticias las genera /api/ig/tarjeta y los reels se sirven desde demo.transformaconia.com/ig/
// (públicos: Instagram tiene que poder descargarlos).
// Credencial (API de Instagram con inicio de sesión de Instagram): seo.settings 'ig_token' {token, user_id, renovado}
// o, si no está, IG_TOKEN + IG_USER_ID en Vercel. El token dura 60 días: el cron lo renueva cada semana.

const WEB = "https://transformaconia.com";
const IG = "https://graph.instagram.com/v21.0";

export type Articulo = { id: number; titulo: string; extracto: string; url: string; categoria: string; categoriaSlug: string; imagen: string | null; fecha: string };

const limpia = (h: string) =>
  h.replace(/<[^>]+>/g, " ").replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, "\"").replace(/&#8211;|&#8212;/g, "-").replace(/&hellip;|&#8230;/g, "…").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ").replace(/&#\d+;/g, "").replace(/\s+/g, " ").trim();

type WpPost = { id: number; date: string; link: string; title: { rendered: string }; excerpt: { rendered: string }; _embedded?: { "wp:featuredmedia"?: { source_url?: string }[]; "wp:term"?: { name: string; slug: string; taxonomy: string }[][] } };

const aArticulo = (p: WpPost): Articulo => {
  const cat = (p._embedded?.["wp:term"] ?? []).flat().find((t) => t.taxonomy === "category");
  return {
    id: p.id, titulo: limpia(p.title.rendered), extracto: limpia(p.excerpt.rendered), url: p.link, fecha: p.date,
    categoria: cat ? limpia(cat.name) : "Blog", categoriaSlug: cat?.slug ?? "blog",
    imagen: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url ?? null,
  };
};

export async function articulo(id: number): Promise<Articulo | null> {
  const r = await fetch(`${WEB}/wp-json/wp/v2/posts/${id}?_embed=wp:featuredmedia,wp:term`, { next: { revalidate: 300 } });
  if (!r.ok) return null;
  return aArticulo(await r.json());
}

export async function recientes(dias = 3): Promise<Articulo[]> {
  const desde = new Date(Date.now() - dias * 86400_000).toISOString().slice(0, 19);
  const r = await fetch(`${WEB}/wp-json/wp/v2/posts?per_page=10&after=${desde}&_embed=wp:featuredmedia,wp:term`, { cache: "no-store" });
  if (!r.ok) return [];
  return ((await r.json()) as WpPost[]).map(aArticulo);
}

const HASHTAGS: Record<string, string> = {
  "ia-en-la-industria": "#industria #inteligenciaartificial #automatizacion #murcia #pymes",
  "gestion-y-facturacion": "#gestion #facturacion #pymes #inteligenciaartificial #murcia",
  "actualidad-ia": "#inteligenciaartificial #ia #noticiasIA #tecnologia #empresas",
};

/** Texto de la publicación: gancho, resumen corto, a dónde ir y 5 hashtags. Termina en espacio para que no se autocomplete el último hashtag. */
export function textoInstagram(a: Articulo) {
  const resumen = a.extracto.length > 280 ? a.extracto.slice(0, 277).replace(/\s+\S*$/, "") + "…" : a.extracto;
  return `📰 ${a.titulo}\n\n${resumen}\n\n👉 Lo tienes completo en el blog de transformaconia.com (enlace en el perfil).\n\n${HASHTAGS[a.categoriaSlug] ?? HASHTAGS["actualidad-ia"]} `;
}

export const urlTarjeta = (base: string, id: number, formato: "post" | "story") => `${base}/api/ig/tarjeta?id=${id}&f=${formato}`;

// ---------------------------------------------------------------- credencial
type Cred = { token: string; user_id: string; renovado?: string };

async function credencial(): Promise<Cred | null> {
  const [r] = await sql<{ value: Cred }[]>`select value from seo.settings where key = 'ig_token'`;
  if (r?.value?.token && r.value.user_id) return r.value;
  if (process.env.IG_TOKEN && process.env.IG_USER_ID) return { token: process.env.IG_TOKEN, user_id: process.env.IG_USER_ID };
  return null;
}

export const instagramConectado = async () => !!(await credencial());

/** Renueva el token guardado en la base si tiene más de 7 días (los de larga duración caducan a los 60). */
export async function renovarToken() {
  const [r] = await sql<{ value: Cred }[]>`select value from seo.settings where key = 'ig_token'`;
  const c = r?.value;
  if (!c?.token || (c.renovado && Date.now() - Date.parse(c.renovado) < 7 * 86400_000)) return false;
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${c.token}`);
  const j = (await res.json().catch(() => ({}))) as { access_token?: string; error?: { message?: string } };
  if (!j.access_token) {
    await telegram(`⚠️ No he podido renovar el permiso de Instagram: ${esc(j.error?.message ?? res.status)}. Si caduca, los reels dejarán de subirse solos.`);
    return false;
  }
  await sql`update seo.settings set value = ${sql.json({ ...c, token: j.access_token, renovado: new Date().toISOString() })}, updated_at = now() where key = 'ig_token'`;
  return true;
}

// ---------------------------------------------------------------- API de Instagram
async function igPost(c: Cred, path: string, params: Record<string, string>) {
  const r = await fetch(`${IG}/${path}`, { method: "POST", body: new URLSearchParams({ ...params, access_token: c.token }) });
  const j = (await r.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!r.ok || !j.id) throw new Error(`Instagram ${path}: ${j.error?.message ?? r.status}`);
  return j.id;
}

/** Crea el contenedor, espera a que Instagram lo procese (un reel tarda de 30 s a un par de minutos) y lo publica. */
async function publicarEnInstagram(c: Cred, params: Record<string, string>, esperaMax = 20_000) {
  const contenedor = await igPost(c, `${c.user_id}/media`, params);
  const fin = Date.now() + esperaMax;
  let estado = "";
  while (Date.now() < fin) {
    await new Promise((x) => setTimeout(x, 4000));
    const r = await fetch(`${IG}/${contenedor}?fields=status_code,status&access_token=${c.token}`);
    const j = (await r.json().catch(() => ({}))) as { status_code?: string; status?: string };
    estado = j.status_code ?? "";
    if (estado === "FINISHED") break;
    if (estado === "ERROR") throw new Error(`Instagram no ha podido procesar el archivo (${j.status ?? "sin detalle"})`);
  }
  if (estado !== "FINISHED") throw new Error("Instagram sigue procesando el archivo; vuelve a pulsar «Subir» en un par de minutos");
  const id = await igPost(c, `${c.user_id}/media_publish`, { creation_id: contenedor });
  const p = (await fetch(`${IG}/${id}?fields=permalink&access_token=${c.token}`).then((r) => r.json()).catch(() => ({}))) as { permalink?: string };
  return { id, url: p.permalink ?? null };
}

// ---------------------------------------------------------------- cola
export type ElementoCola = {
  id: string; tipo: "reel" | "noticia" | "carrusel" | "historia"; titulo: string; texto: string; video_url: string | null; portada_url: string | null; historia_url: string | null;
  fecha: string | null; estado: string; ig_url: string | null; datos: { imagenes?: string[] } | null;
};

/** Los textos de las últimas publicaciones del perfil (para que el editor no repita). */
async function ultimosTextos(c: Cred, n = 8) {
  const r = (await fetch(`${IG}/${c.user_id}/media?fields=caption&limit=${n}&access_token=${c.token}`).then((x) => x.json()).catch(() => ({}))) as { data?: { caption?: string }[] };
  return (r.data ?? []).map((m) => m.caption ?? "").filter(Boolean);
}

const botones = (id: string) => [{ text: "✅ Subir a Instagram", data: `app:igsi:${id}` }, { text: "❌ No subir", data: `app:igno:${id}` }];

const AVISO_SIN_TOKEN = "\n\n<i>⚠️ Instagram aún no está conectado: si pulsas «Subir» te digo cómo conectarlo (5 minutos, una sola vez).</i>";

/** Le manda a Telegram el elemento (el vídeo si es un reel) con los botones para subirlo. */
export async function proponer(e: ElementoCola) {
  const aviso = (await credencial()) ? "" : AVISO_SIN_TOKEN;
  let r: { ok: boolean };
  if (e.tipo === "reel" && e.video_url) {
    const cab = `🎬 <b>Reel: ${esc(e.titulo)}</b>${e.fecha ? ` (previsto el ${new Date(e.fecha).toLocaleDateString("es-ES", { day: "numeric", month: "long", timeZone: "UTC" })})` : ""}\n\n`;
    const pie = aviso || "\n\n¿Lo subo?";
    // se recorta el texto ANTES de escapar (cortar el HTML podría dejar una entidad a medias); el escape puede alargarlo un poco: margen de 60
    const max = 1024 - cab.length - pie.length - 60;
    const t = e.texto.trim();
    r = await telegram(cab + esc(t.length > max ? t.slice(0, max - 1) + "…" : t) + pie, botones(e.id), e.video_url);
    // si el vídeo no ha llegado (más de 20 MB, enlace caído…), al menos el texto con el enlace
    if (!r.ok) r = await telegram(`${cab}${esc(e.texto)}\n\nVídeo: ${e.video_url}${pie}`, botones(e.id));
  } else {
    r = await telegram(
      `📲 <b>Noticia del blog para Instagram</b>\n${esc(e.titulo)}\n\n<b>Publicación:</b> ${e.portada_url}\n<b>Historia:</b> ${e.historia_url}\n\n<b>Texto:</b>\n${esc(e.texto.slice(0, 2500))}${aviso || "\n\n¿La subo (publicación + historia)?"}`,
      botones(e.id),
    );
  }
  // solo cuenta como propuesto si le ha llegado: si Telegram falla, sigue pendiente y se vuelve a intentar
  if (!r.ok) throw new Error("Telegram no ha aceptado el mensaje");
  await sql`update seo.ig_cola set estado = 'propuesto', propuesto_at = now() where id = ${e.id} and estado in ('pendiente', 'propuesto')`;
}

/** El siguiente reel sin subir (el de fecha más temprana primero). */
export async function siguienteReel() {
  const [e] = await sql<ElementoCola[]>`select * from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto') order by fecha nulls last, id limit 1`;
  return e ?? null;
}

export async function colaReels() {
  return sql<ElementoCola[]>`select * from seo.ig_cola where tipo in ('reel', 'carrusel') order by fecha nulls last, id`;
}

/** Cron (días sin plan): propone los reels previstos para hoy. */
export async function proponerDeHoy() {
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const l = await sql<ElementoCola[]>`select * from seo.ig_cola where tipo = 'reel' and estado = 'pendiente' and fecha = ${hoy} order by fecha limit 2`;
  for (const e of l) await proponer(e);
  return l.length;
}

export const INSTRUCCIONES = `🔌 <b>Falta conectar Instagram</b> (una sola vez, 5 minutos)\n\n1. En el ordenador, abre developers.facebook.com en la ventana de Chrome que uso yo y entra con tu Facebook (si te pide registrarte como desarrollador, acepta).\n2. Dímelo en Claude Code: creo la app, la conecto con @transformaconia.oficial y guardo el permiso.\n\nDesde ese momento, al pulsar «✅ Subir» se publica solo. Mientras tanto, lo puedes subir a mano con el vídeo y el texto de arriba.`;

/** «✅ Subir a Instagram»: publica el elemento. Devuelve el texto para Telegram. */
export async function subir(id: string): Promise<string> {
  const c = await credencial();
  if (!c) return INSTRUCCIONES;
  // reclamo atómico (evita el doble clic); un 'publicando' de más de 6 minutos es que la función murió a medias: se puede reintentar
  const [e] = await sql<ElementoCola[]>`update seo.ig_cola set estado = 'publicando', publicando_at = now(), error = null
    where id = ${id} and (estado in ('pendiente', 'propuesto') or (estado = 'publicando' and publicando_at < now() - interval '6 minutes')) returning *`;
  if (!e) {
    const [x] = await sql<ElementoCola[]>`select * from seo.ig_cola where id = ${id}`;
    if (!x) return "No encuentro ese elemento.";
    if (x.estado === "publicado") return `Ya estaba subido: ${x.ig_url ?? ""}`;
    if (x.estado === "publicando") return "Ya lo estoy subiendo, espera un momento.";
    return "Ese lo descartaste. Si al final lo quieres, escribe /reels.";
  }
  let r: { id: string; url: string | null };
  let extra = "";
  // control de calidad: reglas de marca (si no las cumple, no se sube) y que no repita las últimas publicaciones
  if (e.tipo !== "historia") {
    const rev = await revisarTexto(e.texto, e.tipo, await ultimosTextos(c));
    if (!rev.ok) {
      await sql`update seo.ig_cola set estado = 'propuesto', error = ${"Control de calidad: " + rev.problemas.join("; ")} where id = ${id}`;
      return `🛑 <b>No he subido «${esc(e.titulo)}»</b>: no pasa el control de calidad.\n${rev.problemas.map((x) => "• " + esc(x)).join("\n")}\nLo corrijo en cuanto abras Claude Code.`;
    }
    if (rev.texto !== e.texto) {
      e.texto = rev.texto;
      await sql`update seo.ig_cola set texto = ${rev.texto} where id = ${id}`;
      if (rev.cambios.length) extra += ` · texto retocado para no repetir (${esc(rev.cambios[0])})`;
    }
  }
  try {
    if (e.tipo === "reel") {
      r = await publicarEnInstagram(c, { media_type: "REELS", video_url: e.video_url!, ...(e.portada_url ? { cover_url: e.portada_url } : {}), caption: e.texto, share_to_feed: "true" }, 240_000);
    } else if (e.tipo === "carrusel") {
      const imgs = e.datos?.imagenes ?? [];
      if (imgs.length < 2 || imgs.length > 10) throw new Error(`un carrusel lleva de 2 a 10 imágenes (tiene ${imgs.length})`);
      const hijos: string[] = [];
      for (const url of imgs) hijos.push(await igPost(c, `${c.user_id}/media`, { image_url: url, is_carousel_item: "true" }));
      r = await publicarEnInstagram(c, { media_type: "CAROUSEL", children: hijos.join(","), caption: e.texto }, 60_000);
    } else if (e.tipo === "historia") {
      r = await publicarEnInstagram(c, { media_type: "STORIES", image_url: e.historia_url! });
    } else {
      r = await publicarEnInstagram(c, { image_url: e.portada_url!, caption: e.texto });
    }
  } catch (err) {
    await sql`update seo.ig_cola set estado = 'propuesto', error = ${(err as Error).message} where id = ${id}`;
    return `⚠️ No he podido subir «${esc(e.titulo)}»: ${esc((err as Error).message)}`;
  }
  // ya está en Instagram: pase lo que pase a partir de aquí, no vuelve a 'propuesto' (se duplicaría al pulsar otra vez)
  await sql`update seo.ig_cola set estado = 'publicado', ig_id = ${r.id}, ig_url = ${r.url}, publicado_at = now() where id = ${id}`.catch((err) => console.error("ig_cola publicado", err));
  if (e.tipo === "noticia" && e.historia_url) {
    try {
      await publicarEnInstagram(c, { image_url: e.historia_url, media_type: "STORIES" });
      extra = " · Historia ✅";
    } catch (err) {
      extra = ` · Historia ❌ (${esc((err as Error).message)})`;
    }
  }
  if (e.tipo === "historia") return `✅ Historia: ${esc(e.titulo)}`;
  const [q] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto')`.catch(() => [{ n: 0 }]);
  return `✅ <b>Subido a Instagram</b>: ${esc(e.titulo)}${extra}\n${r.url ?? ""}${e.tipo === "reel" || e.tipo === "carrusel" ? `\n\nQuedan ${q.n} publicaciones en la cola (/reel para ver la siguiente).` : ""}`;
}

export async function descartar(id: string) {
  const [e] = await sql<{ titulo: string }[]>`update seo.ig_cola set estado = 'descartado' where id = ${id} and estado in ('pendiente', 'propuesto') returning titulo`;
  return e ? `De acuerdo, «${esc(e.titulo)}» no se sube.` : "Ese ya no estaba pendiente.";
}

/** /reels → vuelve a poner en la cola uno descartado. */
export async function recuperar(id: string) {
  const [e] = await sql<{ titulo: string }[]>`update seo.ig_cola set estado = 'pendiente' where id = ${id} and estado = 'descartado' returning titulo`;
  return !!e;
}

// ---------------------------------------------------------------- noticias del blog
/** Mete la noticia en la cola y se la propone por Telegram. */
export async function compartir(a: Articulo, base: string) {
  const id = `blog-${a.id}`;
  const [e] = await sql<ElementoCola[]>`insert into seo.ig_cola (id, tipo, titulo, texto, portada_url, historia_url)
    values (${id}, 'noticia', ${a.titulo}, ${textoInstagram(a)}, ${urlTarjeta(base, a.id, "post")}, ${urlTarjeta(base, a.id, "story")})
    on conflict (id) do update set estado = case when seo.ig_cola.estado in ('publicado', 'publicando', 'descartado') then seo.ig_cola.estado else 'pendiente' end
    returning *`;
  if (e.estado === "publicado" || e.estado === "publicando" || e.estado === "descartado") return { id, estado: e.estado };
  // con Instagram conectado se publica sola (decidido el 26-10-2026: «hazlo tú y dame el informe»); sin conectar, se propone
  if (await credencial()) {
    const r = await subir(id);
    await telegram(`📰 ${r}`);
    if (!r.startsWith("✅")) throw new Error("no se ha podido publicar"); // así compartirNuevos lo reintenta mañana
    return { id, estado: "publicado" };
  }
  await proponer(e);
  return { id, estado: "propuesto" };
}

/** Propone los artículos de los últimos días que aún no se han llevado a Instagram. */
export async function compartirNuevos(base: string) {
  const [r] = await sql<{ value: number[] }[]>`select value from seo.settings where key = 'ig_compartidos'`;
  const hechos = new Set(r?.value ?? []);
  const nuevos = (await recientes(3)).filter((a) => !hechos.has(a.id)).slice(0, 2);
  const resultado = [];
  for (const a of nuevos) {
    try {
      resultado.push(await compartir(a, base));
      hechos.add(a.id);
    } catch (e) {
      console.error("compartir", a.id, e);
      await telegram(`⚠️ No he podido preparar para Instagram «${esc(a.titulo)}»: ${esc((e as Error).message)}`);
    }
  }
  const lista = [...hechos].slice(-200);
  await sql`insert into seo.settings (key, value) values ('ig_compartidos', ${sql.json(lista as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return resultado;
}
