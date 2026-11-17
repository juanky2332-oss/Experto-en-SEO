// Afinado con los datos del estudio (17-11-2026, apartado Instagram del Radar):
// - #tuerqui fuera: es nuestra marca, nadie lo busca y gasta 1 de los 5 hashtags.
// - Mejor media: #caldereria y #gestionempresarial (el reel que más ha funcionado), #talleresmecanicos (3 publ.), #regiondemurcia (siempre).
// Regla: 5 hashtags = #regiondemurcia + 1-2 del oficio + 1 del tema + 1 de empresa/gestión.
// Uso: node --env-file=.env.local n8n/ig-afinar-hashtags-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const NUEVOS = {
  'demo-asistente-20': '#chatbot #tiendaonline #distribucionindustrial #regiondemurcia #gestionempresarial',
  'demo-web-v2': '#disenoweb #paginaweb #regiondemurcia #emprendedores #pymes',
  'demo-documentos-v2': '#facturas #gestoria #talleresmecanicos #regiondemurcia #gestionempresarial',
  'calculadora3': '#mecanizado #presupuestos #caldereria #regiondemurcia #automatizacion',
  'demo-informes-20': '#talleresmecanicos #gestionempresarial #caldereria #regiondemurcia #pymes',
  'demo-planos-20': '#caldereria #presupuestos #mecanizado #regiondemurcia #gestionempresarial',
  'demo-albaranes-20': '#talleresmecanicos #albaranes #facturacion #regiondemurcia #gestionempresarial',
};
for (const [id, tags] of Object.entries(NUEVOS)) {
  const [x] = await sql`select texto from seo.ig_cola where id = ${id} and estado in ('pendiente', 'propuesto')`;
  if (!x) { console.log('no pendiente', id); continue; }
  // se cambia solo la línea final de hashtags (termina en espacio para que Instagram no autocomplete)
  const texto = x.texto.replace(/(\n|^)(#[\p{L}\p{N}_]+\s*)+\s*$/u, `$1${tags} `);
  if (texto === x.texto) { console.log('sin línea de hashtags', id); continue; }
  await sql`update seo.ig_cola set texto = ${texto} where id = ${id}`;
  console.log('ok', id, '→', tags);
}
await sql.end();
