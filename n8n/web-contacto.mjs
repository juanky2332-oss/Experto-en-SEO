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
const ORIGINS = 'https://transformaconia.com,https://www.transformaconia.com';
const X = (c, r) => [c * 240, r * 200];

const f = new Flow('WEB TRANSFORMACONIA → contacto y boletín');

// ---------- formulario (POST) ----------
f.add('Formulario web', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'web-transformaconia', responseMode: 'responseNode', options: { allowedOrigins: ORIGINS } }, X(0, 1), { webhookId: 'web-transformaconia' });
f.add('Validar', 'n8n-nodes-base.code', 2, code(`
const j0 = $input.first().json;
const b = j0.body || {};
const h0 = j0.headers || {};
const t = (v, n = 1500) => String(v ?? '').trim().slice(0, n);
const esc = v => t(v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const d = { tipo: ['boletin', 'medida'].includes(t(b.tipo, 20)) ? t(b.tipo, 20) : 'contacto', nombre: t(b.nombre, 120), empresa: t(b.empresa, 160), sector: t(b.sector, 120), email: t(b.email, 160).toLowerCase(), mensaje: t(b.mensaje, 3000), origen: t(b.origen, 300), entrada: t(b.entrada, 200), procedencia: t(b.procedencia, 120).toLowerCase(), utm_source: t(b.utm_source, 60), utm_medium: t(b.utm_medium, 60), utm_campaign: t(b.utm_campaign, 80) };
const utm = [d.utm_source, d.utm_medium, d.utm_campaign].filter(Boolean).join(' / ');
const emailOk = /^[^\\s@,;<>"']+@[^\\s@,;<>"']+\\.[^\\s@,;<>"']{2,}$/.test(d.email);
// correo normalizado para los límites: sin +etiqueta en todos los dominios y sin puntos en gmail
const normEmail = e => { const p = e.split('@'); if (p.length !== 2) return e; let l = p[0].split('+')[0]; let dom = p[1]; if (dom === 'gmail.com' || dom === 'googlemail.com') { l = l.replace(/\\./g, ''); dom = 'gmail.com'; } return (l || p[0]) + '@' + dom; };
const email_norm = emailOk ? normEmail(d.email) : d.email;
// solo se aceptan envíos que vengan de nuestra propia web (Origin o Referer)
const propio = /^https:\\/\\/(www\\.)?transformaconia\\.com(\\/|$)/i;
const origenMal = !propio.test(String(h0.origin || '')) && !propio.test(String(h0.referer || ''));
// IP real: el ÚLTIMO valor de x-forwarded-for (lo añade el proxy; el primero lo controla el cliente) o x-real-ip
const xff = String(h0['x-forwarded-for'] || '').split(',').map(x => x.trim()).filter(Boolean);
const ip = (xff.length ? xff[xff.length - 1] : String(h0['x-real-ip'] || '').trim()).slice(0, 64);
const spam = !!t(b.web);
// pruebas: correo de la propia empresa o nombre que empieza por PRUEBA (no cuentan en el embudo ni generan evento de conversión)
const es_prueba = d.email === 'info@transformaconia.com' || /^prueba/i.test(d.nombre);
const acepta = d.tipo !== 'contacto' || t(b.acepto, 5) === 'si';
const valido = !origenMal && !spam && emailOk && acepta && (d.tipo === 'boletin' || (d.tipo === 'medida' && d.mensaje.length > 3) || (d.nombre.length > 1 && d.mensaje.length > 5));
// los bots (campo trampa relleno) reciben «ok» y se descartan; a una persona se le dice qué corregir
const error = valido || spam ? '' : origenMal ? 'Origen no permitido.' : !emailOk ? 'Revisa el correo: así no podemos contestarte.' : !acepta ? 'Marca la casilla de la política de privacidad para poder responderte.' : d.nombre.length < 2 ? 'Escribe tu nombre.' : 'Cuéntanos un poco más en el mensaje.';
// el token de los enlaces/botones lo genera Postgres con gen_random_uuid() (el Code node no permite el módulo crypto)
const medida = d.tipo === 'medida';
const filas = medida ? [['Nombre', d.nombre || '-'], ['Email', d.email], ['Plan', d.sector || '-'], ['Temas que quiere seguir', d.mensaje], ['Página', d.origen || '-']] : [['Nombre', d.nombre], ['Empresa', d.empresa || '-'], ['Sector', d.sector || '-'], ['Email', d.email], ['Qué quiere automatizar', d.mensaje], ['Página desde la que escribe', d.origen || '-'], ['Página de entrada', d.entrada || '-'], ['Procedencia', d.procedencia || 'directo o sin dato'], ['Campaña (utm)', utm || '-']];
const html = '<h2 style="font-family:Arial">' + (medida ? 'Nueva petición de boletín a medida' : 'Nuevo contacto desde la web') + '</h2><table style="font-family:Arial;font-size:14px;border-collapse:collapse">' + filas.map(([k, v]) => '<tr><td style="padding:6px 12px;border:1px solid #ddd;font-weight:bold;vertical-align:top">' + k + '</td><td style="padding:6px 12px;border:1px solid #ddd;white-space:pre-wrap">' + esc(v) + '</td></tr>').join('') + '</table><p style="font-family:Arial;font-size:13px;color:#666">Responde a este correo y le llega directamente al cliente.</p>';
const e2 = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');   // el aviso va en HTML: se escapa lo que escribe el usuario
const e = Object.fromEntries(Object.entries(d).map(([k, v]) => [k, e2(v)]));
const texto = d.tipo === 'boletin'
  ? '📰 Nueva alta en el boletín (pendiente de confirmar): ' + e.email
  : medida ? '📰 Boletín A MEDIDA pedido\\n\\n✉️ ' + e.email + (e.nombre ? ' (' + e.nombre + ')' : '') + '\\n📦 ' + e.sector + '\\n\\nQuiere seguir: ' + e2(d.mensaje.slice(0, 1500)) + '\\n\\nRespóndele con una muestra y el precio.'
  : '📩 Nuevo contacto web\\n\\n👤 ' + e.nombre + (e.empresa ? ' · ' + e.empresa : '') + (e.sector ? ' (' + e.sector + ')' : '') + '\\n✉️ ' + e.email + '\\n\\n' + e2(d.mensaje.slice(0, 1500)) + '\\n\\n🔗 ' + (e.origen || '-') + '\\n🧭 Entró por ' + (e.entrada || '-') + ' · llegó de ' + (e.procedencia || 'directo o sin dato') + (utm ? ' · ' + e2(utm) : '');
const nombre1 = (d.nombre.split(/\\s+/)[0] || '').replace(/[&<>"]/g, '');
const cuerpoCliente = [
  '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;color:#1b1520;line-height:1.55;font-size:15px">',
  '<img src="${SITE}/wp-content/uploads/2026/10/transforma-con-ia-logo-fondo-claro.png" alt="Transforma con IA" width="190" height="30" style="display:block;margin:0 0 18px;border:0">',
  '<h2 style="color:#8a14d0;margin:0 0 12px;font-size:22px">' + (nombre1 ? 'Hola, ' + nombre1 + ': ' : '') + 'recibido</h2>',
  '<p>Gracias por escribirnos. Hemos recibido tu mensaje y <b>te contestamos en menos de 24 horas</b> (en días laborables), personalmente y sin respuestas enlatadas.</p>',
  '<p style="margin:20px 0 6px"><b>Qué pasa ahora</b></p>',
  '<ol style="padding-left:20px;margin:0 0 16px"><li style="margin-bottom:6px">Leemos con calma lo que nos cuentas' + (d.empresa ? ' sobre ' + esc(d.empresa) : '') + '.</li><li style="margin-bottom:6px">Te escribimos con alguna pregunta concreta o con una primera idea de por dónde empezar.</li><li>Si encaja, hacemos una llamada de 30 minutos, el diagnóstico gratuito: vemos qué tarea os quita más tiempo, qué se puede automatizar y cuánto costaría de forma orientativa. Sin compromiso.</li></ol>',
  '<p>Si quieres ir adelantando, puedes responder a este correo contándonos qué tarea os come más horas y qué programas usáis hoy. No hace falta que sea nada técnico.</p>',
  '<p style="margin-top:22px">Un saludo,<br><b>El equipo de Transforma con IA</b><br><a href="${SITE}" style="color:#8a14d0">transformaconia.com</a></p>',
  '<p style="font-size:12px;color:#777;margin-top:22px">Recibes este correo porque has rellenado el formulario de contacto de transformaconia.com. Si no has sido tú, ignóralo y no volverás a saber de nosotros.</p>',
  '</div>'].join('');
const respuesta = JSON.stringify(spam && !origenMal ? { ok: true } : { ok: false, error });
return [{ json: { ...d, email_norm, es_prueba, ip, origen_mal: origenMal, utm, valido, spam, error, respuesta, html, texto, responder: d.tipo === 'contacto', cuerpoCliente, asunto: medida ? 'Boletín a medida: ' + d.email : 'Contacto web: ' + (d.empresa || d.nombre) } }];
`), X(1, 1));
f.add('¿Válido?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'v', leftValue: '={{ $json.valido }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(2, 1));
f.add('¿Boletín?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'b', leftValue: '={{ $json.tipo }}', rightValue: 'boletin', operator: { type: 'string', operation: 'equals' } }], combinator: 'and' }, options: {} }, X(3, 0.5));

// contacto
f.add('Guardar contacto', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  // Siempre se guarda el contacto. La respuesta automática (auto_resp) solo si el contador atómico seo.limite() lo permite: 3/día por correo normalizado (alias +x y puntos de gmail cuentan igual) y 10/día por huella de IP.
  query: `with hh as (select seo.huella($13::text, 'contacto') as h),
ev as (insert into seo.visitas (evento, ruta, etiqueta, ref, disp) select 'conversion', '/evento/contacto-enviado', left(coalesce($8::text, ''), 120), left(coalesce($9::text, ''), 100), null where $1::text = 'contacto' and not $15::boolean returning 1),
lim as (select case when $1::text <> 'contacto' then false else seo.limite('c:email:' || coalesce(seo.huella($14::text, 'email'), 'x'), 3) end as e,
                case when $1::text <> 'contacto' then false when (select h from hh) is null then true else seo.limite('c:ip:' || (select h from hh), 10) end as i)
insert into seo.contactos (tipo, nombre, empresa, sector, email, mensaje, origen, entrada, procedencia, utm_source, utm_medium, utm_campaign, token, ip_hash, auto_resp, email_norm, es_prueba)
select $1::text, $2, $3, $4, $5::text, $6, $7, $8, $9, $10, $11, $12, replace(gen_random_uuid()::text, '-', ''), (select h from hh), coalesce((select e and i from lim), false), $14::text, $15::boolean
returning id, auto_resp`,
  options: { queryReplacement: "={{ [ $json.tipo, $json.nombre, $json.empresa, $json.sector, $json.email, $json.mensaje, $json.origen, $json.entrada, $json.procedencia, $json.utm_source, $json.utm_medium, $json.utm_campaign, $json.ip, $json.email_norm, $json.es_prueba ] }}" } }, X(4, 1), { credentials: CRED.pg, onError: 'continueRegularOutput' });
// Botones de UN TOQUE (2026-10-13): callback_data wc:<id>:<estado>. Los recoge el MULTIAGENTE (uIr6eehJA1h2l3tP,
// nodo «Es contacto web?»), que actualiza seo.contactos, contesta y edita el mensaje. El enlace web-contacto-estado
// se mantiene solo para los avisos viejos que llevaban botón-enlace.
const BOTONES = (idExpr) => ({ replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [
  ['respondido', '✅ Respondido'], ['diagnostico', '📅 Diagnóstico'], ['no_encaja', '❌ No encaja'],
].map(([e, text]) => ({ text, additionalFields: { callback_data: "={{ 'wc:' + (" + idExpr + ") + ':" + e + "' }}" } })) } }] } });
f.add('Correo a info@', 'n8n-nodes-base.gmail', 2.1, { sendTo: 'info@transformaconia.com', subject: "={{ $('Validar').first().json.asunto }}", message: "={{ $('Validar').first().json.html }}", options: { appendAttribution: false, senderName: 'Web Transforma con IA', replyTo: "={{ $('Validar').first().json.email }}" } }, X(5, 1), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('Telegram contacto', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: "={{ $('Validar').first().json.texto + ($('Validar').first().json.responder && $('Guardar contacto').first().json.auto_resp === false ? '\\n\\n⚠️ No se ha enviado la respuesta automática (límite diario superado): contéstale tú.' : '') }}", additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true },
  ...BOTONES("$('Guardar contacto').first().json.id || 0") }, X(6, 1), { credentials: TG, onError: 'continueRegularOutput' });
f.add('¿Responder al cliente?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'r', leftValue: "={{ $('Guardar contacto').first().json.auto_resp === true }}", rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(6.5, 1.3));
f.add('Respuesta al cliente', 'n8n-nodes-base.gmail', 2.1, { sendTo: "={{ $('Validar').first().json.email }}", subject: 'Recibido: te escribimos en menos de 24 h · Transforma con IA', message: "={{ $('Validar').first().json.cuerpoCliente }}", options: { appendAttribution: false, senderName: 'Transforma con IA' } }, X(7, 1.3), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('OK contacto', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={"ok": true}', options: {} }, X(8, 1));

// boletín
f.add('Guardar suscriptor', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  // La confirmación solo se envía si no está confirmado, no se envió en las últimas 24 h y la huella de IP no pasa de 10 altas al día (contador atómico).
  query: `with hh as (select seo.huella($3::text, 'boletin') as h),
lim as (select case when (select h from hh) is null then true else seo.limite('b:ip:' || (select h from hh), 10) end as ok)
insert into seo.suscriptores as s (email, token, origen, confirm_enviada_en) values ($1, replace(gen_random_uuid()::text, '-', ''), $2, case when (select ok from lim) then now() end)
on conflict (email) do update set baja = false, origen = excluded.origen,
  confirm_enviada_en = case when not s.confirmado and (s.confirm_enviada_en is null or s.confirm_enviada_en < now() - interval '24 hours') and (select ok from lim) then now() else s.confirm_enviada_en end
returning s.email, s.token, s.confirmado, (s.confirm_enviada_en = now() and not s.confirmado) as enviar`,
  options: { queryReplacement: "={{ [ $json.email, $json.origen, $json.ip ] }}" } }, X(4, 0), { credentials: CRED.pg });
f.add('Preparar confirmación', 'n8n-nodes-base.code', 2, code(`
const s = $input.first().json;
const url = '${BASE}/web-boletin?a=alta&t=' + s.token;
const html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b1520"><h2 style="color:#8a14d0">Confirma tu suscripción</h2><p>Has pedido recibir <b>el boletín semanal de Transforma con IA</b>: las noticias de inteligencia artificial que importan a una empresa, explicadas en cinco minutos. Cada lunes por la mañana.</p><p style="margin:28px 0"><a href="' + url + '" style="background:#8a14d0;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold">Sí, quiero recibirlo</a></p><p style="font-size:13px;color:#666">Si no lo has pedido tú, ignora este correo y no recibirás nada.</p></div>';
return [{ json: { ...s, html, enviar: !!s.enviar } }];
`), X(5, 0));
f.add('¿Enviar confirmación?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'e', leftValue: '={{ $json.enviar }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(5.5, 0));
f.add('Correo confirmación', 'n8n-nodes-base.gmail', 2.1, { sendTo: '={{ $json.email }}', subject: 'Confirma tu suscripción al boletín de Transforma con IA', message: '={{ $json.html }}', options: { appendAttribution: false, senderName: 'Transforma con IA' } }, X(6, 0), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('OK boletín', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={"ok": true}', options: {} }, X(7, 0));
f.add('OK descartado', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={{ $json.respuesta }}', options: { responseCode: "={{ $json.spam && !$json.origen_mal ? 200 : ($json.origen_mal ? 403 : 422) }}" } }, X(3, 1.6));

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
f.add('Telegram alta', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: "={{ ($json.estado === 'ok' ? '✅ Suscriptor confirmado: ' : '👋 Baja del boletín: ') + String($json.email).replace(/&/g, '&amp;').replace(/</g, '&lt;') }}", additionalFields: { appendAttribution: false, parse_mode: 'HTML' } }, X(4, 3), { credentials: TG, onError: 'continueRegularOutput' });

f.chain('Formulario web', 'Validar', '¿Válido?');
f.link('¿Válido?', '¿Boletín?', 0);
f.link('¿Válido?', 'OK descartado', 1);
f.link('¿Boletín?', 'Guardar suscriptor', 0);
f.link('¿Boletín?', 'Guardar contacto', 1);
f.chain('Guardar contacto', 'Telegram contacto', 'Correo a info@', '¿Responder al cliente?');
f.link('¿Responder al cliente?', 'Respuesta al cliente', 0);
f.link('¿Responder al cliente?', 'OK contacto', 1);
f.link('Respuesta al cliente', 'OK contacto');

// ---------- seguimiento: botones del aviso (GET) y recordatorio a las 20 h laborables sin estado ----------
f.add('Enlace estado', 'n8n-nodes-base.webhook', 2, { httpMethod: 'GET', path: 'web-contacto-estado', responseMode: 'responseNode', options: {} }, X(0, 5), { webhookId: 'web-contacto-estado' });
f.add('Actualizar estado', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.contactos set estado = $2,
  respondido_en = case when $2 in ('respondido', 'diagnostico') then coalesce(respondido_en, now()) else respondido_en end
where token = $1 and tipo = 'contacto' and $2 in ('respondido', 'diagnostico', 'no_encaja')
returning id, nombre, empresa, estado`,
  options: { queryReplacement: "={{ [ String($json.query.t || 'x').replace(/[^a-f0-9]/g, ''), String($json.query.e || '') ] }}" } }, X(1, 5), { credentials: CRED.pg, alwaysOutputData: true });
f.add('Página estado', 'n8n-nodes-base.code', 2, code(`
const r = $input.first().json;
const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const txt = { respondido: '✅ Marcado como respondido', diagnostico: '📅 Marcado: diagnóstico acordado', no_encaja: '❌ Marcado como «no encaja»' };
const ok = !!r.id;
const titulo = ok ? txt[r.estado] : 'Enlace no válido';
const sub = ok ? esc(r.nombre) + (r.empresa ? ' · ' + esc(r.empresa) : '') + '. Ya no saltará el aviso de «sin respuesta».' : 'El enlace ha caducado o no existe.';
const html = '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + titulo + '</title><body style="font-family:Arial,sans-serif;background:#08070b;color:#f4f0f8;display:grid;place-items:center;min-height:100vh;margin:0"><div style="text-align:center;padding:24px"><h1 style="font-size:24px">' + titulo + '</h1><p style="color:#a9a1b4">' + sub + '</p></div></body>';
return [{ json: { html } }];
`), X(2, 5));
f.add('Mostrar estado', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'text', responseBody: '={{ $json.html }}', options: { responseHeaders: { entries: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }] } } }, X(3, 5));
f.chain('Enlace estado', 'Actualizar estado', 'Página estado', 'Mostrar estado');

f.add('Cada hora laborable', 'n8n-nodes-base.scheduleTrigger', 1.2, { rule: { interval: [{ field: 'cronExpression', expression: '0 8-21 * * 1-5' }] } }, X(0, 7));
f.add('Contactos sin estado', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `select c.id, c.nombre, c.empresa, c.email, c.mensaje, c.token, c.entrada, c.procedencia
from seo.contactos c
where c.tipo = 'contacto' and c.token is not null and c.estado = 'nuevo' and c.avisado_en is null and c.created_at > now() - interval '10 days'
  and (select count(*) from generate_series(date_trunc('hour', c.created_at), date_trunc('hour', now()), interval '1 hour') h
       where extract(isodow from h at time zone 'Europe/Madrid') < 6) >= 20
order by c.created_at limit 10`, options: {} }, X(1, 7), { credentials: CRED.pg });
f.add('Preparar recordatorio', 'n8n-nodes-base.code', 2, code(`
const c = $input.item.json;
const e2 = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');   // el aviso va en HTML: se escapa lo que escribe el usuario
const e = x => '${BASE}/web-contacto-estado?t=' + c.token + '&e=' + x;
const texto = '⏰ Llevan 20 horas laborables sin respuesta\\n\\n👤 ' + e2(c.nombre) + (c.empresa ? ' · ' + e2(c.empresa) : '') + '\\n✉️ ' + e2(c.email) + '\\n\\n' + e2(String(c.mensaje || '').slice(0, 600)) + '\\n\\nLa promesa era contestar en menos de 24 h. Cuando lo hagas, márcalo con los botones.';
return { json: { id: c.id, texto, url_ok: e('respondido'), url_diag: e('diagnostico'), url_no: e('no_encaja') } };
`, 'runOnceForEachItem'), X(2, 7));
f.add('Telegram recordatorio', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: '={{ $json.texto }}', additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true },
  ...BOTONES('$json.id') }, X(3, 7), { credentials: TG, onError: 'continueRegularOutput' });
f.add('Marcar avisado', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery', query: 'update seo.contactos set avisado_en = now() where id = $1',
  options: { queryReplacement: "={{ [ $('Preparar recordatorio').item.json.id ] }}" } }, X(4, 7), { credentials: CRED.pg });
f.chain('Cada hora laborable', 'Contactos sin estado', 'Preparar recordatorio', 'Telegram recordatorio', 'Marcar avisado');
f.chain('Guardar suscriptor', 'Preparar confirmación', '¿Enviar confirmación?');
f.link('¿Enviar confirmación?', 'Correo confirmación', 0);
f.link('¿Enviar confirmación?', 'OK boletín', 1);
f.link('Correo confirmación', 'OK boletín');
f.chain('Enlace boletín', 'Alta o baja', 'Destino', 'Redirigir', 'Telegram alta');

const wf = f.json({ saveDataSuccessExecution: 'all', timezone: 'Europe/Madrid' });
checkExpr(wf);
if (process.argv.includes('--probar')) { fs.writeFileSync(process.env.TEMP + '/web-contacto-wf.json', JSON.stringify(wf, null, 1)); console.log('probado en seco:', wf.nodes.length, 'nodos'); process.exit(0); }
// copia de seguridad del flujo actual antes de redesplegar
if (ids.contacto) { fs.mkdirSync('_backups', { recursive: true }); fs.writeFileSync('_backups/web-contacto-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(await n8n.get('/workflows/' + ids.contacto), null, 1)); }
const r = await n8n.upsert(wf, ids.contacto);
ids.contacto = r.id;
fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
await n8n.activate(r.id);
console.log('flujo', r.id, 'activo');
