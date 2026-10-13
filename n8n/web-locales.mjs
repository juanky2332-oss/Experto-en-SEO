// Páginas locales de transformaconia.com (Cartagena, Molina de Segura, Lorca, Alcantarilla, Elche, Albacete).
// Uso:
//   DRY=1 node n8n/web-locales.mjs            -> comprueba longitudes y cuenta palabras sin tocar la web
//   node n8n/web-locales.mjs [slug-corto ...]  -> sin argumentos: crea como BORRADOR las que no existan; las ya publicadas NO se tocan
//   node n8n/web-locales.mjs --t3 [slug ...]   -> TANDA 3: copia de seguridad en _backups/tanda3/ y actualización COMPLETA (contenido + Rank Math) de las ya publicadas
// Murcia ya existe como /consultor-ia-murcia/ (no se duplica; se enlaza). No toca web-paginas.mjs ni el snippet.
// Contenido propio por ciudad con fuentes y fecha de consulta (13-10-2026). Casos SIEMPRE ficticios y marcados. Sin nombrar herramientas internas.
// Precios: solo los confirmados (690 € en dos pagos de 345 €, 69 €/mes con 3 meses gratis, usuario extra 15 €/mes desde el primer mes, sin permanencia) o enlace a /erp-industria/#precio.
import fs from 'node:fs';
import { wp } from './gw.mjs';
const BK3 = '_backups/tanda3/';

const H = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const btn = (href, txt, ghost = false) => `<a class="tc-btn${ghost ? ' tc-btn--ghost' : ''}" href="${href}">${txt} ${ARROW}</a>`;
const eyebrow = (t) => `<span class="tc-eyebrow">${t}</span>`;
const head = (eb, h2, p = '') => `<div class="tc-head tc-reveal"><div>${eyebrow(eb)}<h2>${h2}</h2>${p ? `<p>${p}</p>` : ''}</div></div>`;
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
// Cada pregunta es un H3 dentro del <summary> (acordeón); el JSON de abajo alimenta el FAQPage del snippet
const faq = (items) => `<div class="tc-faq tc-reveal">${items.map(([q, a]) => `<details><summary><h3>${H(q)}</h3></summary><p>${H(a)}</p></details>`).join('')}</div>
<script type="application/json" class="tc-faq-data">${JSON.stringify(items).replace(/</g, '\\u003c')}</script>`;
const sec = (inner, cls = '') => `<section class="tc-sec ${cls}"><div class="tc-wrap">${inner}</div></section>`;
const band = (h, p, b = btn('/contacto/', 'Pide tu diagnóstico gratis')) => sec(`<div class="tc-band tc-reveal"><div><h2>${h}</h2><p>${p}</p></div><div class="tc-btns">${b}</div></div>`, 'tc-sec--tight');

const SITE = 'https://transformaconia.com';
const CONSULTA = '13 de octubre de 2026';
const L = {
  cartagena: ['Cartagena', '/automatizacion-industria-cartagena/'],
  molina: ['Molina de Segura', '/automatizacion-industria-molina-de-segura/'],
  lorca: ['Lorca', '/automatizacion-industria-lorca/'],
  alcantarilla: ['Alcantarilla', '/automatizacion-industria-alcantarilla/'],
  elche: ['Elche', '/automatizacion-industria-elche/'],
  albacete: ['Albacete', '/automatizacion-industria-albacete/'],
};
const a = (href, txt) => `<a class="tc-link" href="${href}">${txt}</a>`;

const C = {};

/* ------------------------------------------------------------------ CARTAGENA */
C.cartagena = {
  nombre: 'Cartagena', region: 'Región de Murcia', presencial: true,
  seo: ['ERP y automatización con IA para industria en Cartagena', 'Automatización y ERP para talleres, calderería y contratas de Cartagena: Los Camachos, Cabezo Beaza y Escombreras. Diagnóstico gratis en tu nave.', 'automatización industria Cartagena'],
  h1: 'ERP y automatización con IA para talleres y contratas de Cartagena',
  lead: 'Cartagena trabaja para grandes clientes: complejo industrial, astillero y puerto. Te ayudamos a que partes, albaranes, certificaciones y facturas no se queden atascados en la oficina.',
  datos: [['Visita en tu empresa', 'Sí, en Cartagena y comarca'], ['Distancia desde Murcia', 'Unos 50 km'], ['Zonas habituales', 'Los Camachos · Cabezo Beaza · Escombreras'], ['Primer paso', 'Diagnóstico gratis']],
  eb: 'Contratas, astillero y complejo industrial', h2a: 'Un tejido industrial que trabaja por encargo',
  intro: ['Pocas ciudades de la Región concentran tanta industria pesada en tan poco espacio. En el Valle de Escombreras conviven una refinería, fertilizantes, química y generación eléctrica; en el arsenal y el puerto, la reparación naval. Cuando uno de esos clientes hace una parada de mantenimiento, el trabajo se reparte entre muchas empresas auxiliares: en la parada programada de 2025, el complejo de Repsol firmó acuerdos con 130 empresas, el 80 % de ellas locales, según su propia nota de prensa del 13 de agosto de 2025.',
    'Para un taller, una calderería o una empresa de montajes que trabaja como contrata, el reto rara vez es fabricar: es demostrarlo. Partes de horas por trabajador y orden, albaranes firmados, fotos, documentación para el cliente y una factura que cuadre con todo eso. Ahí se pierde más papel, y ahí tiene sentido nuestro programa de gestión, <b>TransformaConIA Gestión</b>, que nació en talleres de mecanizado y se adapta a cada oficio por módulos.'],
  poligonosTitulo: 'Los Camachos, Cabezo Beaza y Escombreras',
  poligonos: ['<b>Los Camachos:</b> en una moción presentada al pleno en febrero de 2026 se le describe como la mayor reserva de suelo industrial de la comarca. Tiene entidad de conservación propia y, según ese texto, mejoras pendientes de viales y alumbrado; se anuncia allí un centro de capacitación industrial y naval para 2027.',
    '<b>Cabezo Beaza:</b> una moción municipal de 2021 recordaba que su centro de formación industrial formaba soldadores, tuberos, caldereros, montadores, torneros o fresadores, una pista de los oficios que se concentran en la zona. Las empresas del polígono cuentan con su propia asociación (AECAB).',
    '<b>Valle de Escombreras:</b> refino, fertilizantes, química y centrales eléctricas junto a la dársena de Escombreras, del Puerto de Cartagena. Es el cliente final de buena parte de las contratas de la comarca.'],
  sectoresH: 'Qué pesa más en la oficina de una contrata o un taller',
  sectores: [['Mantenimiento y paradas industriales', 'En una parada se mueven cientos de personas de varias empresas en pocas semanas. Es habitual que pese más el control de horas por orden de trabajo, la documentación de formación y seguridad de cada operario y el parte diario firmado que sostiene la factura.'],
    ['Calderería, tubería y estructuras', 'Se presupuesta por kilo, por hora y por certificaciones de soldadura. Es habitual que el precio salga de una hoja de cálculo personal y que los cambios de obra no vuelvan al presupuesto; una calculadora de costes con tu margen lo ordena.'],
    ['Reparación naval y de yates', 'El astillero de reparaciones de Cartagena cerró 2025 a plena capacidad, con yates y buques de la Armada, según Forbes España. El trabajo llega con plazos cortos y muchos cambios; fotos del antes y el después y control de extras evitan discusiones al facturar.'],
    ['Suministros industriales', 'Repuestos y consumibles con muchos códigos, pedidos por correo y teléfono. Es habitual perder tiempo con equivalencias y plazos; un asistente de catálogo y el registro automático del pedido lo recortan.']],
  comoH: 'Presencial en tu nave y remoto para el resto',
  como: ['<b>En tu taller o nave de Cartagena:</b> vemos cómo pasa hoy un trabajo desde la petición hasta la factura y apuntamos dónde se pierde el tiempo.', '<b>Después, por videollamada:</b> la puesta en marcha, las pruebas y la formación se hacen en remoto, que es más rápido y deja todo documentado.', '<b>Un solo proceso al principio:</b> empezamos por el parte de trabajo o el albarán firmado y solo ampliamos si funciona en tu día a día.'],
  erp: 'Si trabajas con documentación para grandes clientes, mira cómo encaja <a class="tc-link" href="/erp-industria/">TransformaConIA Gestión</a>, el programa de gestión para la industria.',
  caso: { titulo: 'Contrata de mantenimiento «Montajes Ficticios del Sur, S.L.»', situacion: 'Una empresa auxiliar de tamaño medio que destaca cuadrillas de soldadura y tubería a la parada de una planta. Los partes de horas se rellenan en papel y se pasan a una hoja de cálculo al terminar la semana.', hacemos: 'Partes diarios desde el móvil, por orden de trabajo, con horas, materiales y fotos. El encargado firma en el sitio y el cierre semanal sale agrupado por orden, listo para la certificación y la factura.', resultado: 'En este ejemplo inventado, la oficina deja de reconstruir la semana cada viernes y puede responder con datos si el cliente cuestiona unas horas. No damos cifras de ahorro: dependen de cada empresa y se miden en un piloto con tus propios partes.' },
  nota: 'Caso inventado para ilustrar; no corresponde a ninguna empresa real.',
  faqsH: 'Preguntas de empresas de Cartagena',
  faqs: [['¿Visitáis polígonos como Los Camachos o Cabezo Beaza?', 'Sí. El diagnóstico lo hacemos en tu nave, en Cartagena y su comarca, para ver el trabajo real. El resto del proyecto lo hacemos en remoto, por videollamada.'],
    ['Trabajo como contrata de una gran planta: ¿se adapta a su sistema de documentación?', 'Depende de lo que te pidan. Si el sistema del cliente tiene API, la conexión es directa; si no, valoramos cómo adaptarlo o cómo dejar partes y certificados preparados para subirlos. Lo vemos en el diagnóstico, sin compromiso.'],
    ['¿Hay ayudas para pagar la digitalización de una pyme de Cartagena?', `La Región de Murcia tiene el Cheque de Innovación 2026 del Instituto de Fomento (INFO): hasta 8.000 € por beneficiario para contratar servicios de innovación y competitividad catalogados, con solicitud hasta el 23 de diciembre de 2026 mientras quede crédito (BORM del 22-05-2026, consultado el ${CONSULTA}). No podemos asegurar que un servicio concreto esté en el catálogo: revisa la convocatoria y te decimos si encaja con lo que necesitas.`]],
  band: ['¿Trabajas para la industria de Cartagena?', 'Cuéntanos cómo llevas hoy los partes y las facturas de una obra y te decimos qué ordenaríamos primero.'],
  fuentes: [['Repsol, nota de prensa sobre la parada programada del complejo de Cartagena (13-08-2025)', 'https://cartagena.repsol.es/content/dam/repsol-complejos-industriales/cartagena/sala-de-prensa/2025/np13082025-repsol-invierte-67-millones-parada-programada-complejo-industrial-cartagena.pdf'],
    ['Ayuntamiento de Cartagena, moción sobre actuaciones en el polígono de Los Camachos (13-02-2026)', 'https://www.cartagena.es/gestion/documentos/93316.pdf'],
    ['Ayuntamiento de Cartagena, moción sobre el centro de formación industrial de Cabezo Beaza (15-02-2021)', 'https://www.cartagena.es/gestion/documentos/46336.pdf'],
    ['Forbes España, Navantia Reparaciones Cartagena (24-11-2025)', 'https://forbes.es/economia/833058/navantia-reparaciones-cartagena-preve-operar-a-plena-capacidad-en-el-primer-semestre-de-2026/'],
    ['Wikipedia, Escombreras (Cartagena)', 'https://es.wikipedia.org/wiki/Escombreras_(Cartagena)'],
    ['BORM n.º 116, 22-05-2026: Cheque de Innovación 2026 (INFO, BDNS 906427)', 'https://www.borm.es/services/anuncio/ano/2026/numero/2321/pdf?id=843003']],
  cerca: ['molina', 'alcantarilla', 'lorca'],
};

/* ------------------------------------------------------------------ MOLINA DE SEGURA */
C.molina = {
  nombre: 'Molina de Segura', region: 'Región de Murcia', presencial: true,
  seo: ['Automatización e IA para empresas de Molina de Segura', 'IA, ERP y gestión documental para golosinas, envases, transporte y talleres de Molina de Segura: La Polvorista, La Serreta y El Tapiado. Visita gratis.', 'automatización industria Molina de Segura'],
  h1: 'Automatización con IA para fábricas, envasadoras y transportistas de Molina de Segura',
  lead: 'Golosinas, envase, transporte y talleres: en Molina de Segura el papeleo crece con cada formato y cada ruta nueva. Lo ordenamos desde Murcia, a unos diez kilómetros.',
  datos: [['Distancia desde Murcia', 'Unos 10 km'], ['Visita en tu empresa', 'Sí, en el día'], ['Polígonos', 'La Polvorista · La Serreta · El Tapiado · La Estrella'], ['Sector con más peso', 'Golosinas, envase y transporte']],
  eb: 'De la conserva a la golosina', h2a: 'Mucha referencia, mucho formato y plazos cortos',
  intro: ['Molina fue uno de los grandes centros españoles de la conserva vegetal: a mediados de los años setenta contaba con 24 fábricas de conservas y 34 de envases metálicos, según los datos locales que recoge la Wikipedia. De aquel entramado quedó una industria de envase, embalaje y maquinaria que hoy sirve sobre todo a otro sector: el de las golosinas. Según El Español (11 de abril de 2026), tres de las mayores empresas españolas del dulce están en un radio de unos cuatro kilómetros.',
    'En un entorno así, lo difícil no es la máquina sino la cadena de papeles que la rodea: pedidos de clientes con muchas referencias y formatos, albaranes de materia prima y de envase, lotes y caducidades, y transporte frigorífico o urgente. Las empresas auxiliares (envase, plástico, mantenimiento de maquinaria, logística) trabajan con la misma presión de plazos sin tener departamento de sistemas. Por eso proponemos empezar con un solo proceso y ampliar solo si compensa.'],
  poligonosTitulo: 'Los cuatro polígonos de Molina y el eje de la carretera de Madrid',
  poligonos: ['<b>Cuatro polígonos industriales:</b> el directorio de actividades económicas de la Región de Murcia (CREM) recoge La Polvorista, El Tapiado, La Serreta y La Estrella como los polígonos de Molina.', '<b>La Serreta y El Tapiado:</b> en los directorios empresariales aparecen transportistas frigoríficos, distribuidores de alimentación y bebidas y de suministros industriales, un perfil con muchos albaranes y rutas diarias.', '<b>Carretera de Madrid:</b> a lo largo de este eje se sitúan fábricas de golosinas, logística y transporte, según la prensa y los directorios.'],
  sectoresH: 'Dónde ayudamos en las empresas de Molina',
  sectores: [['Golosinas y confitería', 'Muchas referencias, formatos y campañas estacionales. Es habitual que pesen más la planificación de pedidos, el control de lotes y el etiquetado que la propia línea; un asistente para el comercial y el registro automático de pedidos quitan carga a la oficina.'],
    ['Envase, embalaje y plástico', 'Presupuestos por medidas y tiradas, y muchos albaranes de materia prima. Es habitual repetir datos entre pedido, orden de producción y factura; la calculadora de costes y la lectura de albaranes lo recortan.'],
    ['Transporte y logística frigorífica', 'Rutas diarias, albaranes firmados y facturas que dependen de ellos. Lo que más tiempo suele llevarse es conciliar el albarán firmado con el pedido; ahí la gestión documental con IA marca diferencias.'],
    ['Mantenimiento y talleres de la zona', 'Los talleres que atienden a las fábricas viven de partes urgentes y presupuestos rápidos. Un ERP con ficha por máquina y cliente, histórico de averías y avisos de revisión ordena ese ritmo.']],
  comoH: 'Visita corta y proyecto en piloto',
  como: ['<b>Diagnóstico en tu empresa:</b> Molina queda a un paso de nuestra base en Murcia, así que revisamos tus documentos reales sin organizar una jornada de viaje.', '<b>Piloto de un proceso:</b> albaranes de entrada o pedidos de cliente, durante unas semanas; si no ahorra trabajo, no se amplía.', '<b>Formación en tu oficina:</b> si lo prefieres, enseñamos al equipo con sus propios documentos y el resto del soporte va por videollamada o correo.'],
  erp: 'El programa de gestión que usamos con talleres y empresas de oficio es <a class="tc-link" href="/erp-industria/">TransformaConIA Gestión</a>; si ya tienes ERP, también trabajamos conectándolo.',
  caso: { titulo: 'Fabricante de envases «Envases Ficticios, S.L.»', situacion: 'Un fabricante de cajas y bolsas para empresas del dulce, con tres personas en administración que reciben pedidos de varios clientes, cada uno con sus formatos, y los teclean en el programa antes de lanzar producción.', hacemos: 'Se lee el pedido recibido por correo, se compara con el catálogo de formatos y se genera la orden de producción. Administración solo revisa los pedidos con medidas o cantidades dudosas.', resultado: 'En este ejemplo inventado, el equipo pasa de teclear pedidos a revisar excepciones. El ahorro real depende de cada empresa y lo medimos en un piloto con vuestros pedidos.' },
  nota: 'Ejemplo imaginario, sin relación con ninguna empresa existente.',
  faqsH: 'Preguntas de empresas de Molina de Segura',
  faqs: [['¿Qué conviene automatizar primero en una empresa de golosinas o de envases?', 'Suele ser lo que más veces se repite: los pedidos de cliente o los albaranes de materia prima. Se hace un piloto con tus documentos y se compara el tiempo antes y después; no prometemos cifras de antemano.'],
    ['¿Venís a Molina o hay que desplazarse a Murcia?', 'Vamos nosotros. Molina está a unos diez kilómetros de nuestra base, así que el diagnóstico y las revisiones se hacen en tu empresa; la configuración y el soporte van por videollamada.'],
    ['¿Cuánto cuesta el ERP para un taller de la zona?', 'La puesta en marcha son 690 € en dos pagos de 345 €. El mantenimiento son 69 €/mes con los tres primeros meses gratis, cada usuario extra cuesta 15 €/mes desde el primer mes y no hay permanencia. Precios sin IVA; tras la demo recibes el presupuesto cerrado por escrito.']],
  band: ['¿Tienes una fábrica o un taller en Molina?', 'Enséñanos un pedido y un albarán de un día normal y te decimos qué proceso automatizaríamos primero.'],
  fuentes: [['Wikipedia, Molina de Segura (apartado de economía e industria)', 'https://es.wikipedia.org/wiki/Molina_de_Segura'],
    ['El Español, «El municipio español que factura más de 700 millones vendiendo chuches» (11-04-2026)', 'https://www.elespanol.com/sociedad/20260411/municipio-espanol-factura-meur-vendiendo-chuches-empresas-grandes-pais/1003744199290_0.amp.html'],
    ['CARM, Directorio de actividades económicas: establecimientos por polígono industrial (CREM)', 'https://econet.carm.es/inicio/-/crem/sicrem/PU_dirActEconomicas/dir15/pdf/sec17.pdf']],
  cerca: ['alcantarilla', 'cartagena', 'lorca'],
};

/* ------------------------------------------------------------------ LORCA */
C.lorca = {
  nombre: 'Lorca', region: 'Región de Murcia', presencial: true,
  seo: ['IA y ERP para empresas industriales de Lorca', 'ERP y automatización con IA para industria cárnica, agroalimentaria y talleres de Lorca: Saprelorca, La Hoya y La Serrata. Visita y diagnóstico gratis.', 'automatización industria Lorca'],
  h1: 'IA y ERP para la industria cárnica, agroalimentaria y los talleres de Lorca',
  lead: 'Porcino, frío industrial y maquinaria agrícola: en Lorca mandan los albaranes, los lotes y los partes de taller. Los ordenamos con IA sin que cambies de programa.',
  datos: [['Distancia desde Murcia', 'Unos 60 km por la A-7'], ['Visita en tu empresa', 'Sí, con cita; agrupamos visitas'], ['Zonas', 'Saprelorca · La Hoya · La Serrata · Los Peñones'], ['Sector con más peso', 'Porcino y agroalimentación']],
  eb: 'Porcino, agroalimentación y maquinaria', h2a: 'Una industria ligada al campo y a la ganadería',
  intro: ['Lorca tiene un lugar propio en la industria regional por el porcino. El Gobierno regional ha señalado (declaraciones de 2016 recogidas por la prensa agraria) que el porcino supone en torno al 70 % del sector ganadero de la Región y que la comarca del Guadalentín concentra casi la mitad de las explotaciones. Alrededor de esa base crecen el sacrificio, el despiece y los servicios para granjas, y la feria SEPOR, en el recinto ferial IFELOR, reúne cada octubre a ganaderos, industria y proveedores.',
    'El sector está en movimiento: el BORM del 19 de enero de 2026 publicó la autorización ambiental integrada de un proyecto de matadero y sala de despiece en el polígono de La Serrata, con capacidades máximas de hasta 16.000 cerdos al día en matadero y 12.000 canales diarios en despiece (son límites ambientales, no producción real). Más allá de ese caso, lo que une a las empresas de la zona es el volumen de documentación: pesadas, albaranes, lotes, trazabilidad, transporte en frío y facturas a clientes y proveedores.'],
  poligonosTitulo: 'Saprelorca, La Hoya, La Serrata y Los Peñones',
  poligonos: ['<b>Saprelorca:</b> primer polígono planificado de Lorca (1982, según un estudio de la Universidad de Murcia) y el que más establecimientos registra: 263 en el directorio de la CARM de 2015.', '<b>La Hoya y La Serrata:</b> La Hoya concentra empresas agroalimentarias; La Serrata, junto a la carretera de Caravaca, tiene química, curtidos y el proyecto cárnico citado.', '<b>Los Peñones:</b> industria ligera y grandes superficies comerciales, junto a la carretera de Granada.'],
  sectoresH: 'Qué procesos pesan más en las empresas de Lorca',
  sectores: [['Matadero, despiece y transformados cárnicos', 'Pesadas, lotes, etiquetado y trazabilidad hasta el cliente. Es habitual que el albarán de entrada y el de salida se reescriban para la ficha y la facturación; leerlos de forma automática y cruzarlos con el pedido reduce errores y reclamaciones.'],
    ['Servicios y suministros para granjas', 'Pienso, veterinaria, transporte de animales y mantenimiento de naves: muchas rutas y muchos albaranes pequeños. Importa saber qué se ha servido a cada explotación y facturarlo sin olvidos.'],
    ['Maquinaria agrícola y ganadera', 'Reparaciones muy estacionales y a menudo urgentes. Historial por máquina y por cliente, repuestos pedidos al proveedor y un presupuesto con el coste real del trabajo y el margen del taller.'],
    ['Frío industrial y transporte', 'Revisiones periódicas por instalación, avisos de mantenimiento y partes firmados en el sitio. Es habitual que lo que se olvida sea la revisión, no el trabajo.']],
  comoH: 'Con cita en Lorca y remoto para lo demás',
  como: ['<b>Visita con cita y agrupada:</b> Lorca queda a unos 60 km, así que procuramos juntar varias visitas de la zona en una misma jornada.', '<b>Remoto para todo lo demás:</b> configuración, formación y soporte por videollamada.', '<b>Si tu actividad es estacional:</b> planificamos la puesta en marcha para la época baja, no para la campaña.'],
  erp: 'Para el taller o el servicio técnico, el programa es <a class="tc-link" href="/erp-industria/">TransformaConIA Gestión</a>; los precios vigentes están en su <a class="tc-link" href="/erp-industria/#precio">apartado de precio</a>.',
  caso: { titulo: 'Sala de despiece «Despieces Ficticios, S.L.»', situacion: 'Una sala de despiece que recibe canales de varios proveedores. Los albaranes llegan en papel, con pesos y lotes, y alguien los pasa a la hoja de trazabilidad al acabar el turno.', hacemos: 'El albarán se fotografía o llega por correo; se leen proveedor, lote y pesos, se cruzan con el pedido y se alimentan la ficha y la factura de compra. Se revisa solo lo que no cuadra. No sustituye vuestros registros sanitarios obligatorios: los alimenta con menos tecleo.', resultado: 'En este ejemplo inventado, el cierre del turno deja de depender de pasar papeles a mano. El tiempo real que se ahorra se mide en un piloto con vuestros albaranes.' },
  nota: 'Empresa y datos inventados; solo sirven para entender el planteamiento.',
  faqsH: 'Preguntas de empresas de Lorca',
  faqs: [['¿Os desplazáis hasta Lorca o solo trabajáis en Murcia?', 'Vamos a Lorca con cita previa. Queda a unos 60 km, así que juntamos varias visitas de la zona en un mismo día para que sea más económico. El resto del proyecto va en remoto.'],
    ['¿Sirve para una sala de despiece o una empresa de transformados cárnicos?', 'Sí para la parte documental: albaranes, pesos, lotes y facturas. No sustituimos los registros sanitarios obligatorios ni el sistema oficial de trazabilidad: los alimentamos con menos tecleo. Antes de proponer nada hacemos un diagnóstico gratis.'],
    ['¿Cuánto cuesta un ERP para un taller de maquinaria agrícola?', 'Los precios vigentes están en la página del ERP para la industria, en el apartado de precio: puesta en marcha en dos pagos, mantenimiento mensual con tres meses gratis, usuario extra desde el primer mes y sin permanencia. Tras la demo recibes el presupuesto cerrado por escrito.']],
  band: ['¿Tienes una empresa en Lorca?', 'Cuéntanos qué papel te quita más tiempo, un albarán, un parte o un presupuesto, y vemos si merece la pena automatizarlo.'],
  fuentes: [['Wikipedia, Lorca (apartado de economía): polígonos y sectores', 'https://es.wikipedia.org/wiki/Lorca'],
    ['Papeles de Geografía n.º 35 (2002): industria y paisaje urbano de Lorca (Saprelorca, 1982)', 'https://dialnet.unirioja.es/descarga/articulo/291960.pdf'],
    ['CARM, Directorio de actividades económicas: establecimientos por polígono industrial (CREM, 2015)', 'https://econet.carm.es/inicio/-/crem/sicrem/PU_dirActEconomicas/dir15/pdf/sec17.pdf'],
    ['BORM n.º 14, 19-01-2026: autorización ambiental integrada de sala de despiece y matadero en La Serrata', 'https://www.borm.es/services/anuncio/840848/pdf'],
    ['Agronews Castilla y León: SEPOR y el porcino en el Guadalentín (2016)', 'https://www.agronewscastillayleon.com/?p=50296']],
  cerca: ['alcantarilla', 'molina', 'cartagena'],
};

/* ------------------------------------------------------------------ ALCANTARILLA */
C.alcantarilla = {
  nombre: 'Alcantarilla', region: 'Región de Murcia', presencial: true,
  seo: ['Automatización e IA para industria en Alcantarilla', 'ERP y automatización con IA para transporte, talleres y fábricas de Alcantarilla: polígono Oeste, Cabezo Verde y Cañada Hermosa. Visita en el día.', 'automatización industria Alcantarilla'],
  h1: 'Automatización e IA para transportistas, talleres y fábricas de Alcantarilla',
  lead: 'Un municipio pequeño con mucha industria y mucho tránsito: pedidos, rutas y albaranes se multiplican. Estamos a unos minutos y empezamos por el proceso que más papel mueve.',
  datos: [['Distancia desde Murcia', 'Unos 7 km'], ['Visita en tu empresa', 'Sí, normalmente en pocos días'], ['Polígonos', 'Oeste · Cabezo Verde · Cañada Hermosa'], ['Sector con más peso', 'Transporte, metal y alimentación']],
  eb: 'Un nudo industrial junto a Murcia', h2a: 'Poco terreno, muchas empresas',
  intro: ['Alcantarilla tiene apenas 16,6 km² y es, sin embargo, uno de los municipios más industriales de la Región. Su origen fabril está en la conserva: en 1897 Juan Esteva se instaló aquí para continuar el negocio familiar de dulces y conservas de fruta, y la chimenea de su fábrica, de 22 metros, se conserva todavía (Ayuntamiento de Alcantarilla); la Región la incluyó en su inventario de bienes culturales en 2016.',
    'Un estudio de la Universidad de Murcia (Papeles de Geografía, 2005) describe un tejido muy diversificado: un polígono Oeste compartido con la capital, donde destacaban la maquinaria y el material eléctrico, los productos metálicos y la alimentación, y un Cabezo Verde en el que pesaba el transporte. Son datos de hace veinte años y conviene leerlos como una foto del carácter del municipio, no como un censo actual. Esa mezcla de almacén, reparto, taller y fábrica pequeña explica por qué aquí solemos empezar por pedidos, albaranes y rutas, y dejar para después el ERP.'],
  poligonosTitulo: 'Polígono Oeste, Cabezo Verde y Cañada Hermosa',
  poligonos: ['<b>Polígono Oeste:</b> el mayor espacio industrial del municipio (227 hectáreas en Alcantarilla, compartido con Murcia). En 2005 reunía más del 60 % de los establecimientos registrados, con casi todas las ramas y más empresas de servicios que de producción.', '<b>Cabezo Verde:</b> al norte del casco urbano, de iniciativa privada; en 2005 tenía 55 empresas y la rama más numerosa era la del transporte, con el 34,5 % de los establecimientos.', '<b>Cañada Hermosa y El Potrox:</b> Cañada Hermosa, al noroeste, tiene la química como primera industria instalada; El Potrox, al oeste, es más pequeño, con transporte, productos metálicos y química.'],
  sectoresH: 'Qué procesos pesan más en las empresas de Alcantarilla',
  sectores: [['Transporte y distribución', 'Alcantarilla tiene tradición de transporte por su posición de nudo de comunicaciones. Es habitual que la oficina viva de conciliar albaranes firmados con pedidos y de facturar rutas; la lectura automática del albarán y los avisos de pendientes ordenan ese final de mes.'],
    ['Maquinaria, material eléctrico y metal', 'Presupuestos y pedidos con mucha variedad de referencias. Una calculadora con el coste real y el margen de la empresa, y un asistente que busca el material por descripción, evitan consultas repetidas.'],
    ['Alimentación y envase', 'Además de la tradición conservera, quedan fábricas de alimentación y proveedores. Albaranes de entrada, lotes y facturas de proveedor son lo que más se repite en la oficina.'],
    ['Talleres y servicios técnicos', 'Partes de trabajo, mantenimientos programados por cliente y cobros. Un ERP usable desde el móvil de cada operario cierra el círculo entre el trabajo hecho y la factura.']],
  comoH: 'Visita en el día y piloto pequeño',
  como: ['<b>Visita en minutos:</b> estamos en Murcia, así que pasar por tu nave de Alcantarilla no exige organizar una jornada de viaje.', '<b>Piloto de un proceso:</b> empezamos por uno, por ejemplo los albaranes firmados, y lo ampliamos solo si funciona.', '<b>Soporte cercano:</b> ante una duda podemos acercarnos en persona o resolverla por videollamada.'],
  erp: 'Cuando el proceso pequeño funciona, el siguiente paso puede ser <a class="tc-link" href="/erp-industria/">TransformaConIA Gestión</a>, el ERP para la industria; no es obligatorio.',
  caso: { titulo: 'Empresa de transporte «Transportes Ficticios del Segura, S.L.»', situacion: 'Una empresa de transporte con una veintena de camiones. Los albaranes firmados llegan en papel a la oficina días después y las facturas esperan a que alguien los junte con los pedidos.', hacemos: 'El conductor fotografía el albarán firmado desde el móvil; se lee, se enlaza con el pedido y la ruta y se marca como facturable. La oficina solo revisa los albaranes con firma dudosa o cantidades distintas.', resultado: 'En este ejemplo inventado, la facturación deja de esperar a los papeles. El efecto real se prueba antes en un piloto con tus albaranes.' },
  nota: 'Este ejemplo es ficticio: nombre, flota y situación están inventados.',
  faqsH: 'Preguntas de empresas de Alcantarilla',
  faqs: [['¿Podéis venir esta semana a una nave del polígono Oeste?', 'Normalmente buscamos hueco para el diagnóstico gratis en pocos días. Alcantarilla queda a unos 7 km de Murcia, así que no hay que organizar un viaje.'],
    ['¿Por dónde empezar en una empresa de transporte o distribución?', 'Por los albaranes firmados: es el papel que más se retrasa y del que depende la factura. Con un piloto sobre tus propios albaranes se ve en pocas semanas si merece la pena ampliarlo.'],
    ['¿Tengo que cambiar el programa que uso para facturar?', 'No necesariamente. Si tu programa tiene API, nos conectamos directamente; si no la tiene, valoramos cómo adaptarlo. El ERP propio es una opción, no una obligación, y sus precios están en la página del ERP, apartado de precio.']],
  band: ['¿Tu empresa está en Alcantarilla?', 'Dinos cuántos albaranes y pedidos mueves a la semana y qué te cuesta más cerrarlos; con eso te proponemos un primer piloto.'],
  fuentes: [['Papeles de Geografía n.º 41-42 (2005): «El espacio industrial en Alcantarilla» (Universidad de Murcia)', 'https://revistas.um.es/geografia/article/view/44391'],
    ['Ayuntamiento de Alcantarilla, historia de la fábrica de conservas Esteva', 'https://alcantarilla.es/?p=47131']],
  cerca: ['molina', 'lorca', 'cartagena'],
};

/* ------------------------------------------------------------------ ELCHE */
C.elche = {
  nombre: 'Elche', region: 'Comunidad Valenciana', presencial: false,
  seo: ['IA y automatización para empresas de calzado de Elche', 'Automatización con IA y ERP para calzado, componentes y talleres de Elche: Carrús y Elche Parque Empresarial. Remoto y al mismo precio que en Murcia.', 'automatización industria Elche'],
  h1: 'IA y automatización para fábricas de calzado y componentes de Elche',
  lead: 'Muchas referencias, series cortas y márgenes ajustados: en Elche, el control de costes y de pedidos pesa más que nunca. Trabajamos en remoto, con visita presencial bajo petición.',
  datos: [['Modo de trabajo', 'Remoto, por videollamada'], ['Visita presencial', 'Bajo petición, gastos a convenir'], ['Precio', 'El mismo que en Murcia'], ['Zonas', 'Carrús · Elche Parque Empresarial']],
  eb: 'Calzado, componentes y comercio mayorista', h2a: 'Un sector que busca eficiencia',
  intro: ['Elche es uno de los centros del calzado español, pero el sector atraviesa un ajuste duro. Según la asociación de componentes AEC (junio de 2026), las empresas fabricantes de calzado en España pasaron de 3.280 en 2020 a 2.131 en 2025, y el calzado y la marroquinería perdieron 3.670 empleos en 2025. En ese contexto, las pymes que siguen ganan por eficiencia: saber cuánto cuesta de verdad cada serie, no equivocarse con los pedidos y facturar a tiempo.',
    'El polígono de Carrús lo ilustra. Una encuesta que presentó su comunidad de propietarios (Alicante Plaza, mayo de 2024) hablaba de unas 10.000 personas trabajando allí, un 72 % de micropymes y cerca del 40 % de empresas dedicadas a fabricar o comercializar calzado. Son equipos administrativos pequeños, con mucha variedad de modelos, tallas y colores y pocas horas para dedicar a la tecnología. Por eso tiene sentido empezar por un único proceso, en remoto, con tus propios documentos.',
    'Trabajamos en remoto desde Murcia: diagnóstico por videollamada, configuración con documentación compartida y soporte por correo o teléfono. Si prefieres vernos en persona, la visita se hace bajo petición, con los gastos acordados antes, y el precio es el mismo que en Murcia.'],
  poligonosTitulo: 'Carrús, Elche Parque Empresarial y Altabix',
  poligonos: ['<b>Carrús:</b> en la encuesta citada, la fabricación de calzado aportaba el 20 % de los ingresos de explotación y el comercio mayorista de ropa y calzado el 12 %. El 67 % de las empresas tiene menos de diez trabajadores.', '<b>Elche Parque Empresarial:</b> uno de los polígonos que el Ayuntamiento mantiene como industriales, junto a Carrús y el parque agroalimentario (Alicante Plaza, 2020).', '<b>Altabix:</b> el Ayuntamiento planteaba reconvertirlo en zona comercial y de servicios, así que no lo tomamos como foco industrial.'],
  sectoresH: 'Dónde puede ahorrar tiempo una empresa de Elche',
  sectores: [['Calzado: fabricantes y marcas pequeñas', 'Cada modelo se multiplica por tallas y colores. Es habitual que el pedido llegue por correo o WhatsApp y se reescriba en una hoja de cálculo; leerlo y validarlo contra el catálogo evita errores de talla o de referencia.'],
    ['Componentes e industria auxiliar', 'Suelas, hormas, cortes, cartonaje: series cortas y presupuestos hechos a mano. Una calculadora con el coste de material y mano de obra y tu margen mantiene el precio al día cuando cambia una materia prima.'],
    ['Comercio mayorista y logística de calzado', 'Devoluciones, cambios de talla y albaranes de muchos clientes. Conciliar lo que sale con lo que vuelve suele ser el trabajo que más se acumula en la oficina.'],
    ['Mantenimiento de maquinaria', 'Talleres que reparan máquinas de las fábricas de la zona: parte por máquina, histórico de averías y repuestos pedidos al proveedor.']],
  comoH: 'Remoto de principio a fin, visita si hace falta',
  como: ['<b>Todo en remoto:</b> diagnóstico, configuración, formación y soporte por videollamada y con documentación compartida.', '<b>Visita presencial bajo petición:</b> si quieres que vayamos a tu empresa, acordamos los gastos de desplazamiento antes de ir.', '<b>Mismo precio que en Murcia:</b> no cobramos más por estar en Elche; el presupuesto cerrado te lo damos por escrito antes de empezar.'],
  erp: 'Si buscas un programa de gestión para un taller o una empresa de componentes, mira <a class="tc-link" href="/erp-industria/">TransformaConIA Gestión</a>; sus precios están en el <a class="tc-link" href="/erp-industria/#precio">apartado de precio</a>.',
  caso: { titulo: 'Taller de corte y aparado «Cortes Ficticios, S.L.»', situacion: 'Un taller que recibe pedidos de varias marcas con cientos de combinaciones de modelo, talla y color, anotados en una hoja de cálculo distinta por cliente.', hacemos: 'Se leen los pedidos del correo o del PDF, se validan contra el catálogo de modelos y se genera una única hoja de producción. Solo se revisan las combinaciones que no existen.', resultado: 'En este ejemplo ficticio, el administrativo deja de reescribir pedidos y revisa excepciones. El ahorro real se mide en un piloto con pedidos de verdad.' },
  nota: 'Caso de ficción creado para esta página; nada de lo que cuenta ha ocurrido.',
  faqsH: 'Preguntas de empresas de Elche',
  faqs: [['¿Trabajáis con empresas de Elche si estáis en Murcia?', 'Sí. Trabajamos en remoto: el diagnóstico es una videollamada y el resto del proyecto se comparte en línea. La visita presencial es posible bajo petición, con los gastos de desplazamiento acordados antes, y el precio es el mismo que en Murcia.'],
    ['¿Merece la pena automatizar en un momento tan duro para el calzado?', 'No prometemos milagros. El diagnóstico gratuito sirve para ver si tu empresa tiene procesos repetitivos (pedidos, albaranes, presupuestos) cuyo ahorro de tiempo compense. Si no es el caso, te lo decimos.'],
    ['¿Hay ayudas de la Comunitat Valenciana para digitalizar una pyme?', `El IVACE abrió la convocatoria Digitaliza-CV del 15 de enero al 3 de marzo de 2026, ya cerrada (consultado el ${CONSULTA}). Una guía técnica sitúa su presupuesto mínimo subvencionable en torno a 20.000 €, por lo que está pensada para proyectos de cierta envergadura. Vigila la siguiente convocatoria y comprueba las bases; no podemos garantizar que un servicio nuestro sea subvencionable.`]],
  band: ['¿Tienes una empresa en Elche?', 'Haz una videollamada de diagnóstico con nosotros: nos cuentas cómo entra un pedido y cómo sale la factura, y te decimos qué automatizaríamos primero.'],
  fuentes: [['Alicante Plaza, «Radiografía del Polígono de Carrús de Elche» (12-05-2024)', 'https://alicanteplaza.es/alicanteplaza/poligono-carrus-elche'],
    ['Alicante Plaza, planes de Elche para el polígono de Altabix (30-01-2020)', 'https://alicanteplaza.es/alicanteplaza/de-enclave-empresarial-a-zona-comercial-los-planes-de-elche-para-el-poligono-de-altabix'],
    ['Alicante Plaza, AEC alerta del deterioro del sector del calzado y sus componentes (18-06-2026)', 'https://alicanteplaza.es/alicanteplaza/elcheplaza/aec-alerta-del-deterioro-del-sector-del-calzado-y-sus-componentes-y-exige-un-plan-industrial-urgente'],
    ['Leyton, guía técnica de IVACE Digitaliza-CV 2026 (enero de 2026)', 'https://leyton.com/wp-content/blogs.dir/11/files/2025/12/LeytonIberia_WP_IVACE-Digitaliza-Comunidad-Valenciana_2026.pdf']],
  cerca: ['albacete', 'cartagena', 'lorca'],
};

/* ------------------------------------------------------------------ ALBACETE */
C.albacete = {
  nombre: 'Albacete', region: 'Castilla-La Mancha', presencial: false,
  seo: ['Automatización e IA para empresas de Albacete', 'IA, ERP y automatización para cuchillería, calderería y logística en Campollano y Romica (Albacete). Remoto, visita bajo petición y mismo precio.', 'automatización industria Albacete'],
  h1: 'Automatización e IA para cuchillería, calderería y logística de Albacete',
  lead: 'Campollano reúne cientos de empresas de oficios muy distintos. Trabajamos en remoto, con visita bajo petición y el mismo precio que en Murcia.',
  datos: [['Modo de trabajo', 'Remoto, por videollamada'], ['Visita presencial', 'Bajo petición, gastos a convenir'], ['Precio', 'El mismo que en Murcia'], ['Zonas', 'Campollano · Romica']],
  eb: 'Cuchillería, oficios y logística', h2a: 'Un parque con cientos de empresas y muchos oficios',
  intro: ['Campollano es el gran parque empresarial de la ciudad, con cientos de empresas de sectores muy distintos, y está gestionado por su asociación de empresarios, ADECA. La cuchillería tiene presencia allí, y también la logística y el transporte. No hemos localizado una cifra oficial reciente de empresas ni de empleos, así que no la damos.',
    'La cuchillería es la seña de identidad: el Consejo de Gobierno regional declaró la Navaja y el Cuchillo Clásico de Albacete bien de interés cultural inmaterial en mayo de 2017. Es un oficio de series con muchos modelos y variantes (hoja, mango, acabado), donde el catálogo y el presupuesto a medida consumen horas. En Campollano y Romica hay además naves de transporte y logística.',
    'Trabajamos con Albacete en remoto desde Murcia: diagnóstico por videollamada, configuración compartida y formación en línea. La visita presencial se hace bajo petición, con los gastos de desplazamiento acordados antes, y el precio es el mismo que en Murcia.'],
  poligonosTitulo: 'Campollano, Romica y ADECA',
  poligonos: ['<b>Campollano:</b> el gran parque empresarial de la ciudad, gestionado por ADECA, que ofrece a sus asociados servicios de empleo, formación y subvenciones. ADECA informaba en julio de 2026 de avances para desdoblar el puente de acceso.', '<b>Romica:</b> en los directorios aparecen naves de logística y transporte y empresas de madera; no hemos encontrado un censo oficial por sectores, así que no hacemos afirmaciones más allá de eso.', '<b>Si eres asociado de ADECA:</b> pregunta por sus servicios de subvenciones antes de decidir cualquier inversión en digitalización.'],
  sectoresH: 'Dónde puede ahorrar tiempo una empresa de Albacete',
  sectores: [['Cuchillería y navajas', 'Catálogos con muchos modelos, hojas, mangos y acabados, y pedidos de series a medida. Es habitual que las consultas del comercial dependan de quien conoce el catálogo de memoria; un asistente técnico y una calculadora de costes por serie lo dejan por escrito.'],
    ['Calderería y maquinaria para el propio sector', 'Talleres de oficio con presupuestos a medida y plazos ajustados. Controlar horas, material y cambios de cada pedido hasta la factura suele ser lo que más cuesta.'],
    ['Mueble y carpintería', 'Presupuestos por medidas y materiales, con varios oficios en cada pedido. Partes de trabajo y control de materiales por pedido evitan sorpresas al facturar.'],
    ['Logística y distribución', 'Albaranes firmados, devoluciones y rutas. Conciliar lo entregado con lo pedido es la tarea que más se retrasa en la oficina.']],
  comoH: 'Sin viajar, y con visita si la pides',
  como: ['<b>Remoto de principio a fin:</b> diagnóstico por videollamada, configuración compartida y formación en línea.', '<b>Visita presencial bajo petición:</b> para proyectos mayores podemos desplazarnos; los gastos se acuerdan antes de ir.', '<b>Mismo precio que en Murcia:</b> el presupuesto es el mismo estés donde estés y lo recibes cerrado y por escrito.'],
  erp: 'Para el taller o la fábrica con trabajo a medida, tienes el programa de gestión <a class="tc-link" href="/erp-industria/">TransformaConIA Gestión</a>; los precios están en el <a class="tc-link" href="/erp-industria/#precio">apartado de precio</a>.',
  caso: { titulo: 'Taller de cuchillería «Navajas Ficticias, S.L.»', situacion: 'Un taller familiar que fabrica series de navajas y cuchillos personalizados para comercios y regalo de empresa. Cada presupuesto exige sumar a mano hoja, mango, grabado y acabado.', hacemos: 'Una calculadora de costes con las operaciones de cada modelo (corte, temple, montaje, grabado) y el margen del taller. El comercial saca el precio de una serie en la reunión y el pedido aceptado pasa a producción con sus partes.', resultado: 'En este ejemplo ficticio, el presupuesto sale en la misma conversación y no depende de una sola persona. Los números reales se ven en un piloto con vuestros modelos.' },
  nota: 'Ejemplo ficticio: ni la empresa ni sus modelos existen.',
  faqsH: 'Preguntas de empresas de Albacete',
  faqs: [['¿Podéis trabajar con una empresa de Albacete sin venir?', 'Sí. Trabajamos en remoto: videollamada, documentación compartida y soporte por correo o teléfono. Si prefieres una visita presencial, se hace bajo petición, con los gastos acordados de antemano, y el precio es el mismo que en Murcia.'],
    ['¿Sirve un asistente de catálogo para cuchillería, con tantos modelos y variantes?', 'Sí: responde con la ficha, las variantes y el precio, y pasa a una persona lo que no sabe. Antes lo probamos sobre una parte de tu catálogo para comprobar la calidad de las respuestas; el precio depende del tamaño del catálogo y se te da por escrito.'],
    ['¿Existen ayudas de Castilla-La Mancha para digitalizar una pyme?', `La Junta tiene líneas del plan Adelante. Según un resumen de PNO Innovation del 15-06-2026, la de transformación digital de la industria manufacturera financia hasta el 50 % con un presupuesto mínimo de 15.000 € y hasta 120.000 € por proyecto (consultado el ${CONSULTA}). Compruébalo en las bases oficiales; ningún servicio nuestro está garantizado como subvencionable.`]],
  band: ['¿Tienes una empresa en Albacete?', 'Reserva una videollamada y cuéntanos cómo preparas hoy un presupuesto o un pedido; te decimos qué mejoraríamos primero.'],
  fuentes: [['ADECA, Asociación de Empresarios de Campollano', 'https://www.adeca.com'],
    ['El Digital Castilla-La Mancha, la cuchillería de Albacete y su declaración como bien de interés cultural (09-09-2018)', 'https://www.elespanol.com/eldigitalcastillalamancha/region/albacete/20180909/noticia-cuchilleria-no-pasar-desapercibida-feria-albacete/336717081_0.html'],
    ['PNO Innovation, tres oportunidades de financiación en Castilla-La Mancha (15-06-2026)', 'https://www.pnoinnovation.com/es/insights/tres-oportunidades-de-financiacion-para-impulsar-el-crecimiento-la-innovacion-y-la-digitalizacion-en-castilla-la-mancha/']],
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

// Bloque de enlaces entre las páginas locales (id fijo)
const enlaces = (slug) => {
  const otras = Object.keys(L).filter((k) => k !== slug);
  const lista = otras.map((k) => '<a class="tc-link" href="' + L[k][1] + '">automatización industrial en ' + L[k][0] + '</a>').join(', ');
  return '<section class="tc-sec tc-sec--tight" id="otras-ciudades"><div class="tc-wrap"><div class="tc-prose tc-reveal"><h3>Dónde más trabajamos</h3><p>Volver a <a class="tc-link" href="/consultor-ia-murcia/">consultoría de IA en Murcia y toda la región</a>. También tenemos página para ' + lista + ', y trabajamos en toda España en remoto. Conoce <a class="tc-link" href="/erp-industria/">el ERP para la industria</a> o <a class="tc-link" href="/contacto/">escríbenos</a>.</p></div></div></section>';
};

const NOTAS = {
  'Cartagena': 'Las cifras llevan la fecha de cada documento y pueden haber cambiado; sirven para entender el contexto de la comarca, no como censo.',
  'Molina de Segura': 'Alguna cifra histórica procede de fuentes de hace años; la tomamos como contexto, nunca como dato actual de ninguna empresa.',
  'Lorca': 'Las magnitudes del proyecto cárnico son máximos de la autorización ambiental y no representan producción real.',
  'Alcantarilla': 'El estudio de la Universidad de Murcia es de 2005: refleja el carácter del municipio, no su censo de hoy.',
  'Elche': 'La encuesta de Carrús la presentó la comunidad de propietarios del polígono; no sabemos qué entidad la elaboró y la citamos con esa cautela.',
  'Albacete': 'No hemos localizado un censo oficial actualizado de Campollano, por eso no damos cifras de empresas ni de empleo.',
};
const fuentesBloque = (c) => `<section class="tc-sec tc-sec--tight" id="fuentes"><div class="tc-wrap"><div class="tc-prose tc-reveal"><h3>Fuentes consultadas</h3><p>Datos sobre ${c.nombre} revisados el ${CONSULTA}. ${NOTAS[c.nombre]}</p>${list(c.fuentes.map(([t, u]) => `<a class="tc-link" href="${H(u)}" rel="nofollow noopener" target="_blank">${H(t)}</a>`))}</div></div></section>`;

const html = (slug, c) => page(`${pagehead(`<a href="/consultor-ia-murcia/">Región de Murcia</a><span aria-hidden="true">/</span><span>${c.nombre}</span>`, `Industria en ${c.nombre}`, c.h1, c.lead,
    btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/erp-industria/', 'Ver el ERP para la industria', true), facts(`Trabajamos en ${c.nombre}`, c.datos))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow(c.eb)}<h2>${c.h2a}</h2>${c.intro.map((p) => `<p>${p}</p>`).join('')}</div><div class="tc-box tc-reveal"><h3>${c.poligonosTitulo}</h3>${list(c.poligonos)}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Sectores', c.sectoresH)}<div class="tc-grid tc-reveal" style="display:grid;gap:14px;grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">${c.sectores.map(([t, d]) => `<div class="tc-box"><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="tc-sec"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Cómo trabajamos')}<h2>${c.comoH}</h2>${list(c.como)}<p>${c.erp}</p></div><div class="tc-box tc-reveal"><span class="tc-eyebrow">Ejemplo ficticio</span><h3>${c.caso.titulo}</h3><p><i>${c.nota}</i></p><p><b>Situación.</b> ${c.caso.situacion}</p><p><b>Qué hacemos.</b> ${c.caso.hacemos}</p><p><b>Resultado.</b> ${c.caso.resultado}</p></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', c.faqsH)}${faq(c.faqs)}</div></section>
${fuentesBloque(c)}
${enlaces(slug)}
${band(...c.band)}
<script type="application/ld+json">${ficha(slug, c)}</script>`);

// ---------- comprobaciones ----------
const seen = new Set();
for (const [k, c] of Object.entries(C)) {
  if (c.seo[0].length > 60) throw new Error(`title >60 en ${k}: ${c.seo[0].length}`);
  if (c.seo[1].length > 155) throw new Error(`description >155 en ${k}: ${c.seo[1].length}`);
  if (c.faqs.length !== 3) throw new Error(`${k}: debe tener 3 FAQ`);
  for (const s of [c.seo[0], c.seo[1]]) { if (seen.has(s)) throw new Error('SEO repetido: ' + s); seen.add(s); }
}

const args = process.argv.slice(2);
const T3 = args.includes('--t3');
const solo = args.filter((x) => !x.startsWith('--'));
const dry = process.env.DRY === '1';
const palabras = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').split(/\s+/).filter(Boolean).length;

for (const [k, c] of Object.entries(C)) {
  if (solo.length && !solo.includes(k)) continue;
  const slug = L[k][1].replace(/\//g, '');
  const content = html(k, c);
  if (dry && process.env.DUMP) { fs.mkdirSync(process.env.DUMP, { recursive: true }); fs.writeFileSync(process.env.DUMP + '/' + k + '.html', content); }
  if (dry) { console.log(slug, 'title', c.seo[0].length, 'desc', c.seo[1].length, 'bytes', content.length, 'palabras', palabras(content)); continue; }
  const f = await wp('GET', `/wp/v2/pages?slug=${slug}&status=publish,draft,pending,private&_fields=id,status`);
  const ex = f.data?.[0];
  if (ex?.status === 'publish') {
    if (!T3) { console.log(slug, 'ya publicada: no se toca (usa --t3 para la actualización de la tanda 3)'); continue; }
    // Copia de seguridad (contenido raw + metadatos Rank Math) y actualización COMPLETA
    const cur = (await wp('GET', '/wp/v2/pages/' + ex.id + '?context=edit&_fields=id,title,content,meta')).data || {};
    fs.mkdirSync(BK3, { recursive: true });
    const bkf = BK3 + 'page-' + ex.id + '.html';
    if (!fs.existsSync(bkf)) { fs.writeFileSync(bkf, cur.content?.raw || ''); fs.writeFileSync(BK3 + 'page-' + ex.id + '.meta.json', JSON.stringify({ title: cur.title?.raw, meta: cur.meta }, null, 1)); }
    const r2 = await wp('POST', '/wp/v2/pages/' + ex.id, { content, meta: { rank_math_title: c.seo[0], rank_math_description: c.seo[1], rank_math_focus_keyword: c.seo[2] } });
    console.log(slug, 'actualizada (tanda 3):', r2.status, r2.data?.link);
    continue;
  }
  const body = { title: `Automatización e IA para la industria en ${c.nombre}`, slug, status: 'draft', content, template: '', comment_status: 'closed', author: 2, meta: { rank_math_title: c.seo[0], rank_math_description: c.seo[1], rank_math_focus_keyword: c.seo[2] } };
  const r = ex ? await wp('POST', `/wp/v2/pages/${ex.id}`, body) : await wp('POST', '/wp/v2/pages', body);
  console.log(slug, r.status, r.data?.id, r.data?.status, `https://transformaconia.com/?page_id=${r.data?.id}&preview=true`);
}
