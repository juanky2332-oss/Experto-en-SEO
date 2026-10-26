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
      ['elnuevodigitalmurcia', '/p/De08gCQthWf/', 'Totalmente de acuerdo. Más de 8.000 empresas y 35.000 empleos: el metal es uno de los grandes motores de la Región y tiene mucho recorrido si sigue modernizándose.'],
      ['ucomur_cooperativas', '/reel/De9LhC6xaCe/', 'Muy buena jornada. Lo que mejor funciona al empezar con la IA es aplicarla a una tarea concreta del día a día, como resumir documentos o preparar presupuestos, y crecer desde ahí.'],
      ['amusalmurcia', '/p/DewP3x0CPaW/', 'Enhorabuena a los proyectos premiados. Acompañar a quien emprende en Murcia desde el principio marca mucho la diferencia 👏'],
      ['fecoam_', '/p/Deyhn2HoFPv/', 'SEPOR siempre es un gran escaparate para el sector agroalimentario de la Región. ¡Mucha suerte a todas las cooperativas que participan!'],
      ['grupo_cajamar', '/reel/DejgNsACDQp/', 'Muy útil este análisis. Con tanta incertidumbre, tener los números de la empresa al día es lo que permite reaccionar a tiempo.'],
      ['upctoficial', '/reel/De1hkLhtcZh/', '220 estudiantes y 58 talleres, qué despliegue. Así es como se despiertan las vocaciones técnicas.'],
      ['icamur_oficial', '/p/De3u6VmCO_M/', 'Qué bien ver tanta participación de la abogacía joven. Este tipo de congresos hacen mucha falta.'],
      ['ucam_universidad', '/p/De3tSKzjSnl/', '¡Enhorabuena a todos los que habéis llegado hasta aquí! El esfuerzo de estos años merece mucho la pena.'],
    ],
  },
  '2026-10-28': {
    seguir: ['laopiniondemurcia', 'diario.laverdad', 'ayuntamientodemurcia', 'aytocartagenaes', 'aytomolina', 'elpozoalimentacion', 'hefame_es', 'saxun_solar', 'arq.mod.internacional', 'n7netcom'],
    comentar: [
      ['saxun_solar', '/p/Det-sIHiOOt/', 'Qué proyecto. Celosías diseñadas en Murcia protegiendo una fachada en Costa Rica: así se exporta la industria de aquí.'],
      ['arq.mod.internacional', '/p/DetzUccChNl/', 'Fabricar en Librilla y entregar la vivienda terminada en la parcela. La construcción industrializada tiene mucho futuro en la Región.'],
      ['aytomolina', '/p/De8-W3fJuGF/', 'Gran iniciativa. Saber defender una idea en público es de lo más útil que se puede aprender, también para la vida profesional.'],
      ['hefame_es', '/p/Debquv2AmZs/', 'Bonito compromiso. En distribución, cada mejora en rutas y almacén se nota tanto en el planeta como en las cuentas.'],
      ['n7netcom', '/p/DerIEuHCorC/', '¡Enhorabuena por la nueva marca y la nueva web! Clara y directa, como decís, se agradece.'],
    ],
  },
  '2026-10-29': {
    seguir: ['mecanizadosjjceldran', 'inoxpaser', 'metalcon.ind', 'pritecgrupo', 'cercadosonline', 'aluminiosros', 'glass__stock', 'siasuministros'],
    comentar: [
      ['mecanizadosjjceldran', '/reel/DetI6BzoKWy/', 'Diseñar, fabricar y verificar en casa es lo que da tranquilidad al cliente. Se nota que os gusta lo que hacéis 👏'],
      ['inoxpaser', '/reel/DbvQ_XXhNn5/', 'Una planta de agua marina llave en mano desde Molina, ¡enhorabuena al equipo! Ver el recorrido del plano a la puesta en marcha es lo mejor.'],
      ['metalcon.ind', '/reel/DeyShGehNgo/', 'Muy buena explicación. Pasa igual con cualquier trabajo a medida: material, horas de taller y acabados. Cuando se explica así, el cliente entiende el precio.'],
      ['pritecgrupo', '/p/DdioY1LDe1q/', '45 años en eficiencia energética desde Murcia, eso es mucha experiencia. ¡Enhorabuena!'],
      ['cercadosonline', '/reel/Da4sIfAE4RW/', 'Una llamada y todo en marcha: corte, soldadura y carga. Qué bien se ve el día a día del taller.'],
    ],
  },
  '2026-10-30': {
    seguir: ['gruporenauto', 'tapiceriasnavarro', 'carpell_hnos_cb', 'salazonesgarre', 'scentiumflavours', 'laboratorios_prady', 'crcampocartagena', 'gestoriacarvajal', 'sermomur', 'ferreteriafercasasl'],
    comentar: [
      ['salazonesgarre', '/p/De8-qhrtsWX/', '¡Enhorabuena por la certificación! Que las salsas Garum sean aptas para celíacos abre la puerta a mucha más gente.'],
      ['tapiceriasnavarro', '/p/De80cSmjICD/', 'Fabricar en España, uno a uno y a medida de cada cliente. Así se mantiene viva la industria del mueble de Yecla.'],
      ['crcampocartagena', '/reel/Dey7xfLstzc/', 'Que vengan técnicos de Polonia y de Chile a aprender del Campo de Cartagena dice mucho de cómo se gestiona aquí el agua.'],
      ['laboratorios_prady', '/reel/Dd8cLGZHYiE/', '¡Suerte en PRIVEL! Las ferias de marca privada son una gran oportunidad para que conozcan a fabricantes de aquí como vosotros.'],
      ['scentiumflavours', '/p/Det4-hoDuDt/', '¡Mucha suerte en SIAL París! Da gusto ver a una empresa de Alhama en las grandes ferias del sector.'],
      ['gruporenauto', '/p/De17-aRDJJ3/', 'Darles una segunda vida a las piezas es bueno para el bolsillo del cliente y para el medio ambiente. ¡Buen trabajo!'],
    ],
  },
};

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
for (const [fecha, d] of Object.entries(DIAS)) {
  await sql`delete from seo.ig_movil where fecha = ${fecha} and not hecho`;
  let i = 0;
  for (const c of d.seguir) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url) values (${fecha}, ${i++}, 'seguir', ${c}, ${`${IG}/${c}/`})`;
  for (const [c, u, t] of d.comentar) await sql`insert into seo.ig_movil (fecha, orden, tipo, cuenta, url, texto) values (${fecha}, ${i++}, 'comentar', ${c}, ${IG + u}, ${t})`;
  console.log(fecha, d.seguir.length, 'seguir ·', d.comentar.length, 'comentar');
}
await sql.end();
