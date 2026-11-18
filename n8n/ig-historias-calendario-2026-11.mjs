// 18-11-2026 · Calendario de historias hasta el 11-12 (él: «déjalo todo programado junto a lo que ya tenías con este
// estilo y temas a subir»). Lunes a viernes, 20:30, 2 historias al día (más el aviso si ese día sale reel), cada una con su
// fecha en seo.ig_cola.fecha. Los temas acompañan a lo que sale ese día (reel o blog).
// Añade 19 historias nuevas del estilo 3 (claras) y apunta en el plan diario (seo.ig_plan) qué historias salen cada día.
// Uso: node --env-file=.env.local n8n/ig-historias-calendario-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const BASE = 'https://experto-en-seo.vercel.app/api/ig/historia?id=';
const CTA = 'Diagnóstico gratis · enlace en el perfil';
const P = (o) => ({ v: 3, plantilla: 'problema', etiqueta: '¿Te pasa?', cierre: CTA, ...o });
const T = (o) => ({ v: 3, plantilla: 'truco', etiqueta: 'Truco del día', tuerqui: 'senala', ...o });
const IA = (o) => ({ v: 3, plantilla: 'ia', etiqueta: 'IA que ya puedes usar', tuerqui: 'malabares', ...o });

const NUEVAS = [
  ['h3-stock', P({ tuerqui: 'celebra', titulo: '¿Te enteras tarde de que falta material?', acento: 'tarde',
    antes: 'Lo descubres justo cuando lo necesitas', ahora: 'Te avisa antes de que se acabe', dice: 'Ni un trabajo parado por un tornillo. ¡Y mira que yo soy una tuerca!' })],
  ['h3-mes', P({ etiqueta: '¿Te suena?', tuerqui: 'piensa', titulo: '¿Sabes cómo va el mes sin esperar al gestor?', acento: 'cómo va el mes',
    antes: 'Te enteras cuando se cierra el trimestre', ahora: 'Lo ves hoy: ventas, cobros y gastos de un vistazo', dice: 'Números claros, cabeza tranquila.' })],
  ['h3-planos', P({ tuerqui: 'senala', titulo: '¿Pasas horas midiendo planos para presupuestar?', acento: 'horas',
    antes: 'Mides pieza a pieza con la regla', ahora: 'Subes el plano y sale el presupuesto', dice: 'Tú sube el plano, que las cuentas las echo yo.' })],
  ['h3-excel', P({ etiqueta: '¿Te suena?', tuerqui: 'agobiado', titulo: '¿Tu empresa vive en mil Excel?', acento: 'mil Excel',
    antes: 'Cada uno con su versión y ninguna cuadra', ahora: 'Todo en un sitio, al día y para todo el equipo', dice: 'Un solo sitio para todo. Y sin «final_final_v3».' })],
  ['h3-web', P({ tuerqui: 'senala', titulo: '¿Tu web lleva años sin tocarse?', acento: 'años',
    antes: 'Nadie la visita y no trae ni un cliente', ahora: 'Rápida, en Google y con alguien que contesta', dice: 'Una web que trabaja mientras tú trabajas.' })],
  ['h3-vacaciones', P({ tuerqui: 'saluda', titulo: '¿Si te vas una semana, se para todo?', acento: 'se para todo',
    antes: 'Todo está en tu cabeza y en tu móvil', ahora: 'Cualquiera del equipo sabe cómo va cada trabajo', dice: 'Vete tranquilo, que aquí me quedo yo.' })],
  ['h3-firmas', P({ etiqueta: '¿Te suena?', tuerqui: 'celebra', titulo: '¿Imprimes para firmar y luego escaneas?', acento: 'escaneas',
    antes: 'Imprimir, firmar, escanear y enviar', ahora: 'Se firma en el móvil y se guarda solo', dice: 'Ahorras papel, tinta y paciencia.' })],
  ['h3-citas', P({ tuerqui: 'agobiado', titulo: '¿Se te cruzan las citas y los encargos?', acento: 'se te cruzan',
    antes: 'Agenda en papel, en el móvil y en la cabeza', ahora: 'Un calendario para todo el equipo, con avisos', dice: 'Ni un cliente esperando en la puerta.' })],
  ['h3-truco-seguimiento', T({ titulo: 'Llama a los 3 días de mandar un presupuesto', acento: 'a los 3 días',
    puntos: ['Apunta el día en que lo mandas', 'Al tercer día, una llamada corta: «¿Lo has podido ver?»'], dice: 'Presupuesto sin llamada, presupuesto olvidado.' })],
  ['h3-truco-plantillas', T({ titulo: 'Ten tus presupuestos en plantilla', acento: 'en plantilla',
    puntos: ['Guarda los 3 trabajos que más haces', 'Cambia solo medidas y cantidades'], dice: 'Lo que hacías en una hora, en diez minutos.' })],
  ['h3-truco-copias', T({ titulo: 'Haz la copia de seguridad antes de que haga falta', acento: 'antes',
    puntos: ['Una copia automática cada noche', 'Otra fuera de la oficina, en la nube'], dice: 'Que el disco duro no te dé un disgusto.' })],
  ['h3-truco-maps', T({ titulo: 'Que te encuentren en Google Maps', acento: 'Google Maps',
    puntos: ['Completa tu ficha: horario, fotos y teléfono', 'Pide una reseña a cada cliente contento'], dice: 'Si no sales en el mapa, para muchos no existes.' })],
  ['h3-truco-viernes', T({ etiqueta: 'Truco para el viernes', titulo: 'Cierra la semana en 15 minutos', acento: '15 minutos',
    puntos: ['Repasa lo que ha quedado pendiente', 'Deja apuntado lo primero del lunes'], dice: 'Y el lunes empiezas sabiendo qué hacer. ¡Gloria bendita!' })],
  ['h3-truco-catalogo', T({ titulo: 'Enseña tu trabajo en el catálogo de WhatsApp', acento: 'catálogo',
    puntos: ['Sube fotos de tus mejores trabajos', 'Mándalo cuando te pidan precio'], dice: 'Una foto vende más que mil explicaciones.' })],
  ['h3-ia-correos', IA({ titulo: 'Escribe los correos difíciles sin agobio', acento: 'sin agobio',
    puntos: ['Cuéntale a la IA qué quieres decir', 'Pídele un tono amable y firme, y repásalo'], dice: 'Ideal para reclamar un pago sin perder al cliente.' })],
  ['h3-ia-fichas', IA({ titulo: 'Las fichas de tus productos, en un momento', acento: 'en un momento',
    puntos: ['Pasa a la IA los datos técnicos', 'Pídele una descripción clara para tu web'], dice: 'Tú pones los datos, la IA pone las palabras.' })],
  ['h3-ia-idiomas', IA({ titulo: 'Atiende a clientes de fuera sin saber idiomas', acento: 'sin saber idiomas',
    puntos: ['Pega su mensaje en la IA para entenderlo', 'Escribe tu respuesta y pídele que la traduzca'], dice: 'Do you speak murciano? ¡Ahora sí!' })],
  ['h3-ia-manual', IA({ titulo: 'Pregúntale al manual de la máquina', acento: 'al manual',
    puntos: ['Sube el PDF del manual a la IA', 'Pregúntale lo que buscas, como a un compañero'], dice: 'Se acabó buscar en 300 páginas.' })],
  ['h3-ia-ofertas', IA({ titulo: 'Compara ofertas de proveedores de un vistazo', acento: 'de un vistazo',
    puntos: ['Pasa a la IA las ofertas que te han llegado', 'Pídele una tabla: precio, plazo y condiciones'], dice: 'Y eliges con los números delante, no a ojo.' })],
];

// Lunes a viernes. Los temas acompañan a lo de ese día (R = reel, B = blog).
const CALENDARIO = [
  ['2026-11-19', ['h3-facturas', 'h3-truco-cobros'], ''],
  ['2026-11-20', ['h3-preguntas', 'h3-web'], 'R: web · B: factura electrónica'],
  ['2026-11-23', ['h3-presupuestos', 'h3-truco-seguimiento'], ''],
  ['2026-11-24', ['h3-pieza', 'h3-truco-plantillas'], 'B: presupuesto de mecanizado'],
  ['2026-11-25', ['h3-partes', 'h3-truco-albaranes'], 'R: Documentos'],
  ['2026-11-26', ['h3-noticia-luz', 'h3-ia-actas'], ''],
  ['2026-11-27', ['h3-ia-resenas', 'h3-truco-viernes'], 'B: 5 usos de la IA en un taller'],
  ['2026-11-30', ['h3-margen', 'h3-truco-whatsapp'], 'Carrusel: errores de presupuesto'],
  ['2026-12-01', ['h3-excel', 'h3-ia-correos'], 'B'],
  ['2026-12-02', ['h3-stock', 'h3-truco-correo'], 'R: calculadora de piezas'],
  ['2026-12-03', ['h3-firmas', 'h3-ia-manual'], ''],
  ['2026-12-04', ['h3-truco-maps', 'h-documentos-v2'], 'B'],
  ['2026-12-07', ['h3-citas', 'h3-ia-idiomas'], ''],
  ['2026-12-08', ['h3-vacaciones', 'h3-truco-copias'], 'B'],
  ['2026-12-09', ['h3-mes', 'h3-ia-ofertas'], 'R: informes del mes'],
  ['2026-12-10', ['h3-planos', 'h3-ia-fichas'], ''],
  ['2026-12-11', ['h3-truco-catalogo', 'h-web-v2'], 'B'],
];

// 1) las nuevas, en la cola
const [m] = await sql`select coalesce(max(orden), 0)::int n from seo.ig_cola where tipo = 'historia'`;
let orden = m.n;
for (const [id, datos] of NUEVAS) {
  orden++;
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, estado, datos, historia_url, orden)
    values (${id}, 'historia', ${datos.titulo}, '', 'pendiente', ${sql.json(datos)}, ${BASE + id}, ${orden})
    on conflict (id) do update set datos = excluded.datos, estado = 'pendiente', historia_url = excluded.historia_url`;
}

// 2) fecha y orden de cada una según el calendario
const titulos = {};
let o = orden + 100;
for (const [fecha, ids] of CALENDARIO) for (const id of ids) {
  o++;
  const r = await sql`update seo.ig_cola set fecha = ${fecha}, orden = ${o} where id = ${id} and tipo = 'historia' and estado in ('pendiente', 'propuesto') returning titulo`;
  if (!r.length) throw new Error(`no está en el banco: ${id}`);
  titulos[id] = r[0].titulo;
}
const sinFecha = await sql`select id from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null and fecha is null`;
if (sinFecha.length) console.log('⚠️ sin fecha:', sinFecha.map((x) => x.id).join(', '));

// 3) el plan diario: en cada día, qué historias salen (y la actividad de L-V si el día no la tenía)
const [modelo] = await sql`select tareas from seo.ig_plan where fecha = '2026-11-19'`;
const actividad = modelo.tareas.filter((t) => t.tipo === 'seguir' || t.tipo === 'comentar');
for (const [fecha, ids] of CALENDARIO) {
  const detalle = `Historias 20:30${''}: ${ids.map((id) => `«${titulos[id]}»`).join(' + ')}`;
  const [d] = await sql`select tareas, titulo, estado from seo.ig_plan where fecha = ${fecha}`;
  if (d) {
    const reel = d.tareas.some((t) => t.tipo === 'reel');
    let tareas = d.tareas.filter((t) => t.tipo !== 'historia');
    const hist = { tipo: 'historia', detalle: reel ? `${detalle} + aviso del reel` : detalle };
    const i = tareas.findIndex((t) => t.tipo === 'reel');
    tareas.splice(i + 1, 0, hist);
    if (!tareas.some((t) => t.tipo === 'seguir')) tareas = [...tareas, ...actividad];
    const pieza = tareas.find((t) => t.tipo === 'reel');
    const titulo = [pieza ? (pieza.detalle.startsWith('Carrusel') ? 'Carrusel' : 'Reel') : null, pieza ? 'historias' : 'Historias', 'seguir y comentar'].filter(Boolean).join(', ');
    await sql`update seo.ig_plan set tareas = ${sql.json(tareas)}, titulo = ${titulo} where fecha = ${fecha}`;
  } else {
    await sql`insert into seo.ig_plan (fecha, titulo, tareas) values (${fecha}, 'Historias, seguir y comentar', ${sql.json([{ tipo: 'historia', detalle }, ...actividad])})`;
  }
}

for (const d of await sql`select fecha::text f, titulo, tareas from seo.ig_plan where fecha between '2026-11-19' and '2026-12-11' order by fecha`)
  console.log(d.f, '|', d.titulo, '\n   ', d.tareas.map((t) => `${t.tipo}: ${t.detalle.slice(0, 120)}`).join('\n    '));
await sql.end();
