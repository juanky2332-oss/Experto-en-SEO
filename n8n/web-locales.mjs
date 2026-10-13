// Páginas locales de transformaconia.com (Cartagena, Molina de Segura, Lorca, Alcantarilla, Elche, Albacete).
// Uso: node n8n/web-locales.mjs [slug-corto ...]   (sin argumentos: crea/actualiza como BORRADOR las que no existan; en las ya publicadas solo cambia el bloque de enlaces entre ciudades y el foco de Rank Math)
// Murcia ya existe como /consultor-ia-murcia/ (no se duplica; se enlaza). No toca web-paginas.mjs ni el snippet.
// Casos de ejemplo SIEMPRE ficticios y marcados. Precios orientativos. Sin nombrar herramientas internas.
import fs from 'node:fs';
import { wp } from './gw.mjs';
const BK = '_backups/web-2026-10-13-t1/locales/';

const H = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const btn = (href, txt, ghost = false) => `<a class="tc-btn${ghost ? ' tc-btn--ghost' : ''}" href="${href}">${txt} ${ARROW}</a>`;
const eyebrow = (t) => `<span class="tc-eyebrow">${t}</span>`;
const head = (eb, h2, p = '') => `<div class="tc-head tc-reveal"><div>${eyebrow(eb)}<h2>${h2}</h2>${p ? `<p>${p}</p>` : ''}</div></div>`;
const sec = (inner, cls = '') => `<section class="tc-sec ${cls}"><div class="tc-wrap">${inner}</div></section>`;
const list = (items) => `<ul class="tc-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const page = (body) => `<!--tc--><div class="tc tc-ind">${body}</div>`;
const facts = (titulo, filas) => `<aside class="tc-hero__panel tc-spec"><div class="tc-hero__panel-h"><span>${titulo}</span></div><dl class="tc-facts">${filas.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></aside>`;
const gear = (dientes, r1, r2) => { const pts = []; for (let i = 0; i < dientes * 2; i++) { const a = (Math.PI * i) / dientes, r = i % 2 ? r2 : r1, d = Math.PI / dientes / 2.6; pts.push([a - d, r], [a + d, r]); } return `<path d="M${pts.map(([a, r]) => `${(50 + r * Math.cos(a)).toFixed(1)} ${(50 + r * Math.sin(a)).toFixed(1)}`).join('L')}Z"/><circle cx="50" cy="50" r="${(r2 * 0.38).toFixed(1)}"/><circle cx="50" cy="50" r="${(r2 * 0.14).toFixed(1)}"/>`; };
const chispa = (x, y, s, d) => `<svg class="tc-deco__spark" style="left:${x}%;top:${y}%;--s:${s}px;--d:${d}s" viewBox="0 0 24 24"><path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12z"/></svg>`;
const DECO = (v = 'a') => `<div class="tc-deco tc-deco--${v}" aria-hidden="true">
<svg class="tc-deco__gear tc-deco__gear--1" viewBox="0 0 100 100">${gear(14, 44, 37)}</svg>
<svg class="tc-deco__gear tc-deco__gear--2" viewBox="0 0 100 100">${gear(10, 44, 35)}</svg>
<svg class="tc-deco__cota" viewBox="0 0 320 60"><path d="M10 40H310M10 30v20M310 30v20M10 40l10-5v10zM310 40l-10-5v10z"/><text x="160" y="26" text-anchor="middle">Ø 42 h7 · ±0,01</text></svg>
<svg class="tc-deco__arc" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92"/><circle cx="100" cy="100" r="70"/><path d="M100 0v22M100 178v22M0 100h22M178 100h22"/></svg>
${chispa(12, 18, 14, 0)}${chispa(46, 8, 10, 1.3)}${chispa(88, 30, 16, 2.1)}${chispa(70, 78, 11, .7)}${chispa(28, 70, 9, 2.8)}${chispa(95, 62, 8, 1.8)}
</div>`;

const pagehead = (crumbs, eb, h1, lead, btns = '', aside = '') => `<header class="tc-hero tc-pagehead">${DECO('b')}<div class="tc-wrap${aside ? ' tc-hero__grid' : ''}"><div class="tc-hero__copy">
<nav class="tc-crumbs" aria-label="Migas"><a href="/">Inicio</a><span aria-hidden="true">/</span>${crumbs}</nav>
${eyebrow(eb)}<h1>${h1}</h1><p class="tc-lead">${lead}</p>${btns ? `<div class="tc-btns">${btns}</div>` : ''}</div>${aside}</div></header>`;
const faq = (items) => `<div class="tc-faq tc-reveal">${items.map(([q, a]) => `<details><summary>${H(q)}</summary><p>${H(a)}</p></details>`).join('')}</div>
<script type="application/json" class="tc-faq-data">${JSON.stringify(items).replace(/</g, '\\u003c')}</script>`;
const band = (h, p, b = btn('/contacto/', 'Pide tu diagnóstico gratis')) => sec(`<div class="tc-band tc-reveal"><div><h2>${h}</h2><p>${p}</p></div><div class="tc-btns">${b}</div></div>`, 'tc-sec--tight');

const SITE = 'https://transformaconia.com';
const L = {
  cartagena: ['Cartagena', '/automatizacion-industria-cartagena/'],
  molina: ['Molina de Segura', '/automatizacion-industria-molina-de-segura/'],
  lorca: ['Lorca', '/automatizacion-industria-lorca/'],
  alcantarilla: ['Alcantarilla', '/automatizacion-industria-alcantarilla/'],
  elche: ['Elche', '/automatizacion-industria-elche/'],
  albacete: ['Albacete', '/automatizacion-industria-albacete/'],
};

const C = {};

C.cartagena = {
  nombre: 'Cartagena', region: 'Región de Murcia', presencial: true,
  seo: ['ERP y automatización para industria en Cartagena', 'ERP para talleres y automatización con IA para empresas industriales de Cartagena: Los Camachos, Cabezo Beaza y el entorno del puerto. Diagnóstico gratis.', 'automatización industria Cartagena'],
  h1: 'ERP y automatización con IA para la industria de Cartagena',
  lead: 'Ayudamos a talleres, empresas de mantenimiento y proveedores industriales de Cartagena a quitarse el papeleo de encima: partes, albaranes, presupuestos y facturas que se hacen casi solos.',
  datos: [['Visita en tu empresa', 'Sí, en Cartagena y comarca'], ['Zonas habituales', 'Los Camachos · Cabezo Beaza · Escombreras'], ['Después de la visita', 'Remoto y ágil'], ['Primer paso', 'Diagnóstico gratis']],
  intro: ['Cartagena es una ciudad con una industria muy marcada por el puerto, la construcción naval y el gran complejo de Escombreras (refinería, energía y petroquímica). Alrededor de esos gigantes vive un tejido de talleres, empresas de mantenimiento, calderería, montajes y proveedores que trabajan por encargo, con plazos cortos y mucha documentación.',
    'Ese es justo el tipo de empresa para la que está pensado nuestro ERP: <b>TransformaConIA Gestión</b>, un programa de gestión para la industria que nació en talleres de mecanizado y que se adapta a cada oficio por módulos. Si buscas un ERP para tu taller en Cartagena, lo vemos primero en tu nave y después lo montamos contigo.'],
  poligonosTitulo: 'Los Camachos, Cabezo Beaza y el entorno del puerto',
  poligonos: ['<b>Polígono Los Camachos:</b> la mayor reserva de suelo industrial de la comarca, con naves de talleres, almacenes y proveedores industriales.', '<b>Polígono Cabezo Beaza:</b> uno de los polígonos históricos de la ciudad, con mucho taller, metal y servicios técnicos.', '<b>Valle de Escombreras y puerto:</b> los grandes clientes de la zona; muchos talleres de la comarca trabajan como proveedores o contratas de ellos.'],
  sectores: [['Mantenimiento y paradas industriales', 'Partes de trabajo desde el móvil, control de horas por obra y albarán firmado en el sitio.'], ['Calderería y estructuras', 'Presupuestos con coste de material y mano de obra, y seguimiento de cada pedido hasta la factura.'], ['Naval y reparación', 'Documentación y trazabilidad de cada trabajo, con fotos y partes ligados al cliente y al barco o equipo.'], ['Proveedores de repuestos', 'Asistente que busca el recambio por descripción y equivalencias, y pedidos que se registran solos.']],
  como: ['<b>Presencial en Cartagena:</b> vamos a tu taller o nave, vemos cómo pasa hoy un trabajo desde la petición hasta la factura y apuntamos dónde se pierde el tiempo.', '<b>Remoto después:</b> la puesta en marcha, las pruebas y la formación se hacen por videollamada para que sea más rápido y barato.', '<b>Visitas puntuales:</b> volvemos a tu empresa en la formación inicial si lo prefieres.'],
  caso: { titulo: 'Taller de calderería «Calderería Ejemplo S.L.»', situacion: 'Un taller de calderería con unas diez personas, con presupuestos hechos en hojas de cálculo, partes de papel y facturas que se emiten días después de terminar el trabajo.', hacemos: 'Se implanta el ERP con calculadora de costes (coste del material y las horas, más el margen de la empresa), partes desde el móvil y albaranes firmados en el sitio. Las facturas salen del propio albarán.', resultado: 'En este ejemplo, el taller deja de reescribir datos tres veces y factura al cerrar el trabajo, no a final de mes. Las cifras reales dependen de cada empresa; lo medimos en el diagnóstico.' },
  faqs: [['¿Vais a mi taller en Cartagena?', 'Sí. En Cartagena y su comarca hacemos el diagnóstico en tu nave para ver el trabajo real. El resto del proyecto lo hacemos en remoto.'], ['¿Sirve el ERP para un taller pequeño de Cartagena?', 'Sí. Está pensado para talleres y empresas de oficio. Como referencia orientativa, la puesta en marcha parte de 690 € + IVA y el mantenimiento de unos 69 €/mes + IVA.'], ['¿Podéis conectarlo con el ERP o el SAP de mi cliente?', 'Si el programa tiene API, la conexión es directa; si no la tiene, valoramos cómo adaptarlo. Lo vemos en el diagnóstico gratis.']],
  cerca: ['molina', 'alcantarilla', 'lorca'],
};

C.molina = {
  nombre: 'Molina de Segura', region: 'Región de Murcia', presencial: true,
  seo: ['Automatización industrial en Molina de Segura | IA', 'Automatización con IA, ERP y gestión documental para empresas de Molina de Segura: La Polvorista, La Serreta, El Tapiado y La Estrella. Diagnóstico gratis.', 'automatización industria Molina de Segura'],
  h1: 'Automatización con IA para las empresas de Molina de Segura',
  lead: 'Facturas que se registran solas, pedidos sin reescribir y un asistente para tu mostrador. Trabajamos con empresas industriales y de distribución de Molina de Segura desde la cercanía de Murcia.',
  datos: [['Distancia desde Murcia', 'Unos minutos por carretera'], ['Visita en tu empresa', 'Sí, sin desplazamiento extra'], ['Polígonos', 'La Polvorista · La Serreta · El Tapiado · La Estrella'], ['Primer paso', 'Diagnóstico gratis']],
  intro: ['Molina de Segura fue, a caballo entre los siglos XIX y XX, uno de los grandes centros de la conserva de frutas y verduras de España, y hoy mantiene una industria alimentaria, de envase y de distribución muy viva. A su lado crecieron talleres, proveedores de maquinaria y empresas de servicios que viven de entregar rápido y facturar bien.',
    'Al estar prácticamente pegados a Murcia, es de las ciudades donde más fácil nos resulta trabajar: la visita es inmediata y las revisiones periódicas, también. Aquí encaja especialmente la <b>gestión documental con IA</b> (albaranes, facturas de proveedor, pedidos) y los asistentes técnicos para quien vende o fabrica con catálogo grande.'],
  poligonosTitulo: 'Polígonos donde trabajamos en Molina',
  poligonos: ['<b>La Polvorista:</b> una de las zonas con más actividad y mejor comunicada del municipio; mucha nave de distribución y taller.', '<b>La Serreta:</b> envases, manipulados y pequeñas fábricas con trabajo repetitivo y mucho papel de por medio.', '<b>El Tapiado y La Estrella:</b> naves de tamaño medio con almacenes, talleres y empresas de servicios técnicos.'],
  sectores: [['Alimentación y envase', 'Albaranes y facturas de proveedor que se leen y se contabilizan solos; lotes y trazabilidad más ordenados.'], ['Distribución industrial', 'Asistente de catálogo que responde al cliente por descripción y propone equivalencias.'], ['Talleres y servicios técnicos', 'ERP con partes, presupuestos y cobros controlados desde el móvil.'], ['Logística y almacén', 'Entradas y salidas conciliadas con el pedido, sin teclear dos veces.']],
  como: ['<b>Presencial, a cinco minutos:</b> por la cercanía, la visita de diagnóstico y las revisiones se hacen en tu empresa sin coste de desplazamiento extra.', '<b>Remoto para el día a día:</b> ajustes y soporte por videollamada o correo, de lunes a viernes.', '<b>Formación con tu equipo:</b> si quieres, la hacemos en tu propia oficina con tus documentos reales.'],
  caso: { titulo: 'Distribuidora «Suministros Ejemplo S.L.»', situacion: 'Una distribuidora de material para conserveras con tres administrativos que pasan buena parte del día pasando albaranes y facturas de proveedor a mano al programa de gestión.', hacemos: 'Se monta un flujo de gestión documental: el correo con el PDF o la foto del albarán se lee, se compara con el pedido y se deja registrado, y solo se revisa lo que no cuadra.', resultado: 'En este ejemplo inventado, el equipo revisa excepciones en vez de teclear todo. Los números reales los medimos juntos en un piloto pequeño con vuestros documentos.' },
  faqs: [['¿Cuánto cuesta automatizar facturas y albaranes en una empresa de Molina?', 'Como referencia orientativa, una automatización parte de 450 € + IVA. El diagnóstico previo es gratis y te damos el precio por escrito.'], ['¿Tenéis que venir a mi empresa o se puede hacer todo online?', 'Ambas cosas funcionan. Al estar tan cerca de Murcia solemos pasar por tu empresa al empezar y el resto lo hacemos en remoto.'], ['¿Se integra con el programa de contabilidad o el ERP que ya uso?', 'Si tiene API, la conexión es directa; si no, valoramos cómo adaptarlo. No tienes que cambiar de programa para empezar.']],
  cerca: ['alcantarilla', 'cartagena', 'lorca'],
};

C.lorca = {
  nombre: 'Lorca', region: 'Región de Murcia', presencial: true,
  seo: ['IA y ERP para empresas industriales de Lorca', 'ERP para talleres, automatización e IA para empresas de Lorca: Saprelorca, La Hoya, sector cárnico y agroindustrial. Visita y diagnóstico gratis.', 'automatización industria Lorca'],
  h1: 'IA y ERP para las empresas industriales de Lorca',
  lead: 'Industria cárnica, talleres agrícolas y empresas de servicios en Saprelorca y alrededores: automatizamos el papeleo y damos a tu equipo herramientas que de verdad se usan.',
  datos: [['Visita en tu empresa', 'Sí, concertada con antelación'], ['Zona principal', 'Saprelorca · La Hoya'], ['Sector fuerte', 'Cárnico, agroindustria y maquinaria'], ['Primer paso', 'Diagnóstico gratis']],
  intro: ['Lorca tiene una economía industrial muy ligada a su campo: el porcino y la industria cárnica, la agroalimentación y, alrededor, una red de talleres de maquinaria agrícola y ganadera, frío industrial, transporte y suministros. La feria SEPOR, de referencia para el sector porcino, lo refleja cada año.',
    'En este tipo de empresa los problemas se repiten: mucho albarán y mucha trazabilidad, picos de trabajo por campañas y talleres que reparan de todo, de un día para otro. Por eso proponemos empezar por lo que más tiempo roba (documentos y partes) antes de tocar nada más.'],
  poligonosTitulo: 'Saprelorca, La Hoya y el resto de la zona industrial',
  poligonos: ['<b>Saprelorca:</b> el primer polígono planificado de Lorca (desde 1982), con más de 180 hectáreas urbanizadas y cerca de 230 empresas de industria, comercio y servicios.', '<b>La Hoya:</b> zona con talleres, almacenes y empresas auxiliares de la actividad agroindustrial.', '<b>Alrededores y pedanías:</b> naves y talleres dispersos a los que llegamos con visita concertada.'],
  sectores: [['Industria cárnica y agroalimentaria', 'Albaranes, lotes y trazabilidad con menos papel; facturas de proveedor registradas automáticamente.'], ['Maquinaria agrícola y ganadera', 'ERP para el taller: partes de reparación, repuestos, presupuesto y cobro en una sola ficha.'], ['Hidráulica, neumática y suministros', 'Asistente técnico que sugiere el recambio equivalente por descripción.'], ['Transporte y frío industrial', 'Mantenimientos programados y avisos de revisión por cliente.']],
  como: ['<b>Visita en Lorca:</b> venimos a tu empresa con cita previa (agrupamos visitas de la zona para que sea más económico).', '<b>Remoto para todo lo demás:</b> configuración, formación y soporte por videollamada.', '<b>Campañas y picos:</b> si tu trabajo es estacional, planificamos la puesta en marcha en la época baja.'],
  caso: { titulo: 'Taller «Maquinaria Ejemplo S.L.»', situacion: 'Un taller que repara maquinaria de explotaciones ganaderas con partes escritos a mano; el cliente pregunta «cuánto me va a costar» y la respuesta depende de buscar en libretas.', hacemos: 'Ficha por equipo y por cliente con historial de reparaciones, calculadora de costes con el margen del taller y albarán firmado en el móvil del mecánico.', resultado: 'En este ejemplo ficticio, el presupuesto se da en el momento con los datos de trabajos parecidos. Lo comprobamos con tus propios trabajos antes de cobrar nada más.' },
  faqs: [['¿Os desplazáis hasta Lorca?', 'Sí, con cita previa. Lorca está a distancia de visita y agrupamos varias visitas para que sea más económico. El resto del proyecto va en remoto.'], ['¿Sirve para una empresa del sector cárnico o agroalimentario?', 'Sí, empezando por la gestión documental y el control de pedidos y lotes. Antes de proponer nada hacemos un diagnóstico gratis para ver qué encaja.'], ['¿Cuánto cuesta un ERP para un taller de maquinaria?', 'Como referencia orientativa, la puesta en marcha parte de 690 € + IVA y el mantenimiento ronda los 69 €/mes + IVA. El diagnóstico previo no cuesta nada.']],
  cerca: ['alcantarilla', 'molina', 'cartagena'],
};

C.alcantarilla = {
  nombre: 'Alcantarilla', region: 'Región de Murcia', presencial: true,
  seo: ['Automatización e IA para industria en Alcantarilla', 'ERP para talleres y automatización de albaranes y pedidos en Alcantarilla: polígono Oeste y Cabezo Verde. Visita y diagnóstico gratis.', 'automatización industria Alcantarilla'],
  h1: 'Automatización e IA para las empresas de Alcantarilla',
  lead: 'Pegados a Murcia, con el polígono Oeste y Cabezo Verde: ayudamos a las empresas de Alcantarilla a trabajar con menos papel y más control, con visita en tu empresa en el mismo día.',
  datos: [['Distancia desde Murcia', 'Al lado: visita en el día'], ['Visita en tu empresa', 'Sí, sin desplazamiento extra'], ['Polígonos', 'Oeste · Cabezo Verde'], ['Primer paso', 'Diagnóstico gratis']],
  intro: ['Alcantarilla es un lugar con historia industrial: en 1897 se instaló aquí la primera fábrica de conservas vegetales de la Región, y la chimenea de la fábrica Esteva sigue siendo hoy símbolo del municipio. De aquella tradición queda un tejido de empresas muy diversificado, con la logística y la distribución como aliadas por la situación en el cruce de comunicaciones del área metropolitana de Murcia.',
    'Es una zona donde se nota mucho la mezcla: almacenes, distribuidores con rutas diarias, talleres y pequeñas fábricas. Por eso aquí solemos empezar por <b>pedidos, albaranes y rutas</b>, y dejamos para después la parte del ERP.'],
  poligonosTitulo: 'Polígono Oeste y Cabezo Verde',
  poligonos: ['<b>Polígono Industrial Oeste:</b> el principal polígono de Alcantarilla (compartido con Murcia), con un tejido muy diversificado: naves de distribución, talleres, fábricas pequeñas y servicios.', '<b>Cabezo Verde:</b> zona al norte del casco urbano con suelo industrial y empresas de tamaño medio.', '<b>Otras zonas</b> como El Potrox o Cañada Hermosa, con talleres y almacenes más pequeños.'],
  sectores: [['Distribución y almacén', 'Albaranes y pedidos de cliente que entran solos al programa; avisos de stock bajo.'], ['Talleres y reparación', 'ERP con partes, presupuestos y cobros, usable desde el móvil de cada operario.'], ['Alimentación y envase', 'Facturas de proveedor registradas automáticamente y menos revisión manual.'], ['Servicios técnicos', 'Mantenimientos programados por cliente y avisos de revisión.']],
  como: ['<b>Visita en el día:</b> estamos en Murcia, así que pasar por Alcantarilla es cosa de minutos y sin coste de desplazamiento extra.', '<b>Piloto pequeño:</b> empezamos por un proceso (por ejemplo, albaranes de entrada) y lo ampliamos solo si funciona.', '<b>Soporte cercano:</b> ante dudas podemos acercarnos en persona o resolverlo por videollamada.'],
  caso: { titulo: 'Almacén «Logística Ejemplo S.L.»', situacion: 'Un almacén distribuidor que recibe pedidos por correo, WhatsApp y teléfono, y los apunta a mano antes de prepararlos.', hacemos: 'Los pedidos entrantes se recogen en un único sitio, se comprueban contra el catálogo y se pasan al programa de gestión, con una revisión rápida para lo dudoso.', resultado: 'En este ejemplo inventado, desaparecen las llamadas para confirmar «qué era exactamente lo que pedías». El impacto real se mide en un piloto con tus pedidos.' },
  faqs: [['¿Podéis venir a mi empresa de Alcantarilla esta misma semana?', 'Normalmente sí: estamos en Murcia y Alcantarilla queda al lado. Escríbenos y buscamos hueco para el diagnóstico gratis.'], ['¿Por dónde conviene empezar?', 'Por el proceso que más papel mueve: albaranes, pedidos o facturas de proveedor. Una automatización de ese tipo parte, como referencia orientativa, de 450 € + IVA.'], ['¿Tengo que cambiar mi programa actual?', 'No necesariamente. Si tiene API nos conectamos directamente y, si no, valoramos cómo adaptarlo. El ERP propio es una opción, no una obligación.']],
  cerca: ['molina', 'lorca', 'cartagena'],
};

C.elche = {
  nombre: 'Elche', region: 'Comunidad Valenciana', presencial: false,
  seo: ['IA y automatización para empresas de Elche (calzado)', 'Automatización con IA, ERP y asistentes técnicos para empresas de Elche: calzado, industria auxiliar, Carrús y Elche Parque Empresarial. Trabajo remoto.', 'automatización industria Elche'],
  h1: 'IA y automatización para las empresas de Elche',
  lead: 'Calzado, industria auxiliar y talleres de Elche: trabajamos en remoto, por videollamada, con la misma atención que si estuviéramos en la puerta de tu nave.',
  datos: [['Modo de trabajo', 'Remoto, por videollamada'], ['Visita presencial', 'Posible bajo petición (gastos a convenir)'], ['Zonas', 'Carrús · Altabix · Elche Parque Empresarial'], ['Primer paso', 'Diagnóstico gratis']],
  intro: ['Elche es el mayor núcleo del calzado de España: concentra por sí sola casi una quinta parte del empleo del sector. Alrededor de las marcas y fábricas hay una industria auxiliar enorme (suelas, componentes, corte, cartonaje, mantenimiento de maquinaria) formada por empresas pequeñas con mucha variedad de referencias y mucha rotación de pedidos.',
    'Ese es un terreno ideal para la automatización: <b>cientos de referencias, tallas, colores y pedidos pequeños</b> que hoy se llevan en hojas de cálculo. Trabajamos con Elche en remoto desde Murcia, con reuniones por videollamada y documentación compartida, y nos desplazamos si el proyecto lo justifica.'],
  poligonosTitulo: 'Carrús, Altabix y Elche Parque Empresarial',
  poligonos: ['<b>Polígono de Carrús:</b> muchas micropymes de calzado y auxiliares junto con química, telecomunicaciones y comercio.', '<b>Altabix:</b> zona históricamente industrial y de calzado que el Ayuntamiento quiere orientar a comercio y servicios.', '<b>Elche Parque Empresarial (Torrellano):</b> parque más moderno donde se han instalado firmas de calzado de primera línea y logística.'],
  sectores: [['Calzado y componentes', 'Pedidos con muchas referencias que se registran sin reescribir; asistente que responde al comercial sobre disponibilidad.'], ['Industria auxiliar', 'Presupuestos y partes de taller con coste real y margen; control de cobros.'], ['Logística y almacén', 'Albaranes y devoluciones conciliados con el pedido.'], ['Mantenimiento de maquinaria', 'ERP para el taller que repara maquinaria de las fábricas de la zona.']],
  como: ['<b>Todo en remoto:</b> diagnóstico, configuración, formación y soporte por videollamada y con documentación compartida.', '<b>Presencial si hace falta:</b> para proyectos de cierto tamaño podemos desplazarnos; los gastos se acuerdan antes.', '<b>Mismo precio de referencia:</b> no cobramos distinto por estar fuera de Murcia; los precios son orientativos y los das por escrito antes de empezar.'],
  caso: { titulo: 'Fábrica de componentes «Suelas Ejemplo S.L.»', situacion: 'Un fabricante de componentes con cientos de referencias que recibe pedidos de varios clientes por correo y los pasa a mano a producción.', hacemos: 'Se extraen los datos del pedido del correo o del PDF, se validan contra el catálogo y se generan las órdenes de producción, con una revisión humana en lo que no cuadra.', resultado: 'En este ejemplo ficticio, el administrativo pasa de teclear pedidos a revisar excepciones. El tiempo ahorrado real se mide en un piloto con pedidos reales.' },
  faqs: [['¿Trabajáis con empresas de Elche si estáis en Murcia?', 'Sí. Trabajamos en remoto con empresas de toda España: el diagnóstico es una videollamada y el resto del proyecto se comparte en línea.'], ['¿Sirve para una empresa de calzado o de industria auxiliar?', 'Sí, sobre todo para pedidos con muchas referencias, albaranes y presupuestos. Lo vemos en el diagnóstico gratis, donde te decimos qué sí y qué no merece la pena automatizar.'], ['¿Cuánto cuesta?', 'Como referencia orientativa, una automatización parte de 450 € + IVA y el ERP para la industria de 690 € de puesta en marcha, con mantenimiento de unos 69 €/mes + IVA.']],
  cerca: ['albacete', 'cartagena', 'lorca'],
};

C.albacete = {
  nombre: 'Albacete', region: 'Castilla-La Mancha', presencial: false,
  seo: ['Automatización e IA para empresas de Albacete', 'IA, ERP y automatización para cuchillería, maquinaria agrícola y agroindustria de Albacete (Campollano, Romica). Remoto y diagnóstico gratis.', 'automatización industria Albacete'],
  h1: 'Automatización e IA para las empresas de Albacete',
  lead: 'Cuchillería, maquinaria agrícola y agroindustria en Campollano y alrededores: trabajamos en remoto con empresas de Albacete, con visitas puntuales cuando el proyecto lo pide.',
  datos: [['Modo de trabajo', 'Remoto, por videollamada'], ['Visita presencial', 'Posible bajo petición (gastos a convenir)'], ['Zonas', 'Campollano · Romica'], ['Primer paso', 'Diagnóstico gratis']],
  intro: ['Albacete es conocida como la cuna de la cuchillería española, un sector que da trabajo a cientos de familias y exporta a medio mundo, y que convive con una potente agroindustria y con fabricantes de maquinaria agrícola y agroindustrial. Muchas son empresas familiares con décadas de oficio y procesos que se llevan «de memoria».',
    'Ahí es donde la tecnología aporta más: que el conocimiento del oficio no dependa de una sola persona, que el presupuesto salga rápido y que catálogos de miles de modelos se puedan consultar con una pregunta. Trabajamos con Albacete en remoto desde Murcia, sin intermediarios.'],
  poligonosTitulo: 'Campollano, Romica y alrededores',
  poligonos: ['<b>Polígono Campollano:</b> el gran polígono de Albacete, donde se concentran fábricas de cuchillería, maquinaria agrícola y agroindustria.', '<b>Polígono Romica:</b> suelo industrial con naves de almacén, talleres y empresas auxiliares.', '<b>Resto de la ciudad y la provincia:</b> talleres y fábricas con acceso por videollamada.'],
  sectores: [['Cuchillería', 'Catálogo con miles de modelos y variantes consultable por un asistente; presupuestos de series a medida con coste real.'], ['Maquinaria agrícola y agroindustrial', 'ERP para fábrica y taller, con partes, repuestos, garantías y servicio técnico por cliente.'], ['Agroalimentación y cooperativas', 'Albaranes de entrada, pesadas y facturas de proveedor con menos reintroducción de datos.'], ['Distribución y transporte', 'Pedidos y rutas conciliados con el albarán firmado.']],
  como: ['<b>Remoto de principio a fin:</b> diagnóstico por videollamada, configuración compartida y formación en línea.', '<b>Visita bajo petición:</b> para proyectos mayores nos desplazamos; los gastos se acuerdan antes.', '<b>Sin cambiar tu forma de trabajar:</b> aprendemos tu oficio primero y automatizamos lo repetitivo, no lo que da valor.'],
  caso: { titulo: 'Fábrica «Cuchillería Ejemplo S.L.»', situacion: 'Una empresa familiar con un catálogo de cientos de modelos, y un comercial que tarda en contestar a cada consulta porque debe buscar en varios archivos.', hacemos: 'Un asistente técnico de catálogo contesta a los comerciales y clientes con la ficha, el precio y las variantes disponibles, y escala a una persona lo que no sabe.', resultado: 'En este ejemplo ficticio, el comercial responde en segundos desde el móvil. El efecto real se prueba antes con un piloto sobre tu catálogo.' },
  faqs: [['¿Podéis trabajar con una empresa de Albacete sin venir?', 'Sí. Trabajamos en remoto con empresas de toda España. El diagnóstico es una videollamada y, si más adelante hace falta, concertamos una visita.'], ['¿Tenéis experiencia en cuchillería o maquinaria agrícola?', 'Venimos del taller industrial y del catálogo técnico. Antes de proponer nada aprendemos cómo trabajas tú; el diagnóstico es gratis.'], ['¿Qué precio tiene un asistente de catálogo?', 'Como referencia orientativa, un asistente técnico parte de 900 € + IVA. El precio final depende del tamaño de tu catálogo y se te da por escrito.']],
  cerca: ['elche', 'lorca', 'molina'],
};

const ficha = (slug, c) => {
  const url = `${SITE}/automatizacion-industria-${slug === 'molina' ? 'molina-de-segura' : slug}/`;
  return JSON.stringify({
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': url + '#servicio', name: `Transforma con IA · ${c.nombre}`, url,
    description: c.seo[1], email: 'info@transformaconia.com', priceRange: '€€', parentOrganization: { '@id': SITE + '/#organization' },
    address: { '@type': 'PostalAddress', addressLocality: 'Murcia', addressRegion: 'Región de Murcia', addressCountry: 'ES' },
    areaServed: { '@type': 'City', name: c.nombre, containedInPlace: { '@type': 'AdministrativeArea', name: c.region } },
    serviceType: ['Automatización de procesos con IA', 'ERP para la industria', 'Asistentes técnicos de catálogo', 'Gestión documental con IA'],
  }).replace(/</g, '\\u003c');
};

// Bloque de enlaces entre las páginas locales (id fijo: en las páginas ya publicadas solo se actualiza este bloque)
const enlaces = (slug) => {
  const otras = Object.keys(L).filter((k) => k !== slug);
  const lista = otras.map((k) => '<a class="tc-link" href="' + L[k][1] + '">automatización industrial en ' + L[k][0] + '</a>').join(', ');
  return '<section class="tc-sec tc-sec--tight" id="otras-ciudades"><div class="tc-wrap"><div class="tc-prose tc-reveal"><h3>Dónde más trabajamos</h3><p>Volver a <a class="tc-link" href="/consultor-ia-murcia/">consultoría de IA en Murcia y toda la región</a>. También tenemos página para ' + lista + ', y trabajamos en toda España en remoto. Conoce <a class="tc-link" href="/erp-industria/">el ERP para la industria</a> o <a class="tc-link" href="/contacto/">escríbenos</a>.</p></div></div></section>';
};
const html = (slug, c) => page(`${pagehead(`<a href="/consultor-ia-murcia/">Región de Murcia</a><span aria-hidden="true">/</span><span>${c.nombre}</span>`, `Industria en ${c.nombre}`, c.h1, c.lead,
    btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/erp-industria/', 'Ver el ERP para la industria', true), facts(`Trabajamos en ${c.nombre}`, c.datos))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow(`La industria de ${c.nombre}`)}<h2>Qué vemos en las empresas de ${c.nombre}</h2>${c.intro.map((p) => `<p>${p}</p>`).join('')}</div><div class="tc-box tc-reveal"><h3>${c.poligonosTitulo}</h3>${list(c.poligonos)}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Sectores', `Dónde más ayudamos en ${c.nombre}`)}<div class="tc-grid tc-reveal" style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${c.sectores.map(([t, d]) => `<div class="tc-box"><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="tc-sec"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Cómo trabajamos')}<h2>${c.presencial ? `Presencial en ${c.nombre} y remoto para el resto` : `Remoto, con visitas cuando haga falta`}</h2>${list(c.como)}<p>El ERP es <b>TransformaConIA Gestión</b>, nuestro programa de gestión para la industria. <a class="tc-link" href="/erp-industria/">Ver cómo funciona</a>.</p></div><div class="tc-box tc-reveal"><span class="tc-eyebrow">Ejemplo ficticio</span><h3>${c.caso.titulo}</h3><p><i>Caso inventado para ilustrar; no es un cliente real.</i></p><p><b>Situación.</b> ${c.caso.situacion}</p><p><b>Qué hacemos.</b> ${c.caso.hacemos}</p><p><b>Resultado.</b> ${c.caso.resultado}</p></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', `IA y automatización en ${c.nombre}`)}${faq(c.faqs)}</div></section>
${enlaces(slug)}
${band(`¿Tienes una empresa en ${c.nombre}?`, 'Cuéntanos cómo trabajas y te decimos, sin compromiso, qué automatizaríamos primero y a qué precio orientativo.')}
<script type="application/ld+json">${ficha(slug, c)}</script>`);

// ---------- comprobaciones ----------
for (const [k, c] of Object.entries(C)) {
  if (c.seo[0].length > 60) throw new Error(`title >60 en ${k}: ${c.seo[0].length}`);
  if (c.seo[1].length > 155) throw new Error(`description >155 en ${k}: ${c.seo[1].length}`);
}

const solo = process.argv.slice(2);
const dry = process.env.DRY === '1';
for (const [k, c] of Object.entries(C)) {
  if (solo.length && !solo.includes(k)) continue;
  const slug = L[k][1].replace(/\//g, '');
  const content = html(k, c);
  if (dry) { console.log(slug, c.seo[0].length, c.seo[1].length, content.length); continue; }
  const f = await wp('GET', `/wp/v2/pages?slug=${slug}&status=publish,draft,pending,private&_fields=id,status`);
  const ex = f.data?.[0];
  if (ex?.status === 'publish') {
    // Página ya publicada: copia del contenido y cambio SOLO del bloque de enlaces + foco de Rank Math
    const old = (await wp('GET', '/wp/v2/pages/' + ex.id + '?context=edit&_fields=id,content')).data?.content?.raw || '';
    fs.mkdirSync(BK, { recursive: true });
    if (!fs.existsSync(BK + 'page-' + ex.id + '.html')) fs.writeFileSync(BK + 'page-' + ex.id + '.html', old);
    const bloque = enlaces(k);
    const re = /<section class="tc-sec tc-sec--tight"(?: id="otras-ciudades")?><div class="tc-wrap"><div class="tc-prose tc-reveal">(?:<h3>Dónde más trabajamos<\/h3>)?<p>(?:También trabajamos en|Volver a)[\s\S]*?<\/section>/;
    if (!re.test(old)) { console.log(slug, 'NO se encuentra el bloque de enlaces; sin cambios'); continue; }
    const nuevo = old.replace(re, () => bloque);
    const r2 = await wp('POST', '/wp/v2/pages/' + ex.id, { content: nuevo, meta: { rank_math_focus_keyword: c.seo[2] } });
    console.log(slug, 'actualizada solo bloque de enlaces + foco:', r2.status, r2.data?.link);
    continue;
  }
  const body = { title: `Automatización e IA para la industria en ${c.nombre}`, slug, status: 'draft', content, template: '', comment_status: 'closed', author: 2, meta: { rank_math_title: c.seo[0], rank_math_description: c.seo[1], rank_math_focus_keyword: c.seo[2] } };
  const r = ex ? await wp('POST', `/wp/v2/pages/${ex.id}`, body) : await wp('POST', '/wp/v2/pages', body);
  console.log(slug, r.status, r.data?.id, r.data?.status, `https://transformaconia.com/?page_id=${r.data?.id}&preview=true`);
}
