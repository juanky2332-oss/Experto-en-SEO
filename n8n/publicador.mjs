// PUBLICADOR v3 — transformaconia.com
// Telegram (enlace o botón del radar) / app  ->  brief editorial  ->  aprobación
// ->  investigación web  ->  redacción  ->  control de calidad SEO (+ revisión)
// ->  3 fotos gpt-image-2 en WebP  ->  WordPress + Rank Math + IndexNow  ->  informe.
// Cualquier otro mensaje o botón "app:*" se reenvía a la app Experto en SEO.
import fs from 'node:fs';
import { Flow, CRED, CHAT_ID, WP, APP_URL, n8n, code, OPENAI_HTTP, reqJs, checkExpr, PARSE_RESPONSES } from './lib.mjs';
import { CATEGORIAS, BRIEF_SCHEMA, BRIEF_SISTEMA, INVESTIGACION_SCHEMA, ARTICULO_SCHEMA, REDACCION_SISTEMA, QC_JS } from './prompts.mjs';

const ID = process.argv[2] || 'rzxO46Wfc2eJcD7x';
const f = new Flow('Transformaconia - Publicador IA SEO v3');
const X = (x, y) => [x * 220, y * 180];
const tg = CRED.telegram;
const HTML = { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true };

// Utilidades compartidas dentro de los Code nodes
const UTIL = `
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const decode = (s) => String(s || '').replace(/&#8217;|&#8216;/g, "'").replace(/&#8220;|&#8221;|&quot;/g, '"').replace(/&#8211;/g, '–').replace(/&#8212;/g, '—').replace(/&#8230;/g, '…').replace(/&amp;/g, '&').replace(/&#(\\d+);/g, (m, d) => String.fromCodePoint(+d)).replace(/<[^>]+>/g, '');
const hoyMadrid = () => new Date().toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid', day: 'numeric', month: 'long', year: 'numeric' });
const anio = () => +new Date().toLocaleDateString('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric' });
`;

// =====================================================================
// ENTRADAS
// =====================================================================
f.add('Telegram', 'n8n-nodes-base.telegramTrigger', 1.2, { updates: ['message', 'callback_query'], additionalFields: {} }, X(0, 2),
  { credentials: tg, webhookId: 'a94a5966-cd65-4565-99d0-3f2944680813' });
f.add('Webhook app', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'seo-publicador', authentication: 'headerAuth', responseMode: 'onReceived', options: { responseData: '{"ok":true}' } }, X(0, 5),
  { webhookId: 'seo-publicador', credentials: CRED.gateway });

f.add('Enrutar entrada', 'n8n-nodes-base.code', 2, code(`
const CHAT = '${CHAT_ID}';
const j = $json;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
if (j.body && j.headers) {                      // llamada desde la app
  const b = j.body || {};
  const map = { brief_url: 'url', brief_radar: 'prep', publish: 'publish', reject: 'reject' };
  return [{ json: { route: map[b.action] || 'ignore', url: b.url || null, radar_id: b.radar_id ? +b.radar_id : null, brief_id: b.brief_id || null, origin: 'app', chatId: CHAT } }];
}
const cq = j.callback_query;
const chatId = String(cq ? (cq.message && cq.message.chat && cq.message.chat.id) : (j.message && j.message.chat && j.message.chat.id) || '');
if (chatId !== CHAT) return [{ json: { route: 'ignore', chatId } }];   // el bot solo obedece a Juanky
if (cq) {
  const data = String(cq.data || '');
  const i = data.indexOf(':'); const k = i < 0 ? data : data.slice(0, i); const v = i < 0 ? '' : data.slice(i + 1);
  const base = { chatId: CHAT, callback_id: cq.id, message_id: cq.message && cq.message.message_id };
  if (k === 'publish' && UUID.test(v)) return [{ json: { ...base, route: 'publish', brief_id: v, origin: 'telegram', aviso: '✍️ Redactando el artículo…' } }];
  if (k === 'reject' && UUID.test(v)) return [{ json: { ...base, route: 'reject', brief_id: v, aviso: 'Descartado' } }];
  if (k === 'prep' && /^\\d+$/.test(v)) return [{ json: { ...base, route: 'prep', radar_id: +v, origin: 'radar', aviso: '🔎 Preparando el resumen…' } }];
  if (k === 'skip' && /^\\d+$/.test(v)) return [{ json: { ...base, route: 'skip', radar_id: +v, aviso: 'Noticia descartada' } }];
  if (k === 'publish' || k === 'reject') return [{ json: { ...base, route: 'legacy', aviso: 'Botón antiguo' } }];
  return [{ json: { ...base, route: 'app', update: j, aviso: '' } }];
}
const text = String((j.message && (j.message.text || j.message.caption)) || '');
const m = text.match(/https?:\\/\\/[^\\s<>"]+/);
if (m && !text.trim().startsWith('/')) return [{ json: { route: 'url', url: m[0].replace(/[).,;]+$/, ''), chatId: CHAT, origin: 'telegram' } }];
return [{ json: { route: 'app', chatId: CHAT, update: j } }];
`), X(1, 3));

f.add('Es boton', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.callback_id || "" }}', rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } }] }, options: {},
}, X(2, 0));
f.add('Responder boton', 'n8n-nodes-base.telegram', 1.2, { resource: 'callback', queryId: '={{ $json.callback_id }}', additionalFields: { text: '={{ $json.aviso || "" }}' } }, X(3, 0), { credentials: tg, onError: 'continueRegularOutput' });

const RUTAS = ['url', 'prep', 'publish', 'reject', 'skip', 'legacy', 'app'];
f.add('Ruta', 'n8n-nodes-base.switch', 3.2, {
  rules: { values: RUTAS.map((r) => ({
    conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
      conditions: [{ leftValue: '={{ $json.route }}', rightValue: r, operator: { type: 'string', operation: 'equals' } }] },
    renameOutput: true, outputKey: r,
  })) }, options: {},
}, X(2, 3));

f.link('Telegram', 'Enrutar entrada');
f.link('Webhook app', 'Enrutar entrada');
f.link('Enrutar entrada', 'Es boton');
f.link('Es boton', 'Responder boton', 0);
f.link('Enrutar entrada', 'Ruta');

// ---------- rutas sencillas ----------
f.add('Brief descartado', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with b as (update seo.briefs set status='rejected', updated_at=now() where id=$1::uuid and status <> 'published' returning id, source_title)
insert into seo.actions(origin, action, target_type, target_id, summary) select $2, 'descartar_brief', 'brief', b.id::text, 'Descartado: ' || coalesce(b.source_title,'') from b returning summary`,
  options: { queryReplacement: '={{ [ $json.brief_id, $json.origin || "telegram" ] }}' } }, X(3, 5.2), { credentials: CRED.pg });
f.add('Radar descartado', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with r as (update seo.radar set status='skipped' where id=$1::bigint returning id, title)
insert into seo.actions(origin, action, target_type, target_id, summary) select 'telegram', 'descartar_noticia', 'radar', r.id::text, 'Noticia descartada: ' || r.title from r returning summary`,
  options: { queryReplacement: '={{ [ $json.radar_id ] }}' } }, X(3, 6), { credentials: CRED.pg });
f.add('Aviso boton antiguo', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: 'Ese botón es de la versión anterior del publicador. Reenvíame el enlace de la noticia y lo preparo con el sistema nuevo.', additionalFields: HTML }, X(3, 6.8), { credentials: tg });
f.add('Pasar a la app', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${APP_URL}/api/telegram`, authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
  sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.update) }}',
  options: { timeout: 120000, response: { response: { neverError: true } } },
}, X(3, 7.6), { credentials: CRED.gateway, onError: 'continueRegularOutput' });
f.link('Ruta', 'Brief descartado', 3);
f.link('Ruta', 'Radar descartado', 4);
f.link('Ruta', 'Aviso boton antiguo', 5);
f.link('Ruta', 'Pasar a la app', 6);

// =====================================================================
// A) BRIEF: leer la noticia y proponerla por Telegram
// =====================================================================
f.add('Radar a URL', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.radar set status='prepared' where id=$1::bigint returning url, title`,
  options: { queryReplacement: '={{ [ $json.radar_id ] }}' } }, X(3, 1.6), { credentials: CRED.pg });
f.add('Preparar lectura', 'n8n-nodes-base.code', 2, code(`
const r = $('Enrutar entrada').first().json;
const url = $json.url || r.url;
if (!url) throw new Error('No hay URL que leer');
return [{ json: { url, chatId: r.chatId, origin: r.origin || 'telegram', radar_id: r.radar_id || null } }];
`), X(4, 1));
f.add('Escribiendo', 'n8n-nodes-base.telegram', 1.2, { operation: 'sendChatAction', chatId: CHAT_ID }, X(5, 0), { credentials: tg, onError: 'continueRegularOutput' });
f.add('Descargar noticia', 'n8n-nodes-base.httpRequest', 4.2, {
  url: '={{ $json.url }}', sendHeaders: true, specifyHeaders: 'json',
  jsonHeaders: JSON.stringify({ 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36', Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8' }),
  options: { timeout: 30000, redirect: { redirect: { followRedirects: true, maxRedirects: 5 } }, response: { response: { responseFormat: 'text', outputPropertyName: 'data' } } },
}, X(5, 1), { onError: 'continueErrorOutput' });
f.add('Lector Jina', 'n8n-nodes-base.httpRequest', 4.2, {
  url: "=https://r.jina.ai/{{ $('Preparar lectura').first().json.url }}", sendHeaders: true, specifyHeaders: 'json',
  jsonHeaders: JSON.stringify({ Accept: 'text/plain', 'X-Return-Format': 'markdown' }),
  options: { timeout: 60000, response: { response: { responseFormat: 'text', outputPropertyName: 'data' } } },
}, X(6, 2), { onError: 'continueRegularOutput' });
f.add('Extraer contenido', 'n8n-nodes-base.code', 2, code(fs.readFileSync(new URL('./extraer_contenido.js', import.meta.url), 'utf8')), X(7, 1), { onError: 'continueErrorOutput' });
f.add('Aviso lectura fallida', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID,
  text: "=⚠️ No he podido leer esta noticia:\n{{ $('Preparar lectura').first().json.url }}\n\nMotivo: {{ ($json.error && $json.error.message) || $json.error || 'la web bloquea la lectura automática' }}\n\nPrueba con otra fuente o pégame directamente el texto.",
  additionalFields: { appendAttribution: false, disable_web_page_preview: true },
}, X(8, 2), { credentials: tg });

f.add('Inventario blog', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/posts?per_page=100&status=publish&_fields=id,title,link`,
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(8, 1));

f.add('Preparar brief', 'n8n-nodes-base.code', 2, code(`${UTIL}
const d = $('Extraer contenido').first().json;
const posts = Array.isArray($json.body) ? $json.body : [];
const inventario = posts.map(p => '- [' + p.id + '] ' + decode(p.title && p.title.rendered)).join('\\n');
const cats = ${JSON.stringify(Object.entries(CATEGORIAS).map(([k, v]) => `- ${k}: ${v}`).join('\n'))};
const usuario = 'FECHA DE HOY: ' + hoyMadrid() + '\\n\\n' +
  'NOTICIA\\nTítulo: ' + d.title + '\\nFuente: ' + d.source + '\\nURL: ' + d.link + '\\n' +
  'Subtítulos originales: ' + JSON.stringify(d.h2_originales || []) + '\\n\\nTEXTO FUENTE:\\n' + String(d.content_markdown || '').slice(0, 14000) +
  '\\n\\nCATEGORÍAS DEL BLOG:\\n' + cats +
  '\\n\\nARTÍCULOS QUE YA TIENE EL BLOG (para detectar canibalización):\\n' + inventario;
const sistema = ${JSON.stringify(BRIEF_SISTEMA)};
${reqJs({ model: 'gpt-5.5', effort: 'low', schemaName: 'brief_editorial', schema: BRIEF_SCHEMA, maxTokens: 12000 })}
return [{ json: { req } }];
`), X(9, 1));

f.add('Brief editorial', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(10, 1), { credentials: CRED.openai, retryOnFail: true, maxTries: 2, waitBetweenTries: 5000 });

f.add('Parsear brief', 'n8n-nodes-base.code', 2, code(`${UTIL}${PARSE_RESPONSES}
const b = leerRespuesta($json);
const d = $('Extraer contenido').first().json;
const semaforo = b.interes >= 75 ? '🟢' : b.interes >= 55 ? '🟡' : '🔴';
let t = '📰 <b>' + esc(b.titular) + '</b>\\n' + '<i>' + esc(d.source) + '</i> · ' + esc(d.link) + '\\n\\n' +
  '<b>En una línea:</b> ' + esc(b.resumen_linea) + '\\n\\n' +
  '<b>Qué ha pasado:</b> ' + esc(b.que_ha_pasado) + '\\n\\n' +
  '<b>Por qué importa:</b> ' + esc(b.por_que_importa) + '\\n\\n' +
  '<b>Dato clave:</b> ' + esc(b.dato_clave) + '\\n\\n' +
  semaforo + ' <b>Interés ' + b.interes + '/100</b> — ' + (b.publicar ? 'recomiendo publicarla' : 'no recomiendo publicarla') + '. ' + esc(b.motivo) + '\\n' +
  '🎯 ' + esc(b.angulo) + ' · ' + esc(b.vigencia) + ' · ' + esc(b.categoria) + '\\n' +
  '🔑 <code>' + esc(b.keyword_principal) + '</code> (' + esc(b.intencion) + ')\\n' +
  '❓ ' + b.preguntas.slice(0, 3).map(esc).join(' · ');
if (b.canibaliza && b.canibaliza.post_id) t += '\\n\\n⚠️ <b>Ya tienes algo parecido:</b> ' + esc(b.canibaliza.titulo) + ' (#' + b.canibaliza.post_id + '). ' + esc(b.canibaliza.recomendacion);
if (t.length > 3900) t = t.slice(0, 3890) + '…';
const p = $('Preparar lectura').first().json;
return [{ json: { brief: b, telegram: t, origin: p.origin, radar_id: p.radar_id ? String(p.radar_id) : '', url: d.link, titulo: d.title, fuente: d.source, texto: String(d.content_markdown || '').slice(0, 16000) } }];
`), X(11, 1));

f.add('Guardar brief', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.briefs(origin, source_url, source_title, source_name, source_text, brief, radar_id)
values ($1, $2, $3, $4, $5, $6::jsonb, nullif($7,'')::bigint) returning id`,
  options: { queryReplacement: '={{ [ $json.origin, $json.url, $json.titulo, $json.fuente, $json.texto, JSON.stringify($json.brief), $json.radar_id ] }}' } }, X(12, 1), { credentials: CRED.pg });

f.add('Enviar brief', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID, text: "={{ $('Parsear brief').first().json.telegram }}", replyMarkup: 'inlineKeyboard',
  inlineKeyboard: { rows: [{ row: { buttons: [
    { text: '✅ Redactar y publicar', additionalFields: { callback_data: '={{ "publish:" + $json.id }}' } },
    { text: '❌ Descartar', additionalFields: { callback_data: '={{ "reject:" + $json.id }}' } },
  ] } }] },
  additionalFields: HTML,
}, X(13, 1), { credentials: tg });

f.link('Ruta', 'Preparar lectura', 0);
f.link('Ruta', 'Radar a URL', 1);
f.link('Radar a URL', 'Preparar lectura');
f.link('Preparar lectura', 'Escribiendo');
f.link('Preparar lectura', 'Descargar noticia');
f.link('Descargar noticia', 'Extraer contenido', 0);
f.link('Descargar noticia', 'Lector Jina', 1);
f.link('Lector Jina', 'Extraer contenido');
f.link('Extraer contenido', 'Inventario blog', 0);
f.link('Extraer contenido', 'Aviso lectura fallida', 1);
f.chain('Inventario blog', 'Preparar brief', 'Brief editorial', 'Parsear brief', 'Guardar brief', 'Enviar brief');

// =====================================================================
// B) PUBLICAR: redactar, controlar calidad, imágenes y WordPress
// =====================================================================
const Y = 9; // fila base de esta rama
f.add('Bloquear brief', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.briefs set status='generating', updated_at=now(), error=null
where id=$1::uuid and (status in ('pending','failed','rejected') or (status='generating' and updated_at < now() - interval '20 minutes'))
returning id, source_url, source_title, source_name, source_text, brief, origin, radar_id,
 (select value from seo.settings where key='publicacion') as ajustes`,
  options: { queryReplacement: '={{ [ $json.brief_id ] }}' } }, X(3, Y), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Brief libre', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.id || "" }}', rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } }] }, options: {},
}, X(4, Y));
f.add('Aviso ya en marcha', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: 'Ese artículo ya se está redactando o ya está publicado. Si algo se quedó colgado, vuelve a pulsar dentro de 20 minutos.', additionalFields: HTML }, X(5, Y + 1), { credentials: tg });
f.add('Aviso redactando', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: "=✍️ Redactando <b>{{ $json.brief.titular }}</b>\nInvestigo la actualidad, escribo, reviso el SEO y genero 3 fotos. Tardo unos 4-7 minutos; te aviso al terminar.", additionalFields: HTML }, X(5, Y - 1), { credentials: tg, onError: 'continueRegularOutput' });

f.add('Inventario enlaces', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/posts?per_page=100&status=publish&_fields=id,title,link,excerpt,categories,date`,
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(5, Y));
f.add('Categorias', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug`,
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(6, Y));

f.add('Preparar investigacion', 'n8n-nodes-base.code', 2, code(`${UTIL}
const r = $('Bloquear brief').first().json; const b = r.brief;
const usuario = 'Fecha de hoy: ' + hoyMadrid() + '.\\nTema: ' + b.titular + '\\nKeyword: ' + b.keyword_principal + '\\nEntidades: ' + b.entidades.join(', ') +
  '\\nFuente original: ' + r.source_url + '\\n\\nBusca en la web la información MÁS RECIENTE y fiable sobre este tema: anuncio oficial, documentación, precios o disponibilidad, reacciones de medios de referencia y datos que un lector necesitaría. Devuelve 5-10 hechos concretos con su URL exacta. Solo fuentes primarias o medios de referencia; nada de blogs de SEO ni agregadores. Si algo no lo puedes confirmar, no lo incluyas.';
const sistema = 'Eres un documentalista riguroso. Respondes solo con hechos verificados en fuentes que has consultado, siempre con su URL.';
${reqJs({ model: 'gpt-5.5', effort: 'low', tools: [{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', country: 'ES' } }], schemaName: 'investigacion', schema: INVESTIGACION_SCHEMA, maxTokens: 12000 })}
return [{ json: { req } }];
`), X(7, Y));
f.add('Investigar actualidad', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(8, Y), { credentials: CRED.openai, onError: 'continueRegularOutput' });

f.add('Preparar redaccion', 'n8n-nodes-base.code', 2, code(`${UTIL}${PARSE_RESPONSES}
const r = $('Bloquear brief').first().json; const b = r.brief;
let inv = { hechos: [], contexto: '' }, citas = [];
try { inv = leerRespuesta($json); citas = fuentesWeb($json); } catch (e) { inv = { hechos: [], contexto: '' }; }
// candidatos a enlace interno: por solapamiento de palabras con la keyword/entidades
const posts = (($('Inventario enlaces').first().json.body) || []).map(p => ({ id: p.id, t: decode(p.title && p.title.rendered), link: p.link, ex: decode(p.excerpt && p.excerpt.rendered).slice(0, 160), date: p.date }));
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
const claves = norm([b.keyword_principal, ...b.keywords_secundarias, ...b.entidades, b.titular].join(' ')).split(/[^a-z0-9]+/).filter(w => w.length > 3);
const puntuados = posts.map(p => { const t = norm(p.t + ' ' + p.ex); return { ...p, s: claves.reduce((a, w) => a + (t.includes(w) ? 1 : 0), 0) }; })
  .sort((a, b2) => b2.s - a.s || (b2.date > a.date ? 1 : -1)).slice(0, 14);
const internos = puntuados.map(p => '- ' + p.t + ' → ' + p.link).join('\\n');
const hechosFuente = b.hechos.map(h => '- ' + h.dato + ' (cita: "' + h.cita + '")').join('\\n');
const hechosWeb = (inv.hechos || []).map(h => '- ' + h.dato + ' — ' + h.fuente + ' (' + h.url + ')').join('\\n');
const urlsFuente = [r.source_url, ...(inv.hechos || []).map(h => h.url), ...citas.map(c => c.url)].filter(Boolean);
const sistema = ${JSON.stringify(REDACCION_SISTEMA)}.split('{{HOY}}').join(hoyMadrid()).split('{{ANIO}}').join(String(anio()));
const usuario = [
  'BRIEF APROBADO', 'Titular: ' + b.titular, 'Ángulo: ' + b.angulo + ' · Vigencia: ' + b.vigencia + ' · Intención: ' + b.intencion,
  'Keyword principal: ' + b.keyword_principal, 'Keywords secundarias: ' + b.keywords_secundarias.join(', '),
  'Categoría sugerida: ' + b.categoria, 'Preguntas a responder: ' + b.preguntas.join(' | '),
  'Qué ha pasado: ' + b.que_ha_pasado, 'Por qué importa: ' + b.por_que_importa, 'Dato clave: ' + b.dato_clave,
  '', 'HECHOS DE LA FUENTE (' + r.source_name + ' — ' + r.source_url + '):', hechosFuente,
  '', 'INVESTIGACIÓN ACTUAL (búsqueda web de hoy):', inv.contexto || '(sin datos adicionales)', hechosWeb,
  '', 'URLs EXTERNAS PERMITIDAS:', [...new Set(urlsFuente)].slice(0, 12).join('\\n'),
  '', 'ARTÍCULOS DEL BLOG PARA ENLAZAR (usa 3-5, solo estas URLs):', internos,
  '', 'TEXTO FUENTE (referencia):', String(r.source_text || '').slice(0, 9000),
].join('\\n');
${reqJs({ model: 'gpt-5.5', effort: 'medium', schemaName: 'articulo', schema: ARTICULO_SCHEMA, maxTokens: 40000 })}
return [{ json: { req, sistema, usuario, urls_internas: posts.map(p => p.link), investigacion: inv, citas } }];
`), X(9, Y));

f.add('Redactar articulo', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(10, Y), { credentials: CRED.openai, retryOnFail: true, maxTries: 2, waitBetweenTries: 10000 });

const QC_NODE = (fuente) => `${UTIL}${PARSE_RESPONSES}${QC_JS}
const r = $('Bloquear brief').first().json;
const prep = $('Preparar redaccion').first().json;
const a = leerRespuesta($json);
a.slug = String(a.slug || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 8).join('-').slice(0, 60).replace(/-$/, '');
const ctx = { anio: anio(), vigencia: r.brief.vigencia, fuenteTexto: String(r.source_text || '') + JSON.stringify(prep.investigacion || {}),
  urlsInternas: new Set((prep.urls_internas || []).map(u => u.replace(/\\/?$/, '/'))), hayInternos: (prep.urls_internas || []).length > 3 };
const ev = evaluar(a, ctx);
const minimo = +((r.ajustes || {}).score_minimo || 80);
return [{ json: { articulo: a, score: ev.score, issues: ev.issues, metricas: ev.metricas, minimo, necesita_revision: ev.score < 90, origen: '${fuente}' } }];
`;
f.add('Control calidad', 'n8n-nodes-base.code', 2, code(QC_NODE('primera')), X(11, Y));
f.add('Necesita revision', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.necesita_revision }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(12, Y));
f.add('Preparar revision', 'n8n-nodes-base.code', 2, code(`
const q = $json; const prep = $('Preparar redaccion').first().json;
const usuario = prep.usuario + '\\n\\n════ BORRADOR ACTUAL (JSON) ════\\n' + JSON.stringify(q.articulo) +
  '\\n\\n════ FALLOS DETECTADOS POR EL CONTROL SEO (puntuación ' + q.score + '/100) ════\\n- ' + q.issues.join('\\n- ') +
  '\\n\\nDevuelve el artículo COMPLETO corregido con el mismo esquema. Corrige todos los fallos sin perder calidad, datos ni extensión; no inventes nada para corregirlos.';
const sistema = prep.sistema;
${reqJs({ model: 'gpt-5.5', effort: 'medium', schemaName: 'articulo', schema: ARTICULO_SCHEMA, maxTokens: 40000 })}
return [{ json: { req } }];
`), X(13, Y + 1));
f.add('Revisar articulo', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(14, Y + 1), { credentials: CRED.openai, onError: 'continueRegularOutput' });
f.add('Control calidad 2', 'n8n-nodes-base.code', 2, code(QC_NODE('revisada')), X(15, Y + 1), { onError: 'continueRegularOutput' });

f.add('Articulo final', 'n8n-nodes-base.code', 2, code(`
const q1 = $('Control calidad').first().json;
let q = q1;
try { const q2 = $('Control calidad 2').first().json; if (q2 && q2.articulo && q2.score >= q1.score) q = q2; } catch (e) {}
const a = q.articulo;
const cats = ($('Categorias').first().json.body || []);
const cat = cats.find(c => c.slug === a.categoria) || cats.find(c => c.slug === 'sobre-la-ia') || cats[0] || { id: 1 };
const etiquetas = [...new Set((a.etiquetas || []).map(t => String(t).trim()).filter(t => t.length > 1 && t.length < 40))].slice(0, 4);
return [{ json: { ...q, categoria_id: cat.id, categoria_nombre: cat.name, etiquetas } }];
`), X(16, Y));

f.link('Ruta', 'Bloquear brief', 2);
f.link('Bloquear brief', 'Brief libre');
f.link('Brief libre', 'Aviso redactando', 0);
f.link('Brief libre', 'Inventario enlaces', 0);
f.link('Brief libre', 'Aviso ya en marcha', 1);
f.chain('Inventario enlaces', 'Categorias', 'Preparar investigacion', 'Investigar actualidad', 'Preparar redaccion', 'Redactar articulo', 'Control calidad', 'Necesita revision');
f.link('Necesita revision', 'Preparar revision', 0);
f.link('Necesita revision', 'Articulo final', 1);
f.chain('Preparar revision', 'Revisar articulo', 'Control calidad 2', 'Articulo final');

// ---------- etiquetas ----------
const Y2 = Y + 3;
f.add('Etiquetas a items', 'n8n-nodes-base.code', 2, code(`
const e = $json.etiquetas.length ? $json.etiquetas : [$json.articulo.focus_keyword];
return e.map(name => ({ json: { name } }));
`), X(3, Y2));
f.add('Crear etiqueta', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${WP}/wp-json/wp/v2/tags`, authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify({ name: $json.name }) }}',
  options: { timeout: 30000, response: { response: { neverError: true } } },
}, X(4, Y2), { credentials: CRED.wp, onError: 'continueRegularOutput' });

// ---------- imágenes ----------
f.add('Prompts imagen', 'n8n-nodes-base.code', 2, code(`
const f = $('Articulo final').first().json; const a = f.articulo;
const estilo = ' Photorealistic editorial photograph, documentary magazine style, natural light, realistic skin and materials, subtle film grain, 35mm lens, shallow depth of field. No text, no letters, no signs, no logos, no watermarks, no readable screens.';
const roles = ['portada', 'seccion_1', 'seccion_2'];
return roles.map((rol, i) => {
  const im = (a.imagenes || []).find(x => x.rol === rol) || (a.imagenes || [])[i] || { prompt: 'Professionals in a Spanish small business office discussing ' + a.focus_keyword, alt: a.title, titulo: a.focus_keyword, pie: '' };
  return { json: { rol, prompt: String(im.prompt).slice(0, 3000) + estilo, alt: im.alt, titulo: im.titulo, pie: im.pie, filename: a.slug + '-' + (rol === 'portada' ? 'portada' : rol.replace('_', '-')) + '.webp' } };
});
`), X(6, Y2));
f.add('Generar imagen', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: 'https://api.openai.com/v1/images/generations', authentication: 'predefinedCredentialType', nodeCredentialType: 'openAiApi',
  sendBody: true, specifyBody: 'json',
  jsonBody: '={{ JSON.stringify({ model: "gpt-image-2", prompt: $json.prompt, size: "1536x1024", quality: "medium", output_format: "webp", output_compression: 82, n: 1 }) }}',
  options: { timeout: 300000 },
}, X(7, Y2), { credentials: CRED.openai, onError: 'continueRegularOutput', retryOnFail: true, maxTries: 2, waitBetweenTries: 5000 });
f.add('Imagen a archivo', 'n8n-nodes-base.convertToFile', 1.1, {
  operation: 'toBinary', sourceProperty: 'data[0].b64_json', binaryPropertyName: 'data',
  options: { fileName: "={{ $('Prompts imagen').item.json.filename }}", mimeType: 'image/webp' },
}, X(8, Y2), { onError: 'continueRegularOutput' });
f.add('Subir imagen', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${WP}/wp-json/wp/v2/media`, authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendHeaders: true, headerParameters: { parameters: [
    { name: 'Content-Disposition', value: "=attachment; filename=\"{{ $('Prompts imagen').item.json.filename }}\"" },
    { name: 'Content-Type', value: 'image/webp' },
  ] },
  sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data', options: { timeout: 120000 },
}, X(9, Y2), { credentials: CRED.wp, onError: 'continueRegularOutput' });
f.add('SEO imagen', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `=${WP}/wp-json/wp/v2/media/{{ $json.id }}`, authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendBody: true, specifyBody: 'json',
  jsonBody: "={{ JSON.stringify({ alt_text: $('Prompts imagen').item.json.alt, title: $('Prompts imagen').item.json.titulo, caption: $('Prompts imagen').item.json.pie, description: $('Prompts imagen').item.json.alt }) }}",
  options: { timeout: 60000 },
}, X(10, Y2), { credentials: CRED.wp, onError: 'continueRegularOutput' });

// ---------- montaje final ----------
f.add('Montar HTML', 'n8n-nodes-base.code', 2, code(`${UTIL}
const F = $('Articulo final').first().json; const a = F.articulo;
const r = $('Bloquear brief').first().json;
const ajustes = r.ajustes || {};
// etiquetas: id nuevo o id existente (term_exists)
const tagIds = $('Crear etiqueta').all().map(i => i.json && (i.json.id || (i.json.data && i.json.data.term_id) || (i.json.error && null))).filter(x => Number.isInteger(x));
// imágenes subidas (mismo orden que 'Prompts imagen')
const prompts = $('Prompts imagen').all().map(i => i.json);
const subidas = $('Subir imagen').all().map((i, k) => ({ ...prompts[k], id: i.json && i.json.id, url: i.json && i.json.source_url }))
  .filter(x => Number.isInteger(x.id) && x.url);
const img = Object.fromEntries(subidas.map(x => [x.rol, x]));
const figura = (x) => x ? '<figure class="wp-block-image size-large tca-figura"><img src="' + x.url + '" alt="' + esc(x.alt) + '" class="wp-image-' + x.id + '" width="1536" height="1024" loading="lazy" decoding="async"/>' + (x.pie ? '<figcaption>' + esc(x.pie) + '</figcaption>' : '') + '</figure>' : '';

let html = String(a.contenido_html || '').replace(/<h1[^>]*>[\\s\\S]*?<\\/h1>/gi, '');
for (const rol of ['seccion_1', 'seccion_2']) {
  const marca = '<!--IMG:' + rol + '-->';
  if (html.includes(marca)) html = html.split(marca).join(figura(img[rol]));
  else if (img[rol]) {                     // sin marcador: tras el 1er / 3er H2
    const cierres = [...html.matchAll(/<\\/h2>/gi)].map(m => m.index + 5);
    const pos = rol === 'seccion_1' ? cierres[0] : cierres[Math.min(2, cierres.length - 1)];
    if (pos) { const p = html.indexOf('</p>', pos); const at = p > 0 ? p + 4 : pos; html = html.slice(0, at) + figura(img[rol]) + html.slice(at); }
  }
}
html = html.replace(/<!--IMG:[a-z_0-9]+-->/g, '');
// enlaces externos: nueva pestaña y sin pasar autoridad a agregadores
html = html.replace(/<a\\s+href="(https?:\\/\\/(?!transformaconia\\.com)[^"]+)"/gi, '<a href="$1" target="_blank" rel="noopener"');
// ids en los H2 para el índice
const slugify = s => s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/<[^>]+>/g, '').replace(/[^a-z0-9\\s-]/g, '').trim().replace(/\\s+/g, '-').slice(0, 70).replace(/-$/, '');
const toc = []; const usados = new Set();
html = html.replace(/<h2([^>]*)>([\\s\\S]*?)<\\/h2>/gi, (m, at, inner) => {
  const t = inner.replace(/<[^>]+>/g, '').trim(); let id = slugify(t) || 'seccion-' + (toc.length + 1);
  while (usados.has(id)) id += '-2'; usados.add(id); toc.push({ id, t });
  return /\\sid=/.test(at) ? m : '<h2' + at + ' id="' + id + '">' + inner + '</h2>';
});

const esencial = (a.lo_esencial || []).length ? '<div class="tca-esencial"><p class="tca-esencial__titulo"><strong>Lo esencial</strong></p><ul>' + a.lo_esencial.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
const indice = toc.length >= 3 ? '<nav class="tca-indice" aria-label="Índice del artículo"><p class="tca-indice__titulo"><strong>En este artículo</strong></p><ol>' + toc.map(x => '<li><a href="#' + x.id + '">' + esc(x.t) + '</a></li>').join('') + '<li><a href="#preguntas-frecuentes">Preguntas frecuentes</a></li></ol></nav>' : '';
const faq = (a.faq || []).slice(0, 6);
const faqHtml = faq.length ? '<h2 id="preguntas-frecuentes">Preguntas frecuentes</h2>' + faq.map(x => '<h3>' + esc(x.pregunta) + '</h3><p>' + esc(x.respuesta) + '</p>').join('') : '';
const fuentes = (a.fuentes || []).filter(x => /^https?:\\/\\//.test(x.url)).slice(0, 8);
const fuentesHtml = fuentes.length ? '<h2 id="fuentes">Fuentes</h2><ul class="tca-fuentes">' + fuentes.map(x => '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.nombre) + '</a></li>').join('') + '</ul>' : '';
const autor = '<aside class="tca-autor"><p><strong>Sobre el autor.</strong> Juan Carlos Ros es consultor y desarrollador de inteligencia artificial y automatización en Transformaconia, donde diseña agentes de IA y flujos automatizados para pymes españolas.</p><p><strong>¿Quieres aplicarlo en tu empresa?</strong> Cuéntanos tu caso en <a href="mailto:info@transformaconia.com">info@transformaconia.com</a> y te respondemos en menos de 24 horas con una propuesta concreta.</p></aside>';
const estilos = '<style>.tca-esencial{background:#f4f7fb;border-left:4px solid #2563eb;border-radius:10px;padding:16px 20px;margin:0 0 24px}.tca-esencial ul{margin:6px 0 0 18px}.tca-indice{background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:14px 20px;margin:0 0 28px}.tca-indice ol{margin:6px 0 0 18px}.tca-figura{margin:32px 0}.tca-figura img{border-radius:12px;width:100%;height:auto}.tca-figura figcaption{font-size:.85em;color:#6b7280;text-align:center;margin-top:8px}.tca-autor{border-top:1px solid #e5e7eb;margin-top:40px;padding-top:20px;font-size:.95em}.entry-content table{width:100%;border-collapse:collapse;margin:24px 0}.entry-content th,.entry-content td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left}.entry-content th{background:#f4f7fb}</style>';
const faqSchema = faq.length >= 2 ? '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(x => ({ '@type': 'Question', name: x.pregunta, acceptedAnswer: { '@type': 'Answer', text: x.respuesta } })) }) + '</script>' : '';

const contenido = estilos + esencial + indice + html + faqHtml + fuentesHtml + autor + faqSchema;
const publicar = (ajustes.modo || 'publicar') === 'publicar' && F.score >= F.minimo;
const seoTitle = (a.seo_title || a.title).length <= 44 ? (a.seo_title || a.title) + ' %sep% %sitename%' : (a.seo_title || a.title);
const post = {
  title: a.title, content: contenido, excerpt: a.extracto, slug: a.slug,
  status: publicar ? 'publish' : 'draft', categories: [F.categoria_id], tags: [...new Set(tagIds)],
  featured_media: img.portada ? img.portada.id : 0, comment_status: 'closed', ping_status: 'closed',
};
const meta = { rank_math_title: seoTitle, rank_math_description: a.meta_description,
  rank_math_focus_keyword: [a.focus_keyword, ...(a.keywords_secundarias || []).slice(0, 4)].join(','),
  rank_math_facebook_title: a.title, rank_math_facebook_description: a.meta_description,
  rank_math_twitter_use_facebook: 'on' };
return [{ json: { post, meta, publicar, imagenes: subidas.length, score: F.score, issues: F.issues, metricas: F.metricas, categoria: F.categoria_nombre, articulo: { title: a.title, focus_keyword: a.focus_keyword, slug: a.slug } } }];
`), X(11, Y2));

f.add('Crear post', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${WP}/wp-json/wp/v2/posts`, authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.post) }}', options: { timeout: 120000 },
}, X(12, Y2), { credentials: CRED.wp, onError: 'continueErrorOutput' });
f.add('Meta Rank Math', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${WP}/wp-json/rankmath/v1/updateMeta`, authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ objectType: 'post', objectID: $json.id, meta: $('Montar HTML').first().json.meta }) }}",
  options: { timeout: 60000 },
}, X(13, Y2), { credentials: CRED.wp, onError: 'continueRegularOutput' });
f.add('IndexNow', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${WP}/wp-json/rankmath/v1/in/submitUrls`, authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendBody: true, specifyBody: 'json', jsonBody: "={{ JSON.stringify({ urls: $('Crear post').first().json.link }) }}", options: { timeout: 30000 },
}, X(14, Y2), { credentials: CRED.wp, onError: 'continueRegularOutput' });
f.add('Registrar', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with b as (update seo.briefs set status=$2, post_id=$3::int, post_url=$4, seo_score=$5::int, updated_at=now() where id=$1::uuid returning id, radar_id),
r as (update seo.radar set status='published' where id=(select radar_id from b) and $2='published'),
s as (insert into seo.post_scores(post_id, title, url, score, issues, metrics) values ($3::int, $6, $4, $5::int, $7::jsonb, $8::jsonb)
  on conflict (post_id) do update set score=excluded.score, issues=excluded.issues, metrics=excluded.metrics, title=excluded.title, url=excluded.url, updated_at=now())
insert into seo.actions(origin, action, target_type, target_id, summary, after)
values ('n8n', case when $2='published' then 'publicar' else 'crear_borrador' end, 'post', ($3::int)::text, (case when $2='published' then 'Publicado: ' else 'Borrador creado: ' end) || $6 || ' (SEO ' || ($5::int)::text || '/100)', $8::jsonb) returning id`,
  options: { queryReplacement: "={{ [ $('Bloquear brief').first().json.id, $('Montar HTML').first().json.publicar ? 'published' : 'draft', String($('Crear post').first().json.id), $('Crear post').first().json.link, String($('Montar HTML').first().json.score), $('Montar HTML').first().json.articulo.title, JSON.stringify($('Montar HTML').first().json.issues), JSON.stringify({ ...$('Montar HTML').first().json.metricas, imagenes: $('Montar HTML').first().json.imagenes }) ] }}" } },
  X(15, Y2), { credentials: CRED.pg, onError: 'continueRegularOutput' });
f.add('Informe final', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID,
  text: `={{ (() => { const m = $('Montar HTML').first().json; const p = $('Crear post').first().json; const esc = s => String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const x = m.metricas || {};
return (m.publicar ? '✅ <b>Publicado</b>' : '📝 <b>Guardado como borrador</b> (no llega al mínimo de calidad o el modo es borrador)') + '\\n\\n' +
 '<b>' + esc(m.articulo.title) + '</b>\\n' + esc(p.link) + '\\n\\n' +
 '📊 SEO ' + m.score + '/100 · ' + (x.palabras || 0) + ' palabras · ' + (x.h2 || 0) + ' H2 · ' + (x.internos || 0) + ' enlaces internos · ' + (x.externos || 0) + ' fuentes · ' + (x.faq || 0) + ' FAQ\\n' +
 '🖼 ' + m.imagenes + '/3 fotos WebP con alt · 📂 ' + esc(m.categoria) + '\\n🔑 <code>' + esc(m.articulo.focus_keyword) + '</code>\\n' +
 '⚡ Rank Math configurado' + (m.publicar ? ' · IndexNow enviado (Bing, ChatGPT Search)' : '') +
 (m.issues.length ? '\\n\\n<b>Detalles a pulir:</b>\\n• ' + m.issues.slice(0, 5).map(esc).join('\\n• ') : ''); })() }}`,
  replyMarkup: 'inlineKeyboard',
  inlineKeyboard: { rows: [{ row: { buttons: [
    { text: '🔍 Auditar', additionalFields: { callback_data: "={{ 'app:auditar:' + $('Crear post').first().json.id }}" } },
    { text: '↩️ Pasar a borrador', additionalFields: { callback_data: "={{ 'app:borrador:' + $('Crear post').first().json.id }}" } },
  ] } }] },
  additionalFields: HTML,
}, X(16, Y2), { credentials: tg });

f.add('Fallo publicacion', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.briefs set status='failed', error=$2, updated_at=now() where id=$1::uuid returning source_title`,
  options: { queryReplacement: "={{ [ $('Bloquear brief').first().json.id, String(($json.error && ($json.error.message || $json.error.description)) || $json.error || 'error desconocido').slice(0, 900) ] }}" } },
  X(13, Y2 + 1.2), { credentials: CRED.pg, onError: 'continueRegularOutput' });
f.add('Aviso fallo', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID, text: "=❌ WordPress rechazó el artículo «{{ $json.source_title }}». Queda marcado como fallido; puedes reintentarlo desde la app o pulsando otra vez «Redactar y publicar».",
  additionalFields: HTML,
}, X(14, Y2 + 1.2), { credentials: tg, onError: 'continueRegularOutput' });

f.link('Articulo final', 'Etiquetas a items');
f.link('Etiquetas a items', 'Crear etiqueta');
f.link('Crear etiqueta', 'Prompts imagen');   // se ejecuta una vez por etiqueta -> ver executeOnce
f.chain('Prompts imagen', 'Generar imagen', 'Imagen a archivo', 'Subir imagen', 'SEO imagen', 'Montar HTML', 'Crear post');
f.link('Crear post', 'Meta Rank Math', 0);
f.link('Crear post', 'Fallo publicacion', 1);
f.add('Se publica', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: "={{ $('Montar HTML').first().json.publicar }}", rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(13.5, Y2 - 0.8));
f.link('Meta Rank Math', 'Se publica');
f.link('Se publica', 'IndexNow', 0);
f.link('Se publica', 'Registrar', 1);
f.chain('IndexNow', 'Registrar', 'Informe final');
f.link('Fallo publicacion', 'Aviso fallo');

// 'Prompts imagen' y 'Montar HTML' deben correr una sola vez aunque les lleguen varios items
for (const n of f.nodes) if (['Prompts imagen', 'Montar HTML', 'Informe final', 'Registrar', 'IndexNow', 'Meta Rank Math'].includes(n.name)) n.executeOnce = true;

const wf = f.json({ saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all', saveManualExecutions: true, timezone: 'Europe/Madrid', callerPolicy: 'workflowsFromSameOwner' });
checkExpr(wf);
fs.writeFileSync(new URL('./publicador.build.json', import.meta.url), JSON.stringify(wf, null, 1));
if (process.argv.includes('--dry')) { console.log('dry run, nodos:', wf.nodes.length); process.exit(0); }
const r = await n8n.upsert(wf, ID);
await n8n.activate(r.id);
console.log('PUBLICADOR v3 ->', r.id, 'nodos:', wf.nodes.length);
