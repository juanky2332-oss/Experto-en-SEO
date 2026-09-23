import "server-only";
import { wp } from "./gateway";

export const SITE = process.env.WP_BASE ?? "https://transformaconia.com";

export type SeoMeta = {
  rank_math_title?: string;
  rank_math_description?: string;
  rank_math_focus_keyword?: string;
  rank_math_canonical_url?: string;
  rank_math_facebook_title?: string;
  rank_math_facebook_description?: string;
  rank_math_pillar_content?: string;
};

export type Entrada = {
  id: number;
  type: "post" | "page";
  status: "publish" | "draft" | "pending" | "future" | "private" | "trash";
  date: string;
  modified: string;
  slug: string;
  link: string;
  title: string;
  content: string;
  excerpt: string;
  categories: number[];
  tags: number[];
  featured_media: number;
  meta: SeoMeta;
};

type Raw = {
  id: number; type: string; status: Entrada["status"]; date: string; modified: string; slug: string; link: string;
  title: { raw?: string; rendered: string }; content: { raw?: string; rendered: string }; excerpt: { raw?: string; rendered: string };
  categories?: number[]; tags?: number[]; featured_media: number; meta?: SeoMeta;
};

export const decode = (s: string) =>
  String(s ?? "")
    .replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;/g, "–").replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…").replace(/&#171;/g, "«").replace(/&#187;/g, "»").replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&amp;/g, "&");

const norm = (r: Raw): Entrada => ({
  id: r.id,
  type: r.type === "page" ? "page" : "post",
  status: r.status,
  date: r.date,
  modified: r.modified,
  slug: r.slug,
  link: r.link,
  title: decode(r.title.raw ?? r.title.rendered),
  content: r.content.raw ?? r.content.rendered,
  excerpt: decode((r.excerpt.raw ?? r.excerpt.rendered).replace(/<[^>]+>/g, "")).trim(),
  categories: r.categories ?? [],
  tags: r.tags ?? [],
  featured_media: r.featured_media,
  meta: r.meta ?? {},
});

const CAMPOS = "id,type,status,date,modified,slug,link,title,content,excerpt,categories,tags,featured_media,meta";
const base = (t: "post" | "page") => (t === "page" ? "wp/v2/pages" : "wp/v2/posts");

// Caché corta por instancia: el inventario completo pesa ~2 MB y se usa en varias páginas.
const cache = new Map<string, { t: number; v: Entrada[] }>();
export function olvidarCache() {
  cache.clear();
}

export async function listar(tipo: "post" | "page" = "post", estados = "publish,draft,pending,future,private"): Promise<Entrada[]> {
  const k = tipo + estados;
  const c = cache.get(k);
  if (c && Date.now() - c.t < 60_000) return c.v;
  const out: Entrada[] = [];
  for (let page = 1; page < 20; page++) {
    const r = await wp<Raw[]>("GET", `${base(tipo)}?context=edit&per_page=100&page=${page}&status=${estados}&_fields=${CAMPOS}`);
    out.push(...r.data.map(norm));
    if (page >= Number(r.totalPages ?? 1)) break;
  }
  cache.set(k, { t: Date.now(), v: out });
  return out;
}

export async function obtener(id: number, tipo: "post" | "page" = "post"): Promise<Entrada> {
  const r = await wp<Raw>("GET", `${base(tipo)}/${id}?context=edit&_fields=${CAMPOS}`);
  return norm(r.data);
}

export type Cambios = Partial<{
  title: string; content: string; excerpt: string; slug: string; status: Entrada["status"];
  categories: number[]; tags: number[]; featured_media: number; meta: SeoMeta;
}>;

export async function actualizar(id: number, cambios: Cambios, tipo: "post" | "page" = "post") {
  const r = await wp<Raw>("POST", `${base(tipo)}/${id}?context=edit&_fields=${CAMPOS}`, cambios);
  olvidarCache();
  return norm(r.data);
}

export async function aPapelera(id: number, tipo: "post" | "page" = "post") {
  await wp("DELETE", `${base(tipo)}/${id}`);
  olvidarCache();
}

export type Termino = { id: number; name: string; slug: string; count: number; description?: string };
export async function categorias() {
  return (await wp<Termino[]>("GET", "wp/v2/categories?per_page=100&_fields=id,name,slug,count,description")).data;
}
export async function etiquetas() {
  const out: Termino[] = [];
  for (let page = 1; page < 10; page++) {
    const r = await wp<Termino[]>("GET", `wp/v2/tags?per_page=100&page=${page}&_fields=id,name,slug,count`);
    out.push(...r.data);
    if (page >= Number(r.totalPages ?? 1)) break;
  }
  return out;
}
export async function crearEtiqueta(name: string): Promise<number> {
  try {
    return (await wp<{ id: number }>("POST", "wp/v2/tags", { name })).data.id;
  } catch (e) {
    const d = (e as { data?: { code?: string; data?: { term_id?: number } } }).data;
    if (d?.code === "term_exists" && d.data?.term_id) return d.data.term_id;
    throw e;
  }
}

export type Medio = { id: number; source_url: string; alt_text: string; post: number | null; media_details?: { filesize?: number; width?: number; height?: number }; mime_type: string };
export async function medio(id: number) {
  return (await wp<Medio>("GET", `wp/v2/media/${id}?_fields=id,source_url,alt_text,post,media_details,mime_type`)).data;
}
export async function medios(): Promise<Medio[]> {
  const out: Medio[] = [];
  for (let page = 1; page < 20; page++) {
    const r = await wp<Medio[]>("GET", `wp/v2/media?per_page=100&page=${page}&_fields=id,source_url,alt_text,post,media_details,mime_type`);
    out.push(...r.data);
    if (page >= Number(r.totalPages ?? 1)) break;
  }
  return out;
}
export async function actualizarMedio(id: number, campos: { alt_text?: string; title?: string; caption?: string }) {
  return (await wp<Medio>("POST", `wp/v2/media/${id}`, campos)).data;
}

export async function indexNow(url: string) {
  try {
    await wp("POST", "rankmath/v1/in/submitUrls", { urls: url });
    return true;
  } catch {
    return false;
  }
}

/** Título SEO que ve Google: el de Rank Math o, por defecto, "Título - Transforma con IA". */
export function tituloSeo(e: Entrada) {
  const t = e.meta.rank_math_title?.trim();
  if (!t) return `${e.title} - Transforma con IA`;
  return t.replace(/%sep%/g, "-").replace(/%sitename%/g, "Transforma con IA").replace(/%title%/g, e.title);
}
export function metaDescripcion(e: Entrada) {
  return e.meta.rank_math_description?.trim() || e.excerpt || "";
}
