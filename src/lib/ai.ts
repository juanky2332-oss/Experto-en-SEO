import "server-only";
import { openaiN8n } from "./gateway";

const KEY = process.env.OPENAI_API_KEY ?? "";
export const MODELO = process.env.OPENAI_MODEL ?? "gpt-5.5";
export const MODELO_RAPIDO = process.env.OPENAI_MODEL_FAST ?? "gpt-5.4-mini";

type Esquema = Record<string, unknown>;

export const hoy = () =>
  new Date().toLocaleDateString("es-ES", { timeZone: "Europe/Madrid", day: "numeric", month: "long", year: "numeric" });

// Clave directa (más rápida); si falta, se queda sin saldo o la rechaza OpenAI,
// se usa la credencial de OpenAI de n8n a través de la pasarela.
async function porN8n(endpoint: "responses" | "images/generations", body: Record<string, unknown>, timeoutMs: number) {
  const r = await openaiN8n(endpoint, body, timeoutMs);
  return { ok: r.status >= 200 && r.status < 300, status: r.status, j: r.data as Record<string, any> };
}

async function llamar(endpoint: "responses" | "images/generations", body: Record<string, unknown>, timeoutMs: number) {
  if (!KEY || process.env.OPENAI_VIA === "n8n") return porN8n(endpoint, body, timeoutMs);
  for (let intento = 0; intento < 3; intento++) {
    const r = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const j = await r.json();
    const sinSaldo = j?.error?.code === "insufficient_quota" || r.status === 401;
    if (sinSaldo) return porN8n(endpoint, body, timeoutMs);
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 4000 * (intento + 1))); continue; }
    return { ok: r.ok, status: r.status, j };
  }
  return porN8n(endpoint, body, timeoutMs);
}

async function responses(body: Record<string, unknown>, timeoutMs = 280_000) {
  const { ok, status, j } = await llamar("responses", body, timeoutMs);
  if (!ok) throw new Error(`OpenAI ${status}: ${j?.error?.message ?? "error"}`);
  return j as { output?: { type: string; content?: { type: string; text?: string }[]; name?: string; arguments?: string; call_id?: string }[]; output_text?: string; status?: string };
}

function textoDe(r: Awaited<ReturnType<typeof responses>>) {
  if (r.output_text) return r.output_text;
  let t = "";
  for (const o of r.output ?? []) if (o.type === "message") for (const c of o.content ?? []) if (c.type === "output_text") t += c.text ?? "";
  return t;
}

/** Llamada con salida JSON estricta. */
export async function json<T>(opts: {
  sistema: string; usuario: string | unknown[]; esquema: Esquema; nombre: string;
  modelo?: string; esfuerzo?: "minimal" | "low" | "medium" | "high"; maxTokens?: number; web?: boolean;
}): Promise<T> {
  const r = await responses({
    model: opts.modelo ?? MODELO,
    reasoning: { effort: opts.esfuerzo ?? "low" },
    max_output_tokens: opts.maxTokens ?? 16000,
    instructions: opts.sistema,
    input: opts.usuario,
    ...(opts.web ? { tools: [{ type: "web_search", search_context_size: "medium", user_location: { type: "approximate", country: "ES" } }] } : {}),
    text: { format: { type: "json_schema", name: opts.nombre, strict: true, schema: opts.esquema } },
  });
  const t = textoDe(r);
  if (!t) throw new Error(`La IA no devolvió respuesta (${r.status})`);
  return JSON.parse(t) as T;
}

const obj = (props: Record<string, Esquema>): Esquema => ({ type: "object", additionalProperties: false, required: Object.keys(props), properties: props });
const str = (description?: string): Esquema => ({ type: "string", ...(description ? { description } : {}) });
const arr = (items: Esquema, description?: string): Esquema => ({ type: "array", items, ...(description ? { description } : {}) });

const VOZ = `Eres el estratega SEO y editor de Transformaconia (transformaconia.com), consultora española de IA y automatización para pymes. El autor firma como "Juan Carlos Ros, consultor y desarrollador de IA y automatización". Escribes en español de España, directo y sin relleno. Optimizas para Google (top 3) y para que ChatGPT, Perplexity, Gemini y los AI Overviews citen el contenido. Nunca inventas datos, cifras, versiones ni nombres: si no está en el texto que te doy, no existe. La fecha de hoy es ${hoy()}.`;

// ---------------------------------------------------------------- meta, keyword, título
export type SugerenciaMeta = { focus_keyword: string; keywords_secundarias: string[]; seo_title: string; meta_description: string; titulos: string[]; motivo: string };

export async function sugerirMeta(e: { title: string; content: string; slug: string; date: string }, extra = "") {
  return json<SugerenciaMeta>({
    nombre: "meta_seo", esfuerzo: "low",
    sistema: VOZ,
    usuario: `Analiza este artículo publicado el ${e.date.slice(0, 10)} y propone su SEO on-page.
- focus_keyword: lo que un usuario en España teclearía para encontrarlo (2-6 palabras, minúsculas), realista y con demanda.
- keywords_secundarias: 3-5 variantes y long-tail.
- seo_title: ≤60 caracteres, keyword al principio, sin años falsos (el año de publicación es ${e.date.slice(0, 4)}).
- meta_description: 130-155 caracteres, keyword + beneficio + llamada implícita.
- titulos: 4 alternativas de H1 (45-65 caracteres), sin comillas «» ni paréntesis de relleno; si el artículo es de actualidad no pongas un año distinto al de publicación.
- motivo: una frase explicando la elección.
${extra}
URL actual: /${e.slug}/
TÍTULO: ${e.title}
CONTENIDO:
${e.content.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 12000)}`,
    esquema: obj({ focus_keyword: str(), keywords_secundarias: arr(str()), seo_title: str(), meta_description: str(), titulos: arr(str()), motivo: str() }),
  });
}

// ---------------------------------------------------------------- mejora del contenido
export type Mejora = { contenido_html: string; resumen_cambios: string[] };

export async function mejorarContenido(e: { title: string; content: string; date: string }, instruccion: string, enlaces: { title: string; link: string }[], keyword: string) {
  // separamos lo que no debe tocar la IA: estilos, esquema FAQ, caja de autor
  const estilos = e.content.match(/<style[\s\S]*?<\/style>/i)?.[0] ?? "";
  const cuerpo = e.content.replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<script[\s\S]*?<\/script>/gi, "");
  const r = await json<Mejora>({
    nombre: "mejora_contenido", esfuerzo: "medium", maxTokens: 40000, web: /actualiz|hoy|reciente|novedad/i.test(instruccion),
    sistema: `${VOZ}
Reglas al reescribir:
- Devuelve el HTML COMPLETO del cuerpo (sin <h1>, sin <style>, sin <script>). Conserva figuras (<figure>, <img>) y sus atributos tal cual.
- Etiquetas permitidas: p, h2, h3, ul, ol, li, strong, em, a, blockquote, table, thead, tbody, tr, th, td, figure, img, figcaption, nav, div, aside.
- Mantén todo lo que ya está bien. No elimines información verificada ni enlaces válidos.
- Los H2 llevan atributo id en kebab-case sin tildes.
- Si añades enlaces internos, SOLO de esta lista. Si añades una sección "Preguntas frecuentes", usa <h2 id="preguntas-frecuentes"> y <h3> + <p> por pregunta (40-70 palabras, respuesta directa en la primera frase).
- Si buscas en la web, cita la fuente con enlace externo.`,
    usuario: `INSTRUCCIÓN: ${instruccion}
Keyword principal: ${keyword || "(define una coherente con el tema)"}
Título: ${e.title} · Publicado: ${e.date.slice(0, 10)}

ARTÍCULOS DEL BLOG QUE PUEDES ENLAZAR:
${enlaces.slice(0, 40).map((x) => `- ${x.title} → ${x.link}`).join("\n")}

HTML ACTUAL:
${cuerpo.slice(0, 60000)}`,
    esquema: obj({ contenido_html: str(), resumen_cambios: arr(str(), "3-6 cambios hechos") }),
  });
  // re-montamos: estilos + cuerpo nuevo + esquema FAQ regenerado a partir del HTML
  const faqs = [...r.contenido_html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)];
  const iFaq = r.contenido_html.search(/<h2[^>]*id=["']preguntas-frecuentes["']/i);
  const enFaq = iFaq >= 0 ? faqs.filter((m) => (m.index ?? 0) > iFaq) : [];
  const limpio = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  const schema = enFaq.length >= 2
    ? `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: enFaq.map((m) => ({ "@type": "Question", name: limpio(m[1]), acceptedAnswer: { "@type": "Answer", text: limpio(m[2]) } })) })}</script>`
    : "";
  return { contenido: estilos + r.contenido_html + schema, cambios: r.resumen_cambios };
}

// ---------------------------------------------------------------- alt text con visión
export async function altDeImagen(url: string, contexto: string) {
  const r = await json<{ alt: string }>({
    nombre: "alt_text", modelo: MODELO_RAPIDO, esfuerzo: "low", maxTokens: 2000,
    sistema: "Escribes textos alternativos (alt) de imágenes para SEO y accesibilidad, en español de España.",
    usuario: [{ role: "user", content: [
      { type: "input_text", text: `Describe literalmente esta imagen en 90-125 caracteres. Incluye de forma natural el tema del artículo si encaja: "${contexto}". Sin "imagen de" ni "foto de".` },
      { type: "input_image", image_url: url },
    ] }],
    esquema: obj({ alt: str() }),
  });
  return r.alt;
}

// ---------------------------------------------------------------- imagen nueva (gpt-image-2, WebP)
export async function generarImagen(prompt: string) {
  const { ok, status, j } = await llamar("images/generations", {
      model: "gpt-image-2", size: "1536x1024", quality: "medium", output_format: "webp", output_compression: 82, n: 1,
      prompt: `${prompt} Photorealistic editorial photograph, documentary magazine style, natural light, 35mm lens, shallow depth of field. No text, no letters, no signs, no logos, no watermarks, no readable screens.`,
  }, 280_000);
  if (!ok) throw new Error(`Imagen: ${j?.error?.message ?? status}`);
  return j.data[0].b64_json as string;
}

export async function promptImagen(e: { title: string; content: string }) {
  return json<{ prompt: string; alt: string }>({
    nombre: "prompt_imagen", modelo: MODELO_RAPIDO, esfuerzo: "low", maxTokens: 3000,
    sistema: "Eres editor gráfico de una revista de negocio y tecnología.",
    usuario: `Propón la foto de portada de este artículo. "prompt" EN INGLÉS: escena realista y concreta ligada al tema (sector, tarea u objeto real), personas en un entorno de trabajo español o europeo, luz natural. Prohibido: texto legible, logos, cerebros, circuitos, hologramas, robots humanoides (salvo que el artículo sea de robots), gente mirando una pantalla sin más. "alt" en español, 90-125 caracteres, describe la escena e incluye el tema.
TÍTULO: ${e.title}
RESUMEN: ${e.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 2500)}`,
    esquema: obj({ prompt: str(), alt: str() }),
  });
}

// ---------------------------------------------------------------- estrategia
export type Recomendacion = {
  tipo: "publicar" | "actualizar" | "fusionar" | "eliminar" | "tecnico" | "estructura" | "no_publicar";
  prioridad: "alta" | "media" | "baja";
  titulo: string;
  detalle: string;
  post_id: number;
  cambio_titulo: string;
};
export type Plan = { diagnostico: string; clusters: { nombre: string; pilar: string; articulos: number[]; huecos: string[] }[]; recomendaciones: Recomendacion[] };

export async function planEstrategico(datos: string) {
  return json<Plan>({
    nombre: "plan_seo", esfuerzo: "medium", maxTokens: 30000,
    sistema: `${VOZ}
Eres además un consultor SEO sénior. Tu plan debe ser concreto y accionable, priorizado por impacto/esfuerzo. Piensa en autoridad temática (clusters con un artículo pilar enlazado por los satélites), canibalización, contenido caducado de IA (en IA todo caduca en meses), E-E-A-T, y visibilidad en buscadores con IA.`,
    usuario: `Con este inventario del blog, su auditoría y el radar de noticias de hoy, elabora el plan SEO:
1. diagnostico: 4-6 frases con la situación real y lo más urgente.
2. clusters: 4-6 grupos temáticos con su artículo pilar (existente o a crear), los ids que pertenecen y huecos de contenido que faltan.
3. recomendaciones: 12-20 acciones. tipo=publicar (qué nuevo artículo escribir y por qué ahora), no_publicar (temas que NO conviene tocar y por qué), actualizar (post_id + qué cambiar), fusionar (post_id del que se redirige, en detalle a cuál), eliminar (borradores o duplicados sin valor), tecnico, estructura. Si propones un título nuevo para un artículo existente, ponlo en cambio_titulo (si no, cadena vacía). post_id = 0 si no aplica.

${datos}`,
    esquema: obj({
      diagnostico: str(),
      clusters: arr(obj({ nombre: str(), pilar: str(), articulos: arr({ type: "integer" }), huecos: arr(str()) })),
      recomendaciones: arr(obj({
        tipo: { type: "string", enum: ["publicar", "actualizar", "fusionar", "eliminar", "tecnico", "estructura", "no_publicar"] },
        prioridad: { type: "string", enum: ["alta", "media", "baja"] },
        titulo: str(), detalle: str(), post_id: { type: "integer" }, cambio_titulo: str(),
      })),
    }),
  });
}

// ---------------------------------------------------------------- buscador de temas (radar a demanda)
export type ResultadoTema = {
  titulo: string; url: string; fuente: string; fecha: string; resumen: string; por_que: string;
  keyword: string; interes: number; intencion: string; ya_cubierto: string;
};
export type IdeaTema = { titulo_articulo: string; keyword: string; angulo: string; por_que: string };
export type Busqueda = { panorama: string; resultados: ResultadoTema[]; ideas: IdeaTema[] };

export async function buscarTema(consulta: string, blog: string[]) {
  return json<Busqueda>({
    nombre: "buscador_temas", web: true, esfuerzo: "low", maxTokens: 20000,
    sistema: `${VOZ}
Actúas como documentalista y editor SEO. Buscas en la web las noticias y publicaciones MÁS RECIENTES y fiables sobre el tema que te piden y eliges las que mejor sirven para escribir un artículo que posicione en Google España y sea citado por buscadores con IA.`,
    usuario: `Tema a investigar: «${consulta}»

1. panorama: 3-5 frases con lo que está pasando ahora mismo con este tema (con fechas).
2. resultados: 6-10 fuentes concretas (URL exacta de la noticia, anuncio oficial, documentación o estudio; nada de agregadores, foros ni páginas de categoría), de las últimas semanas si existen. Para cada una: titulo, url, fuente (medio), fecha (AAAA-MM-DD o "s/f"), resumen (2 frases en español), por_que (qué ángulo SEO ofrece), keyword (lo que se busca en Google España, minúsculas), interes (0-100: novedad + demanda de búsqueda + encaje con pymes españolas), intencion (Informacional/Comercial/Transaccional/Navegacional) y ya_cubierto (título del artículo del blog que ya trata lo mismo, o cadena vacía).
3. ideas: 3-5 artículos que convendría escribir sobre este tema (titulo_articulo 45-65 caracteres, keyword, angulo, por_que), evitando lo que el blog ya cubre.

ARTÍCULOS QUE YA TIENE EL BLOG:
${blog.map((t) => `- ${t}`).join("\n")}`,
    esquema: obj({
      panorama: str(),
      resultados: arr(obj({ titulo: str(), url: str(), fuente: str(), fecha: str(), resumen: str(), por_que: str(), keyword: str(), interes: { type: "integer" }, intencion: str(), ya_cubierto: str() })),
      ideas: arr(obj({ titulo_articulo: str(), keyword: str(), angulo: str(), por_que: str() })),
    }),
  });
}

// ---------------------------------------------------------------- agente de Telegram (function calling)
export type LlamadaHerramienta = { name: string; arguments: string; call_id: string };
export async function agente(input: unknown[], herramientas: unknown[], sistema: string) {
  const r = await responses({ model: MODELO_RAPIDO, reasoning: { effort: "low" }, max_output_tokens: 6000, instructions: sistema, input, tools: herramientas }, 90_000);
  const llamadas: LlamadaHerramienta[] = (r.output ?? []).filter((o) => o.type === "function_call").map((o) => ({ name: o.name!, arguments: o.arguments!, call_id: o.call_id! }));
  return { texto: textoDe(r), llamadas, output: r.output ?? [] };
}
