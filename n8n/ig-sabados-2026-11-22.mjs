// 22-11-2026 (él: «algún reel tendrás que hacer en sábado tarde-noche, con mejor audiencia»): el mejor reel hasta ahora,
// «Del plano a la factura», salió un sábado (14-11) a las 22:47 con 115 vistas. Tres reels nuevos (cobros, gastos con foto
// y trimestre para la gestoría) los sábados 28-11, 5-12 y 12-12 a las 22:30 (n8n «Sábado 22:30 y 23:00» → reelNoche).
// Para que cada semana lleve 3 piezas, albaranes pasa del viernes 4-12 al lunes 7-12.
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const B = 'https://demo.transformaconia.com/ig/demo';
const cierre = (p) => `👉 ¿Lo quieres en tu empresa? Escríbenos «${p}» por mensaje o reserva tu diagnóstico gratis de 30 min (enlace en el perfil).`;
const reels = [
  { id: 'demo-cobros-20', fecha: '2026-11-28', titulo: '¿Quién te debe?', archivo: 'cobros-20',
    texto: `¿Sabes ahora mismo quién te debe dinero? 💶\n\nEn cobros lo vencido sale en rojo, cada factura con los días de retraso, y para reclamar basta un toque. Si estás fuera, se lo preguntas por Telegram y te contesta con la lista.\n\n¿Cuánto tienes ahora mismo pendiente de cobro?\n\n${cierre('COBROS')}\n\n#pymes #cobros #facturacion #talleresmecanicos #regiondemurcia ` },
  { id: 'demo-gastos-20', fecha: '2026-12-05', titulo: '¿Tickets en la guantera?', archivo: 'gastos-20',
    texto: `El ticket que se pierde en la guantera es un gasto que no te desgravas 🧾\n\nLe haces una foto, la IA lee proveedor, fecha, base, IVA y retención, y tú solo revisas y guardas. Ya cuenta para el trimestre.\n\n${cierre('TICKETS')}\n\n#autonomos #gastos #facturacion #talleresmecanicos #regiondemurcia ` },
  { id: 'demo-fiscal-20', fecha: '2026-12-12', titulo: '¿Fin de trimestre?', archivo: 'fiscal-20',
    texto: `Fin de trimestre y el gestor pidiéndote papeles 📁\n\nEliges el trimestre y lo tienes: facturado, gastos e IVA. Antes de entregar te avisa de lo que falta (una factura sin NIF, un hueco en la numeración…) y te prepara el paquete para tu asesor, numerado y con su resumen. Con los plazos de Hacienda a la vista.\n\n${cierre('TRIMESTRE')}\n\n#pymes #autonomos #gestoria #iva #regiondemurcia ` },
];
for (const r of reels) {
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, video_url, portada_url, fecha, estado)
    values (${r.id}, 'reel', ${r.titulo}, ${r.texto}, ${`${B}/${r.archivo}.mp4`}, ${`${B}/${r.archivo}.jpg`}, ${r.fecha}, 'pendiente')
    on conflict (id) do update set titulo = excluded.titulo, texto = excluded.texto, video_url = excluded.video_url, portada_url = excluded.portada_url, fecha = excluded.fecha
    where seo.ig_cola.estado in ('pendiente', 'propuesto')`;
  const tareas = [{ ref: r.id, tipo: 'reel', detalle: `Reel del sábado a las 22:30: ${r.titulo} (sale solo, con su historia de aviso)` }];
  await sql`insert into seo.ig_plan (fecha, titulo, tareas, estado) values (${r.fecha}, 'Reel del sábado (22:30)', ${sql.json(tareas)}, 'pendiente')
    on conflict (fecha) do update set titulo = excluded.titulo, tareas = excluded.tareas where seo.ig_plan.estado not in ('hecho')`;
  console.log('✓', r.id, r.fecha);
}
// albaranes: del viernes 4-12 al lunes 7-12
await sql`update seo.ig_cola set fecha = '2026-12-07' where id = 'demo-albaranes-20' and estado in ('pendiente', 'propuesto')`;
const mover = async (fecha, quitar) => {
  const [p] = await sql`select tareas from seo.ig_plan where fecha = ${fecha} and estado <> 'hecho'`;
  if (!p) return console.log('sin plan', fecha);
  let t = p.tareas.filter((x) => !(x.tipo === 'reel' && x.ref === 'demo-albaranes-20'));
  t = t.map((x) => x.tipo === 'historia' ? { ...x, detalle: x.detalle.replace(/ \+ aviso del reel$/, '') + (quitar ? '' : ' + aviso del reel') } : x);
  if (!quitar) t = [{ ref: 'demo-albaranes-20', tipo: 'reel', detalle: 'Reel: ¿Albaranes en papel?' }, ...t];
  await sql`update seo.ig_plan set tareas = ${sql.json(t)}, titulo = ${quitar ? 'Historias, seguir y comentar' : 'Reel, historias, seguir y comentar'} where fecha = ${fecha}`;
  console.log('✓ plan', fecha, quitar ? 'sin reel' : 'con albaranes');
};
await mover('2026-12-04', true);
await mover('2026-12-07', false);
const c = await sql`select fecha::text, id from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto') order by fecha`;
console.log(c.map((x) => `${x.fecha} ${x.id}`).join('\n'));
await sql.end();
