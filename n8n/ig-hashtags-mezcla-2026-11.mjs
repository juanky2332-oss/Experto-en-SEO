// Hashtags con alcance Y con sentido (18-11-2026, estudio con él): el 98 % del alcance viene de NO seguidores (recomendaciones),
// los hashtags sirven sobre todo para que Instagram clasifique el vídeo y salga en búsquedas. Mezcla por publicación (máx. 5):
// 1 grande y del tema (#inteligenciaartificial, #emprendedores, #pymes) + 2 medianos del tema + 2 de nicho/local (#regiondemurcia).
// Nada sin relación (#love, #fyp…). Uso: node --env-file=.env.local n8n/ig-hashtags-mezcla-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const NUEVOS = {
  'demo-asistente-20': '#inteligenciaartificial #chatbot #tiendaonline #pymes #regiondemurcia',
  'demo-web-v2': '#emprendedores #disenoweb #paginaweb #pymes #regiondemurcia',
  'demo-documentos-v2': '#inteligenciaartificial #facturas #gestoria #autonomos #regiondemurcia',
  'calculadora3': '#emprendedores #presupuestos #mecanizado #caldereria #regiondemurcia',
  'demo-informes-20': '#pymes #gestionempresarial #talleresmecanicos #caldereria #regiondemurcia',
  'demo-planos-20': '#inteligenciaartificial #presupuestos #caldereria #mecanizado #regiondemurcia',
  'demo-albaranes-20': '#autonomos #facturacion #albaranes #talleresmecanicos #regiondemurcia',
};
for (const [id, tags] of Object.entries(NUEVOS)) {
  const [x] = await sql`select texto from seo.ig_cola where id = ${id} and estado in ('pendiente', 'propuesto')`;
  if (!x) { console.log('no pendiente', id); continue; }
  const texto = x.texto.replace(/(\n|^)(#[\p{L}\p{N}_]+\s*)+\s*$/u, `$1${tags} `);
  await sql`update seo.ig_cola set texto = ${texto} where id = ${id}`;
  console.log('ok', id);
}
await sql.end();
