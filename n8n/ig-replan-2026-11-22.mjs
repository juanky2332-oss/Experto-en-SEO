// 22-11-2026 · El programa del domingo avisaba: la semana del 23-11 solo tenía 1 reel. Se adelantan dos piezas ya hechas
// (planos y albaranes) para que cada semana tenga 2-3 publicaciones, como pide la guía (sección 5).
// Uso: node --env-file=.env.local n8n/ig-replan-2026-11-22.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const MOVER = [['demo-planos-20', '2026-11-27'], ['demo-albaranes-20', '2026-12-04']];
for (const [id, fecha] of MOVER) {
  const [p] = await sql`select titulo, tipo, estado from seo.ig_cola where id = ${id}`;
  if (!p || p.estado !== 'pendiente') { console.log(id, 'no está pendiente'); continue; }
  const [d] = await sql`select tareas from seo.ig_plan where fecha = ${fecha}`;
  if (!d) throw new Error('sin día de plan ' + fecha);
  if (d.tareas.some((t) => t.tipo === 'reel')) throw new Error(`${fecha} ya tiene publicación`);
  // quitar la pieza de su día viejo (si estaba en el plan) y ponerla en el nuevo, delante de las historias
  for (const v of await sql`select fecha::text f, tareas from seo.ig_plan where tareas @> ${sql.json([{ ref: id }])}`)
    await sql`update seo.ig_plan set tareas = ${sql.json(v.tareas.filter((t) => t.ref !== id))} where fecha = ${v.f}`;
  const tareas = [{ tipo: 'reel', ref: id, detalle: `${p.tipo === 'carrusel' ? 'Carrusel' : 'Reel'}: ${p.titulo}` }, ...d.tareas.map((t) => t.tipo === 'historia' && !/aviso del reel/.test(t.detalle) ? { ...t, detalle: `${t.detalle} + aviso del reel` } : t)];
  await sql`update seo.ig_plan set tareas = ${sql.json(tareas)}, titulo = 'Reel, historias, seguir y comentar' where fecha = ${fecha}`;
  await sql`update seo.ig_cola set fecha = ${fecha} where id = ${id}`;
  console.log(`${id} → ${fecha}`);
}
for (const x of await sql`select fecha::text f, tareas from seo.ig_plan where fecha between '2026-11-23' and '2026-12-11' order by fecha`)
  console.log(x.f, (x.tareas.find((t) => t.tipo === 'reel') || {}).detalle || '—');
await sql.end();
