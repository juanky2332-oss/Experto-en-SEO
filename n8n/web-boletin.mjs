// Flujo «WEB · boletín semanal»: cada lunes 8:00 (Madrid) envía las noticias de la semana a los suscriptores confirmados.
// Uso: node n8n/web-boletin.mjs [--probar]   (--probar lo ejecuta ya y solo envía a info@transformaconia.com)
import fs from 'node:fs';
import { Flow, code, CRED, checkExpr, n8n, OPENAI_HTTP, reqJs, PARSE_RESPONSES } from './lib.mjs';

const IDS = 'n8n/web-ids.json';
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
const TG = { telegramApi: { id: 'Odcx9XT24MzT5aa0', name: 'Agente Juanky personal' } };
const GMAIL = { gmailOAuth2: { id: '0aSRqFmP9FX7rNEL', name: 'Gmail account' } };
const BAJA = 'https://paneln8n.transformaconia.com/webhook/web-boletin?a=baja&t=';
const X = (c, r = 0) => [c * 240, r * 200];

const f = new Flow('WEB · boletín semanal');
f.add('Lunes 8:00', 'n8n-nodes-base.scheduleTrigger', 1.2, { rule: { interval: [{ field: 'cronExpression', expression: '0 8 * * 1' }] } }, X(0));
f.add('Prueba manual', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'web-boletin-prueba', authentication: 'headerAuth', responseMode: 'onReceived', options: {} }, X(0, 1), { webhookId: 'web-boletin-prueba', credentials: CRED.gateway });

f.add('Modo', 'n8n-nodes-base.code', 2, code(`
const prueba = !!$input.first().json.headers;
const desde = new Date(Date.now() - 7 * 86400000).toISOString();
return [{ json: { prueba, desde } }];
`), X(1, 0.5));
f.add('Noticias de la semana', 'n8n-nodes-base.httpRequest', 4.2, {
  url: 'https://transformaconia.com/wp-json/wp/v2/posts',
  sendQuery: true,
  queryParameters: { parameters: [
    { name: 'after', value: '={{ $json.desde }}' }, { name: 'per_page', value: '8' }, { name: '_embed', value: 'wp:featuredmedia,wp:term' },
    { name: '_fields', value: 'title,link,excerpt,date,_links,_embedded' }] },
  options: {},
}, X(2, 0.5));
f.add('Preparar petición', 'n8n-nodes-base.code', 2, code(`
const posts = $input.all().map(i => i.json).filter(p => p && p.link);
if (!posts.length) return [];
const limpia = s => String(s || '').replace(/<[^>]+>/g, '').replace(/&#8230;|&hellip;/g, '…').replace(/&nbsp;/g, ' ').replace(/&#82(16|17);/g, "'").replace(/&#82(20|21);/g, '"').replace(/&amp;/g, '&').trim();
const items = posts.map(p => ({ titulo: limpia(p.title.rendered), url: p.link, resumen: limpia(p.excerpt.rendered).slice(0, 400),
  imagen: (((p._embedded || {})['wp:featuredmedia'] || [])[0] || {}).source_url || '',
  categoria: ((((p._embedded || {})['wp:term'] || [])[0] || [])[0] || {}).name || '' }));
const sistema = 'Eres el editor del boletín semanal de Transforma con IA, para gerentes y responsables de pymes españolas, sobre todo industriales. Escribe en español de España, claro y directo, sin tecnicismos ni frases hechas.';
const usuario = 'Para cada noticia escribe: "porque" (una frase de máximo 25 palabras sobre por qué importa a una empresa) y "accion" (una frase de máximo 20 palabras con algo concreto que una pyme puede hacer esta semana). Además escribe "intro": dos frases que resuman la semana. Noticias:\\n' + items.map((x, i) => (i + 1) + '. ' + x.titulo + ' — ' + x.resumen).join('\\n');
const schema = { type: 'object', additionalProperties: false, required: ['intro', 'notas'], properties: { intro: { type: 'string' }, notas: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['porque', 'accion'], properties: { porque: { type: 'string' }, accion: { type: 'string' } } } } } };
${reqJs({ model: 'gpt-5.5', effort: 'low', schemaName: 'boletin', schema: '__S__', maxTokens: 4000 }).replace('"__S__"', 'schema')}
return [{ json: { req, items } }];
`, 'runOnceForAllItems'), X(3, 0.5));
f.add('IA: qué hacer', 'n8n-nodes-base.httpRequest', 4.2, OPENAI_HTTP, X(4, 0.5), { credentials: CRED.openai, onError: 'continueRegularOutput' });
f.add('Suscriptores', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select email, token from seo.suscriptores where confirmado and not baja and ($1 = 'no' or email = 'info@transformaconia.com')
union all select 'info@transformaconia.com', 'prueba' where $1 = 'si' and not exists (select 1 from seo.suscriptores where email = 'info@transformaconia.com' and confirmado and not baja)`,
  options: { queryReplacement: "={{ [ $('Modo').first().json.prueba ? 'si' : 'no' ] }}" } }, X(5, 0.5), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Componer correos', 'n8n-nodes-base.code', 2, code(`
${PARSE_RESPONSES}
const { items } = $('Preparar petición').first().json;
let ia = { intro: '', notas: [] };
try { ia = leerRespuesta($('IA: qué hacer').first().json); } catch (e) {}
const subs = $input.all().map(i => i.json).filter(s => s && s.email);
if (!subs.length) return [];
const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', timeZone: 'Europe/Madrid' });
const bloques = items.map((x, i) => {
  const n = ia.notas[i] || {};
  return '<tr><td style="padding:0 0 28px">' + (x.imagen ? '<a href="' + x.url + '"><img src="' + x.imagen + '" width="560" style="width:100%;max-width:560px;border-radius:12px;display:block;margin-bottom:14px" alt=""></a>' : '')
    + (x.categoria ? '<div style="font:600 11px Arial;letter-spacing:.1em;text-transform:uppercase;color:#8a14d0;margin-bottom:6px">' + esc(x.categoria) + '</div>' : '')
    + '<a href="' + x.url + '" style="font:700 20px/1.3 Arial;color:#14101a;text-decoration:none">' + esc(x.titulo) + '</a>'
    + '<p style="font:15px/1.6 Arial;color:#4a4252;margin:8px 0 0">' + esc(n.porque || x.resumen) + '</p>'
    + (n.accion ? '<p style="font:15px/1.6 Arial;color:#14101a;margin:8px 0 0;padding:10px 14px;background:#f7efff;border-radius:8px"><b>Qué hacer:</b> ' + esc(n.accion) + '</p>' : '')
    + '<a href="' + x.url + '" style="display:inline-block;margin-top:10px;font:600 14px Arial;color:#8a14d0;text-decoration:none">Leer el artículo →</a></td></tr>';
}).join('');
return subs.map(s => ({ json: { email: s.email, token: s.token, asunto: 'Lo que importa de la IA esta semana · ' + fecha,
  html: '<div style="background:#f4f1f7;padding:24px 12px"><table role="presentation" width="100%" style="max-width:600px;margin:auto;background:#fff;border-radius:16px" cellpadding="0" cellspacing="0"><tr><td style="padding:28px 24px 8px;background:#0b0810;border-radius:16px 16px 0 0"><img src="https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-logo-v2.png" width="220" height="35" alt="Transforma con IA" style="display:block;width:220px;height:auto"><div style="font:13px Arial;color:#a9a1b4;margin-top:4px">Boletín semanal · ' + fecha + '</div></td></tr>'
    + '<tr><td style="padding:24px"><p style="font:16px/1.6 Arial;color:#14101a;margin:0 0 24px">' + esc(ia.intro || 'Estas son las noticias de inteligencia artificial de la semana que más pueden afectar a tu empresa.') + '</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + bloques + '</table>'
    + '<div style="padding:22px;border-radius:12px;background:#1d0d2b;margin-top:4px"><div style="font:700 18px Arial;color:#fff">¿Quieres aplicar algo de esto en tu empresa?</div><p style="font:14px/1.6 Arial;color:#d9cce6;margin:8px 0 14px">Cuéntame qué tarea os quita más tiempo y te digo en 30 minutos, gratis, qué se puede automatizar.</p><a href="https://transformaconia.com/contacto/" style="display:inline-block;background:#b020ff;color:#fff;font:600 14px Arial;padding:11px 18px;border-radius:8px;text-decoration:none">Pide tu diagnóstico gratis</a></div></td></tr>'
    + '<tr><td style="padding:0 24px 24px;font:12px/1.6 Arial;color:#8a8292">Recibes este correo porque te suscribiste en transformaconia.com. <a href="${BAJA}' + s.token + '" style="color:#8a8292">Darme de baja</a>.</td></tr></table></div>' } }));
`, 'runOnceForAllItems'), X(6, 0.5));
f.add('Enviar', 'n8n-nodes-base.gmail', 2.1, { sendTo: '={{ $json.email }}', subject: '={{ $json.asunto }}', message: '={{ $json.html }}', options: { appendAttribution: false, senderName: 'Transforma con IA' } }, X(7, 0.5), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('Resumen', 'n8n-nodes-base.code', 2, code(`
const n = $('Componer correos').all().length;
const emails = $('Componer correos').all().map(i => i.json.email).filter(e => e);
return [{ json: { n, emails, texto: '📰 Boletín semanal enviado a ' + n + ' suscriptor(es) con ' + $('Preparar petición').first().json.items.length + ' noticias.' + ($('Modo').first().json.prueba ? ' (PRUEBA)' : '') } }];
`, 'runOnceForAllItems'), X(8, 0.5));
f.add('Marcar envío', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: 'update seo.suscriptores set ultimo_envio = now() where email = any($1::text[]) returning email',
  options: { queryReplacement: "={{ [ '{' + $json.emails.map(e => '\"' + e + '\"').join(',') + '}' ] }}" } }, X(9, 0.5), { credentials: CRED.pg, onError: 'continueRegularOutput', alwaysOutputData: true });
f.add('Aviso Telegram', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: "={{ $('Resumen').first().json.texto }}", additionalFields: { appendAttribution: false } }, X(10, 0.5), { credentials: TG, onError: 'continueRegularOutput' });

f.link('Lunes 8:00', 'Modo');
f.link('Prueba manual', 'Modo');
f.chain('Modo', 'Noticias de la semana', 'Preparar petición', 'IA: qué hacer', 'Suscriptores', 'Componer correos', 'Enviar', 'Resumen', 'Marcar envío', 'Aviso Telegram');

const wf = f.json({ timezone: 'Europe/Madrid', saveDataSuccessExecution: 'all' });
checkExpr(wf);
const r = await n8n.upsert(wf, ids.boletin);
ids.boletin = r.id;
fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
await n8n.activate(r.id);
console.log('flujo', r.id, 'activo');
if (process.argv.includes('--probar')) {
  const t = await fetch('https://paneln8n.transformaconia.com/webhook/web-boletin-prueba', { method: 'POST', headers: { 'X-Seo-Key': process.env.SEO_GATEWAY_KEY } });
  console.log('prueba lanzada', t.status);
}
