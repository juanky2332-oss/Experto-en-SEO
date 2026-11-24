// 24-11-2026 (estudio: 14 seguidores, 0 guardados y 0 compartidos en un mes): dos carruseles útiles para GUARDAR y COMPARTIR,
// que son lo que hace que Instagram nos enseñe a gente nueva. Van los jueves (26-11 y 3-12), que solo tenían historias,
// así cada semana lleva 4 piezas: 2 reels entre semana + 1 carrusel + el reel del sábado.
// El de facturas va de la mano de la guía de la web /automatizar-facturas-proveedores/.
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const B = 'https://demo.transformaconia.com/ig/carruseles';
const cierre = (p) => `👉 ¿Lo quieres en tu empresa? Escríbenos «${p}» por mensaje o reserva tu diagnóstico gratis de 30 min (enlace en el perfil).`;
const piezas = [
  { id: 'c-facturas-proveedor', fecha: '2026-11-26', carpeta: 'facturas-proveedor', titulo: '4 errores con las facturas de proveedor',
    texto: `¿Facturas de proveedor tecleadas a mano? Estos 4 errores cuestan dinero 🧾\n\nLa factura que se paga dos veces, el proveedor que «cambia de cuenta», el precio que no es el del pedido… Casi nunca se ven hasta el trimestre.\n\nGuárdalo y pásaselo a quien lleve las facturas en tu empresa.\n\n${cierre('FACTURAS')}\n\n#facturas #pymes #gestionempresarial #talleresmecanicos #regiondemurcia ` },
  { id: 'c-erp-preguntas', fecha: '2026-12-03', carpeta: 'erp-preguntas', titulo: '5 preguntas antes de elegir un ERP',
    texto: `¿Vas a cambiar de programa de gestión? Antes, hazle estas 5 preguntas al que te lo vende 📋\n\nLa demo con tus datos, que el presupuesto pase a factura sin teclear, Verifactu, tus datos y la permanencia. Si no te contestan claro, mala señal.\n\nGuárdalo para cuando te toque decidir.\n\n${cierre('ERP')}\n\n#erp #pymes #gestionempresarial #industria #regiondemurcia ` },
];
for (const p of piezas) {
  const imagenes = ['01', '02', '03', '04', '05', '06'].map((n) => `${B}/${p.carpeta}/${n}.jpg`);
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, portada_url, fecha, estado, datos)
    values (${p.id}, 'carrusel', ${p.titulo}, ${p.texto}, ${imagenes[0]}, ${p.fecha}, 'pendiente', ${sql.json({ imagenes })})
    on conflict (id) do update set titulo = excluded.titulo, texto = excluded.texto, portada_url = excluded.portada_url, fecha = excluded.fecha, datos = excluded.datos
    where seo.ig_cola.estado in ('pendiente', 'propuesto')`;
  const [pl] = await sql`select tareas from seo.ig_plan where fecha = ${p.fecha} and estado <> 'hecho'`;
  if (!pl) { console.log('sin plan', p.fecha); continue; }
  let t = pl.tareas.filter((x) => x.ref !== p.id);
  t = t.map((x) => x.tipo === 'historia' && !/aviso del reel$/.test(x.detalle) ? { ...x, detalle: x.detalle + ' + aviso del reel' } : x);
  t = [{ ref: p.id, tipo: 'reel', detalle: `Carrusel: ${p.titulo}` }, ...t];
  await sql`update seo.ig_plan set tareas = ${sql.json(t)}, titulo = 'Carrusel, historias, seguir y comentar' where fecha = ${p.fecha}`;
  console.log('✓', p.id, p.fecha);
}
const c = await sql`select fecha::text, tipo, id from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto') order by fecha`;
console.log(c.map((x) => `${x.fecha} ${x.tipo} ${x.id}`).join('\n'));
await sql.end();
