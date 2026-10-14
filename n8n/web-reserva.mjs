// Flujo «WEB TRANSFORMACONIA → reserva del diagnóstico»: el cliente elige hueco de 30 min en el calendario.
//   GET  /webhook/web-reserva-huecos[?dias=3]  → próximos huecos libres (2 por día: primero de mañana y de tarde)
//   POST /webhook/web-reserva                  → valida, reserva en la BD, crea el evento (con videollamada si toca),
//                                                avisa por Telegram y manda confirmación al cliente.
// Horario: lunes a viernes 9:00-14:00 y 16:00-19:00 (Europe/Madrid), sin festivos. Antelación mínima 12 h.
// Calendario: el principal de la cuenta de la credencial de Google Calendar (freeBusy + events).
// Uso: node n8n/web-reserva.mjs   (crea o actualiza; el id queda en n8n/web-reserva-id.json)
import fs from 'node:fs';
import { Flow, code, CRED, checkExpr, n8n } from './lib.mjs';

const IDS = 'n8n/web-reserva-id.json';
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
const TG = { telegramApi: { id: 'Odcx9XT24MzT5aa0', name: 'Agente Juanky personal' } };
const GMAIL = { gmailOAuth2: { id: '0aSRqFmP9FX7rNEL', name: 'Gmail account' } };
// Credencial de Google Calendar de la cuenta principal (la que ya usa el asistente personal)
const GCAL = { googleCalendarOAuth2Api: { id: 'IKWyeEPlqQUr8xJc', name: 'marzo 2026 n8n' } };
const ORIGINS = 'https://transformaconia.com,https://www.transformaconia.com';
const X = (c, r) => [c * 240, r * 200];

// Utilidades de hora de Madrid, para pegar en los Code nodes (sin `${` ni comillas invertidas)
const TZ_JS = String.raw`
const TZ = 'Europe/Madrid', MIN_H = 12;
const DIAS_N = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_N = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function partes(d) {
  const o = {};
  for (const p of new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hourCycle: 'h23' }).formatToParts(d)) o[p.type] = p.value;
  return { y: +o.year, m: +o.month, d: +o.day, h: +o.hour, mi: +o.minute, wd: WD[o.weekday] };
}
function deMadrid(y, m, d, h, mi) {
  const t = Date.UTC(y, m - 1, d, h, mi);
  const p = partes(new Date(t));
  return new Date(t + (t - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi)));
}
function pascua(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, mes - 1, dia));
}
function festivo(y, m, d) {
  const fijos = ['01-01', '01-06', '05-01', '06-09', '08-15', '10-12', '11-01', '12-06', '12-08', '12-25'];
  const k = String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  if (fijos.includes(k)) return true;
  const p = pascua(y);
  for (const off of [-3, -2]) { const f = new Date(p.getTime() + off * 86400000); if (f.getUTCMonth() + 1 === m && f.getUTCDate() === d) return true; }
  return false;
}
function laborable(y, m, d) { const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); return wd >= 1 && wd <= 5 && !festivo(y, m, d); }
function horasDia() { const o = []; for (const h of [9, 10, 11, 12, 13, 16, 17, 18]) { o.push([h, 0]); o.push([h, 30]); } return o; }
function hueco_ok(iso) {
  const t = new Date(iso);
  if (isNaN(t) || t.getUTCSeconds() !== 0 || t.getUTCMilliseconds() !== 0) return false;
  const ahora = Date.now();
  if (t.getTime() < ahora + MIN_H * 3600000 || t.getTime() > ahora + 30 * 86400000) return false;
  const p = partes(t);
  return laborable(p.y, p.m, p.d) && horasDia().some(function (x) { return x[0] === p.h && x[1] === p.mi; });
}
function dosd(n) { return String(n).padStart(2, '0'); }
function etiqueta(iso) {
  const p = partes(new Date(iso));
  return { dia: DIAS_N[p.wd] + ' ' + p.d + ' de ' + MESES_N[p.m - 1], hora: dosd(p.h) + ':' + dosd(p.mi) };
}
`;

const f = new Flow('WEB TRANSFORMACONIA → reserva del diagnóstico');
const CORS = { allowedOrigins: ORIGINS };
const HDR = { responseHeaders: { entries: [{ name: 'Cache-Control', value: 'no-store' }] } };
const respond = (name, pos) => f.add(name, 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: '={{ JSON.stringify($json.cuerpo) }}', options: { responseCode: '={{ $json.codigo }}', ...HDR } }, pos);
const GOOGLE = (name, url, pos, bodyExpr) => f.add(name, 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url, authentication: 'predefinedCredentialType', nodeCredentialType: 'googleCalendarOAuth2Api',
  sendBody: true, specifyBody: 'json', jsonBody: bodyExpr, options: { timeout: 20000 },
}, pos, { credentials: GCAL, onError: 'continueRegularOutput' });

// ================= GET huecos =================
f.add('Pedir huecos', 'n8n-nodes-base.webhook', 2, { httpMethod: 'GET', path: 'web-reserva-huecos', responseMode: 'responseNode', options: CORS }, X(0, 0), { webhookId: 'web-reserva-huecos' });
f.add('Ventana', 'n8n-nodes-base.code', 2, code(TZ_JS + `
const q = $input.first().json.query || {};
const dias = Math.min(10, Math.max(1, parseInt(q.dias, 10) || 3));
const desde = new Date(Date.now() + MIN_H * 3600000), hasta = new Date(Date.now() + 22 * 86400000);
return [{ json: { dias, req: { timeMin: desde.toISOString(), timeMax: hasta.toISOString(), timeZone: TZ, items: [{ id: 'primary' }] } } }];
`), X(1, 0));
GOOGLE('Agenda ocupada', 'https://www.googleapis.com/calendar/v3/freeBusy', X(2, 0), '={{ JSON.stringify($json.req) }}');
f.add('Calcular huecos', 'n8n-nodes-base.code', 2, code(TZ_JS + `
const fb = $input.first().json;
const cal = (fb.calendars || {}).primary;
if (!cal || cal.errors) return [{ json: { codigo: 503, cuerpo: { ok: false, error: 'Ahora mismo no podemos consultar la agenda. Escríbenos a info@transformaconia.com y te damos hora.' } } }];
const busy = (cal.busy || []).map(function (b) { return [new Date(b.start).getTime(), new Date(b.end).getTime()]; });
const dias = $('Ventana').first().json.dias;
const minimo = Date.now() + MIN_H * 3600000;
const out = [];
let hoy = partes(new Date());
let cursor = Date.UTC(hoy.y, hoy.m - 1, hoy.d);
for (let i = 0; i < 22 && new Set(out.map(function (h) { return h.dia; })).size < dias; i++, cursor += 86400000) {
  const c = new Date(cursor), y = c.getUTCFullYear(), m = c.getUTCMonth() + 1, d = c.getUTCDate();
  if (!laborable(y, m, d)) continue;
  let manana = null, tarde = null;
  for (const hm of horasDia()) {
    const ini = deMadrid(y, m, d, hm[0], hm[1]).getTime(), fin = ini + 1800000;
    if (ini < minimo) continue;
    if (busy.some(function (b) { return ini < b[1] && fin > b[0]; })) continue;
    if (hm[0] < 14 && !manana) manana = ini;
    if (hm[0] >= 16 && !tarde) tarde = ini;
  }
  for (const t of [manana, tarde]) if (t) { const iso = new Date(t).toISOString(); out.push({ iso, dia: y + '-' + dosd(m) + '-' + dosd(d), hora: etiqueta(iso).hora, texto: etiqueta(iso).dia }); }
}
return [{ json: { codigo: 200, cuerpo: { ok: true, tz: TZ, huecos: out } } }];
`), X(3, 0));
respond('Responder huecos', X(4, 0));
f.chain('Pedir huecos', 'Ventana', 'Agenda ocupada', 'Calcular huecos', 'Responder huecos');

// ================= POST reservar =================
f.add('Reservar', 'n8n-nodes-base.webhook', 2, { httpMethod: 'POST', path: 'web-reserva', responseMode: 'responseNode', options: CORS }, X(0, 2), { webhookId: 'web-reserva' });
f.add('Validar', 'n8n-nodes-base.code', 2, code(TZ_JS + `
const j = $input.first().json;
const b = j.body || {};
const h = j.headers || {};
const t = (v, n) => String(v == null ? '' : v).trim().slice(0, n || 200);
const d = {
  nombre: t(b.nombre, 120), empresa: t(b.empresa, 160), email: t(b.email, 160).toLowerCase(), telefono: t(b.telefono, 30),
  modalidad: t(b.modalidad, 30), localidad: t(b.localidad, 120), hueco: t(b.hueco, 40), origen: t(b.origen, 300),
  entrada: t(b.entrada, 200), procedencia: t(b.procedencia, 120).toLowerCase(),
  ip: '',
};
// IP real: el ÚLTIMO valor de x-forwarded-for (lo añade el proxy; el primero lo controla el cliente) o x-real-ip
const xff = String(h['x-forwarded-for'] || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
d.ip = t(xff.length ? xff[xff.length - 1] : h['x-real-ip'], 64);
// solo desde nuestra propia web: sin Origin ni Referer válidos se rechaza (antes el Origin era opcional)
const propio = /^https:\\/\\/(www\\.)?transformaconia\\.com(\\/|$)/i;
const origenMal = !propio.test(String(h.origin || '')) && !propio.test(String(h.referer || ''));
const honeypot = !!t(b.web);
const spam = honeypot || origenMal;
const emailOk = /^[^\\s@,;<>"']+@[^\\s@,;<>"']+\\.[^\\s@,;<>"']{2,}$/.test(d.email);
// correo normalizado para los límites: sin +etiqueta en todos los dominios y sin puntos en gmail
const normEmail = e => { const p = e.split('@'); if (p.length !== 2) return e; let l = p[0].split('+')[0]; let dom = p[1]; if (dom === 'gmail.com' || dom === 'googlemail.com') { l = l.replace(/\\./g, ''); dom = 'gmail.com'; } return (l || p[0]) + '@' + dom; };
const email_norm = emailOk ? normEmail(d.email) : d.email;
const videollamada = d.modalidad === 'videollamada';
const presencial = d.modalidad === 'en tu empresa';
let error = '';
if (d.nombre.length < 2) error = 'Escribe tu nombre.';
else if (!emailOk) error = 'Revisa el correo: así no podemos escribirte la confirmación.';
else if (!videollamada && !presencial) error = 'Elige cómo prefieres el diagnóstico: videollamada o en tu empresa.';
else if (presencial && d.localidad.length < 2) error = 'Dinos en qué localidad de la Región de Murcia está tu empresa.';
else if (presencial && d.telefono.replace(/\\D/g, '').length < 9) error = 'Déjanos un teléfono para coordinar la visita.';
else if (d.telefono && !/^[0-9+()\\s.-]{6,30}$/.test(d.telefono)) error = 'Revisa el teléfono.';
else if (t(b.acepto, 5) !== 'si') error = 'Marca la casilla de la política de privacidad para poder reservar.';
else if (!hueco_ok(d.hueco)) error = 'Ese hueco ya no está disponible. Elige otro, por favor.';
const valido = !spam && !error;
// pruebas: correo de la propia empresa o nombre que empieza por PRUEBA (no cuentan en el embudo ni generan evento de conversión)
const es_prueba = d.email === 'info@transformaconia.com' || /^prueba/i.test(d.nombre);
d.hueco = valido ? new Date(d.hueco).toISOString() : d.hueco;
if (!presencial) d.localidad = '';
const codigo = honeypot ? 200 : origenMal ? 403 : 422;
return [{ json: { ...d, email_norm, es_prueba, valido, codigo, cuerpo: honeypot ? { ok: true } : { ok: false, error: origenMal ? 'Origen no permitido.' : error } } }];
`), X(1, 2));
f.add('¿Válida?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'v', leftValue: '={{ $json.valido }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(2, 2));
respond('Responder descartada', X(3, 3.4));
// máximo 2 reservas al día por correo normalizado o por IP, con contador atómico seo.limite() (la IP solo se guarda como HMAC con sal diaria, seo.huella(); se borra a las 48 h)
f.add('Límite', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with e as (select seo.limite('r:email:' || coalesce(seo.huella($1::text, 'email'), 'x'), 2) as ok),
i as (select case when $2::text = '' then true else seo.limite('r:ip:' || seo.huella($2::text, 'reserva'), 2) end as ok)
select (e.ok and i.ok) as ok from e, i`,
  options: { queryReplacement: "={{ [ $json.email_norm, $json.ip ] }}" } }, X(3, 2), { credentials: CRED.pg });
f.add('¿Cupo?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'c', leftValue: '={{ $json.ok }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(4, 2));
f.add('Mensaje cupo', 'n8n-nodes-base.code', 2, code(`return [{ json: { codigo: 429, cuerpo: { ok: false, error: 'Ya hay dos reservas hechas hoy desde este correo o conexión. Si necesitas cambiar algo, escríbenos a info@transformaconia.com.' } } }];`), X(5, 3.4));
f.add('Reservar fila', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `insert into seo.reservas (nombre, empresa, email, telefono, modalidad, localidad, hueco, ip_hash, origen, entrada, procedencia, es_prueba)
values ($1, $2, $3, $4, $5, $6, $7::timestamptz, seo.huella($8::text, 'reserva'), $9, $10, $11, $12::boolean)
on conflict (hueco) where estado = 'confirmada' do nothing
returning id`,
  options: { queryReplacement: "={{ [ $('Validar').first().json.nombre, $('Validar').first().json.empresa, $('Validar').first().json.email, $('Validar').first().json.telefono, $('Validar').first().json.modalidad, $('Validar').first().json.localidad, $('Validar').first().json.hueco, $('Validar').first().json.ip, $('Validar').first().json.origen, $('Validar').first().json.entrada, $('Validar').first().json.procedencia, $('Validar').first().json.es_prueba ] }}" } }, X(5, 2), { credentials: CRED.pg, alwaysOutputData: true });
f.add('¿Hueco libre en BD?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'i', leftValue: '={{ $json.id }}', rightValue: '', operator: { type: 'string', operation: 'exists', singleValue: true } }], combinator: 'and' }, options: {} }, X(6, 2));
f.add('Mensaje ocupado', 'n8n-nodes-base.code', 2, code(`return [{ json: { codigo: 409, cuerpo: { ok: false, error: 'Alguien acaba de coger ese hueco. Elige otro, por favor.', refrescar: true } } }];`), X(7, 3.4));
f.add('Prep. comprobación', 'n8n-nodes-base.code', 2, code(`
const v = $('Validar').first().json;
const ini = new Date(v.hueco), fin = new Date(ini.getTime() + 1800000);
return [{ json: { req: { timeMin: ini.toISOString(), timeMax: fin.toISOString(), timeZone: 'Europe/Madrid', items: [{ id: 'primary' }] } } }];
`), X(7, 2));
GOOGLE('Comprobar agenda', 'https://www.googleapis.com/calendar/v3/freeBusy', X(8, 2), '={{ JSON.stringify($json.req) }}');
f.add('Preparar evento', 'n8n-nodes-base.code', 2, code(TZ_JS + `
const v = $('Validar').first().json;
const id = $('Reservar fila').first().json.id;
const cal = ($input.first().json.calendars || {}).primary;
if (!cal || cal.errors) return [{ json: { libre: false, codigo: 503, error: 'Ahora mismo no podemos consultar la agenda. Escríbenos a info@transformaconia.com y te damos hora.' } }];
if ((cal.busy || []).length) return [{ json: { libre: false, codigo: 409, error: 'Ese hueco acaba de ocuparse. Elige otro, por favor.' } }];
const ini = new Date(v.hueco), fin = new Date(ini.getTime() + 1800000);
const video = v.modalidad === 'videollamada';
const lineas = ['Diagnóstico gratuito de 30 minutos (reserva desde la web)', '', 'Nombre: ' + v.nombre, 'Empresa: ' + (v.empresa || '-'), 'Correo: ' + v.email, 'Teléfono: ' + (v.telefono || '-'), 'Modalidad: ' + v.modalidad + (v.localidad ? ' (' + v.localidad + ')' : '')];
const req = {
  summary: 'Diagnóstico IA · ' + (v.empresa || v.nombre) + (video ? ' (videollamada)' : ' (en su empresa)'),
  description: lineas.join('\\n'),
  location: video ? 'Videollamada' : [v.empresa, v.localidad, 'Región de Murcia'].filter(Boolean).join(', '),
  start: { dateTime: ini.toISOString(), timeZone: TZ }, end: { dateTime: fin.toISOString(), timeZone: TZ },
  attendees: [{ email: v.email, displayName: v.nombre }],
  reminders: { useDefault: true },
};
if (video) req.conferenceData = { createRequest: { requestId: 'tcr-' + id + '-' + Date.now(), conferenceSolutionKey: { type: 'hangoutsMeet' } } };
return [{ json: { libre: true, req } }];
`), X(9, 2));
f.add('¿Agenda libre?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'l', leftValue: '={{ $json.libre }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(10, 2));
GOOGLE('Crear evento', 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1&sendUpdates=none', X(11, 2), '={{ JSON.stringify($json.req) }}');
f.add('Evento listo', 'n8n-nodes-base.code', 2, code(`
const e = $input.first().json;
if (!e || !e.id) return [{ json: { ok: false, codigo: 500, error: 'No hemos podido crear la cita. Escríbenos a info@transformaconia.com y te damos hora.' } }];
let meet = e.hangoutLink || '';
if (!meet && e.conferenceData && Array.isArray(e.conferenceData.entryPoints)) { const v = e.conferenceData.entryPoints.find(function (x) { return x.entryPointType === 'video'; }); if (v) meet = v.uri; }
return [{ json: { ok: true, eventoId: e.id, meet, enlaceEvento: e.htmlLink || '' } }];
`), X(12, 2));
f.add('¿Evento creado?', 'n8n-nodes-base.if', 2, { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose' }, conditions: [{ id: 'o', leftValue: '={{ $json.ok }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }], combinator: 'and' }, options: {} }, X(13, 2));
// si algo falla después de apartar la fila, se anula para que el hueco no quede bloqueado
f.add('Anular fila', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `update seo.reservas set estado = 'anulada' where id = $1 returning $2::int as codigo, $3::text as error`,
  options: { queryReplacement: "={{ [ $('Reservar fila').first().json.id, $json.codigo, $json.error ] }}" } }, X(14, 3.4), { credentials: CRED.pg });
f.add('Mensaje error', 'n8n-nodes-base.code', 2, code(`const r = $input.first().json; return [{ json: { codigo: r.codigo, cuerpo: { ok: false, error: r.error, refrescar: r.codigo === 409 } } }];`), X(15, 3.4));
f.add('Guardar evento', 'n8n-nodes-base.postgres', 2.5, { operation: 'executeQuery',
  query: `with ev as (insert into seo.visitas (evento, ruta, etiqueta, ref, disp) select 'conversion', '/evento/reserva-hecha', left(coalesce(r.entrada, ''), 120), left(coalesce(r.procedencia, ''), 100), null from seo.reservas r where r.id = $1 and not r.es_prueba returning 1)
update seo.reservas set evento_id = $2, meet = $3 where id = $1 returning id`,
  options: { queryReplacement: "={{ [ $('Reservar fila').first().json.id, $json.eventoId, $json.meet ] }}" } }, X(14, 2), { credentials: CRED.pg, onError: 'continueRegularOutput' });
f.add('Preparar avisos', 'n8n-nodes-base.code', 2, code(TZ_JS + `
const v = $('Validar').first().json;
const ev = $('Evento listo').first().json;
const e = etiqueta(v.hueco);
const fecha = e.dia + ', a las ' + e.hora + ' (hora de Madrid)';
const video = v.modalidad === 'videollamada';
const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const z = new Date(v.hueco), fin = new Date(z.getTime() + 1800000);
const ics = d => d.toISOString().replace(/[-:]/g, '').replace(/\\.\\d+/, '');
const donde = video ? 'Videollamada' : [v.empresa, v.localidad].filter(Boolean).join(', ');
const cal = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent('Diagnóstico gratuito · Transforma con IA') + '&dates=' + ics(z) + '/' + ics(fin) + '&details=' + encodeURIComponent(video && ev.meet ? 'Videollamada: ' + ev.meet : 'Diagnóstico gratuito de 30 minutos') + '&location=' + encodeURIComponent(video ? (ev.meet || 'Videollamada') : donde);
const boton = (url, txt) => '<p style="margin:24px 0"><a href="' + url + '" style="background:#8a14d0;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">' + txt + '</a></p>';
const donde_html = video
  ? (ev.meet ? '<p><b>Cómo:</b> videollamada. Entra con este enlace a la hora indicada:</p>' + boton(ev.meet, 'Entrar a la videollamada') : '<p><b>Cómo:</b> videollamada. Te enviaremos el enlace antes de la cita.</p>')
  : '<p><b>Cómo:</b> iremos a tu empresa (' + esc(v.localidad) + '). Te llamaremos antes para confirmar la dirección y la hora exacta.</p>';
const html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1b1520;line-height:1.55"><img src="https://transformaconia.com/wp-content/uploads/2026/10/transforma-con-ia-logo-fondo-claro.png" alt="Transforma con IA" width="190" height="30" style="display:block;margin:0 0 18px;border:0"><h2 style="color:#8a14d0;margin-bottom:6px">Tu diagnóstico gratuito está reservado</h2><p>Hola ' + esc(v.nombre) + ', gracias por reservar. Estos son los datos:</p><table style="border-collapse:collapse;font-size:15px"><tr><td style="padding:6px 14px 6px 0;color:#666">Cuándo</td><td><b>' + esc(fecha) + '</b></td></tr><tr><td style="padding:6px 14px 6px 0;color:#666">Duración</td><td>30 minutos</td></tr><tr><td style="padding:6px 14px 6px 0;color:#666">Modalidad</td><td>' + (video ? 'Videollamada' : 'En tu empresa (' + esc(v.localidad) + ')') + '</td></tr></table>' + donde_html + '<p>Para sacarle el máximo partido, piensa en la tarea que más horas le quita a tu equipo: es de lo que hablaremos. No hace falta que prepares nada más.</p><p><a href="' + cal + '" style="color:#8a14d0">Añadir a mi calendario</a></p><p style="font-size:13px;color:#666">Si no puedes en ese horario, responde a este correo y lo cambiamos sin problema.</p><p>Un saludo,<br>El equipo de Transforma con IA<br><a href="https://transformaconia.com" style="color:#8a14d0">transformaconia.com</a></p></div>';
const e2 = v => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');   // el aviso va en HTML: se escapa lo que escribe el usuario
const telegram = '📅 Nueva reserva de diagnóstico\\n\\n👤 ' + e2(v.nombre) + (e2(v.empresa) ? ' · ' + e2(v.empresa) : '') + '\\n✉️ ' + e2(v.email) + (e2(v.telefono) ? '\\n📞 ' + e2(v.telefono) : '') + '\\n🗓 ' + fecha + '\\n' + (video ? '🎥 Videollamada' + (e2(ev.meet) ? ': ' + e2(ev.meet) : '') : '📍 En su empresa: ' + e2(v.localidad)) + '\\n\\nYa está en tu calendario.';
return [{ json: { html, telegram, asunto: 'Reservado: tu diagnóstico gratuito, ' + e.dia + ' a las ' + e.hora, email: v.email, cuerpo: { ok: true, fecha, modalidad: v.modalidad, meet: video ? ev.meet : '' }, codigo: 200 } }];
`), X(15, 2));
f.add('Correo al cliente', 'n8n-nodes-base.gmail', 2.1, { sendTo: "={{ $('Preparar avisos').first().json.email }}", subject: "={{ $('Preparar avisos').first().json.asunto }}", message: "={{ $('Preparar avisos').first().json.html }}", options: { appendAttribution: false, senderName: 'Transforma con IA', replyTo: 'info@transformaconia.com' } }, X(16, 2), { credentials: GMAIL, onError: 'continueRegularOutput' });
f.add('Telegram reserva', 'n8n-nodes-base.telegram', 1.2, { chatId: '8765904', text: "={{ $('Preparar avisos').first().json.telegram }}", additionalFields: { appendAttribution: false, parse_mode: 'HTML' } }, X(17, 2), { credentials: TG, onError: 'continueRegularOutput' });
f.add('Confirmar reserva', 'n8n-nodes-base.respondToWebhook', 1.1, { respondWith: 'json', responseBody: "={{ JSON.stringify($('Preparar avisos').first().json.cuerpo) }}", options: { responseCode: 200, ...HDR } }, X(18, 2));

f.chain('Reservar', 'Validar', '¿Válida?');
f.link('¿Válida?', 'Límite', 0);
f.link('¿Válida?', 'Responder descartada', 1);
f.chain('Límite', '¿Cupo?');
f.link('¿Cupo?', 'Reservar fila', 0);
f.link('¿Cupo?', 'Mensaje cupo', 1);
f.chain('Mensaje cupo', 'Responder descartada');
f.chain('Reservar fila', '¿Hueco libre en BD?');
f.link('¿Hueco libre en BD?', 'Prep. comprobación', 0);
f.link('¿Hueco libre en BD?', 'Mensaje ocupado', 1);
f.chain('Mensaje ocupado', 'Responder descartada');
f.chain('Prep. comprobación', 'Comprobar agenda', 'Preparar evento', '¿Agenda libre?');
f.link('¿Agenda libre?', 'Crear evento', 0);
f.link('¿Agenda libre?', 'Anular fila', 1);
f.chain('Crear evento', 'Evento listo', '¿Evento creado?');
f.link('¿Evento creado?', 'Guardar evento', 0);
f.link('¿Evento creado?', 'Anular fila', 1);
f.chain('Anular fila', 'Mensaje error', 'Responder descartada');
f.chain('Guardar evento', 'Preparar avisos', 'Correo al cliente', 'Telegram reserva', 'Confirmar reserva');

const wf = f.json({ saveDataSuccessExecution: 'none', saveDataErrorExecution: 'all' });
checkExpr(wf);
if (process.argv.includes('--solo-json')) { fs.writeFileSync('n8n/web-reserva.build.json', JSON.stringify(wf, null, 1)); console.log('json escrito'); process.exit(0); }
const r = await n8n.upsert(wf, ids.reserva);
ids.reserva = r.id;
fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
await n8n.activate(r.id);
console.log('flujo', r.id, 'activo');
