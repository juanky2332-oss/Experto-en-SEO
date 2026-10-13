// Flujo «WEB TRANSFORMACONIA → visitas»: medición propia de la web, sin cookies ni IP.
// La web manda (sendBeacon) evento, ruta, etiqueta, dominio de procedencia y tipo de dispositivo.
// Protegido (2026-10-13): solo se aceptan eventos con Origin o Referer de transformaconia.com, ruta/campos validados y
// máximo 40 eventos por minuto por huella de IP (HMAC con sal diaria, seo.huella(); la huella solo vive en seo.visitas_limite unos minutos; nunca se guarda en seo.visitas).
// Limpieza diaria: visitas de más de 13 meses.
// Uso: node n8n/web-visitas.mjs   (crea o actualiza; el id queda en n8n/web-ids.json)
import fs from 'node:fs';
import { Flow, code, CRED, checkExpr, n8n } from './lib.mjs';

const IDS = 'n8n/web-ids.json';
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
const f = new Flow('WEB TRANSFORMACONIA → visitas');

f.add('Visita', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'web-visita', responseMode: 'onReceived', responseCode: 204, options: { allowedOrigins: 'https://transformaconia.com' } }, [0, 0], { webhookId: 'web-visita' });
f.add('Limpiar', 'n8n-nodes-base.code', 2, code(`
const j = $input.first().json;
let b = j.body || {};
if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = Object.fromEntries(new URLSearchParams(b)); } }
if (!b || typeof b !== 'object') return [];
const h = j.headers || {};
const ua = String(h['user-agent'] || '');
const t = (v, n) => String(v ?? '').replace(/[\\u0000-\\u001f\\u007f]/g, ' ').trim().slice(0, n);
// solo eventos que vienen de nuestra propia web
const propio = /^https:\\/\\/(www\\.)?transformaconia\\.com(\\/|$)/i;
if (!propio.test(String(h.origin || '')) && !propio.test(String(h.referer || ''))) return [];
const evento = ['visita', 'clic', 'contacto'].includes(b.e) ? b.e : '';
const ruta = t(b.r, 200).replace(/[?#].*$/, '');
const bot = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp/i.test(ua);
if (!evento || !/^\\/[a-z0-9\\-\\/]*$/i.test(ruta) || bot) return [];
let ref = t(b.f, 100).replace(/^www\\./, '').toLowerCase();
if (!/^[a-z0-9.\\-]{1,100}$/.test(ref) || ref === 'transformaconia.com') ref = '';
const etiqueta = evento === 'visita' ? '' : t(b.l, 120);
// IP real: el ÚLTIMO valor de x-forwarded-for (lo añade el proxy; el primero lo controla el cliente) o x-real-ip
const xff = String(h['x-forwarded-for'] || '').split(',').map(x => x.trim()).filter(Boolean);
const ip = (xff.length ? xff[xff.length - 1] : String(h['x-real-ip'] || '').trim()).slice(0, 64) || ('sin-ip-' + Math.random());
return [{ json: { evento, ruta, etiqueta, ref, disp: b.m === '1' || b.m === 1 ? 'movil' : 'pc', ip } }];
`), [240, 0]);
f.add('Guardar', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with limpia as (delete from seo.visitas_limite where created_at < now() - interval '10 minutes'),
nueva as (insert into seo.visitas_limite (huella) values (seo.huella($6::text, 'visita')) returning huella)
insert into seo.visitas (evento, ruta, etiqueta, ref, disp)
select $1, $2, $3, $4, $5
where (select count(*) from seo.visitas_limite where huella = (select huella from nueva) and created_at > now() - interval '1 minute') < 40`,
  options: { queryReplacement: '={{ [ $json.evento, $json.ruta, $json.etiqueta, $json.ref, $json.disp, $json.ip ] }}' } }, [480, 0], { credentials: CRED.pg });
f.chain('Visita', 'Limpiar', 'Guardar');

// limpieza diaria: visitas de más de 13 meses, huellas de límite caducadas, huellas de IP de reservas y contactos con más de 48 h
// (ip_hash a null) y sal diaria de días anteriores (sin ella las huellas viejas ya no se pueden revertir)
f.add('Cada madrugada', 'n8n-nodes-base.scheduleTrigger', 1.2, { rule: { interval: [{ field: 'cronExpression', expression: '30 4 * * *' }] } }, [0, 200]);
f.add('Borrar antiguas', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with a as (delete from seo.visitas where created_at < now() - interval '13 months' returning 1),
b as (update seo.reservas set ip_hash = null where ip_hash is not null and created_at < now() - interval '48 hours' returning 1),
c as (update seo.contactos set ip_hash = null where ip_hash is not null and created_at < now() - interval '48 hours' returning 1),
d as (delete from seo.settings where key = 'sal_ip' and value->>'fecha' < to_char(now() at time zone 'Europe/Madrid', 'YYYY-MM-DD') returning 1),
e as (delete from seo.limite_auto where dia < (now() at time zone 'Europe/Madrid')::date returning 1)
delete from seo.visitas_limite where created_at < now() - interval '1 hour'`, options: {} }, [240, 200], { credentials: CRED.pg });
f.chain('Cada madrugada', 'Borrar antiguas');

const wf = f.json({ saveDataSuccessExecution: 'none', saveDataErrorExecution: 'all', timezone: 'Europe/Madrid' });
checkExpr(wf);
if (process.argv.includes('--probar')) { fs.writeFileSync(process.env.TEMP + '/web-visitas-wf.json', JSON.stringify(wf, null, 1)); console.log('probado en seco', wf.nodes.length); process.exit(0); }
if (ids.visitas) { fs.mkdirSync('_backups', { recursive: true }); fs.writeFileSync('_backups/web-visitas-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(await n8n.get('/workflows/' + ids.visitas), null, 1)); }
const r = await n8n.upsert(wf, ids.visitas);
ids.visitas = r.id;
fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
await n8n.activate(r.id);
console.log('flujo', r.id, 'activo');
