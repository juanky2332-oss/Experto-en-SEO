// RADAR IA DIARIO — cada mañana lee las fuentes de referencia de IA, descarta lo
// ya visto, un editor IA resume "qué está pasando" y puntúa qué merece artículo.
// Envía a Telegram el resumen del día + las mejores candidatas con botones
// "Preparar artículo" (prep:<id>) / "Descartar" (skip:<id>), que atiende el Publicador.
import { Flow, CRED, CHAT_ID, WP, n8n, code, OPENAI_HTTP, reqJs, checkExpr, PARSE_RESPONSES } from './lib.mjs';
import { CATEGORIAS } from './prompts.mjs';

const ID = process.argv[2] || null;
const f = new Flow('RADAR IA DIARIO (Transformaconia)');
const X = (x, y) => [x * 220, y * 180];

export const FUENTES = [
  ['TechCrunch', 'https://techcrunch.com/category/artificial-intelligence/feed/'],
  ['The Verge', 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml'],
  ['MIT Technology Review', 'https://www.technologyreview.com/topic/artificial-intelligence/feed'],
  ['OpenAI', 'https://openai.com/news/rss.xml'],
  ['Google', 'https://blog.google/technology/ai/rss/'],
  ['Google DeepMind', 'https://deepmind.google/blog/rss.xml'],
  ['Hugging Face', 'https://huggingface.co/blog/feed.xml'],
  ['Ars Technica', 'https://arstechnica.com/ai/feed/'],
  ['Xataka', 'https://www.xataka.com/tag/inteligencia-artificial/rss2.xml'],
  ['The Decoder', 'https://the-decoder.com/feed/'],
  ['MarkTechPost', 'https://www.marktechpost.com/feed/'],
  ['Wired', 'https://www.wired.com/feed/tag/ai/latest/rss'],
  ['Simon Willison', 'https://simonwillison.net/atom/everything/'],
];

const RADAR_SCHEMA = {
  type: 'object', additionalProperties: false, required: ['titular_dia', 'puntos', 'tendencia', 'seleccion'],
  properties: {
    titular_dia: { type: 'string', description: 'la frase que resume el día en IA' },
    puntos: { type: 'array', description: '4-7 cosas que hay que saber hoy', items: { type: 'object', additionalProperties: false, required: ['titulo', 'explicacion', 'idx'], properties: { titulo: { type: 'string' }, explicacion: { type: 'string', description: '1-2 frases claras para alguien de negocio' }, idx: { type: 'integer' } } } },
    tendencia: { type: 'string', description: 'qué patrón se ve esta semana y qué significa para una pyme' },
    seleccion: { type: 'array', description: 'las noticias con potencial de artículo (máx. 12), agrupando duplicadas del mismo hecho en una sola', items: { type: 'object', additionalProperties: false, required: ['idx', 'score', 'motivo', 'resumen', 'keyword', 'categoria', 'cluster'], properties: {
      idx: { type: 'integer' }, score: { type: 'integer', description: '0-100 potencial para el blog' }, motivo: { type: 'string' }, resumen: { type: 'string', description: '2 frases en español' },
      keyword: { type: 'string', description: 'keyword de búsqueda en español' }, categoria: { type: 'string', enum: Object.keys(CATEGORIAS) }, cluster: { type: 'string', description: 'tema paraguas (p. ej. "agentes de IA", "modelos de OpenAI")' } } } },
  },
};

const RADAR_SISTEMA = `Eres el editor jefe de actualidad de IA de Transformaconia (consultora española de IA y automatización para pymes). Cada mañana revisas las noticias de las últimas horas y decides dos cosas:
1) Qué tiene que saber hoy un empresario o profesional español sobre IA (resumen claro, sin jerga innecesaria, en español de España).
2) Qué noticias merecen un artículo en el blog para captar búsquedas en Google y citas en ChatGPT/Perplexity.

Puntúa alto (75-100): lanzamientos o cambios relevantes de OpenAI, Anthropic, Google, Microsoft, Meta, Mistral, DeepSeek y similares; herramientas que una pyme puede usar ya; agentes y automatización; regulación con efecto práctico (AI Act); estudios con datos sólidos sobre empleo o productividad.
Puntúa bajo (<50): rondas de financiación sin producto, papers muy académicos, opiniones, rumores, temas que el blog ya cubre (lista de artículos existentes), noticias solo relevantes para EE. UU.
Si varias noticias cuentan lo mismo, quédate con la mejor fuente y agrúpalas.
ANTICANIBALIZACIÓN: si el blog ya tiene un artículo sobre el mismo producto o el mismo anuncio (aunque el enfoque cambie un poco), puntúa por debajo de 50 y dilo en el motivo («ya cubierto en: …»); solo puntúa alto si hay un hecho nuevo importante que justifique actualizar ese artículo.
No inventes nada: usa solo lo que dicen los titulares y extractos.`;

// ---------- disparadores ----------
f.add('Cada mañana', 'n8n-nodes-base.scheduleTrigger', 1.2, { rule: { interval: [{ field: 'cronExpression', expression: '30 8 * * *' }] } }, X(0, 0));
f.add('Lanzar desde la app', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'seo-radar', authentication: 'headerAuth', responseMode: 'onReceived', options: { responseData: '{"ok":true}' } }, X(0, 1), { webhookId: 'seo-radar', credentials: CRED.gateway });

f.add('Fuentes', 'n8n-nodes-base.code', 2, code(`return ${JSON.stringify(FUENTES)}.map(([fuente, url]) => ({ json: { fuente, url } }));`), X(1, 0.5));
f.add('Leer RSS', 'n8n-nodes-base.rssFeedRead', 1.1, { url: '={{ $json.url }}', options: { ignoreSSL: false } }, X(2, 0.5), { onError: 'continueRegularOutput', alwaysOutputData: true });
f.add('Normalizar', 'n8n-nodes-base.code', 2, code(`
const fuentes = $('Fuentes').all().map(i => i.json);
const dominio = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
const porDominio = Object.fromEntries(fuentes.map(x => [dominio(x.url), x.fuente]));
const deco = (t) => String(t || '').replace(/&#(\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/&#x([0-9a-f]+);/gi, (m, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const out = [];
for (const it of $input.all()) {
  const j = it.json; if (!j || j.error || !(j.link || j.guid)) continue;
  const link = String(j.link || j.guid).trim();
  const d = dominio(link);
  const src = { fuente: porDominio[d] || Object.entries(porDominio).find(([k]) => d.endsWith(k))?.[1] || d };
  const fecha = j.isoDate || j.pubDate || j.published || j.updated || null;
  out.push({ url: link.split('#')[0], title: deco(j.title).trim(), source: src.fuente || '', published_at: fecha ? new Date(fecha).toISOString() : null,
    snippet: deco(j.contentSnippet || j.summary || j.content || '').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 400) });
}
return [{ json: { items: out } }];
`), X(3, 0.5));
f.add('Anthropic', 'n8n-nodes-base.httpRequest', 4.2, { url: 'https://www.anthropic.com/news', options: { timeout: 30000, response: { response: { responseFormat: 'text', outputPropertyName: 'html' } } } }, X(4, 0.5), { onError: 'continueRegularOutput' });
f.add('Blog actual', 'n8n-nodes-base.httpRequest', 4.2, { url: `${WP}/wp-json/wp/v2/posts?per_page=100&status=publish&_fields=id,title`, options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } } }, X(5, 0.5), { onError: 'continueRegularOutput' });
f.add('Ya vistas', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select url from seo.radar where created_at > now() - interval '30 days' union select source_url from seo.briefs where created_at > now() - interval '30 days' and source_url is not null`, options: {} },
  X(6, 0.5), { credentials: CRED.pg, alwaysOutputData: true });

f.add('Preparar editor', 'n8n-nodes-base.code', 2, code(`${PARSE_RESPONSES}
const vistas = new Set($input.all().map(i => i.json.url).filter(Boolean));
let items = $('Normalizar').first().json.items;
// Anthropic no tiene RSS: se leen los enlaces de /news
const html = String(($('Anthropic').first().json || {}).html || '');
const anth = []; const vistos = new Set();
for (const m of html.matchAll(/href="(\\/news\\/[a-z0-9-]+)"[^>]*>([\\s\\S]*?)<\\/a>/g)) {
  const url = 'https://www.anthropic.com' + m[1]; if (vistos.has(url)) continue; vistos.add(url);
  const title = m[2].replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim().slice(0, 160);
  if (title.length > 12) anth.push({ url, title, source: 'Anthropic', published_at: null, snippet: '' });
}
const primeraVezAnthropic = ![...vistas].some(u => u.includes('anthropic.com/news'));
const ahora = Date.now();
const nuevas = []; const base = [];
const titulos = new Set();
for (const it of [...items, ...anth.slice(0, 10)]) {
  if (!it.url || vistas.has(it.url)) continue;
  const clave = it.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').slice(0, 60);
  if (titulos.has(clave)) continue; titulos.add(clave);
  const edadH = it.published_at ? (ahora - Date.parse(it.published_at)) / 36e5 : 0;
  if (it.source === 'Anthropic' && primeraVezAnthropic) { base.push(it); continue; }   // línea base: no se proponen las antiguas
  if (edadH > 40) { base.push(it); continue; }
  nuevas.push(it);
}
nuevas.sort((a, b) => (b.published_at || '9') > (a.published_at || '9') ? 1 : -1);
const lista = nuevas.slice(0, 70);
const blog = (($('Blog actual').first().json || {}).body || []).map(p => '- ' + String((p.title && p.title.rendered) || '').replace(/<[^>]+>/g, '')).join('\\n');
const hoy = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const usuario = 'Hoy es ' + hoy + '.\\n\\nNOTICIAS NUEVAS (idx | fuente | fecha | titular | extracto):\\n' +
  lista.map((x, i) => i + ' | ' + x.source + ' | ' + (x.published_at || 's/f').slice(0, 16) + ' | ' + x.title + ' | ' + x.snippet.slice(0, 220)).join('\\n') +
  '\\n\\nARTÍCULOS QUE YA TIENE EL BLOG:\\n' + blog;
const sistema = ${JSON.stringify(RADAR_SISTEMA)};
${reqJs({ model: 'gpt-5.5', effort: 'low', schemaName: 'radar_ia', schema: RADAR_SCHEMA, maxTokens: 14000 })}
return [{ json: { req, lista, base, hay: lista.length > 0 } }];
`), X(7, 0.5));
f.add('Hay noticias', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.hay }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(8, 0.5));
f.add('Editor jefe IA', 'n8n-nodes-base.httpRequest', 4.2, OPENAI_HTTP, X(9, 0.5), { credentials: CRED.openai, retryOnFail: true, maxTries: 2, waitBetweenTries: 10000 });

f.add('Preparar filas', 'n8n-nodes-base.code', 2, code(`${PARSE_RESPONSES}
const e = leerRespuesta($json);
const P = $('Preparar editor').first().json;
const lista = P.lista;
const fecha = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Madrid' });
const sel = new Map(); for (const s of e.seleccion || []) if (lista[s.idx]) sel.set(s.idx, s);
const top = [...sel.values()].filter(s => s.score >= 70).sort((a, b) => b.score - a.score).slice(0, 5).map(s => s.idx);
const filas = lista.map((x, i) => { const s = sel.get(i) || {};
  return { url: x.url, title: x.title, source: x.source, published_at: x.published_at, snippet: x.snippet, resumen: s.resumen || null, score: Number.isInteger(s.score) ? s.score : null,
    motivo: s.motivo || null, keyword: s.keyword || null, categoria: s.categoria || null, cluster: s.cluster || null, status: top.includes(i) ? 'sent' : (sel.has(i) ? 'new' : 'seen'), digest_date: fecha }; });
for (const x of P.base) filas.push({ url: x.url, title: x.title, source: x.source, published_at: x.published_at, snippet: x.snippet, resumen: null, score: null, motivo: null, keyword: null, categoria: null, cluster: null, status: 'seen', digest_date: fecha });
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const dia = new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', weekday: 'long', day: 'numeric', month: 'long' });
let t = '🧠 <b>Radar IA · ' + esc(dia) + '</b>\\n\\n<b>' + esc(e.titular_dia) + '</b>\\n\\n' +
  (e.puntos || []).map(p => '• <b>' + esc(p.titulo) + '</b> — ' + esc(p.explicacion) + (lista[p.idx] ? ' <a href="' + esc(lista[p.idx].url) + '">(fuente)</a>' : '')).join('\\n') +
  '\\n\\n📈 <b>Tendencia:</b> ' + esc(e.tendencia) +
  '\\n\\n' + (top.length ? '👇 Te propongo ' + top.length + ' tema' + (top.length > 1 ? 's' : '') + ' para publicar:' : 'Hoy no veo ninguna noticia que merezca artículo. Mejor actualizar contenido existente desde la app.');
if (t.length > 4000) t = t.slice(0, 3990) + '…';
const md = '# ' + e.titular_dia + '\\n\\n' + (e.puntos || []).map(p => '- **' + p.titulo + '** — ' + p.explicacion + (lista[p.idx] ? ' ([fuente](' + lista[p.idx].url + '))' : '')).join('\\n') + '\\n\\n**Tendencia:** ' + e.tendencia;
return [{ json: { filas, fecha, telegram: t, md, editor: e } }];
`), X(10, 0.5));
f.add('Guardar radar', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.radar (url, title, source, published_at, snippet, resumen, score, motivo, keyword, categoria, cluster, status, digest_date)
select url, title, source, published_at, snippet, resumen, score, motivo, keyword, categoria, cluster, status, digest_date
from json_to_recordset($1::json) as x(url text, title text, source text, published_at timestamptz, snippet text, resumen text, score int, motivo text, keyword text, categoria text, cluster text, status text, digest_date date)
on conflict (url) do nothing
returning id, url, title, source, score, resumen, motivo, keyword, status`,
  options: { queryReplacement: '={{ [ JSON.stringify($json.filas) ] }}' } }, X(11, 0.5), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Guardar resumen', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.digests(fecha, resumen_md, data) values ($1::date, $2, $3::jsonb)
on conflict (fecha) do update set resumen_md = excluded.resumen_md, data = excluded.data, created_at = now() returning fecha`,
  options: { queryReplacement: "={{ [ $('Preparar filas').first().json.fecha, $('Preparar filas').first().json.md, JSON.stringify($('Preparar filas').first().json.editor) ] }}" } },
  X(12, 0.5), { credentials: CRED.pg, executeOnce: true });
f.add('Enviar resumen', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: "={{ $('Preparar filas').first().json.telegram }}", additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } },
  X(13, 0.5), { credentials: CRED.telegram, executeOnce: true });
f.add('Candidatas', 'n8n-nodes-base.code', 2, code(`
const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const filas = $('Guardar radar').all().map(i => i.json).filter(r => r.status === 'sent').sort((a, b) => b.score - a.score);
return filas.map(r => ({ json: { id: r.id, texto: '📌 <b>' + esc(r.title) + '</b>\\n<i>' + esc(r.source) + '</i> · ' + esc(r.url) + '\\n\\n' + esc(r.resumen) + '\\n\\n🟢 Interés ' + r.score + '/100 — ' + esc(r.motivo) + '\\n🔑 <code>' + esc(r.keyword) + '</code>' } }));
`), X(14, 0.5));
f.add('Enviar candidata', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID, text: '={{ $json.texto }}', replyMarkup: 'inlineKeyboard',
  inlineKeyboard: { rows: [{ row: { buttons: [
    { text: '📝 Preparar artículo', additionalFields: { callback_data: '={{ "prep:" + $json.id }}' } },
    { text: '🙈 Descartar', additionalFields: { callback_data: '={{ "skip:" + $json.id }}' } },
  ] } }] },
  additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true },
}, X(15, 0.5), { credentials: CRED.telegram, onError: 'continueRegularOutput' });
f.add('Guardar linea base', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.radar (url, title, source, published_at, snippet, status, digest_date)
select url, title, source, published_at, snippet, 'seen', current_date from json_to_recordset($1::json) as x(url text, title text, source text, published_at timestamptz, snippet text)
on conflict (url) do nothing`,
  options: { queryReplacement: '={{ [ JSON.stringify($json.base) ] }}' } }, X(9, 1.5), { credentials: CRED.pg });

f.link('Cada mañana', 'Fuentes');
f.link('Lanzar desde la app', 'Fuentes');
f.chain('Fuentes', 'Leer RSS', 'Normalizar', 'Anthropic', 'Blog actual', 'Ya vistas', 'Preparar editor', 'Hay noticias');
f.link('Hay noticias', 'Editor jefe IA', 0);
f.link('Hay noticias', 'Guardar linea base', 1);
f.chain('Editor jefe IA', 'Preparar filas', 'Guardar radar', 'Guardar resumen', 'Enviar resumen', 'Candidatas', 'Enviar candidata');
for (const n of f.nodes) if (['Anthropic', 'Blog actual', 'Ya vistas', 'Preparar editor', 'Candidatas'].includes(n.name)) n.executeOnce = true;

const wf = f.json({ timezone: 'Europe/Madrid', saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all' });
checkExpr(wf);
const r = await n8n.upsert(wf, ID);
await n8n.activate(r.id);
console.log('RADAR ->', r.id);
