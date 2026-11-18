// 18-11-2026 · Banco de historias con el ESTILO 3 (él: «me gusta más este estilo, mejor las claras; esa es la idea, ese
// tipo de historias. Espera a mañana para subir pero reorganiza todo con ese estilo»).
// Mensajes directos que ayudan en el día a día: problema en pregunta + antes/ahora, trucos con 2 pasos, IA que ya se
// puede usar y noticias útiles. Tuerqui habla en un bocadillo: gracioso pero profesional. Claras. Sin precios.
// Las del estilo anterior que quedaban pendientes se retiran (las animadas en vídeo se quedan al final).
// Uso: node --env-file=.env.local n8n/ig-historias-estilo3-banco-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const BASE = 'https://experto-en-seo.vercel.app/api/ig/historia?id=';
const CTA = 'Diagnóstico gratis · enlace en el perfil';
const P = (o) => ({ v: 3, plantilla: 'problema', etiqueta: '¿Te pasa?', cierre: CTA, ...o });
const T = (o) => ({ v: 3, plantilla: 'truco', etiqueta: 'Truco del día', tuerqui: 'senala', ...o });
const IA = (o) => ({ v: 3, plantilla: 'ia', etiqueta: 'IA que ya puedes usar', tuerqui: 'malabares', ...o });
const BANCO = [
  ['h3-facturas', P({ tuerqui: 'celebra', titulo: '¿Metes las facturas a mano?', acento: 'a mano',
    antes: 'Una a una, copiando datos al ordenador', ahora: 'Una foto con el móvil y se apuntan solas', dice: 'Tú haz la foto y sigue con tu café. Del resto me encargo yo.' })],
  ['h3-truco-cobros', T({ etiqueta: 'Truco para la semana', titulo: 'Cobra antes de que se te olvide', acento: 'antes',
    puntos: ['Cada lunes, mira qué facturas vencen', 'Avisa 3 días antes, no después'], dice: 'Cinco minutos el lunes y el resto de la semana, tranquilo.' })],
  ['h3-presupuestos', P({ etiqueta: '¿Te suena?', tuerqui: 'senala', titulo: '¿Tu presupuesto llega tarde?', acento: 'tarde',
    antes: 'El cliente espera días y se va con otro', ahora: 'Lo mandas el mismo día, desde el plano', dice: 'Pásame el plano y el presupuesto sale hoy. ¡Que no se te escape el cliente!' })],
  ['h3-ia-actas', IA({ titulo: 'El acta de la reunión, sin escribir', acento: 'sin escribir',
    puntos: ['Graba la reunión con el móvil', 'Pide a la IA el resumen y quién hace qué'], dice: 'Tú céntrate en la reunión, que la IA toma nota de todo.' })],
  ['h3-partes', P({ tuerqui: 'agobiado', titulo: '¿Los partes llegan en papel arrugado?', acento: 'papel arrugado',
    antes: 'Llegan días después y no hay quien los lea', ahora: 'Se firman en el móvil y pasan a la factura', dice: 'Ni uno más perdido en la furgoneta. Palabra de Tuerqui.' })],
  ['h3-truco-whatsapp', T({ titulo: 'Deja de contestar siempre lo mismo', acento: 'lo mismo',
    puntos: ['Apunta las 5 preguntas que más te hacen', 'Guárdalas como respuestas rápidas en WhatsApp Business'], dice: 'Y si quieres, contesto yo por ti… ¡aunque estés durmiendo!' })],
  ['h3-noticia-luz', { v: 3, plantilla: 'noticia', tuerqui: 'senala', etiqueta: 'Noticia · Región de Murcia', titulo: 'Ayudas para que tu nave gaste menos luz', acento: 'menos luz',
    fuente: 'Europa Press Murcia · 13 nov', puntos: ['Junta las facturas de luz de un año', 'Atento al BORM: ahí salen las bases'], dice: '¿Las facturas en una caja de zapatos? Te las ordeno yo.' }],
  ['h3-pieza', P({ etiqueta: '¿Te suena?', tuerqui: 'piensa', titulo: '¿Sabes lo que te cuesta cada pieza?', acento: 'cada pieza',
    antes: 'Calculas a ojo y el material ya ha subido', ahora: 'El coste al día, con el precio del material de hoy', dice: 'Con los números claros, presupuestas sin miedo.' })],
  ['h3-truco-correo', T({ titulo: 'Que el correo no te coma la mañana', acento: 'la mañana',
    puntos: ['Míralo a las 9 y a la 1, no a cada rato', 'Lo que se contesta en 2 minutos, en el momento'], dice: 'El resto del día, a lo tuyo, que es lo que da de comer.' })],
  ['h3-margen', P({ tuerqui: 'celebra', titulo: '¿Sabes cuánto ganas en cada trabajo?', acento: 'cuánto ganas',
    antes: 'Lo sabes a final de año, cuando ya no hay remedio', ahora: 'Lo ves al cerrar cada trabajo: horas, material y margen', dice: 'Los números, clarititos. Que para eso estoy yo.' })],
  ['h3-ia-resenas', IA({ titulo: 'Contesta las reseñas de Google en un minuto', acento: 'en un minuto',
    puntos: ['Copia la reseña en ChatGPT', 'Pídele una respuesta amable y corta, y repásala'], dice: 'Cliente contestado, cliente contento. ¡Y tú sin perder la mañana!' })],
  ['h3-preguntas', P({ tuerqui: 'saluda', titulo: '¿Te preguntan mil veces lo mismo?', acento: 'mil veces',
    antes: 'Coges el teléfono en mitad del trabajo', ahora: 'Un asistente en tu web contesta al momento', dice: 'Yo atiendo, tú sigues a lo tuyo. ¡Hasta de madrugada!' })],
  ['h3-truco-albaranes', T({ titulo: 'Que no se te pierda ni un albarán', acento: 'ni un albarán',
    puntos: ['Hazle una foto nada más recibirlo', 'Una carpeta por proveedor y por mes'], dice: 'Y si lo quieres automático, ya sabes dónde encontrarme.' })],
];

// fuera las del estilo anterior que quedaban en el banco (las animadas en vídeo se quedan)
const fuera = await sql`update seo.ig_cola set estado = 'descartado' where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null
  and video_url is null and coalesce((datos->>'v')::int, 1) < 3 returning id`;
console.log('retiradas:', fuera.map((x) => x.id).join(', ') || 'ninguna');
// las nuevas van detrás de todo lo que hay; luego las animadas que quedan pasan al final
const [m] = await sql`select coalesce(max(orden), 0)::int n from seo.ig_cola where tipo = 'historia'`;
let orden = m.n;
for (const [id, datos] of BANCO) {
  orden++;
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, estado, datos, historia_url, orden)
    values (${id}, 'historia', ${datos.titulo}, '', 'pendiente', ${sql.json(datos)}, ${BASE + id}, ${orden})
    on conflict (id) do update set datos = excluded.datos, estado = 'pendiente', orden = excluded.orden, historia_url = excluded.historia_url`;
}
const ids = BANCO.map(([id]) => id);
for (const v of await sql`select id from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null and not (id = any(${ids})) order by orden`) {
  orden++;
  await sql`update seo.ig_cola set orden = ${orden} where id = ${v.id}`;
}
for (const x of await sql`select id, orden, datos->>'plantilla' p, video_url is not null video from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null order by orden`)
  console.log(x.orden, x.id, x.p, x.video ? '(vídeo)' : '');
await sql.end();
