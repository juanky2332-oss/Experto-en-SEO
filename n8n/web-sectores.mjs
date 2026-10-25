// Páginas propias por sector industrial de transformaconia.com.
// Uso:
//   DRY=1 node --env-file=.env.local n8n/web-sectores.mjs   -> cuenta palabras y comprueba longitudes sin tocar la web (DUMP=carpeta guarda el HTML)
//   node --env-file=.env.local n8n/web-sectores.mjs [slug-corto ...]  -> crea o actualiza (publicada) con copia previa en _backups/sectores/
// /distribucion-industrial/ ya existe y cubre la distribución técnica: no se duplica, solo se enlaza.
// No toca web-paginas.mjs ni el snippet 13. Ejemplos SIEMPRE ficticios; precios solo con enlace a /erp-industria/#precio.
import fs from 'node:fs';
import { wp } from './gw.mjs';
const BK = '_backups/sectores/';

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
// Cada pregunta es un H3 dentro del <summary>; el JSON alimenta el FAQPage que genera el snippet 13
const faq = (items) => `<div class="tc-faq tc-reveal">${items.map(([q, a]) => `<details><summary><h3>${H(q)}</h3></summary><p>${H(a)}</p></details>`).join('')}</div>
<script type="application/json" class="tc-faq-data">${JSON.stringify(items).replace(/</g, '\\u003c')}</script>`;
const sec = (inner, cls = '') => `<section class="tc-sec ${cls}"><div class="tc-wrap">${inner}</div></section>`;
const band = (h, p, b) => sec(`<div class="tc-band tc-reveal"><div><h2>${h}</h2><p>${p}</p></div><div class="tc-btns">${b}</div></div>`, 'tc-sec--tight');
const shot = (src, alt, cap = '') => `<figure class="tc-shot"><div class="tc-shot__bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${src}" width="1440" height="900" alt="${alt}" loading="lazy" decoding="async">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const CAP = JSON.parse(fs.readFileSync(new URL('./web-capturas-industria.json', import.meta.url), 'utf8'));

const CTA = '/contacto/';
const S = {};

/* ============================================================ TALLERES */
S.talleres = {
  slug: 'ia-talleres-industriales', titulo: 'IA para talleres industriales',
  seo: ['Software de gestión para taller industrial con IA', 'Software de gestión para taller industrial: presupuestos con coste hora-máquina y margen, partes y albaranes firmados en el móvil. Diagnóstico gratis.', 'software gestión taller industrial'],
  eb: 'Mecanizado, calderería y reparación',
  h1: 'Software de gestión para taller industrial, con IA que te quita el papeleo',
  lead: 'Un taller vive de dos cosas: cobrar lo que de verdad cuesta cada trabajo y entregarlo a tiempo. Ordenamos presupuestos, partes, albaranes y facturas para que el jefe vuelva a estar en la nave y no en el despacho.',
  datos: [['Para quién', 'Mecanizado, calderería, reparación'], ['Primer paso', 'Diagnóstico gratis por escrito'], ['Piloto', 'Con tus propios trabajos, 1 a 3 semanas'], ['Dónde', 'Región de Murcia y remoto en toda España']],
  introEb: 'El problema de siempre', introH: 'Se fabrica bien y se cobra mal',
  boxH: 'Encaja si te suena',
  box: ['Presupuestas «a ojo» o con una hoja propia', 'Los albaranes se pierden entre el taller y la oficina', 'Facturas que salen tarde y cobros que se olvidan', 'Quien sabe calcular un trabajo es siempre la misma persona'],
  qH: 'Qué automatizamos en un taller industrial',
  cards: [['Presupuestos con tu coste real', 'Una calculadora suma material, operaciones y coste hora-máquina de cada equipo, aplica tu margen y devuelve el precio. Si antes necesitas entender cómo sacar esa hora, tenemos <a class="tc-link" href="/coste-hora-maquina-taller/">una guía del coste hora-máquina</a>.'],
    ['Oferta a partir del plano o la petición', 'El correo del cliente o el plano adjunto se lee, se extraen medidas, material y cantidades, y se prepara un borrador de oferta para que lo revises en lugar de teclearlo.'],
    ['Partes de trabajo desde el móvil', 'El operario apunta horas, material y fotos del trabajo en el móvil. Lo que antes eran papeles al final de la semana llega ordenado por pedido.'],
    ['Albaranes firmados por el cliente', 'El cliente firma en el teléfono al recoger o al entregar. El albarán queda guardado con su firma y pasa a factura sin volver a escribirlo.'],
    ['Facturación y cobros', 'De la factura al vencimiento: avisos de lo que está sin cobrar, recordatorios y un resumen de lo facturado, cobrado y pendiente cada mes.'],
    ['Histórico por cliente y por pieza', 'Si el cliente repite, encuentras en segundos cómo se hizo, cuánto costó y a qué precio se vendió. El conocimiento deja de estar en la cabeza de una persona.']],
  gridCls: 'tc-grid--3',
  comoH: 'Cómo lo hacemos en tu taller',
  pasos: [['Diagnóstico por escrito', 'Nos cuentas cómo sale hoy un trabajo, desde la petición hasta el cobro, y te enviamos dónde se pierde más tiempo y qué parte del flujo conviene atacar primero.'],
    ['Piloto con tus trabajos', 'Metemos tus últimos presupuestos y albaranes en el programa y rehacemos algunos para comparar. Tú decides si el cálculo coincide con tu criterio.'],
    ['Implantación en el día a día', 'Configuramos máquinas, tarifas, clientes y usuarios, formamos al encargado y al personal de oficina y dejamos los partes funcionando en los móviles.'],
    ['Mantenimiento y mejoras', 'Seguimos de cerca las primeras semanas, resolvemos dudas y añadimos lo que el uso va pidiendo, siempre acordado antes.']],
  ejH: 'Un día cualquiera en un taller de ejemplo', ejTitulo: 'Taller «Mecanizados Ejemplo, S.L.»',
  ej: ['<b>Situación.</b> Un taller pequeño de torneado y fresado recibe peticiones por correo. El encargado calcula cada precio de memoria y la administrativa pasa los partes a mano los lunes.', '<b>Qué hacemos.</b> Cargamos las máquinas con su coste hora y las operaciones habituales; la petición se convierte en borrador de oferta; el operario cierra el parte en el móvil y el cliente firma el albarán al recoger. La factura se genera desde ese albarán.', '<b>Resultado.</b> El precio deja de depender de una sola persona y la factura sale al entregar. No ponemos cifras de ahorro porque dependen de cada taller: se miden en el piloto con tus datos.'],
  ejNota: 'Empresa y situación inventadas para ilustrar; no existe ningún taller con ese nombre.',
  ejShot: [CAP.calculadora.url, CAP.calculadora.alt, 'Captura de IndunexIA · Datos ficticios'],
  rel: [['/erp-industria/', 'IndunexIA', 'el programa de gestión para la industria: presupuesto, parte, albarán, factura y cobro en un solo sitio, con precios en su <a class="tc-link" href="/erp-industria/#precio">apartado de precio</a>.'],
    ['/automatizacion-procesos-ia/', 'Automatización de procesos', 'para lo que no entra en el programa: avisos, correos de clientes y tareas repetitivas del taller.'],
    ['/gestion-documental-ia/', 'Gestión documental con IA', 'facturas de proveedor y albaranes de material que se leen y se archivan solos.'],
    ['/agentes-chatbots-ia/', 'Asistentes y chatbots', 'para atender consultas de clientes sobre estado de pedidos o plazos.'],
    ['/desarrollo-a-medida-ia/', 'Desarrollo a medida', 'si tu taller tiene un proceso muy propio que ningún programa cubre.']],
  faqs: [['¿Qué es lo primero que conviene ordenar en un taller industrial?', 'Casi siempre el presupuesto, porque de él depende el margen de todo lo demás. Si sabes lo que te cuesta cada hora de cada máquina y cada operación, el precio deja de ser una apuesta. Después se enlazan el parte y el albarán.'],
    ['¿Sirve para talleres de calderería o de reparación, no solo de mecanizado?', 'Sí. El programa nació en talleres de mecanizado, pero la calculadora sirve para cualquier trabajo o servicio: calcula lo que te cuesta a ti para que le pongas tu margen. En calderería se añaden kilos y soldadura; en reparación, horas de técnico y repuestos.'],
    ['¿Puedo seguir usando mi programa de facturación actual?', 'Depende del programa. Si tiene API, nos conectamos de forma directa; si no la tiene, valoramos cómo adaptarlo. En el diagnóstico lo miramos con tu caso real, sin compromiso.'],
    ['¿Cuánto cuesta y qué compromiso hay?', 'Los precios orientativos están publicados en la página del ERP, en su apartado de precio, y el presupuesto definitivo se te da por escrito tras el diagnóstico. No hay permanencia: se avisa con 30 días.']],
  band: ['¿Quieres saber cuánto te cuesta de verdad cada trabajo?', 'Pide el diagnóstico gratis y mándanos un presupuesto reciente: te enviamos por escrito cómo quedaría.'],
};

/* ============================================================ MANTENIMIENTO */
S.mantenimiento = {
  slug: 'ia-mantenimiento-industrial', titulo: 'IA para mantenimiento industrial',
  seo: ['IA para mantenimiento industrial: órdenes y repuestos', 'IA para mantenimiento industrial: avisos que pasan a órdenes de trabajo, repuestos y stock, partes digitales y manuales consultables. Diagnóstico gratis.', 'IA mantenimiento industrial'],
  eb: 'Mantenimiento y servicio técnico',
  h1: 'IA para mantenimiento industrial: de la avería a la orden de trabajo sin llamadas ni papeles',
  lead: 'Un servicio técnico mide su trabajo en tiempo de respuesta. Hacemos que el aviso llegue ya clasificado, que el técnico encuentre el manual y el repuesto y que el informe de intervención no se escriba dos veces.',
  datos: [['Para quién', 'Mantenimiento y servicios técnicos'], ['Primer paso', 'Diagnóstico gratis por escrito'], ['Piloto', 'Con tus avisos y tus equipos reales'], ['Dónde', 'Región de Murcia y remoto en toda España']],
  introEb: 'Entre la urgencia y el papel', introH: 'El mantenimiento sufre cuando la información llega tarde',
  boxH: 'Encaja si te pasa',
  box: ['Los avisos llegan por varias vías y se pierden', 'El técnico no sabe qué se hizo antes en esa máquina', 'Faltan repuestos justo cuando se necesitan', 'Los informes se redactan a mano al volver'],
  qH: 'Qué ordenamos en una empresa de mantenimiento',
  cards: [['Avisos convertidos en órdenes', 'El mensaje del cliente se interpreta, se asocia al equipo y a la instalación y se crea la orden de trabajo con su prioridad. Una persona confirma las urgentes.'],
    ['Historial por equipo', 'Cada máquina o instalación acumula sus intervenciones, repuestos cambiados y fotos. El técnico lo consulta desde el móvil antes de llegar.'],
    ['Repuestos y stock', 'Consumo por orden de trabajo, mínimos por referencia y avisos de reposición. Así sabes qué hay en la furgoneta y qué falta en el almacén.'],
    ['Preventivos y revisiones', 'Calendario de revisiones por equipo y cliente, con avisos al responsable y orden creada automáticamente para que no dependa de la memoria de nadie.'],
    ['Asistente con la documentación técnica', 'Manuales, esquemas y fichas se cargan en un asistente que responde con la página concreta. Sirve para el técnico novato y para la consulta de madrugada.'],
    ['Informes de intervención', 'A partir de lo que el técnico dicta o marca en el parte se redacta el informe para el cliente, con fotos y firma, listo para enviar.']],
  gridCls: 'tc-grid--3',
  comoH: 'Cómo implantamos un sistema de mantenimiento',
  pasos: [['Mapa de equipos y avisos', 'Antes de tocar nada hacemos el inventario: qué equipos atendéis, quién avisa y por qué canal, qué se registra hoy y dónde.'],
    ['Piloto con un cliente o una planta', 'Probamos con un único cliente, con sus equipos y sus avisos reales. Si el flujo funciona se amplía; si no, se corrige sin haber tocado el resto.'],
    ['Implantación con los técnicos', 'Los técnicos son los usuarios reales: formamos con ellos en la furgoneta o en el taller, no solo en la oficina, y ajustamos los formularios a su manera de trabajar.'],
    ['Seguimiento mensual', 'Revisamos qué órdenes se cierran tarde, qué repuestos se piden más y qué informes se corrigen, y mejoramos esas piezas concretas.']],
  ejH: 'Un servicio técnico de ejemplo', ejTitulo: 'Servicio técnico «Mantenimientos Ejemplo, S.L.»',
  ej: ['<b>Situación.</b> Una empresa pequeña de mantenimiento de instalaciones recibe los avisos por teléfono y por mensajes sueltos. Los preventivos se llevan en una hoja de cálculo que mantiene una sola persona.', '<b>Qué hacemos.</b> Un aviso por mensaje genera una orden con el equipo y la prioridad propuestos; el técnico ve el historial y el manual desde el móvil, anota los repuestos usados y firma el cliente en pantalla. Cada revisión periódica crea su orden por adelantado.', '<b>Resultado.</b> La oficina deja de transcribir avisos y los preventivos dejan de depender de una hoja. No damos cifras: se miden durante el piloto con vuestras propias órdenes.'],
  ejNota: 'Ejemplo ficticio: ni la empresa ni los equipos existen.',
  ejShot: [CAP.inicio.url, CAP.inicio.alt, 'Captura de IndunexIA · Datos ficticios'],
  rel: [['/automatizacion-procesos-ia/', 'Automatización de procesos', 'la pieza central: avisos, órdenes y recordatorios que se mueven solos entre canales.'],
    ['/gestion-documental-ia/', 'Gestión documental con IA', 'manuales, fichas de repuesto, albaranes y certificados organizados y fáciles de consultar.'],
    ['/agentes-chatbots-ia/', 'Asistentes y chatbots', 'el asistente técnico que responde con tus manuales y también atiende al cliente.'],
    ['/erp-industria/', 'IndunexIA', 'si además necesitas presupuesto, albarán y facturación en el mismo programa.'],
    ['/desarrollo-a-medida-ia/', 'Desarrollo a medida', 'para conectar con el sistema de órdenes o de activos que ya utilizas.']],
  faqs: [['¿Necesito dejar mi programa de mantenimiento actual?', 'No necesariamente. Si ya usas un programa de órdenes y tiene API, nos conectamos de forma directa; si no, valoramos cómo adaptarlo o si compensa sustituirlo. Cualquier mejora que se os ocurra se puede implementar en el programa que uséis.'],
    ['¿Cómo evita la IA errores al crear una orden desde un mensaje?', 'Propone, no decide: el equipo, la prioridad y el cliente se sugieren y una persona confirma lo importante. Lo dudoso se marca para revisar. Lo probamos en el piloto con avisos reales antes de ampliar.'],
    ['¿Funciona si los técnicos trabajan sin cobertura?', 'Los partes pueden empezarse en el móvil y completarse cuando haya conexión. En el diagnóstico revisamos tus rutas habituales para ver si es un problema real y cómo resolverlo.'],
    ['¿Podéis cargar nuestros manuales y fichas técnicas?', 'Sí. Se organizan por equipo y el asistente responde citando el documento y la página. Los manuales siguen siendo tuyos y no se utilizan para entrenar modelos de terceros.']],
  band: ['¿Tus técnicos pierden tiempo buscando datos?', 'Pide el diagnóstico gratis y cuéntanos cómo llega hoy un aviso hasta que se cierra la orden.'],
};

/* ============================================================ INSTALADORAS */
S.instaladoras = {
  slug: 'ia-empresas-instaladoras', titulo: 'IA para empresas instaladoras',
  seo: ['Software para empresas instaladoras con IA', 'Software para empresas instaladoras: presupuestos desde mediciones, documentación de obra, partes dictados y revisiones. Diagnóstico gratis.', 'software para empresas instaladoras'],
  eb: 'Electricidad, climatización y fontanería industrial',
  h1: 'Software para empresas instaladoras: presupuestos, obra y documentación sin tardes de oficina',
  lead: 'Una instaladora cierra obras, pero las obras no se cierran del todo hasta que el papel está en orden. Ayudamos a presupuestar más rápido, a documentar mientras se trabaja y a recordar cada revisión periódica.',
  datos: [['Para quién', 'Eléctricas, climatización, fontanería y frío'], ['Primer paso', 'Diagnóstico gratis por escrito'], ['Piloto', 'Con una obra o un presupuesto real'], ['Dónde', 'Región de Murcia y remoto en toda España']],
  introEb: 'Obra por la mañana, papeles por la tarde', introH: 'El trabajo está en la obra y el desgaste, en la oficina',
  boxH: 'Te sonará si',
  box: ['Presupuestas por la tarde lo que mediste por la mañana', 'Los albaranes de proveedor se acumulan sin imputar a obra', 'La documentación final se monta a última hora', 'Las revisiones de clientes dependen de una agenda'],
  qH: 'Qué automatizamos en una instaladora',
  cards: [['Presupuestos desde mediciones', 'Con las mediciones y la lista de material se genera un borrador de presupuesto por partidas, usando tus tarifas y tu margen. Tú lo revisas y lo envías.'],
    ['Facturas y albaranes de proveedor', 'El material comprado se lee de la factura o albarán y se imputa a la obra correspondiente, de modo que sabes qué lleva cada una sin teclear.'],
    ['Partes de obra dictados', 'El operario cuenta desde la obra qué ha hecho y con qué material; el parte se redacta, se asocia a la obra y se guarda con fotos.'],
    ['Documentación y certificados de obra', 'Reunimos memorias, fotos, listados y certificados en una carpeta por obra y preparamos los borradores. La firma y el registro los hace siempre el instalador autorizado.'],
    ['Revisiones periódicas', 'Cada instalación con revisión tiene su fecha: aviso al cliente, propuesta de cita y orden de trabajo creada sin que nadie tenga que acordarse.'],
    ['Seguimiento de obra y cobros', 'Qué se ha facturado de cada obra, qué falta por certificar y qué está pendiente de cobro, en una sola pantalla y no en tres hojas.']],
  gridCls: 'tc-grid--3',
  comoH: 'Cómo encaja en una instaladora',
  pasos: [['Diagnóstico sobre una obra reciente', 'Nos cuentas una obra de principio a fin y te enviamos por escrito el análisis: cómo se presupuestó, qué material se compró, qué papeles se generaron. De ahí sale el mapa de lo que se puede ahorrar.'],
    ['Piloto en un presupuesto o una obra', 'Escogemos una sola pieza, normalmente el presupuesto o la documentación, y la probamos con datos tuyos antes de tocar nada más.'],
    ['Implantación por oficios', 'Cada oficio tiene sus partidas y su vocabulario; configuramos el programa con el de tu empresa y formamos al personal de oficina y a los jefes de obra.'],
    ['Mejora continua', 'Con el uso aparecen nuevas necesidades: otras tarifas, más tipos de revisión, conexión con tu programa de contabilidad. Se añaden de forma acordada.']],
  ejH: 'Una instaladora de ejemplo', ejTitulo: 'Instalaciones «Climaelectric Ejemplo, S.L.»',
  ej: ['<b>Situación.</b> Una empresa de instalaciones eléctricas y de climatización con dos equipos en obra. Los presupuestos se hacen con mediciones en papel y la documentación se reúne cuando el cliente la reclama.', '<b>Qué hacemos.</b> Las mediciones de la visita se pasan al programa y generan un borrador por partidas; las facturas de proveedor se leen e imputan a cada obra; el equipo dicta el parte y sube las fotos; al cerrar, se prepara el dossier con todo lo anterior para que el responsable lo revise y firme.', '<b>Resultado.</b> La oficina revisa en lugar de reconstruir. No incluimos cifras de resultado: se comprueban durante el piloto con una obra de la propia empresa.'],
  ejNota: 'Ejemplo ficticio, sin relación con ninguna empresa instaladora real.',
  ejShot: [CAP.albaran.url, CAP.albaran.alt, 'Captura de IndunexIA · Datos ficticios'],
  rel: [['/automatizacion-procesos-ia/', 'Automatización de procesos', 'recordatorios de revisión, avisos a clientes y petición de ofertas a proveedores.'],
    ['/gestion-documental-ia/', 'Gestión documental con IA', 'la carpeta de cada obra con facturas, fotos y certificados ordenados.'],
    ['/erp-industria/', 'IndunexIA', 'presupuesto, albarán firmado, factura y cobros en un solo programa; precios en su <a class="tc-link" href="/erp-industria/#precio">apartado de precio</a>.'],
    ['/agentes-chatbots-ia/', 'Asistentes y chatbots', 'para atender consultas de clientes sobre citas, estados de obra o revisiones.'],
    ['/desarrollo-a-medida-ia/', 'Desarrollo a medida', 'si necesitas conectar con tu programa de presupuestos o de contabilidad.']],
  faqs: [['¿La IA firma o emite certificados de instalación?', 'No. Prepara borradores y reúne la documentación, pero la firma, el registro y la responsabilidad técnica son siempre del instalador autorizado. Nosotros no sustituimos ese paso ni afirmamos nada sobre cumplir normativa por ti.'],
    ['¿Se adapta a nuestras tarifas y a las partidas de cada oficio?', 'Sí. Las partidas, tarifas y márgenes se cargan con los de tu empresa y se pueden tener varios oficios en el mismo programa. En el piloto se contrasta con presupuestos que ya hiciste.'],
    ['¿Y si ya tengo programa de presupuestos o de contabilidad?', 'Si tiene API, la conexión es directa; si no, se valora cómo adaptarlo. A veces basta con generar un archivo que tu programa ya sabe importar.'],
    ['¿Se puede probar con una sola obra?', 'Sí, y es lo que recomendamos. Elegimos una obra reciente o en curso, la gestionamos con el sistema y comparas con cómo la habrías llevado antes.']],
  band: ['¿Te llevan las tardes los presupuestos y los papeles?', 'Pide el diagnóstico gratis y cuéntanos una obra reciente: te enviamos qué parte del papeleo se puede evitar.'],
};

/* ============================================================ FABRICACION */
S.fabricacion = {
  slug: 'ia-fabricacion-industrial', titulo: 'IA en fabricación industrial',
  seo: ['IA en fabricación industrial: calidad y producción', 'IA en fabricación industrial: documentación de producción, control de calidad (incluida la visión artificial), pedidos y reporting sin teclear dos veces.', 'IA en fabricación'],
  eb: 'Fabricación y agroindustria',
  h1: 'IA en fabricación industrial: datos de producción y calidad sin teclear dos veces',
  lead: 'En planta, el dato se genera una vez y se escribe tres: en el parte, en la hoja de calidad y en el ERP. Conectamos esos puntos para que producción, calidad y oficina trabajen con la misma información.',
  datos: [['Para quién', 'Fabricantes y agroindustria'], ['Primer paso', 'Diagnóstico gratis por escrito'], ['Piloto', 'Con una línea o un proceso concreto'], ['Dónde', 'Región de Murcia y remoto en toda España']],
  introEb: 'De la línea a la oficina', introH: 'La planta produce datos que nadie aprovecha a tiempo',
  boxH: 'Piensa en fabricación si',
  box: ['Los partes de producción se pasan a mano al sistema', 'Los controles de calidad viven en hojas aparte', 'Buscar un lote antiguo lleva media tarde', 'El informe mensual se monta copiando datos'],
  qH: 'Qué abordamos en una planta de fabricación',
  cards: [['Documentación de producción', 'Órdenes de fabricación, instrucciones de trabajo y fichas técnicas organizadas por producto y versión, con un asistente que responde a las dudas del operario con el documento correcto.'],
    ['Partes de producción desde el móvil o la tablet', 'Cantidades, mermas, paradas y lote se registran en el puesto, con campos obligatorios, en vez de apuntarlos en papel y teclearlos después.'],
    ['Control de calidad documentado', 'Los controles y las incidencias quedan registrados por lote y se cruzan con los pedidos. Cuando surge una reclamación, localizar el lote es cuestión de segundos.'],
    ['Visión artificial como posibilidad', 'Para inspecciones visuales repetitivas (presencia de piezas, etiquetas, defectos de superficie) se puede estudiar un sistema de cámara. Exige pruebas con tus piezas y se valora caso a caso; <a class="tc-link" href="/vision-artificial-control-calidad/">aquí explicamos un ejemplo publicado</a>.'],
    ['Pedidos de clientes y proveedores', 'El pedido que llega por correo se lee y se carga en el ERP. Lo mismo con los albaranes de materia prima, contrastados con la orden de compra.'],
    ['Informes y reporting', 'Producción, calidad y cumplimiento de plazos se resumen automáticamente cada semana o cada mes para dirección, sin copiar y pegar entre hojas.']],
  gridCls: 'tc-grid--3',
  comoH: 'Cómo avanzamos en una planta',
  pasos: [['Mapa de la línea', 'Nos cuentas dónde se genera cada dato, quién lo apunta y dónde se vuelve a escribir, y te enviamos por escrito el mapa de lo que se puede ahorrar.'],
    ['Piloto con una línea o un proceso', 'Elegimos un único proceso, por ejemplo el parte de producción de una línea, y lo probamos con operarios reales durante unas semanas.'],
    ['Implantación y conexión con el ERP', 'Si tu ERP tiene API, la conexión es directa; si no, valoramos cómo adaptarlo. SAP u otro: cualquier mejora que se os ocurra se puede implementar.'],
    ['Seguimiento con calidad y producción', 'Cada mes repasamos con los responsables qué datos faltan, qué informes se usan y qué se puede añadir, sin ampliar nada que no se vaya a usar.']],
  ejH: 'Una planta de ejemplo', ejTitulo: 'Fábrica «Conservas y Envases Ejemplo, S.A.»',
  ej: ['<b>Situación.</b> Una planta mediana con dos líneas de envasado. Cada turno apunta producción, mermas y paradas en papel; calidad rellena sus controles en otra hoja y el lunes se monta el informe para dirección.', '<b>Qué hacemos.</b> El parte de cada turno se registra en una tablet con el lote asociado; los controles de calidad se anotan en el mismo registro; los pedidos de materia prima se leen desde el albarán y se contrastan con la orden de compra. El informe semanal se genera con esos datos.', '<b>Resultado.</b> Un lote problemático se localiza en minutos y el informe del lunes deja de montarse a mano. No hay cifras de ahorro: se establecen con una línea piloto y datos de la propia empresa.'],
  ejNota: 'Ejemplo ficticio: la empresa y sus líneas son inventadas.',
  ejShot: [CAP.facturas.url, CAP.facturas.alt, 'Captura de IndunexIA · Datos ficticios'],
  rel: [['/automatizacion-procesos-ia/', 'Automatización de procesos', 'la base: partes, pedidos y avisos conectados sin intervención manual.'],
    ['/gestion-documental-ia/', 'Gestión documental con IA', 'instrucciones, fichas técnicas y albaranes organizados por versión y lote.'],
    ['/desarrollo-a-medida-ia/', 'Desarrollo a medida', 'pantallas de planta, paneles de producción o conexión con máquinas y ERP.'],
    ['/agentes-chatbots-ia/', 'Asistentes y chatbots', 'el asistente que responde al operario con la instrucción de trabajo correcta.'],
    ['/erp-industria/', 'IndunexIA', 'para fabricaciones a medida y series pequeñas, con pedidos, albaranes y facturación.']],
  faqs: [['¿Por dónde empieza una fábrica con la IA?', 'Por un proceso acotado donde se pierda tiempo cada semana: un parte, un informe o un tipo de pedido. Se mide el tiempo antes y después y solo entonces se amplía.'],
    ['¿Es realista la visión artificial en una pyme?', 'Depende de la pieza, la luz, la velocidad y el tipo de defecto. Hay casos que funcionan muy bien y otros que no compensan. Lo primero es probar con fotos de tus piezas y decirte con franqueza si merece la pena.'],
    ['¿Se conecta con nuestro ERP o con SAP?', 'Si el ERP tiene API, la conexión es directa; si no la tiene, se valora cómo adaptarlo. SAP es un ejemplo habitual, pero lo mismo vale para el programa que uséis.'],
    ['¿Qué ocurre con la confidencialidad de nuestra producción?', 'Pedimos los accesos mínimos y los servidores están en la Unión Europea siempre que es posible. Nada de lo que tratamos se usa para entrenar modelos de terceros y lo montado es tuyo.']],
  band: ['¿Quieres que producción y calidad hablen el mismo idioma?', 'Pide el diagnóstico gratis y cuéntanos qué dato apuntáis dos veces; empezamos por ahí.'],
};

// ---------- presentación visual (revisión C): frase de intro, bloque «Hoy / Con IA», iconos y fichas de soluciones ----------
const ICONS = {
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M8 15h2M12 15h2M8 18h2M12 18h4"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  movil: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  firma: '<path d="M3 17c3-1 4-6 6-6s1 5 3 5 2-3 4-3 2 2 5 2"/><path d="M3 21h18"/>',
  euro: '<path d="M18 6a7 7 0 1 0 0 12M4 10h10M4 14h10"/>',
  carpeta: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  cajas: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  grafica: '<path d="M3 20h18M6 16l4-5 4 3 5-7"/>',
  libro: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3"/>',
  escudo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  sobre: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  engranaje: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8"/>',
  codigo: '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
  fabrica: '<path d="M2 21V10l6 4V10l6 4V6l8 4v11z"/><path d="M6 18h2M11 18h2M16 18h2"/>',
};
const ic = (n) => `<span class="tc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg></span>`;
const ad = (rows) => `<div class="tc-ad tc-reveal"><div class="tc-ad__h"><span>Hoy</span><span>Con IA</span></div>${rows.map(([a, d]) => `<div class="tc-ad__row"><p class="tc-ad__antes">${a}</p><span class="tc-ad__arrow" aria-hidden="true">${ARROW}</span><p class="tc-ad__despues">${d}</p></div>`).join('')}</div>`;
const EXTRA = {
  talleres: {
    frase: 'Un taller entrega a tiempo y aun así deja margen por el camino: el precio sale de la memoria y el papeleo se acumula.',
    ad: [['El precio sale de la memoria del encargado.', 'Precio con tu coste real por hora y operación.'], ['Parte a lápiz y albarán firmado en la furgoneta.', 'Parte y firma en el móvil, guardados por pedido.'], ['Factura del viernes con tres hojas de cálculo.', 'Factura generada desde el albarán firmado.']],
    icons: ['calc', 'doc', 'movil', 'firma', 'euro', 'carpeta'],
    rel: ['calc|Presupuesto, parte, albarán, factura y cobro en un solo sitio.', 'engranaje|Avisos, correos de clientes y tareas repetitivas.', 'carpeta|Facturas y albaranes de material que se archivan solos.', 'chat|Consultas de clientes sobre estado de pedidos o plazos.', 'codigo|Para el proceso propio que ningún programa cubre.'],
  },
  mantenimiento: {
    frase: 'El mantenimiento sufre cuando la información llega tarde: el aviso por una vía, el historial en otra y el repuesto, donde toque.',
    ad: [['Avisos por teléfono, mensaje y correo, apuntados en una libreta.', 'Cada aviso se convierte en orden con equipo y prioridad.'], ['El técnico sale sin saber qué se hizo la última vez.', 'Historial y manual del equipo en el móvil antes de llegar.'], ['Revisiones preventivas que se olvidan hasta la avería.', 'Calendario por equipo con la orden creada por adelantado.']],
    icons: ['alerta', 'reloj', 'cajas', 'cal', 'lupa', 'doc'],
    rel: ['engranaje|Avisos, órdenes y recordatorios que se mueven solos.', 'carpeta|Manuales, fichas de repuesto y certificados a mano.', 'chat|El asistente técnico que responde con tus manuales.', 'calc|Presupuesto, albarán y facturación en el mismo programa.', 'codigo|Conexión con el sistema de órdenes que ya usas.'],
  },
  instaladoras: {
    frase: 'La obra se hace por la mañana; el presupuesto, la documentación y las revisiones se hacen por la tarde.',
    ad: [['Mediciones en papel convertidas en presupuesto por la tarde.', 'Borrador por partidas con tus tarifas para revisar y enviar.'], ['Documentación final reunida a toda prisa al cerrar la obra.', 'Carpeta por obra con facturas, fotos y certificados ordenados.'], ['Revisiones periódicas anotadas en una agenda.', 'Aviso al cliente y orden de trabajo creados sin acordarse.']],
    icons: ['calc', 'sobre', 'movil', 'carpeta', 'cal', 'grafica'],
    rel: ['engranaje|Recordatorios de revisión y petición de ofertas.', 'carpeta|La carpeta de cada obra, ordenada.', 'calc|Presupuesto, albarán firmado, factura y cobros.', 'chat|Consultas sobre citas, obras o revisiones.', 'codigo|Conexión con tu programa de presupuestos o contabilidad.'],
  },
  fabricacion: {
    frase: 'En planta el dato se genera una vez y se escribe tres: en el parte, en la hoja de calidad y en el ERP.',
    ad: [['Parte de producción en papel, tecleado al día siguiente.', 'Registro en tablet en el puesto, con el lote asociado.'], ['Controles de calidad en hojas aparte.', 'Controles e incidencias por lote en el mismo registro.'], ['Informe mensual montado copiando datos.', 'Informe semanal generado con los datos ya registrados.']],
    icons: ['libro', 'movil', 'escudo', 'lupa', 'sobre', 'grafica'],
    rel: ['engranaje|Partes, pedidos y avisos conectados sin tecleo.', 'carpeta|Instrucciones y fichas técnicas por versión y lote.', 'codigo|Pantallas de planta y conexión con máquinas y ERP.', 'chat|El asistente que responde al operario con la instrucción correcta.', 'calc|Series pequeñas y trabajo a medida con pedidos y facturación.'],
  },
};
const ORDEN = ['talleres', 'mantenimiento', 'instaladoras', 'fabricacion'];
const urlDe = (k) => `/${S[k].slug}/`;

const E = (k) => EXTRA[k];
const html = (k, c) => {
  const otros = ORDEN.filter((x) => x !== k).map((x) => `<a class="tc-link" href="${urlDe(x)}">${S[x].titulo}</a>`).join(' · ');
  return page(`${pagehead(`<a href="/industria/">Industria</a><span aria-hidden="true">/</span><span>${c.titulo}</span>`, c.eb, c.h1, c.lead,
    btn(CTA, 'Pide tu diagnóstico gratis') + btn('/erp-industria/', 'Ver el ERP para la industria', true), facts('De un vistazo', c.datos))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow(c.introEb)}<h2>${c.introH}</h2><p>${E(k).frase}</p></div><div class="tc-box tc-reveal"><h3>${c.boxH}</h3>${list(c.box)}</div></div><div class="tc-wrap" style="margin-top:28px">${ad(E(k).ad)}</div></section>
<section class="tc-sec tc-sec--alt" id="que-automatizamos"><div class="tc-wrap">${head('Qué automatizamos', c.qH)}<div class="tc-grid ${c.gridCls} tc-reveal">${c.cards.map(([t, d], i) => `<div class="tc-box">${ic(E(k).icons[i])}<h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="tc-sec" id="como-trabajamos"><div class="tc-wrap">${head('Cómo trabajamos', c.comoH)}<div class="tc-grid tc-grid--2 tc-reveal">${c.pasos.map(([t, d]) => `<div class="tc-step"><h3>${t}</h3><p>${d}</p></div>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt" id="ejemplo"><div class="tc-wrap${c.ejShot ? ' tc-split' : ''}"><div class="tc-box tc-reveal"><span class="tc-eyebrow">Ejemplo ficticio</span><h2>${c.ejH}</h2><h3>${c.ejTitulo}</h3><p><i>${c.ejNota}</i></p>${c.ej.map((p) => `<p>${p}</p>`).join('')}</div>${c.ejShot ? `<div class="tc-reveal">${shot(...c.ejShot)}</div>` : ''}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Soluciones relacionadas', 'Lo que usamos para esto')}<div class="tc-sectores tc-reveal" style="grid-template-columns:repeat(auto-fit,minmax(230px,1fr))">${c.rel.map(([u, t], i) => { const [ico, corto] = E(k).rel[i].split('|'); return `<a class="tc-sector" href="${u}">${ic(ico)}<span><b>${t}</b><small>${corto}</small></span></a>`; }).join('')}</div><div class="tc-prose tc-reveal" style="margin-top:22px"><p>${k === 'talleres' || k === 'instaladoras' ? 'Los precios orientativos del programa están en su <a class="tc-link" href="/erp-industria/#precio">apartado de precio</a>. ' : ''}Si quieres una visión de conjunto, mira la <a class="tc-link" href="/consultor-ia-murcia/">consultoría de IA en Murcia</a>, desde donde trabajamos con empresas de toda la Región y en remoto con toda España.</p></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Dudas habituales')}${faq(c.faqs)}</div></section>
<section class="tc-sec tc-sec--tight" id="otros-sectores"><div class="tc-wrap"><div class="tc-prose tc-reveal"><h3>Otros sectores industriales</h3><p>${otros} · <a class="tc-link" href="/distribucion-industrial/">Distribución técnica</a> · <a class="tc-link" href="/industria/">Toda la industria</a></p></div></div></section>
${band(c.band[0], c.band[1], btn(CTA, 'Pide tu diagnóstico gratis'))}`);
};

// ---------- comprobaciones ----------
for (const [k, c] of Object.entries(S)) {
  if (c.seo[0].length > 60) throw new Error(`title >60 en ${k}: ${c.seo[0].length}`);
  if (c.seo[1].length > 155) throw new Error(`description >155 en ${k}: ${c.seo[1].length}`);
  if (c.faqs.length !== 4) throw new Error(`${k}: 4 FAQ`);
  if (c.cards.length < 4 || c.cards.length > 6) throw new Error(`${k}: tarjetas`);
}
const args = process.argv.slice(2);
const solo = args.filter((x) => !x.startsWith('--'));
const dry = process.env.DRY === '1';
const palabras = (s) => s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').split(/\s+/).filter(Boolean).length;

for (const [k, c] of Object.entries(S)) {
  if (solo.length && !solo.includes(k)) continue;
  const content = html(k, c);
  if (process.env.DUMP) { fs.mkdirSync(process.env.DUMP, { recursive: true }); fs.writeFileSync(process.env.DUMP + '/' + k + '.html', content); }
  if (dry) { console.log(c.slug, 'title', c.seo[0].length, 'desc', c.seo[1].length, 'palabras', palabras(content)); continue; }
  const f = await wp('GET', `/wp/v2/pages?slug=${c.slug}&status=publish,draft,pending,private&_fields=id,status`);
  const ex = f.data?.[0];
  const meta = { rank_math_title: c.seo[0], rank_math_description: c.seo[1], rank_math_focus_keyword: c.seo[2] };
  if (ex) {
    const cur = (await wp('GET', '/wp/v2/pages/' + ex.id + '?context=edit&_fields=id,title,content,meta')).data || {};
    fs.mkdirSync(BK, { recursive: true });
    fs.writeFileSync(BK + 'page-' + ex.id + '-' + Date.now() + '.html', cur.content?.raw || '');
    const r2 = await wp('POST', '/wp/v2/pages/' + ex.id, { content, title: c.titulo, status: 'publish', meta });
    console.log(c.slug, 'actualizada', r2.status, ex.id, r2.data?.link);
  } else {
    const r = await wp('POST', '/wp/v2/pages', { title: c.titulo, slug: c.slug, status: 'publish', content, template: '', comment_status: 'closed', author: 2, meta });
    console.log(c.slug, 'creada', r.status, r.data?.id, r.data?.link);
  }
}
