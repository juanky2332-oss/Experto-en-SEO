// Analizador SEO + GEO (buscadores con IA) de una entrada de WordPress.
// Código puro: se usa en el servidor (auditorías, Telegram) y en el editor (en vivo).

export type Gravedad = "critica" | "alta" | "media" | "baja";

export type Arreglo =
  | "quitar_schema_duplicado"
  | "quitar_nombre_completo"
  | "ia_meta"
  | "ia_keyword"
  | "ia_titulo"
  | "ia_enlaces"
  | "ia_faq"
  | "ia_alt"
  | "ia_actualizar";

export type Problema = {
  codigo: string;
  gravedad: Gravedad;
  titulo: string;
  detalle?: string;
  arreglo?: Arreglo;
};

export type EntradaAnalizable = {
  id: number;
  type?: "post" | "page";
  status?: string;
  date?: string;
  slug: string;
  link?: string;
  title: string;
  content: string;
  excerpt?: string;
  featured_media?: number;
  meta?: { rank_math_title?: string; rank_math_description?: string; rank_math_focus_keyword?: string };
};

export type Contexto = {
  anio: number;
  urlsInternas?: Set<string>; // URLs publicadas (normalizadas con / final)
  entrantes?: Map<number, number>; // id -> nº de enlaces internos que recibe
  similares?: Map<number, { id: number; title: string }[]>; // canibalización
};

export type Metricas = {
  palabras: number;
  h2: number;
  h3: number;
  internos: number;
  externos: number;
  imagenes: number;
  sinAlt: number;
  faq: boolean;
  lecturaMin: number;
  tituloSeo: number;
  meta: number;
  densidad: number;
};

export type Analisis = { score: number; problemas: Problema[]; metricas: Metricas; keyword: string };

const PESO: Record<Gravedad, number> = { critica: 20, alta: 10, media: 5, baja: 2 };

export const normalizar = (s: string) =>
  String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9ñ\s-]/g, " ").replace(/\s+/g, " ").trim();

export const textoPlano = (html: string) =>
  String(html ?? "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const STOP = new Set(["de", "la", "el", "en", "y", "a", "los", "las", "del", "para", "con", "por", "que", "un", "una", "como", "al", "lo", "su", "sus", "es", "o", "tu"]);

export function contieneKeyword(texto: string, kw: string) {
  const t = normalizar(texto), k = normalizar(kw);
  if (!k) return false;
  if (t.includes(k)) return true;
  const ws = k.split(" ").filter((w) => w.length > 2 && !STOP.has(w));
  return ws.length > 0 && ws.every((w) => t.includes(w));
}

export const urlNormal = (u: string) => u.replace(/[?#].*$/, "").replace(/\/?$/, "/");

export function analizar(e: EntradaAnalizable, ctx: Contexto): Analisis {
  const p: Problema[] = [];
  const add = (gravedad: Gravedad, codigo: string, titulo: string, detalle?: string, arreglo?: Arreglo) =>
    p.push({ gravedad, codigo, titulo, detalle, arreglo });
  const esPost = (e.type ?? "post") === "post";
  const html = e.content ?? "";
  const plano = textoPlano(html);
  const palabras = plano ? plano.split(" ").length : 0;
  const kw = (e.meta?.rank_math_focus_keyword ?? "").split(",")[0].trim();
  const seoTitle = (e.meta?.rank_math_title?.trim() || `${e.title} - Transforma con IA`)
    .replace(/%sep%/g, "-").replace(/%sitename%/g, "Transforma con IA").replace(/%title%/g, e.title);
  const meta = (e.meta?.rank_math_description?.trim() || "").trim();
  const metaEfectiva = meta || (e.excerpt ?? "");

  // ---------- Título ----------
  if (e.title.length > 70) add("media", "titulo_largo", `Título de ${e.title.length} caracteres`, "Google corta a partir de ~60. Déjalo en 45-65.", "ia_titulo");
  if (e.title.length < 25) add("media", "titulo_corto", "Título demasiado corto", "Aprovecha 45-65 caracteres con la keyword y un gancho.", "ia_titulo");
  const anios = (e.title.match(/\b20\d\d\b/g) ?? []).map(Number);
  const pubAnio = e.date ? new Date(e.date).getFullYear() : ctx.anio;
  if (anios.some((a) => a < pubAnio)) add("critica", "anio_erroneo", "Año equivocado en el título", `El título dice ${anios.join(", ")} pero se publicó en ${pubAnio}. Resta credibilidad y CTR.`, "ia_titulo");
  else if (anios.some((a) => a < ctx.anio) && esPost) add("media", "anio_caducado", "El título lleva un año pasado", `Menciona ${anios.join(", ")}. Actualiza el contenido o quita el año.`, "ia_actualizar");
  if (/[«»]/.test(e.title) || /\(.*\?\)/.test(e.title)) add("baja", "titulo_formato", "Título con comillas o paréntesis de relleno", "Los títulos limpios y directos funcionan mejor en Google y en Discover.", "ia_titulo");
  if (seoTitle.length > 62) add("media", "title_largo", `Title SEO de ${seoTitle.length} caracteres`, "Google mostrará el título cortado. Define un título SEO de ≤60 en Rank Math.", "ia_meta");

  // ---------- Meta y keyword ----------
  if (!meta) add(esPost ? "media" : "alta", "sin_meta", "Sin meta description propia", "Rank Math usa el extracto. Una meta de 130-155 caracteres con la keyword mejora el CTR.", "ia_meta");
  else if (meta.length < 110 || meta.length > 165) add("baja", "meta_longitud", `Meta description de ${meta.length} caracteres`, "Lo ideal son 130-155.", "ia_meta");
  if (!kw) add("media", "sin_keyword", "Sin palabra clave principal", "Sin keyword no hay forma de medir ni orientar el artículo.", "ia_keyword");
  else {
    if (!contieneKeyword(e.title, kw)) add("alta", "kw_titulo", "La keyword no está en el título", `Keyword: «${kw}».`, "ia_titulo");
    if (!contieneKeyword(plano.split(" ").slice(0, 120).join(" "), kw)) add("media", "kw_intro", "La keyword no aparece al principio", "Debe salir en las primeras 100-120 palabras (respuesta directa).", "ia_actualizar");
    if (metaEfectiva && !contieneKeyword(metaEfectiva, kw)) add("baja", "kw_meta", "La keyword no está en la meta description", undefined, "ia_meta");
  }

  // ---------- Estructura ----------
  const h2 = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)].map((m) => textoPlano(m[1]));
  const h3 = (html.match(/<h3[^>]*>/gi) ?? []).length;
  if (/<h1[\s>]/i.test(html)) add("media", "h1_contenido", "H1 dentro del contenido", "WordPress ya pone el título como H1; dos H1 confunden la jerarquía.");
  if (esPost && h2.length < 3) add("alta", "pocos_h2", `Solo ${h2.length} secciones H2`, "Estructura el artículo en 4-6 secciones con subtítulos que respondan preguntas.", "ia_actualizar");
  if (kw && h2.length && !h2.some((t) => contieneKeyword(t, kw))) add("baja", "kw_h2", "Ningún H2 contiene la keyword", undefined, "ia_actualizar");
  if (esPost && palabras < 600) add("critica", "contenido_pobre", `Contenido pobre: ${palabras} palabras`, "Google lo considera thin content. Amplía a 1.200+ o fusiónalo con otro artículo.", "ia_actualizar");
  else if (esPost && palabras < 1000) add("alta", "contenido_corto", `Solo ${palabras} palabras`, "Los artículos que posicionan en IA suelen superar 1.200 palabras.", "ia_actualizar");
  const parrafosLargos = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].filter((m) => textoPlano(m[1]).split(" ").length > 120).length;
  if (parrafosLargos > 2) add("baja", "parrafos_largos", `${parrafosLargos} párrafos de más de 120 palabras`, "Párrafos cortos = más legibles y más fáciles de citar por la IA.");

  // ---------- Enlaces ----------
  const hrefs = [...html.matchAll(/<a\s[^>]*href=["']([^"']+)["']/gi)].map((m) => m[1]);
  const internos = hrefs.filter((u) => /transformaconia\.com/.test(u) && !/wp-content/.test(u));
  const externos = hrefs.filter((u) => /^https?:/.test(u) && !/transformaconia\.com/.test(u));
  if (esPost && internos.length < 2) add("alta", "pocos_internos", `Solo ${internos.length} enlaces internos`, "Enlaza 3-5 artículos relacionados: reparte autoridad y ayuda a Google a entender el tema.", "ia_enlaces");
  if (ctx.urlsInternas?.size) {
    const rotos = internos.filter((u) => {
      if (/\/(category|tag|author|feed|wp-json)\//.test(u) || /^mailto:/.test(u)) return false;
      if (e.link && urlNormal(u) === urlNormal(e.link)) return false; // anclas a sí mismo
      return !ctx.urlsInternas!.has(urlNormal(u));
    });
    if (rotos.length) add("alta", "enlaces_rotos", `${rotos.length} enlace(s) interno(s) roto(s) o a borradores`, rotos.slice(0, 4).join(" · "), "ia_enlaces");
  }
  if (/href=["'][^"']*transformaconia\.com\/(contacto|contactar|hablemos)\/?["']/i.test(html)) add("alta", "enlace_contacto_404", "Enlace a una página de contacto que no existe", "Usa mailto:info@transformaconia.com.");
  if (esPost && externos.length === 0) add("baja", "sin_fuentes", "Sin enlaces a fuentes", "Citar la fuente original y documentación oficial refuerza E-E-A-T y las citas en IA.");
  if (esPost && ctx.entrantes && e.status === "publish" && (ctx.entrantes.get(e.id) ?? 0) === 0) add("media", "huerfano", "Artículo huérfano", "Ningún otro artículo le enlaza: Google lo rastrea menos y no recibe autoridad.");

  // ---------- Imágenes ----------
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]);
  const sinAlt = imgs.filter((t) => !/\salt=["'][^"']{5,}["']/i.test(t)).length;
  if (sinAlt) add("media", "img_sin_alt", `${sinAlt} imagen(es) sin texto alternativo`, "El alt describe la imagen a Google Imágenes y a lectores de pantalla.", "ia_alt");
  if (esPost && !e.featured_media) add("alta", "sin_destacada", "Sin imagen destacada", "Sin imagen no hay miniatura en Google, Discover ni redes.");
  if (imgs.some((t) => /\.png["']/i.test(t))) add("baja", "img_png", "Imágenes en PNG", "WebP pesa 5-8 veces menos y mejora la velocidad (Core Web Vitals).");

  // ---------- Datos estructurados y GEO ----------
  const ld = [...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  if (ld.some((j) => /"@type"\s*:\s*"(Article|BreadcrumbList|NewsArticle)"/.test(j)))
    add("media", "schema_duplicado", "Datos estructurados duplicados", "Rank Math ya genera Article y Breadcrumb; el bloque del contenido los duplica (y la miga apunta a /blog/, que es Contacto).", "quitar_schema_duplicado");
  const faq = /preguntas frecuentes/i.test(html) || ld.some((j) => /FAQPage/.test(j));
  if (esPost && !faq) add("baja", "sin_faq", "Sin preguntas frecuentes", "Un bloque FAQ con respuestas directas es lo que más citan ChatGPT, Perplexity y los AI Overviews.", "ia_faq");
  if (/Ros Bautista/.test(html)) add("baja", "nombre_completo", "Aparece el nombre completo del autor", "Se acordó firmar como «Juan Carlos Ros».", "quitar_nombre_completo");
  if (esPost && !/<ul|<ol|<table/i.test(html)) add("baja", "sin_listas", "Sin listas ni tablas", "Las listas y tablas se extraen mucho mejor en fragmentos destacados y respuestas de IA.", "ia_actualizar");

  // ---------- URL ----------
  if (e.slug.length > 75) add("baja", "slug_largo", `URL de ${e.slug.length} caracteres`, "No conviene cambiarla ya (perdería señales), pero evita URLs así en lo nuevo.");
  if (/-\d$/.test(e.slug)) add("media", "slug_duplicado", "URL con sufijo -2 / -3", "Suele indicar un artículo duplicado. Revisa si hay que fusionarlo o redirigirlo.");

  // ---------- Frescura y canibalización ----------
  if (esPost && e.date && e.status === "publish") {
    const meses = (Date.now() - new Date(e.date).getTime()) / (30 * 864e5);
    if (meses > 9) add("baja", "antiguo", `Publicado hace ${Math.round(meses)} meses`, "En IA todo caduca rápido: actualízalo con datos de hoy o redirígelo a uno más nuevo.", "ia_actualizar");
  }
  const sim = ctx.similares?.get(e.id);
  if (sim?.length) add("alta", "canibalizacion", "Compite con otros artículos tuyos", sim.map((s) => `#${s.id} ${s.title}`).join(" · "));

  // ---------- Puntuación ----------
  const kwN = normalizar(kw);
  const apariciones = kwN ? (normalizar(plano).match(new RegExp(kwN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length : 0;
  const densidad = palabras ? +((apariciones * Math.max(1, kwN.split(" ").length)) / palabras * 100).toFixed(2) : 0;
  if (kw && densidad > 3) add("media", "sobreoptimizado", `Keyword repetida en exceso (${densidad}%)`, "Suena forzado y Google lo penaliza. Usa sinónimos.");

  const score = Math.max(0, Math.min(100, 100 - p.reduce((a, x) => a + PESO[x.gravedad], 0)));
  const orden: Gravedad[] = ["critica", "alta", "media", "baja"];
  p.sort((a, b) => orden.indexOf(a.gravedad) - orden.indexOf(b.gravedad));
  return {
    score,
    problemas: p,
    keyword: kw,
    metricas: {
      palabras, h2: h2.length, h3, internos: internos.length, externos: externos.length, imagenes: imgs.length, sinAlt, faq,
      lecturaMin: Math.max(1, Math.round(palabras / 220)), tituloSeo: seoTitle.length, meta: metaEfectiva.length, densidad,
    },
  };
}

/** Grupos de artículos que compiten por lo mismo (títulos o keywords muy parecidos). */
export function detectarCanibalizacion(entradas: EntradaAnalizable[]) {
  const firmas = entradas.map((e) => {
    const base = normalizar(`${e.title} ${e.meta?.rank_math_focus_keyword?.split(",")[0] ?? ""}`)
      .split(" ").filter((w) => w.length > 3 && !STOP.has(w) && !/^20\d\d$/.test(w));
    return { e, set: new Set(base) };
  });
  const mapa = new Map<number, { id: number; title: string }[]>();
  for (let i = 0; i < firmas.length; i++)
    for (let j = i + 1; j < firmas.length; j++) {
      const a = firmas[i], b = firmas[j];
      if (!a.set.size || !b.set.size) continue;
      const comunes = [...a.set].filter((w) => b.set.has(w)).length;
      const jac = comunes / new Set([...a.set, ...b.set]).size;
      if (jac >= 0.5 || (comunes >= 4 && jac >= 0.34)) {
        mapa.set(a.e.id, [...(mapa.get(a.e.id) ?? []), { id: b.e.id, title: b.e.title }]);
        mapa.set(b.e.id, [...(mapa.get(b.e.id) ?? []), { id: a.e.id, title: a.e.title }]);
      }
    }
  return mapa;
}

/** Cuántos enlaces internos recibe cada entrada. */
export function enlacesEntrantes(entradas: EntradaAnalizable[]) {
  const porUrl = new Map(entradas.filter((e) => e.link).map((e) => [urlNormal(e.link!), e.id]));
  const cuenta = new Map<number, number>();
  for (const e of entradas) {
    const vistos = new Set<number>();
    for (const m of (e.content ?? "").matchAll(/href=["'](https?:\/\/transformaconia\.com\/[^"'#?]*)/gi)) {
      const id = porUrl.get(urlNormal(m[1]));
      if (id && id !== e.id && !vistos.has(id)) {
        vistos.add(id);
        cuenta.set(id, (cuenta.get(id) ?? 0) + 1);
      }
    }
  }
  return cuenta;
}

export const colorScore = (s: number) => (s >= 85 ? "emerald" : s >= 70 ? "lime" : s >= 50 ? "amber" : "rose");

/** Nombre genérico de cada tipo de problema (para agrupar y filtrar). */
export const NOMBRE_PROBLEMA: Record<string, string> = {
  titulo_largo: "Título H1 demasiado largo", titulo_corto: "Título demasiado corto", anio_erroneo: "Año equivocado en el título",
  anio_caducado: "Año pasado en el título", titulo_formato: "Título con comillas o paréntesis", title_largo: "Title SEO de más de 60 caracteres",
  sin_meta: "Sin meta description propia", meta_longitud: "Meta description fuera de rango", sin_keyword: "Sin palabra clave principal",
  kw_titulo: "Keyword fuera del título", kw_intro: "Keyword fuera de la introducción", kw_meta: "Keyword fuera de la meta", kw_h2: "Keyword en ningún H2",
  h1_contenido: "H1 dentro del contenido", pocos_h2: "Pocas secciones H2", contenido_pobre: "Contenido pobre (<600 palabras)",
  contenido_corto: "Contenido corto (<1.000 palabras)", parrafos_largos: "Párrafos demasiado largos", pocos_internos: "Pocos enlaces internos",
  enlaces_rotos: "Enlaces internos rotos", enlace_contacto_404: "Enlace a /contacto/ inexistente", sin_fuentes: "Sin enlaces a fuentes",
  huerfano: "Artículos huérfanos", img_sin_alt: "Imágenes sin texto alternativo", sin_destacada: "Sin imagen destacada", img_png: "Imágenes en PNG",
  schema_duplicado: "Datos estructurados duplicados", sin_faq: "Sin preguntas frecuentes", nombre_completo: "Firma con nombre completo",
  sin_listas: "Sin listas ni tablas", slug_largo: "URL muy larga", slug_duplicado: "URL con sufijo -2", antiguo: "Contenido antiguo (>9 meses)",
  canibalizacion: "Canibalización", sobreoptimizado: "Keyword repetida en exceso",
};
