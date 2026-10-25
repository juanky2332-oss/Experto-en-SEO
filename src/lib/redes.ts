import "server-only";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";

// Noticias del blog → Instagram (publicación 4:5 + historia 9:16).
// Las imágenes las genera /api/ig/tarjeta (pública: Instagram tiene que poder descargarlas).
// Con IG_TOKEN + IG_USER_ID (API de Instagram con inicio de sesión de Instagram) se publican solas;
// sin ellos, se manda a Telegram el texto y los enlaces a las imágenes para subirlas a mano.

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

async function igPost(path: string, params: Record<string, string>) {
  const r = await fetch(`${IG}/${path}`, { method: "POST", body: new URLSearchParams({ ...params, access_token: process.env.IG_TOKEN! }) });
  const j = (await r.json().catch(() => ({}))) as { id?: string; error?: { message?: string } };
  if (!r.ok || !j.id) throw new Error(`Instagram ${path}: ${j.error?.message ?? r.status}`);
  return j.id;
}

/** Crea el contenedor, espera a que Instagram lo procese y lo publica. */
async function publicarEnInstagram(params: Record<string, string>) {
  const user = process.env.IG_USER_ID!;
  const contenedor = await igPost(`${user}/media`, params);
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`${IG}/${contenedor}?fields=status_code&access_token=${process.env.IG_TOKEN}`);
    const j = (await r.json().catch(() => ({}))) as { status_code?: string };
    if (j.status_code === "FINISHED") break;
    if (j.status_code === "ERROR") throw new Error("Instagram no ha podido procesar la imagen");
    await new Promise((x) => setTimeout(x, 2000));
  }
  return igPost(`${user}/media_publish`, { creation_id: contenedor });
}

export async function compartir(a: Articulo, base: string) {
  const post = urlTarjeta(base, a.id, "post");
  const story = urlTarjeta(base, a.id, "story");
  const texto = textoInstagram(a);
  if (process.env.IG_TOKEN && process.env.IG_USER_ID) {
    const idPost = await publicarEnInstagram({ image_url: post, caption: texto });
    let idStory: string | null = null;
    try {
      idStory = await publicarEnInstagram({ image_url: story, media_type: "STORIES" });
    } catch (e) {
      console.error("historia", e);
    }
    await telegram(`📲 <b>Publicado en Instagram</b>\n${esc(a.titulo)}\nPublicación ✅ · Historia ${idStory ? "✅" : "❌"}`);
    return { modo: "api" as const, idPost, idStory };
  }
  await telegram(
    `📲 <b>Para Instagram</b> (sube la publicación y la historia)\n\n<b>Publicación:</b> ${post}\n<b>Historia:</b> ${story}\n\n<b>Texto:</b>\n${esc(texto)}\n\n<i>Para que se publique solo, falta el token de Instagram (IG_TOKEN e IG_USER_ID en Vercel).</i>`,
  );
  return { modo: "telegram" as const, post, story };
}

/** Comparte los artículos de los últimos días que aún no se han compartido. */
export async function compartirNuevos(base: string) {
  const [r] = await sql<{ value: number[] }[]>`select value from seo.settings where key = 'ig_compartidos'`;
  const hechos = new Set(r?.value ?? []);
  const nuevos = (await recientes(3)).filter((a) => !hechos.has(a.id)).slice(0, 2);
  const resultado = [];
  for (const a of nuevos) {
    try {
      resultado.push({ id: a.id, ...(await compartir(a, base)) });
      hechos.add(a.id);
    } catch (e) {
      console.error("compartir", a.id, e);
      await telegram(`⚠️ No he podido llevar a Instagram «${esc(a.titulo)}»: ${esc((e as Error).message)}`);
    }
  }
  const lista = [...hechos].slice(-200);
  await sql`insert into seo.settings (key, value) values ('ig_compartidos', ${sql.json(lista as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return resultado;
}
