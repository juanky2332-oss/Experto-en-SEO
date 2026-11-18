// 18-11-2026 · Ejemplos del estilo 2 de las historias (centradas, con aire, Tuerqui abajo) y de la nueva «Lo último»
// para que Juan Carlos dé el visto bueno. Se guardan como 'descartado' y sin orden: NO entran en la cola de publicación.
// Uso: node --env-file=.env.local n8n/ig-historias-estilo2-ejemplos.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const BASE = 'https://experto-en-seo.vercel.app/api/ig/historia?id=';
const ITEMS = [
  { cat: 'IA', titular: 'Los bancos frenan a asistentes de IA que entran en cuentas', significa: 'Los agentes ya actúan solos: decide qué pueden tocar' },
  { cat: 'Industria', titular: 'Claude llega a la fábrica: se conecta a Fusion y NetSuite', significa: 'La IA entra en diseño, compras y producción' },
  { cat: 'Automatización', titular: 'Visual Trans pone «empleados» de IA en aduanas', significa: 'El papeleo repetitivo es lo primero que se automatiza' },
];
const EJ = [
  ['ej2-problema', { v: 2, plantilla: 'problema', etiqueta: '¿Te suena?', titulo: 'Tecleas cada factura a mano', acento: 'a mano', puntos: ['Le haces una foto', 'Se apunta sola en tu gestión'], cierre: 'Diagnóstico gratis · enlace en el perfil' }],
  ['ej2-noticia', { v: 2, plantilla: 'noticia', etiqueta: 'Noticia · Región de Murcia', titulo: '19 millones para que tu nave gaste menos luz', acento: '19 millones', fuente: 'Europa Press Murcia · 13 nov', puntos: ['Junta tus facturas de luz', 'Vigila las bases en el BORM'], cierre: '¿Te echamos una mano? Escríbenos' }],
  ['ej2-blog', { v: 2, plantilla: 'blog', etiqueta: 'Nuevo en el blog', titulo: 'Albaranes en papel: se acabó', acento: 'se acabó', puntos: ['Qué cambia el primer día', 'Cuánto tiempo te ahorras'], cierre: 'Léelo en 3 min · toca el enlace ↑' }],
  ['ej2-actualidad', { v: 2, plantilla: 'actualidad', fecha: 'esta semana', titulo: 'Lo que se mueve en IA', acento: 'IA', items: ITEMS }],
  ['ej2-actualidad-claro', { v: 2, plantilla: 'actualidad', tema: 'claro', fecha: 'esta semana', titulo: 'Lo que se mueve en IA', acento: 'IA', items: ITEMS }],
];
for (const [id, datos] of EJ) {
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, estado, datos, historia_url, orden)
    values (${id}, 'historia', ${datos.titulo}, '', 'descartado', ${sql.json(datos)}, ${BASE + id}, null)
    on conflict (id) do update set datos = excluded.datos, estado = 'descartado', orden = null`;
}
console.log('ejemplos:', EJ.map(([id]) => id).join(', '));
await sql.end();
