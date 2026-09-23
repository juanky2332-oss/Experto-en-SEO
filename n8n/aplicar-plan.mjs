// Aplica el plan SEO del 2026-09-24 sobre transformaconia.com.
// Uso: node n8n/aplicar-plan.mjs [fase]   fases: papelera noindex fusiones titulos reescribir enlaces todo
// Todo cambio queda en seo.actions con su estado anterior (deshacer desde la app).
import postgres from 'postgres';
import { wp, gw } from './gw.mjs';

const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require', max: 4 });
const KEY = process.env.OPENAI_API_KEY;
const SITE = 'https://transformaconia.com';
const fase = process.argv[2] || 'todo';
const hoy = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });
const log = (...a) => console.log(...a);

const DUPLICADOS = [5953, 5950, 5946, 5959, 6263, 6088, 6056, 6777, 6780];
const FUERA_DE_FOCO = [6458, 6171, 6283, 6294];
const FUSIONES = [ // origen -> destino
  [5909, 6786], [308, 6786], [5876, 6768], [6600, 6576],
];

const registrar = (a) => sql`insert into seo.actions (origin, action, target_type, target_id, summary, before, after)
  values ('sistema', ${a.action}, ${a.tipo ?? 'post'}, ${a.id != null ? String(a.id) : null}, ${a.summary}, ${a.before ? sql.json(a.before) : null}, ${a.after ? sql.json(a.after) : null})`;
const plano = (h) => String(h || '').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const mayus = (s) => (s ? s.charAt(0).toLocaleUpperCase('es') + s.slice(1) : s);
const post = async (id) => (await wp('GET', `wp/v2/posts/${id}?context=edit&_fields=id,status,slug,link,title,content,excerpt,date,categories,meta`)).data;

async function ia({ modelo = 'gpt-5.5', esfuerzo = 'medium', sistema, usuario, esquema, nombre, max = 40000, web = false }) {
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
    log('   reintento IA:', j.error?.message || j.status);
    await new Promise((s) => setTimeout(s, 5000 * (intento + 1)));
  }
  throw new Error('OpenAI sin respuesta');
}

// ---------------------------------------------------------------- 1) papelera de duplicados
async function papelera() {
  log('\n== Papelera: borradores duplicados');
  for (const id of DUPLICADOS) {
    const p = await post(id).catch(() => null);
    if (!p || p.status !== 'draft') { log('  (saltado)', id, p?.status); continue; }
    await wp('DELETE', `wp/v2/posts/${id}`);
    await registrar({ action: 'papelera', id, summary: `Borrador duplicado a la papelera: «${p.title.raw}»`, before: { status: 'draft' } });
    log('  🗑', id, p.title.raw.slice(0, 60));
  }
}

// ---------------------------------------------------------------- 2) noindex fuera de foco
async function noindex() {
  log('\n== noindex en artículos fuera de foco');
  for (const id of FUERA_DE_FOCO) {
    const p = await post(id);
    await wp('POST', 'rankmath/v1/updateMeta', { objectType: 'post', objectID: id, meta: { rank_math_robots: ['noindex', 'follow'] } });
    await registrar({ action: 'noindex', id, summary: `noindex (fuera del foco editorial): «${p.title.raw}»` });
    log('  🚫', id, p.title.raw.slice(0, 60));
  }
}

// ---------------------------------------------------------------- 3) fusiones con 301
async function fusiones() {
  log('\n== Fusiones con redirección 301');
  const mapa = (await wp('GET', 'experto-seo/v1/redirecciones')).data || {};
  for (const [de, a] of FUSIONES) {
    const o = await post(de), d = await post(a);
    const ruta = new URL(o.link).pathname.replace(/\/?$/, '/');
    mapa[ruta] = d.link;
    if (o.status === 'publish') {
      await wp('POST', `wp/v2/posts/${de}`, { status: 'draft' });
      await registrar({ action: 'fusionar', id: de, summary: `Fusionado en #${a} «${d.title.raw}» con redirección 301 desde ${ruta}`, before: { status: 'publish' } });
    }
    log('  ↪', ruta, '→', d.link);
  }
  await wp('POST', 'experto-seo/v1/redirecciones', mapa);
  await registrar({ action: 'redirecciones', tipo: 'site', summary: `Mapa de redirecciones 301 actualizado (${Object.keys(mapa).length})`, after: mapa });
  for (const [ruta] of Object.entries(mapa)) {
    const r = await fetch(SITE + ruta, { redirect: 'manual' });
    log('   comprobación', ruta, r.status, r.headers.get('location'));
  }
}

// ---------------------------------------------------------------- 4) títulos aprobados
const NO_TITULO = new Set([...FUERA_DE_FOCO, ...FUSIONES.map((f) => f[0])]);
async function titulos() {
  log('\n== Títulos');
  const recs = await sql`select id, post_id, payload->>'cambio_titulo' as t from seo.recommendations
    where status = 'open' and post_id is not null and coalesce(payload->>'cambio_titulo','') <> '' order by id`;
  const ultimo = new Map(); for (const r of recs) ultimo.set(r.post_id, r); // la más reciente manda
  for (const [pid, r] of ultimo) {
    if (NO_TITULO.has(pid)) { await sql`update seo.recommendations set status='dismissed', resolved_at=now() where post_id=${pid} and status='open' and payload ? 'cambio_titulo'`; continue; }
    const p = await post(pid).catch(() => null);
    if (!p || p.status !== 'publish') continue;
    const nuevo = mayus(r.t.trim());
    if (nuevo === p.title.raw) continue;
    await wp('POST', `wp/v2/posts/${pid}`, { title: nuevo });
    await registrar({ action: 'editar', id: pid, summary: `Título: «${p.title.raw}» → «${nuevo}»`, before: { title: p.title.raw }, after: { title: nuevo } });
    await sql`update seo.recommendations set status='applied', resolved_at=now() where post_id=${pid} and status='open' and payload ? 'cambio_titulo'`;
    log('  ✏️', pid, nuevo);
  }
}

// ---------------------------------------------------------------- 5) reescritura con IA
const ESQ = { type: 'object', additionalProperties: false, required: ['contenido_html', 'meta_description', 'resumen_cambios'], properties: {
  contenido_html: { type: 'string' }, meta_description: { type: 'string', description: '130-155 caracteres con la keyword' }, resumen_cambios: { type: 'array', items: { type: 'string' } } } };

const REESCRITURAS = [
  { id: 6768, ins: 'Conviértelo en el ARTÍCULO PILAR de implantación de IA en pymes: guía práctica y completa (2.200-2.800 palabras) con respuesta directa arriba, fases, checklist de preparación de datos, ejemplos de procesos de pyme, cómo medir el ROI, errores habituales, tabla resumen y FAQ. Enlaza a los artículos relacionados de la lista (adopción, ROI, agentes, ventas) y a las páginas de servicios AuditorIA (https://transformaconia.com/auditoria/) y GestorIA (https://transformaconia.com/gestoria-tu-gestor-de-documentos/). Integra lo útil del artículo fusionado que te paso.', extra: [5876] },
  { id: 6786, ins: 'Actualiza y amplía el artículo sobre mercado laboral e inteligencia artificial: integra lo útil de los artículos fusionados que te paso (estudio de Stanford sobre empleo junior y senior, profesiones con más demanda), añade una sección sobre puestos junior/senior, formación interna y decisiones para pymes, corrige enlaces rotos y cita fuentes verificadas de hoy.', extra: [5909, 308] },
  { id: 6576, ins: 'Actualiza y amplía el artículo sobre Google Antigravity: integra lo útil del artículo fusionado que te paso (también trata Antigravity), busca en la web la información actual (qué es, disponibilidad, precio, cómo usarlo) y conviértelo en una guía clara para pymes con ejemplos y FAQ.', extra: [6600] },
  { id: 6807, ins: 'Actualiza el artículo con la novedad de que ChatGPT Voice puede conectarse a email, calendario y Slack (busca en la web la información oficial y fecha), añade una sección de riesgos de permisos y privacidad al conectar asistentes de voz a herramientas de trabajo, y casos de uso para comerciales y gerencia. Mantén todo lo que sigue siendo válido.' },
  { id: 6760, ins: 'Rehazlo como guía comercial de agentes de IA en ventas: usos reales, límites legales y comerciales, ejemplos de flujos (captación, seguimiento, CRM), métricas, tabla de casos de uso y FAQ. Cita fuentes verificadas. Enlaza artículos de agentes, automatización y n8n de la lista.' },
  { id: 6258, ins: 'Conviértelo en una guía evergreen «Cómo medir el ROI de la IA en una pyme»: método de cálculo paso a paso, costes (licencias, tiempo, implantación), ahorro de tiempo, riesgos, ejemplos de procesos con números ilustrativos claramente marcados como ejemplo, definición breve al principio y FAQ. Quita referencias caducadas.' },
  { id: 6514, ins: 'Conviértelo en una comparativa de herramientas de automatización con IA para pymes en español: criterios de elección, tabla por caso de uso (sin inventar rankings ni precios que no puedas verificar hoy en la web), cuándo usar cada una y FAQ. Enlaza artículos de n8n, Agentic RAG y agentes de la lista.' },
];

async function reescribir(item, enlaces) {
  const p = await post(item.id);
  const kw = (p.meta?.rank_math_focus_keyword || '').split(',')[0];
  const extra = [];
  for (const id of item.extra || []) { const e = await post(id).catch(() => null); if (e) extra.push(`--- ${e.title.raw} ---\n${plano(e.content.raw).slice(0, 6000)}`); }
  const estilos = p.content.raw.match(/<style[\s\S]*?<\/style>/i)?.[0] ?? '';
  const cuerpo = p.content.raw.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '');
  const r = await ia({
    nombre: 'reescritura', web: true, esquema: ESQ,
    sistema: `Eres Juan Carlos Ros, consultor y desarrollador de IA y automatización en Transformaconia (España). Hoy es ${hoy}. Escribes en español de España, directo, con criterio y sin relleno, para posicionar en Google (top 3) y ser citado por ChatGPT, Perplexity, Gemini y AI Overviews.
Reglas:
- Devuelve el HTML COMPLETO del cuerpo del artículo: sin <h1>, sin <style>, sin <script>. Conserva las <figure>/<img> existentes tal cual (con sus atributos).
- Primer párrafo de 40-70 palabras que responda directamente a la pregunta principal e incluya la keyword «${kw}».
- 4-7 H2 con id en kebab-case sin tildes (uno contiene la keyword); H3 donde haga falta; párrafos de 2-4 frases; listas con <strong>término:</strong>; una <table> si hay comparación.
- Datos, cifras, versiones y fechas SOLO si están en el texto actual, en los artículos fusionados o los has verificado hoy con la búsqueda web (y entonces cita la fuente con enlace <a href="..." target="_blank" rel="noopener">).
- Enlaces internos: 3-6, SOLO de la lista que te doy, con anclas descriptivas.
- Termina con <h2 id="preguntas-frecuentes">Preguntas frecuentes</h2> con 3-5 <h3> + <p> (40-70 palabras, respuesta directa en la primera frase) y después <h2 id="fuentes">Fuentes</h2> con una <ul> de enlaces.
- Cierre final: <aside class="tca-autor"><p><strong>Sobre el autor.</strong> Juan Carlos Ros es consultor y desarrollador de inteligencia artificial y automatización en Transformaconia, donde diseña agentes de IA y flujos automatizados para pymes españolas.</p><p><strong>¿Quieres aplicarlo en tu empresa?</strong> Cuéntanos tu caso en <a href="mailto:info@transformaconia.com">info@transformaconia.com</a> y te respondemos en menos de 24 horas.</p></aside>
- Nunca uses: "en el mundo actual", "sin duda", "cabe destacar", "revolucionario", "disruptivo", "en conclusión".`,
    usuario: `INSTRUCCIÓN: ${item.ins}
Título actual: ${p.title.raw} · Publicado: ${p.date.slice(0, 10)} · Keyword: ${kw}

ARTÍCULOS DEL BLOG QUE PUEDES ENLAZAR:
${enlaces.filter((e) => e.id !== item.id).map((e) => `- ${e.t} → ${e.link}`).join('\n')}
${extra.length ? `\nMATERIAL DE LOS ARTÍCULOS FUSIONADOS:\n${extra.join('\n\n')}` : ''}

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
  const palabras = plano(nuevo).split(' ').length;
  if (palabras < plano(p.content.raw).split(' ').length * 0.8) throw new Error(`#${item.id}: la reescritura sale más corta (${palabras} palabras); no la aplico`);
  await wp('POST', `wp/v2/posts/${item.id}`, { content: nuevo, meta: { rank_math_description: mayus(r.meta_description) } });
  await registrar({ action: 'editar', id: item.id, summary: `Reescrito con IA (${palabras} palabras): ${r.resumen_cambios.slice(0, 3).join('; ')} — «${p.title.raw}»`, before: { content: p.content.raw, meta: { rank_math_description: p.meta?.rank_math_description || '' } }, after: { palabras } });
  log(`  ✅ #${item.id} ${palabras} palabras · ${r.resumen_cambios.slice(0, 2).join(' / ')}`);
}

async function reescribirTodo() {
  log('\n== Reescritura con IA y búsqueda web');
  const pubs = (await wp('GET', 'wp/v2/posts?context=edit&per_page=100&status=publish&_fields=id,title,link,content,meta')).data;
  const enlaces = pubs.filter((p) => !FUERA_DE_FOCO.includes(p.id)).map((p) => ({ id: p.id, t: p.title.raw, link: p.link }));
  // además: los que siguen indexados con contenido pobre (<650 palabras)
  const fijos = new Set(REESCRITURAS.map((r) => r.id));
  const pobres = pubs.filter((p) => !fijos.has(p.id) && !FUERA_DE_FOCO.includes(p.id) && plano(p.content.raw).split(' ').length < 650)
    .map((p) => ({ id: p.id, ins: 'Actualiza y amplía este artículo hasta 1.300-1.700 palabras útiles: verifica en la web la información actual del tema (qué ha pasado después, estado de hoy), corrige años y datos desfasados, estructura en 4-6 H2 con respuesta directa arriba, añade una sección práctica para pymes españolas, FAQ y fuentes. Mantén el enfoque original.' }));
  log(`  ${REESCRITURAS.length} artículos del plan + ${pobres.length} con contenido pobre`);
  const cola = [...REESCRITURAS, ...pobres];
  let i = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (i < cola.length) { const it = cola[i++]; try { await reescribir(it, enlaces); } catch (e) { log('  ✗', it.id, e.message.slice(0, 160)); } }
  }));
  await sql`update seo.recommendations set status='applied', resolved_at=now() where status='open' and post_id = any(${[...fijos]})`;
}

// ---------------------------------------------------------------- 6) enlazado interno
async function enlaces() {
  log('\n== Enlazado interno (huérfanos y enlaces rotos)');
  const pubs = (await wp('GET', 'wp/v2/posts?context=edit&per_page=100&status=publish&_fields=id,title,link,content,categories,meta')).data;
  const mapa = (await wp('GET', 'experto-seo/v1/redirecciones')).data || {};
  const norm = (u) => u.replace(/[?#].*$/, '').replace(/\/?$/, '/');
  const validos = new Set(pubs.map((p) => norm(p.link)));
  const indexables = pubs.filter((p) => !FUERA_DE_FOCO.includes(p.id));
  const pal = (p) => new Set(`${p.title.raw} ${(p.meta?.rank_math_focus_keyword || '')}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9]+/).filter((w) => w.length > 3));
  const firmas = new Map(indexables.map((p) => [p.id, pal(p)]));
  const entrantes = new Map(indexables.map((p) => [p.id, 0]));
  for (const p of indexables) for (const m of p.content.raw.matchAll(/href=["'](https:\/\/transformaconia\.com\/[^"'#?]+)/g)) {
    const d = indexables.find((x) => norm(x.link) === norm(m[1])); if (d && d.id !== p.id) entrantes.set(d.id, entrantes.get(d.id) + 1);
  }
  let arreglados = 0, bloques = 0;
  for (const p of indexables) {
    let c = p.content.raw; const antes = c;
    // enlaces rotos: a fusionados → destino; a borradores/inexistentes → se quita el enlace y queda el texto
    c = c.replace(/<a\s([^>]*?)href=["'](https?:\/\/transformaconia\.com\/[^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi, (m, a1, url, a2, txt) => {
      if (/wp-content|\/category\/|\/tag\/|\/author\/|#/.test(url) || url === SITE + '/' ) return m;
      const n = norm(url); const ruta = new URL(n).pathname;
      if (validos.has(n)) return m;
      if (mapa[ruta]) return `<a ${a1}href="${mapa[ruta]}"${a2}>${txt}</a>`;
      return txt;
    });
    if (c !== antes) arreglados++;
    // bloque "Sigue leyendo": 3 relacionados, priorizando huérfanos de la misma categoría
    if (!/class="tca-relacionados"/.test(c)) {
      const f = firmas.get(p.id);
      const cand = indexables.filter((x) => x.id !== p.id && !c.includes(norm(x.link).replace(/\/$/, '')))
        .map((x) => { const g = firmas.get(x.id); const comunes = [...f].filter((w) => g.has(w)).length; const misma = x.categories.some((k) => p.categories.includes(k)) ? 2 : 0; const huerf = entrantes.get(x.id) === 0 ? 1.5 : 0; return { x, s: comunes * 2 + misma + huerf }; })
        .filter((o) => o.s >= 2).sort((a, b) => b.s - a.s).slice(0, 3).map((o) => o.x);
      if (cand.length) {
        const bloque = `<aside class="tca-relacionados"><p><strong>Sigue leyendo</strong></p><ul>${cand.map((x) => `<li><a href="${x.link}">${x.title.raw.replace(/</g, '&lt;')}</a></li>`).join('')}</ul></aside>`;
        c = /<aside class="tca-autor"/.test(c) ? c.replace(/<aside class="tca-autor"/, bloque + '<aside class="tca-autor"') : c.replace(/(<script type="application\/ld\+json">[\s\S]*<\/script>\s*)?$/, (m) => bloque + m);
        cand.forEach((x) => entrantes.set(x.id, entrantes.get(x.id) + 1));
        bloques++;
      }
    }
    if (c !== antes) {
      await wp('POST', `wp/v2/posts/${p.id}`, { content: c });
      await registrar({ action: 'editar', id: p.id, summary: `Enlazado interno (relacionados / enlaces rotos) en «${p.title.raw}»`, before: { content: antes } });
    }
  }
  const huerfanos = [...entrantes.values()].filter((v) => v === 0).length;
  log(`  ${bloques} bloques «Sigue leyendo» · ${arreglados} artículos con enlaces rotos corregidos · huérfanos restantes: ${huerfanos}`);
}

if (['papelera', 'todo'].includes(fase)) await papelera();
if (['noindex', 'todo'].includes(fase)) await noindex();
if (['fusiones', 'todo'].includes(fase)) await fusiones();
if (['titulos', 'todo'].includes(fase)) await titulos();
if (['reescribir', 'todo'].includes(fase)) await reescribirTodo();
if (['enlaces', 'todo'].includes(fase)) await enlaces();
if (fase === 'todo') {
  await sql`update seo.recommendations set status='applied', resolved_at=now() where status='open' and tipo in ('eliminar','fusionar','tecnico')`;
  await gw({ action: 'tg', text: '🛠 <b>Plan SEO aplicado</b> en transformaconia.com: duplicados a la papelera, noindex en temas fuera de foco, fusiones con 301, títulos corregidos, artículos clave reescritos y enlazado interno. Todo en el historial de la app con opción de deshacer.' });
}
log('\nFIN');
await sql.end();
