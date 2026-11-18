// 18-11-2026 · Radar de noticias encendido para las historias de noticias (él: «organízate para tener las noticias que
// hagan falta actualizadas»). Busca cada mañana a las 8 y guarda en seo.radar SIN mandar resúmenes a Telegram
// (frecuencia 'panel'). Temas con más peso en Región de Murcia, ayudas y automatización.
// Uso: node --env-file=.env.local n8n/radar-encender-2026-11.mjs [--lanzar]
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const temas = [
  'industria Región de Murcia',
  'ayudas y subvenciones empresas Región de Murcia',
  'IA en la industria casos de éxito',
  'automatización industrial España',
  'digitalización pymes industriales',
  'Verifactu y factura electrónica pymes',
  'mantenimiento predictivo con IA',
  'herramientas de IA para pymes',
];
await sql`update seo.settings set value = value || ${sql.json({ activo: true, frecuencia: 'panel', temas })}, updated_at = now() where key = 'radar'`;
console.log((await sql`select value from seo.settings where key = 'radar'`)[0].value);
await sql.end();
if (process.argv.includes('--lanzar')) {
  const r = await fetch(`${process.env.N8N_BASE ?? 'https://paneln8n.transformaconia.com'}/webhook/seo-radar`, {
    method: 'POST', headers: { 'X-Seo-Key': process.env.SEO_GATEWAY_KEY, 'Content-Type': 'application/json' }, body: '{}' });
  console.log('lanzado:', r.status, await r.text());
}
