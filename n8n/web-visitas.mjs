// Flujo «WEB TRANSFORMACONIA → visitas»: medición propia de la web, sin cookies ni IP.
// La web manda (sendBeacon) evento, ruta, etiqueta, dominio de procedencia y tipo de dispositivo.
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
const ua = String((j.headers || {})['user-agent'] || '');
const t = (v, n) => String(v ?? '').trim().slice(0, n);
const evento = ['visita', 'clic', 'contacto'].includes(b.e) ? b.e : '';
const ruta = t(b.r, 300).replace(/[?#].*$/, '');
const bot = /bot|crawl|spider|slurp|preview|headless|lighthouse|pagespeed|facebookexternalhit|whatsapp/i.test(ua);
if (!evento || !ruta.startsWith('/') || bot) return [];
const ref = t(b.f, 120).replace(/^www\\./, '');
return [{ json: { evento, ruta, etiqueta: t(b.l, 120), ref: ref === 'transformaconia.com' ? '' : ref, disp: b.m === '1' || b.m === 1 ? 'movil' : 'pc' } }];
`), [240, 0]);
f.add('Guardar', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: 'insert into seo.visitas (evento, ruta, etiqueta, ref, disp) values ($1, $2, $3, $4, $5)',
  options: { queryReplacement: '={{ [ $json.evento, $json.ruta, $json.etiqueta, $json.ref, $json.disp ] }}' } }, [480, 0], { credentials: CRED.pg });
f.chain('Visita', 'Limpiar', 'Guardar');

const wf = f.json({ saveDataSuccessExecution: 'none', saveDataErrorExecution: 'all' });
checkExpr(wf);
const r = await n8n.upsert(wf, ids.visitas);
ids.visitas = r.id;
fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
await n8n.activate(r.id);
console.log('flujo', r.id, 'activo');
