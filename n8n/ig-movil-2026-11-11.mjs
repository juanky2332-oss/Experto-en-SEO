// Lista del 11-11-2026: Ginés Pérez Mayor (martillos hidráulicos, San Ginés), Limcamar (El Puntal), Prointer (Murcia), Talleres Pemar (Lorca)
// y la prensa de Mazarrón. Ubicación comprobada en el perfil o en su web; las de Granada, Valencia, Almería y Castellón, fuera.
//   node n8n/ig-movil-2026-11-11.mjs
import postgres from 'postgres';
import './lib.mjs';

const IG = 'https://www.instagram.com';
const FECHA = '2026-11-11';
const SEGUIR = ['ginesperezmayor', 'limcamar', 'prointer_murcia', 'talleres_pemar', 'mazarron_hoy'];
const COMENTAR = [
  ['ginesperezmayor', '/reel/Ddi0PyIzYJo/', 'Fabricación propia y desde Murcia, así da gusto 💪 ¿Cuánto tarda en salir un GPM110 desde que entra el pedido?'],
  ['limcamar', '/p/DfO7bnajPMS/', 'Muy buena idea ir a las ferias de empleo. ¿Buscáis gente para toda la Región o también fuera?'],
];

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
await sql`delete from seo.ig_movil where fecha = ${FECHA} and not hecho`;
const ya = async (tipo, c) => (await sql`select 1 from seo.ig_acciones where tipo = ${tipo} and cuenta = ${c}
  union select 1 from seo.ig_movil where tipo = ${tipo} and cuenta = ${c} and hecho`).length > 0;
let i = 0;
for (const c of SEGUIR) if (!(await ya('seguir', c))) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url) values (${FECHA}, ${i++}, 'seguir', ${c}, ${`${IG}/${c}/`})`;
for (const [c, u, t] of COMENTAR) if (!(await ya('comentar', c))) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url, texto) values (${FECHA}, ${i++}, 'comentar', ${c}, ${IG + u}, ${t})`;
for (const r of await sql`select id, tipo, cuenta, url from seo.ig_movil where fecha = ${FECHA} order by orden`) console.log(r.id, r.tipo, r.cuenta, r.url);
await sql.end();
