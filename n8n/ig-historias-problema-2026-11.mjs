// Banco de historias nuevo (17-11-2026, él): fuera los consejos sueltos; dentro «el problema → qué hacer → cómo lo
// resolvemos» y noticias del mercado con qué hacer. POCO TEXTO: una historia de imagen dura 5 s (título corto, 2 pasos,
// cierre corto). La marca solo en el logo. Sin precios. Uso: node --env-file=.env.local n8n/ig-historias-problema-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const BASE = 'https://experto-en-seo.vercel.app/api/ig/historia?id=';
const P = (titulo, a, b, cierre) => ({ plantilla: 'problema', etiqueta: 'El problema', titulo, texto: 'Qué hacer', puntos: [a, b], cierre });
const BANCO = [
  ['hp-facturas', P('La factura no cuadra con lo que llegó', 'Crúzala con albarán y pedido', 'Paga solo lo que cuadra', '✅ IndunexIA Documentos lo cruza solo')],
  ['hp-presupuestos', P('Tardas días en dar un presupuesto', 'Ten el coste hora al día', 'Parte del plano, no de cero', '✅ IndunexIA Presupuestos: del plano al PDF')],
  ['hp-cobros', P('No sabes quién te debe dinero', 'Revisa lo vencido cada lunes', 'Avisa antes de que venza', '✅ IndunexIA Gestión te avisa solo')],
  ['hn-ayudas-energia', { plantilla: 'noticia', etiqueta: 'Noticia · Región de Murcia', titulo: 'Ayudas para que la industria gaste menos luz', fuente: 'Europa Press Murcia · 13 nov', texto: 'Qué hacer ya', puntos: ['Junta tus facturas de luz', 'Atento a las bases en el BORM'], cierre: '💡 ¿Facturas en papel? Te las ordenamos' }],
  ['hp-partes', P('Los partes llegan tarde y en papel', 'Que se firmen en el móvil', 'Que pasen solos a la factura', '✅ IndunexIA Gestión, en el momento')],
  ['hp-preguntas', P('Tus clientes preguntan siempre lo mismo', 'Pon las respuestas en tu web', 'Que conteste un asistente 24/7', '✅ Como Tuerqui: te lo montamos')],
  ['hp-margen', P('No sabes cuánto ganas en cada trabajo', 'Apunta horas y material', 'Compáralo con el presupuesto', '✅ IndunexIA Gestión lo calcula solo')],
];
// los consejos sueltos que quedaban en el banco, fuera
const fuera = await sql`update seo.ig_cola set estado = 'descartado' where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null
  and coalesce(datos->>'plantilla', '') in ('consejo', 'dato', 'mito', 'pregunta', 'respuesta') returning id`;
console.log('retiradas:', fuera.map((x) => x.id).join(', '));
const [m] = await sql`select coalesce(max(orden), 0)::int n from seo.ig_cola where tipo = 'historia'`;
let orden = m.n;
for (const [id, datos] of BANCO) {
  orden++;
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, estado, datos, historia_url, orden)
    values (${id}, 'historia', ${datos.titulo}, '', 'pendiente', ${sql.json(datos)}, ${BASE + id}, ${orden})
    on conflict (id) do update set datos = excluded.datos, estado = 'pendiente', orden = excluded.orden`;
}
console.log(await sql`select id, orden, datos->>'plantilla' p from seo.ig_cola where tipo = 'historia' and estado = 'pendiente' and orden is not null order by orden`);
await sql.end();
