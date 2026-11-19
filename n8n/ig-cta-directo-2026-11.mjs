// 19-11-2026 · Llamada a la acción más directa en los reels y carruseles pendientes (él: «vamos más directo, a ver si
// hacemos más conversiones»). Cada pieza cierra con una PALABRA CLAVE para escribirnos por mensaje (así sabemos qué
// publicación trae cada conversación) y el diagnóstico gratis de 30 min con reserva (enlace en el perfil → /diagnostico/).
// Uso: node --env-file=.env.local n8n/ig-cta-directo-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const CLAVE = {
  'demo-web-v2': 'WEB', 'demo-documentos-v2': 'FACTURAS', 'c-errores-presupuesto': 'MARGEN', calculadora3: 'PIEZA',
  'demo-informes-20': 'MES', 'demo-planos-20': 'PLANO', 'demo-albaranes-20': 'ALBARANES',
};
// frases de cierre viejas que se sustituyen (las preguntas para comentar se quedan: dan conversación)
const VIEJAS = [
  /Si tu web no te trae clientes, cuéntanos qué haces: te decimos por escrito cómo quedaría la tuya\. Enlace en la bio\./,
  / Si quieres verlo con tus números, el diagnóstico es gratis \(enlace en el perfil\)\./,
];
const cta = (k) => `👉 ¿Lo quieres en tu empresa? Escríbenos «${k}» por mensaje o reserva tu diagnóstico gratis de 30 min (enlace en el perfil).`;
for (const [id, k] of Object.entries(CLAVE)) {
  const [e] = await sql`select texto, estado from seo.ig_cola where id = ${id}`;
  if (!e || !['pendiente', 'propuesto'].includes(e.estado)) { console.log(id, 'no está pendiente, no se toca'); continue; }
  let t = e.texto;
  if (t.includes('reserva tu diagnóstico gratis de 30 min')) { console.log(id, 'ya estaba'); continue; }
  for (const v of VIEJAS) t = t.replace(v, '');
  // la CTA va justo antes de los hashtags (último párrafo que empieza por #)
  const partes = t.split('\n\n');
  const i = partes.findLastIndex((p) => p.trim().startsWith('#'));
  partes.splice(i < 0 ? partes.length : i, 0, cta(k));
  t = partes.filter((p) => p.trim()).join('\n\n');
  if (t.length > 2100) throw new Error(`${id}: texto demasiado largo (${t.length})`);
  await sql`update seo.ig_cola set texto = ${t} where id = ${id}`;
  console.log(id, '→', k);
}
await sql.end();
