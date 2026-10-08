// Flujo «WEB TRANSFORMACONIA → contacto y boletín»: formulario de la web y altas/bajas del boletín semanal.
// Uso: node n8n/web-contacto.mjs   (crea o actualiza; el id queda en n8n/web-ids.json)
import fs from 'node:fs';
import { Flow, code, CRED, checkExpr, n8n } from './lib.mjs';

const IDS = 'n8n/web-ids.json';
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
const TG = { telegramApi: { id: 'Odcx9XT24MzT5aa0', name: 'Agente Juanky personal' } };
const GMAIL = { gmailOAuth2: { id: '0aSRqFmP9FX7rNEL', name: 'Gmail account' } };
const BASE = 'https://paneln8n.transformaconia.com/webhook';
const SITE = 'https://transformaconia.com';
const X = (c, r) => [c * 240, r * 200];

const f = new Flow('WEB TRANSFORMACONIA → contacto y boletín');

// ---------- formulario (POST) ----------
f.add('Formulario web', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'web-transformaconia', responseMode: 'responseNode', options: { allowedOrigins: '*' } }, X(0, 1), { webhookId: 'web-transformaconia' });
f.add('Validar', 'n8n-nodes-base.code', 2, code(`
const b = $input.first().json.body || {};
const t = (v, n = 1500) => String(v ?? '').trim().slice(0, n);
const esc = v => t(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const d = { tipo: ['boletin', 'medida'].includes(t(b.tipo, 20)) ? t(b.tipo, 20) : 'contacto', nombre: t(b.nombre, 120), empresa: t(b.empresa, 160), sector: t(b.sector, 120), email: t(b.email, 160).toLowerCase(), mensaje: t(b.mensaje, 3000), origen: t(b.origen, 300) };
const emailOk = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(d.email);
const valido = !t(b.web) && emailOk && (d.tipo === 'boletin' || (d.tipo === 'medida' && d.mensaje.length > 3) || (d.nombre.length > 1 && d.mensaje.length > 5));
const token = [...Array(32)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
const medida = d.tipo === 'medida';
const filas = medida ? [['Nombre', d.nombre || '-'], ['Email', d.email], ['Plan', d.sector || '-'], ['Temas que quiere seguir', d.mensaje], ['Página', d.origen || '-']] : [['Nombre', d.nombre], ['Empresa', d.empresa || '-'], ['Sector', d.sector || '-'], ['Email', d.email], ['Qué quiere automatizar', d.mensaje], ['Página', d.origen || '-']];
const html = '<h2 style="font-family:Arial">' + (medida ? 'Nueva petición de boletín a medida' : 'Nuevo contacto desde la web') + '</h2><table style="font-family:Arial;font-size:14px;border-collapse:collapse">' + filas.map(([k, v]) => '<tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;vertical-align:top">' + k + '</td><td style="padding:6px 12px;border:1px solid #ddd;white-space:pre-wrap">' + esc(v) + '</td></tr>').join('') + '</table><p style="font-family:Arial;font-size:13px;color:#666">Responde a este correo y le llega directamente al cliente.</p>';
const texto = d.tipo === 'boletin'
  ? '📰 Nueva alta en el boletín (pendiente de confirmar): ' + d.email
  : medida ? '📰 Boletín A MEDIDA pedido\\n\\n✉️ ' + d.email + (d.nombre ? ' (' + d.nombre + ')' : '') + '\\n📦 ' + d.sector + '\\n\\nQuiere seguir: ' + d.mensaje.slice(0, 1500) + '\\n\\nRespóndele con una muestra y el precio.'
  : '📩 Nuevo contacto web\\n\\n👤 ' + d.nombre + (d.empresa ? ' · ' + d.empresa : '') + (d.sector ? ' (' + d.sector + ')' : '') + '\\n✉️ ' + d.email + '\\n\\n' + d.mensaje.slice(0, 1500) + '\\n\\n🔗 ' + (d.origen || '-');
return [{ json: { ...d, valido, token, html, texto, asunto: medida ? 'Boletín a medida: ' + d.email : 'Contacto web: ' + (d.empresa || d.nombre) } }];
`), X(1, 1));
f.add('¿Válido?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'v', leftValue: '={{ $json.valido }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(2, 1));
f.add('¿Boletín?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'b', leftValue: '={{ $json.tipo }}', rightValue: 'boletin', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, options: {} }, X(3, 0.5));

// contacto
f.add('Guardar contacto', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: 'insert into seo.contactos (tipo, nombre, empresa, sector, email, mensaje, origen) values ($1, $2, $3, $4, $5, $6, $7) returning id',
  options: { queryReplacement: "={{ [ $json.tipo, $json.nombre, $json.empresa, $json.sector, $json.email, $json.mensaje, $json.origen ] }}" } }, X(4, 1), { credentials: CRED.pg, onError: 'continueRegularOutput' });
f.add('Correo a info@', 'n8n-nodes-base.gmail', 2.1, { sendTo: 'info@transformaconia.com', subject: "={{ $('Validar').first().json.asunto }}", message: "={{ $('Validar').first().json.html }}", options: { appendAttribution: false, senderName: 'Web Transforma con IA', replyTo: "={{ $('Validar').first().json.email }}" } }, X(5, 1), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('Telegram contacto', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: "={{ $('Validar').first().json.texto }}", additionalFields: { appendAttribution: false } }, X(6, 1), { credentials: TG, onError: 'continueRegularOutput' });
f.add('OK contacto', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={"ok": true}', options: {} }, X(7, 1));

// boletín
f.add('Guardar suscriptor', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.suscriptores (email, token, origen) values ($1, $2, $3)
on conflict (email) do update set baja = false, origen = excluded.origen
returning email, token, confirmado`,
  options: { queryReplacement: "={{ [ $json.email, $json.token, $json.origen ] }}" } }, X(4, 0), { credentials: CRED.pg });
f.add('Preparar confirmación', 'n8n-nodes-base.code', 2, code(`
const s = $input.first().json;
const url = '${BASE}/web-boletin?a=alta&t=' + s.token;
const html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b1520"><h2 style="color:#8a14d0">Confirma tu suscripción</h2><p>Has pedido recibir <b>el boletín semanal de Transforma con IA</b>: las noticias de inteligencia artificial que importan a una empresa, explicadas en cinco minutos. Cada lunes por la mañana.</p><p style="margin:28px 0"><a href="' + url + '" style="background:#8a14d0;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Sí, quiero recibirlo</a></p><p style="font-size:13px;color:#666">Si no lo has pedido tú, ignora este correo y no recibirás nada.</p></div>';
return [{ json: { ...s, html, enviar: !s.confirmado } }];
`), X(5, 0));
f.add('Correo confirmación', 'n8n-nodes-base.gmail', 2.1, { sendTo: '={{ $json.email }}', subject: 'Confirma tu suscripción al boletín de Transforma con IA', message: '={{ $json.html }}', options: { appendAttribution: false, senderName: 'Transforma con IA' } }, X(6, 0), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('OK boletín', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={"ok": true}', options: {} }, X(7, 0));
f.add('OK descartado', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={"ok": true}', options: {} }, X(3, 1.6));

// ---------- confirmar / darse de baja (GET desde el correo) ----------
f.add('Enlace boletín', 'n8n-nodes-base.webhook', 2, { httpMethod: 'GET', path: 'web-boletin', responseMode: 'responseNode', options: {} }, X(0, 3), { webhookId: 'web-boletin' });
f.add('Alta o baja', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.suscriptores set
  confirmado = case when $1 = 'alta' then true else confirmado end,
  confirmado_at = case when $1 = 'alta' and confirmado_at is null then now() else confirmado_at end,
  baja = ($1 = 'baja')
where token = $2 returning email, baja`,
  options: { queryReplacement: "={{ [ String($json.query.a || ''), String($json.query.t || 'x').replace(/[^a-f0-9]/g, '') ] }}" } }, X(1, 3), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Destino', 'n8n-nodes-base.code', 2, code(`
const r = $input.first().json;
const a = String($('Enlace boletín').first().json.query.a || '');
const estado = !r.email ? 'error' : (a === 'baja' ? 'baja' : 'ok');
return [{ json: { url: '${SITE}/boletin/?estado=' + estado + '#tc-estado', email: r.email || '', estado } }];
`), X(2, 3));
f.add('Redirigir', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'redirect', redirectURL: '={{ $json.url }}', options: {} }, X(3, 3));
f.add('Telegram alta', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: "={{ ($json.estado === 'ok' ? '✅ Suscriptor confirmado: ' : '👋 Baja del boletín: ') + $json.email }}", additionalFields: { appendAttribution: false } }, X(4, 3), { credentials: TG, onError: 'continueRegularOutput' });

f.chain('Formulario web', 'Validar', '¿Válido?');
f.link('¿Válido?', '¿Boletín?', 0);
f.link('¿Válido?', 'OK descartado', 1);
f.link('¿Boletín?', 'Guardar suscriptor', 0);
f.link('¿Boletín?', 'Guardar contacto', 1);
f.chain('Guardar contacto', 'Correo a info@', 'Telegram contacto', 'OK contacto');
f.chain('Guardar suscriptor', 'Preparar confirmación', 'Correo confirmación', 'OK boletín');
f.chain('Enlace boletín', 'Alta o baja', 'Destino', 'Redirigir', 'Telegram alta');

const wf = f.json({ saveDataSuccessExecution: 'all' });
checkExpr(wf);
const r = await n8n.upsert(wf, ids.contacto);
ids.contacto = r.id;
fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
await n8n.activate(r.id);
console.log('flujo', r.id, 'activo');
