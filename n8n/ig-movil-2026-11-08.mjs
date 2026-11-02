// Listas del 8-11 y 14-11-2026 (comprobadas en la cabecera del perfil): Láser Molina (La Serreta), Círculo de Economía de la Región,
// Segura e Hijos (Molina), Servigran (Campollano, Albacete), InfoMolina, Tranvía de Murcia, IES Sanje (Alcantarilla), Grupo ATU, Murcia Mola.
//   node n8n/ig-movil-2026-11-08.mjs
import postgres from 'postgres';
import './lib.mjs';

const IG = 'https://www.instagram.com';
const LISTAS = {
  '2026-11-08': {
    seguir: ['laser_molina', 'circuloeconomiamurcia', 'seguraehijos', 'servigran_mecanizados', 'infomolina.es'],
    comentar: [
      ['laser_molina', '/p/DdGbrQdoHLb/', 'Hasta 12 mm de espesor ya es capacidad seria 💪 ¿Qué piezas os piden más para curvar?'],
      ['circuloeconomiamurcia', '/p/DfCsVRFtxDM/', 'Hace falta hablar más de la industria de la Región. ¿Quedará grabada la sesión para quien no pudo ir?'],
      ['servigran_mecanizados', '/p/De6jmPHiJTa/', 'La ingeniería inversa salva muchas máquinas que si no acabarían paradas. ¿Os basta con la pieza rota o necesitáis una entera de muestra?'],
    ],
  },
  '2026-11-14': {
    seguir: ['tranviademurcia_', 'ies_sanje', 'grupoatumurcia', 'murciamola_oficial'],
    comentar: [
      ['seguraehijos', '/p/DfPQ3jgghkP/', 'Buen sitio para tomarle el pulso al sector. ¿Qué tendencia os ha llamado más la atención?'],
      ['tranviademurcia_', '/p/DfPvU7ulP9u/', 'Curioso ver lo que no se ve del mantenimiento. ¿Cada cuánto se revisan las soldaduras de la vía?'],
    ],
  },
};

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
const ya = async (tipo, c, u) => (await sql`select 1 from seo.ig_acciones where tipo = ${tipo} and (cuenta = ${c} and (${tipo} = 'seguir' or url = ${u}))
  union select 1 from seo.ig_movil where tipo = ${tipo} and cuenta = ${c} and (${tipo} = 'seguir' or url = ${u})`).length > 0;
for (const [fecha, l] of Object.entries(LISTAS)) {
  await sql`delete from seo.ig_movil where fecha = ${fecha} and not hecho`;
  let i = 0;
  for (const c of l.seguir) if (!(await ya('seguir', c, null))) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url) values (${fecha}, ${i++}, 'seguir', ${c}, ${`${IG}/${c}/`})`;
  for (const [c, u, t] of l.comentar) if (!(await ya('comentar', c, IG + u))) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url, texto) values (${fecha}, ${i++}, 'comentar', ${c}, ${IG + u}, ${t})`;
  for (const r of await sql`select tipo, cuenta from seo.ig_movil where fecha = ${fecha} order by orden`) console.log(fecha, r.tipo, r.cuenta);
}
await sql.end();
