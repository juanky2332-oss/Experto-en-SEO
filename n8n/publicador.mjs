// PUBLICADOR v3 — transformaconia.com
// Telegram (enlace o botón del radar) / app  ->  brief editorial  ->  aprobación
// ->  investigación web  ->  redacción  ->  control de calidad SEO (+ revisión)
// ->  3 fotos gpt-image-2 en WebP  ->  WordPress + Rank Math + IndexNow  ->  informe.
// Cualquier otro mensaje o botón "app:*" se reenvía a la app Experto en SEO.
import fs from 'node:fs';
import { Flow, CRED, CHAT_ID, WP, APP_URL, n8n, code, OPENAI_HTTP, reqJs, checkExpr, PARSE_RESPONSES } from './lib.mjs';
import { CATEGORIAS, CAT_ANTIGUAS, BRIEF_SCHEMA, BRIEF_SISTEMA, INVESTIGACION_SCHEMA, INVESTIGACION_SISTEMA, ARTICULO_SCHEMA, REDACCION_SISTEMA, QC_JS } from './prompts.mjs';
import { TIPOS_BASE, GUIA_INICIAL, guiaATexto, cajaAutor } from '../src/lib/guia-base.ts';

// Páginas a las que el artículo puede llevar (servicio, sector, ERP, locales). Solo se ofrecen
// las que existen publicadas en WordPress en el momento de redactar.
const PAGINAS = {
  '/erp-industria/': 'ERP para la industria (TransformaConIA Gestión): presupuestos, pedidos, albaranes, facturas, stock, partes de trabajo e informes',
  '/industria/': 'IA y automatización para empresas industriales (página general del sector)',
  '/ia-talleres-industriales/': 'IA para talleres de mecanizado, calderería, carpintería metálica y reparación de maquinaria',
  '/ia-mantenimiento-industrial/': 'IA para mantenimiento industrial: preventivo, averías, órdenes de trabajo y repuestos',
  '/ia-empresas-instaladoras/': 'IA para empresas instaladoras: avisos, partes, certificados y facturación',
  '/ia-fabricacion-industrial/': 'IA en fabricación: planificación, órdenes de fabricación, calidad y datos de máquina',
  '/distribucion-industrial/': 'Asistente técnico para distribución industrial: catálogo, equivalencias y pedidos',
  '/gestion-documental-ia/': 'Gestión documental con IA: leer facturas, albaranes y pedidos sin teclear',
  '/automatizacion-procesos-ia/': 'Automatización de procesos e informes que se hacen solos',
  '/agentes-chatbots-ia/': 'Asistentes técnicos y chatbots sobre la documentación de la empresa',
  '/desarrollo-a-medida-ia/': 'Herramientas a medida y conexión con SAP u otro ERP',
  '/soluciones/': 'Todas las soluciones de IA para empresas',
  '/casos/': 'Casos y fichas de proyectos industriales',
  '/consultor-ia-murcia/': 'Consultoría de IA y automatización en Murcia',
  '/automatizacion-industria-cartagena/': 'Automatización e IA para la industria en Cartagena',
  '/automatizacion-industria-molina-de-segura/': 'Automatización e IA para la industria en Molina de Segura',
  '/automatizacion-industria-lorca/': 'Automatización e IA para la industria en Lorca',
  '/automatizacion-industria-alcantarilla/': 'Automatización e IA para la industria en Alcantarilla',
  '/automatizacion-industria-elche/': 'Automatización e IA para la industria en Elche',
  '/automatizacion-industria-albacete/': 'Automatización e IA para la industria en Albacete',
  '/contacto/': 'Contacto y reserva del diagnóstico gratis (usar https://transformaconia.com/contacto/#reserva como CTA)',
};

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
const TIPOS_BASE = ${JSON.stringify(TIPOS_BASE)};
const GUIA_TEXTO_BASE = ${JSON.stringify(guiaATexto(GUIA_INICIAL))};
const tipoDe = (guia, clave) => ((guia && guia.tipos) || TIPOS_BASE).find(t => t.clave === clave) || TIPOS_BASE.find(t => t.clave === clave) || TIPOS_BASE[0];
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
  // brief_pista: tema propuesto desde «Qué publicar» (con o sin URL de referencia).
  // pista = { keyword, secundarias[], intencion, publico, categoria | pilar, destino, destino_ref, enlaces[{url, ancla}], cta, titulo, tipo, notas }
  const map = { brief_url: 'url', brief_pista: 'url', brief_radar: 'prep', publish: 'publish', reject: 'reject' };
  const pista = b.pista && typeof b.pista === 'object' && String(b.pista.keyword || '').trim() ? b.pista : null;
  if (b.action === 'brief_pista' && !pista) return [{ json: { route: 'ignore', motivo: 'brief_pista sin pista.keyword', chatId: CHAT } }];
  return [{ json: { route: map[b.action] || 'ignore', url: b.url || null, radar_id: b.radar_id ? +b.radar_id : null, brief_id: b.brief_id || null, origin: 'app', chatId: CHAT, pista, borrador: b.borrador === true, rec_id: b.rec_id || null } }];
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
if (!url && !r.pista) throw new Error('No hay URL que leer');
return [{ json: { url: url || null, sin_fuente: !url, pista: r.pista || null, borrador: r.borrador === true, chatId: r.chatId, origin: r.origin || 'telegram', radar_id: r.radar_id || null } }];
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

f.add('Sin URL', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.sin_fuente }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(4.5, 2));
// Tema propuesto sin noticia detrás: la "fuente" es la propia pista (los datos los aporta la investigación web)
f.add('Fuente pista', 'n8n-nodes-base.code', 2, code(`
const p = $('Preparar lectura').first().json.pista || {};
return [{ json: { title: p.titulo || p.keyword, source: 'Panel · Qué publicar', link: '', content_markdown: '', h2_originales: [] } }];
`), X(6, 3));
// Publicados y programados con su foco de Rank Math (canibalización). Con usuario: los programados no son públicos.
f.add('Inventario blog', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/posts?per_page=100&status=publish,future&_fields=id,title,link,status,meta.rank_math_focus_keyword`,
  authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(8, 1), { credentials: CRED.wp });

f.add('Leer guia', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select (select value->>'texto' from seo.settings where key='guia') as guia, (select value->'pilares' from seo.settings where key='guia') as pilares, (select tipo from seo.radar where id = nullif($1,'')::bigint) as tipo_radar`,
  options: { queryReplacement: "={{ [ String($('Preparar lectura').first().json.radar_id || '') ] }}" } }, X(8.5, 0), { credentials: CRED.pg, alwaysOutputData: true, onError: 'continueRegularOutput' });
const FUENTE_JS = `
const fuente = () => { try { return $('Extraer contenido').first().json; } catch (e) { return $('Fuente pista').first().json; } };
const PILARES_BASE = ${JSON.stringify(GUIA_INICIAL.pilares.map((p) => ({ nombre: p.nombre, categoria: p.categoria })))};
const CAT_VIEJAS = ${JSON.stringify(CAT_ANTIGUAS)};
const CATS_OK = ${JSON.stringify(Object.keys(CATEGORIAS))};
const textoPista = (p) => !p ? '' : [
  'Keyword principal: ' + p.keyword,
  p.secundarias && p.secundarias.length ? 'Keywords secundarias: ' + [].concat(p.secundarias).join(', ') : '',
  p.intencion ? 'Intención: ' + p.intencion : '', p.publico ? 'Público: ' + p.publico : '',
  p.tipo ? 'Tipo: ' + p.tipo : '', p.pilar ? 'Pilar: ' + p.pilar : '', p.categoria ? 'Categoría: ' + p.categoria : '',
  p.destino ? 'Destino: ' + p.destino + (p.destino_ref ? ' (' + p.destino_ref + ')' : '') : '',
  p.enlaces && p.enlaces.length ? 'Enlaces internos obligatorios: ' + p.enlaces.map(e => (e.url || e) + (e.ancla ? ' («' + e.ancla + '»)' : '')).join(' · ') : '',
  p.cta ? 'CTA: ' + p.cta : '', p.titulo ? 'Título orientativo: ' + p.titulo : '', p.notas ? 'Notas: ' + p.notas : '',
].filter(Boolean).join('\\n');
`;
f.add('Preparar brief', 'n8n-nodes-base.code', 2, code(`${UTIL}${FUENTE_JS}
const d = fuente();
const L = $('Preparar lectura').first().json;
const g = $('Leer guia').first().json || {};
const body = $('Inventario blog').first().json.body;
const posts = Array.isArray(body) ? body : [];
const inventario = posts.map(p => '- [' + p.id + (p.status === 'future' ? ', programado' : '') + '] ' + decode(p.title && p.title.rendered) + ((p.meta && p.meta.rank_math_focus_keyword) ? ' — foco: ' + p.meta.rank_math_focus_keyword.split(',').slice(0, 3).join(', ') : '')).join('\\n');
const cats = ${JSON.stringify(Object.entries(CATEGORIAS).map(([k, v]) => `- ${k}: ${v}`).join('\n'))};
const conFuente = !!String(d.content_markdown || '').trim();
const usuario = 'FECHA DE HOY: ' + hoyMadrid() + '\\n\\n' +
  (L.pista ? 'PISTA DEL EDITOR (manda sobre lo que deduzcas):\\n' + textoPista(L.pista) + '\\n\\n' : '') +
  (conFuente ? 'NOTICIA\\nTítulo: ' + d.title + '\\nFuente: ' + d.source + '\\nURL: ' + d.link + '\\n' +
    'Subtítulos originales: ' + JSON.stringify(d.h2_originales || []) + '\\n\\nTEXTO FUENTE:\\n' + String(d.content_markdown || '').slice(0, 14000)
    : 'SIN TEXTO FUENTE: tema evergreen propuesto por el editor. "hechos" va vacío y no escribas cifras.') +
  (g.tipo_radar ? '\\n\\nTIPO SUGERIDO POR EL RADAR: ' + g.tipo_radar + ' (cámbialo si otro saca más valor)' : '') +
  '\\n\\nGUÍA EDITORIAL:\\n' + (g.guia || GUIA_TEXTO_BASE) +
  '\\n\\nCATEGORÍAS DEL BLOG:\\n' + cats +
  '\\n\\nARTÍCULOS QUE YA TIENE EL BLOG (publicados y programados, con su foco de Rank Math, para detectar canibalización):\\n' + inventario;
const sistema = ${JSON.stringify(BRIEF_SISTEMA)};
${reqJs({ model: 'gpt-5.5', effort: 'low', schemaName: 'brief_editorial', schema: BRIEF_SCHEMA, maxTokens: 12000 })}
return [{ json: { req } }];
`), X(9, 1));

f.add('Brief editorial', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(10, 1), { credentials: CRED.openai, retryOnFail: true, maxTries: 2, waitBetweenTries: 5000 });

f.add('Parsear brief', 'n8n-nodes-base.code', 2, code(`${UTIL}${PARSE_RESPONSES}${FUENTE_JS}
const b = leerRespuesta($json);
const d = fuente();
const p = $('Preparar lectura').first().json;
const g = $('Leer guia').first().json || {};
// La pista del panel manda sobre lo que deduce el modelo
const P = p.pista;
if (P) {
  b.keyword_principal = String(P.keyword).trim().toLowerCase();
  if (Array.isArray(P.secundarias) && P.secundarias.length) b.keywords_secundarias = P.secundarias.map(String);
  const INT = { informacional: 'Informacional', comercial: 'Comercial', transaccional: 'Transaccional', navegacional: 'Navegacional', local: 'Local' };
  if (P.intencion && INT[String(P.intencion).toLowerCase()]) b.intencion = INT[String(P.intencion).toLowerCase()];
  if (P.publico) b.publico = String(P.publico);
  if (P.tipo && TIPOS_BASE.some(t => t.clave === P.tipo)) b.tipo = P.tipo;
  let cat = P.categoria ? (CAT_VIEJAS[P.categoria] || P.categoria) : '';
  if (!CATS_OK.includes(cat) && P.pilar) {
    const pil = [].concat(Array.isArray(g.pilares) ? g.pilares : [], PILARES_BASE).find(x => x && String(x.nombre).toLowerCase() === String(P.pilar).toLowerCase());
    if (pil) cat = CAT_VIEJAS[pil.categoria] || pil.categoria;
  }
  if (CATS_OK.includes(cat)) b.categoria = cat;
  if (!String(d.content_markdown || '').trim()) { b.hechos = []; b.vigencia = b.tipo === 'actualidad' ? 'noticia' : 'evergreen'; }
  b.pista = P;
}
b.categoria = CAT_VIEJAS[b.categoria] || b.categoria;
if (p.borrador) b.forzar_borrador = true;
const semaforo = b.interes >= 75 ? '🟢' : b.interes >= 55 ? '🟡' : '🔴';
let t = (d.link ? '📰 ' : '🧭 ') + '<b>' + esc(b.titular) + '</b>\\n' + (d.link ? '<i>' + esc(d.source) + '</i> · ' + esc(d.link) : '<i>Tema propuesto desde «Qué publicar»</i>') + '\\n\\n' +
  '<b>En una línea:</b> ' + esc(b.resumen_linea) + '\\n\\n' +
  '<b>' + (d.link ? 'Qué ha pasado' : 'Qué cubre') + ':</b> ' + esc(b.que_ha_pasado) + '\\n\\n' +
  '<b>Por qué importa:</b> ' + esc(b.por_que_importa) + '\\n\\n' +
  '<b>' + (d.link ? 'Dato clave' : 'Idea clave') + ':</b> ' + esc(b.dato_clave) + '\\n\\n' +
  semaforo + ' <b>Interés ' + b.interes + '/100</b> — ' + (b.publicar ? 'recomiendo publicarlo' : 'no recomiendo publicarlo') + '. ' + esc(b.motivo) + '\\n' +
  '🎯 ' + esc(tipoDe(null, b.tipo).nombre) + ' · ' + esc(b.angulo) + ' · ' + esc(b.vigencia) + ' · ' + esc(b.categoria) + '\\n' +
  '🔑 <code>' + esc(b.keyword_principal) + '</code> (' + esc(b.intencion) + ')' + (P ? ' · pista del panel' : '') + '\\n' +
  '👤 ' + esc(b.publico) + '\\n' +
  '❓ ' + b.preguntas.slice(0, 3).map(esc).join(' · ') +
  (b.forzar_borrador ? '\\n📝 Se guardará como BORRADOR' : '');
if (b.canibaliza && b.canibaliza.post_id) t += '\\n\\n⚠️ <b>Ya tienes algo parecido:</b> ' + esc(b.canibaliza.titulo) + ' (#' + b.canibaliza.post_id + '). ' + esc(b.canibaliza.recomendacion);
if (t.length > 3900) t = t.slice(0, 3890) + '…';
return [{ json: { brief: b, telegram: t, origin: p.origin, radar_id: p.radar_id ? String(p.radar_id) : '', url: d.link || '', titulo: d.title, fuente: d.source, texto: String(d.content_markdown || '').slice(0, 16000) } }];
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
f.link('Preparar lectura', 'Sin URL');
f.link('Sin URL', 'Fuente pista', 0);
f.link('Sin URL', 'Descargar noticia', 1);
f.link('Fuente pista', 'Inventario blog');
f.link('Descargar noticia', 'Extraer contenido', 0);
f.link('Descargar noticia', 'Lector Jina', 1);
f.link('Lector Jina', 'Extraer contenido');
f.link('Extraer contenido', 'Inventario blog', 0);
f.link('Extraer contenido', 'Aviso lectura fallida', 1);
f.chain('Inventario blog', 'Leer guia', 'Preparar brief', 'Brief editorial', 'Parsear brief', 'Guardar brief', 'Enviar brief');

// =====================================================================
// B) PUBLICAR: redactar, controlar calidad, imágenes y WordPress
// =====================================================================
const Y = 9; // fila base de esta rama
f.add('Bloquear brief', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.briefs set status='generating', updated_at=now(), error=null
where id=$1::uuid and (status in ('pending','failed','rejected') or (status='generating' and updated_at < now() - interval '20 minutes'))
returning id, source_url, source_title, source_name, source_text, brief, origin, radar_id,
 (select value from seo.settings where key='publicacion') as ajustes,
 (select value from seo.settings where key='guia') as guia`,
  options: { queryReplacement: '={{ [ $json.brief_id ] }}' } }, X(3, Y), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Brief libre', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.id || "" }}', rightValue: '', operator: { type: 'string', operation: 'notEmpty', singleValue: true } }] }, options: {},
}, X(4, Y));
f.add('Aviso ya en marcha', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: 'Ese artículo ya se está redactando o ya está publicado. Si algo se quedó colgado, vuelve a pulsar dentro de 20 minutos.', additionalFields: HTML }, X(5, Y + 1), { credentials: tg });
f.add('Aviso redactando', 'n8n-nodes-base.telegram', 1.2, { chatId: CHAT_ID, text: "=✍️ Redactando <b>{{ $json.brief.titular }}</b>\nInvestigo la actualidad, escribo, reviso el SEO y genero 3 imágenes. Tardo unos 4-7 minutos; te aviso al terminar.", additionalFields: HTML }, X(5, Y - 1), { credentials: tg, onError: 'continueRegularOutput' });

f.add('Inventario enlaces', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/posts?per_page=100&status=publish,future&_fields=id,title,link,excerpt,categories,date,status,meta.rank_math_focus_keyword`,
  authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(5, Y), { credentials: CRED.wp });
f.add('Paginas', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/pages?per_page=100&status=publish&_fields=id,link`,
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(5.5, Y + 1));
f.add('Categorias', 'n8n-nodes-base.httpRequest', 4.2, {
  url: `${WP}/wp-json/wp/v2/categories?per_page=100&_fields=id,name,slug`,
  options: { timeout: 30000, response: { response: { fullResponse: true, neverError: true } } },
}, X(6, Y));

f.add('Preparar investigacion', 'n8n-nodes-base.code', 2, code(`${UTIL}
const r = $('Bloquear brief').first().json; const b = r.brief;
const noticia = b.vigencia === 'noticia' && !!r.source_url;
const usuario = 'Fecha de hoy: ' + hoyMadrid() + '.\\nTema: ' + b.titular + '\\nKeyword: ' + b.keyword_principal +
  '\\nSecundarias: ' + (b.keywords_secundarias || []).join(', ') + '\\nIntención: ' + b.intencion + '\\nPúblico: ' + (b.publico || 'pyme industrial española') +
  '\\nEntidades: ' + (b.entidades || []).join(', ') + (r.source_url ? '\\nFuente original: ' + r.source_url : '\\nSin noticia de origen: tema evergreen.') +
  '\\nPreguntas previstas: ' + (b.preguntas || []).join(' | ') +
  '\\n\\nBusca en la web (España y UE primero): (1) 2-4 fuentes OFICIALES o PRIMARIAS que respalden lo esencial del tema (normativa, organismos públicos, estadísticas oficiales, documentación técnica, estudios de asociaciones industriales o universidades); (2) datos concretos y actuales que necesitaría un responsable de una pyme industrial; (3) las preguntas que la gente hace sobre esta búsqueda («Otras preguntas de los usuarios»).' +
  (noticia ? ' Incluye el anuncio oficial, la disponibilidad en España/UE y reacciones de medios de referencia.' : '') +
  ' Devuelve 5-10 hechos con la URL EXACTA de la página concreta (no la portada del sitio) y el tipo de fuente. Si algo no lo puedes confirmar, no lo incluyas.';
const sistema = ${JSON.stringify(INVESTIGACION_SISTEMA)};
${reqJs({ model: 'gpt-5.5', effort: 'low', tools: [{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', country: 'ES' } }], schemaName: 'investigacion', schema: INVESTIGACION_SCHEMA, maxTokens: 12000 })}
return [{ json: { req } }];
`), X(7, Y));
f.add('Investigar actualidad', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(8, Y), { credentials: CRED.openai, onError: 'continueRegularOutput' });

f.add('Preparar redaccion', 'n8n-nodes-base.code', 2, code(`${UTIL}${PARSE_RESPONSES}
const r = $('Bloquear brief').first().json; const b = r.brief; const P = b.pista || null;
const BASE = '${WP}';
let inv = { hechos: [], contexto: '', preguntas_relacionadas: [] }, citas = [];
try { inv = leerRespuesta($json); citas = fuentesWeb($json); } catch (e) { inv = { hechos: [], contexto: '', preguntas_relacionadas: [] }; }
const limpia = (u) => String(u || '').replace(/[?&]utm_source=openai/g, '').replace(/#.*$/, '');
// sin URL(): no existe en el sandbox de los Code nodes
const ruta = (u) => { const s = String(u || '').trim().replace(/^https?:\\/\\/[^/]+/i, '').replace(/[?#].*$/, ''); return s ? ('/' + s.replace(/^\\/+/, '')).replace(/\\/?$/, '/') : ''; };
const abs = (u) => /^https?:/.test(u) ? u : BASE + (String(u).startsWith('/') ? '' : '/') + u;
// inventario: publicados (enlazables) y programados (solo para canibalización)
const bodyP = $('Inventario enlaces').first().json.body;
const posts = (Array.isArray(bodyP) ? bodyP : []).map(p => ({ id: p.id, t: decode(p.title && p.title.rendered), link: p.link, ex: decode(p.excerpt && p.excerpt.rendered).slice(0, 160), date: p.date, estado: p.status, foco: (p.meta && p.meta.rank_math_focus_keyword) || '' }));
const publicados = posts.filter(p => p.estado === 'publish');
const bodyG = $('Paginas').first().json.body;
const rutasWp = new Set((Array.isArray(bodyG) ? bodyG : []).map(p => ruta(p.link)));
const PAG = ${JSON.stringify(PAGINAS)};
const paginas = Object.entries(PAG).filter(([k]) => rutasWp.has(k));
// artículos relacionados: solapamiento de palabras con keyword, secundarias y entidades
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
const claves = norm([b.keyword_principal, ...(b.keywords_secundarias || []), ...(b.entidades || []), b.titular].join(' ')).split(/[^a-z0-9]+/).filter(w => w.length > 3);
const relacionados = publicados.map(p => { const t = norm(p.t + ' ' + p.ex + ' ' + p.foco); return { ...p, s: claves.reduce((a, w) => a + (t.includes(w) ? 1 : 0), 0) }; })
  .sort((a, b2) => b2.s - a.s || (b2.date > a.date ? 1 : -1)).slice(0, 12);
// enlaces obligatorios de la pista (solo si existen de verdad)
const existentes = new Set([...paginas.map(([k]) => k), ...publicados.map(p => ruta(p.link))]);
const obligatorios = ((P && P.enlaces) || []).map(e => abs(typeof e === 'string' ? e : e.url)).filter(u => existentes.has(ruta(u)));
const descartados = ((P && P.enlaces) || []).map(e => typeof e === 'string' ? e : e.url).filter(u => !existentes.has(ruta(abs(u))));
const anclas = Object.fromEntries(((P && P.enlaces) || []).filter(e => e && e.url && e.ancla).map(e => [ruta(abs(e.url)), e.ancla]));
// CTA del cierre: destino de la pista > página por categoría > diagnóstico
const CTA_CAT = { 'ia-en-la-industria': '/industria/', 'gestion-y-facturacion': '/erp-industria/', 'actualidad-ia': '/contacto/' };
const dest = P && P.destino_ref ? ruta(P.destino_ref) : '';
const ctaRuta = dest && existentes.has(dest) ? dest : (CTA_CAT[b.categoria] || '/contacto/');
const ctaUrl = ctaRuta === '/contacto/' ? BASE + '/contacto/#reserva' : BASE + ctaRuta;
// externas permitidas
const externas = [...new Set([r.source_url, ...(inv.hechos || []).map(h => h.url), ...citas.map(c => c.url)].filter(Boolean).map(limpia))].slice(0, 14);
// extensión según intención
const esNoticia = b.vigencia === 'noticia' || b.tipo === 'actualidad';
const rango = esNoticia ? [600, 900] : b.intencion === 'Informacional' ? [1200, 1800] : b.intencion === 'Local' ? [900, 1400] : [1000, 1600];
const T = tipoDe(r.guia, b.tipo || 'actualidad');
const bloqueTipo = '═══ TIPO DE ARTÍCULO: ' + T.nombre.toUpperCase() + ' ═══\\nObjetivo: ' + T.objetivo + '\\nExtensión: ' + rango[0] + '-' + rango[1] + ' palabras (entradilla + contenido_html; las FAQ no cuentan). Intención: ' + b.intencion + (esNoticia ? ' (noticia: directo al grano)' : '') +
  '\\nEstructura recomendada (adáptala; los H2 son preguntas o variantes de la keyword, no copies estos rótulos):\\n- ' + T.estructura.join('\\n- ') + '\\nESTILO VISUAL de las imágenes: ' + T.estilo_imagen;
const sistema = ${JSON.stringify(REDACCION_SISTEMA)}.split('{{HOY}}').join(hoyMadrid()).split('{{ANIO}}').join(String(anio()))
  .split('{{TIPO}}').join(bloqueTipo).split('{{GUIA}}').join((r.guia && r.guia.texto) || GUIA_TEXTO_BASE);
const hechosFuente = (b.hechos || []).map(h => '- ' + h.dato + ' (cita: "' + h.cita + '")').join('\\n');
const hechosWeb = (inv.hechos || []).map(h => '- [' + (h.tipo_fuente || 'medio') + '] ' + h.dato + ' — ' + h.fuente + ' (' + limpia(h.url) + ')').join('\\n');
const usuario = [
  'BRIEF APROBADO', 'Titular de trabajo: ' + b.titular, 'Tipo: ' + T.nombre + ' · Ángulo: ' + b.angulo + ' · Vigencia: ' + b.vigencia + ' · Intención: ' + b.intencion,
  'Público: ' + (b.publico || 'responsable de una pyme industrial'),
  'Keyword principal: ' + b.keyword_principal, 'Keywords secundarias: ' + (b.keywords_secundarias || []).join(', '),
  'Categoría: ' + b.categoria, 'Preguntas del brief: ' + (b.preguntas || []).join(' | '),
  'PREGUNTAS RELACIONADAS (búsqueda web, «la gente también pregunta»): ' + ((inv.preguntas_relacionadas || []).join(' | ') || '(sin datos)'),
  P ? 'PISTA DEL EDITOR (manda): ' + JSON.stringify({ keyword: P.keyword, publico: P.publico, destino: P.destino, destino_ref: P.destino_ref, cta: P.cta, notas: P.notas }) : '',
  (r.source_url ? 'Qué ha pasado: ' : 'Qué cubre: ') + b.que_ha_pasado, 'Por qué importa: ' + b.por_que_importa, 'Idea o dato clave: ' + b.dato_clave,
  '', r.source_url ? 'HECHOS DE LA FUENTE (' + r.source_name + ' — ' + r.source_url + '):\\n' + hechosFuente : 'SIN NOTICIA DE ORIGEN: los datos salen solo de la investigación.',
  '', 'INVESTIGACIÓN ACTUAL (búsqueda web de hoy, ' + hoyMadrid() + '):', inv.contexto || '(sin datos adicionales)', hechosWeb,
  '', 'URLs EXTERNAS PERMITIDAS (1-3 en el texto, prioriza las oficiales/primarias):', externas.join('\\n') || '(ninguna: no pongas enlaces externos)',
  '', 'PÁGINAS DE SERVICIO / SECTOR / ERP / LOCALES (elige 1-3 que encajen de verdad):', paginas.map(([k, v]) => '- ' + BASE + k + ' → ' + v).join('\\n'),
  '', 'ARTÍCULOS DEL BLOG PARA ENLAZAR (elige 1-3 relacionados):', relacionados.map(p => '- ' + p.t + ' → ' + p.link).join('\\n'),
  obligatorios.length ? '\\nENLACES OBLIGATORIOS (todos, con ancla descriptiva):\\n' + obligatorios.map(u => '- ' + u + (anclas[ruta(u)] ? ' (ancla sugerida: «' + anclas[ruta(u)] + '»)' : '')).join('\\n') : '',
  '', 'CTA DEL CIERRE: enlaza a ' + ctaUrl + (P && P.cta ? ' — mensaje: ' + P.cta : '') + ' (si encaja mejor, puedes usar ' + BASE + '/contacto/#reserva, diagnóstico gratis).',
  '', r.source_text ? 'TEXTO FUENTE (referencia):\\n' + String(r.source_text).slice(0, 9000) : '',
].filter(x => x !== null && x !== undefined).join('\\n');
${reqJs({ model: 'gpt-5.5', effort: 'medium', schemaName: 'articulo', schema: ARTICULO_SCHEMA, maxTokens: 40000 })}
const rutasPaginas = paginas.map(([k]) => k).filter(k => k !== '/contacto/');
return [{ json: { req, sistema, usuario, investigacion: inv, citas, rango,
  rutas_internas: [...new Set([...paginas.map(([k]) => k), '/quienes-somos/', '/blog/', ...publicados.map(p => ruta(p.link))])],
  rutas_paginas: rutasPaginas, rutas_cta: [...rutasPaginas, '/contacto/'], urls_externas: externas, obligatorios, descartados,
  focos: posts.map(p => ({ id: p.id, titulo: p.t, foco: p.foco, estado: p.estado })) } }];
`), X(9, Y));

f.add('Redactar articulo', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(10, Y), { credentials: CRED.openai, retryOnFail: true, maxTries: 2, waitBetweenTries: 10000 });

const QC_NODE = (fuente) => `${UTIL}${PARSE_RESPONSES}${QC_JS}
const r = $('Bloquear brief').first().json; const b = r.brief;
const prep = $('Preparar redaccion').first().json;
const a = leerRespuesta($json);
const CAT_VIEJAS = ${JSON.stringify(CAT_ANTIGUAS)};
const CATS_OK = ${JSON.stringify(Object.keys(CATEGORIAS))};
// slug corto: sin stopwords, máx. 5 palabras
const STOP = new Set(['de','la','el','en','y','a','los','las','del','para','con','por','que','un','una','como','tu','su','sus','al','sin','o']);
let sw = String(a.slug || a.focus_keyword || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').filter(Boolean);
const sinStop = sw.filter(w => !STOP.has(w));
if (sinStop.length >= 2) sw = sinStop;
a.slug = sw.slice(0, 5).join('-').slice(0, 50).replace(/-$/, '');
// categoría: la pista manda; los slugs viejos se traducen
a.categoria = CAT_VIEJAS[a.categoria] || a.categoria;
if (b.pista && CATS_OK.includes(b.categoria)) a.categoria = b.categoria;
if (!CATS_OK.includes(a.categoria)) a.categoria = CATS_OK.includes(b.categoria) ? b.categoria : 'actualidad-ia';
// enlaces: absolutos, sin parámetros de rastreo del buscador
a.contenido_html = String(a.contenido_html || '').replace(/href="\\/(?!\\/)/g, 'href="${WP}/').replace(/[?&]utm_source=openai/g, '');
a.fuentes = (a.fuentes || []).map(x => ({ ...x, url: String(x.url || '').replace(/[?&]utm_source=openai/g, '') }));
// comprobación real de los enlaces (200)
const urls = [...new Set([...a.contenido_html.matchAll(/<a\\s[^>]*href=["']([^"']+)["']/gi)].map(m => m[1]).filter(u => /^https?:/.test(u)))].slice(0, 18);
const estado = {};
await Promise.all(urls.map(async (u) => {
  try { const x = await this.helpers.httpRequest({ method: 'GET', url: u.replace(/#.*$/, ''), returnFullResponse: true, ignoreHttpStatusErrors: true, timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TransformaQC/1.0; +https://transformaconia.com)' } }); estado[u] = x.statusCode; }
  catch (e) { estado[u] = 0; }
}));
const limpiaExt = (u) => String(u).replace(/#.*$/, '').replace(/\\/$/, '');
const ctx = { anio: anio(), minPal: prep.rango[0], maxPal: prep.rango[1], categoria: a.categoria,
  fuenteTexto: String(r.source_text || '') + JSON.stringify(prep.investigacion || {}) + JSON.stringify(b.hechos || []),
  rutasInternas: new Set(prep.rutas_internas || []), rutasPaginas: new Set(prep.rutas_paginas || []), rutasCta: new Set(prep.rutas_cta || []),
  urlsExternas: new Set((prep.urls_externas || []).map(limpiaExt)), obligatorios: prep.obligatorios || [], estado,
  entidades: [...(b.entidades || []), ...((prep.investigacion && prep.investigacion.hechos) || []).map(h => h.fuente)], focos: prep.focos || [] };
const ev = evaluar(a, ctx);
const minimo = +((r.ajustes || {}).score_minimo || 80);
const malos = Object.entries(estado).filter(([, c]) => c && c !== 200).map(([u, c]) => u + ' → ' + c);
return [{ json: { articulo: a, score: ev.score, issues: ev.issues, bloqueantes: ev.bloqueantes, avisos: ev.avisos, canibal: ev.canibal,
  metricas: { ...ev.metricas, enlaces_comprobados: urls.length, enlaces_no_200: malos.length }, enlaces_no_200: malos, minimo,
  necesita_revision: ev.bloqueantes.length > 0 || ev.score < 90, origen: '${fuente}' } }];
`;
f.add('Control calidad', 'n8n-nodes-base.code', 2, code(QC_NODE('primera')), X(11, Y));
f.add('Necesita revision', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ $json.necesita_revision }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] }, options: {},
}, X(12, Y));
f.add('Preparar revision', 'n8n-nodes-base.code', 2, code(`
const q = $json; const prep = $('Preparar redaccion').first().json;
const usuario = prep.usuario + '\\n\\n════ BORRADOR ACTUAL (JSON) ════\\n' + JSON.stringify(q.articulo) +
  '\\n\\n════ CONTROL SEO AUTOMÁTICO (puntuación ' + q.score + '/100) ════' +
  (q.bloqueantes.length ? '\\nFALLOS BLOQUEANTES (si no se corrigen, no se publica):\\n- ' + q.bloqueantes.join('\\n- ') : '') +
  (q.avisos.length ? '\\nMEJORAS:\\n- ' + q.avisos.join('\\n- ') : '') +
  '\\n\\nDevuelve el artículo COMPLETO corregido con el mismo esquema. Corrige primero todos los bloqueantes y después las mejoras, sin perder calidad, datos ni extensión. No inventes nada para corregirlos: si una cifra no tiene fuente, quítala o márcala dentro de un ejemplo ficticio; si un enlace no existe, usa uno de las listas.';
const sistema = prep.sistema;
${reqJs({ model: 'gpt-5.5', effort: 'medium', schemaName: 'articulo', schema: ARTICULO_SCHEMA, maxTokens: 40000 })}
return [{ json: { req } }];
`), X(13, Y + 1));
f.add('Revisar articulo', 'n8n-nodes-base.httpRequest', 4.2,
  OPENAI_HTTP,
  X(14, Y + 1), { credentials: CRED.openai, onError: 'continueRegularOutput' });
f.add('Control calidad 2', 'n8n-nodes-base.code', 2, code(QC_NODE('revisada')), X(15, Y + 1), { onError: 'continueRegularOutput' });

f.add('Articulo final', 'n8n-nodes-base.code', 2, code(`${UTIL}
const q1 = $('Control calidad').first().json;
let q = q1;
try { const q2 = $('Control calidad 2').first().json; if (q2 && q2.articulo && Array.isArray(q2.bloqueantes) && (q2.bloqueantes.length < q1.bloqueantes.length || (q2.bloqueantes.length === q1.bloqueantes.length && q2.score >= q1.score))) q = q2; } catch (e) {}
const a = q.articulo;
const cats = ($('Categorias').first().json.body || []);
const rb = $('Bloquear brief').first().json;
const T = tipoDe(rb.guia, rb.brief.tipo || 'actualidad');
const VIEJAS = { 'noticias-ia': 'actualidad-ia', 'trucos-y-consejos-ia': 'actualidad-ia', 'servicios-y-herramientas-de-ia': 'actualidad-ia', 'guias-ia': 'actualidad-ia', 'automatizacion': 'gestion-y-facturacion', 'sobre-la-ia': 'gestion-y-facturacion' };
const nuevaSlug = (s) => VIEJAS[s] || s;
const cat = cats.find(c => c.slug === nuevaSlug(a.categoria)) || cats.find(c => c.slug === nuevaSlug(T.categoria)) || cats.find(c => c.slug === 'actualidad-ia') || cats[0] || { id: 1 };
const etiquetas = [...new Set((a.etiquetas || []).map(t => String(t).trim()).filter(t => t.length > 1 && t.length < 40))].slice(0, 4);
return [{ json: { ...q, categoria_id: cat.id, categoria_nombre: cat.name, etiquetas } }];
`), X(16, Y));

f.link('Ruta', 'Bloquear brief', 2);
f.link('Bloquear brief', 'Brief libre');
f.link('Brief libre', 'Aviso redactando', 0);
f.link('Brief libre', 'Inventario enlaces', 0);
f.link('Brief libre', 'Aviso ya en marcha', 1);
f.chain('Inventario enlaces', 'Paginas', 'Categorias', 'Preparar investigacion', 'Investigar actualidad', 'Preparar redaccion', 'Redactar articulo', 'Control calidad', 'Necesita revision');
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
f.add('Prompts imagen', 'n8n-nodes-base.code', 2, code(`${UTIL}
const f = $('Articulo final').first().json; const a = f.articulo;
const rb = $('Bloquear brief').first().json;
const estilo = ' ' + tipoDe(rb.guia, rb.brief.tipo || 'actualidad').estilo_prompt + ' Absolutely no text, letters, numbers, logos, signage or invented brand names anywhere in the image.';
const roles = ['portada', 'seccion_1', 'seccion_2'];
return roles.map((rol, i) => {
  const im = (a.imagenes || []).find(x => x.rol === rol) || (a.imagenes || [])[i] || { prompt: 'A clear visual metaphor for ' + a.focus_keyword, alt: a.title, titulo: a.focus_keyword, pie: '' };
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

const entradilla = a.entradilla ? '<p class="tca-entradilla">' + esc(a.entradilla) + '</p>' : '';
const esencial = (a.lo_esencial || []).length ? '<div class="tca-esencial"><p class="tca-esencial__titulo"><strong>Lo esencial</strong></p><ul>' + a.lo_esencial.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul></div>' : '';
const indice = toc.length >= 3 ? '<nav class="tca-indice" aria-label="Índice del artículo"><p class="tca-indice__titulo"><strong>En este artículo</strong></p><ol>' + toc.map(x => '<li><a href="#' + x.id + '">' + esc(x.t) + '</a></li>').join('') + '<li><a href="#preguntas-frecuentes">Preguntas frecuentes</a></li></ol></nav>' : '';
const faq = (a.faq || []).slice(0, 6);
const faqHtml = faq.length ? '<h2 id="preguntas-frecuentes">Preguntas frecuentes</h2>' + faq.map(x => '<h3>' + esc(x.pregunta) + '</h3><p>' + esc(x.respuesta) + '</p>').join('') : '';
const fuentes = (a.fuentes || []).filter(x => /^https?:\\/\\//.test(x.url)).slice(0, 8);
const hoy = hoyMadrid();
const fuentesHtml = fuentes.length ? '<h2 id="fuentes">Fuentes</h2><ul class="tca-fuentes">' + fuentes.map(x => '<li><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.nombre) + '</a> <span class="tca-consulta">(consultado el ' + hoy + ')</span></li>').join('') + '</ul>' : '';
const firma = '<p class="tca-firma">Redacción Transforma con IA · Actualizado el ' + hoy + '. Revisamos este artículo cuando cambian la normativa, los precios o las herramientas.</p>';
const T = tipoDe(r.guia, r.brief.tipo || 'actualidad');
const autor = (${cajaAutor.toString()})(T.cta || '');
const estilos = '<style>.tca-entradilla{font-size:1.12em;line-height:1.65;margin:0 0 22px}.tca-ejemplo{background:#faf5ff;border:1px dashed #b020ff;border-radius:10px;padding:14px 18px;margin:24px 0}.tca-ejemplo p:last-child{margin-bottom:0}.tca-consulta{color:#6b7280;font-size:.9em}.tca-firma{font-size:.88em;color:#6b7280;margin:18px 0 0}.tca-esencial{background:#f4f7fb;border-left:4px solid #8a14d0;border-radius:10px;padding:16px 20px;margin:0 0 24px}.tca-esencial ul{margin:6px 0 0 18px}.tca-indice{background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:14px 20px;margin:0 0 28px}.tca-indice ol{margin:6px 0 0 18px}.tca-figura{margin:32px 0}.tca-figura img{border-radius:12px;width:100%;height:auto}.tca-figura figcaption{font-size:.85em;color:#6b7280;text-align:center;margin-top:8px}.tca-autor{display:block;background:linear-gradient(135deg,#0d0912,#2c0d45);color:#e6dcef;border-radius:16px;padding:24px 28px;margin:40px 0 10px;font-size:.96em}.tca-autor p{color:#e6dcef!important;margin:0 0 10px}.tca-autor .tca-autor__etiqueta{color:#c9b6f5!important;text-transform:uppercase;letter-spacing:.08em;font-size:12px;font-weight:700}.tca-autor .tca-autor__titulo{color:#fff!important;font-weight:700;font-size:1.12em;margin-top:18px}.tca-autor a{color:#ebd3f8!important;font-weight:700}.entry-content table{width:100%;border-collapse:collapse;margin:24px 0}.entry-content th,.entry-content td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left}.entry-content th{background:#f4f7fb}.entry-content pre{background:#0f172a;color:#e2e8f0;border-radius:10px;padding:14px 16px;overflow-x:auto;font-size:.88em;line-height:1.55;margin:20px 0}.entry-content pre code{background:none;color:inherit;padding:0}.entry-content :not(pre)>code{background:#eef2ff;color:#1e3a8a;border-radius:5px;padding:1px 5px;font-size:.9em}</style>';
const faqSchema = faq.length >= 2 ? '<script type="application/ld+json">' + JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(x => ({ '@type': 'Question', name: x.pregunta, acceptedAnswer: { '@type': 'Answer', text: x.respuesta } })) }) + '</script>' : '';

const contenido = estilos + entradilla + esencial + indice + html + faqHtml + fuentesHtml + firma + autor + faqSchema;
let borradorApp = false; try { borradorApp = $('Enrutar entrada').first().json.borrador === true; } catch (e) {}
const forzado = !!(r.brief.forzar_borrador || borradorApp);
const bloq = F.bloqueantes || [];
const publicar = (ajustes.modo || 'publicar') === 'publicar' && F.score >= F.minimo && !bloq.length && !forzado;
const motivoBorrador = publicar ? '' : forzado ? 'se pidió borrador' : bloq.length ? 'quedan fallos bloqueantes del control SEO' : F.score < F.minimo ? 'no llega al mínimo de calidad (' + F.minimo + ')' : 'el modo de publicación es borrador';
const seoTitle = (a.seo_title || a.title).length <= 40 ? (a.seo_title || a.title) + ' %sep% %sitename%' : (a.seo_title || a.title);
const post = {
  title: a.title, content: contenido, excerpt: a.extracto, slug: a.slug,
  status: publicar ? 'publish' : 'draft', categories: [F.categoria_id], tags: [...new Set(tagIds)],
  featured_media: img.portada ? img.portada.id : 0, comment_status: 'closed', ping_status: 'closed',
};
const meta = { rank_math_title: seoTitle, rank_math_description: a.meta_description,
  rank_math_focus_keyword: [a.focus_keyword, ...(a.keywords_secundarias || []).slice(0, 4)].join(','),
  rank_math_facebook_title: a.title, rank_math_facebook_description: a.meta_description,
  rank_math_twitter_use_facebook: 'on' };
const x = F.metricas || {};
const informe = (publicar ? '✅ <b>Publicado</b>' : '📝 <b>Guardado como borrador</b> (' + esc(motivoBorrador) + ')') + '\\n\\n' +
  '<b>' + esc(a.title) + '</b>\\n__LINK__\\n\\n' +
  '📊 SEO ' + F.score + '/100 · ' + (x.palabras || 0) + ' palabras (rango ' + esc(x.rango || '') + ') · ' + (x.h2 || 0) + ' H2 · ' + (x.internos || 0) + ' enlaces internos (' + (x.a_paginas || 0) + ' a servicios) · ' + (x.externos || 0) + ' fuentes · ' + (x.faq || 0) + ' FAQ\\n' +
  '🔗 ' + (x.enlaces_comprobados || 0) + ' enlaces comprobados' + (x.enlaces_no_200 ? ' (' + x.enlaces_no_200 + ' sin 200)' : ', todos responden') + '\\n' +
  '🖼 ' + subidas.length + '/3 imágenes WebP con alt · 📂 ' + esc(F.categoria_nombre) + '\\n🔑 <code>' + esc(a.focus_keyword) + '</code>\\n' +
  '⚡ Rank Math configurado' + (publicar ? ' · IndexNow enviado' : '') +
  (bloq.length ? '\\n\\n<b>⛔ Bloqueantes:</b>\\n• ' + bloq.slice(0, 5).map(esc).join('\\n• ') : '') +
  ((F.avisos || []).length ? '\\n\\n<b>Detalles a pulir:</b>\\n• ' + F.avisos.slice(0, 5).map(esc).join('\\n• ') : '');
return [{ json: { post, meta, publicar, motivo_borrador: motivoBorrador, imagenes: subidas.length, score: F.score, issues: F.issues, bloqueantes: bloq, avisos: F.avisos || [], canibal: F.canibal || [], metricas: F.metricas, categoria: F.categoria_nombre, informe: informe.slice(0, 3900), articulo: { title: a.title, focus_keyword: a.focus_keyword, slug: a.slug } } }];
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
  text: "={{ $('Montar HTML').first().json.informe.replace('__LINK__', $('Crear post').first().json.link || '') }}",
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

// ---------- LinkedIn: página de empresa (RAMA DESACTIVADA por defecto) ----------
// Solo posts de la categoría 70 («IA en la industria») y solo si seo.settings.linkedin_activo = true.
// Sin fila o con false, la rama no hace nada y el resto del publicador queda igual.
// Antes de encenderla: crear la página de empresa y la app de LinkedIn, rellenar LI_ORG_ID y LI_CRED.
const LI_ORG_ID = ''; // solo el número de la página de empresa (vacío = la rama no se puede usar)
const LI_CRED = null; // al crear la credencial: { linkedInOAuth2Api: { id: '...', name: '...' } }
const LI_CAT_ID = 70;
f.add('Leer ajuste LinkedIn', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select value from seo.settings where key='linkedin_activo'` }, X(14.5, 10.6), { credentials: CRED.pg, alwaysOutputData: true, onError: 'continueRegularOutput' });
f.add('LinkedIn activo?', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [
      { leftValue: '={{ $json.value }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } },
      { leftValue: "={{ Number($('Articulo final').first().json.categoria_id) }}", rightValue: LI_CAT_ID, operator: { type: 'number', operation: 'equals' } },
    ] }, options: {},
}, X(15.5, 10.6));
f.add('Preparar LinkedIn', 'n8n-nodes-base.code', 2, code(`${UTIL}
const a = $('Articulo final').first().json.articulo;
const cp = $('Crear post').first().json;
const prompts = $('Prompts imagen').all().map(i => i.json);
const subidas = $('Subir imagen').all().map((i, k) => ({ ...prompts[k], id: i.json && i.json.id, url: i.json && i.json.source_url })).filter(x => Number.isInteger(x.id) && x.url);
const portada = subidas.find(x => x.rol === 'portada');
if (!portada) throw new Error('el artículo no tiene imagen destacada subida a WordPress');
if (!cp.link) throw new Error('WordPress no devolvió el enlace del artículo');
const titular = decode(a.title);
const entradilla = decode(a.extracto).trim();
const enlace = cp.link + (String(cp.link).includes('?') ? '&' : '?') + 'utm_source=linkedin&utm_medium=social';
const texto = titular + '\\n\\n' + entradilla + '\\n\\nLéelo completo: ' + enlace + '\\n\\n— Transforma con IA';
return [{ json: { texto: texto.slice(0, 2900), imagen_url: portada.url, titular, enlace } }];
`), X(16.5, 10.6), { onError: 'continueErrorOutput' });
f.add('Descargar portada', 'n8n-nodes-base.httpRequest', 4.2, {
  url: '={{ $json.imagen_url }}',
  options: { timeout: 60000, response: { response: { responseFormat: 'file', outputPropertyName: 'image' } } },
}, X(17.5, 10.6), { onError: 'continueRegularOutput' });
f.add('Publicar LinkedIn', 'n8n-nodes-base.linkedIn', 1, {
  postAs: 'organization', organization: LI_ORG_ID,
  text: "={{ $('Preparar LinkedIn').first().json.texto }}",
  shareMediaCategory: 'IMAGE', binaryPropertyName: '=image', additionalFields: {},
}, X(18.5, 10.6), { ...(LI_CRED ? { credentials: LI_CRED } : {}), onError: 'continueErrorOutput' });
f.add('Aviso LinkedIn', 'n8n-nodes-base.telegram', 1.2, {
  chatId: CHAT_ID,
  text: "=⚠️ No he podido publicar en LinkedIn el artículo «{{ $('Articulo final').first().json.articulo.title }}».\nMotivo: {{ (typeof $json.error === 'string' ? $json.error : ($json.error && ($json.error.message || $json.error.description))) || 'error desconocido' }}\nEl artículo sigue publicado en la web.",
  additionalFields: { appendAttribution: false, disable_web_page_preview: true },
}, X(19.5, 11.6), { credentials: tg, onError: 'continueRegularOutput' });
f.link('Se publica', 'Leer ajuste LinkedIn', 0);
f.chain('Leer ajuste LinkedIn', 'LinkedIn activo?');
f.link('LinkedIn activo?', 'Preparar LinkedIn', 0);
f.link('Preparar LinkedIn', 'Descargar portada', 0);
f.link('Preparar LinkedIn', 'Aviso LinkedIn', 1);
f.link('Descargar portada', 'Publicar LinkedIn', 0);
f.link('Publicar LinkedIn', 'Aviso LinkedIn', 1);

// 'Prompts imagen' y 'Montar HTML' deben correr una sola vez aunque les lleguen varios items
for (const n of f.nodes) if (['Prompts imagen', 'Montar HTML', 'Informe final', 'Registrar', 'IndexNow', 'Meta Rank Math'].includes(n.name)) n.executeOnce = true;

const wf = f.json({ saveDataErrorExecution: 'all', saveDataSuccessExecution: 'all', saveManualExecutions: true, timezone: 'Europe/Madrid', callerPolicy: 'workflowsFromSameOwner' });
checkExpr(wf);
fs.writeFileSync(new URL('./publicador.build.json', import.meta.url), JSON.stringify(wf, null, 1));
if (process.argv.includes('--dry')) { console.log('dry run, nodos:', wf.nodes.length); process.exit(0); }
const r = await n8n.upsert(wf, ID);
await n8n.activate(r.id);
console.log('PUBLICADOR v3 ->', r.id, 'nodos:', wf.nodes.length);
