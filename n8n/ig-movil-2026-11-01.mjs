// Lista del 1-11-2026 (adelanto de la del 2-11): empresas de la Región encontradas en Instagram buscando «mecanizados murcia» y
// «metalisteria murcia», con la ubicación comprobada en su perfil o su web. Fuera las de otras provincias, las inactivas y las noticias de la huelga del metal.
//   node n8n/ig-movil-2026-11-01.mjs
import postgres from 'postgres';
import './lib.mjs';

const IG = 'https://www.instagram.com';
const FECHA = '2026-11-01';
const SEGUIR = ['fremm.regionmurcia', 'bobinadoscaravaca', 'tecnodieselmurcia', 'jacemapvc', 'matisscreaccion', 'dromcarpinteriametalica', 'jpllamasmecanizados'];
const COMENTAR = [
  ['bobinadoscaravaca', '/p/Der2geGDsiH/', 'Reparar antes que cambiar el motor entero: mejor para el bolsillo y para no parar la producción 👌'],
  ['fremm.regionmurcia', '/p/DfHmPA0vu02/', 'Muy útil para los talleres. ¿Habrá más fechas para quien no pueda ir a esta?'],
  ['tecnodieselmurcia', '/p/DfCD7rakYJJ/', '¡Enhorabuena por los sellos! A por el de Compenso 🌱'],
  ['jacemapvc', '/p/DfHOEITDP9w/', 'Se nota el buen ambiente en FECONS. Un escaparate perfecto para enseñar lo que hacéis.'],
  ['matisscreaccion', '/p/DejbplCmzJq/', '¡No sabía que el Corazón de Corazones era vuestro! Medio Murcia tiene una foto con alguna de vuestras piezas.'],
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
