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
      ['elnuevodigitalmurcia', '/p/De08gCQthWf/', 'El reto del metal en la Región quizá no sea tanto la demanda como el relevo: quien consiga que la experiencia de sus oficiales quede escrita en procesos tendrá ventaja durante décadas.'],
      ['ucomur_cooperativas', '/reel/De9LhC6xaCe/', 'Las cooperativas parten con una ventaja poco comentada ante la IA: deciden en común, y eso obliga a definir bien el problema antes de elegir la herramienta, que es justo donde fallan la mayoría de proyectos.'],
      ['amusalmurcia', '/p/DewP3x0CPaW/', 'Lo valioso de estos premios no es solo el reconocimiento: obligan a convertir una idea en números, y ese ejercicio separa a muchos proyectos que salen adelante de los que se quedan por el camino. Felicidades a los premiados.'],
      ['fecoam_', '/p/Deyhn2HoFPv/', 'SEPOR demuestra cada año que en la Región ganadería, industria y agroalimentación son una misma cadena. Cuanto mejor se entienden los eslabones, más valor se queda aquí.'],
      ['grupo_cajamar', '/reel/DejgNsACDQp/', 'En entornos de incertidumbre, la ventaja no suele estar en acertar la previsión, sino en poder reaccionar rápido. Y eso depende más de tener los datos propios al día que de la coyuntura.'],
      ['upctoficial', '/reel/De1hkLhtcZh/', 'Muchas vocaciones técnicas no nacen en un aula, sino en una tarde como esta delante de un experimento. Pocas inversiones de una universidad tienen tanto retorno a largo plazo.'],
      ['icamur_oficial', '/p/De3u6VmCO_M/', 'La abogacía joven va a vivir con la IA el mayor cambio de la profesión en décadas. Que tenga foros propios para debatirlo, y no solo para seguirlo, es muy buena señal.'],
      ['ucam_universidad', '/p/De3tSKzjSnl/', 'Curioso cómo el primer curso siempre parece el más difícil y, visto con perspectiva, es el que más enseña. Enhorabuena a quienes cierran esta etapa.'],
    ],
  },
  '2026-10-28': {
    seguir: ['laopiniondemurcia', 'diario.laverdad', 'ayuntamientodemurcia', 'aytocartagenaes', 'aytomolina', 'elpozoalimentacion', 'hefame_es', 'saxun_solar', 'arq.mod.internacional', 'n7netcom'],
    comentar: [
      ['saxun_solar', '/p/Det-sIHiOOt/', 'Integrar la protección solar desde el diseño, y no como añadido, es de esas decisiones que no se ven en la foto pero sí en el consumo de climatización durante décadas.'],
      ['arq.mod.internacional', '/p/DetzUccChNl/', 'Lo interesante de fabricar en nave no es solo la rapidez: cada vivienda deja datos de tiempos y materiales que permiten afinar la siguiente, algo casi imposible en la obra tradicional.'],
      ['aytomolina', '/p/De8-W3fJuGF/', 'Debatir obliga a defender posturas que a veces no son las propias. Pocas escuelas preparan mejor para entender en el futuro a un cliente, a un socio o a un competidor.'],
      ['hefame_es', '/p/Debquv2AmZs/', 'En distribución, sostenibilidad y eficiencia suelen ser la misma conversación: cada kilómetro y cada hueco de almacén que se ahorra cuenta dos veces.'],
      ['n7netcom', '/p/DerIEuHCorC/', 'Una web con menos ruido es bastante más difícil de hacer que una con mucho. Buen criterio en el rediseño.'],
    ],
  },
  '2026-10-29': {
    seguir: ['mecanizadosjjceldran', 'inoxpaser', 'metalcon.ind', 'pritecgrupo', 'cercadosonline', 'aluminiosros', 'glass__stock', 'siasuministros'],
    comentar: [
      ['mecanizadosjjceldran', '/reel/DetI6BzoKWy/', 'Verificar en casa lo que se diseña y se fabrica cierra el círculo: el cliente no compra solo una pieza, compra la certeza de que va a encajar. Esa confianza es muy difícil de copiar.'],
      ['inoxpaser', '/reel/DbvQ_XXhNn5/', 'Los proyectos llave en mano tienen un mérito poco visible: coordinar diseño, fabricación y puesta en marcha sin que el cliente note las costuras. Gran trabajo.'],
      ['metalcon.ind', '/reel/DeyShGehNgo/', 'Explicar por qué algo cuesta lo que cuesta es probablemente la mejor herramienta comercial de un taller: el cliente que entiende el precio deja de compararlo solo con el más barato.'],
      ['pritecgrupo', '/p/DdioY1LDe1q/', '45 años en eficiencia energética significan haber atravesado varias revoluciones tecnológicas del sector y seguir aquí. Eso dice mucho de la capacidad de adaptación del equipo.'],
      ['cercadosonline', '/reel/Da4sIfAE4RW/', 'Lo que se ve en el vídeo es la parte bonita; lo difícil es que esa cadena funcione igual un lunes con diez pedidos que un viernes con uno urgente. Se nota el oficio.'],
    ],
  },
  '2026-10-30': {
    seguir: ['gruporenauto', 'tapiceriasnavarro', 'carpell_hnos_cb', 'salazonesgarre', 'scentiumflavours', 'laboratorios_prady', 'crcampocartagena', 'gestoriacarvajal', 'sermomur', 'ferreteriafercasasl'],
    comentar: [
      ['salazonesgarre', '/p/De8-qhrtsWX/', 'Una certificación así convierte un producto de tradición en una opción segura para quien antes ni se lo planteaba. Una forma inteligente de ampliar mercado sin tocar la receta.'],
      ['tapiceriasnavarro', '/p/De80cSmjICD/', 'Fabricar bajo pedido parece más lento, pero evita el mayor coste oculto del mueble: el stock que nadie compra. Yecla lleva décadas demostrándolo.'],
      ['crcampocartagena', '/reel/Dey7xfLstzc/', 'Que el Campo de Cartagena sea ya un lugar al que se viene a aprender, y no solo a producir, es probablemente uno de sus activos menos conocidos.'],
      ['laboratorios_prady', '/reel/Dd8cLGZHYiE/', 'En marca privada, el fabricante que consigue que su cliente venda mejor acaba siendo imprescindible. Mucha suerte en PRIVEL.'],
      ['scentiumflavours', '/p/Det4-hoDuDt/', 'Que un aroma desarrollado en Alhama acabe en productos que se venden en medio mundo es de esas historias industriales que merecerían contarse más. Suerte en SIAL.'],
      ['gruporenauto', '/p/De17-aRDJJ3/', 'La pieza recuperada tiene un valor que pocas veces se cuenta: está disponible hoy cuando la nueva tarda semanas. Para un taller, eso es tiempo de su cliente.'],
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
