// Lista del móvil del 27 al 30-10-2026: cuentas a seguir y comentarios escritos para una publicación concreta de cada una
// (publicaciones leídas el 26-10-2026). Se omiten perfiles inactivos, personales o de fuera de la Región, y noticias de sucesos o política.
//   node n8n/ig-movil-semana1.mjs
import postgres from 'postgres';
import './lib.mjs';

const IG = 'https://www.instagram.com';
const DIAS = {
  '2026-10-27': {
    seguir: ['amusalmurcia', 'ucomur_cooperativas', 'fecoam_', 'icamur_oficial', 'upctoficial', 'ucam_universidad', 'grupo_cajamar', 'murciaplaza_com', 'elnuevodigitalmurcia'],
    comentar: [
      ['elnuevodigitalmurcia', '/p/De08gCQthWf/', 'El metal de la Región tiene mucho más recorrido del que se cuenta. Gran tema 👏'],
      ['ucomur_cooperativas', '/reel/De9LhC6xaCe/', 'Muy buena iniciativa. ¿Qué uso de la IA os pareció el más útil para las cooperativas?'],
      ['amusalmurcia', '/p/DewP3x0CPaW/', 'Enhorabuena a todos los proyectos premiados. ¡A por la siguiente etapa!'],
      ['fecoam_', '/p/Deyhn2HoFPv/', 'SEPOR, cita obligada cada año. ¡Mucho éxito a las cooperativas!'],
      ['grupo_cajamar', '/reel/DejgNsACDQp/', 'Muy interesante, sobre todo para las pymes que ya están planificando el año que viene.'],
      ['upctoficial', '/reel/De1hkLhtcZh/', '¡Qué ambiente! Así se engancha a la gente a la ciencia 🔬'],
      ['icamur_oficial', '/p/De3u6VmCO_M/', 'Gran nivel en las ponencias, enhorabuena a la organización.'],
      ['ucam_universidad', '/p/De3tSKzjSnl/', '¡Enhorabuena a todos! Lo mejor está por venir 🎓'],
    ],
  },
  '2026-10-28': {
    seguir: ['laopiniondemurcia', 'diario.laverdad', 'ayuntamientodemurcia', 'aytocartagenaes', 'aytomolina', 'elpozoalimentacion', 'hefame_es', 'saxun_solar', 'arq.mod.internacional', 'n7netcom'],
    comentar: [
      ['saxun_solar', '/p/Det-sIHiOOt/', 'Qué fachada más espectacular. Diseño de Murcia en Costa Rica 👌'],
      ['arq.mod.internacional', '/p/DetzUccChNl/', 'Impresiona verla ya terminada en la parcela. ¿Cuánto tiempo pasa desde la nave hasta la entrega?'],
      ['aytomolina', '/p/De8-W3fJuGF/', 'Muy buena iniciativa. Saber debatir sirve para todo en la vida.'],
      ['hefame_es', '/p/Debquv2AmZs/', 'Bonito compromiso, cada paso suma 🌱'],
      ['n7netcom', '/p/DerIEuHCorC/', '¡Enhorabuena por la nueva imagen! La web ha quedado muy limpia.'],
    ],
  },
  '2026-10-29': {
    seguir: ['mecanizadosjjceldran', 'inoxpaser', 'metalcon.ind', 'pritecgrupo', 'cercadosonline', 'aluminiosros', 'glass__stock', 'siasuministros'],
    comentar: [
      ['mecanizadosjjceldran', '/reel/DetI6BzoKWy/', 'Diseñar, fabricar y verificar en casa… así da gusto. ¡Qué nivel! 👏'],
      ['inoxpaser', '/reel/DbvQ_XXhNn5/', 'Brutal la planta. ¿Cuánto tiempo lleva un proyecto así del plano a la puesta en marcha?'],
      ['metalcon.ind', '/reel/DeyShGehNgo/', 'Muy bien explicado. Ojalá más talleres contaran así por qué un trabajo vale lo que vale.'],
      ['pritecgrupo', '/p/DdioY1LDe1q/', '45 años ya, ¡enhorabuena por la trayectoria!'],
      ['cercadosonline', '/reel/Da4sIfAE4RW/', 'Qué bien se ve el día a día del taller, de la llamada a la carga 👌'],
    ],
  },
  '2026-10-30': {
    seguir: ['gruporenauto', 'tapiceriasnavarro', 'carpell_hnos_cb', 'salazonesgarre', 'scentiumflavours', 'laboratorios_prady', 'crcampocartagena', 'gestoriacarvajal', 'sermomur', 'ferreteriafercasasl'],
    comentar: [
      ['salazonesgarre', '/p/De8-qhrtsWX/', '¡Enhorabuena por la certificación! Gran noticia para los celíacos.'],
      ['tapiceriasnavarro', '/p/De80cSmjICD/', 'Hecho a medida y en Yecla, eso se nota en el resultado.'],
      ['crcampocartagena', '/reel/Dey7xfLstzc/', 'Que vengan desde Polonia a aprender cómo se gestiona el agua aquí dice mucho del Campo de Cartagena.'],
      ['laboratorios_prady', '/reel/Dd8cLGZHYiE/', '¡Mucha suerte en PRIVEL! Seguro que es una gran feria para vosotros.'],
      ['scentiumflavours', '/p/Det4-hoDuDt/', '¡Suerte en SIAL París! Orgullo de Alhama.'],
      ['gruporenauto', '/p/De17-aRDJJ3/', 'Una segunda vida para las piezas: bueno para el bolsillo y para el planeta ♻️'],
    ],
  },
};

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
for (const [fecha, d] of Object.entries(DIAS)) {
  await sql`delete from seo.ig_movil where fecha = ${fecha} and not hecho`;
  let i = 0;
  // nunca se vuelve a meter lo que ya está hecho (seguida o comentada antes, por el PC, el móvil o a mano)
  const ya = async (tipo, c) => (await sql`select 1 from seo.ig_acciones where tipo = ${tipo} and cuenta = ${c}
    union select 1 from seo.ig_movil where tipo = ${tipo} and cuenta = ${c} and hecho`).length > 0;
  for (const c of d.seguir) if (!(await ya('seguir', c))) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url) values (${fecha}, ${i++}, 'seguir', ${c}, ${`${IG}/${c}/`})`;
  for (const [c, u, t] of d.comentar) if (!(await ya('comentar', c))) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url, texto) values (${fecha}, ${i++}, 'comentar', ${c}, ${IG + u}, ${t})`;
  console.log(fecha, d.seguir.length, 'seguir ·', d.comentar.length, 'comentar');
}
await sql.end();
