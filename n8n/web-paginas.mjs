// Páginas de negocio de transformaconia.com (diseño del snippet «Transforma · diseño de la web»).
// Uso: node n8n/web-paginas.mjs [slug ...]   (sin argumentos publica todas; guarda copia antes de sobrescribir)
// Posicionamiento (2026-10-09): consultoría de IA y automatización de procesos para la industria, con el ERP
// para la industria como producto estrella (nació en talleres de mecanizado; se combina con otros sectores).
// Nunca nombrar las herramientas internas (n8n, modelos o proveedores de IA). Mantenimientos siempre «orientativos». El blog es secundario. Otros sectores se atienden en /otros-sectores/.
// Voz: equipo («nosotros»), sin nombres propios. Precios siempre orientativos. Nunca contar artículos publicados.
// Nada inventado: ni clientes con nombre, ni testimonios, ni cifras de ahorro sin medir.
import fs from 'node:fs';
import { wp } from './gw.mjs';

const IMG = JSON.parse(fs.readFileSync(new URL('./web-capturas.json', import.meta.url), 'utf8'));
const H = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ICONS = {
  flujo: '<path d="M4 6h6v4H4zM14 14h6v4h-6zM7 10v3a2 2 0 0 0 2 2h5"/><circle cx="17" cy="7" r="2.5"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/><path d="M8 10h8M8 13h5"/>',
  app: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14l2 2-2 2M13 18h3"/>',
  erp: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  rayo: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  aire: '<path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h8"/>',
  gota: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  tuerca: '<path d="M12 2 20.5 7v10L12 22 3.5 17V7z"/><circle cx="12" cy="12" r="3.5"/>',
  caja: '<path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  llave: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.2L3 17.8V21h3.2l6.3-6.3a4 4 0 0 0 5.2-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  copo: '<path d="M12 2v20M4 7l16 10M20 7 4 17M9 4l3 3 3-3M9 20l3-3 3 3"/>',
  lupa: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  escudo: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  reloj: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  mapa: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  radar: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><path d="M12 12 18 6"/>',
  iman: '<path d="M6 3v8a6 6 0 0 0 12 0V3h-4v8a2 2 0 0 1-4 0V3z"/>',
  noticia: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h10M7 12h10M7 16h6"/>',
  sobre: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  balanza: '<path d="M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6zM8 21h8"/>',
  libro: '<path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-5a3 3 0 0 0-3 3"/>',
  equipo: '<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14 20c0-2.5 1.5-4.5 3.5-4.5S21 17.5 21 20"/>',
  telegram: '<path d="m21 4-18 7 6 2 2 6 3-4 5 4z"/><path d="m9 13 8-6"/>',
  grafica: '<path d="M3 20h18M6 16l4-5 4 3 5-7"/>',
  objetivo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  fabrica: '<path d="M2 21V10l6 4V10l6 4V6l8 4v11z"/><path d="M6 18h2M11 18h2M16 18h2"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4"/>',
  firma: '<path d="M3 17c3-1 4-6 6-6s1 5 3 5 2-3 4-3 2 2 5 2"/><path d="M3 21h18"/>',
  movil: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  euro: '<path d="M18 6a7 7 0 1 0 0 12M4 10h10M4 14h10"/>',
  carpeta: '<path d="M3 6a1 1 0 0 1 1-1h5l2 2h9a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/>',
  usuarios: '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4a3 3 0 0 1 0 6M18 14c2 .7 3 3 3 6"/>',
  alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17v.5"/>',
};
const icon = (n) => `<span class="tc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg></span>`;
const btn = (href, txt, ghost = false) => `<a class="tc-btn${ghost ? ' tc-btn--ghost' : ''}" href="${href}">${txt} ${ARROW}</a>`;
const eyebrow = (t) => `<span class="tc-eyebrow">${t}</span>`;
const head = (eb, h2, p = '', extra = '') => `<div class="tc-head tc-reveal"><div>${eyebrow(eb)}<h2>${h2}</h2>${p ? `<p>${p}</p>` : ''}</div>${extra}</div>`;
const sec = (inner, cls = '', id = '') => `<section class="tc-sec ${cls}"${id ? ` id="${id}"` : ''}><div class="tc-wrap">${inner}</div></section>`;
const list = (items) => `<ul class="tc-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const page = (body) => `<!--tc--><div class="tc tc-ind">${body}</div>`;
const facts = (titulo, filas) => `<aside class="tc-hero__panel tc-spec"><div class="tc-hero__panel-h"><span>${titulo}</span></div><dl class="tc-facts">${filas.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></aside>`;
// Ilustración decorativa animada (engranajes, cota que se dibuja, chispas que brillan). Solo adorno: aria-hidden.
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
const shot = (src, alt, cap = '') => `<figure class="tc-shot"><div class="tc-shot__bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${src}" width="1440" height="900" alt="${alt}" loading="lazy" decoding="async">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const shots = (lista) => lista.length === 1 ? shot(...lista[0]) : `<div class="tc-shots" style="--n:${lista.length}">${lista.map((x) => shot(...x)).join('')}</div>`;
// Escritorio + móvil: pantallas reales del ERP
const device = (desk, alt, chip = '') => `<div class="tc-device tc-reveal" aria-label="Pantallas reales del programa de gestión">
<figure class="tc-shot tc-device__desk"><div class="tc-shot__bar" aria-hidden="true"><i></i><i></i><i></i><span>erp · tu empresa</span></div><img src="${desk}" width="1440" height="740" alt="${alt}" loading="eager" decoding="async"></figure>
<figure class="tc-device__phone"><img src="${IMG.erp_movil}" width="780" height="1688" alt="El mismo programa en el móvil: lo pendiente de hoy, cobros e impuestos" loading="eager" decoding="async"></figure>
${chip ? `<div class="tc-device__chip">${chip}</div>` : ''}</div>`;
const GALERIA = [
  [IMG.erp_calculadora, 'Calculadora de costes del ERP: lo que te cuesta cada trabajo y el precio con tu margen', 'ERP industria · calculadora de costes', '/erp-industria/'],
  [IMG.erp_inicio, 'Inicio del ERP para la industria', 'ERP industria · inicio', '/erp-industria/'],
  [IMG.facturas, 'Programa de gestión con IA: facturas', 'Facturas y albaranes', '/erp-industria/'],
  [IMG.fiscal, 'Paquete trimestral para la asesoría', 'Documentación para la asesoría', '/casos/#documentacion'],
  [IMG.cobros, 'Cobros y vencimientos', 'Control de cobros', '/erp-industria/'],
  [IMG.veterinaria, 'Software de gestión para clínicas', 'Software para clínicas', '/otros-sectores/#clinicas'],
  [IMG.fundalex, 'Buscador de jurisprudencia con IA', 'Buscador jurídico con IA', '/otros-sectores/#asesorias'],
  [IMG.refuerzo, 'Aplicación de refuerzo escolar con IA', 'Refuerzo escolar con IA', '/otros-sectores/#educacion'],
];
const galeria = `<div class="tc-gal" aria-label="Capturas de herramientas que hemos construido"><div class="tc-gal__row">${[...GALERIA, ...GALERIA].map(([src, alt, t, u], i) => `<a class="tc-gal__item" href="${u}"${i >= GALERIA.length ? ' aria-hidden="true" tabindex="-1"' : ''}><img src="${src}" alt="${i >= GALERIA.length ? '' : alt}" width="1440" height="900" loading="lazy" decoding="async"><span>${t}</span></a>`).join('')}</div></div>`;
const flow = (pasos) => `<ol class="tc-flow">${pasos.map((p) => `<li>${p}</li>`).join('')}</ol>`;

// ======================= CONTENIDO COMÚN =======================
const SECTORES = [
  { id: 'talleres', ic: 'tuerca', t: 'Talleres industriales: mecanizado, calderería y reparación', frase: 'Responde antes a los presupuestos, con tu margen aplicado.',
    items: ['Presupuestos con lo que te cuesta cada trabajo y tu margen aplicado', 'Albaranes y partes firmados en el móvil', 'Órdenes de trabajo, entregas y cobros bajo control', 'Ofertas preparadas a partir del plano o de la petición del cliente'],
    sol: ['/erp-industria/', 'Ver el ERP para la industria'] },
  { id: 'distribucion', ic: 'caja', t: 'Distribución y suministro industrial', frase: 'La referencia y la equivalencia correctas en segundos, también fuera de horario.',
    items: ['Asistente técnico que responde con tu catálogo, tus fichas y tu stock', 'Equivalencias entre marcas: rodamientos, transmisión, neumática, hidráulica, tornillería', 'Pedidos que llegan por correo directos al ERP', 'Búsqueda que entiende referencias incompletas o mal escritas'],
    sol: ['/distribucion-industrial/', 'Ver el asistente de catálogo'] },
  { id: 'mantenimiento', ic: 'llave', t: 'Mantenimiento y servicios industriales', frase: 'Los avisos llegan clasificados por urgencia y con la orden de trabajo hecha.',
    items: ['Avisos por Telegram o WhatsApp convertidos en órdenes de trabajo', 'Asistente que consulta los manuales de tus máquinas', 'Informes de intervención que se redactan solos', 'Preventivos y revisiones planificados sin hojas de cálculo'],
    sol: ['/automatizacion-procesos-ia/', 'Ver automatización de procesos'] },
  { id: 'instaladoras', ic: 'rayo', t: 'Instaladoras: electricidad, climatización y frío', frase: 'Presupuestos y citas sin pasar la tarde al teléfono.',
    items: ['Presupuestos a partir de mediciones y listas de material', 'Facturas y albaranes de proveedor que se leen solos', 'Partes de trabajo dictados desde la obra', 'Certificados y revisiones periódicas automáticas'],
    sol: ['/automatizacion-procesos-ia/', 'Ver automatización de procesos'] },
  { id: 'integradores', ic: 'chip', t: 'Automatización industrial e integradores', frase: 'Menos horas de oficina técnica en cada proyecto.',
    items: ['Ofertas técnicas apoyadas en el histórico de proyectos', 'Documentación de proyecto generada a partir de lo ya hecho', 'Asistente de soporte para técnicos en campo'],
    sol: ['/desarrollo-a-medida-ia/', 'Ver herramientas a medida'] },
  { id: 'fabricacion', ic: 'fabrica', t: 'Fabricación y agroindustria', frase: 'Datos de producción sin papel y sin teclear dos veces.',
    items: ['Partes de producción y trazabilidad desde el móvil', 'Informes de producción y calidad que llegan solos', 'Pedidos de clientes y proveedores conectados con el ERP'],
    sol: ['/automatizacion-procesos-ia/', 'Ver automatización de procesos'] },
];
const OTROS_SECTORES = [['cal', 'Clínicas y centros con cita'], ['balanza', 'Asesorías y despachos'], ['caja', 'Comercio y tienda online'], ['libro', 'Educación y formación']];
const MARQUEE_SECTORES = ['Talleres de mecanizado', 'Calderería y soldadura', 'Estructuras metálicas', 'Carpintería metálica', 'Reparación de maquinaria', 'Talleres de hidráulica', 'Rodamientos y transmisión', 'Neumática', 'Hidráulica', 'Suministro industrial', 'Tornillería', 'Mantenimiento industrial', 'Instaladoras eléctricas', 'Climatización y frío', 'Integradores', 'Agroindustria', 'Empresas con SAP'];
const marquee = `<div class="tc-marquee" aria-label="Sectores en los que trabajamos"><span class="tc-marquee__label">Sectores</span><div class="tc-marquee__track"><div class="tc-marquee__row">${[...MARQUEE_SECTORES, ...MARQUEE_SECTORES].map((f) => `<span>${f}</span>`).join('')}</div></div></div>`;

const SERVICIOS = [
  ['erp', 'ERP para la industria', 'Calculadora de costes y margen, presupuestos, albaranes firmados, facturas, cobros y gastos por foto. Se usa desde el móvil.', '/erp-industria/', 'desde <b>690 €</b>'],
  ['flujo', 'Automatización de procesos', 'Pedidos, albaranes, facturas y correos que hoy se pasan a mano entre programas empiezan a moverse solos.', '/automatizacion-procesos-ia/', 'desde <b>450 €</b>'],
  ['chat', 'Asistentes técnicos y chatbots', 'Responden a clientes y a tu equipo con tu catálogo, tus fichas y tu stock: referencias, equivalencias y plazos.', '/agentes-chatbots-ia/', 'desde <b>900 €</b>'],
  ['carpeta', 'Gestión documental con IA', 'Facturas, albaranes, tickets, certificados y planos: la IA los lee, extrae los datos y los archiva donde toca.', '/gestion-documental-ia/', 'desde <b>450 €</b>'],
  ['app', 'Herramientas a medida y SAP', 'Cualquier idea para mejorar vuestro programa, SAP o el que uséis, se puede implementar. Y lo que ningún programa estándar resuelve, a medida.', '/desarrollo-a-medida-ia/', 'desde <b>2.500 €</b>'],
  ['objetivo', 'Consultoría y diagnóstico', 'Analizamos vuestros procesos y te decimos qué automatizar primero, cómo y cuánto costaría. Por escrito.', '/contacto/', '<b>Gratis</b>'],
];
const servCards = (cols = 3) => `<div class="tc-grid tc-grid--${cols}">${SERVICIOS.map(([i, t, p, u, pr], n) => `<article class="tc-box tc-reveal${n === 0 ? ' tc-box--star' : ''}">${icon(i)}<h3>${t}</h3><p>${p}</p><p class="tc-price">${/Gratis/.test(pr) ? '' : '<span>Orientativo</span> '}${pr}</p><a class="tc-link" href="${u}">Ver más</a></article>`).join('')}</div>`;

const SOLUCIONES_CONCRETAS = [
  ['Calculadora de costes y margen', '/erp-industria/'], ['Albaranes firmados en el móvil', '/erp-industria/'], ['Asistente técnico de catálogo', '/distribucion-industrial/'],
  ['Equivalencias entre marcas', '/distribucion-industrial/'], ['Pedidos del correo al ERP', '/automatizacion-procesos-ia/'], ['Lectura automática de facturas', '/gestion-documental-ia/'],
  ['Gastos por foto en Telegram', '/erp-industria/'], ['Órdenes de trabajo por mensaje', '/automatizacion-procesos-ia/'], ['Mejoras sobre SAP o tu ERP', '/desarrollo-a-medida-ia/'],
  ['Paquete trimestral para la asesoría', '/gestion-documental-ia/'], ['Informes que llegan solos', '/automatizacion-procesos-ia/'],
];
const chips = `<div class="tc-chips tc-reveal">${SOLUCIONES_CONCRETAS.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}</div>`;

const PASOS = `<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">30 minutos · gratis</span><h3>Diagnóstico</h3><p>Vemos cómo trabajáis y qué tarea os quita más horas. Te decimos por escrito qué automatizaríamos, cómo y cuánto costaría. Sin compromiso.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">1 a 3 semanas</span><h3>Piloto con tus datos</h3><p>Montamos una primera versión con tu catálogo, tus documentos o tus precios reales. La pruebas en el día a día antes de pagar el total.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">Desde el primer mes</span><h3>Implantación y soporte</h3><p>Lo dejamos funcionando, formamos a tu equipo, lo seguimos de cerca y lo vamos mejorando con el uso.</p></div></div>`;

const ANTES_DESPUES = [
  ['Calcular a mano lo que cuesta cada trabajo y ponerle precio a ojo', 'La calculadora suma material, horas y costes, aplicas tu margen y el presupuesto sale en minutos'],
  ['Pasar al programa los pedidos que llegan por correo', 'El pedido entra solo y alguien revisa únicamente los dudosos'],
  ['Buscar una referencia en tres catálogos para contestar a un cliente', 'El asistente responde con la ficha y la equivalencia en segundos'],
  ['Albaranes en papel que se pierden antes de facturar', 'Albarán firmado en el móvil y factura con un clic'],
  ['Guardar tickets y facturas en un cajón hasta final de trimestre', 'Foto por Telegram y la documentación queda lista para la asesoría'],
];
const antesDespues = `<div class="tc-ad tc-reveal"><div class="tc-ad__h"><span>Hoy</span><span>Automatizado</span></div>${ANTES_DESPUES.map(([a, d]) => `<div class="tc-ad__row"><p class="tc-ad__antes">${a}</p><span class="tc-ad__arrow" aria-hidden="true">${ARROW}</span><p class="tc-ad__despues">${d}</p></div>`).join('')}</div>`;

// Línea de proceso animada (ejemplo ilustrativo de una automatización)
const LINEA = [
  ['sobre', 'Entra el pedido', 'Correo, PDF o WhatsApp del cliente'],
  ['doc', 'La IA lo lee', 'Referencias, cantidades y plazos'],
  ['erp', 'Cruza con tu ERP', 'Stock, precio y equivalencias'],
  ['equipo', 'Revisión humana', 'Solo los casos dudosos'],
  ['escudo', 'Pedido y albarán', 'Creados y avisado el cliente'],
];
const linea = (titulo = 'Línea 01 · pedidos de clientes') => `<figure class="tc-linea tc-reveal" aria-label="Ejemplo de automatización de un pedido">
<div class="tc-linea__top"><span class="tc-linea__id">${titulo}</span><span class="tc-linea__led"><i></i>En marcha</span></div>
<div class="tc-linea__track" aria-hidden="true"><span class="tc-linea__pieza"></span></div>
<ol class="tc-linea__est">${LINEA.map(([i, t, d], n) => `<li style="--i:${n}">${icon(i)}<b>${t}</b><small>${d}</small></li>`).join('')}</ol>
<figcaption>Ejemplo ilustrativo: así fluye un pedido cuando el proceso está automatizado. El mismo esquema sirve para facturas de proveedor, avisos de avería o solicitudes de presupuesto.</figcaption></figure>`;

const POR_QUE = [
  ['fabrica', 'Conocemos el sector', 'Llevamos años trabajando en la industria. Sabemos qué es un plano, una referencia, un albarán y una urgencia de un viernes a las seis.'],
  ['tuerca', 'Revisión humana en lo importante', 'La IA lee, clasifica y propone; las acciones importantes siempre piden confirmación a una persona de tu equipo.'],
  ['flujo', 'Sin cambiar tu ERP', 'Si tu ERP tiene API, nos conectamos de forma directa; si no la tiene, valoramos cómo adaptarlo. Cualquier mejora que se os ocurra se puede implementar en SAP o en el programa que uséis.'],
  ['objetivo', 'Lo pruebas antes de pagarlo todo', 'Piloto con tus datos reales en 1 a 3 semanas. Si no te ahorra tiempo, lo sabrás antes de invertir más.'],
  ['mapa', 'Presencial y en remoto', 'En persona en la Región de Murcia y en remoto en toda España. Hablas siempre con quien lo construye.'],
  ['euro', 'Precios claros desde el principio', 'Precios orientativos publicados y presupuesto cerrado por escrito tras el diagnóstico. El ERP, sin permanencia.'],
];
// Calculadora orientativa [tc_calculadora] (shortcode del snippet #13; la tarifa vive allí)
const CALCULADORA = `<section class="tc-sec tc-sec--alt" id="calculadora"><div class="tc-wrap">${head('Haz la cuenta', '¿Cuánto te cuesta el papeleo?', 'Pon las horas que dedicáis a presupuestos, albaranes y facturas y mira el orden de magnitud. Es orientativo: parte de tus propias cifras.')}[tc_calculadora]</div></section>`;
const porQue = `<div class="tc-grid tc-grid--3">${POR_QUE.map(([i, t, p]) => `<div class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></div>`).join('')}</div>`;

const FORM_CONTACTO = `<form class="tc-form" data-tc-form="contacto" data-ok="¡Recibido! Te respondemos en menos de 24 horas laborables en tu correo." novalidate>
<div class="tc-form__row"><div class="tc-field"><label for="tc-nombre">Nombre</label><input id="tc-nombre" name="nombre" required autocomplete="name"></div>
<div class="tc-field"><label for="tc-empresa">Empresa</label><input id="tc-empresa" name="empresa" autocomplete="organization"></div></div>
<div class="tc-form__row"><div class="tc-field"><label for="tc-email">Correo</label><input id="tc-email" name="email" type="email" required autocomplete="email"></div>
<div class="tc-field"><label for="tc-sector">Sector</label><select id="tc-sector" name="sector"><option value="">Elige uno</option><optgroup label="Industria">${SECTORES.map((s) => `<option>${s.t}</option>`).join('')}</optgroup><optgroup label="Otros sectores">${OTROS_SECTORES.map((s) => `<option>${s[1]}</option>`).join('')}<option>Otro</option></optgroup></select></div></div>
<div class="tc-field"><label for="tc-mensaje">¿Qué tarea o consulta os repite más vuestro equipo?</label><textarea id="tc-mensaje" name="mensaje" required placeholder="Ej.: los presupuestos los calculamos a mano y tardamos días en contestar…"></textarea></div>
<label class="tc-hp" aria-hidden="true">Web <input name="web" tabindex="-1" autocomplete="off"></label>
<label class="tc-check"><input type="checkbox" required id="tc-acepto" name="acepto" value="si"> <span>He leído la <a href="/privacidad/">política de privacidad</a> y acepto que uséis mis datos para responderme.</span></label>
<div><button class="tc-btn" type="submit">Enviar y pedir diagnóstico ${ARROW}</button></div>
<p class="tc-msg" role="status" aria-live="polite"></p></form>`;

const contactoSplit = (h2 = 'Cuéntanos qué proceso queréis automatizar') => `<section class="tc-sec" id="contacto"><div class="tc-wrap tc-split">
 <div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Diagnóstico gratis')}<h2>${h2}</h2><p>En menos de 24 horas laborables te respondemos con una primera valoración. Si tiene sentido, hacemos un diagnóstico gratuito de 30 minutos, en tu empresa si estás en la Región de Murcia o por videollamada, y te enviamos por escrito qué automatizaríamos, cómo y por cuánto.</p>${list(['Sin compromiso y sin permanencias', 'Precios orientativos desde el principio', 'Piloto con tus datos antes de pagar el total', 'En persona en Murcia, en remoto en toda España'])}<p>¿Prefieres el correo? <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a></p></div>
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)">${FORM_CONTACTO}</div>
</div></section>`;

const MINI_CHAT = `<figure class="tc-chat tc-chat--mini" aria-label="Ejemplo de conversación con el asistente técnico"><div class="tc-chat__top"><span class="tc-chat__av">IA</span><div><b>Asistente técnico · Suministros Ejemplo</b><small><i></i>en línea · también de noche</small></div></div><div class="tc-chat__body">
<p class="tc-chat__m tc-chat__m--c" style="--d:.4s">¿Tenéis equivalente de esta referencia en otra marca? Mismas medidas, la necesito mañana.</p>
<p class="tc-chat__m tc-chat__m--b" style="--d:1.8s">Sí: hay dos equivalencias directas con las mismas medidas y jaula. De la primera quedan 14 unidades y sale hoy. Te dejo la ficha técnica. ¿La añado al pedido?</p>
<p class="tc-chat__m tc-chat__m--c" style="--d:3.4s">Sí, 4 unidades.</p>
<p class="tc-chat__m tc-chat__m--b" style="--d:4.8s">Añadidas ✓ Si necesitas hablar con el mostrador, te paso con ellos.</p></div><figcaption>Ejemplo ilustrativo de conversación con un asistente técnico de catálogo.</figcaption></figure>`;

// ======================= CASOS =======================
const CASOS = [
  { id: 'gestion', ic: 'tuerca', sector: 'Talleres industriales', titulo: 'Un ERP para la industria: del presupuesto a la factura',
    problema: 'Presupuestos calculados a mano y precios puestos a ojo, albaranes en papel, facturas en Excel y tickets en la guantera. Contestar a una petición de oferta llevaba días y nadie sabía de un vistazo qué estaba pendiente de cobro.',
    solucion: 'Un programa de gestión pensado para la industria: calculadora que saca lo que te cuesta cada trabajo para ponerle tu margen, presupuesto, albarán firmado en el móvil y factura en un clic; cobros y vencimientos a la vista; gastos registrados con una foto por Telegram, y un asistente de IA que prepara documentos y pide confirmación.',
    resultado: 'Presupuestos en minutos y con margen, toda la gestión en un solo sitio y el paquete trimestral para la asesoría con un botón. Nació en talleres de mecanizado y se adapta a cada oficio por módulos.',
    flujo: ['Coste + margen', 'Presupuesto', 'Albarán firmado', 'Factura y cobro'], tags: ['ERP', 'Talleres', 'Móvil', 'Telegram'], imgs: [[IMG.erp_calculadora, 'Calculadora de costes: lo que te cuesta el trabajo y el precio con tu margen'], [IMG.erp_inicio, 'Inicio del programa con lo pendiente de hoy'], [IMG.cobros, 'Cobros y vencimientos']], link: ['/erp-industria/', 'Ver el ERP para la industria'] },
  { id: 'distribucion', ic: 'caja', sector: 'Distribución industrial', titulo: 'Un asistente técnico dentro de la tienda online',
    problema: 'Los clientes profesionales de una tienda técnica llamaban o escribían para preguntar equivalencias entre marcas, medidas y disponibilidad. Cada consulta ocupaba a un técnico y muchas llegaban fuera de horario.',
    solucion: 'Un asistente dentro de la tienda conectado al catálogo y al stock real. Entiende la referencia aunque venga incompleta, da todas las equivalencias, muestra la ficha técnica completa y añade el producto al carrito.',
    resultado: 'Las consultas técnicas se resuelven solas a cualquier hora y el cliente compra sin esperar respuesta.',
    flujo: ['Pregunta del cliente', 'Catálogo y stock', 'Ficha y equivalencias', 'Al carrito'], tags: ['Asistente técnico', 'Tienda online', 'Stock en tiempo real'], chat: true, link: ['/distribucion-industrial/', 'Ver el asistente de catálogo'] },
  { id: 'sap', ic: 'lupa', ejemplo: true, sector: 'Ejemplo · empresas con SAP', titulo: 'Ejemplo: sacar más partido a SAP con IA',
    problema: 'Buscar un artículo en SAP suele ser lento: hace falta conocer el código o la descripción exacta con la que está dado de alta, y con miles de referencias se pierde tiempo o se elige el que no es.',
    solucion: 'Se puede añadir una capa de inteligencia artificial que mejore la búsqueda de artículos: entiende lo que escribe la persona con sus propias palabras, tolera errores y sinónimos y propone el artículo correcto. Además, se sincroniza con SAP según las necesidades de cada empresa.',
    resultado: 'Encontrar el artículo correcto en segundos y aprovechar más SAP sin cambiar de programa ni de forma de trabajar. Es un ejemplo de lo que se puede implementar: cualquier idea para mejorar SAP, o el programa que uséis, se puede valorar.',
    flujo: ['Lo que busca el usuario', 'Búsqueda con IA', 'Artículo correcto', 'Sincronizado con SAP'], tags: ['SAP', 'Búsqueda inteligente', 'Integración a medida'], link: ['/desarrollo-a-medida-ia/', 'Ver herramientas a medida'] },
  { id: 'documentacion', ic: 'carpeta', sector: 'Gestión documental', titulo: 'La documentación que se ordena sola',
    problema: 'Facturas de proveedor por correo, albaranes en papel, tickets en el móvil de cada trabajador y certificados en carpetas sueltas. Cada cierre de trimestre era buscar papeles y teclear importes.',
    solucion: 'La IA lee cada documento (PDF, foto o correo), extrae proveedor, fecha, importes e IVA, lo clasifica y lo registra en el programa de gestión. Lo dudoso se marca para revisar y al final del trimestre el paquete para la asesoría sale preparado.',
    resultado: 'Nada se teclea dos veces, nada se pierde y la asesoría recibe la documentación completa y a tiempo.',
    flujo: ['Foto, PDF o correo', 'Lectura con IA', 'Clasificado y registrado', 'Paquete para la asesoría'], tags: ['Lectura de documentos', 'Telegram', 'Fiscal'], imgs: [[IMG.fiscal, 'Paquete trimestral para la asesoría'], [IMG.facturas, 'Facturas registradas en el programa']], link: ['/gestion-documental-ia/', 'Ver gestión documental'] },
  { id: 'atencion', ic: 'chat', sector: 'Asesorías y clínicas', titulo: 'Asistentes que atienden a los clientes por ti',
    problema: 'En asesorías y clínicas el teléfono no para: las mismas dudas, citas que cambiar y documentación que falta. Cada llamada interrumpe a alguien que estaba con otra cosa.',
    solucion: 'Un asistente con la información real del negocio que responde a las preguntas frecuentes, recoge lo que falta, gestiona citas y pasa a una persona lo que no debe resolver solo.',
    resultado: 'Respuesta inmediata a cualquier hora y un equipo que se dedica a lo que solo él puede hacer.',
    flujo: ['Pregunta del cliente', 'Información del negocio', 'Respuesta o cita', 'Aviso al equipo si hace falta'], tags: ['Chatbot', 'Citas', 'Atención 24/7'], link: ['/otros-sectores/', 'Ver otros sectores'] },
  { id: 'clinicas', ic: 'cal', sector: 'Clínicas y centros con cita', titulo: 'Software de gestión para clínicas veterinarias',
    problema: 'Las citas se daban por teléfono, las fichas estaban en papel o en hojas sueltas y las vacunas pendientes dependían de que alguien se acordara de avisar al dueño.',
    solucion: 'Un programa todo en uno para la clínica: agenda de citas, fichas de cada paciente con su historia clínica, control de vacunaciones, recordatorios automáticos y facturación.',
    resultado: 'La clínica ve el día de un vistazo y los avisos de citas y vacunas salen solos.',
    flujo: ['Cita', 'Ficha y vacunas', 'Recordatorio', 'Factura'], tags: ['Agenda', 'Recordatorios', 'Facturación'], imgs: [[IMG.veterinaria, 'Software de gestión para clínicas veterinarias']] },
  { id: 'despachos', ic: 'balanza', sector: 'Despachos de abogados', titulo: 'Buscador de jurisprudencia que entiende el caso',
    problema: 'Encontrar sentencias útiles para un caso exige horas en buscadores oficiales poco amigables, probando combinaciones de palabras clave.',
    solucion: 'Un buscador al que se le describe el caso con palabras normales. Busca en la fuente oficial del poder judicial y devuelve las resoluciones relevantes con su referencia oficial para comprobarlas.',
    resultado: 'Del caso al fundamento en minutos, siempre con la cita oficial a mano para verificarla.',
    flujo: ['Caso descrito', 'Fuente oficial', 'Resoluciones relevantes', 'Cita verificable'], tags: ['IA', 'Búsqueda semántica', 'Fuente oficial'], imgs: [[IMG.fundalex, 'Buscador de jurisprudencia con resultado verificado']] },
  { id: 'educacion', ic: 'libro', sector: 'Educación', titulo: 'Refuerzo escolar con una foto del ejercicio',
    problema: 'Muchos alumnos de ESO se atascan con los deberes de Matemáticas o Física y en casa no siempre hay quien se los explique.',
    solucion: 'Una aplicación de chat: el alumno hace una foto al ejercicio y la IA lo lee, lo resuelve, comprueba el resultado y lo explica paso a paso.',
    resultado: 'Explicaciones a cualquier hora, con el resultado comprobado antes de enseñarlo.',
    flujo: ['Foto del ejercicio', 'Lectura con IA', 'Resolución comprobada', 'Explicación paso a paso'], tags: ['IA multimodal', 'Chat', 'Educación'], imgs: [[IMG.refuerzo, 'Aplicación de refuerzo escolar con IA']] },
  { id: 'medio', ic: 'radar', sector: 'Contenido', titulo: 'Nuestro blog, publicado por un equipo de agentes',
    problema: 'Mantener un blog de actualidad exige leer decenas de fuentes cada día y escribir con rigor. Hecho a mano, se come las mañanas.',
    solucion: 'Un sistema de agentes de IA que cada mañana revisa las fuentes, puntúa las noticias y nos propone las mejores por Telegram. Tras nuestra aprobación investiga, redacta, ilustra, optimiza para buscadores y publica.',
    resultado: 'Actualidad casi diaria con fuentes enlazadas y revisión humana antes de publicar.',
    flujo: ['Fuentes', 'Selección con IA', 'Aprobación por Telegram', 'Publicado'], tags: ['Agentes de IA', 'Automatización', 'Publicación automática'], imgs: [[IMG.medio, 'Archivo de noticias del blog']] },
];
const casoHTML = (c, i) => `<article class="tc-caso tc-reveal${i % 2 ? ' tc-caso--rev' : ''}" id="${c.id}">
<div class="tc-caso__txt">
<header class="tc-caso__h">${icon(c.ic)}<div>${c.ejemplo ? '<span class="tc-nota-ej">Ejemplo de lo que se puede implementar</span><br>' : ''}<span class="tc-eyebrow tc-eyebrow--plain">${c.sector}</span><h3>${c.titulo}</h3></div></header>
<div class="tc-caso__pc"><div class="tc-caso__p"><span class="tc-pc__l tc-pc__l--p">El problema</span><p>${c.problema}</p></div><div class="tc-caso__s"><span class="tc-pc__l">La solución</span><p>${c.solucion}</p></div></div>
${flow(c.flujo)}
<footer class="tc-caso__r"><span class="tc-caso__ok" aria-hidden="true">✓</span><p><b>${c.ejemplo ? 'Qué se puede conseguir' : 'Resultado'}:</b> ${c.resultado}</p></footer>
<div class="tc-tags">${c.tags.map((t) => `<span>${t}</span>`).join('')}</div>
${c.link ? `<div>${btn(c.link[0], c.link[1], true)}</div>` : ''}
</div>
<div class="tc-caso__vis">${c.imgs ? shots(c.imgs) : c.chat ? MINI_CHAT : `<div class="tc-caso__flowbig">${flow(c.flujo)}</div>`}</div>
</article>`;
// primera frase con un solo punto final (antes salía «..» si el texto tenía una sola frase)
const frase = (t) => t.split('. ')[0].replace(/\.+$/, '') + '.';
const casoCard = (id) => { const c = CASOS.find((x) => x.id === id); return `<article class="tc-box tc-pc tc-reveal">${icon(c.ic)}${c.ejemplo ? '<span class="tc-nota-ej">Ejemplo de lo que se puede implementar</span>' : ''}<span class="tc-eyebrow tc-eyebrow--plain">${c.sector}</span><h3>${c.titulo}</h3><span class="tc-pc__l tc-pc__l--p">Problema</span><p>${frase(c.problema)}</p><span class="tc-pc__l">Solución</span><p>${frase(c.solucion)}</p><a class="tc-link" href="/casos/#${c.id}">Ver el caso</a></article>`; };

// ======================= PÁGINAS =======================
const P = {};

P['transforma-con-ia'] = {
  id: 5851, title: 'Transforma con IA',
  seo: ['Consultoría de IA industrial | Transforma con IA', 'Consultoría de IA industrial en Murcia y toda España: ERP para la industria, automatización de pedidos, albaranes y facturas, y asistentes técnicos.', 'consultoría de IA industrial'],
  html: page(`
<header class="tc-hero tc-hero--home tc-hero--ind">${DECO('a')}<div class="tc-wrap tc-hero__grid">
 <div class="tc-hero__copy">
  <span class="tc-live"><i></i>Consultoría de IA industrial · Murcia y toda España</span>
  <h1 class="tc-h1-home"><span>Menos horas de papeleo</span> <span class="tc-grad tc-shine">en compras, almacén y facturación de tu industria</span></h1>
  <p class="tc-lead">Conectamos el correo, tu ERP y tus Excel para que pedidos, albaranes, facturas y presupuestos no se tecleen dos veces. Presencial en la Región de Murcia y en remoto en toda España.</p>
  <div class="tc-btns">${btn('/contacto/#reserva', 'Reserva el diagnóstico de 30 minutos')}${btn('/erp-industria/', 'Ver el ERP para la industria', true)}</div>
  <ul class="tc-pilares">
   <li><a href="/erp-industria/"><span class="tc-pilares__n">01</span>${icon('tuerca')}<span><b>ERP para la industria</b><small>Calcula costes, presupuesta y factura desde el móvil</small></span><span class="tc-pilares__a">${ARROW}</span></a></li>
   <li><a href="/distribucion-industrial/"><span class="tc-pilares__n">02</span>${icon('chat')}<span><b>Asistentes técnicos</b><small>Referencias y equivalencias en segundos</small></span><span class="tc-pilares__a">${ARROW}</span></a></li>
   <li><a href="/automatizacion-procesos-ia/"><span class="tc-pilares__n">03</span>${icon('flujo')}<span><b>Automatización y documentos</b><small>Pedidos, facturas y albaranes sin teclear</small></span><span class="tc-pilares__a">${ARROW}</span></a></li>
  </ul>
  <ul class="tc-proof"><li><b>30 min</b> de diagnóstico, gratis</li><li><b>1-3 semanas</b> para un piloto con tus datos</li><li><b>Sin permanencia</b> en el ERP</li></ul>
 </div>
 ${device(IMG.erp_inicio, 'ERP para la industria: lo pendiente de hoy, facturado, cobrado y vencido', '<span class="tc-device__ok">✓</span><span><b>Presupuesto calculado</b><small>Tu coste + tu margen · listo para enviar</small></span>')}
</div>
<div class="tc-wrap">${marquee}</div></header>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap tc-split tc-split--center">
 <div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('El problema')}<h2>¿Tu equipo pasa el día buscando referencias, contestando lo mismo y haciendo presupuestos a mano?</h2><p>En una empresa industrial buena parte de las horas se van en tareas que no fabrican ni venden nada: calcular un presupuesto, pasar un pedido al programa, buscar una equivalencia, perseguir un albarán. Son tareas repetitivas, con reglas claras y muchos datos. Justo donde la IA funciona mejor.</p><p class="tc-quote">Si tu equipo técnico pasa más tiempo buscando información que resolviendo problemas, hay algo que automatizar.</p></div>
 ${antesDespues}
</div></section>

<section class="tc-sec" id="erp"><div class="tc-wrap">
 <div class="tc-star tc-reveal">
  <div class="tc-star__txt">
   <span class="tc-badge">TransformaConIA Gestión</span>
   <h2>El ERP para la industria que se lleva en el bolsillo</h2>
   <p class="tc-lead">Sabes lo que te cuesta cada trabajo, le pones tu margen y el presupuesto sale en minutos. Albaranes firmados en el móvil, facturas, cobros y gastos por foto, en un programa que se usa como una app desde el teléfono o el ordenador.</p>
   <p class="tc-star__para">Nació en talleres de mecanizado y sirve igual para calderería, carpintería metálica, reparación de maquinaria o talleres de hidráulica. Y se combina con empresas de otros sectores activando los módulos que cada una necesita.</p>
   <div class="tc-mini">
    <div>${icon('calc')}<b>Calculadora de costes</b><small>Lo que te cuesta a ti + tu margen = precio</small></div>
    <div>${icon('firma')}<b>Albaranes firmados</b><small>El cliente firma en el móvil, en la obra</small></div>
    <div>${icon('euro')}<b>Facturas y cobros</b><small>Del presupuesto a la factura en un clic</small></div>
    <div>${icon('telegram')}<b>Gastos por foto</b><small>Ticket por Telegram y queda registrado</small></div>
    <div>${icon('carpeta')}<b>Paquete para la asesoría</b><small>El trimestre preparado con un botón</small></div>
    <div>${icon('chat')}<b>Asistente de IA</b><small>Prepara documentos y pide confirmación</small></div>
   </div>
   <div class="tc-oferta"><div><span>Puesta en marcha</span><b><s>990 €</s> 690 €</b></div><div><span>Mantenimiento orientativo</span><b>69 €/mes</b></div><div><span>Primeros 3 meses</span><b>Gratis</b></div><div><span>Permanencia</span><b>Ninguna</b></div></div>
   <div class="tc-btns">${btn('/erp-industria/', 'Conocer el ERP')}${btn('https://transformaconia-gestion.vercel.app/', 'Pedir una demo', true)}</div>
  </div>
  <div class="tc-star__vis">${shots([[IMG.erp_calculadora, 'Calculadora de costes del ERP con el margen aplicado'], [IMG.facturas, 'Facturas en el programa de gestión'], [IMG.cobros, 'Cobros y vencimientos'], [IMG.fiscal, 'Paquete trimestral para la asesoría']])}<p class="tc-nota">Pantallas reales del programa con datos de ejemplo. Precios orientativos sin IVA; oferta de lanzamiento.</p></div>
 </div>
</div></section>

<section class="tc-sec tc-sec--alt" id="soluciones"><div class="tc-wrap">${head('Soluciones y cómo trabajamos', 'Qué implantamos en tu empresa y cómo lo hacemos', 'Desde una automatización concreta hasta un programa de gestión completo. Todo empieza con un diagnóstico gratis y precios orientativos claros.', '<a class="tc-link" href="/soluciones/">Todas las soluciones y precios</a>')}${servCards()}
<div class="tc-subhead tc-reveal"><span class="tc-eyebrow tc-eyebrow--plain">Cómo trabajamos</span><p>De la primera llamada a funcionando, en tres pasos y sin pagar a ciegas:</p></div>${PASOS}
</div></section>

<section class="tc-sec"><div class="tc-wrap">${head('Casos', 'Qué hemos montado y qué se puede montar', 'Sin nombres de clientes por confidencialidad. El caso marcado como ejemplo no es un proyecto concreto: muestra lo que se puede implementar.', '<a class="tc-link" href="/casos/">Ver todos los casos</a>')}
<div class="tc-grid tc-grid--4">${['gestion', 'distribucion', 'documentacion', 'sap'].map(casoCard).join('')}</div>
<div class="tc-subhead tc-reveal"><span class="tc-eyebrow tc-eyebrow--plain">Sectores</span><p>Dónde más horas ahorramos:</p></div>
<div class="tc-chips tc-reveal">${SECTORES.map((x) => `<a href="/industria/#${x.id}">${x.t.split(':')[0]}</a>`).join('')}<a href="/otros-sectores/">Otros sectores</a><a href="/consultor-ia-murcia/">Región de Murcia</a></div></div></section>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Blog', 'IA en la industria y gestión de empresa', 'Casos de empresas industriales con IA y guías de gestión y automatización para aplicar en tu empresa.', '<a class="tc-link" href="/blog/">Ir al blog</a>')}[tc_categoria slug="ia-en-la-industria" n=4 relleno_ids="6768,6258"]</div></section>

<section class="tc-sec"><div class="tc-wrap">${head('Preguntas frecuentes', 'Lo que suelen preguntarnos')}${faq([
    ['¿Qué es Transforma con IA?', 'Una consultoría de inteligencia artificial y automatización de procesos con base en Murcia, especializada en la industria. Implantamos programas de gestión, asistentes técnicos, gestión documental y automatizaciones a medida en empresas de toda España.'],
    ['¿Qué procesos industriales se pueden automatizar con IA?', 'Los repetitivos con documentos o datos: presupuestos y cálculo de costes, pedidos que llegan por correo, consultas de referencias y equivalencias, albaranes y partes de trabajo, facturas de proveedor, avisos de avería e informes. En el diagnóstico gratuito vemos cuáles compensan en tu caso.'],
    ['¿Tengo que cambiar de ERP?', 'No. Si tu ERP tiene API, lo conectamos de forma directa; si no la tiene, valoramos cómo adaptarlo. Con SAP, por ejemplo, cualquier idea para mejorarlo se puede valorar, y lo mismo con el programa que uséis. Si no tienes programa de gestión o se te ha quedado corto, te ofrecemos nuestro ERP para la industria.'],
    ['¿Cuánto cuesta automatizar un proceso?', 'Como referencia orientativa, una automatización parte de 450 € + IVA, un asistente técnico de 900 €, el ERP para la industria de 690 € de puesta en marcha más un mantenimiento orientativo de 69 €/mes y una herramienta a medida de 2.500 €. Tras el diagnóstico recibes un presupuesto cerrado.'],
    ['¿Puedo probarlo antes de pagarlo todo?', 'Sí. Montamos un piloto con tus datos reales en 1 a 3 semanas y lo usáis en el día a día antes de pagar el total. Las acciones importantes siempre piden confirmación a una persona.'],
    ['¿Trabajáis fuera de Murcia?', 'Sí. En la Región de Murcia vamos a tu empresa y en el resto de España trabajamos en remoto por videollamada.'],
  ])}</div></section>
${contactoSplit()}
`),
};

P['industria'] = {
  title: 'IA para la industria',
  seo: ['Inteligencia artificial para la industria', 'Qué automatizamos con inteligencia artificial en talleres, distribución industrial, mantenimiento, instaladoras e integradores. Diagnóstico inicial gratis.', 'inteligencia artificial para la industria'],
  html: page(`${pagehead('<span>Industria</span>', 'IA para la industria', 'Automatización e inteligencia artificial para empresas industriales', 'Venimos de la industria y la mayor parte de lo que construimos es para ella. Estas son las tareas que más horas ahorran en cada tipo de empresa.', btn('/contacto/', 'Cuéntanos tu caso') + btn('/casos/', 'Ver casos', true), facts('Sectores', SECTORES.map((s, i) => [String(i + 1).padStart(2, '0'), `<a href="#${s.id}">${s.t}</a>`])))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-casos">${SECTORES.map((s, i) => `<article class="tc-sectorbig tc-reveal" id="${s.id}"><div class="tc-sectorbig__h">${icon(s.ic)}<span class="tc-sectorbig__n">${String(i + 1).padStart(2, '0')}</span></div><div class="tc-prose"><h2>${s.t}</h2><p class="tc-sect__frase">«${s.frase}»</p>${list(s.items)}<div class="tc-btns">${btn(s.sol[0], s.sol[1], true)}</div></div></article>`).join('')}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Así funciona', 'Una automatización trabaja como una línea de producción')}${linea()}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Casos', 'Casos y ejemplos para la industria', 'El caso marcado como ejemplo no es un proyecto concreto: muestra lo que se puede implementar.', '<a class="tc-link" href="/casos/">Todos los casos</a>')}<div class="tc-grid tc-grid--4">${['gestion', 'distribucion', 'documentacion', 'sap'].map(casoCard).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Por qué nosotros', 'Venimos de la industria')}${porQue}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Preguntas frecuentes', 'IA en la empresa industrial')}${faq([
    ['¿Por dónde empieza una empresa industrial con la IA?', 'Por la tarea que más horas repite cada semana: presupuestos, pedidos, consultas de referencias o documentación. Se automatiza una, se mide y después se amplía.'],
    ['¿Funciona con SAP u otro ERP?', 'Sí. Si tu ERP tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo. SAP es un buen ejemplo: cualquier idea para mejorarlo se puede implementar, y lo mismo en el programa que uséis.'],
    ['¿Qué pasa con la confidencialidad de mis datos?', 'Accesos mínimos, servidores en la Unión Europea siempre que es posible y nada se usa para entrenar modelos de terceros. Lo que montamos es tuyo.'],
    ['¿Hacéis visitas a la nave o al taller?', 'Sí, en la Región de Murcia. Ver cómo trabajáis en persona es la mejor forma de detectar qué automatizar.'],
  ])}</div></section>
${CALCULADORA}
${band('¿Tu sector no aparece?', 'Da igual: si hay tareas repetitivas con datos o documentos, hay algo que automatizar. Cuéntanos cómo trabajáis.')}`),
};

// Talleres industriales a los que va dirigido el ERP (nació en mecanizado; el resto se añadieron el 2026-10-09)
const TALLERES = [
  ['tuerca', 'Talleres de mecanizado', 'Donde nació el programa. Material, horas de torno o fresa y tu margen en cada pieza, con la cotización del acero, aluminio, cobre y zinc al día.'],
  ['fabrica', 'Calderería, soldadura y estructuras', 'Cada estructura o reparación presupuestada con su material, sus horas y tu margen, y el albarán firmado al entregar en obra.'],
  ['llave', 'Reparación y mantenimiento de maquinaria', 'Parte de trabajo firmado por el cliente al terminar, horas y recambios al presupuesto y factura sin volver a teclear nada.'],
  ['gota', 'Talleres de hidráulica y neumática', 'Reparaciones y montajes con su coste real, facturas de proveedor por foto y cobros pendientes a la vista.'],
  ['caja', 'Carpintería metálica y cerrajería industrial', 'De la medición al presupuesto de la puerta, la reja o la cubierta, y del albarán firmado a la factura, desde el móvil.'],
];
const CALC_PASOS = ['Material', 'Horas de máquina o de taller', 'Otros costes', '+ tu margen', '= precio de venta'];

P['erp-industria'] = {
  id: null, title: 'ERP para la industria',
  seo: ['ERP para la industria con IA | Transforma con IA', 'Programa de gestión para talleres de mecanizado, calderería y reparación: costes y margen, presupuestos, albaranes firmados y facturas. Desde 690 €.', 'erp para la industria'],
  html: page(`${pagehead('<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>ERP para la industria</span>', 'TransformaConIA Gestión · ERP para la industria', 'El ERP para la industria que se usa desde el móvil', 'Sabes lo que te cuesta cada trabajo, le pones tu margen y el presupuesto sale en minutos. Albaranes firmados, facturas, cobros y gastos en un solo programa, con un asistente de IA y Telegram para registrarlo todo sin sentarte al ordenador.', btn('https://transformaconia-gestion.vercel.app/', 'Pedir una demo') + btn('#precio', 'Ver precio orientativo', true), device(IMG.erp_calculadora, 'Calculadora de costes: lo que te cuesta el trabajo y el precio con tu margen', '<span class="tc-device__ok">✓</span><span><b>Coste + margen</b><small>Precio de venta listo para presupuestar</small></span>'))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-stats tc-reveal"><div><b>Minutos</b><span>para un presupuesto con tu margen</span></div><div><b>1 clic</b><span>del albarán firmado a la factura</span></div><div><b>1 foto</b><span>para registrar un gasto</span></div><div><b>1 botón</b><span>para el paquete de la asesoría</span></div></div></div></section>
<section class="tc-sec tc-sec--alt" id="talleres"><div class="tc-wrap">${head('Para quién', 'Pensado para talleres industriales', 'Nació en talleres de mecanizado y hoy se adapta a cualquier taller que presupueste, entregue y facture trabajos. Y se combina con empresas de otros sectores activando los módulos que cada una necesita.')}
<div class="tc-grid tc-grid--3">${TALLERES.map(([i, t, p], n) => `<article class="tc-box tc-reveal${n === 0 ? ' tc-box--star' : ''}">${n === 0 ? '<span class="tc-badge">Donde nació</span>' : ''}${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}<a class="tc-box tc-reveal" href="#contacto-erp">${icon('equipo')}<h3>¿Otro sector?</h3><p>El mismo programa se combina con empresas de otros sectores: activamos los módulos que necesitas y lo ajustamos a vuestra forma de trabajar.</p><span class="tc-link">Cuéntanos tu caso</span></a></div></div></section>
<section class="tc-sec"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Calculadora de costes')}<h2>Primero lo que te cuesta a ti. Después, tu precio.</h2><p>La calculadora no es solo para mecanizado: sirve para sacar lo que te cuesta cualquier trabajo o servicio que quieras prestar, ponerle tu margen y tener el precio de venta antes de presupuestar. Así sabes en cada oferta cuánto ganas.</p>${flow(CALC_PASOS)}${list(['Para piezas, reparaciones, montajes, servicios o cualquier trabajo', 'Tus tarifas de máquina, de taller y de material guardadas', 'En el metal, con la cotización del material al día', 'Del cálculo al presupuesto con tu logo en un clic'])}</div>
<div class="tc-reveal">${shot(IMG.erp_calculadora, 'Calculadora de costes del ERP para la industria con el margen aplicado', 'Pantalla real con datos de ejemplo')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Qué incluye', 'Todo lo que pasa en un taller, en un solo programa')}
<div class="tc-grid tc-grid--3">${[
    ['calc', 'Calculadora de costes y precios', 'Lo que te cuesta cada trabajo o servicio (material, horas y otros costes) con tu margen aplicado, para presupuestar sabiendo cuánto ganas.'],
    ['doc', 'Presupuestos', 'Del cálculo al presupuesto con tu logo en un clic. Ves cuáles están pendientes y cuáles se han aceptado.'],
    ['firma', 'Albaranes y partes firmados', 'El cliente firma en el móvil al entregar o al terminar el trabajo. El albarán queda en su expediente.'],
    ['euro', 'Facturas, cobros y vencimientos', 'Facturas enlazadas a sus albaranes, avisos de lo vencido y a quién reclamar cada semana.'],
    ['telegram', 'Gastos por foto en Telegram', 'Mandas la foto del ticket o la factura y la IA lee proveedor, importe e IVA y lo registra.'],
    ['carpeta', 'Fiscal y asesor', 'Calendario de impuestos y el paquete trimestral de facturas y gastos listo para tu asesoría.'],
    ['cal', 'Agenda', 'Trabajos, entregas y visitas del equipo en un calendario compartido.'],
    ['grafica', 'Informes', 'Facturado, cobrado, pendiente y márgenes de un vistazo, sin preparar nada.'],
    ['chat', 'Asistente de IA', 'Le pides un presupuesto o un correo con tus palabras; lo prepara y te pide confirmación antes de hacer nada.'],
  ].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Como una app')}<h2>En el taller, en la obra o en el coche</h2><p>No hay que instalar nada: se abre desde el móvil, la tableta o el ordenador con tu usuario. El jefe ve lo pendiente de hoy al abrirlo, el encargado hace albaranes en la obra y la oficina factura sin pedir papeles a nadie.</p>${list(['Usuarios con permisos: jefe, oficina, encargado…', 'Tus datos en un servidor propio para tu empresa, en la UE', 'Tu logo y tus datos en presupuestos, albaranes y facturas', 'Copias de seguridad y soporte incluidos en el mantenimiento'])}</div>
<div class="tc-phoneonly tc-reveal"><figure class="tc-device__phone tc-device__phone--solo"><img src="${IMG.erp_movil}" width="780" height="1688" alt="El ERP para la industria en el móvil: lo pendiente de hoy, impuestos y cobros" loading="lazy" decoding="async"></figure></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Implantación', 'Funcionando en pocas semanas, configurado a tu manera')}
<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">Semana 1</span><h3>Demo y configuración</h3><p>Te lo enseñamos con datos de ejemplo, cargamos tus clientes, tu catálogo y tus tarifas de máquina, taller y material.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">Semanas 2 y 3</span><h3>Arranque con tu equipo</h3><p>Empezáis a presupuestar, albaranar y facturar con él. Ajustamos lo que haga falta para que encaje con vuestra forma de trabajar.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">Cuando tú das el visto bueno</span><h3>Empieza el mantenimiento</h3><p>El mantenimiento no empieza hasta que el programa está a tu gusto. Soporte, copias y mejoras incluidos.</p></div></div></div></section>
${CALCULADORA}
<section class="tc-sec" id="precio"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:16px">${eyebrow('Precio orientativo')}<h2>Oferta de lanzamiento para las 10 primeras empresas</h2><p>Puesta en marcha en dos pagos y los tres primeros meses de mantenimiento gratis. Sin permanencia: mes a mes con 30 días de aviso. Todos los precios son orientativos; tras la demo recibes el presupuesto cerrado.</p></div>
${facts('Precios orientativos (sin IVA)', [['Puesta en marcha', '<s style="color:var(--tc-dim);font-weight:400">990 €</s> 690 €'], ['Mantenimiento orientativo', '69 €/mes'], ['Primeros 3 meses', 'Gratis'], ['Usuario extra', '15 €/mes'], ['Permanencia', 'Ninguna']])}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Sobre el ERP para la industria')}${faq([
    ['¿Para qué empresas está pensado?', 'Para talleres industriales que presupuestan, entregan y facturan trabajos: mecanizado, calderería y estructuras metálicas, carpintería metálica, reparación y mantenimiento de maquinaria, hidráulica y neumática. También se combina con empresas de otros sectores activando los módulos que necesiten.'],
    ['¿La calculadora es solo para mecanizado?', 'No. Sirve para sacar lo que te cuesta a ti cualquier trabajo o servicio, ponerle tu margen y calcular el precio de lo que quieras prestar. En el metal, además, usa la cotización del material al día.'],
    ['¿Puedo verlo funcionando antes de decidir?', 'Sí. Te lo enseñamos en una demo con datos de ejemplo y calculamos un presupuesto real de tu taller con tu margen.'],
    ['Ya tengo un programa de gestión, ¿se puede conectar?', 'Si tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo. Además, cargamos clientes, proveedores, catálogo y tarifas desde Excel o desde lo que exporte tu programa actual.'],
    ['¿Sirve para presentar los impuestos?', 'Te prepara el paquete trimestral para tu asesoría con facturas emitidas, gastos y totales. La presentación la sigue haciendo tu asesor.'],
    ['¿Qué pasa si quiero dejarlo?', 'No hay permanencia. Avisas con 30 días y te llevas tus datos exportados.'],
  ])}</div></section>
<div id="contacto-erp">${band('¿Lo vemos con tus trabajos y tus precios?', 'En una videollamada te enseñamos el programa y calculamos un presupuesto real de tu taller con tu margen.', btn('https://transformaconia-gestion.vercel.app/', 'Pedir una demo') + btn('/contacto/#reserva', 'Reserva tu diagnóstico gratis', true))}</div>`),
};

P['distribucion-industrial'] = {
  title: 'Asistente técnico para distribución industrial',
  seo: ['Asistente técnico con IA para distribuidores', 'Asistente de IA que responde referencias, equivalencias entre marcas, fichas técnicas y stock con tu catálogo, en tu web y en el mostrador.', 'chatbot para distribuidores industriales'],
  html: page(`${pagehead('<a href="/industria/">Industria</a><span aria-hidden="true">/</span><span>Distribución industrial</span>', 'Distribución y suministro industrial', 'IA que entiende tu catálogo: la referencia correcta en segundos', 'Un asistente técnico que responde a tus clientes y a tu mostrador con tu catálogo real: referencias, equivalencias entre marcas, fichas técnicas y disponibilidad. Si no está seguro, pasa la consulta a una persona.', btn('/contacto/', 'Quiero verlo con mi catálogo') + btn('/casos/#distribucion', 'Ver el caso real', true), facts('En resumen', [['Precio orientativo', 'desde 900 €'], ['Piloto', 'con tu catálogo real'], ['Canales', 'Web, mostrador, mensajería'], ['Sin cambiar', 'tu ERP ni tu web']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('El problema')}<h2>Tu equipo pasa el día al teléfono buscando referencias</h2><p>Rodamientos, transmisión, neumática, hidráulica, tornillería, herramienta: miles de referencias, varias marcas y clientes que preguntan por una equivalencia a las ocho de la tarde. Cada consulta ocupa a alguien que sabe, y muchas se pierden fuera de horario.</p>${list(['Referencias incompletas o mal escritas', 'Equivalencias entre fabricantes', 'Medidas, fichas técnicas y disponibilidad', 'Consultas fuera de horario que acaban en la competencia'])}</div>${MINI_CHAT}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Qué hace', 'Un técnico de mostrador que no se cansa')}<div class="tc-grid tc-grid--3">${[
    ['lupa', 'Encuentra la referencia', 'Entiende lo que escribe el cliente aunque falten letras, venga con otra nomenclatura o describa la pieza por sus medidas.'],
    ['flujo', 'Da las equivalencias', 'Cruza marcas y muestra todas las alternativas con las mismas medidas y características.'],
    ['doc', 'Enseña la ficha técnica', 'Medidas, materiales, cargas y documentación de cada producto, sin enlaces a webs externas.'],
    ['caja', 'Consulta el stock', 'Conectado a tu stock o a tu tarifa, dice qué hay y cuándo sale.'],
    ['euro', 'Lleva al pedido', 'Añade al carrito o deja la solicitud de presupuesto preparada para tu equipo.'],
    ['equipo', 'Pasa a una persona', 'Si la consulta no está clara, la deriva a tu mostrador con todo el contexto.'],
  ].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Cómo empezamos', 'Piloto con tu catálogo antes de decidir')}${PASOS}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Asistente técnico de catálogo')}${faq([
    ['¿Necesito tener el catálogo ordenado?', 'No. Empezamos con lo que tengas: Excel, PDF de fabricantes o la exportación de tu ERP. Parte del trabajo es ordenarlo para que la IA lo entienda.'],
    ['¿Cómo sabe el cliente que la referencia es la correcta?', 'El asistente responde solo con tu catálogo y enseña siempre la ficha técnica para comprobarla. Si la consulta no está clara, la pasa a tu equipo.'],
    ['Nuestros clientes prefieren llamar', 'Perfecto, que sigan llamando. El asistente cubre la noche y el fin de semana y ayuda a tu mostrador a encontrar la referencia mientras atiende.'],
    ['¿Se conecta con mi ERP?', 'Si tu ERP tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo. Así el asistente consulta tu stock y tus tarifas reales.'],
  ])}</div></section>
${band('¿Te lo enseñamos con una referencia que vendéis?', '15 minutos por videollamada o en tu mostrador si estás en la Región de Murcia.')}`),
};

P['otros-sectores'] = {
  title: 'Otros sectores',
  seo: ['IA para clínicas, asesorías y comercios | Transforma con IA', 'Asistentes que atienden a tus clientes, citas, documentación y software a medida para clínicas, asesorías, despachos, comercios y centros de formación.', 'chatbot para asesorías y clínicas'],
  html: page(`${pagehead('<span>Otros sectores</span>', 'Más allá de la industria', 'Si tu equipo repite la misma tarea cada día, se puede automatizar', 'Nuestra especialidad es la industria, pero el mismo método funciona en clínicas, asesorías, despachos, comercios y centros de formación. Estos son proyectos que ya hemos hecho.', btn('/contacto/', 'Cuéntanos tu caso'), facts('Sectores', OTROS_SECTORES.map(([, t]) => [t, 'Sí'])))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-grid tc-grid--4">${[
    ['clinicas', 'cal', 'Clínicas y centros con cita', 'Agenda, fichas, recordatorios automáticos y un asistente que atiende y cita a cualquier hora.'],
    ['asesorias', 'balanza', 'Asesorías y despachos', 'Asistentes que responden a los clientes y piden la documentación que falta; buscadores jurídicos con IA.'],
    ['comercio', 'caja', 'Comercio y tienda online', 'Asistentes de producto que resuelven dudas y llevan al carrito; catálogos y fichas automáticas.'],
    ['educacion', 'libro', 'Educación y formación', 'Aplicaciones que explican ejercicios paso a paso y preparan material de práctica.'],
  ].map(([id, i, t, p]) => `<a class="tc-box tc-reveal" href="#${id}">${icon(i)}<h3>${t}</h3><p>${p}</p><span class="tc-link">Ver ejemplo</span></a>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-casos">${[
    ['atencion', 'clinicas'], ['clinicas', null], ['despachos', 'asesorias'], ['distribucion', 'comercio'], ['educacion', 'educacion'],
  ].map(([cid, anchor], i) => { const c = CASOS.find((x) => x.id === cid); return casoHTML({ ...c, id: anchor || c.id + '-o', link: null }, i); }).join('')}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('También hacemos', 'Webs y contenido automático', 'Dos servicios que no son nuestra especialidad pero que podemos hacer si los necesitas junto con lo demás.')}<div class="tc-grid tc-grid--2"><a class="tc-box tc-reveal" href="/diseno-web/">${icon('app')}<h3>Diseño web</h3><p>Webs rápidas y pensadas para salir en Google y captar contactos. Presupuesto a medida.</p><span class="tc-link">Ver diseño web</span></a><a class="tc-box tc-reveal" href="/contenido-automatico-ia/">${icon('noticia')}<h3>Contenido automático</h3><p>Blog de noticias, fichas de producto y páginas por zona, redactados con IA y revisados antes de publicarse.</p><span class="tc-link">Ver contenido automático</span></a></div></div></section>
${band('¿Tu caso es distinto?', 'Cuéntanos qué tarea os quita más tiempo y te decimos si tiene solución y cuánto costaría.')}`),
};

P['soluciones'] = {
  title: 'Soluciones de IA para empresas',
  seo: ['Soluciones de IA para la industria | Transforma con IA', 'ERP para la industria, automatización de procesos, asistentes técnicos, gestión documental y mejoras sobre SAP o tu ERP, con precios orientativos.', 'soluciones de automatización industrial con IA'],
  html: page(`${pagehead('<span>Soluciones</span>', 'Soluciones', 'Lo que implantamos, con precio claro', 'Seis formas de empezar. Todas arrancan con un diagnóstico gratuito de 30 minutos y, cuando hay desarrollo, con un piloto que pruebas con tus propios datos antes de pagar el total.', btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos reales', true), facts('Precios orientativos (sin IVA)', [['Diagnóstico', 'Gratis'], ['ERP para la industria', 'desde 690 €'], ['Automatización', 'desde 450 €'], ['Gestión documental', 'desde 450 €'], ['Asistente técnico', 'desde 900 €'], ['Herramienta a medida', 'desde 2.500 €']]))}
${sec(servCards() + `<div class="tc-subhead tc-reveal"><span class="tc-eyebrow tc-eyebrow--plain">Soluciones concretas</span><p>Lo que montamos con más frecuencia:</p></div>` + chips, 'tc-sec--tight')}
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', 'Tres pasos, y en ninguno pagas a ciegas')}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Por qué con nosotros', 'Lo que nos diferencia')}${porQue}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Antes de empezar')}${faq([
    ['¿Los precios son cerrados?', 'No: son orientativos para que sepas el orden de magnitud. Tras el diagnóstico gratuito te enviamos un presupuesto cerrado por escrito.'],
    ['¿Necesito conocimientos técnicos?', 'No. Tú nos explicas cómo trabajáis y nosotros nos encargamos de la parte técnica. Al terminar formamos a tu equipo y te dejamos una guía sencilla.'],
    ['¿Cuánto se tarda en tener algo funcionando?', 'Una automatización sencilla, una o dos semanas. Un asistente técnico, dos o tres. Una herramienta a medida, de cuatro a ocho, con versiones intermedias que ya podéis usar.'],
    ['¿Hay que pagar la IA aparte?', 'El consumo de los modelos de IA suele ser de pocos euros al mes en una pyme. Lo incluimos en el mantenimiento o lo pagas directamente al proveedor, como prefieras.'],
    ['¿Cuánto cuesta el mantenimiento?', 'Depende de la solución. Como referencia orientativa: desde 39 €/mes una automatización, desde 49 €/mes un asistente o el contenido automático, 69 €/mes el ERP para la industria y desde 69 €/mes el soporte de una herramienta a medida. Te lo confirmamos en el presupuesto cerrado.'],
    ['¿Hay subvenciones?', 'Según el momento, programas como Kit Consulting o ayudas regionales a la digitalización pueden cubrir parte. En el diagnóstico te decimos si alguna encaja.'],
  ])}</div></section>
${band('Empieza por lo que más horas os quita', 'Un diagnóstico de 30 minutos, gratis y sin compromiso.')}`),
};

const servicio = ({ crumb, eb, h1, lead, seo, resumen, que, como, precio, faqs, extra = '' }) => ({
  title: crumb, seo,
  html: page(`${pagehead(`<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>${crumb}</span>`, eb, h1, lead, btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('En resumen', resumen))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${head('Qué resolvemos', que[0], que[1])}<div class="tc-grid tc-grid--3">${que[2].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
${extra}
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', como)}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal">${eyebrow('Precio orientativo')}<h2>${precio[0]}</h2><p>${precio[1]}</p></div><div class="tc-box tc-reveal"><p class="tc-price" style="border:0;padding:0;margin:0">${/medida/.test(precio[2]) ? '' : '<span>Orientativo</span> '}${precio[2]}</p><p>${/medida/.test(precio[2]) ? 'Cada web es distinta: te enviamos un presupuesto cerrado adaptado a tus objetivos y requisitos.' : 'Precio de referencia. Tras el diagnóstico gratuito recibes un presupuesto cerrado.'}</p><div>${btn('/contacto/', 'Quiero un presupuesto')}</div></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Dudas habituales')}${faq(faqs)}</div></section>
${band('¿Lo vemos aplicado a tu empresa?', 'En 30 minutos te decimos si tiene sentido en tu caso y cuánto costaría. Gratis.')}`),
});

P['automatizacion-procesos-ia'] = servicio({
  crumb: 'Automatización de procesos', eb: 'Automatización de procesos con IA',
  h1: 'Automatización de procesos para que tu equipo deje de copiar y pegar',
  lead: 'Conectamos tu correo, tu ERP, tus hojas de cálculo y tus documentos para que pedidos, albaranes, facturas y avisos se muevan solos, con IA donde hace falta leer, clasificar o redactar.',
  seo: ['Automatización de procesos industriales | Transforma con IA', 'Automatización de procesos industriales con IA: pedidos, albaranes, facturas y avisos de avería con tu ERP. Desde 450 € + IVA y diagnóstico gratis.', 'automatización de procesos industriales'],
  resumen: [['Precio orientativo', 'desde 450 €'], ['Plazo', '1 a 2 semanas'], ['Conecta con', 'Correo, ERP y Excel'], ['Mantenimiento orientativo', 'desde 39 €/mes']],
  que: ['Las tareas que nadie quiere hacer', 'Si alguien repite la misma tarea cada día con el ordenador, casi seguro que se puede automatizar.', [
    ['sobre', 'Pedidos que llegan por correo', 'La IA lee el pedido en PDF o en el cuerpo del correo, cruza referencias con tu ERP y lo da de alta. Tu equipo revisa solo los dudosos.'],
    ['llave', 'Avisos y órdenes de trabajo', 'El cliente o el técnico avisa por mensaje; se clasifica por urgencia y la orden de trabajo queda creada y asignada.'],
    ['grafica', 'Informes y avisos', 'Producción, ventas o cobros: el informe se prepara solo y te llega al correo o a Telegram cuando digas.']]],
  extra: `<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${linea()}</div></section>`,
  como: 'Primero entendemos el proceso, después lo automatizamos',
  precio: ['Depende del proceso', 'Varía según cuántos programas hay que conectar y cuánto tiene que «pensar» la IA.', 'desde <b>450 €</b> + IVA'],
  faqs: [
    ['¿Qué procesos se pueden automatizar?', 'Los repetitivos con documentos o datos: pedidos que llegan por correo, albaranes y partes de trabajo, facturas de proveedor, avisos de avería e informes. En el diagnóstico gratuito vemos cuáles compensan en tu caso.'],
    ['¿Funciona con mi ERP?', 'Si tu ERP tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo. Puede conectarse con SAP y con los ERP habituales en la industria, y lo comprobamos en el diagnóstico.'],
    ['¿Tengo que cambiar mi forma de trabajar?', 'No. La automatización se adapta a cómo trabajáis hoy y tu equipo solo revisa lo que necesita a una persona.'],
  ],
});

P['agentes-chatbots-ia'] = servicio({
  crumb: 'Asistentes técnicos y chatbots', eb: 'Asistentes técnicos y chatbots de IA',
  h1: 'Asistentes de IA que conocen tu catálogo y tu empresa de verdad',
  lead: 'Asistentes que responden con tu catálogo, tus tarifas y tus manuales. Para atender a clientes en tu web o por mensajería, o para que tu equipo encuentre cualquier dato técnico en segundos.',
  seo: ['Asistentes técnicos y chatbots de IA | Transforma con IA', 'Asistentes de IA con tu catálogo, fichas técnicas y manuales: referencias, equivalencias, stock y citas, en tu web, WhatsApp o Telegram.', 'chatbot con IA para empresas'],
  resumen: [['Precio orientativo', 'desde 900 €'], ['Plazo', '2 a 3 semanas'], ['Canales', 'Web, WhatsApp, Telegram'], ['Mantenimiento orientativo', 'desde 49 €/mes']],
  que: ['Respuestas correctas, a cualquier hora', 'Un buen asistente no se inventa nada: consulta tus datos y, si no sabe algo, lo dice y avisa a una persona.', [
    ['caja', 'Asistente técnico de catálogo', 'Referencias, equivalencias entre marcas, fichas y disponibilidad para tus clientes o tu mostrador.'],
    ['lupa', 'Buscador técnico interno', 'Tu equipo pregunta en lenguaje normal y el asistente contesta con el manual, la ficha o el histórico correcto.'],
    ['cal', 'Atención y citas', 'Para asesorías, clínicas o servicios técnicos: responde dudas, recoge datos y agenda.']]],
  como: 'Un asistente útil se diseña alrededor de tus datos',
  precio: ['Depende de lo que tenga que saber y hacer', 'Varía según la información que deba consultar y las acciones que pueda realizar.', 'desde <b>900 €</b> + IVA'],
  faqs: [
    ['¿Qué diferencia hay entre un chatbot y un agente de IA?', 'Un chatbot responde preguntas. Un agente además actúa: consulta sistemas, crea documentos o lanza tareas. Empezamos por lo que tu caso necesite.'],
    ['¿Responde solo con mis datos?', 'Sí. Responde con tu información y, cuando una consulta no está clara, la pasa a una persona de tu equipo. Las acciones importantes siempre piden confirmación.'],
    ['¿Puede estar en WhatsApp?', 'Sí, mediante la API oficial de WhatsApp Business. También en tu web, en Telegram o dentro de tus herramientas internas.'],
  ],
});

P['gestion-documental-ia'] = servicio({
  crumb: 'Gestión documental con IA', eb: 'Gestión documental con IA',
  h1: 'Gestión documental con IA: cada papel, en su sitio y sin teclear',
  lead: 'Facturas de proveedor, albaranes, tickets, certificados, pedidos y planos. La IA los lee desde una foto, un PDF o un correo, extrae los datos, los clasifica y los registra en tu programa.',
  seo: ['Gestión documental con IA para empresas | Transforma con IA', 'Lectura automática de facturas, albaranes, tickets y certificados con IA: extrae los datos, los clasifica y los archiva en tu ERP. Desde 450 € + IVA.', 'gestión documental con IA'],
  resumen: [['Precio orientativo', 'desde 450 €'], ['Plazo', '1 a 3 semanas'], ['Documentos', 'Foto, PDF, correo'], ['Destino', 'Tu ERP, Excel o carpeta']],
  que: ['El papeleo que se come las tardes', 'Cada documento que alguien abre, lee y teclea en otro sitio es tiempo que la IA puede devolverte.', [
    ['doc', 'Facturas y albaranes de proveedor', 'Proveedor, fecha, líneas, importes e IVA leídos solos y registrados en tu programa. Lo dudoso, marcado para revisar.'],
    ['telegram', 'Tickets y gastos del equipo', 'Cada trabajador manda la foto por Telegram y el gasto queda registrado con su imputación.'],
    ['carpeta', 'Archivo y asesoría', 'Certificados, contratos y documentos clasificados por cliente u obra, y el paquete trimestral listo para la asesoría.']]],
  extra: `<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-reveal">${shots([[IMG.fiscal, 'Paquete trimestral para la asesoría', 'Documentación preparada para la asesoría'], [IMG.facturas, 'Facturas registradas', 'Facturas registradas sin teclear']])}<p class="tc-nota">Pantallas reales con datos de ejemplo.</p></div></section>`,
  como: 'Empezamos por el documento que más se repite',
  precio: ['Depende del volumen y del destino', 'Varía según los tipos de documento, cuántos llegan al mes y dónde hay que registrarlos.', 'desde <b>450 €</b> + IVA'],
  faqs: [
    ['¿Lee documentos escaneados o fotos malas?', 'Sí, la IA actual lee fotos y escaneos con bastante soltura. Si un dato no está claro, el documento se marca para que una persona lo revise.'],
    ['¿Dónde quedan guardados los documentos?', 'Donde trabajes: en tu ERP, en una carpeta compartida, en Google Drive o en nuestro programa de gestión. Siempre con servidores en la UE cuando es posible.'],
    ['¿Sirve para la asesoría?', 'Sí. Al final de cada trimestre se prepara el paquete de facturas y gastos ordenado para que tu asesor lo tenga completo y a tiempo.'],
  ],
});

P['desarrollo-a-medida-ia'] = servicio({
  crumb: 'Herramientas a medida y SAP', eb: 'Desarrollo a medida con IA',
  h1: 'Herramientas a medida con IA, conectadas a SAP, tu ERP o Excel',
  lead: 'Aplicaciones web hechas para vuestra forma de trabajar: buscan en tu catálogo, calculan presupuestos, leen planos y documentos y se conectan con SAP, tu ERP o Excel.',
  seo: ['Desarrollo a medida con IA y SAP | Transforma con IA', 'Aplicaciones a medida con IA para la industria: buscadores técnicos, presupuestos, lectura de documentos e integración con SAP. Desde 2.500 € + IVA.', 'desarrollo de software a medida con IA'],
  resumen: [['Precio orientativo', 'desde 2.500 €'], ['Plazo', '4 a 8 semanas'], ['Integraciones', 'SAP, ERP, Excel'], ['Soporte orientativo', 'desde 69 €/mes']],
  que: ['Cuando el Excel ya no da más de sí', 'Hay procesos tan propios de tu empresa que ningún programa estándar los cubre. Ahí una herramienta a medida marca la diferencia.', [
    ['lupa', 'Mejoras sobre SAP o tu ERP', 'Por ejemplo, un buscador que encuentra el artículo correcto con las palabras de cada uno. Cualquier idea para mejorar SAP, o el programa que uséis, se puede implementar.'],
    ['calc', 'Presupuestadores técnicos', 'Calculan con tus tarifas, tiempos y materiales y dejan la oferta lista para enviar.'],
    ['flujo', 'Conectada a lo que ya usas', 'Importa y exporta con SAP, tu ERP, Excel o tu tienda online sin romper vuestra forma de trabajar.']]],
  como: 'Versiones que ya puedes usar desde las primeras semanas',
  precio: ['Depende del alcance', 'Varía según las pantallas, integraciones y usuarios. Se entrega por fases para que la uséis cuanto antes.', 'desde <b>2.500 €</b> + IVA'],
  faqs: [
    ['¿La herramienta es mía?', 'Sí. Lo que montamos para ti es tuyo, con su documentación. Si un día quieres llevarlo a otro proveedor, puedes.'],
    ['¿Se puede hacer algo sobre SAP?', 'Sí. Un ejemplo de lo que se puede implementar es una capa de búsqueda inteligente de artículos sincronizada con SAP, y cualquier otra idea para mejorar SAP, o el programa que uséis, se puede valorar.'],
    ['¿Y si mi programa no es SAP?', 'Igual. Si tu ERP tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo.'],
    ['¿Se puede ampliar después?', 'Sí. Se diseña por módulos para ir añadiendo funciones según las vayáis necesitando.'],
  ],
});

P['contenido-automatico-ia'] = servicio({
  crumb: 'Noticias y páginas automáticas', eb: 'Contenido automático con IA',
  h1: 'Noticias y páginas que se publican solas, con tu visto bueno',
  lead: 'Montamos sistemas que buscan novedades, redactan, ilustran y publican en tu web: un blog de actualidad de tu sector, fichas de producto o páginas por zona. Nuestro blog funciona exactamente así.',
  seo: ['Noticias y páginas automáticas con IA | Transforma con IA', 'Blog de noticias automático, fichas de producto y páginas generadas con IA y revisadas antes de publicarse. Precio orientativo desde 600 € + IVA.', 'blog automático con IA'],
  resumen: [['Precio orientativo', 'desde 600 €'], ['Plazo', '1 a 3 semanas'], ['Funciona con', 'Tu web actual'], ['Mantenimiento orientativo', 'desde 49 €/mes']],
  que: ['Tu web, siempre viva', 'Publicar con regularidad es lo que más ayuda a aparecer en Google y en ChatGPT, y lo primero que se abandona por falta de tiempo.', [
    ['noticia', 'Blog de noticias de tu sector', 'Cada mañana se revisan tus fuentes y te llegan propuestas al móvil. Apruebas con un toque y el artículo sale redactado, ilustrado y optimizado.'],
    ['doc', 'Fichas de producto', 'Fichas técnicas y páginas de producto generadas desde tu catálogo, revisadas antes de publicarse.'],
    ['mapa', 'Páginas por zona o por servicio', 'Páginas pensadas para cada zona o servicio que ofreces, generadas con IA y revisadas antes de publicarse.']]],
  como: 'Tú decides qué se publica; el sistema hace el resto',
  precio: ['Depende de la web y del volumen', 'Varía según el tipo de contenido, las fuentes y cuántas publicaciones al mes quieras.', 'desde <b>600 €</b> + IVA'],
  faqs: [
    ['¿Se publica algo sin que yo lo vea?', 'Solo si tú quieres. Lo normal es que te llegue la propuesta al móvil o al correo y se publique cuando la apruebas.'],
    ['¿Google penaliza el contenido hecho con IA?', 'Google penaliza el contenido pobre o masivo, no la herramienta. Por eso cada pieza se basa en fuentes reales, aporta criterio propio y pasa una revisión antes de publicarse.'],
    ['¿Cuánto cuesta la IA de cada artículo?', 'Unos céntimos por texto y algo más por las imágenes. Va incluido en el mantenimiento o lo pagas directamente al proveedor.'],
  ],
});

P['diseno-web'] = servicio({
  crumb: 'Diseño web', eb: 'Diseño web profesional',
  h1: '¿Te gusta esta web? Podemos hacer la tuya',
  lead: 'Diseñamos webs como la que estás viendo: rápidas, animadas, pensadas para aparecer en Google y para convertir visitas en contactos. Cuéntanos tus objetivos y requisitos y te pasamos un presupuesto adaptado.',
  seo: ['Diseño web para empresas en Murcia | Transforma con IA', 'Webs rápidas, animadas y pensadas para salir en Google y captar clientes, con formularios conectados y blog automático opcional. Presupuesto a medida.', 'diseño web para empresas Murcia'],
  resumen: [['Precio', 'Presupuesto a medida'], ['Plazo', '2 a 4 semanas'], ['Incluye', 'Diseño, textos y SEO'], ['Opcional', 'Blog automático con IA']],
  que: ['Una web que trabaja para tu empresa', 'No solo bonita: cada sección está pensada para explicar lo que haces, generar confianza y conseguir que te escriban.', [
    ['app', 'Diseño a tu marca', 'Colores, tipografías, ilustraciones y animaciones con personalidad propia, sin plantillas que se repiten en mil webs.'],
    ['lupa', 'Pensada para Google', 'Textos con las búsquedas de tus clientes, datos estructurados, velocidad y páginas por servicio y por zona.'],
    ['sobre', 'Contactos que llegan', 'Formularios conectados a tu correo o a Telegram, botones de llamada y, si quieres, un asistente de IA que atiende.']]],
  como: 'De la primera reunión a tu web publicada',
  precio: ['Adaptado a lo que necesitas', 'Depende del número de páginas, los textos, las integraciones y si quieres blog automático o asistente.', '<b>Presupuesto a medida</b>'],
  faqs: [
    ['¿Podré actualizar la web yo mismo?', 'Sí. La montamos sobre la plataforma que te resulte más cómoda de mantener después, o a medida si lo necesitas.'],
    ['¿Escribís vosotros los textos?', 'Sí. Te entrevistamos, redactamos los textos pensando en Google y en tus clientes y tú los revisas antes de publicar.'],
    ['¿Puedo tener un blog que se publique solo?', 'Sí, como el nuestro: el sistema propone noticias de tu sector, tú apruebas y el artículo se publica redactado e ilustrado.'],
  ],
});

P['casos'] = {
  title: 'Casos',
  seo: ['Casos de IA en la industria | Transforma con IA', 'ERP para la industria, asistente técnico en tienda industrial, gestión documental y un ejemplo de IA sobre SAP, con el problema y la solución de cada uno.', 'casos de automatización industrial'],
  html: page(`${pagehead('<span>Casos</span>', 'Casos', 'Casos de industria y de otros sectores', 'Lo que hemos construido y un ejemplo de lo que se puede implementar. Sin nombres de clientes por confidencialidad, pero con lo que hacía falta resolver, lo que montamos y cómo funciona. Si quieres ver alguno en marcha, te lo enseñamos en una videollamada.', btn('/contacto/', 'Tengo un problema parecido'), facts('Índice', CASOS.map((c) => [c.sector, `<a href="#${c.id}">Ver</a>`])))}
<section class="tc-sec--gal" style="padding-bottom:16px">${galeria}</section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-casos">${CASOS.filter((c) => !c.ejemplo).map((c, i) => casoHTML(c, i)).join('')}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Ejemplo', 'Lo que se puede implementar', 'No es un proyecto concreto: es una muestra de lo que se puede hacer sobre un ERP que ya usas.')}<div class="tc-casos">${CASOS.filter((c) => c.ejemplo).map((c, i) => casoHTML(c, i)).join('')}</div></div></section>
${band('¿Tienes un problema parecido?', 'Cuéntanoslo y te decimos cómo lo resolveríamos y cuánto costaría. Gratis y sin compromiso.')}`),
};

P['quienes-somos'] = {
  id: 7105, title: 'Quiénes somos',
  seo: ['Quiénes somos | Consultoría de IA industrial', 'Quiénes somos en Transforma con IA: Juan Carlos Ros, consultor y desarrollador de IA, y cómo trabajamos la automatización con empresas industriales.', 'quiénes somos transforma con ia'],
  html: page(`${pagehead('<span>Quiénes somos</span>', 'Quiénes somos', 'Transforma con IA: consultoría de IA para la industria', 'Detrás de Transforma con IA está Juan Carlos Ros, consultor y desarrollador de IA. Viene de la industria y construye él mismo lo que implanta: integraciones con el ERP y el correo, lectura automática de documentos, asistentes que consultan catálogos y automatizaciones con revisión humana.', btn('/contacto/#reserva', 'Reserva el diagnóstico de 30 minutos'), facts('En pocas palabras', [['Quién', 'Juan Carlos Ros'], ['Perfil', 'Consultor y desarrollador de IA'], ['Especialidad', 'Industria'], ['Dónde', 'Murcia y toda España en remoto']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Quién construye')}<h2>Juan Carlos Ros, consultor y desarrollador de IA</h2><p>Transforma con IA es una consultoría de inteligencia artificial y automatización de procesos para empresas industriales. Juan Carlos Ros analiza cómo trabaja la empresa, detecta las tareas que más horas repiten y desarrolla la solución: no hay intermediarios entre quien te escucha en el diagnóstico y quien escribe el código.</p><p>Viene de la industria: conoce el día a día de un taller, de una distribuidora o de un servicio técnico, con sus referencias, albaranes, plazos y urgencias, y de ahí sale el criterio para decidir qué compensa automatizar y qué no.</p></div>
<div class="tc-box tc-reveal"><h3>Qué construye</h3>${list(['Integraciones con el ERP (SAP u otros) y con el correo: pedidos, albaranes y facturas que entran sin teclear', 'Lectura automática de documentos: PDF, fotos y correos convertidos en datos validados', 'Agentes que consultan catálogos, fichas técnicas y bases de datos y responden con la referencia correcta', 'Automatizaciones con revisión humana en lo dudoso y confirmación en lo importante', 'Aplicaciones web a medida, usables desde el móvil, con usuarios y permisos'])}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabaja', 'De un diagnóstico a una solución en producción')}
<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">1 · Diagnóstico</span><h3>Entender el proceso</h3><p>30 minutos, gratis. Se revisa cómo circula hoy el trabajo, qué sistemas intervienen (ERP, correo, Excel) y dónde se pierde el tiempo. Por escrito: qué automatizar, cómo y cuánto costaría.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">2 · Piloto</span><h3>Con datos reales</h3><p>Una primera versión con tus documentos, tu catálogo o tus tarifas. Se mide con casos reales antes de comprometer el presupuesto completo.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">3 · Implantación</span><h3>En producción</h3><p>Se conecta con tu ERP o tus hojas de cálculo, se forma al equipo y se definen los puntos donde una persona revisa o confirma.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">4 · Mantenimiento</span><h3>Seguimiento y mejora</h3><p>Soporte, ajustes con el uso y cambios cuando cambian los documentos, los formatos o el ERP.</p></div></div></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Criterios técnicos', 'Cómo se construye')}
<div class="tc-grid tc-grid--3">
 <div class="tc-box tc-reveal">${icon('flujo')}<h3>Integración antes que sustitución</h3><p>Si tu ERP tiene API, la conexión es directa; si no la tiene, se valora cómo adaptarlo. No hace falta cambiar de programa para empezar.</p></div>
 <div class="tc-box tc-reveal">${icon('escudo')}<h3>Revisión humana</h3><p>La IA lee, clasifica y propone. Lo dudoso se marca para revisar y las acciones importantes piden confirmación a una persona.</p></div>
 <div class="tc-box tc-reveal">${icon('app')}<h3>Datos bajo control</h3><p>Accesos mínimos, servidores en la Unión Europea siempre que es posible y nada de lo que se monta se usa para entrenar modelos de terceros.</p></div>
</div></div></section>
${band('¿Tienes una tarea que te gustaría quitarte de encima?', 'Reserva 30 minutos de diagnóstico gratis y lo vemos con tu caso.', btn('/contacto/#reserva', 'Reserva el diagnóstico de 30 minutos'))}`),
};

P['contacto'] = {
  id: 12, title: 'Contacto',
  seo: ['Contacto y diagnóstico gratis | Transforma con IA', 'Cuéntanos qué proceso queréis automatizar y te respondemos en menos de 24 horas con un diagnóstico gratuito. info@transformaconia.com', 'consultoría automatización industrial contacto'],
  html: page(`${pagehead('<span>Contacto</span>', 'Diagnóstico gratis', 'Cuéntanos qué os quita más horas', 'Te respondemos en menos de 24 horas laborables con una primera valoración. Si tiene sentido, hacemos el diagnóstico gratuito de 30 minutos, en tu empresa si estás en la Región de Murcia o por videollamada.', '', facts('Cómo funciona', [['Respuesta', 'menos de 24 h'], ['Diagnóstico', '30 min, gratis'], ['Piloto', '1 a 3 semanas'], ['Compromiso', 'Ninguno'], ['Presencial', 'Región de Murcia']]))}
<section class="tc-sec tc-sec--tight" id="reserva"><div class="tc-wrap">[tc_reserva]</div></section>
<section class="tc-sec tc-sec--tight" id="contacto"><div class="tc-wrap tc-split">
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)">${FORM_CONTACTO}</div>
 <div class="tc-prose tc-reveal" style="gap:26px">
  <div style="display:grid;gap:10px">${eyebrow('Correo directo')}<a class="tc-mail" href="mailto:info@transformaconia.com">info@transformaconia.com</a><p>Si lo prefieres, escríbenos directamente. Llega al mismo sitio.</p></div>
  <div style="display:grid;gap:12px">${eyebrow('Qué pasa después')}${list(['Leemos tu mensaje y te respondemos en menos de 24 horas laborables', 'Si encaja, hacemos el diagnóstico de 30 minutos, gratis', 'Te enviamos por escrito qué automatizaríamos, cómo y un precio orientativo', 'Si quieres, montamos un piloto con tus datos reales'])}</div>
  <div style="display:grid;gap:10px">${eyebrow('Dónde')}<p>Estamos en Murcia y trabajamos en remoto con empresas de toda España. En la Región de Murcia vamos a tu empresa, taller o nave.</p></div>
 </div></div></section>`),
};

P['consultor-ia-murcia'] = {
  title: 'Consultoría de IA en Murcia',
  seo: ['Consultoría de IA en Murcia | Transforma con IA', 'Consultoría de inteligencia artificial y automatización para empresas industriales de la Región de Murcia, con visitas presenciales y diagnóstico gratis.', 'consultoría inteligencia artificial Murcia'],
  html: page(`${pagehead('<span>Consultoría de IA en Murcia</span>', 'Región de Murcia', 'Consultoría de IA y automatización para la industria murciana', 'Automatizaciones, ERP para la industria, asistentes técnicos y herramientas a medida para empresas de Murcia, Cartagena, Lorca, Molina de Segura, Alcantarilla y el resto de la región. Vamos a tu empresa. <a class="tc-link" href="#donde-trabajamos">Dónde trabajamos</a>.', btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('Visitas presenciales', [['Murcia y pedanías', 'Sí'], ['Cartagena', 'Sí'], ['Lorca', 'Sí'], ['Molina de Segura', 'Sí'], ['Resto de la región', 'Sí']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Cerca de ti')}<h2>Un equipo de la tierra que conoce sus polígonos</h2><p>El tejido empresarial murciano tiene mucho de metal, mecanizado, distribución industrial, agroindustria y servicios técnicos. Conocemos bien ese mundo porque venimos de él, y sabemos que antes de proponer nada hay que pisar el taller y ver cómo se trabaja.</p><p>Por eso en la Región de Murcia hacemos el diagnóstico en persona, y el resto del proyecto en remoto para que sea más ágil y económico.</p></div><div class="tc-box tc-reveal"><h3>Qué podemos hacer juntos</h3>${list(['Implantar el ERP para la industria en tu taller o empresa', 'Automatizar pedidos, albaranes y facturas', 'Asistente técnico para tu catálogo o tu mostrador', 'Gestión documental: facturas y tickets que se registran solos', 'Mejoras y herramientas a medida sobre SAP o tu ERP', 'Formación práctica en IA para tu equipo'])}</div></div></section>
<section class="tc-sec tc-sec--alt" id="donde-trabajamos"><div class="tc-wrap">${head('Dónde trabajamos', 'Automatización industrial en la Región de Murcia y alrededores', 'Cada zona industrial tiene sus sectores y sus polígonos. Estas son las páginas de cada ciudad.')}<div class="tc-grid tc-grid--3">${[
    ['mapa', 'Automatización industrial en Cartagena', '/automatizacion-industria-cartagena/', 'Los Camachos, Cabezo Beaza y el entorno del puerto: talleres, mantenimiento y calderería. Visita en tu empresa.'],
    ['mapa', 'Automatización industrial en Molina de Segura', '/automatizacion-industria-molina-de-segura/', 'La Polvorista, La Serreta y El Tapiado: alimentación, envase y distribución. Visita en el día.'],
    ['mapa', 'Automatización industrial en Lorca', '/automatizacion-industria-lorca/', 'Saprelorca y La Hoya: cárnico, agroindustria y maquinaria. Visita con cita previa.'],
    ['mapa', 'Automatización industrial en Alcantarilla', '/automatizacion-industria-alcantarilla/', 'Polígono Oeste y Cabezo Verde: distribución, almacén y talleres. Visita en el día.'],
    ['mapa', 'Automatización industrial en Elche', '/automatizacion-industria-elche/', 'Calzado e industria auxiliar. En remoto o con visita bajo petición.'],
    ['mapa', 'Automatización industrial en Albacete', '/automatizacion-industria-albacete/', 'Cuchillería, maquinaria agrícola y agroindustria. En remoto o con visita bajo petición.'],
  ].map(([i, t, u, p]) => `<a class="tc-box tc-reveal" href="${u}">${icon(i)}<h3>${t}</h3><p>${p}</p><span class="tc-link">Ver la página</span></a>`).join('')}</div></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Soluciones', 'Seis formas de empezar')}${servCards()}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'IA para empresas de Murcia')}${faq([
    ['¿Hacéis visitas presenciales en Murcia?', 'Sí. En la Región de Murcia vamos a tu empresa, taller o nave para entender el proceso. El resto del proyecto se trabaja en remoto.'],
    ['¿Trabajáis con empresas de fuera de la región?', 'Sí, con empresas de toda España en remoto, por videollamada.'],
    ['¿Cuánto cuesta empezar?', 'El diagnóstico es gratis. Como referencia orientativa, una automatización parte de 450 € + IVA, el ERP para la industria de 690 € de puesta en marcha (mantenimiento orientativo de 69 €/mes) y un asistente técnico de 900 €.'],
  ])}</div></section>
${band('¿Eres de la Región de Murcia?', 'Escríbenos y pasamos por tu empresa a ver qué se puede automatizar.')}`),
};

P['privacidad'] = {
  id: 3, title: 'Política de privacidad',
  seo: ['Política de privacidad | Transforma con IA', 'Qué datos recogemos en transformaconia.com, para qué los usamos, cuánto tiempo los guardamos, quién los trata y cómo ejercer tus derechos.', ''],
  html: page(`${pagehead('<span>Privacidad</span>', 'Legal', 'Política de privacidad', 'Qué datos recogemos, para qué y cómo puedes ejercer tus derechos. Sin letra pequeña.')}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-prose" style="max-width:820px;gap:22px">
<div class="tc-prose"><h3>Responsable</h3><p>Transforma con IA (transformaconia.com). Contacto para cualquier asunto de privacidad: <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a>.</p></div>
<div class="tc-prose"><h3>Qué datos recogemos y para qué</h3><p><b>Formulario de contacto:</b> nombre, empresa, sector, correo y el mensaje que escribes. Los usamos solo para responderte y, si lo pides, preparar un presupuesto. Junto con tu mensaje guardamos la página por la que entraste y la web desde la que llegaste, para saber qué contenidos funcionan. Te enviamos un correo automático de confirmación y, después, la respuesta a tu consulta. Base legal: tu consentimiento y la aplicación de medidas precontractuales a petición tuya.</p><p><b>Reserva del diagnóstico:</b> si reservas una cita, tratamos tu nombre, empresa, correo, teléfono y localidad solo para gestionar la cita del diagnóstico gratuito. Para evitar abusos (spam y reservas masivas) calculamos de tu dirección IP una huella cifrada con una clave aleatoria que cambia cada día y que borramos después. No guardamos tu IP y la huella se elimina a las 48 horas. Pasado ese tiempo no se puede volver a la IP original. Lo mismo ocurre al enviar el formulario de contacto.</p></div>
<div class="tc-prose"><h3>Cuánto tiempo los guardamos</h3><p>Los datos de contacto, mientras dure la relación y un máximo de dos años después del último contacto.</p></div>
<div class="tc-prose"><h3>Quién más los trata</h3><p>Para funcionar usamos proveedores que tratan los datos por nuestra cuenta: el alojamiento de la web (Hostinger), el correo electrónico (Google) y la base de datos (Neon, con servidores en Fráncfort, UE). No vendemos ni cedemos tus datos a terceros.</p></div>
<div class="tc-prose"><h3>Cookies</h3><p>Esta web no usa cookies de publicidad ni de seguimiento. Solo pueden instalarse cookies técnicas necesarias para que la web funcione, que no requieren consentimiento.</p></div>
<div class="tc-prose"><h3>Estadísticas de visitas</h3><p>Contamos las visitas con un sistema propio que no usa cookies ni guarda tu dirección IP ni ningún dato que te identifique: solo la página que ves, la web desde la que llegas, si entras desde el móvil o el ordenador y los clics en los botones de contacto. Se guardan en la misma base de datos de la UE y solo sirven para saber qué contenidos interesan y mejorar la web. Para evitar abusos calculamos de tu dirección IP una huella cifrada con una clave aleatoria que cambia cada día y que borramos después; no guardamos tu IP y la huella se elimina a los pocos minutos, nunca se asocia a tus visitas y pasado ese tiempo no se puede volver a la IP original. Las estadísticas se eliminan pasados 13 meses.</p></div>
<div class="tc-prose"><h3>Tus derechos</h3><p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos escribiendo a info@transformaconia.com. Si crees que no los hemos tratado bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p></div>
<p style="font-size:14px;color:var(--tc-dim)">Última actualización: 13 de octubre de 2026.</p>
</div></div></section>`),
};

// ======================= PUBLICACIÓN =======================
// Páginas que cambian de URL: se reutiliza la página antigua (mismo id) con el slug nuevo.
const RENOMBRAR = { 'erp-industria': 'erp-metal', industria: 'sectores-industriales' };
const solo = process.argv.slice(2);
const BK = '_backups/web-2026-10-13-t1/';
fs.mkdirSync(BK, { recursive: true });
for (const [slug, def] of Object.entries(P)) {
  if (solo.length && !solo.includes(slug)) continue;
  let id = def.id;
  for (const s of id ? [] : [slug, RENOMBRAR[slug]].filter(Boolean)) {
    const f = await wp('GET', `/wp/v2/pages?slug=${s}&status=publish,draft&_fields=id`);
    id = f.data?.[0]?.id;
    if (id) break;
  }
  if (id) {
    const old = await wp('GET', `/wp/v2/pages/${id}?context=edit&_fields=id,slug,content`);
    if (old.data?.content?.raw && !fs.existsSync(`${BK}page-${id}.html`)) fs.writeFileSync(`${BK}page-${id}.html`, old.data.content.raw);
  }
  const [t, d, k] = def.seo;
  const body = { title: def.title, slug, status: 'publish', content: def.html, template: '', comment_status: 'closed', author: 2, meta: { rank_math_title: t, rank_math_description: d, rank_math_focus_keyword: k } };
  const r = id ? await wp('POST', `/wp/v2/pages/${id}`, body) : await wp('POST', '/wp/v2/pages', body);
  console.log(slug, r.status, r.data?.id, r.data?.link || JSON.stringify(r.data).slice(0, 300));
}
