// Mejoras seguras sobre el sitio (no cambia títulos visibles ni URLs).
// Uso: node n8n/mejoras-seguras.mjs [meta|categorias|alts|limpieza|todo]
// Cada cambio queda en seo.actions con el estado anterior (se puede deshacer desde la app).
import postgres from 'postgres';
import { wp, gw } from './gw.mjs';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require', max: 4 });
const KEY = process.env.OPENAI_API_KEY;
const fase = process.argv[2] || 'todo';
const hoy = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });

async function ia({ modelo = 'gpt-5.5', esfuerzo = 'low', sistema, usuario, esquema, nombre, max = 8000 }) {
  for (let intento = 0; intento < 3; intento++) {
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: modelo, reasoning: { effort: esfuerzo }, max_output_tokens: max, instructions: sistema, input: usuario,
        text: { format: { type: 'json_schema', name: nombre, strict: true, schema: esquema } } }),
    });
    const j = await r.json();
    if (r.ok) {
      let t = j.output_text || '';
      if (!t) for (const o of j.output || []) if (o.type === 'message') for (const c of o.content || []) if (c.type === 'output_text') t += c.text;
      if (t) return JSON.parse(t);
    }
    await new Promise((s) => setTimeout(s, 3000 * (intento + 1)));
    if (intento === 2) throw new Error('OpenAI: ' + (j.error?.message || 'sin respuesta'));
  }
}

async function enParalelo(lista, n, fn) {
  let i = 0; const out = [];
  await Promise.all(Array.from({ length: n }, async () => { while (i < lista.length) { const k = i++; try { out[k] = await fn(lista[k], k); } catch (e) { out[k] = { error: e.message }; console.log('  ✗', lista[k].id ?? '', e.message.slice(0, 120)); } } }));
  return out;
}

const registrar = (summary, id, before, after, action = 'mejora_segura') =>
  sql`insert into seo.actions (origin, action, target_type, target_id, summary, before, after) values ('sistema', ${action}, 'post', ${String(id)}, ${summary}, ${before ? sql.json(before) : null}, ${after ? sql.json(after) : null})`;

const plano = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function posts() {
  const r = await wp('GET', 'wp/v2/posts?context=edit&per_page=100&status=publish&_fields=id,date,slug,link,title,content,excerpt,categories,featured_media,meta');
  return r.data;
}

// ---------------------------------------------------------------- 1) meta de Rank Math
async function meta(lista) {
  console.log(`\n== Meta Rank Math en ${lista.length} artículos`);
  const ESQ = { type: 'object', additionalProperties: false, required: ['focus_keyword', 'secundarias', 'seo_title', 'meta_description', 'titulo_propuesto', 'motivo_titulo'], properties: {
    focus_keyword: { type: 'string' }, secundarias: { type: 'array', items: { type: 'string' } }, seo_title: { type: 'string' }, meta_description: { type: 'string' },
    titulo_propuesto: { type: 'string', description: 'H1 mejorado, o cadena vacía si el actual ya es bueno' }, motivo_titulo: { type: 'string' } } };
  let hechos = 0;
  const propuestas = [];
  await enParalelo(lista, 6, async (p) => {
    const titulo = p.title.raw;
    const r = await ia({
      nombre: 'meta', esquema: ESQ,
      sistema: `Eres un SEO sénior de Transformaconia (consultora española de IA para pymes). Hoy es ${hoy}. Nunca inventas datos.`,
      usuario: `Artículo publicado el ${p.date.slice(0, 10)}. Define su SEO on-page para Google España:
- focus_keyword: lo que se teclea de verdad (2-6 palabras, minúsculas), presente en el tema del artículo.
- secundarias: 3-4 variantes.
- seo_title: 40-60 caracteres, keyword al principio, sin comillas «», sin paréntesis de relleno, sin años salvo el de publicación (${p.date.slice(0, 4)}) si aporta.
- meta_description: 130-155 caracteres, con la keyword, beneficio concreto para el lector, sin prometer nada que el artículo no tenga.
- titulo_propuesto: si el H1 actual tiene un año equivocado, comillas/paréntesis de relleno o supera 65 caracteres, propone uno mejor (45-65); si no, cadena vacía.
TÍTULO ACTUAL: ${titulo}
TEXTO: ${plano(p.content.raw).slice(0, 6000)}`,
    });
    const nuevo = { rank_math_title: r.seo_title.slice(0, 65), rank_math_description: r.meta_description, rank_math_focus_keyword: [r.focus_keyword, ...r.secundarias].slice(0, 5).join(',') };
    const antes = { rank_math_title: p.meta?.rank_math_title || '', rank_math_description: p.meta?.rank_math_description || '', rank_math_focus_keyword: p.meta?.rank_math_focus_keyword || '' };
    // no pisamos lo que ya estaba bien puesto a mano
    if (antes.rank_math_description && antes.rank_math_title && antes.rank_math_focus_keyword && !/�/.test(antes.rank_math_focus_keyword)) return;
    await wp('POST', `wp/v2/posts/${p.id}`, { meta: nuevo });
    await registrar(`SEO de Rank Math (título SEO, meta y keyword) de «${titulo}»`, p.id, { meta: antes }, { meta: nuevo });
    if (r.titulo_propuesto && r.titulo_propuesto !== titulo) propuestas.push({ id: p.id, actual: titulo, nuevo: r.titulo_propuesto, motivo: r.motivo_titulo });
    hechos++;
    process.stdout.write('.');
  });
  // títulos visibles: solo como recomendación (no se cambian sin aprobación)
  for (const x of propuestas) {
    await sql`insert into seo.recommendations (tipo, prioridad, titulo, detalle, post_id, payload)
      values ('actualizar', ${/20\d\d/.test(x.actual) ? 'alta' : 'media'}, ${'Mejorar el título de #' + x.id}, ${`Actual: «${x.actual}». ${x.motivo}`}, ${x.id}, ${sql.json({ fuente: 'auditoria', cambio_titulo: x.nuevo })})`;
  }
  console.log(`\n  ${hechos} artículos con SEO de Rank Math · ${propuestas.length} títulos propuestos (pendientes de tu aprobación)`);
  return { hechos, propuestas: propuestas.length };
}

// ---------------------------------------------------------------- 2) categorías
async function categorias(lista) {
  console.log(`\n== Recategorizar ${lista.length} artículos`);
  const cats = (await wp('GET', 'wp/v2/categories?per_page=100&_fields=id,slug,name')).data;
  const porSlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
  const r = await ia({
    nombre: 'categorias', esfuerzo: 'medium', max: 16000,
    esquema: { type: 'object', additionalProperties: false, required: ['asignacion'], properties: { asignacion: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'categoria'], properties: { id: { type: 'integer' }, categoria: { type: 'string', enum: Object.keys(porSlug).filter((s) => s !== 'uncategorized') } } } } } },
    sistema: 'Eres arquitecto de información de un blog de IA para empresas. Asignas UNA categoría principal a cada artículo para crear silos temáticos claros.',
    usuario: `Categorías:
- noticias-ia: noticias y lanzamientos (modelos nuevos, movimientos de empresas de IA, anuncios).
- servicios-y-herramientas-de-ia: análisis a fondo de una herramienta, app o modelo concreto y cómo usarlo.
- automatizacion: n8n, agentes de IA, flujos de trabajo, automatización de procesos, RAG aplicado.
- guias-ia: tutoriales paso a paso («cómo crear…», «cómo hacer…»).
- sobre-la-ia: IA y empresa/sociedad: estrategia, empleo, regulación, ética, casos de sector, investigación.
Artículos (id | título | extracto):
${lista.map((p) => `${p.id} | ${p.title.raw} | ${plano(p.excerpt.raw).slice(0, 180)}`).join('\n')}`,
  });
  let n = 0;
  for (const a of r.asignacion) {
    const p = lista.find((x) => x.id === a.id); const nueva = porSlug[a.categoria];
    if (!p || !nueva || (p.categories.length === 1 && p.categories[0] === nueva)) continue;
    await wp('POST', `wp/v2/posts/${p.id}`, { categories: [nueva] });
    await registrar(`Categoría → ${cats.find((c) => c.id === nueva).name}: «${p.title.raw}»`, p.id, { categories: p.categories }, { categories: [nueva] });
    n++;
  }
  const reparto = {}; for (const a of r.asignacion) reparto[a.categoria] = (reparto[a.categoria] || 0) + 1;
  console.log(`  ${n} artículos cambiados de categoría`, reparto);
  return { n, reparto };
}

// ---------------------------------------------------------------- 3) alt de imágenes (con visión)
async function alts() {
  const todos = [];
  for (let page = 1; page < 10; page++) {
    const r = await wp('GET', `wp/v2/media?per_page=100&page=${page}&media_type=image&_fields=id,source_url,alt_text,post,mime_type`);
    todos.push(...r.data); if (page >= Number(r.totalPages || 1)) break;
  }
  const titulos = Object.fromEntries((await wp('GET', 'wp/v2/posts?per_page=100&status=publish,draft&_fields=id,title')).data.map((p) => [p.id, p.title.rendered]));
  const sin = todos.filter((m) => !m.alt_text && /image\/(jpe?g|png|webp)/.test(m.mime_type) && !/cropped-|-\d+x\d+\./.test(m.source_url));
  console.log(`\n== Alt con visión en ${sin.length} imágenes`);
  let n = 0;
  await enParalelo(sin, 6, async (m) => {
    const tema = titulos[m.post] ? String(titulos[m.post]).replace(/&#\d+;/g, '') : 'inteligencia artificial y automatización para empresas';
    const r = await ia({ modelo: 'gpt-5.4-mini', nombre: 'alt', max: 1500,
      esquema: { type: 'object', additionalProperties: false, required: ['alt'], properties: { alt: { type: 'string' } } },
      sistema: 'Escribes textos alternativos de imágenes en español de España para SEO y accesibilidad.',
      usuario: [{ role: 'user', content: [{ type: 'input_text', text: `Describe literalmente la imagen en 80-125 caracteres. Si encaja, relaciónala con el tema: "${tema}". Sin "imagen de" ni "foto de".` }, { type: 'input_image', image_url: m.source_url }] }] });
    await wp('POST', `wp/v2/media/${m.id}`, { alt_text: r.alt });
    n++; if (n % 20 === 0) process.stdout.write(` ${n}`);
  });
  await sql`insert into seo.actions (origin, action, target_type, summary) values ('sistema', 'alts_imagenes', 'media', ${`Texto alternativo generado leyendo ${n} imágenes que no lo tenían`})`;
  console.log(`\n  ${n} imágenes con alt`);
  return n;
}

// ---------------------------------------------------------------- 4) limpieza
function limpiar(html) {
  let c = html; const cambios = [];
  c = c.replace(/\s*<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi, (m, j) => (/"@type"\s*:\s*"(Article|BreadcrumbList|NewsArticle)"/.test(j) && !/FAQPage/.test(j) ? (cambios.push('schema duplicado'), '') : m));
  if (/Ros Bautista/.test(c)) { c = c.replace(/Juan Carlos Ros Bautista/g, 'Juan Carlos Ros'); cambios.push('firma abreviada'); }
  const a = c; c = c.replace(/href=["']https?:\/\/transformaconia\.com\/(contacto|contactar|hablemos)\/?["']/gi, 'href="mailto:info@transformaconia.com"'); if (a !== c) cambios.push('enlace de contacto roto');
  return { c, cambios: [...new Set(cambios)] };
}
async function limpieza() {
  console.log('\n== Limpieza');
  const todos = (await wp('GET', 'wp/v2/posts?context=edit&per_page=100&status=publish,draft,pending,private&_fields=id,title,content')).data;
  let n = 0;
  for (const p of todos) {
    const { c, cambios } = limpiar(p.content.raw);
    if (!cambios.length) continue;
    await wp('POST', `wp/v2/posts/${p.id}`, { content: c });
    await registrar(`${cambios.join(', ')}: «${p.title.raw}»`, p.id, { content: p.content.raw }, { content: '(limpio)' });
    n++;
  }
  const tags = (await wp('GET', 'wp/v2/tags?per_page=100&_fields=id,name,count')).data.filter((t) => t.count === 0);
  for (const t of tags) await wp('DELETE', `wp/v2/tags/${t.id}?force=true`);
  if (tags.length) await sql`insert into seo.actions (origin, action, target_type, summary, before) values ('sistema', 'borrar_etiquetas', 'tag', ${`Eliminadas ${tags.length} etiquetas vacías de la plantilla: ${tags.map((t) => t.name).join(', ')}`}, ${sql.json(tags)})`;
  // páginas demo del tema: noindex (siguen existiendo, pero Google no las indexa)
  const paginas = (await wp('GET', 'wp/v2/pages?per_page=100&_fields=id,slug,title')).data.filter((p) => /blog-dark/.test(p.slug));
  for (const p of paginas) {
    await wp('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: p.id, meta: { rank_math_robots: ['noindex', 'follow'] } });
    await sql`insert into seo.actions (origin, action, target_type, target_id, summary) values ('sistema', 'noindex', 'page', ${String(p.id)}, ${`noindex en la página demo /${p.slug}/`})`;
  }
  console.log(`  ${n} artículos limpiados · ${tags.length} etiquetas vacías borradas · noindex en ${paginas.length} páginas demo`);
  return { n, tags: tags.length, demos: paginas.length };
}

const lista = await posts();
const res = {};
if (fase === 'limpieza' || fase === 'todo') res.limpieza = await limpieza();
if (fase === 'categorias' || fase === 'todo') res.categorias = await categorias(lista);
if (fase === 'meta' || fase === 'todo') res.meta = await meta(await posts());
if (fase === 'alts' || fase === 'todo') res.alts = await alts();
console.log('\nRESULTADO', JSON.stringify(res));
await sql.end();
