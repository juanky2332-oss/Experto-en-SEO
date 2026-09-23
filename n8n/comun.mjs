// Funciones compartidas por los scripts de mantenimiento del sitio.
import postgres from 'postgres';
import { wp, gw } from './gw.mjs';

export { wp, gw };
export const SITE = 'https://transformaconia.com';
export const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require', max: 4 });
const KEY = process.env.OPENAI_API_KEY;
export const hoy = () => new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });
export const plano = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
export const palabras = (h) => plano(h).split(' ').filter(Boolean).length;

// Mayúscula inicial respetando marcas que van en minúscula
const MINUS = ['n8n', 'llm-optimizer', 'iPhone', 'iOS', 'eBay', 'macOS'];
export function mayus(s) {
  if (!s) return s;
  const m = MINUS.find((x) => s.toLowerCase().startsWith(x.toLowerCase()));
  if (m) return m + s.slice(m.length);
  return s.charAt(0).toLocaleUpperCase('es') + s.slice(1);
}

export const registrar = (a) => sql`insert into seo.actions (origin, action, target_type, target_id, summary, before, after)
  values ('sistema', ${a.action}, ${a.tipo ?? 'post'}, ${a.id != null ? String(a.id) : null}, ${a.summary}, ${a.before ? sql.json(a.before) : null}, ${a.after ? sql.json(a.after) : null})`;

export async function ia({ modelo = 'gpt-5.5', esfuerzo = 'medium', sistema, usuario, esquema, nombre, max = 40000, web = false }) {
  let ultimo = '';
  for (let intento = 0; intento < 3; intento++) {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelo, reasoning: { effort: esfuerzo }, max_output_tokens: max, instructions: sistema, input: usuario,
        ...(web ? { tools: [{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', country: 'ES' } }] } : {}),
        text: { format: { type: 'json_schema', name: nombre, strict: true, schema: esquema } } }),
    });
    const j = await r.json();
    if (r.ok) {
      let t = j.output_text || '';
      if (!t) for (const o of j.output || []) if (o.type === 'message') for (const c of o.content || []) if (c.type === 'output_text') t += c.text;
      if (t) return JSON.parse(t);
    }
    ultimo = j.error?.message || j.status;
    await new Promise((s) => setTimeout(s, 5000 * (intento + 1)));
  }
  throw new Error('OpenAI: ' + ultimo);
}

export async function enParalelo(lista, n, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: n }, async () => {
    while (i < lista.length) { const k = i++; try { await fn(lista[k], k); } catch (e) { console.log('  ✗', lista[k]?.id ?? k, String(e.message).slice(0, 160)); } }
  }));
}

// ---------------------------------------------------------------- imágenes
export async function generarImagen(prompt) {
  const r = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gpt-image-2', size: '1536x1024', quality: 'medium', output_format: 'webp', output_compression: 82, n: 1,
      prompt: `${prompt} Photorealistic editorial photograph, documentary magazine style, natural light, realistic skin and materials, 35mm lens, shallow depth of field. No text, no letters, no signs, no logos, no watermarks, no readable screens.` }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error('imagen: ' + (j.error?.message || r.status));
  return j.data[0].b64_json;
}

export async function subir(filename, b64, alt, titulo, pie = '') {
  const m = await gw({ action: 'media', filename, mime: 'image/webp', base64: b64 });
  if (m.status >= 400) throw new Error('subida: ' + JSON.stringify(m.data).slice(0, 200));
  await wp('POST', `wp/v2/media/${m.data.id}`, { alt_text: alt, title: titulo, caption: pie, description: alt });
  return { id: m.data.id, url: m.data.source_url };
}

const ESQ_FOTOS = { type: 'object', additionalProperties: false, required: ['fotos'], properties: { fotos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['prompt', 'alt', 'titulo', 'pie'], properties: { prompt: { type: 'string' }, alt: { type: 'string' }, titulo: { type: 'string' }, pie: { type: 'string' } } } } } };

/** Propone n fotos distintas para un artículo (la primera es la portada). */
export async function proponerFotos(titulo, texto, keyword, n) {
  const r = await ia({
    nombre: 'fotos', modelo: 'gpt-5.4-mini', esfuerzo: 'low', max: 6000, esquema: ESQ_FOTOS,
    sistema: 'Eres editor gráfico de una revista de negocio y tecnología española. Propones fotografías realistas que ilustran exactamente el tema.',
    usuario: `Propón ${n} fotografías DISTINTAS para este artículo (la primera es la portada). "prompt" EN INGLÉS: escena realista y concreta ligada al tema (el sector, la tarea, el producto o el objeto real del que se habla), personas en un entorno de trabajo español o europeo, luz natural, acción concreta. PROHIBIDO en los prompts: texto legible, logos, marcas, cerebros, circuitos, hologramas, robots humanoides (salvo que el artículo trate de robots), gente mirando una pantalla sin más, estética de neón o ciencia ficción. "alt" en español 90-125 caracteres que describe la escena e incluye de forma natural "${keyword}" o el tema. "titulo" 3-6 palabras. "pie" 60-110 caracteres que aporta contexto.
TÍTULO: ${titulo}
TEXTO: ${plano(texto).slice(0, 3000)}`,
  });
  return r.fotos.slice(0, n);
}

// ---------------------------------------------------------------- reescritura (mismas reglas que el plan)
const ESQ_REESCRITURA = { type: 'object', additionalProperties: false, required: ['contenido_html', 'meta_description', 'resumen_cambios'], properties: {
  contenido_html: { type: 'string' }, meta_description: { type: 'string' }, resumen_cambios: { type: 'array', items: { type: 'string' } } } };

export async function reescribir(p, instruccion, enlaces) {
  const kw = (p.meta?.rank_math_focus_keyword || '').split(',')[0];
  const estilos = p.content.raw.match(/<style[\s\S]*?<\/style>/i)?.[0] ?? '';
  const cuerpo = p.content.raw.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  const r = await ia({
    nombre: 'reescritura', web: true, esquema: ESQ_REESCRITURA,
    sistema: `Eres Juan Carlos Ros, consultor y desarrollador de IA y automatización en Transformaconia (España). Hoy es ${hoy()}. Escribes en español de España, directo, con criterio y sin relleno, para posicionar en Google (top 3) y ser citado por ChatGPT, Perplexity, Gemini y AI Overviews.
Reglas:
- Devuelve el HTML COMPLETO del cuerpo: sin <h1>, sin <style>, sin <script>. Conserva las <figure>/<img> existentes tal cual y el bloque <aside class="tca-relacionados"> si existe.
- Primer párrafo de 40-70 palabras que responda directamente a la pregunta principal e incluya la keyword «${kw}».
- 4-7 H2 con id en kebab-case sin tildes (uno contiene la keyword «${kw}»); H3 donde haga falta; párrafos de 2-4 frases; listas con <strong>término:</strong>; una <table> si hay comparación.
- Datos, cifras, versiones y fechas SOLO si están en el texto actual o los verificas hoy con la búsqueda web (y entonces cita la fuente con <a href="..." target="_blank" rel="noopener">).
- Enlaces internos: 3-6, SOLO de la lista, con anclas descriptivas.
- Termina con <h2 id="preguntas-frecuentes">Preguntas frecuentes</h2> (3-5 <h3> + <p> de 40-70 palabras) y <h2 id="fuentes">Fuentes</h2> con una <ul> de enlaces; después el bloque relacionados si existía y al final:
<aside class="tca-autor"><p><strong>Sobre el autor.</strong> Juan Carlos Ros es consultor y desarrollador de inteligencia artificial y automatización en Transformaconia, donde diseña agentes de IA y flujos automatizados para pymes españolas.</p><p><strong>¿Quieres aplicarlo en tu empresa?</strong> Cuéntanos tu caso en <a href="mailto:info@transformaconia.com">info@transformaconia.com</a> y te respondemos en menos de 24 horas.</p></aside>
- Nunca uses: "en el mundo actual", "sin duda", "cabe destacar", "revolucionario", "disruptivo", "en conclusión".`,
    usuario: `INSTRUCCIÓN: ${instruccion}
Título: ${p.title.raw} · Publicado: ${p.date.slice(0, 10)} · Keyword: ${kw}

ARTÍCULOS DEL BLOG QUE PUEDES ENLAZAR:
${enlaces.filter((e) => e.id !== p.id).map((e) => `- ${e.t} → ${e.link}`).join('\n')}

HTML ACTUAL:
${cuerpo.slice(0, 50000)}`,
  });
  let html = r.contenido_html.replace(/<h1[^>]*>[\s\S]*?<\/h1>/gi, '');
  const limpio = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const iFaq = html.search(/<h2[^>]*id=["']preguntas-frecuentes["']/i);
  const iFuentes = html.search(/<h2[^>]*id=["']fuentes["']/i);
  const faqs = iFaq >= 0 ? [...html.matchAll(/<h3[^>]*>([\s\S]*?)<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/gi)].filter((m) => m.index > iFaq && (iFuentes < 0 || m.index < iFuentes)) : [];
  const schema = faqs.length >= 2 ? `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map((m) => ({ '@type': 'Question', name: limpio(m[1]), acceptedAnswer: { '@type': 'Answer', text: limpio(m[2]) } })) })}</script>` : '';
  const nuevo = estilos + html + schema;
  const n = palabras(nuevo);
  if (n < palabras(p.content.raw) * 0.8) throw new Error(`#${p.id}: la reescritura sale más corta (${n}); no la aplico`);
  await wp('POST', `wp/v2/posts/${p.id}`, { content: nuevo, meta: { rank_math_description: mayus(r.meta_description) } });
  await registrar({ action: 'editar', id: p.id, summary: `Reescrito con IA (${n} palabras): ${r.resumen_cambios.slice(0, 3).join('; ')} — «${p.title.raw}»`, before: { content: p.content.raw, meta: { rank_math_description: p.meta?.rank_math_description || '' } } });
  return { n, cambios: r.resumen_cambios };
}
