// Pulido final: corrige todos los problemas críticos y altos que detecta el
// analizador de la app y renueva las fotos antiguas (SDXL/PNG) por gpt-image-2 WebP.
// Uso: node n8n/pulir.mjs [marcas|contenido|titulos|canibal|fotos|informe|todo]
import { analizar, detectarCanibalizacion, enlacesEntrantes, urlNormal } from '../src/lib/seo/analizar.ts';
import { wp, gw, sql, SITE, ia, mayus, registrar, enParalelo, reescribir, proponerFotos, generarImagen, subir, plano, palabras } from './comun.mjs';

const fase = process.argv[2] || 'todo';
const NOINDEX = new Set([6458, 6171, 6283, 6294]);
const anio = Number(new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric' }));
const CONTENIDO = new Set(['contenido_pobre', 'contenido_corto', 'pocos_h2', 'enlaces_rotos', 'pocos_internos', 'enlace_contacto_404', 'h1_contenido']);
const TITULO = new Set(['anio_erroneo', 'kw_titulo', 'titulo_largo', 'titulo_corto']);

async function cargar() {
  const posts = (await wp('GET', 'wp/v2/posts?context=edit&per_page=100&status=publish&_fields=id,date,slug,link,title,content,excerpt,categories,featured_media,meta,status,type')).data;
  const pages = (await wp('GET', 'wp/v2/pages?context=edit&per_page=100&status=publish&_fields=id,link,slug,title,content')).data;
  const cats = (await wp('GET', 'wp/v2/categories?per_page=100&_fields=id,slug')).data;
  const norm = (p) => ({ id: p.id, type: 'post', status: p.status, date: p.date, slug: p.slug, link: p.link, title: p.title.raw, content: p.content.raw, excerpt: p.excerpt?.raw ?? '', featured_media: p.featured_media, meta: p.meta ?? {} });
  const indexables = posts.filter((p) => !NOINDEX.has(p.id));
  const todos = [...posts, ...pages].map((p) => ({ ...norm(p), type: p.type === 'page' ? 'page' : 'post' }));
  const ctx = {
    anio,
    urlsInternas: new Set([`${SITE}/`, ...todos.map((e) => urlNormal(e.link)), ...cats.map((c) => `${SITE}/category/${c.slug}/`)]),
    entrantes: enlacesEntrantes(todos),
    similares: detectarCanibalizacion(indexables.map(norm)),
  };
  const filas = indexables.map((p) => ({ p, a: analizar(norm(p), ctx) }));
  return { posts, indexables, filas, ctx };
}

const graves = (a) => a.problemas.filter((x) => x.gravedad === 'critica' || x.gravedad === 'alta');

function informe(filas, titulo) {
  const media = Math.round(filas.reduce((s, f) => s + f.a.score, 0) / filas.length);
  const cuenta = {};
  for (const f of filas) for (const x of graves(f.a)) cuenta[x.codigo] = (cuenta[x.codigo] || 0) + 1;
  console.log(`\n== ${titulo}: salud media ${media}/100 · ${filas.filter((f) => graves(f.a).length).length} artículos con problemas críticos/altos`, cuenta);
  return { media, cuenta };
}

// ---------------------------------------------------------------- marcas en títulos (n8n, llm-optimizer…)
async function marcas() {
  const { posts } = await cargar();
  for (const p of posts) {
    const t = p.title.raw; const nuevo = mayus(t.charAt(0).toLowerCase() + t.slice(1)) === t ? t : t;
    const arreglado = /^N8n\b/.test(t) ? 'n8n' + t.slice(3) : /^Llm-optimizer/.test(t) ? 'llm-optimizer' + t.slice(13) : nuevo;
    if (arreglado !== t) {
      await wp('POST', `wp/v2/posts/${p.id}`, { title: arreglado });
      await registrar({ action: 'editar', id: p.id, summary: `Título (marca en minúscula): «${t}» → «${arreglado}»`, before: { title: t } });
      console.log('  marca', p.id, arreglado);
    }
    for (const k of ['rank_math_title', 'rank_math_description']) {
      const v = p.meta?.[k] || '';
      const f = v.replace(/^N8n\b/, 'n8n').replace(/^Llm-optimizer/, 'llm-optimizer');
      if (f !== v) await wp('POST', `wp/v2/posts/${p.id}`, { meta: { [k]: f } });
    }
  }
}

// ---------------------------------------------------------------- contenido
async function contenido() {
  const { filas } = await cargar();
  const enlaces = filas.map(({ p }) => ({ id: p.id, t: p.title.raw, link: p.link }));
  const cola = filas.filter(({ a }) => graves(a).some((x) => CONTENIDO.has(x.codigo)));
  console.log(`\n== Contenido: ${cola.length} artículos a mejorar`);
  await enParalelo(cola, 4, async ({ p, a }) => {
    const fallos = a.problemas.filter((x) => x.gravedad !== 'baja').map((x) => `${x.titulo}${x.detalle ? ' (' + x.detalle + ')' : ''}`);
    const r = await reescribir(p, `Mejora este artículo hasta que no tenga fallos SEO y aporte valor real: verifica en la web el estado actual del tema, corrige datos y años desfasados, amplíalo a 1.300-1.800 palabras útiles con 4-6 H2 (uno con la keyword), respuesta directa arriba, sección práctica para pymes españolas, FAQ y fuentes. Corrige en concreto: ${fallos.join('; ')}. Si hay enlaces internos rotos, sustitúyelos por artículos de la lista.`, enlaces);
    console.log(`  ✅ #${p.id} ${r.n} palabras · ${r.cambios[0] ?? ''}`.slice(0, 220));
  });
}

// ---------------------------------------------------------------- títulos y keywords
async function titulos() {
  const { filas } = await cargar();
  const cola = filas.filter(({ a }) => graves(a).some((x) => TITULO.has(x.codigo)));
  console.log(`\n== Títulos y keywords: ${cola.length} artículos`);
  const ESQ = { type: 'object', additionalProperties: false, required: ['titulo', 'keyword', 'seo_title'], properties: { titulo: { type: 'string' }, keyword: { type: 'string' }, seo_title: { type: 'string' } } };
  await enParalelo(cola, 5, async ({ p, a }) => {
    const kw = (p.meta?.rank_math_focus_keyword || '').split(',');
    const r = await ia({ nombre: 'titulo', modelo: 'gpt-5.5', esfuerzo: 'low', max: 3000, esquema: ESQ,
      sistema: `Eres un SEO sénior en España. Hoy es ${new Date().toISOString().slice(0, 10)}. Nunca inventas datos.`,
      usuario: `Corrige el título de este artículo publicado el ${p.date.slice(0, 10)}.
Problemas: ${graves(a).filter((x) => TITULO.has(x.codigo)).map((x) => x.titulo + (x.detalle ? ' — ' + x.detalle : '')).join('; ')}
Reglas: "titulo" (H1) de 45-65 caracteres que contenga la keyword de forma natural, sin comillas «» ni paréntesis de relleno, sin años que no sean el de publicación; respeta mayúsculas de marcas (ChatGPT, OpenAI, n8n…). "keyword": la búsqueda principal real (2-6 palabras, minúsculas) que el título y el texto cubren; si la actual («${kw[0]}») encaja, mantenla. "seo_title": ≤60 caracteres, empieza por la keyword con mayúscula inicial.
Título actual: ${p.title.raw}
Texto: ${plano(p.content.raw).slice(0, 2500)}` });
    const cambios = { title: mayus(r.titulo) };
    const meta = { rank_math_title: mayus(r.seo_title).slice(0, 62), rank_math_focus_keyword: [r.keyword, ...kw.slice(1).filter((k) => k && k !== r.keyword)].slice(0, 5).join(',') };
    await wp('POST', `wp/v2/posts/${p.id}`, { ...cambios, meta });
    await registrar({ action: 'editar', id: p.id, summary: `Título: «${p.title.raw}» → «${cambios.title}» (keyword «${r.keyword}»)`, before: { title: p.title.raw, meta: { rank_math_title: p.meta?.rank_math_title || '', rank_math_focus_keyword: p.meta?.rank_math_focus_keyword || '' } } });
    console.log('  ✏️', p.id, cambios.title);
  });
}

// ---------------------------------------------------------------- canibalización
async function canibal() {
  const { filas, ctx } = await cargar();
  const vistos = new Set(); const grupos = [];
  for (const { p } of filas) {
    const sim = ctx.similares.get(p.id); if (!sim || vistos.has(p.id)) continue;
    const ids = [p.id, ...sim.map((s) => s.id)].filter((id) => !vistos.has(id)); ids.forEach((i) => vistos.add(i));
    if (ids.length > 1) grupos.push(ids);
  }
  console.log(`\n== Canibalización: ${grupos.length} grupos`);
  const ESQ = { type: 'object', additionalProperties: false, required: ['articulos'], properties: { articulos: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['id', 'titulo', 'keyword', 'seo_title'], properties: { id: { type: 'integer' }, titulo: { type: 'string' }, keyword: { type: 'string' }, seo_title: { type: 'string' } } } } } };
  for (const ids of grupos) {
    const arts = ids.map((id) => filas.find((f) => f.p.id === id).p);
    const r = await ia({ nombre: 'diferenciar', modelo: 'gpt-5.5', esfuerzo: 'low', max: 4000, esquema: ESQ,
      sistema: 'Eres un SEO sénior. Resuelves canibalización dando a cada artículo una intención de búsqueda distinta y fiel a su contenido.',
      usuario: `Estos artículos compiten por la misma búsqueda. Asigna a cada uno una keyword principal DISTINTA (2-6 palabras, minúsculas) que refleje su enfoque real, un título H1 (45-65 caracteres, sin años distintos al de publicación, sin comillas ni paréntesis de relleno, con la keyword) y un seo_title ≤60.
${arts.map((p) => `#${p.id} (${p.date.slice(0, 10)}) «${p.title.raw}»: ${plano(p.content.raw).slice(0, 900)}`).join('\n\n')}` });
    for (const x of r.articulos) {
      const p = arts.find((a) => a.id === x.id); if (!p) continue;
      await wp('POST', `wp/v2/posts/${p.id}`, { title: mayus(x.titulo), meta: { rank_math_focus_keyword: x.keyword, rank_math_title: mayus(x.seo_title).slice(0, 62) } });
      await registrar({ action: 'editar', id: p.id, summary: `Canibalización resuelta: «${p.title.raw}» → «${mayus(x.titulo)}» (keyword «${x.keyword}»)`, before: { title: p.title.raw, meta: { rank_math_focus_keyword: p.meta?.rank_math_focus_keyword || '', rank_math_title: p.meta?.rank_math_title || '' } } });
      console.log('  ⚖️', p.id, mayus(x.titulo));
    }
  }
}

// ---------------------------------------------------------------- fotos
async function fotos() {
  const { indexables } = await cargar();
  const viejas = /\/wp-content\/uploads\/[^"']+\.(png|jpe?g)/i;
  const cola = [];
  for (const p of indexables) {
    let destacadaVieja = !p.featured_media;
    if (p.featured_media) { const m = (await wp('GET', `wp/v2/media/${p.featured_media}?_fields=source_url`).catch(() => null))?.data; destacadaVieja = !m || !/\.webp$/i.test(m.source_url); }
    const imgs = [...p.content.raw.matchAll(/<img\b[^>]*>/gi)].map((m) => m[0]).filter((t) => viejas.test(t));
    if (destacadaVieja || imgs.length) cola.push({ id: p.id, p, destacadaVieja, imgs: imgs.slice(0, 3) });
  }
  console.log(`\n== Fotos: ${cola.length} artículos · ${cola.filter((c) => c.destacadaVieja).length} portadas y ${cola.reduce((s, c) => s + c.imgs.length, 0)} imágenes interiores a renovar`);
  await enParalelo(cola, 3, async ({ p, destacadaVieja, imgs }) => {
    const kw = (p.meta?.rank_math_focus_keyword || '').split(',')[0] || p.title.raw;
    const n = (destacadaVieja ? 1 : 0) + imgs.length;
    const props = await proponerFotos(p.title.raw, p.content.raw, kw, n);
    const base = p.slug.slice(0, 50).replace(/-$/, '');
    let k = 0; let contenido = p.content.raw; const antes = { content: p.content.raw, featured_media: p.featured_media };
    const cambios = {};
    if (destacadaVieja) {
      const f = props[k++]; const m = await subir(`${base}-portada.webp`, await generarImagen(f.prompt), f.alt, f.titulo, f.pie);
      cambios.featured_media = m.id;
    }
    for (const tag of imgs) {
      const f = props[k++] || props[0];
      const m = await subir(`${base}-${k}.webp`, await generarImagen(f.prompt), f.alt, f.titulo, f.pie);
      const esc = (s) => String(s).replace(/"/g, '&quot;').replace(/</g, '&lt;');
      const figura = `<figure class="wp-block-image size-large tca-figura"><img src="${m.url}" alt="${esc(f.alt)}" class="wp-image-${m.id}" width="1536" height="1024" loading="lazy" decoding="async"/><figcaption>${esc(f.pie)}</figcaption></figure>`;
      const i = contenido.indexOf(tag);
      if (i < 0) continue;
      const ini = contenido.lastIndexOf('<figure', i); const finFig = contenido.indexOf('</figure>', i);
      const dentroFigura = ini >= 0 && finFig >= 0 && contenido.slice(ini, i).indexOf('</figure>') < 0;
      contenido = dentroFigura ? contenido.slice(0, ini) + figura + contenido.slice(finFig + 9) : contenido.replace(tag, figura);
    }
    if (contenido !== p.content.raw) cambios.content = contenido;
    await wp('POST', `wp/v2/posts/${p.id}`, cambios);
    await registrar({ action: 'editar', id: p.id, summary: `Fotos renovadas con gpt-image-2 (${n}) en «${p.title.raw}»`, before: antes });
    console.log(`  🖼 #${p.id} ${n} fotos`);
  });
}

const antes = fase === 'todo' ? informe((await cargar()).filas, 'ANTES') : null;
if (['marcas', 'todo'].includes(fase)) await marcas();
if (['contenido', 'todo'].includes(fase)) await contenido();
if (['titulos', 'todo'].includes(fase)) await titulos();
if (['canibal', 'todo'].includes(fase)) await canibal();
if (['fotos', 'todo'].includes(fase)) await fotos();
const { filas } = await cargar();
const despues = informe(filas, 'DESPUÉS');
for (const f of filas.filter((f) => graves(f.a).length)) console.log('  pendiente', f.p.id, f.a.score, graves(f.a).map((x) => x.codigo).join(','));
if (fase === 'todo') await gw({ action: 'tg', text: `✨ <b>Pulido SEO terminado</b>\nSalud media de los artículos indexables: ${antes.media} → <b>${despues.media}/100</b>\nProblemas críticos/altos restantes: ${Object.values(despues.cuenta).reduce((a, b) => a + b, 0)}\nFotos antiguas renovadas con gpt-image-2 en WebP. Todo queda en el historial de la app.` });
await sql.end();
