// 20-11-2026 · GRUPOS DE CADA DÍA (él: «coger los datos del Radar, estudiarlos bien, ver cuáles son los más propensos a
// seguir y hacer grupos para que cada día se vaya haciendo esa función, para que no hagas cada día el mismo paso»).
// Puntúa TODAS las empresas del Radar con Instagram fiable (incluida la cantera de la Región) y reparte las mejores en
// grupos por día laborable (seo.ig_objetivos). El agente sigue su grupo del día en vez de buscar en Instagram (menos
// búsquedas = menos riesgo de parecer un bot). Rehacer el reparto no toca lo ya hecho: solo lo pendiente de hoy en adelante.
// Uso: node --env-file=.env.local n8n/ig-grupos.mjs [--desde=AAAA-MM-DD] [--dias=15] [--ver]
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const args = process.argv.slice(2);
const opt = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? '').split('=')[1] || d;
const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const sumar = (f, d) => new Date(Date.parse(f + 'T12:00:00Z') + d * 864e5).toISOString().slice(0, 10);
const laborable = (f) => [1, 2, 3, 4, 5].includes(new Date(f + 'T12:00:00Z').getUTCDay());
// mismo volumen que `ig-plan hoy` (subida retrasada una semana el 19-11-2026): 2/3 de la Región, 1/3 del Radar
const VOL = (f) => (f >= '2026-12-07' ? 25 : f >= '2026-11-30' ? 18 : 12);

await sql`create table if not exists seo.ig_objetivos (
  id serial primary key, fecha date not null, orden int not null, grupo text not null check (grupo in ('region', 'radar')),
  cuenta text not null unique, dominio text, nombre text, provincia text, sector text, puntos int, motivo text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'seguida', 'saltada')), nota text,
  hecho_at timestamptz, creado timestamptz not null default now())`;

// ---------------------------------------------------------------- puntuación
const CERCA = { Murcia: 40, Alicante: 28, Albacete: 28, 'Almería': 28, Valencia: 18 };
const SECTOR = { 'Industria y metal': 25, 'Maquinaria y herramienta': 24, 'Electricidad y fontanería': 20, 'Taller y automoción': 18, 'Construcción y materiales': 16, 'Ferretería': 18, 'Agricultura y jardín': 10 };
const CADENAS = /leroy|bricomart|bauhaus|brico ?d[eé]p[oô]t|aki\b|obramat|würth|wurth|ikea|amazon|carrefour|el corte ingl/i;
export function puntuar(o) {
  const m = [];
  const zona = o.lista === 'Cantera Región de Murcia' ? 40 : CERCA[o.provincia] ?? 4;
  m.push(o.provincia ? `${o.provincia} (+${zona})` : `sin provincia (+${zona})`);
  const sec = SECTOR[o.sector] ?? 6;
  m.push(`${o.sector} (+${sec})`);
  const s = o.seguidores;
  const tam = s == null ? 6 : s >= 150 && s <= 3000 ? 15 : s > 3000 && s <= 8000 ? 8 : s >= 50 && s < 150 ? 8 : s > 8000 ? 2 : 4;
  m.push(s == null ? 'seguidores sin dato (+6)' : `${s} seguidores (+${tam})`);
  const real = (o.resenas >= 10 && o.resenas <= 800 ? 6 : o.resenas > 0 ? 3 : 0) + (o.rating >= 4.3 ? 2 : 0);
  if (real) m.push(`negocio con reseñas (+${real})`);
  const fia = o.igEstado === 'verificado' ? 6 : 4;
  const tienda = o.categoria === 'objetivo' ? 6 : o.categoria === 'potencial' ? 3 : 0;
  let p = zona + sec + tam + real + fia + tienda;
  if (CADENAS.test(`${o.nombre ?? ''} ${o.titulo ?? ''}`)) { p -= 40; m.push('gran cadena (−40)'); }
  return { puntos: Math.max(0, Math.min(100, p)), motivo: m.join(' · ') };
}

// ---------------------------------------------------------------- candidatas
const r = await fetch(process.env.RADAR_URL + '/api/instagram/candidatos', { headers: { 'x-ig-key': process.env.RADAR_IG_KEY } });
if (!r.ok) throw new Error('Radar ' + r.status);
const { filas } = await r.json();
const ya = new Set([
  ...(await sql`select lower(cuenta) c from seo.ig_acciones where tipo = 'seguir'`).map((x) => x.c),
  ...(await sql`select lower(cuenta) c from seo.ig_movil where tipo = 'seguir'`).map((x) => x.c),
  ...(await sql`select lower(cuenta) c from seo.ig_objetivos where estado <> 'pendiente'`).map((x) => x.c),
]);
const vistas = new Set();
const cands = filas
  .filter((o) => ['verificado', 'oficial'].includes(o.igEstado) && !o.privada)
  .filter((o) => o.igFollow === 'pendiente' && !o.loSeguimos && !o.acciones.includes('descartada') && !o.acciones.includes('seguir'))
  .filter((o) => !['no_contactar', 'no_interesa'].includes(o.contacto))
  .map((o) => ({ ...o, cuenta: o.handle.toLowerCase(), ...puntuar(o) }))
  .filter((o) => !ya.has(o.cuenta) && !vistas.has(o.cuenta) && vistas.add(o.cuenta) && o.puntos >= 25)
  .map((o) => ({ ...o, grupo: o.lista === 'Cantera Región de Murcia' || CERCA[o.provincia] >= 28 ? 'region' : 'radar' }))
  .sort((a, b) => b.puntos - a.puntos);
const region = cands.filter((o) => o.grupo === 'region');
const radar = cands.filter((o) => o.grupo === 'radar');
console.log(`Candidatas: ${cands.length} (Región y alrededores: ${region.length} · resto del Radar: ${radar.length})`);

// ---------------------------------------------------------------- reparto por días
const desde = opt('desde', hoy());
const dias = Number(opt('dias', 15));
const antes = new Map((await sql`select cuenta, fecha::text f from seo.ig_objetivos where estado = 'pendiente'`).map((x) => [x.cuenta, x.f]));
await sql`delete from seo.ig_objetivos where estado = 'pendiente' and fecha >= ${desde}::date`;
const filasNuevas = [];
let f = desde, n = 0;
while (n < dias && (region.length || radar.length)) {
  if (laborable(f)) {
    const v = VOL(f), nr = Math.round((v * 2) / 3);
    const grupo = [...region.splice(0, nr), ...radar.splice(0, v - nr)];
    // si una de las dos se acaba, completa con la otra
    while (grupo.length < v && (region.length || radar.length)) grupo.push((region.length ? region : radar).shift());
    grupo.forEach((o, i) => filasNuevas.push({ fecha: f, orden: i + 1, grupo: o.grupo, cuenta: o.cuenta, dominio: o.domain, nombre: o.nombre ?? o.titulo ?? null, provincia: o.provincia, sector: o.sector, puntos: o.puntos, motivo: o.motivo }));
    n++;
  }
  f = sumar(f, 1);
}
if (filasNuevas.length) await sql`insert into seo.ig_objetivos ${sql(filasNuevas, 'fecha', 'orden', 'grupo', 'cuenta', 'dominio', 'nombre', 'provincia', 'sector', 'puntos', 'motivo')} on conflict (cuenta) do nothing`;

// 20-11-2026 (él: «ese análisis ve apuntándolo en el Radar»): cada empresa que entra en un grupo (o cambia de día) queda
// anotada en su ficha del Radar con la puntuación y el porqué. Lo que luego se hace (seguida / saltada y tachada) lo apunta
// `ig-plan grupo-hecho`.
const fmt = (f) => new Date(f + 'T12:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
const anotar = filasNuevas.filter((x) => !antes.has(x.cuenta)); // solo las que entran nuevas (no llenar la ficha de notas al mover días)
let ok = 0;
for (let i = 0; i < anotar.length; i += 5) {
  const lote = anotar.slice(i, i + 5);
  const rs = await Promise.all(lote.map((x) => fetch(process.env.RADAR_URL + '/api/instagram/sync', {
    method: 'POST', headers: { 'x-ig-key': process.env.RADAR_IG_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ domain: x.dominio, handle: x.cuenta, tipo: 'lista', texto: `En el grupo para seguir del ${fmt(x.fecha)} · ${x.puntos}/100 · ${x.motivo}` }),
  }).then((r) => r.ok).catch(() => false)));
  ok += rs.filter(Boolean).length;
}
console.log(`Anotadas en el Radar: ${ok} de ${anotar.length}`);
const res = await sql`select fecha::text f, count(*)::int n, count(*) filter (where grupo = 'region')::int reg, round(avg(puntos))::int media from seo.ig_objetivos where estado = 'pendiente' and fecha >= ${desde}::date group by 1 order by 1`;
for (const x of res) console.log(`${x.f}: ${x.n} cuentas (${x.reg} de la Región) · puntuación media ${x.media}`);
console.log(`Quedan sin grupo: ${region.length} de la Región y ${radar.length} del Radar`);
if (args.includes('--ver')) for (const x of await sql`select fecha::text f, orden, grupo, cuenta, nombre, provincia, sector, puntos from seo.ig_objetivos where estado = 'pendiente' and fecha = ${desde}::date order by orden`) console.log(' ', x.orden, x.grupo.padEnd(6), `@${x.cuenta}`.padEnd(28), (x.nombre ?? '').slice(0, 34).padEnd(35), x.provincia ?? '-', '·', x.sector, '·', x.puntos);
await sql.end();
