// Banco de historias de Instagram (seo.ig_cola, tipo 'historia'). Cada día del ritmo salen 2 (una «pregunta» arrastra su «respuesta»),
// en el orden de esta lista, más el aviso de la publicación nueva del feed. Las imágenes las dibuja /api/ig/historia.
// Reglas: agente-ig/ESTILO-CUENTA.md (alternar claro/oscuro y tipo, nada de cifras inventadas: los ejemplos se marcan como ejemplo).
//
//   node n8n/ig-historias.mjs        → carga o actualiza las pendientes (nunca toca las ya publicadas)
import postgres from 'postgres';
import './lib.mjs';

const APP = process.env.APP_URL ?? 'https://experto-en-seo.vercel.app';
const CAP = 'https://demo.transformaconia.com/ig/historias';

const H = [
  ['consejo-caducidad', { plantilla: 'consejo', etiqueta: 'Consejo de taller', titulo: 'Pon fecha de caducidad a tus presupuestos', texto: '«Válido 15 días» al pie. Si suben los materiales, no te comes tú la diferencia.' }],
  ['mito-grandes', { plantilla: 'mito', titulo: 'La IA es solo para empresas grandes', texto: 'Las que más lo notan son las pequeñas, donde la misma persona lleva el taller y los papeles.' }],

  ['app-gasto', { plantilla: 'app', etiqueta: 'IndunexIA Gestión por dentro', titulo: 'Una foto al ticket y el gasto se apunta solo', img: `${CAP}/app-gasto.jpg`, texto: 'Proveedor, base, IVA y total. Tú solo lo revisas.' }],
  ['dato-horas', { plantilla: 'dato', etiqueta: 'Echa la cuenta', cifra: '5 h', titulo: 'al mes copiando presupuestos en facturas', texto: 'Ejemplo: 20 trabajos al mes × 15 minutos de volver a teclear lo mismo.', nota: 'Ejemplo orientativo' }],

  ['dato-margen', { plantilla: 'dato', etiqueta: 'Tu margen', cifra: '30 %', titulo: 'sobre coste no es un 30 % del precio', texto: 'Un 30 % sobre coste es un 23 % del precio de venta. Mira cuál usas al presupuestar.' }],
  ['pregunta-ordenador', { plantilla: 'pregunta', etiqueta: 'Pregunta rápida', titulo: '¿Hace falta cambiar de ordenador para usar IA en tu empresa?' }],
  ['respuesta-ordenador', { plantilla: 'respuesta', etiqueta: 'Respuesta', titulo: 'No.', texto: 'Funciona en el navegador y en el móvil que ya tienes. Lo que cambia es cómo trabajas, no el equipo.' }],

  ['app-presupuesto', { plantilla: 'app', etiqueta: 'IndunexIA Gestión por dentro', titulo: 'Del cálculo al presupuesto en un toque', img: `${CAP}/app-presupuesto.jpg`, texto: 'Material, medidas y horas de máquina → precio con tu margen.' }],
  ['mito-datos', { plantilla: 'mito', titulo: 'Con la IA pierdo el control de mis datos', texto: 'Cada empresa tiene su propia base de datos. La IA propone; tú decides qué se guarda.' }],

  ['consejo-facturar', { plantilla: 'consejo', etiqueta: 'Cobros', titulo: 'Factura el mismo día que entregas', texto: 'Cada día que tarda la factura es un día más que tarda el cobro.' }],
  ['pregunta-primero', { plantilla: 'pregunta', etiqueta: 'Pregunta rápida', titulo: '¿Qué se automatiza primero en un taller?' }],
  ['respuesta-primero', { plantilla: 'respuesta', etiqueta: 'Respuesta', titulo: 'Lo que haces cada día igual', texto: 'Pasar presupuestos a albarán y factura, apuntar gastos y perseguir cobros. Empieza por lo que más horas te quita.' }],

  ['app-resumen', { plantilla: 'app', etiqueta: 'IndunexIA Gestión por dentro', titulo: 'Al abrirlo: lo que te deben y lo que vence', img: `${CAP}/app-resumen.jpg`, texto: 'Sin buscar en carpetas ni en el correo.' }],
  ['dato-diagnostico', { plantilla: 'dato', etiqueta: 'Diagnóstico gratis', cifra: '48 h', titulo: 'y tienes por escrito qué automatizar primero', texto: 'Nos cuentas cómo trabajas y te lo enviamos por escrito, en 48 horas laborables.', nota: 'Enlace en el perfil' }],

  ['consejo-tickets', { plantilla: 'consejo', etiqueta: 'Para tu asesor', titulo: 'Guarda los tickets el mismo día', texto: 'Una foto en el momento y se acabó la caja de zapatos a final de trimestre.' }],
  ['mito-caro', { plantilla: 'mito', titulo: 'Automatizar es caro y lleva meses', texto: 'Se empieza por una tarea concreta, en días. Si no te ahorra tiempo, no merece la pena.' }],

  ['app-asistente', { plantilla: 'app', etiqueta: 'IndunexIA Gestión por dentro', titulo: 'Pregúntale a tu programa: ¿quién me debe dinero?', img: `${CAP}/app-asistente.jpg`, texto: 'El asistente te contesta con las facturas y los días de retraso.' }],
  ['pregunta-excel', { plantilla: 'pregunta', etiqueta: 'Tú qué opinas', titulo: '¿Excel o programa de gestión?' }],
  ['respuesta-excel', { plantilla: 'respuesta', etiqueta: 'Depende', titulo: 'De cuántas veces copias lo mismo', texto: 'Si un dato pasa por tus manos más de una vez (presupuesto, albarán, factura), un programa te ahorra ese trabajo y los errores.' }],

  ['consejo-horas', { plantilla: 'consejo', etiqueta: 'Presupuestos', titulo: 'Apunta las horas de máquina, no solo el material', texto: 'Es lo que más se olvida al presupuestar y lo que más margen se come.' }],
  ['dato-permanencia', { plantilla: 'dato', etiqueta: 'IndunexIA Gestión', cifra: '0', titulo: 'meses de permanencia', texto: 'Avisas con 30 días y listo. Y los 3 primeros meses de cuota, gratis.' }],

  ['app-factura', { plantilla: 'app', etiqueta: 'IndunexIA Gestión por dentro', titulo: 'La factura sale del albarán, sin teclear', img: `${CAP}/app-factura.jpg`, texto: 'Cliente, líneas e importes ya rellenos.' }],
  ['consejo-nosotros', { plantilla: 'consejo', etiqueta: 'Quiénes somos', titulo: 'Un grupo de expertos en IA de Murcia', texto: 'Más de 2 años llevando la IA y la automatización a talleres, industria y pymes. Sin humo: lo que no ahorra tiempo, no se monta.' }],

  ['app-calculadora', { plantilla: 'app', etiqueta: 'IndunexIA Gestión por dentro', titulo: 'Lo que te cuesta cada pieza, con el material de hoy', img: `${CAP}/app-calculadora.jpg`, texto: 'Y el precio por pieza con tu margen.' }],
];

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
let n = 0;
for (const [i, [slug, d]] of H.entries()) {
  const id = `h-${slug}`;
  const url = `${APP}/api/ig/historia?id=${id}`;
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, historia_url, datos, orden) values (${id}, 'historia', ${d.titulo}, '', ${url}, ${sql.json(d)}, ${(i + 1) * 10})
    on conflict (id) do update set titulo = excluded.titulo, historia_url = excluded.historia_url, datos = excluded.datos, orden = excluded.orden
    where seo.ig_cola.estado = 'pendiente'`;
  n++;
}
console.log(`${n} historias en el banco`);
await sql.end();
