// Plan diario de Instagram (seo.ig_plan). Lo usan el panel (propuesta por Telegram) y el agente local (Claude + Chrome).
//
//   node n8n/ig-plan.mjs cargar                      → OBSOLETO (27-10-2026): el plan se recoloca con /ritmo replanificar
//   node n8n/ig-plan.mjs hoy                         → JSON del plan de hoy si está APROBADO (lo lee el agente local)
//   node n8n/ig-plan.mjs hecho "<informe>"           → marca hoy como hecho y manda a Telegram el informe (o por stdin)
//   node n8n/ig-plan.mjs accion <tipo> <cuenta> [url] [texto]   → apunta lo hecho (seguir|dejar|comentar|responder)
//   node n8n/ig-plan.mjs recientes [días]            → cuentas ya comentadas en esos días (para no repetir)
//   node n8n/ig-plan.mjs comentarios                 → comentarios de otros en nuestras publicaciones sin responder (API)
//   node n8n/ig-plan.mjs responder <comment_id> <texto>        → responde por la API
//   node n8n/ig-plan.mjs informe                     → datos de la semana (seguidores, alcance, acciones)
import fs from 'node:fs';
import postgres from 'postgres';
import './lib.mjs'; // carga .env.local
import { gw } from './gw.mjs';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
const IG = 'https://graph.instagram.com/v21.0';
const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
// Radar de Tiendas (16-11-2026): de ahí salen las tiendas online objetivo y ahí se apunta lo que hacemos con cada una
const radar = async (path, body) => {
  if (!process.env.RADAR_URL || !process.env.RADAR_IG_KEY) return null;
  try {
    const r = await fetch(process.env.RADAR_URL + '/api/instagram/sync' + path, { method: body ? 'POST' : 'GET', headers: { 'x-ig-key': process.env.RADAR_IG_KEY, 'content-type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return r.ok ? await r.json() : null;
  } catch { return null; }
};
// 17-11-2026: si el Radar no contesta, se avisa (antes fallaba en silencio y se perdía el rastro)
// lo que RECIBIMOS en Instagram (17-11-2026): nos siguen, dejan de seguir, nos dan me gusta, nos comentan
const tablaRecibidos = () => sql`create table if not exists seo.ig_recibidos (id serial primary key, tipo text not null, cuenta text not null, url text, texto text, fecha date not null default current_date, unique (tipo, cuenta, url, fecha))`;
const aRadar = async (tipo, cuenta, url, texto) => { const r = await radar('', { handle: String(cuenta).replace(/^@/, ''), tipo, url, texto }); if (!r?.ok) console.error('⚠ No se ha podido apuntar en el Radar:', tipo, cuenta); return r; };
const [cmd, ...args] = process.argv.slice(2);

async function cred() {
  const [r] = await sql`select value from seo.settings where key = 'ig_token'`;
  if (!r) throw new Error('Instagram no está conectado');
  return r.value;
}
const ig = async (path, c) => (await fetch(`${IG}/${path}${path.includes('?') ? '&' : '?'}access_token=${c.token}`)).json();

// ------------------------------------------------------------------ el plan del mes
// Listas de los días 2-5 (datos/instagram-a-seguir.md, comprobadas el 25-10-2026)
const LISTAS = {
  '2026-10-27': ['amusalmurcia', 'ucomur_cooperativas', 'fecoam_', 'icamur_oficial', 'upctoficial', 'ucam_universidad', 'grupo_cajamar', 'murciaplaza_com', 'regmurcia', 'elnuevodigitalmurcia'],
  '2026-10-28': ['laopiniondemurcia', 'diario.laverdad', 'ayuntamientodemurcia', 'aytocartagenaes', 'aytomolina', 'elpozoalimentacion', 'hefame_es', 'saxun_solar', 'arq.mod.internacional', 'n7netcom'],
  '2026-10-29': ['mecanizadosjjceldran', 'inoxpaser', 'metalcon.ind', 'franlopezalcaraz', 'pritecgrupo', 'cercadosonline', 'aluminiosros', 'glass__stock', 'siasuministros', 'comercial.pimesa'],
  '2026-10-30': ['sermomur', 'gruporenauto', 'ferreteriafercasasl', 'tapiceriasnavarro', 'carpell_hnos_cb', 'salazonesgarre', 'scentiumflavours', 'laboratorios_prady', 'crcampocartagena', 'gestoriacarvajal'],
};
const TITULOS_LISTA = {
  '2026-10-27': 'asociaciones, universidades y prensa económica',
  '2026-10-28': 'medios, ayuntamientos y grandes empresas',
  '2026-10-29': 'metal y talleres (tu cliente ideal)',
  '2026-10-30': 'otras industrias y servicios de la Región',
};
// Reels: 2 por semana, martes y jueves (los 8 de noviembre se adelantan para no dejar la cuenta parada)
const REELS = {
  '2026-10-27': 'n1-tareas-taller', '2026-10-29': 'n2-senales', '2026-11-03': 'n3-precio-pieza', '2026-11-05': 'n4-web-24h',
  '2026-11-10': 'n5-cobros', '2026-11-12': 'n6-tickets', '2026-11-17': 'n7-trimestre', '2026-11-19': 'n8-diagnostico',
};

function planDelDia(f) {
  const d = new Date(f + 'T12:00:00Z');
  const dia = d.getUTCDay(); // 0 domingo
  if (dia === 0 || dia === 6) return null;
  const t = [];
  if (REELS[f]) t.push({ tipo: 'reel', ref: REELS[f], detalle: 'Publicar el reel del día (sale en cuanto apruebas)' });
  if (f === '2026-11-24' || f === '2026-11-26') t.push({ tipo: 'reel', ref: null, detalle: 'Publicar uno de los 2 reels nuevos de finales de noviembre (te los enseño antes)' });
  if (LISTAS[f]) {
    t.push({ tipo: 'seguir', cuentas: LISTAS[f], detalle: `Seguir 10 cuentas: ${TITULOS_LISTA[f]}` });
    t.push({ tipo: 'comentar', cuentas: LISTAS[f], detalle: 'Un comentario útil en una publicación reciente de cada una (sin vender, sin enlaces)' });
  } else {
    t.push({ tipo: 'seguir', detalle: 'Seguir 5 empresas nuevas de Murcia (talleres, metal, industria y servicios a empresas), comprobando su web y su perfil' });
    t.push({ tipo: 'comentar', detalle: 'Comentar en 5 publicaciones recientes de cuentas que seguimos (sin repetir cuenta en la semana)' });
  }
  t.push({ tipo: 'responder', detalle: 'Responder a los comentarios en nuestras publicaciones' });
  if (dia === 1) t.push({ tipo: 'informe', detalle: 'Informe de la semana: seguidores, alcance, visitas a la web desde Instagram y contactos' });
  if (dia === 5) t.push({ tipo: 'captacion', detalle: 'Ver qué empresas nos han seguido o comentado esta semana y prepararte un mensaje para las que encajen (no se envía nada sin ti)' });
  if (f === '2026-11-16') t.push({ tipo: 'preparar', detalle: 'Preparar 2 reels nuevos para el 24 y el 26 (te los mando a Telegram para que los veas)' });
  const tit = REELS[f] ? 'Reel + visibilidad' : LISTAS[f] ? 'Seguir y comentar' : dia === 1 ? 'Informe y visibilidad' : dia === 5 ? 'Visibilidad y posibles clientes' : 'Visibilidad';
  return { titulo: tit, tareas: t };
}

if (cmd === 'cargar') {
  // OBSOLETO desde el 27-10-2026: el plan va al ritmo de las rutinas (cada 3 días). Se recoloca con «/ritmo replanificar» en Telegram.
  console.log('Obsoleto: usa /ritmo replanificar en el bot del SEO.');
  process.exit(0);
  for (let d = new Date('2026-10-27T12:00:00Z'); d <= new Date('2026-11-26T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) {
    const f = d.toISOString().slice(0, 10);
    const p = planDelDia(f);
    if (!p) continue;
    await sql`insert into seo.ig_plan (fecha, titulo, tareas) values (${f}, ${p.titulo}, ${sql.json(p.tareas)})
      on conflict (fecha) do update set titulo = excluded.titulo, tareas = excluded.tareas where seo.ig_plan.estado = 'pendiente'`;
  }
  // las fechas de los reels pasan a las del plan
  for (const [f, id] of Object.entries(REELS)) await sql`update seo.ig_cola set fecha = ${f} where id = ${id} and estado in ('pendiente', 'propuesto')`;
  const [n] = await sql`select count(*)::int n from seo.ig_plan`;
  console.log('días en el plan:', n.n);
} else if (cmd === 'hoy') {
  // lo que el agente local tiene que hacer hoy: seguir y comentar pendientes de la lista (seo.ig_movil)
  const l = await sql`select id, tipo, cuenta, url, texto from seo.ig_movil where fecha = ${hoy()} and not hecho order by orden`;
  // día del plan sin lista preparada (desde el 2-11-2026): el agente la busca él mismo (INSTRUCCIONES.md → «Buscar la lista»)
  // (también si quedó a medias: pide solo lo que falta hasta el volumen del día (VOL))
  const [n] = await sql`select count(*) filter (where tipo = 'seguir')::int s, count(*) filter (where tipo = 'comentar')::int c from seo.ig_movil where fecha = ${hoy()}`;
  const [plan] = await sql`select 1 from seo.ig_plan where fecha = ${hoy()} and estado <> 'rechazado'`;
  const hora = Number(new Date().toLocaleString('en-GB', { hour: '2-digit', hour12: false, timeZone: 'Europe/Madrid' }));
  // Subida escalonada (16-11-2026, el dueño quiere crecer más rápido sin que Instagram nos frene): semana del 16-11 12/6,
  // semana del 23-11 18/8 y desde el 30-11 25/10. «me gusta»: el rango de VOL.megusta. Siempre despacio y en dos tandas (13:00 y 17:00).
  // 19-11-2026: hubo un 429 (por pruebas en la API, no por el volumen) → la subida se retrasa una semana, poco a poco
  // 24-11-2026 (estudio): seguimos a 135 y nos siguen 14. Seguir a más con tan poca vuelta huele a bot → la subida se congela
  // en 12/6 hasta que nos devuelvan el follow al menos 1 de cada 5 (se revisa en el resumen del domingo; GUIA-CONTENIDO.md §7).
  const VOL = { seguir: 12, comentar: 6, megusta: '10 y 20' };
  const faltan = { seguir: Math.max(0, VOL.seguir - n.s), comentar: Math.max(0, VOL.comentar - n.c) };
  // 19-11-2026: con --tarde (el PC se encendió después de las 18:45 y hoy no se ha hecho NADA) se busca igual hasta las 22:00,
  // para que un día con el ordenador apagado no se quede sin hacer
  const tardeSinNada = args.includes('--tarde') && n.s + n.c === 0 && hora < 22;
  // 20-11-2026: GRUPO DEL DÍA (n8n/ig-grupos.mjs): empresas del Radar ya estudiadas y puntuadas para hoy (y las pendientes
  // de días anteriores). Si hay grupo, NO se busca en Instagram para seguir (menos búsquedas = menos riesgo de bot):
  // solo se buscan publicaciones de esas mismas cuentas para preparar los comentarios.
  let grupo = [];
  try {
    grupo = await sql`select id, cuenta, nombre, provincia, sector, puntos, motivo, grupo, fecha::text from seo.ig_objetivos
      where estado = 'pendiente' and fecha <= ${hoy()}::date order by fecha, orden limit ${faltan.seguir}`;
  } catch { /* sin tabla todavía */ }
  const enHora = plan && (hora < 17 || tardeSinNada);
  const buscar = enHora && (faltan.seguir || faltan.comentar);
  const r = {
    fecha: hoy(), megusta: VOL.megusta, ...(l.length ? { tareas: l } : {}),
    ...(enHora && grupo.length ? { grupo, comentarios_a_preparar: faltan.comentar } : buscar ? { buscar_lista: faltan } : {}),
  };
  console.log(JSON.stringify(l.length || (enHora && grupo.length) || buscar ? r : { nada_que_hacer: true }, null, 1));
} else if (cmd === 'grupo-hecho') {
  // node n8n/ig-plan.mjs grupo-hecho <id> seguida
  // node n8n/ig-plan.mjs grupo-hecho <id> saltada "<motivo>"   → queda TACHADA en el Radar («No seguir») con el motivo
  const [id, estado, motivo = ''] = args;
  if (!['seguida', 'saltada'].includes(estado) || (estado === 'saltada' && !motivo)) throw new Error('Uso: grupo-hecho <id> seguida | grupo-hecho <id> saltada "<motivo>"');
  const [o] = await sql`update seo.ig_objetivos set estado = ${estado}, nota = ${motivo || null}, hecho_at = now() where id = ${Number(id)} and estado = 'pendiente'
    returning cuenta, dominio, puntos`;
  if (!o) { console.log('no'); process.exit(0); }
  if (estado === 'seguida') {
    // cuenta en el volumen del día (como la lista de siempre) y queda apuntada aquí y en el Radar
    const [{ m }] = await sql`select coalesce(max(orden), -1) + 1 m from seo.ig_movil where fecha = ${hoy()}`;
    await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url, hecho) values (${hoy()}, ${m}, 'seguir', ${o.cuenta}, ${`https://www.instagram.com/${o.cuenta}/`}, true)`;
    await sql`insert into seo.ig_acciones (tipo, cuenta, url, fecha) values ('seguir', ${o.cuenta}, ${`https://www.instagram.com/${o.cuenta}/`}, ${hoy()})`;
    await radar('', { domain: o.dominio, handle: o.cuenta, tipo: 'seguir', texto: `Seguida desde el grupo del día (puntuación ${o.puntos}/100)` });
  } else {
    await radar('', { domain: o.dominio, handle: o.cuenta, tipo: 'descartada', texto: `Saltada al revisar su perfil: ${motivo}` });
  }
  console.log('ok');
} else if (cmd === 'anadir') {
  // node n8n/ig-plan.mjs anadir seguir <cuenta>   ·   node n8n/ig-plan.mjs anadir comentar <cuenta> <url> "<texto>"
  // mete una tarea en la lista de hoy (la usa el agente en «Buscar la lista»); no repite cuentas ya seguidas ni publicaciones ya comentadas
  const [tipo, cuenta0, url = null, texto = null] = args;
  const cuenta = (cuenta0 || '').replace(/^@/, '').toLowerCase();
  if (!['seguir', 'comentar'].includes(tipo) || !cuenta || (tipo === 'comentar' && (!url || !texto))) throw new Error('Uso: anadir seguir <cuenta> | anadir comentar <cuenta> <url> "<texto>"');
  const repetida = tipo === 'seguir'
    ? await sql`select 1 from seo.ig_acciones where tipo = 'seguir' and lower(cuenta) = ${cuenta} union select 1 from seo.ig_movil where tipo = 'seguir' and lower(cuenta) = ${cuenta}`
    : await sql`select 1 from seo.ig_acciones where tipo = 'comentar' and (url = ${url} or (lower(cuenta) = ${cuenta} and fecha > current_date - 14)) union select 1 from seo.ig_movil where tipo = 'comentar' and (url = ${url} or (lower(cuenta) = ${cuenta} and fecha > current_date - 14))`;
  if (repetida.length) { console.log('repetida'); } else {
    const [{ o }] = await sql`select coalesce(max(orden), -1) + 1 o from seo.ig_movil where fecha = ${hoy()}`;
    const [x] = await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url, texto) values (${hoy()}, ${o}, ${tipo}, ${cuenta}, ${url ?? `https://www.instagram.com/${cuenta}/`}, ${texto}) returning id`;
    // si es una empresa del Radar, allí se ve que está en la lista de hoy (trazabilidad)
    if (tipo === 'seguir') await aRadar('lista', cuenta, null, `Lista del ${hoy()}`);
    console.log(JSON.stringify({ id: x.id }));
  }
} else if (cmd === 'descartar') {
  // node n8n/ig-plan.mjs descartar <dominio> "<motivo>" → empresa del Radar que no encaja (cuenta personal, otro país, no es tienda…): «No seguir» con el motivo
  const [dominio, motivo = 'No encaja'] = args;
  const r = await radar('', { domain: dominio, tipo: 'descartada', texto: motivo });
  console.log(r?.enRadar ? 'ok' : 'no está en el Radar');
} else if (cmd === 'al-radar') {
  // node n8n/ig-plan.mjs al-radar <dominio> <cuenta> → una tienda online encontrada en Instagram que no está en el Radar:
  // se analiza allí (tipo de tienda y plataforma), se le busca el Instagram y queda apuntado que la trajo el agente
  const [dominio, cuenta = ''] = args;
  if (!dominio) throw new Error('Uso: al-radar <dominio> <cuenta>');
  const H = { 'x-ig-key': process.env.RADAR_IG_KEY, 'content-type': 'application/json' };
  const post = async (p, b) => { try { const r = await fetch(process.env.RADAR_URL + p, { method: 'POST', headers: H, body: JSON.stringify(b) }); return r.ok ? r.json() : { error: r.status }; } catch (e) { return { error: e.message }; } };
  const a = await post('/api/analyze', { domain: dominio });
  if (a.error || !a.record) { console.log(JSON.stringify({ error: 'no se pudo analizar', detalle: a.error ?? null })); process.exit(0); }
  const d = a.record.domain;
  const ig = a.record.instagram?.handle ? { instagram: a.record.instagram } : await post('/api/instagram', { domain: d });
  await post('/api/instagram/sync', { domain: d, tipo: 'recomendada', texto: `La trajo el agente de Instagram${cuenta ? ` desde @${cuenta.replace(/^@/, '')}` : ''} el ${hoy()}` });
  const an = a.record.analysis ?? {};
  console.log(JSON.stringify({ dominio: d, duplicada: Boolean(a.duplicate), categoria: an.category ?? null, plataforma: an.platform ?? null, instagram: ig.instagram?.handle ?? null, instagram_estado: ig.instagram?.status ?? null }, null, 1));
} else if (cmd === 'reclamar') {
  // node n8n/ig-plan.mjs reclamar <id>  → ANTES de hacer la tarea; si dice «no», otro (el móvil u otra ejecución) la tiene: sáltala
  const [x] = await sql`update seo.ig_movil set reclamada_at = now() where id = ${Number(args[0])} and not hecho
    and (reclamada_at is null or reclamada_at < now() - interval '60 minutes') returning id`;
  console.log(x ? 'ok' : 'no');
} else if (cmd === 'hecho-item') {
  // node n8n/ig-plan.mjs hecho-item <id>  → la tarea de la lista ya está hecha (y queda apuntada)
  const [x] = await sql`update seo.ig_movil set hecho = true where id = ${Number(args[0])} and not hecho returning tipo, cuenta, url, texto, fecha`;
  if (x) await sql`insert into seo.ig_acciones (tipo, cuenta, url, texto, fecha) values (${x.tipo}, ${x.cuenta}, ${x.url}, ${x.texto}, ${x.fecha})`;
  if (x && ['seguir', 'comentar'].includes(x.tipo)) await aRadar(x.tipo, x.cuenta, x.url, x.texto);
  console.log(x ? 'ok' : 'ya estaba hecha');
} else if (cmd === 'hecho') {
  // informe del agente local a Telegram
  const informe = (args.join(' ') || fs.readFileSync(0, 'utf8')).trim();
  await gw({ action: 'tg', text: `✅ <b>Instagram: lo que he hecho desde el ordenador</b>\n\n${informe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`.slice(0, 4000) });
  console.log('ok');
} else if (cmd === 'accion') {
  const [tipo, cuenta, url = null, texto = null] = args;
  await sql`insert into seo.ig_acciones (tipo, cuenta, url, texto, fecha) values (${tipo}, ${cuenta.replace(/^@/, '')}, ${url}, ${texto}, ${hoy()})`;
  // «me gusta» y demás acciones sueltas también quedan apuntadas en el Radar si la empresa está allí
  if (['seguir', 'comentar', 'megusta'].includes(tipo)) await aRadar(tipo, cuenta, url, texto);
  console.log('ok');
} else if (cmd === 'radar') {
  // node n8n/ig-plan.mjs radar [n] → tiendas online del Radar con Instagram seguro y sin seguir (PrestaShop primero), sin las ya seguidas
  const n = Number(args[0] || 10);
  const r = await radar('?n=' + n * 2);
  const ya = new Set((await sql`select distinct cuenta from seo.ig_acciones where tipo = 'seguir'`).map((x) => x.cuenta.toLowerCase()));
  const objetivos = (r?.objetivos ?? []).filter((x) => !ya.has(String(x.handle).toLowerCase())).slice(0, n);
  console.log(JSON.stringify(r ? { objetivos } : { error: 'sin conexión con el Radar' }, null, 1));
} else if (cmd === 'relaciones') {
  // node n8n/ig-plan.mjs relaciones <fichero.json>  → { seguidores: [...], seguidos: [...] } leídos de Instagram (17-11-2026):
  // el Radar marca en cada empresa si la seguimos y si nos sigue (y desde cuándo)
  const j = JSON.parse(fs.readFileSync(args[0] || 0, 'utf8'));
  // 17-11-2026: también aquí queda el histórico (seo.ig_recibidos «nos_sigue» / «deja_de_seguir») para el resumen del domingo
  await tablaRecibidos();
  const [prev] = await sql`select value from seo.settings where key = 'ig_seguidores_lista'`;
  const antes = new Set(prev?.value?.lista ?? []);
  const ahora = (j.seguidores ?? []).map((x) => String(x).toLowerCase());
  if (prev) {
    for (const c of ahora.filter((x) => !antes.has(x))) await sql`insert into seo.ig_recibidos (tipo, cuenta, fecha) values ('nos_sigue', ${c}, ${hoy()}) on conflict do nothing`;
    for (const c of [...antes].filter((x) => !ahora.includes(x))) await sql`insert into seo.ig_recibidos (tipo, cuenta, fecha) values ('deja_de_seguir', ${c}, ${hoy()}) on conflict do nothing`;
  } // la primera vez solo se guarda la foto de partida (no son seguidores «nuevos» de hoy)
  await sql`insert into seo.settings (key, value) values ('ig_seguidores_lista', ${sql.json({ lista: ahora, seguidos: (j.seguidos ?? []).map((x) => String(x).toLowerCase()), fecha: hoy() })})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const r = await fetch(process.env.RADAR_URL + '/api/instagram/relaciones', { method: 'POST', headers: { 'x-ig-key': process.env.RADAR_IG_KEY, 'content-type': 'application/json' }, body: JSON.stringify(j) });
  const out = await r.json().catch(() => ({ error: r.status }));
  console.log(JSON.stringify(out));
  if (!out.ok) console.error('⚠ No se ha podido actualizar en el Radar quién nos sigue');
} else if (cmd === 'decisiones') {
  // node n8n/ig-plan.mjs decisiones → lo que se decidió en el resumen del domingo (el agente lo aplica esta semana)
  const [d] = await sql`select value from seo.settings where key = 'ig_decisiones'`;
  console.log(JSON.stringify(d?.value ?? { decisiones: [] }, null, 1));
} else if (cmd === 'recibidos') {
  // node n8n/ig-plan.mjs recibidos <fichero.json>  → [{ cuenta, url }] = quién ha dado «me gusta» a nuestras publicaciones
  // (lo lee el agente en Instagram: la API oficial no da la lista). Queda en seo.ig_recibidos y en el Radar («❤️ Nos da me gusta»).
  await tablaRecibidos();
  const lista = JSON.parse(fs.readFileSync(args[0] || 0, 'utf8'));
  let nuevos = 0;
  for (const x of lista) {
    const c = String(x.cuenta).replace(/^@/, '').toLowerCase();
    if (c === 'transformaconia.oficial') continue;
    const [n] = await sql`insert into seo.ig_recibidos (tipo, cuenta, url, fecha) values ('le_gusta', ${c}, ${x.url ?? null}, ${hoy()}) on conflict do nothing returning id`;
    if (n) { nuevos++; await radar('', { handle: c, tipo: 'le_gusta', url: x.url ?? null }); }
  }
  console.log(JSON.stringify({ ok: true, leidos: lista.length, nuevos }));
} else if (cmd === 'recientes') {
  const dias = Number(args[0] || 7);
  const r = await sql`select tipo, cuenta, max(fecha)::text fecha from seo.ig_acciones where fecha > current_date - ${dias}::int group by tipo, cuenta order by 3 desc`;
  const seguidas = await sql`select distinct cuenta from seo.ig_acciones a where tipo = 'seguir' and not exists (select 1 from seo.ig_acciones b where b.tipo = 'dejar' and b.cuenta = a.cuenta)`;
  console.log(JSON.stringify({ ultimos_dias: r, seguimos: seguidas.map((x) => x.cuenta) }, null, 1));
} else if (cmd === 'comentarios') {
  const c = await cred();
  const media = await ig(`${c.user_id}/media?fields=id,caption,permalink,timestamp&limit=20`, c);
  const sin = [];
  for (const m of media.data ?? []) {
    const cs = await ig(`${m.id}/comments?fields=id,text,username,timestamp,replies{username}&limit=50`, c);
    for (const x of cs.data ?? []) {
      if (x.username === 'transformaconia.oficial') continue;
      if ((x.replies?.data ?? []).some((r) => r.username === 'transformaconia.oficial')) continue;
      sin.push({ comment_id: x.id, de: x.username, texto: x.text, publicacion: m.permalink, tema: (m.caption ?? '').slice(0, 80) });
    }
  }
  console.log(JSON.stringify(sin, null, 1));
} else if (cmd === 'responder') {
  const [id, ...t] = args;
  const c = await cred();
  const r = await fetch(`${IG}/${id}/replies`, { method: 'POST', body: new URLSearchParams({ message: t.join(' '), access_token: c.token }) });
  console.log(JSON.stringify(await r.json()));
} else if (cmd === 'informe') {
  const c = await cred();
  const perfil = await ig(`me?fields=username,followers_count,follows_count,media_count`, c);
  const alcance = await ig(`${c.user_id}/insights?metric=reach,profile_views,website_clicks&period=day&metric_type=total_value&since=${Math.floor(Date.now() / 1000) - 7 * 86400}&until=${Math.floor(Date.now() / 1000)}`, c);
  const acc = await sql`select tipo, count(*)::int n from seo.ig_acciones where fecha > current_date - 7 group by tipo`;
  const [vis] = await sql`select count(*)::int n from seo.visitas where created_at > now() - interval '7 days' and evento = 'visita' and coalesce(ref,'') ilike '%instagram%'`.catch(() => [{ n: null }]);
  const [cont] = await sql`select count(*)::int n from seo.contactos where created_at > now() - interval '7 days' and not coalesce(es_prueba, false)`.catch(() => [{ n: null }]);
  console.log(JSON.stringify({ perfil, alcance: alcance.data ?? alcance.error, acciones: acc, visitas_desde_instagram: vis.n, contactos_web: cont.n }, null, 1));
} else {
  console.log('Comandos: cargar | hoy | hecho | accion | recientes | comentarios | responder | informe');
}
await sql.end();
