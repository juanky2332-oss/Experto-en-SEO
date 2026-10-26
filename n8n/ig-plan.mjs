// Plan diario de Instagram (seo.ig_plan). Lo usan el panel (propuesta por Telegram) y el agente local (Claude + Chrome).
//
//   node n8n/ig-plan.mjs cargar                      → carga el plan del 27-10-2026 al 26-11-2026 (no pisa días ya propuestos)
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
  console.log(JSON.stringify(l.length ? { fecha: hoy(), tareas: l } : { nada_que_hacer: true }, null, 1));
} else if (cmd === 'reclamar') {
  // node n8n/ig-plan.mjs reclamar <id>  → ANTES de hacer la tarea; si dice «no», otro (el móvil u otra ejecución) la tiene: sáltala
  const [x] = await sql`update seo.ig_movil set reclamada_at = now() where id = ${Number(args[0])} and not hecho
    and (reclamada_at is null or reclamada_at < now() - interval '60 minutes') returning id`;
  console.log(x ? 'ok' : 'no');
} else if (cmd === 'hecho-item') {
  // node n8n/ig-plan.mjs hecho-item <id>  → la tarea de la lista ya está hecha (y queda apuntada)
  const [x] = await sql`update seo.ig_movil set hecho = true where id = ${Number(args[0])} and not hecho returning tipo, cuenta, url, texto, fecha`;
  if (x) await sql`insert into seo.ig_acciones (tipo, cuenta, url, texto, fecha) values (${x.tipo}, ${x.cuenta}, ${x.url}, ${x.texto}, ${x.fecha})`;
  console.log(x ? 'ok' : 'ya estaba hecha');
} else if (cmd === 'hecho') {
  // informe del agente local a Telegram
  const informe = (args.join(' ') || fs.readFileSync(0, 'utf8')).trim();
  await gw({ action: 'tg', text: `✅ <b>Instagram: lo que he hecho desde el ordenador</b>\n\n${informe.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}`.slice(0, 4000) });
  console.log('ok');
} else if (cmd === 'accion') {
  const [tipo, cuenta, url = null, texto = null] = args;
  await sql`insert into seo.ig_acciones (tipo, cuenta, url, texto, fecha) values (${tipo}, ${cuenta.replace(/^@/, '')}, ${url}, ${texto}, ${hoy()})`;
  console.log('ok');
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
