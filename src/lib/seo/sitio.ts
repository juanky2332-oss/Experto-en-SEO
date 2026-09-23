import "server-only";
import { SITE, etiquetas, medios, type Termino } from "../wp";
import type { Inventario } from "./inventario";
import type { Gravedad } from "./analizar";

export type Chequeo = { id: string; ok: boolean; gravedad: Gravedad; titulo: string; detalle: string; accion?: string };

async function get(url: string) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 (ExpertoSEO; +https://transformaconia.com)" }, cache: "no-store", signal: AbortSignal.timeout(20_000) });
    return { status: r.status, text: await r.text(), headers: r.headers };
  } catch {
    return { status: 0, text: "", headers: new Headers() };
  }
}

const cap = (html: string, re: RegExp) => html.match(re)?.[1]?.trim() ?? "";

export async function auditarSitio(inv: Inventario) {
  const [robots, sitemap, llms, home, tags, media] = await Promise.all([
    get(`${SITE}/robots.txt`), get(`${SITE}/sitemap_index.xml`), get(`${SITE}/llms.txt`), get(`${SITE}/`),
    etiquetas().catch(() => [] as Termino[]), medios().catch(() => []),
  ]);
  const c: Chequeo[] = [];
  const add = (x: Chequeo) => c.push(x);

  // --- rastreo e indexación
  add({ id: "robots", ok: robots.status === 200 && /sitemap/i.test(robots.text) && !/Disallow:\s*\/\s*$/m.test(robots.text), gravedad: "critica", titulo: "robots.txt correcto y con sitemap", detalle: robots.status === 200 ? "Permite el rastreo y declara el sitemap." : `robots.txt responde ${robots.status}` });
  const nSitemaps = (sitemap.text.match(/<sitemap>/g) ?? []).length;
  add({ id: "sitemap", ok: sitemap.status === 200 && nSitemaps > 0, gravedad: "critica", titulo: "Sitemap XML de Rank Math", detalle: `${nSitemaps} sitemaps en el índice (${sitemap.status}).` });
  add({ id: "llms", ok: llms.status === 200 && llms.text.startsWith("#"), gravedad: "media", titulo: "llms.txt para buscadores de IA", detalle: llms.status === 200 ? "Publicado: ChatGPT, Claude y Perplexity tienen un índice limpio del sitio." : "No existe. Actívalo (snippet «Experto SEO · llms.txt»)." });
  const bloqueaIA = /User-agent:\s*(GPTBot|ClaudeBot|PerplexityBot|Google-Extended)[\s\S]*?Disallow:\s*\//i.test(robots.text);
  add({ id: "bots_ia", ok: !bloqueaIA, gravedad: "alta", titulo: "Los bots de IA pueden leer la web", detalle: bloqueaIA ? "robots.txt bloquea a algún bot de IA: no te citarán." : "GPTBot, ClaudeBot, PerplexityBot y Google-Extended tienen acceso." });

  // --- portada
  const h = home.text;
  const titulo = cap(h, /<title>([^<]*)<\/title>/i);
  const desc = cap(h, /<meta name="description" content="([^"]*)"/i);
  const h1 = (h.match(/<h1[\s>]/gi) ?? []).length;
  const tipos = [...new Set([...h.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]))];
  add({ id: "home_title", ok: titulo.length >= 30 && titulo.length <= 65, gravedad: "alta", titulo: "Título de la portada", detalle: `«${titulo}» (${titulo.length} caracteres)` });
  add({ id: "home_desc", ok: desc.length >= 110 && desc.length <= 165, gravedad: "alta", titulo: "Meta description de la portada", detalle: desc ? `«${desc}» (${desc.length})` : "No tiene." });
  add({ id: "home_h1", ok: h1 === 1, gravedad: "media", titulo: "Un único H1 en la portada", detalle: `Hay ${h1} H1.` });
  add({ id: "home_schema", ok: tipos.includes("Organization") || tipos.includes("LocalBusiness") || tipos.includes("ProfessionalService"), gravedad: "media", titulo: "Datos estructurados de la empresa", detalle: `Tipos detectados: ${tipos.join(", ") || "ninguno"}. Conviene Organization/ProfessionalService con logo, contacto y redes (sameAs).` });
  const inseguros = [...new Set([...h.matchAll(/(?:src|href)=["'](http:\/\/transformaconia\.com[^"']*)/g)].map((m) => m[1]))];
  add({ id: "https", ok: inseguros.length === 0, gravedad: "baja", titulo: "Sin recursos http:// mezclados", detalle: inseguros.length ? `La portada carga ${inseguros.length} recurso(s) por http://: ${inseguros.slice(0, 3).join(", ")}` : "Todos los enlaces y recursos de la portada usan https." });

  // --- arquitectura
  const pagBlog = inv.paginas.find((p) => p.slug === "blog");
  add({ id: "slug_blog", ok: !pagBlog || /blog/i.test(pagBlog.title), gravedad: "alta", titulo: "La URL /blog/ es realmente el blog", detalle: pagBlog ? `/blog/ es la página «${pagBlog.title}» y el blog está en /blog-2/. Confunde a Google y al usuario: cambia Contacto a /contacto/ y el blog a /blog/ (con redirección 301).` : "Correcto.", accion: pagBlog ? `/articulos/${pagBlog.id}?tipo=page` : undefined });
  const demos = inv.paginas.filter((p) => p.status === "publish" && /dark|landing|sample|demo|ejemplo/i.test(`${p.slug} ${p.title}`));
  add({ id: "demos", ok: demos.length === 0, gravedad: "media", titulo: "Sin páginas de demostración del tema publicadas", detalle: demos.length ? `Publicadas: ${demos.map((d) => `/${d.slug}/`).join(", ")}. Pásalas a borrador o noindex.` : "Correcto." });
  const vacias = inv.categorias.filter((x) => x.count === 0);
  const sinDesc = inv.categorias.filter((x) => !x.description);
  add({ id: "categorias", ok: sinDesc.length === 0, gravedad: "media", titulo: "Categorías con descripción SEO", detalle: sinDesc.length ? `Sin descripción: ${sinDesc.map((x) => x.name).join(", ")}` : `${inv.categorias.length} categorías descritas${vacias.length ? ` (vacías: ${vacias.map((x) => x.name).join(", ")})` : ""}.` });
  const tagsBasura = tags.filter((t) => t.count === 0);
  add({ id: "tags", ok: tagsBasura.length === 0, gravedad: "baja", titulo: "Sin etiquetas vacías o de demo", detalle: tagsBasura.length ? `${tagsBasura.length} etiquetas sin uso: ${tagsBasura.slice(0, 12).map((t) => t.name).join(", ")}` : "Correcto." });
  const catDefecto = inv.categorias.find((x) => x.slug === "automatizacion");
  const pubs = inv.posts.filter((p) => p.status === "publish");
  const enDefecto = catDefecto ? pubs.filter((p) => p.categories.length === 1 && p.categories[0] === catDefecto.id).length : 0;
  add({ id: "reparto", ok: enDefecto / Math.max(1, pubs.length) < 0.5, gravedad: "alta", titulo: "Artículos bien repartidos por categorías", detalle: `${enDefecto} de ${pubs.length} están en «${catDefecto?.name}». Un silo único diluye la autoridad temática.` });

  // --- contenido
  const borradores = inv.posts.filter((p) => p.status === "draft");
  add({ id: "borradores", ok: borradores.length <= 5, gravedad: "baja", titulo: "Borradores bajo control", detalle: `${borradores.length} borradores. Los duplicados o viejos conviene eliminarlos.` });
  const huerfanos = pubs.filter((p) => p.analisis.problemas.some((x) => x.codigo === "huerfano"));
  add({ id: "huerfanos", ok: huerfanos.length === 0, gravedad: "media", titulo: "Todos los artículos reciben enlaces internos", detalle: `${huerfanos.length} huérfanos.`, accion: "/articulos?problema=huerfano" });
  const canib = pubs.filter((p) => p.analisis.problemas.some((x) => x.codigo === "canibalizacion"));
  add({ id: "canibal", ok: canib.length === 0, gravedad: "alta", titulo: "Sin canibalización", detalle: `${canib.length} artículos compiten con otros por la misma búsqueda.`, accion: "/articulos?problema=canibalizacion" });
  const anio = pubs.filter((p) => p.analisis.problemas.some((x) => x.codigo === "anio_erroneo"));
  add({ id: "anios", ok: anio.length === 0, gravedad: "critica", titulo: "Años correctos en los títulos", detalle: `${anio.length} títulos con año equivocado (p. ej. «en 2024» publicado en 2026).`, accion: "/articulos?problema=anio_erroneo" });

  // --- imágenes
  const sinAlt = media.filter((m) => m.mime_type.startsWith("image/") && !m.alt_text);
  const pesadas = media.filter((m) => (m.media_details?.filesize ?? 0) > 300 * 1024);
  const png = media.filter((m) => m.mime_type === "image/png");
  add({ id: "alts", ok: sinAlt.length < 5, gravedad: "media", titulo: "Imágenes con texto alternativo", detalle: `${sinAlt.length} de ${media.length} imágenes sin alt.` });
  add({ id: "peso", ok: pesadas.length < 5, gravedad: "media", titulo: "Imágenes ligeras (<300 KB)", detalle: `${pesadas.length} imágenes pesan más de 300 KB y ${png.length} son PNG. Las nuevas ya se suben en WebP (~100 KB). Activa la conversión WebP de LiteSpeed para las antiguas.` });

  const peso = { critica: 12, alta: 8, media: 4, baja: 2 };
  const total = c.reduce((a, x) => a + peso[x.gravedad], 0);
  const score = Math.round((c.filter((x) => x.ok).reduce((a, x) => a + peso[x.gravedad], 0) / total) * 100);
  return { score, chequeos: c.sort((a, b) => Number(a.ok) - Number(b.ok) || peso[b.gravedad] - peso[a.gravedad]), huerfanos, canib, tagsBasura, borradores };
}
