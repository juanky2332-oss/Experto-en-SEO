// 18-11-2026 · Ejemplos del estilo 3 de las historias (él: «más estético, más moderno, profesional, del tono de Tuerqui;
// mensajes directos que ayuden en el día a día»). Tarjeta «antes / ahora» o con pasos y Tuerqui hablando en un bocadillo.
// Se guardan como 'descartado' y sin orden: NO entran en la cola de publicación hasta que él dé el visto bueno.
// Uso: node --env-file=.env.local n8n/ig-historias-estilo3-ejemplos.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const BASE = 'https://experto-en-seo.vercel.app/api/ig/historia?id=';
const CTA = 'Diagnóstico gratis · enlace en el perfil';
const EJ = [
  ['ej3-facturas', { v: 3, plantilla: 'problema', tuerqui: 'celebra', etiqueta: '¿Te pasa?', titulo: '¿Metes las facturas a mano?', acento: 'a mano',
    antes: 'Una a una, copiando datos al ordenador', ahora: 'Una foto con el móvil y se apuntan solas', dice: 'Tú haz la foto y sigue con tu café. Del resto me encargo yo.', cierre: CTA }],
  ['ej3-facturas-oscuro', { v: 3, tema: 'oscuro', plantilla: 'problema', tuerqui: 'celebra', etiqueta: '¿Te pasa?', titulo: '¿Metes las facturas a mano?', acento: 'a mano',
    antes: 'Una a una, copiando datos al ordenador', ahora: 'Una foto con el móvil y se apuntan solas', dice: 'Tú haz la foto y sigue con tu café. Del resto me encargo yo.', cierre: CTA }],
  ['ej3-presupuestos', { v: 3, plantilla: 'problema', tuerqui: 'senala', etiqueta: '¿Te suena?', titulo: '¿Tu presupuesto llega tarde?', acento: 'tarde',
    antes: 'El cliente espera días y se va con otro', ahora: 'Lo mandas el mismo día, desde el plano', dice: 'Pásame el plano y el presupuesto sale hoy. ¡Que no se te escape el cliente!', cierre: CTA }],
  ['ej3-partes', { v: 3, plantilla: 'problema', tuerqui: 'agobiado', etiqueta: '¿Te pasa?', titulo: '¿Los partes llegan en papel arrugado?', acento: 'papel arrugado',
    antes: 'Llegan días después y no hay quien los lea', ahora: 'Se firman en el móvil y pasan a la factura', dice: 'Ni uno más perdido en la furgoneta. Palabra de Tuerqui.', cierre: CTA }],
  ['ej3-truco-cobros', { v: 3, plantilla: 'truco', etiqueta: 'Truco para el lunes', titulo: 'Cobra antes de que se te olvide', acento: 'antes',
    puntos: ['Cada lunes, mira qué facturas vencen', 'Avisa 3 días antes, no después'], dice: 'Cinco minutos el lunes y el resto de la semana, tranquilo.' }],
  ['ej3-truco-whatsapp', { v: 3, plantilla: 'truco', etiqueta: 'Truco del día', titulo: 'Deja de contestar siempre lo mismo', acento: 'lo mismo',
    puntos: ['Apunta las 5 preguntas que más te hacen', 'Guárdalas como respuestas rápidas en WhatsApp Business'], dice: 'Y si quieres, contesto yo por ti… ¡aunque estés durmiendo!' }],
  ['ej3-ia-actas', { v: 3, plantilla: 'ia', tuerqui: 'malabares', etiqueta: 'IA que ya puedes usar', titulo: 'El acta de la reunión, sin escribir', acento: 'sin escribir',
    puntos: ['Graba la reunión con el móvil', 'Pide a la IA el resumen y quién hace qué'], dice: 'Tú céntrate en la reunión, que la IA toma nota de todo.' }],
  ['ej3-noticia-luz', { v: 3, plantilla: 'noticia', etiqueta: 'Noticia · Región de Murcia', titulo: 'Ayudas para que tu nave gaste menos luz', acento: 'menos luz',
    fuente: 'Europa Press Murcia · 13 nov', puntos: ['Junta las facturas de luz de un año', 'Atento al BORM: ahí salen las bases'], dice: '¿Las facturas en una caja de zapatos? Te las ordeno yo.' }],
  ['ej3-blog', { v: 3, plantilla: 'blog', tema: 'claro', etiqueta: 'Nuevo en el blog', titulo: 'Albaranes sin papel, paso a paso', acento: 'sin papel',
    puntos: ['Qué cambia el primer día', 'Por dónde empezar sin líos'], dice: 'Se lee en menos de lo que tarda en salir el café.' }],
];
for (const [id, datos] of EJ) {
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, estado, datos, historia_url, orden)
    values (${id}, 'historia', ${datos.titulo}, '', 'descartado', ${sql.json(datos)}, ${BASE + id}, null)
    on conflict (id) do update set datos = excluded.datos, estado = 'descartado', orden = null`;
}
console.log('ejemplos:', EJ.map(([id]) => id).join(', '));
await sql.end();
