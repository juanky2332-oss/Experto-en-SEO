// Pasa al Radar TODO el historial de Instagram (seo.ig_acciones: seguir, comentar, me gusta) con su fecha real.
// El Radar no duplica (misma acción, mismo día y misma publicación) y crea «ig:<cuenta>» para las que no son tiendas.
// Uso: node --env-file=.env.local n8n/radar-historial-ig.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const filas = await sql`select tipo, cuenta, url, texto, fecha::text fecha from seo.ig_acciones where tipo in ('seguir', 'comentar', 'megusta') order by fecha, tipo`;
let ok = 0, mal = 0, fuera = 0;
for (const f of filas) {
  try {
    const r = await fetch(process.env.RADAR_URL + '/api/instagram/sync', {
      method: 'POST', headers: { 'x-ig-key': process.env.RADAR_IG_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ handle: f.cuenta, tipo: f.tipo, url: f.url, texto: f.texto, at: f.fecha + 'T12:00:00Z' }),
    });
    const j = await r.json();
    if (j.ok) { ok++; if (!j.enRadar) fuera++; } else { mal++; console.log('mal', f.cuenta, JSON.stringify(j)); }
  } catch (e) { mal++; console.log('error', f.cuenta, e.message); }
}
console.log({ total: filas.length, ok, fueraDelRadar: fuera, mal });
await sql.end();
