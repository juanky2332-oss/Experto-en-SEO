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
// Demo del programa. Cuando exista el registro DNS (demo.transformaconia.com con certificado), cambiar SOLO esta constante.
const DEMO_URL = 'https://demo.transformaconia.com/';
const DEMO_TXT = 'Ver IndunexIA Gestión por dentro';
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

// Planes de IndunexIA Gestión: copia exacta de TRANSFORMA - OFERTA UNICA/oferta.json (producto_estrella.planes). Si cambia allí, cambia aquí.
const PLANES = [{"id": "basico", "nombre": "Básico", "puesta_en_marcha": 590, "tarifa_general": 790, "mes": 59, "para": "Empezar a llevar la empresa en un solo programa", "incluye": ["Clientes, proveedores y catálogo", "Presupuestos, albaranes y facturas con tu logo (PDF)", "Del presupuesto a la factura sin teclear nada dos veces", "Envío de documentos por correo con los PDF adjuntos", "Cobros y vencimientos con avisos", "Registro de gastos", "Agenda", "Puesta en marcha con tus clientes y artículos", "1 usuario incluido"]}, {"id": "profesional", "nombre": "Profesional", "destacado": true, "puesta_en_marcha": 690, "tarifa_general": 990, "mes": 69, "para": "El papeleo, hecho por la IA (el más elegido)", "incluye": ["Todo lo del Básico", "Gastos con una foto: la IA lee el ticket o la factura", "Albaranes y partes firmados, unidos a su factura", "Calculadora de costes y margen → presupuesto", "Fiscal: IVA del trimestre, calendario de Hacienda y paquete para tu asesor", "Informes de ventas, gastos y márgenes", "Avisos por Telegram", "Tu histórico del año en curso cargado"]}, {"id": "pro", "nombre": "Pro", "puesta_en_marcha": 990, "tarifa_general": 1490, "mes": 89, "para": "Todo, y adaptado a tu día a día", "incluye": ["Todo lo del Profesional", "Asistente con IA propio, con el nombre que quieras, en la app y por Telegram", "Presupuesto desde plano con IA", "Todo tu histórico importado (años anteriores)", "Una automatización a medida incluida (por ejemplo, leer los pedidos que llegan por correo)", "Hasta 2 h al mes de ajustes y mejoras", "Soporte prioritario"]}];
const eur = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €';
const planes = () => `<div class="tc-planes">${PLANES.map((p) => `<article class="tc-plan${p.destacado ? ' tc-plan--top' : ''} tc-reveal">${p.destacado ? '<span class="tc-plan__tag">El más elegido</span>' : ''}<h3>${p.nombre}</h3><p class="tc-plan__para">${p.para.replace(' (el más elegido)', '')}</p><p class="tc-plan__precio"><s>${eur(p.tarifa_general)}</s> <b>${eur(p.puesta_en_marcha)}</b><small>puesta en marcha · pago único</small></p><p class="tc-plan__mes"><b>${p.mes} €/mes</b> <small>· 3 primeros meses gratis</small></p>${list(p.incluye)}</article>`).join('')}</div>
<p class="tc-planes__nota tc-reveal">Precios de temporada con descuento hasta el 31 de diciembre de 2026 (tachado, la tarifa general). Sin IVA. Usuario extra: 15 €/mes desde el primer mes. Sin permanencia: 30 días de aviso. La cuota empieza cuando el programa está a tu gusto.</p>`;// Ilustración decorativa animada (engranajes, cota que se dibuja, chispas que brillan). Solo adorno: aria-hidden.

// Planes del asistente técnico: copia de oferta.json (servicios → asistente → planes).
const PLANES_ASISTENTE = [{"id": "esencial", "nombre": "Esencial", "desde": 900, "mes": 49, "para": "Atiende y capta clientes a cualquier hora", "incluye": ["Asistente en tu web con la información de tu empresa: servicios, horarios, envíos y preguntas frecuentes", "Hasta 300 preguntas y respuestas o documentos", "Recoge nombre y teléfono y te avisa al correo o a Telegram", "Responde 24/7 y pasa a una persona lo que no sabe", "Informe mensual de lo que pregunta la gente", "Hasta 1.000 conversaciones al mes"]}, {"id": "tecnico", "nombre": "Técnico", "destacado": true, "desde": 1900, "mes": 99, "para": "Asesora como tu mejor técnico de mostrador", "incluye": ["Todo lo del Esencial", "Tu catálogo y fichas técnicas (hasta 3.000 referencias)", "Recomienda según el uso: medidas, presión, material, normas…", "Compara productos en una tabla y propone equivalencias", "Manuales y documentación técnica en PDF", "Castellano e inglés", "Hasta 3.000 conversaciones al mes"]}, {"id": "tienda", "nombre": "Tienda", "desde": 3500, "mes": 179, "para": "Vende directamente desde el chat", "incluye": ["Todo lo del Técnico", "Conectado a tu tienda online (PrestaShop, WooCommerce, Shopify) o a tu ERP", "Precios y stock en tiempo real", "Añade al carrito, también varios productos a la vez", "Estado de pedidos y WhatsApp Business", "Catálogo grande (más de 3.000 referencias)", "Hasta 2 h al mes de mejoras"]}];
const DEMO_ASISTENTE = 'https://demo.transformaconia.com/asistente/';
const planesAsistente = () => `<div class="tc-planes">${PLANES_ASISTENTE.map((p) => `<article class="tc-plan${p.destacado ? ' tc-plan--top' : ''} tc-reveal">${p.destacado ? '<span class="tc-plan__tag">El más pedido</span>' : ''}<h3>${p.nombre}</h3><p class="tc-plan__para">${p.para}</p><p class="tc-plan__precio"><small style="width:auto">desde</small> <b>${eur(p.desde)}</b><small>puesta en marcha · pago único</small></p><p class="tc-plan__mes"><b>${p.mes} €/mes</b> <small>· mantenimiento y uso de la IA incluidos</small></p>${list(p.incluye)}</article>`).join('')}</div>
<p class="tc-planes__nota tc-reveal">Precios orientativos sin IVA. El precio final depende de cuántas referencias, documentos y bases de datos tenga que manejar y de qué pueda hacer (carrito, pedidos, citas…): te lo cerramos por escrito tras el diagnóstico gratis. Sin permanencia.</p>`;
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
const faq = (items) => `<div class="tc-faq tc-reveal">${items.map(([q, a]) => `<details><summary><h3>${H(q)}</h3></summary><p>${H(a)}</p></details>`).join('')}</div>
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
  [IMG.erp_albaran, 'Listado de albaranes con un albarán firmado por el cliente y traspasado a factura', 'Albaranes firmados', '/erp-industria/'],
  [IMG.facturas, 'Programa de gestión con IA: facturas', 'Facturas y cobros', '/erp-industria/'],
  [IMG.fiscal, 'Paquete trimestral para la asesoría', 'Documentación para la asesoría', '/casos/#documentacion'],
  [IMG.cobros, 'Cobros y vencimientos', 'Control de cobros', '/erp-industria/'],
  [IMG.veterinaria, 'Software de gestión para clínicas', 'Software para clínicas', '/otros-sectores/#clinicas'],
  [IMG.fundalex, 'Buscador de jurisprudencia con IA', 'Buscador jurídico con IA', '/otros-sectores/#asesorias'],
  [IMG.refuerzo, 'Aplicación de refuerzo escolar con IA', 'Refuerzo escolar con IA', '/otros-sectores/#educacion'],
];
const galeriaDe = (lista) => `<div class="tc-gal" aria-label="Capturas de herramientas que hemos construido"><div class="tc-gal__row">${[...lista, ...lista].map(([src, alt, t, u], i) => `<a class="tc-gal__item" href="${u}"${i >= lista.length ? ' aria-hidden="true" tabindex="-1"' : ''}><img src="${src}" alt="${i >= lista.length ? '' : alt}" width="1440" height="900" loading="lazy" decoding="async"><span>${t}</span></a>`).join('')}</div></div>`;
const galeria = galeriaDe(GALERIA);
const galeriaInd = galeriaDe(GALERIA.filter(([, , , u]) => !u.startsWith('/otros-sectores/')));
const flow = (pasos) => `<ol class="tc-flow">${pasos.map((p) => `<li>${p}</li>`).join('')}</ol>`;

// ======================= CONTENIDO COMÚN =======================
const SECTORES = [
  { id: 'talleres', pag: ['/ia-talleres-industriales/', 'Ver IA para talleres industriales'], ic: 'tuerca', t: 'Talleres industriales: mecanizado, calderería y reparación', frase: 'Responde antes a los presupuestos, con tu margen aplicado.',
    items: ['Presupuestos con lo que te cuesta cada trabajo y tu margen aplicado', 'Albaranes y partes firmados en el móvil', 'Órdenes de trabajo, entregas y cobros bajo control', 'Ofertas preparadas a partir del plano o de la petición del cliente'],
    sol: ['/erp-industria/', 'Ver el ERP para la industria'] },
  { id: 'distribucion', pag: ['/distribucion-industrial/', 'Ver IA para distribución industrial'], ic: 'caja', t: 'Distribución y suministro industrial', frase: 'La referencia y la equivalencia correctas en segundos, también fuera de horario.',
    items: ['Asistente técnico que responde con tu catálogo, tus fichas y tu stock', 'Equivalencias entre marcas: rodamientos, transmisión, neumática, hidráulica, tornillería', 'Pedidos que llegan por correo directos al ERP', 'Búsqueda que entiende referencias incompletas o mal escritas'],
    sol: ['/distribucion-industrial/', 'Ver el asistente de catálogo'] },
  { id: 'mantenimiento', pag: ['/ia-mantenimiento-industrial/', 'Ver IA para mantenimiento industrial'], ic: 'llave', t: 'Mantenimiento y servicios industriales', frase: 'Los avisos llegan clasificados por urgencia y con la orden de trabajo hecha.',
    items: ['Avisos por Telegram o WhatsApp convertidos en órdenes de trabajo', 'Asistente que consulta los manuales de tus máquinas', 'Informes de intervención que se redactan solos', 'Preventivos y revisiones planificados sin hojas de cálculo'],
    sol: ['/automatizacion-procesos-ia/', 'Ver automatización de procesos'] },
  { id: 'instaladoras', pag: ['/ia-empresas-instaladoras/', 'Ver IA para empresas instaladoras'], ic: 'rayo', t: 'Instaladoras: electricidad, climatización y frío', frase: 'Presupuestos y citas sin pasar la tarde al teléfono.',
    items: ['Presupuestos a partir de mediciones y listas de material', 'Facturas y albaranes de proveedor que se leen solos', 'Partes de trabajo dictados desde la obra', 'Certificados y revisiones periódicas automáticas'],
    sol: ['/automatizacion-procesos-ia/', 'Ver automatización de procesos'] },
  { id: 'integradores', ic: 'chip', t: 'Automatización industrial e integradores', frase: 'Menos horas de oficina técnica en cada proyecto.',
    items: ['Ofertas técnicas apoyadas en el histórico de proyectos', 'Documentación de proyecto generada a partir de lo ya hecho', 'Asistente de soporte para técnicos en campo'],
    sol: ['/desarrollo-a-medida-ia/', 'Ver herramientas a medida'] },
  { id: 'fabricacion', pag: ['/ia-fabricacion-industrial/', 'Ver IA para fabricación industrial'], ic: 'fabrica', t: 'Fabricación y agroindustria', frase: 'Datos de producción sin papel y sin teclear dos veces.',
    items: ['Partes de producción y trazabilidad desde el móvil', 'Informes de producción y calidad que llegan solos', 'Pedidos de clientes y proveedores conectados con el ERP'],
    sol: ['/automatizacion-procesos-ia/', 'Ver automatización de procesos'] },
];
const OTROS_SECTORES = [['cal', 'Clínicas y centros con cita'], ['balanza', 'Asesorías y despachos'], ['caja', 'Comercio y tienda online'], ['libro', 'Educación y formación']];
const MARQUEE_SECTORES = ['Talleres de mecanizado', 'Calderería y soldadura', 'Estructuras metálicas', 'Carpintería metálica', 'Reparación de maquinaria', 'Talleres de hidráulica', 'Rodamientos y transmisión', 'Neumática', 'Hidráulica', 'Suministro industrial', 'Tornillería', 'Mantenimiento industrial', 'Instaladoras eléctricas', 'Climatización y frío', 'Integradores', 'Agroindustria', 'Empresas con SAP'];
const marquee = `<div class="tc-marquee" aria-label="Sectores en los que trabajamos"><span class="tc-marquee__label">Sectores</span><div class="tc-marquee__track"><div class="tc-marquee__row">${[...MARQUEE_SECTORES, ...MARQUEE_SECTORES].map((f) => `<span>${f}</span>`).join('')}</div></div></div>`;

const SERVICIOS = [
  ['erp', 'IndunexIA Gestión · ERP para la industria', 'Calculadora de costes y margen, presupuestos, albaranes firmados, facturas, cobros y gastos por foto. Se usa desde el móvil.', '/erp-industria/', 'desde <b>590 €</b> + 59 €/mes', 'Conocer IndunexIA Gestión'],
  ['flujo', 'Automatización de procesos', 'Pedidos, albaranes, facturas y correos que hoy se pasan a mano entre programas empiezan a moverse solos.', '/automatizacion-procesos-ia/', 'desde <b>450 €</b>', 'Ver la automatización de procesos'],
  ['chat', 'Asistentes técnicos y chatbots', 'Asesoran a tus clientes 24/7 con tu catálogo y tus fichas técnicas, comparan productos y llevan a la compra en tu tienda online. Pruébalo en la demo.', '/agentes-chatbots-ia/', 'desde <b>900 €</b> + 49 €/mes', 'Ver los asistentes y la demo'],
  ['carpeta', 'IndunexIA Documentos', 'Facturas, tickets y albaranes leídos con IA, comprobados y guardados en la carpeta de tu ordenador. Listado para la gestoría en un clic.', '/gestion-documental-ia/', 'desde <b>190 €</b> + 29 €/mes', 'Ver IndunexIA Documentos'],
  ['app', 'Herramientas a medida y SAP', 'Cualquier idea para mejorar vuestro programa, SAP o el que uséis, se puede implementar. Y lo que ningún programa estándar resuelve, a medida.', '/desarrollo-a-medida-ia/', 'desde <b>2.500 €</b>', 'Ver las herramientas a medida y SAP'],
  ['objetivo', 'Consultoría y diagnóstico', 'Analizamos vuestros procesos y te enviamos por escrito qué automatizar primero, cómo y cuánto costaría.', '/contacto/', '<b>Gratis</b>', 'Pedir el diagnóstico gratuito'],
];
const servCards = (cols = 3, ultima = null) => `<div class="tc-grid tc-grid--${cols}">${SERVICIOS.map((x, n) => (ultima && n === SERVICIOS.length - 1 ? [x[0], x[1], x[2], ultima[0], x[4], ultima[1]] : x)).map(([i, t, p, u, pr, l], n) => `<article class="tc-box tc-reveal${n === 0 ? ' tc-box--star' : ''}">${icon(i)}<h3>${t}</h3><p>${p}</p><p class="tc-price">${/Gratis/.test(pr) ? '' : '<span>Orientativo</span> '}${pr}</p><a class="tc-link" href="${u}">${l}</a></article>`).join('')}</div>`;

const SOLUCIONES_CONCRETAS = [
  ['Calculadora de costes y margen', '/erp-industria/'], ['Albaranes firmados en el móvil', '/erp-industria/'], ['Asistente técnico de catálogo', '/distribucion-industrial/'],
  ['Equivalencias entre marcas', '/distribucion-industrial/'], ['Pedidos del correo al ERP', '/automatizacion-procesos-ia/'], ['Lectura automática de facturas', '/gestion-documental-ia/'], ['Presupuesto desde un plano', '/presupuestos-desde-plano/'], ['Bandeja de correo que se ordena sola', '/automatizacion-procesos-ia/'], ['Seguimiento de presupuestos enviados', '/automatizacion-procesos-ia/'], ['Buscador de manuales y fichas técnicas', '/agentes-chatbots-ia/'], ['Recepcionista telefónica con IA', '/agentes-chatbots-ia/'],
  ['Gastos por foto en Telegram', '/erp-industria/'], ['Órdenes de trabajo por mensaje', '/automatizacion-procesos-ia/'], ['Mejoras sobre SAP o tu ERP', '/desarrollo-a-medida-ia/'],
  ['Paquete trimestral para la asesoría', '/gestion-documental-ia/'], ['Informes que llegan solos', '/automatizacion-procesos-ia/'],
];
const chips = `<div class="tc-chips tc-reveal">${SOLUCIONES_CONCRETAS.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}</div>`;

const PASOS = `<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">Gratis · por escrito</span><h3>Diagnóstico</h3><p>Nos cuentas cómo trabajáis y qué tarea os quita más horas. Te enviamos por escrito qué automatizaríamos, cómo y cuánto costaría. Sin compromiso.</p></div>
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

// Problema por departamento (solo la portada)
const POR_DEP = [
  ['Documentos tecleados a mano', 'Leídos y archivados solos, con revisión de los dudosos'],
  ['Buscar referencias y fichas', 'Respuesta en segundos con tu catálogo'],
  ['Presupuestos a mano', 'Coste y margen calculados en minutos'],
  ['Papeles que llegan tarde a la oficina', 'Partes y albaranes desde el móvil'],
];
const antesDespuesDep = `<div class="tc-ad tc-reveal"><div class="tc-ad__h"><span>Hoy</span><span>Con IA</span></div>${POR_DEP.map(([a, d]) => `<div class="tc-ad__row"><p class="tc-ad__antes">${a}</p><span class="tc-ad__arrow" aria-hidden="true">${ARROW}</span><p class="tc-ad__despues">${d}</p></div>`).join('')}</div>`;
const LIMITES_4 = [
  ['grafica', 'Ahorros sin datos', 'Nada de porcentajes antes de ver tus cifras: los calculamos contigo en el piloto.'],
  ['equipo', 'IA que decide sola', 'Las acciones importantes las confirma siempre una persona de tu equipo.'],
  ['erp', 'Cambiar de ERP', 'Si tiene API lo conectamos; si no, valoramos cómo adaptarlo.'],
  ['carpeta', 'Sustituir a tu asesoría', 'Te preparamos el trimestre; la presentación la hace tu asesor.'],
];
const LIMITES = sec(head('Lo que no prometemos', 'Lo que no te vamos a prometer', 'Mejor decirlo claro desde el principio.') + `<div class="tc-grid tc-grid--4">${LIMITES_4.map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div><p class="tc-nota tc-reveal" style="margin-top:18px">Datos en servidores de la Unión Europea siempre que es posible. ERP sin permanencia: 30 días de aviso.</p>`);

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
  ['fabrica', 'Conocemos el sector', 'Llevamos más de 2 años aplicando IA en empresas industriales. Sabemos qué es un plano, una referencia, un albarán y una urgencia de un viernes a las seis.'],
  ['tuerca', 'Revisión humana en lo importante', 'La IA lee, clasifica y propone; las acciones importantes siempre piden confirmación a una persona de tu equipo.'],
  ['flujo', 'Sin cambiar tu ERP', 'Si tu ERP tiene API, nos conectamos de forma directa; si no la tiene, valoramos cómo adaptarlo. Cualquier mejora que se os ocurra se puede implementar en SAP o en el programa que uséis.'],
  ['objetivo', 'Lo pruebas antes de pagarlo todo', 'Piloto con tus datos reales en 1 a 3 semanas. Si no te ahorra tiempo, lo sabrás antes de invertir más.'],
  ['mapa', 'Presencial y en remoto', 'En persona en la Región de Murcia y en remoto en toda España. Hablas siempre con quien lo construye.'],
  ['euro', 'Precios claros desde el principio', 'Precios orientativos publicados y presupuesto cerrado por escrito tras el diagnóstico. El ERP, sin permanencia.'],
];
// Calculadora orientativa [tc_calculadora] (shortcode del snippet #13; la tarifa vive allí)
const calcu = (titulo = 'Calcula cuánto papeleo podrías quitarte') => `<section class="tc-sec tc-sec--alt" id="calculadora"><div class="tc-wrap">${head('Haz la cuenta', titulo, 'Pon las horas que dedicáis a presupuestos, albaranes y facturas y mira el orden de magnitud. Es orientativo: parte de tus propias cifras.')}[tc_calculadora]</div></section>`;
const CALCULADORA = calcu();
const CALC_ENLACE = sec(`<a class="tc-box tc-reveal" href="/#calculadora">${icon('calc')}<h3>¿Cuánto te cuesta el papeleo?</h3><p>Haz la cuenta en 1 minuto con tus propias cifras.</p><span class="tc-link">Haz la cuenta →</span></a>`, 'tc-sec--tight', 'calculadora');
const GARANTIAS = [
  ['reloj', 'Sin permanencia', 'Mes a mes en el ERP, con 30 días de aviso. Te llevas tus datos.'],
  ['equipo', 'Revisión humana', 'Lo dudoso se marca y lo importante lo confirma una persona de tu equipo.'],
  ['escudo', 'Datos en la UE', 'Servidores en la Unión Europea siempre que es posible y nada se usa para entrenar modelos de terceros.'],
  ['euro', 'Precio por escrito', 'Tras el diagnóstico recibes un presupuesto cerrado, sin sorpresas.'],
];
const porQue = `<div class="tc-grid tc-grid--3">${POR_QUE.map(([i, t, p]) => `<div class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></div>`).join('')}</div>`;

const formContacto = (portada = false) => `<form class="tc-form" data-tc-form="contacto" data-ok="¡Recibido! Te enviamos tu diagnóstico por escrito en 48 horas laborables." novalidate>
<div class="tc-form__row"><div class="tc-field"><label for="tc-nombre">Nombre</label><input id="tc-nombre" name="nombre" required autocomplete="name"></div>
<div class="tc-field"><label for="tc-empresa">Empresa</label><input id="tc-empresa" name="empresa" autocomplete="organization"></div></div>
<div class="tc-form__row"><div class="tc-field"><label for="tc-email">Correo</label><input id="tc-email" name="email" type="email" required autocomplete="email"></div>
<div class="tc-field">${portada ? `<label for="tc-sector">¿Dónde perdéis más horas?</label><select id="tc-sector" name="sector"><option value="">Elige uno</option>${['Documentos y facturas', 'Búsqueda de referencias', 'Presupuestos', 'Partes y albaranes', 'Otro'].map((o) => `<option>${o}</option>`).join('')}</select>` : `<label for="tc-sector">Sector</label><select id="tc-sector" name="sector"><option value="">Elige uno</option><optgroup label="Industria">${SECTORES.map((s) => `<option>${s.t}</option>`).join('')}</optgroup><optgroup label="Otros sectores">${OTROS_SECTORES.map((s) => `<option>${s[1]}</option>`).join('')}<option>Otro</option></optgroup></select>`}</div></div>
<div class="tc-field"><label for="tc-mensaje">¿Qué tarea o consulta os repite más vuestro equipo?</label><textarea id="tc-mensaje" name="mensaje" required placeholder="Ej.: los presupuestos los calculamos a mano y tardamos días en contestar…"></textarea></div>
<label class="tc-hp" aria-hidden="true">Web <input name="web" tabindex="-1" autocomplete="off"></label>
<label class="tc-check"><input type="checkbox" required id="tc-acepto" name="acepto" value="si"> <span style="color:#a9a1b4!important">He leído la <a href="/privacidad/">política de privacidad</a> y acepto que uséis mis datos para responderme.</span></label>
<div><button class="tc-btn" type="submit">${portada ? 'Pedir mi diagnóstico gratis' : 'Enviar y pedir diagnóstico'} ${ARROW}</button></div>
<p class="tc-msg" role="status" aria-live="polite"></p></form>`;
const FORM_CONTACTO = formContacto();

const contactoSplit = (h2 = 'Cuéntanos qué proceso queréis automatizar') => `<section class="tc-sec" id="contacto"><div class="tc-wrap tc-split">
 <div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Diagnóstico gratis')}<h2>${h2}</h2><p>Así trabajamos: nos cuentas cómo lo hacéis hoy y te enviamos el diagnóstico por escrito, con qué automatizar primero, cómo y cuánto costaría. Lo lees con calma, lo compartes con quien quieras y decides sin prisas. Lo recibes en tu correo en 48 horas laborables.</p>${list(['Sin compromiso y sin permanencias', 'Precios orientativos desde el principio', 'Piloto con tus datos antes de pagar el total', 'Puesta en marcha en persona en Murcia, en remoto en toda España'])}<p>¿Prefieres el correo? <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a></p></div>
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)">${FORM_CONTACTO}</div>
</div></section>`;

const contactoPortada = () => `<section class="tc-sec" id="contacto"><div class="tc-wrap tc-split">
 <div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Diagnóstico gratis')}<h2>Pide tu diagnóstico gratis</h2><p>Así trabajamos: nos cuentas cómo lo hacéis hoy y te enviamos el diagnóstico por escrito, con qué automatizar primero, cómo y cuánto costaría. Lo lees con calma, lo compartes con quien quieras y decides sin prisas.</p>${list(['Sin compromiso y sin permanencias', 'Precios orientativos desde el principio', 'Piloto con tus datos antes de comprometer el presupuesto completo', 'Lo recibes en tu correo en 48 horas laborables'])}</div>
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)"><p style="margin:0 0 16px"><b>Cuéntanos cómo trabajáis</b> y te enviamos el diagnóstico a tu correo.</p>${formContacto(true)}<p class="tc-nota" style="margin-top:12px">También en <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a></p></div>
</div></section>`;

const MINI_CHAT = `<figure class="tc-chat tc-chat--mini" aria-label="Ejemplo de conversación con el asistente técnico"><div class="tc-chat__top"><span class="tc-chat__av">IA</span><div><b>Asistente técnico · Suministros Ejemplo</b><small><i></i>en línea · también de noche</small></div></div><div class="tc-chat__body">
<p class="tc-chat__m tc-chat__m--c" style="--d:.4s">¿Tenéis equivalente de esta referencia en otra marca? Mismas medidas, la necesito mañana.</p>
<p class="tc-chat__m tc-chat__m--b" style="--d:1.8s">Sí: hay dos equivalencias directas con las mismas medidas y jaula. De la primera quedan 14 unidades y sale hoy. Te dejo la ficha técnica. ¿La añado al pedido?</p>
<p class="tc-chat__m tc-chat__m--c" style="--d:3.4s">Sí, 4 unidades.</p>
<p class="tc-chat__m tc-chat__m--b" style="--d:4.8s">Añadidas ✓ Si necesitas hablar con el mostrador, te paso con ellos.</p></div><figcaption>Ejemplo ilustrativo de conversación con un asistente técnico de catálogo.</figcaption></figure>`;

// ======================= CASOS (fichas) =======================
// Cada ficha: Problema · Solución · Cómo funciona · Ejemplo (datos ficticios) · Siguiente paso.
const ESTE = (t = 'Ejemplo ficticio') => `<span class="tc-nota-ej">${t}</span>`;
const chatEj = (quien, msgs, pie) => `<figure class="tc-chat tc-chat--mini" aria-label="Ejemplo de conversación con ${quien}"><div class="tc-chat__top"><span class="tc-chat__av">IA</span><div><b>${quien}</b><small><i></i>en línea</small></div></div><div class="tc-chat__body">${msgs.map(([k, t], n) => `<p class="tc-chat__m tc-chat__m--${k}" style="--d:${(0.4 + n * 1.4).toFixed(1)}s">${t}</p>`).join('')}</div><figcaption>${pie}</figcaption></figure>`;
const adEj = (h1, h2, filas) => `<div class="tc-ad tc-reveal"><div class="tc-ad__h"><span>${h1}</span><span>${h2}</span></div>${filas.map(([a, d]) => `<div class="tc-ad__row"><p class="tc-ad__antes">${a}</p><span class="tc-ad__arrow" aria-hidden="true">${ARROW}</span><p class="tc-ad__despues">${d}</p></div>`).join('')}</div>`;
const CTA_DIAG = '/contacto/';
const diag = (txt = 'Pide tu diagnóstico gratis') => btn(CTA_DIAG, txt);

const CASOS_IND = [
  { id: 'gestion', ic: 'tuerca', sector: 'Talleres industriales', titulo: 'Un ERP para la industria: del presupuesto a la factura',
    problema: 'Presupuestos calculados a mano y precios puestos a ojo, albaranes en papel, facturas en Excel y tickets en la guantera. Contestar a una petición de oferta lleva días y nadie sabe de un vistazo qué está pendiente de cobro.',
    solucion: 'IndunexIA Gestión, un programa de gestión pensado para la industria: calcula lo que te cuesta cada trabajo para ponerle tu margen y lleva presupuesto, albarán, factura y cobros en un solo sitio.',
    pasos: ['Calculas el coste del trabajo y le pones tu margen.', 'Sale el presupuesto y, al aceptarlo, el albarán que el cliente firma en el móvil.', 'El albarán pasa a factura con un clic.', 'Cobros y vencimientos a la vista, y el paquete trimestral para la asesoría.'],
    ejNota: 'Ejemplo ficticio', ejTxt: 'Capturas del programa con una empresa inventada («Empresa X, S.L.») y clientes de demostración.',
    ej: shots([[IMG.erp_calculadora, 'Calculadora de costes con datos ficticios: coste de una pieza y precio con margen'], [IMG.erp_albaran, 'Albaranes con datos ficticios: un albarán firmado y traspasado a factura'], [IMG.cobros, 'Cobros y vencimientos con clientes de demostración']]),
    sig: 'En el diagnóstico gratis te decimos cómo quedaría con tus precios y tu forma de trabajar.', cta: btn(DEMO_URL, DEMO_TXT) + btn('/erp-industria/', 'Conocer IndunexIA Gestión', true) },
  { id: 'distribucion', ic: 'caja', sector: 'Distribución industrial', titulo: 'Un asistente técnico dentro de la tienda online',
    problema: 'En una tienda técnica, los clientes profesionales preguntan por equivalencias entre marcas, medidas y disponibilidad. Cada consulta ocupa a un técnico y muchas llegan fuera de horario.',
    solucion: 'Un asistente dentro de la tienda, conectado al catálogo y al stock. Entiende la referencia aunque venga incompleta, da las equivalencias, muestra la ficha técnica y añade el producto al carrito.',
    pasos: ['El cliente escribe la referencia o describe la pieza.', 'El asistente consulta el catálogo y el stock.', 'Muestra las equivalencias y la ficha técnica completa.', 'Añade al carrito o pasa la consulta a una persona.'],
    ejNota: 'Ejemplo ficticio', ejTxt: '', ej: MINI_CHAT,
    sig: 'Lo probamos con tu catálogo antes de decidir.', cta: diag() + btn('/distribucion-industrial/', 'Ver el asistente técnico para distribuidores', true) },
  { id: 'sap', ic: 'lupa', ejemplo: true, sector: 'Ejemplo · empresas con SAP', titulo: 'Ejemplo: sacar más partido a SAP con IA',
    problema: 'Buscar un artículo en SAP suele ser lento: hace falta conocer el código o la descripción exacta con la que está dado de alta, y con miles de referencias se pierde tiempo o se elige el que no es.',
    solucion: 'Se puede añadir una capa de inteligencia artificial que mejore la búsqueda de artículos y se sincronice con SAP según las necesidades de cada empresa. Cualquier idea para mejorar SAP, o el programa que uséis, se puede valorar.',
    pasos: ['La persona escribe lo que busca con sus propias palabras.', 'La búsqueda con IA tolera errores y sinónimos.', 'Propone el artículo correcto y alternativas parecidas.', 'Se sincroniza con SAP según lo que necesite cada empresa.'],
    ejNota: 'Ejemplo ficticio', ejTxt: 'Artículos y códigos inventados.',
    ej: adEj('Hoy', 'Con búsqueda con IA', [['Buscas «tornillo allen inox 8 largo» y SAP no encuentra nada: está dado de alta como «TORN. DIN 912 A2 M8X40».', 'La búsqueda propone «TORN. DIN 912 A2 M8X40» (código ficticio 100245) y dos alternativas parecidas.']]),
    sig: 'Si usas SAP u otro ERP, cuéntanos qué mejorarías y lo valoramos.', cta: diag() + btn('/desarrollo-a-medida-ia/', 'Ver herramientas a medida y SAP', true) },
  { id: 'documentacion', ic: 'carpeta', sector: 'Gestión documental', titulo: 'La documentación que se ordena sola',
    problema: 'Facturas de proveedor por correo, albaranes en papel, tickets en el móvil de cada trabajador y certificados en carpetas sueltas. Cada cierre de trimestre es buscar papeles y teclear importes.',
    solucion: 'La IA lee cada documento (PDF, foto o correo), extrae proveedor, fecha, importes e IVA, lo clasifica y lo registra en el programa de gestión. Lo dudoso se marca para revisar.',
    pasos: ['Llega el documento: foto por Telegram, PDF o correo.', 'La IA lee proveedor, fecha, importes e IVA.', 'Se clasifica y se registra; lo dudoso queda marcado para revisar.', 'Al final del trimestre, el paquete para la asesoría sale preparado.'],
    ejNota: 'Ejemplo ficticio', ejTxt: 'Capturas con una empresa inventada («Empresa X, S.L.») y clientes de demostración.',
    ej: shots([[IMG.fiscal, 'Paquete trimestral para la asesoría con datos ficticios'], [IMG.facturas, 'Facturas registradas con clientes de demostración']]),
    sig: 'Empezamos por el documento que más se repite en tu empresa.', cta: diag() + btn('/gestion-documental-ia/', 'Ver la gestión documental con IA', true) },
];

const CASOS_OTR = [
  { id: 'clinicas', ic: 'cal', sector: 'Clínicas y centros con cita', titulo: 'Software de gestión para clínicas veterinarias',
    problema: 'Las citas se dan por teléfono, las fichas están en papel o en hojas sueltas y las vacunas pendientes dependen de que alguien se acuerde de avisar al dueño.',
    solucion: 'Un programa todo en uno para la clínica: agenda de citas, ficha de cada paciente con su historia clínica, control de vacunaciones, recordatorios automáticos y facturación.',
    pasos: ['Se da la cita en la agenda.', 'La ficha del paciente guarda su historia y sus vacunas.', 'Los recordatorios de citas y vacunas salen solos.', 'La visita se factura desde el mismo programa.'],
    ejNota: 'Ejemplo ficticio', ejTxt: 'Clínica y pacientes inventados («VetDemo»).', ej: shots([[IMG.veterinaria, 'Software de gestión para clínicas veterinarias: demostración con una clínica y pacientes ficticios']]),
    sig: 'Cuéntanos cómo trabaja tu clínica y lo adaptamos.', cta: diag() },
  { id: 'atencion', ic: 'chat', ejemplo: true, sector: 'Asesorías y clínicas', titulo: 'Asistentes que atienden a los clientes por ti',
    problema: 'En asesorías y clínicas el teléfono no para: las mismas dudas, citas que cambiar y documentación que falta. Cada llamada interrumpe a alguien que estaba con otra cosa.',
    solucion: 'Un asistente con la información real del negocio que responde a las preguntas frecuentes, recoge lo que falta, gestiona citas y pasa a una persona lo que no debe resolver solo.',
    pasos: ['El cliente pregunta por web o mensajería.', 'El asistente consulta la información del negocio.', 'Responde, recoge lo que falta o propone cita.', 'Avisa al equipo cuando hace falta una persona.'],
    ejNota: 'Ejemplo ficticio', ejTxt: '',
    ej: chatEj('Asistente · Asesoría Ejemplo', [['c', '¿Qué documentos os faltan para presentar el trimestre?'], ['b', 'Faltan las facturas recibidas del último mes y el extracto del banco. Puedes mandarlas por aquí. ¿Quieres que te reserve una cita con tu asesor?'], ['c', 'Sí, mejor por la tarde.'], ['b', 'Hecho: te propongo dos huecos por la tarde. Elige el que prefieras.']], 'Ejemplo ficticio de conversación con un asistente de atención.'),
    sig: 'Te decimos qué preguntas podría resolver tu asistente.', cta: diag() + btn('/agentes-chatbots-ia/', 'Ver asistentes y chatbots de IA', true) },
  { id: 'despachos', ic: 'balanza', sector: 'Despachos de abogados', titulo: 'Buscador de jurisprudencia que entiende el caso',
    problema: 'Encontrar sentencias útiles para un caso exige horas en buscadores oficiales poco amigables, probando combinaciones de palabras clave.',
    solucion: 'Un buscador al que se le describe el caso con palabras normales. Busca en la fuente oficial del poder judicial y devuelve las resoluciones relevantes con su referencia oficial para comprobarlas.',
    pasos: ['Se describe el caso con palabras normales.', 'La IA lo traduce a consultas sobre la fuente oficial.', 'Devuelve las resoluciones relevantes.', 'Cada resultado lleva su referencia oficial para verificarlo.'],
    ejNota: 'Captura de demostración', ejTxt: 'Consulta de ejemplo con una resolución pública.', ej: shots([[IMG.fundalex, 'Buscador de jurisprudencia con una consulta de ejemplo y su resultado verificado']]),
    sig: 'Cuéntanos qué buscáis más a menudo y lo valoramos.', cta: diag() },
  { id: 'comercio', ic: 'caja', ejemplo: true, sector: 'Comercio y tienda online', titulo: 'Ejemplo: un asistente de producto en una tienda online',
    problema: 'Los clientes dudan entre productos parecidos o preguntan por compatibilidades y plazos. Sin una respuesta rápida, muchos abandonan la compra.',
    solucion: 'Un asistente en la tienda que conoce el catálogo, compara productos, resuelve dudas y lleva al carrito. Si no sabe algo, deja la consulta preparada para tu equipo.',
    pasos: ['El cliente pregunta por un producto o por una necesidad.', 'El asistente consulta el catálogo.', 'Compara opciones y resuelve la duda.', 'Lleva al carrito o deja la consulta para tu equipo.'],
    ejNota: 'Ejemplo ficticio', ejTxt: '',
    ej: chatEj('Asistente · Tienda Ejemplo', [['c', 'Busco una mochila para portátil de 15 pulgadas que sea impermeable.'], ['b', 'Tengo dos modelos que encajan. Te los comparo en una tabla y te digo cuál tiene envío más rápido. ¿Quieres verlos?']], 'Ejemplo ficticio de conversación en una tienda online.'),
    sig: 'Si tienes tienda online, vemos qué dudas se repiten más.', cta: diag() },
  { id: 'educacion', ic: 'libro', sector: 'Educación', titulo: 'Refuerzo escolar con una foto del ejercicio',
    problema: 'Muchos alumnos de ESO se atascan con los deberes de Matemáticas o Física y en casa no siempre hay quien se los explique.',
    solucion: 'Una aplicación de chat: el alumno hace una foto al ejercicio y la IA lo lee, lo resuelve, comprueba el resultado y lo explica paso a paso.',
    pasos: ['El alumno hace una foto al ejercicio.', 'La IA lee el enunciado.', 'Resuelve y comprueba el resultado.', 'Lo explica paso a paso.'],
    ejNota: 'Captura de demostración', ejTxt: 'Pantalla de inicio de la aplicación, sin datos de alumnos.', ej: shots([[IMG.refuerzo, 'Aplicación de refuerzo escolar con IA: pantalla de inicio']]),
    sig: 'Cuéntanos qué necesita tu centro o tu academia.', cta: diag() },
  { id: 'contenido', ic: 'radar', sector: 'Contenido', titulo: 'Un blog de actualidad que se prepara con ayuda de la IA',
    problema: 'Mantener un blog de actualidad exige leer decenas de fuentes cada día y escribir con rigor. Hecho a mano, se come las mañanas.',
    solucion: 'Un sistema de IA que cada mañana revisa las fuentes y propone las mejores noticias. Tras la aprobación de una persona investiga, redacta, ilustra y optimiza el artículo antes de publicarlo.',
    pasos: ['Se revisan las fuentes cada mañana.', 'La IA puntúa las noticias y propone las mejores.', 'Una persona aprueba cuáles se publican.', 'Se redacta, se ilustra y se publica con las fuentes enlazadas.'],
    ejNota: 'Captura de demostración', ejTxt: 'Archivo del blog de esta web.', ej: shots([[IMG.medio, 'Archivo de noticias del blog de Transforma con IA']]),
    sig: 'Si quieres algo parecido para tu sector, lo vemos en el diagnóstico.', cta: diag() + btn('/contenido-automatico-ia/', 'Ver noticias y páginas automáticas', true) },
];
const CASOS = [...CASOS_IND, ...CASOS_OTR];

// Ficha de 5 partes. Se usa en /casos/, /otros-sectores/ y en el bloque de caso de cada página de servicio.
const fichaHTML = (c) => `<article class="tc-caso tc-reveal"${c.id ? ` id="${c.id}"` : ''}>
<div class="tc-caso__txt">
<header class="tc-caso__h">${icon(c.ic)}<div>${c.ejemplo ? '<span class="tc-nota-ej">Ejemplo ficticio</span><br>' : ''}<span class="tc-eyebrow tc-eyebrow--plain">${c.sector}</span><h3>${c.titulo}</h3></div></header>
<div class="tc-caso__pc"><div class="tc-caso__p"><span class="tc-pc__l tc-pc__l--p">Problema</span><p>${c.problema}</p></div><div class="tc-caso__s"><span class="tc-pc__l">Solución</span><p>${c.solucion}</p></div>
<div><span class="tc-pc__l">Cómo funciona</span><ol class="tc-flow" style="flex-direction:column;align-items:stretch">${c.pasos.map((p) => `<li>${p}</li>`).join('')}</ol></div></div>
</div>
<div class="tc-caso__vis"><div class="tc-caso__pc"><div><span class="tc-pc__l">${c.ejemplo ? 'Así se vería' : c.ejNota}</span>${c.ejTxt ? `<p>${c.ejTxt}</p>` : ''}${c.ej}</div>
<div><span class="tc-pc__l">Siguiente paso</span><p>${c.sig}</p><div class="tc-btns">${c.cta}</div></div></div></div>
</article>`;
const casoHTML = fichaHTML;
// primera frase con un solo punto final (antes salía «..» si el texto tenía una sola frase)
const frase = (t) => t.split('. ')[0].replace(/\.+$/, '') + '.';
const casoCard = (id) => { const c = CASOS.find((x) => x.id === id); return `<article class="tc-box tc-pc tc-reveal">${icon(c.ic)}${c.ejemplo ? '<span class="tc-nota-ej">Ejemplo ficticio</span>' : ''}<span class="tc-eyebrow tc-eyebrow--plain">${c.sector}</span><h3>${c.titulo}</h3><span class="tc-pc__l tc-pc__l--p">Problema</span><p>${frase(c.problema)}</p><span class="tc-pc__l">Solución</span><p>${frase(c.solucion)}</p><a class="tc-link" href="/casos/#${c.id}">${c.ejemplo ? 'Leer el ejemplo sobre SAP con IA' : 'Leer el caso de ' + c.sector.toLowerCase()}</a></article>`; };

// ======================= PÁGINAS =======================
// ---- Portada: rejillas de soluciones y de sectores (fondos propios en CSS, sin imágenes) ----
const SOL_HOME = [
  ['erp', 'IndunexIA Gestión', 'Calcula lo que te cuesta cada trabajo, ponle tu margen y presupuesta, albarana y factura desde el móvil.', '/erp-industria/', 'Ver IndunexIA Gestión'],
  ['flujo', 'Automatización de procesos', 'Pedidos, albaranes y facturas que hoy se pasan a mano empiezan a moverse solos entre tus programas.', '/automatizacion-procesos-ia/', 'Ver la automatización de procesos'],
  ['doc', 'IndunexIA Documentos', 'Facturas, tickets y albaranes leídos con IA y guardados en su carpeta, sin teclear.', '/gestion-documental-ia/', 'Ver IndunexIA Documentos'],
  ['chat', 'Asistentes técnicos y chatbots', 'Asesoran a tus clientes 24/7 con tu catálogo y tus fichas técnicas y llevan a la compra en tu tienda online.', '/agentes-chatbots-ia/', 'Ver los asistentes y probar la demo'],
  ['app', 'Desarrollo a medida y SAP', 'Mejoras sobre SAP o sobre tu ERP y herramientas hechas a la medida de tu forma de trabajar.', '/desarrollo-a-medida-ia/', 'Ver el desarrollo a medida y SAP'],
  ['caja', 'Distribución industrial', 'Referencias, equivalencias y pedidos para distribuidores y suministros técnicos, con tu catálogo.', '/distribucion-industrial/', 'Ver las soluciones de distribución industrial'],
];
const solHome = `<div class="tc-sols">${SOL_HOME.map(([i, t, p, u, l], n) => `<article class="tc-sol tc-sol--${n + 1} tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p><a class="tc-link" href="${u}">${l}</a></article>`).join('')}</div>`;
const SECT_HOME = [
  ['tuerca', 'IA para talleres industriales', 'Mecanizado, calderería y reparación: responde antes a los presupuestos, con tu margen aplicado.', ['Presupuestos con tu coste real y tu margen', 'Albaranes y partes firmados en el móvil', 'Órdenes de trabajo, entregas y cobros bajo control'], '/ia-talleres-industriales/', 'Ver soluciones para talleres industriales'],
  ['llave', 'IA para mantenimiento industrial', 'Los avisos llegan clasificados por urgencia y con la orden de trabajo ya creada.', ['Avisos por Telegram o WhatsApp convertidos en órdenes', 'Asistente que consulta los manuales de tus máquinas', 'Informes de intervención que se redactan solos'], '/ia-mantenimiento-industrial/', 'Ver soluciones para mantenimiento industrial'],
  ['rayo', 'IA para empresas instaladoras', 'Electricidad, climatización y frío: presupuestos y citas sin pasar la tarde al teléfono.', ['Presupuestos a partir de mediciones y listas de material', 'Facturas y albaranes de proveedor que se leen solos', 'Partes de trabajo dictados desde la obra'], '/ia-empresas-instaladoras/', 'Ver soluciones para empresas instaladoras'],
  ['fabrica', 'IA para fabricación industrial', 'Datos de producción sin papel y sin teclear dos veces.', ['Partes de producción y trazabilidad desde el móvil', 'Informes de producción y calidad que llegan solos', 'Pedidos de clientes y proveedores conectados con el ERP'], '/ia-fabricacion-industrial/', 'Ver soluciones para fabricación industrial'],
  ['caja', 'IA para distribución técnica', 'La referencia y la equivalencia correctas en segundos, también fuera de horario.', ['Asistente con tu catálogo, tus fichas y tu stock', 'Equivalencias entre marcas y referencias incompletas', 'Pedidos que llegan por correo directos al ERP'], '/distribucion-industrial/', 'Ver soluciones para distribución técnica'],
  ['mapa', 'IA para empresas de la Región de Murcia', 'Consultoría de IA cercana: puesta en marcha en tu empresa si estás en la Región de Murcia y en remoto en el resto de España.', ['Diagnóstico gratuito por escrito', 'Piloto con tus datos antes de comprometer el presupuesto', 'Soporte en persona y en remoto'], '/consultor-ia-murcia/', 'Ver soluciones para empresas de Murcia'],
];
const sectHome = `<div class="tc-sects">${SECT_HOME.map(([i, t, f, it, u, l], n) => `<article class="tc-sectc tc-sectc--${n + 1} tc-reveal">${icon(i)}<h3>${t}</h3><p>${f}</p><ul class="tc-checks">${it.map((x) => `<li>${x}</li>`).join('')}</ul><a class="tc-link" href="${u}">${l}</a></article>`).join('')}</div><p class="tc-sects__otros tc-reveal">¿Tu empresa es de otro sector? <a class="tc-link" href="/otros-sectores/">Mira los otros sectores</a></p>`;
const DOC_ICO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';

const P = {};

// Portada (29-10-2026): las demos en primer plano (ver funcionando convence más que cualquier texto) y las soluciones con foto real
const DEMOS = [
  ['IndunexIA Gestión', 'El programa de gestión para talleres y empresas industriales: presupuestos con tu margen, albaranes firmados en el móvil, facturas y cobros.', IMG.erp_inicio, DEMO_URL, 'Abrir el ERP de ejemplo', '/erp-industria/', 'Conocer IndunexIA Gestión'],
  ['Asistente técnico', 'Una tienda online de ejemplo con un asistente que entiende referencias y medidas, propone equivalencias y lo añade al carrito.', 'https://demo.transformaconia.com/web/portada/demo-asistente.webp', 'https://demo.transformaconia.com/asistente/', 'Probar el asistente', '/agentes-chatbots-ia/', 'Ver los asistentes'],
  ['Presupuestos desde plano', 'Del plano o la foto al presupuesto con tus tarifas y tu margen, listo para enviar en PDF.', 'https://demo.transformaconia.com/web/portada/demo-presupuesto.webp', 'https://presupuestos.transformaconia.com/demo', 'Ver un presupuesto de ejemplo', '/presupuestos-desde-plano/', 'Conocer IndunexIA Presupuestos'],
];
const DEMOS_HOME = `<section class="tc-sec tc-sec--fotos" id="demos"><div class="tc-wrap">${head('Pruébalo tú', 'Míralo funcionando antes de hablar con nadie', 'Programas reales con datos de ejemplo. Ábrelos y prueba: sin registrarte y sin dejar tus datos.')}
<div class="tc-grid tc-grid--3">${DEMOS.map(([t, p, img, demo, dtxt, pag, ptxt]) => `<article class="tc-demo tc-reveal"><a class="tc-demo__img" href="${demo}" target="_blank" rel="noopener" aria-label="${dtxt} (se abre en otra pestaña)"><span class="tc-shot__bar" aria-hidden="true"><i></i><i></i><i></i></span><img src="${img}" alt="${t}: captura del programa con datos ficticios" width="960" height="600" loading="lazy" decoding="async"><span class="tc-demo__tag">Datos ficticios</span></a>
<div class="tc-demo__txt"><h3>${t}</h3><p>${p}</p><div class="tc-btns"><a class="tc-btn" href="${demo}" target="_blank" rel="noopener">${dtxt} ${ARROW}</a></div><a class="tc-link" href="${pag}">${ptxt}</a></div></article>`).join('')}</div></div></section>`;
const FOTOS_SOL = { erp: 'sol-gestion', flujo: 'sol-procesos', doc: 'sol-documentos', chat: 'sol-asistentes', app: 'sol-medida', caja: 'sol-distribucion' };
const FOTO_SOL = `<section class="tc-sec tc-sec--fotos" id="soluciones"><div class="tc-wrap">${head('Soluciones', 'Soluciones de IA para la industria', 'Desde una automatización concreta hasta un programa de gestión completo. Cada solución tiene su página, con ejemplos y precios orientativos.', '<a class="tc-link" href="/soluciones/">Todas las soluciones y precios</a>')}
<div class="tc-grid tc-grid--3">${SOL_HOME.map(([i, t, p, u, l]) => `<a class="tc-fsol tc-reveal" href="${u}"><img src="https://demo.transformaconia.com/web/portada/${FOTOS_SOL[i]}.webp" alt="" width="720" height="720" loading="lazy" decoding="async"><span class="tc-fsol__txt"><h3>${t}</h3><span>${p}</span><span class="tc-link">${l}</span></span></a>`).join('')}</div></div></section>`;

P['transforma-con-ia'] = {
  id: 5851, title: 'Transforma con IA',
  seo: ['Consultoría de IA industrial | Transforma con IA', 'Consultoría de IA industrial en Murcia y toda España: ERP para la industria, automatización de pedidos, albaranes y facturas, y asistentes técnicos.', 'consultoría de IA industrial'],
  html: page(`
<div class="tc-3dz"><div class="tc-3dz__layer" aria-hidden="true"><div class="tc-3dz__pin">
<img class="tc-foto" loading="lazy" src="https://demo.transformaconia.com/web/portada/hero-1920.webp" srcset="https://demo.transformaconia.com/web/portada/hero-960.webp 960w, https://demo.transformaconia.com/web/portada/hero-1920.webp 1920w" sizes="100vw" alt="" style="object-position:72% 50%" decoding="async">
<img class="tc-esc" data-t="-1" src="https://demo.transformaconia.com/web/portada/fondo-hero.webp" srcset="https://demo.transformaconia.com/web/portada/fondo-hero-m.webp 720w, https://demo.transformaconia.com/web/portada/fondo-hero.webp 1280w" sizes="100vw" alt="" decoding="async"><img class="tc-esc" data-t="2" data-src="https://demo.transformaconia.com/web/portada/fondo-piezas.webp" data-srcm="https://demo.transformaconia.com/web/portada/fondo-piezas-m.webp" alt="" decoding="async"><img class="tc-esc" data-t="3" data-src="https://demo.transformaconia.com/web/portada/fondo-almacen.webp" data-srcm="https://demo.transformaconia.com/web/portada/fondo-almacen-m.webp" alt="" decoding="async"><img class="tc-esc" data-t="4" data-src="https://demo.transformaconia.com/web/portada/fondo-maquina.webp" data-srcm="https://demo.transformaconia.com/web/portada/fondo-maquina-m.webp" alt="" decoding="async">
<div class="tc-3dz__velo"></div><div class="tc-3dz__stage" id="tc-3d"></div><div class="tc-3dz__labels"><span>Z 28 · m 2</span><span>Z 14 · m 2</span><span>Eje Ø 20 h7</span></div>
</div></div>
<header class="tc-hero tc-hero--home tc-hero--c">${DECO('a')}<div class="tc-wrap"><div class="tc-hero__copy">
  <span class="tc-live"><i></i>Expertos en IA de Murcia · más de 2&nbsp;años · Industria en toda España</span>
  <h1 class="tc-h1-home"><span>IA y automatización para</span> <span class="tc-grad tc-shine">empresas industriales</span></h1>
  <p class="tc-lead">Quitamos el trabajo repetitivo de tu empresa: documentos que se leen solos, presupuestos en minutos y datos conectados con tu ERP. Presencial en la Región de Murcia y en remoto en toda España.</p>
  <div class="tc-btns"><a class="tc-btn tc-btn--pill" href="/contacto/">${DOC_ICO}Pide tu diagnóstico gratis ${ARROW}</a></div>
  <ul class="tc-proof"><li><span><b>Diagnóstico por escrito</b> en 48&nbsp;h · <b>Piloto con tus datos</b> · <a class="tc-link" href="#calculadora">Haz la cuenta →</a></span></li></ul>
</div></div></header>
<section class="tc-story" id="como-trabajamos" aria-labelledby="tc-story-h" data-paso="0"><span class="tc-story__ancla" style="--k:0" aria-hidden="true"></span><span class="tc-story__ancla" style="--k:1" aria-hidden="true"></span><span class="tc-story__ancla" style="--k:2" aria-hidden="true"></span><span class="tc-story__ancla" style="--k:3" aria-hidden="true"></span><span class="tc-story__ancla" style="--k:4" aria-hidden="true"></span><div class="tc-story__pin"><div class="tc-wrap tc-story__grid">
  <div class="tc-story__txt">
    <p class="tc-story__kicker">Así trabaja la IA en una empresa industrial</p>
    <h2 id="tc-story-h">Del plano a la factura, <span class="tc-grad">sin teclear</span></h2>
    <ol class="tc-story__steps">
      <li data-paso="0"><span class="tc-story__n">01</span><h3>Llega el trabajo</h3><p>Un plano, un pedido por correo o una petición de oferta. Llega como siempre, no cambias nada.</p></li>
      <li data-paso="1"><span class="tc-story__n">02</span><h3>La IA lo lee</h3><p>Saca medidas, material, cantidades y plazo del plano o del PDF, y lo deja apuntado sin que nadie teclee.</p></li>
      <li data-paso="2"><span class="tc-story__n">03</span><h3>Presupuesto con tu margen</h3><p>Calcula material, horas de máquina y tratamientos con tus tarifas, aplica tu margen y el presupuesto sale en minutos.</p></li>
      <li data-paso="3"><span class="tc-story__n">04</span><h3>Fabricas y entregas</h3><p>Órdenes de trabajo en el taller y el albarán se firma en el móvil al entregar. Sin papeles que se pierden.</p></li>
      <li data-paso="4"><span class="tc-story__n">05</span><h3>Y todo encaja</h3><p>Pedido, albarán, factura y cobro unidos en tu ERP, sin escribir dos veces el mismo dato. Te contamos qué encajaría en tu empresa.</p><a class="tc-btn tc-btn--pill tc-story__cta" href="/contacto/">Pide tu diagnóstico gratis ${ARROW}</a></li>
    </ol>
    <div class="tc-story__bar" aria-hidden="true"><i></i></div>
  </div>
  <div class="tc-hud" aria-hidden="true">
    <div class="tc-hud__box tc-hud__chips" data-hud="1"><b>Datos leídos del plano</b><span>Pieza <em>Engranajes</em></span><span>Material <em>42CrMo4</em></span><span>Cantidad <em>12 juegos</em></span><span>Plazo <em>10 días</em></span><small>Ejemplo ficticio</small></div>
    <div class="tc-hud__box tc-hud__budget" data-hud="2"><b>Presupuesto P-0127</b><span>Material <em>186 €</em></span><span>Tallado 4,5 h <em>270 €</em></span><span>Temple <em>64 €</em></span><span>Margen 25 % <em>130 €</em></span><span class="tc-hud__tot">Total <em>650 €</em></span><small>Ejemplo ficticio</small></div>
    <div class="tc-hud__box tc-hud__docs" data-hud="3"><b>Taller y entrega</b><span>✓ Orden de trabajo OT-0412</span><span>✓ 12 juegos fabricados</span><span>✓ Albarán firmado en el móvil</span><small>Ejemplo ficticio</small></div>
    <div class="tc-hud__box tc-hud__docs" data-hud="4"><b>En tu ERP</b><span>✓ Pedido registrado</span><span>✓ Albarán unido a la factura</span><span>✓ Factura emitida</span><span>◷ Cobro a 30 días</span><small>Ejemplo ficticio</small></div>
  </div>
</div></div></section>
</div>

${DEMOS_HOME}

${FOTO_SOL}

${calcu('Antes de hablar con nosotros, haz la cuenta')}

<section class="tc-sec tc-sec--alt" id="como-trabajamos"><div class="tc-wrap">${head('Cómo trabajamos', 'Cómo trabajamos: del diagnóstico por escrito a funcionando, sin pagar a ciegas', 'Todo empieza con un diagnóstico gratis y precios orientativos claros.', '<a class="tc-link" href="/soluciones/">Precios orientativos</a>')}${PASOS}</div></section>

${contactoPortada()}
`),
};

P['industria'] = {
  title: 'IA para la industria',
  seo: ['Inteligencia artificial para la industria', 'Qué automatizamos con inteligencia artificial en talleres, distribución industrial, mantenimiento, instaladoras e integradores. Diagnóstico inicial gratis.', 'inteligencia artificial para la industria'],
  html: page(`${pagehead('<span>Industria</span>', 'IA para la industria', 'Automatización e inteligencia artificial para empresas industriales', 'Venimos de la industria y la mayor parte de lo que construimos es para ella. Estas son las tareas que más horas ahorran en cada tipo de empresa.', btn('/contacto/', 'Cuéntanos tu caso') + btn('/casos/', 'Ver casos', true), facts('Sectores', SECTORES.map((s, i) => [String(i + 1).padStart(2, '0'), `<a href="${s.pag ? s.pag[0] : '#' + s.id}">${s.t}</a>`])))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-casos">${SECTORES.map((s, i) => `<article class="tc-sectorbig tc-reveal" id="${s.id}"><div class="tc-sectorbig__h">${icon(s.ic)}<span class="tc-sectorbig__n">${String(i + 1).padStart(2, '0')}</span></div><div class="tc-prose"><h2>${s.t}</h2><p class="tc-sect__frase">«${s.frase}»</p>${list(s.items)}<div class="tc-btns">${s.pag && s.pag[0] !== s.sol[0] ? btn(s.pag[0], s.pag[1]) : ''}${btn(s.sol[0], s.sol[1], true)}</div></div></article>`).join('')}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Así funciona', 'Una automatización trabaja como una línea de producción')}${linea()}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Casos', 'Casos y ejemplos para la industria', 'El caso marcado como ejemplo no es un proyecto concreto: muestra lo que se puede implementar.', '<a class="tc-link" href="/casos/">Todos los casos</a>')}<div class="tc-grid tc-grid--4">${['gestion', 'distribucion', 'documentacion', 'sap'].map(casoCard).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Por qué nosotros', 'Venimos de la industria')}${porQue}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Preguntas frecuentes', 'IA en la empresa industrial')}${faq([
    ['¿Por dónde empieza una empresa industrial con la IA?', 'Por la tarea que más horas repite cada semana: presupuestos, pedidos, consultas de referencias o documentación. Se automatiza una, se mide y después se amplía.'],
    ['¿Funciona con SAP u otro ERP?', 'Sí. Si tu ERP tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo. SAP es un buen ejemplo: cualquier idea para mejorarlo se puede implementar, y lo mismo en el programa que uséis.'],
    ['¿Qué pasa con la confidencialidad de mis datos?', 'Accesos mínimos, servidores en la Unión Europea siempre que es posible y nada se usa para entrenar modelos de terceros. Lo que montamos es tuyo.'],
    ['¿Hacéis visitas a la nave o al taller?', 'Sí, en la Región de Murcia. Ver cómo trabajáis en persona es la mejor forma de detectar qué automatizar.'],
  ])}</div></section>
${CALC_ENLACE}
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
  seo: ['ERP para la industria con IA | IndunexIA Gestión', 'Programa de gestión para talleres de mecanizado, calderería y reparación: costes y margen, presupuestos, albaranes firmados y facturas. Desde 590 €.', 'erp para la industria'],
  html: page(`${pagehead('<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>ERP para la industria</span>', 'IndunexIA Gestión · ERP con IA para la industria', 'El ERP para la industria que se usa desde el móvil', 'Sabes lo que te cuesta cada trabajo, le pones tu margen y el presupuesto sale en minutos. Albaranes firmados, facturas, cobros y gastos en un solo programa, con un asistente de IA y Telegram para registrarlo todo sin sentarte al ordenador.', btn(DEMO_URL, DEMO_TXT) + btn('/contacto/', 'Pide tu diagnóstico gratis', true), device(IMG.erp_calculadora, 'Calculadora de costes: lo que te cuesta el trabajo y el precio con tu margen', '<span class="tc-device__ok">✓</span><span><b>Coste + margen</b><small>Precio de venta listo para presupuestar</small></span>'))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-stats tc-reveal"><div><b>Minutos</b><span>para un presupuesto con tu margen</span></div><div><b>1 clic</b><span>del albarán firmado a la factura</span></div><div><b>1 foto</b><span>para registrar un gasto</span></div><div><b>1 botón</b><span>para el paquete de la asesoría</span></div></div></div></section>
<section class="tc-sec tc-sec--alt" id="talleres"><div class="tc-wrap">${head('Para quién', 'Pensado para talleres industriales', 'Nació en talleres de mecanizado y hoy se adapta a cualquier taller que presupueste, entregue y facture trabajos. Y se combina con empresas de otros sectores activando los módulos que cada una necesita.')}
<div class="tc-grid tc-grid--3">${TALLERES.map(([i, t, p], n) => `<article class="tc-box tc-reveal${n === 0 ? ' tc-box--star' : ''}">${n === 0 ? '<span class="tc-badge">Donde nació</span>' : ''}${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}<a class="tc-box tc-reveal" href="/otros-sectores/">${icon('equipo')}<h3>¿Otro sector?</h3><p>El mismo programa se combina con empresas de otros sectores: activamos los módulos que necesitas y lo ajustamos a vuestra forma de trabajar.</p><span class="tc-link">Ver cómo trabajamos con otros sectores</span></a></div></div></section>
<section class="tc-sec"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Calculadora de costes')}<h2>Primero lo que te cuesta a ti. Después, tu precio.</h2><p>La calculadora de costes y presupuestos sirve para sacar lo que te cuesta cualquier trabajo o servicio que quieras prestar, ponerle tu margen y tener el precio de venta antes de presupuestar. Así sabes en cada oferta cuánto ganas.</p>${flow(CALC_PASOS)}${list(['Para piezas, reparaciones, montajes, servicios o cualquier trabajo', 'Tus tarifas de máquina, de taller y de material guardadas', 'Si trabajas con metal, con la cotización del material al día', 'Del cálculo al presupuesto con tu logo en un clic'])}</div>
<div class="tc-reveal">${shot(IMG.erp_calculadora, 'Calculadora de costes del ERP para la industria con el margen aplicado', 'Pantalla real con datos de ejemplo')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Qué incluye', 'IndunexIA Gestión: todo lo que pasa en un taller, en un solo programa')}
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
<section class="tc-sec" id="albaran"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Albarán firmado')}<h2>Del albarán firmado a la factura, sin volver a teclear</h2><p>El cliente firma en el móvil al entregar el trabajo y el albarán queda guardado en su expediente. Después pasa a factura con un clic y la factura enlaza con su albarán.</p>${list(['Firma del cliente en la pantalla del móvil, en la obra o en el taller', 'Cada albarán queda con su estado: pendiente, firmado, traspasado a factura', 'Lo pendiente de facturar, siempre a la vista'])}</div>
<div class="tc-reveal">${shot(IMG.erp_albaran, 'Listado de albaranes de IndunexIA Gestión con un albarán firmado por el cliente y ya traspasado a factura', 'Pantalla real con datos de ejemplo')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Como una app')}<h2>En el taller, en la obra o en el coche</h2><p>No hay que instalar nada: se abre desde el móvil, la tableta o el ordenador con tu usuario. El jefe ve lo pendiente de hoy al abrirlo, el encargado hace albaranes en la obra y la oficina factura sin pedir papeles a nadie.</p>${list(['Usuarios con permisos: jefe, oficina, encargado…', 'Tus datos en un servidor propio para tu empresa, en la UE', 'Tu logo y tus datos en presupuestos, albaranes y facturas', 'Copias de seguridad y soporte incluidos en el mantenimiento'])}</div>
<div class="tc-phoneonly tc-reveal"><figure class="tc-device__phone tc-device__phone--solo"><img src="${IMG.erp_movil}" width="780" height="1688" alt="El ERP para la industria en el móvil: lo pendiente de hoy, impuestos y cobros" loading="lazy" decoding="async"></figure></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Implantación', 'Funcionando en pocas semanas, configurado a tu manera')}
<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">Semana 1</span><h3>Demo y configuración</h3><p>Te lo enseñamos con datos de ejemplo, cargamos tus clientes, tu catálogo y tus tarifas de máquina, taller y material.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">Semanas 2 y 3</span><h3>Arranque con tu equipo</h3><p>Empezáis a presupuestar, albaranar y facturar con él. Ajustamos lo que haga falta para que encaje con vuestra forma de trabajar.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">Cuando tú das el visto bueno</span><h3>Empieza el mantenimiento</h3><p>El mantenimiento no empieza hasta que el programa está a tu gusto. Soporte, copias y mejoras incluidos.</p></div></div></div></section>
${CALC_ENLACE}
<section class="tc-sec" id="precio"><div class="tc-wrap">${head('Precio', 'Tres planes, según lo que necesites', 'Todos con la puesta en marcha en un solo pago, los 3 primeros meses de cuota gratis y sin permanencia. En el diagnóstico gratis te decimos cuál te encaja.')}
${planes()}
<div class="tc-btns" style="margin-top:22px">${btn('/contacto/', 'Pide tu diagnóstico gratis')}${btn(DEMO_URL, DEMO_TXT, true)}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Sobre el ERP para la industria')}${faq([
    ['¿Para qué empresas está pensado?', 'Para talleres industriales que presupuestan, entregan y facturan trabajos: mecanizado, calderería y estructuras metálicas, carpintería metálica, reparación y mantenimiento de maquinaria, hidráulica y neumática. También se combina con empresas de otros sectores activando los módulos que necesiten.'],
    ['¿Para qué trabajos sirve la calculadora de costes y presupuestos?', 'Para cualquiera: piezas, reparaciones, montajes o servicios. Sacas lo que te cuesta a ti el trabajo, le pones tu margen y calculas el precio de lo que quieras prestar. Si trabajas con metal, además usa la cotización del material al día.'],
    ['¿Cuánto cuesta IndunexIA Gestión?', 'Hay tres planes. Básico: 590 € de puesta en marcha y 59 €/mes. Profesional: 690 € y 69 €/mes. Pro: 990 € y 89 €/mes. Son precios de temporada (hasta el 31/12/2026), en un solo pago al empezar, y los 3 primeros meses de cuota son gratis. Cada usuario extra cuesta 15 €/mes desde el primer mes. Todos los precios son sin IVA.'],
    ['¿Qué plan me conviene?', 'El Básico, si quieres dejar el papel y llevar presupuestos, albaranes, facturas y cobros en un solo sitio. El Profesional, si además quieres que la IA te lea los gastos, unir los albaranes firmados, calcular costes y margen y tener el trimestre listo para tu asesor. El Pro, si quieres además tu propio asistente con IA, presupuestar desde planos y una automatización a medida para tu día a día.'],
    ['¿Puedo verlo funcionando antes de decidir?', 'Sí. Tienes un vídeo de 3 minutos con un trabajo de principio a fin y la demo del programa con datos de ejemplo. Y en el diagnóstico gratis te enviamos por escrito cómo quedaría con tus precios y tu forma de trabajar.'],
    ['Ya tengo un programa de gestión, ¿se puede conectar?', 'Si tiene API, se conecta de forma directa. Si no la tiene, valoramos cómo adaptarlo. Además, cargamos clientes, proveedores, catálogo y tarifas desde Excel o desde lo que exporte tu programa actual.'],
    ['¿Sirve para presentar los impuestos?', 'Te prepara el paquete trimestral para tu asesoría con facturas emitidas, gastos y totales. La presentación la sigue haciendo tu asesor.'],
    ['¿Cumple Verifactu?', 'Verifactu todavía no es obligatorio. Cuando lo sea, adaptaremos el programa y te lo comunicaremos.'],
    ['¿Qué pasa si quiero dejarlo?', 'No hay permanencia. Avisas con 30 días y te llevas tus datos exportados.'],
  ])}</div></section>
<div id="contacto-erp">${band('¿Lo vemos con tus trabajos y tus precios?', 'Cuéntanos cómo presupuestáis hoy y te enviamos por escrito cómo quedaría en IndunexIA Gestión, con un ejemplo de tu taller y tu margen.', btn(DEMO_URL, DEMO_TXT) + btn('/contacto/', 'Pide tu diagnóstico gratis', true))}</div>`),
};

P['distribucion-industrial'] = {
  title: 'Asistente técnico para distribución industrial',
  seo: ['Asistente técnico con IA para distribuidores', 'Asistente de IA que responde referencias, equivalencias entre marcas, fichas técnicas y stock con tu catálogo, en tu web y en el mostrador.', 'chatbot para distribuidores industriales'],
  html: page(`${pagehead('<a href="/industria/">Industria</a><span aria-hidden="true">/</span><span>Distribución industrial</span>', 'Distribución y suministro industrial', 'IA que entiende tu catálogo: la referencia correcta en segundos', 'Un asistente técnico que responde a tus clientes y a tu mostrador con tu catálogo real: referencias, equivalencias entre marcas, fichas técnicas y disponibilidad. Si no está seguro, pasa la consulta a una persona.', btn('/contacto/', 'Quiero verlo con mi catálogo') + btn('/casos/#distribucion', 'Leer el caso del asistente en la tienda online', true), facts('En resumen', [['Precio orientativo', 'desde 900 €'], ['Piloto', 'con tu catálogo real'], ['Canales', 'Web, mostrador, mensajería'], ['Sin cambiar', 'tu ERP ni tu web']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('El problema')}<h2>Tu equipo pasa el día al teléfono buscando referencias</h2><p>Rodamientos, transmisión, neumática, hidráulica, tornillería, herramienta: miles de referencias, varias marcas y clientes que preguntan por una equivalencia a las ocho de la tarde. Cada consulta ocupa a alguien que sabe, y muchas se pierden fuera de horario.</p></div><div class="tc-box tc-reveal">${list(['Referencias incompletas o mal escritas', 'Equivalencias entre fabricantes', 'Medidas, fichas técnicas y disponibilidad', 'Consultas fuera de horario que acaban en la competencia'])}</div></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Caso de ejemplo', 'Así se ve en un distribuidor con catálogo grande', 'Ficha resumida; la ficha completa está en la página de casos.')}${fichaHTML({ ic: 'caja', sector: 'Distribución industrial', titulo: 'Asistente de catálogo en la tienda y en el mostrador', problema: 'Miles de referencias, varias marcas y un mostrador que atiende al teléfono mientras busca equivalencias. Fuera de horario, las consultas se quedan sin respuesta.', solucion: 'Un asistente que responde solo con tu catálogo y tu stock, en la tienda online y como apoyo del mostrador, y pasa a una persona lo que no tiene claro.', pasos: ['Cargamos tu catálogo, tus tarifas y las fichas técnicas.', 'Lo probamos con las consultas reales de tu mostrador.', 'Lo publicamos en tu web y en el mostrador.', 'Revisamos juntos las consultas que no supo resolver.'], ejNota: 'Ejemplo ficticio', ejTxt: 'Distribuidor, referencias y stock inventados.', ej: MINI_CHAT, sig: 'Lo probamos con una referencia que vendáis.', cta: diag('Quiero verlo con mi catálogo') + btn('/casos/#distribucion', 'Ver la ficha del asistente técnico en la tienda online', true) })}</div></section>
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
${band('¿Te lo enseñamos con una referencia que vendéis?', 'Mándanos una referencia y te enviamos por escrito cómo la respondería el asistente.')}`),
};

P['otros-sectores'] = {
  title: 'Otros sectores',
  seo: ['IA para clínicas, asesorías y comercios | Transforma con IA', 'Asistentes que atienden a tus clientes, citas, documentación y software a medida para clínicas, asesorías, despachos, comercios y centros de formación.', 'chatbot para asesorías y clínicas'],
  html: page(`${pagehead('<span>Otros sectores</span>', 'Más allá de la industria', 'Si tu equipo repite la misma tarea cada día, se puede automatizar', 'Nuestra especialidad es la industria, pero el mismo método funciona en clínicas, asesorías, despachos, comercios y centros de formación. Estas son aplicaciones que hemos construido y ejemplos de lo que se puede hacer. Los datos de los ejemplos son ficticios.', btn('/contacto/', 'Cuéntanos tu caso'), `<aside class="tc-hero__panel tc-spec"><div class="tc-hero__panel-h"><span>Sectores</span></div><div class="tc-mini" style="grid-template-columns:minmax(0,1fr);padding:14px">${OTROS_SECTORES.map(([i, t]) => `<div>${icon(i)}<b>${t}</b></div>`).join('')}</div></aside>`)}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-grid tc-grid--4">${[
    ['clinicas', 'cal', 'Clínicas y centros con cita', 'Agenda, fichas, recordatorios automáticos y un asistente que atiende y cita a cualquier hora.'],
    ['asesorias', 'balanza', 'Asesorías y despachos', 'Asistentes que responden a los clientes y piden la documentación que falta; buscadores jurídicos con IA.'],
    ['comercio', 'caja', 'Comercio y tienda online', 'Asistentes de producto que resuelven dudas y llevan al carrito; catálogos y fichas automáticas.'],
    ['educacion', 'libro', 'Educación y formación', 'Aplicaciones que explican ejercicios paso a paso y preparan material de práctica.'],
  ].map(([id, i, t, p]) => `<a class="tc-box tc-reveal" href="#${id}">${icon(i)}<h3>${t}</h3><p>${p}</p><span class="tc-link">Ver ejemplo</span></a>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-casos">${[['clinicas', 'clinicas'], ['atencion', 'atencion'], ['despachos', 'asesorias'], ['comercio', 'comercio'], ['educacion', 'educacion'], ['contenido', 'contenido']].map(([cid, anchor]) => fichaHTML({ ...CASOS.find((x) => x.id === cid), id: anchor })).join('')}</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('También hacemos', 'Webs y contenido automático', 'Dos servicios que no son nuestra especialidad pero que podemos hacer si los necesitas junto con lo demás.')}<div class="tc-grid tc-grid--2"><a class="tc-box tc-reveal" href="/diseno-web/">${icon('app')}<h3>Diseño web</h3><p>Webs rápidas y pensadas para salir en Google y captar contactos. Presupuesto a medida.</p><span class="tc-link">Ver diseño web</span></a><a class="tc-box tc-reveal" href="/contenido-automatico-ia/">${icon('noticia')}<h3>Contenido automático</h3><p>Blog de noticias, fichas de producto y páginas por zona, redactados con IA y revisados antes de publicarse.</p><span class="tc-link">Ver contenido automático</span></a></div></div></section>
${band('¿Tu caso es distinto?', 'Cuéntanos qué tarea os quita más tiempo y te decimos si tiene solución y cuánto costaría.')}`),
};

// Familia IndunexIA (27-10-2026): marca paraguas de las apps; Transforma con IA es quien las hace e implanta.
const FAMILIA = [
  ['erp', 'IndunexIA Gestión', 'El programa de gestión con IA: costes y margen, presupuestos, albaranes firmados, facturas, cobros y gastos.', '/erp-industria/', 'Conocer IndunexIA Gestión', 'Producto principal'],
  ['calc', 'IndunexIA Presupuestos', 'Del plano o la foto al presupuesto con tus tarifas en un minuto. Suelto o incluido en IndunexIA Gestión Pro.', '/presupuestos-desde-plano/', 'Ver IndunexIA Presupuestos', 'Nuevo'],
  ['carpeta', 'IndunexIA Documentos', 'Facturas, tickets y albaranes leídos y guardados en la carpeta de tu ordenador, sin teclear.', '/gestion-documental-ia/', 'Ver IndunexIA Documentos', 'Nuevo'],
];
const PRECIO_FAMILIA = { '/erp-industria/': 'desde <b>590 €</b> + 59 €/mes', '/presupuestos-desde-plano/': 'desde <b>290 €</b> + 39 €/mes', '/gestion-documental-ia/': 'desde <b>190 €</b> + 29 €/mes' };
const familia = sec(head('Familia IndunexIA', 'Apps con IA para la industria, de Transforma con IA', 'Cada app resuelve una tarea concreta. Se contratan sueltas o juntas, y hablan entre ellas.') + `<div class="tc-grid tc-grid--3">${FAMILIA.map(([i, t, p, u, l, b], n) => `<article class="tc-box tc-reveal${n === 0 ? ' tc-box--star' : ''}"><span class="tc-badge">${b}</span>${icon(i)}<h3>${t}</h3><p>${p}</p><p class="tc-price"><span>Orientativo</span> ${PRECIO_FAMILIA[u] || ''}</p><a class="tc-link" href="${u}">${l}</a></article>`).join('')}</div>`, 'tc-sec--tight', 'familia');

// Soluciones nuevas (2026-10-27, copia de oferta.json → servicios_nuevos). Sin clientes: son servicios nuevos, no casos.
const NUEVAS = [
  ['doc', 'Lector de facturas y albaranes', 'Haces una foto o reenvías el PDF: la IA saca proveedor, fecha, líneas e importes y los pasa a tu programa o a tu Excel. Tú solo revisas.', 'desde <b>450 €</b> + 39 €/mes'],
  ['sobre', 'Bandeja de correo inteligente', 'Clasifica lo que entra (pedidos, consultas, facturas, avisos), te resume lo importante y deja preparado el borrador de respuesta.', 'desde <b>450 €</b> + 39 €/mes'],
  ['reloj', 'Seguimiento de presupuestos', 'Ningún presupuesto se queda en el aire: te avisa de los que no han contestado y te deja escrito el correo de seguimiento para cada cliente.', 'desde <b>450 €</b> + 39 €/mes'],
  ['calc', 'IndunexIA Presupuestos: del plano al presupuesto', 'Subes el plano, un croquis o una foto y en un minuto tienes el presupuesto con tus tarifas: kilos, cortes, soldaduras y horas. Tu cliente lo acepta con un enlace. Pruébalo con un plano de ejemplo.', 'desde <b>290 €</b> + 39 €/mes', 'https://presupuestos.transformaconia.com/demo', 'Ver un presupuesto de ejemplo'],
  ['lupa', 'Buscador interno de tu empresa', 'Manuales, fichas técnicas, procedimientos y normas: tu equipo pregunta con palabras normales y recibe la respuesta con el documento de origen.', 'desde <b>1.200 €</b> + 69 €/mes'],
  ['movil', 'Recepcionista telefónica con IA', 'Atiende las llamadas que no puedes coger: responde lo habitual, toma el recado o la cita y te lo manda por escrito. Siempre avisa de que es un asistente.', 'desde <b>900 €</b> + 79 €/mes'],
];
const nuevasCards = `<div class="tc-grid tc-grid--3">${NUEVAS.map(([i, t, p, pr, u = '/contacto/', l = 'Pedir diagnóstico']) => `<article class="tc-box tc-reveal${u === '/contacto/' ? '' : ' tc-box--star'}">${icon(i)}<span class="tc-eyebrow tc-eyebrow--plain">${u === '/contacto/' ? 'Nuevo' : 'Nuevo · ya disponible'}</span><h3>${t}</h3><p>${p}</p><p class="tc-price"><span>Orientativo</span> ${pr}</p><a class="tc-link" href="${u}"${u.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${l}</a></article>`).join('')}</div><p class="tc-nota tc-reveal" style="margin-top:18px">Se apoyan en la misma tecnología que ya usamos en nuestro programa de gestión y en nuestros asistentes técnicos. Las llamadas de la recepcionista se cobran aparte según el uso. El presupuesto desde plano se contrata suelto o viene incluido en el plan Pro de IndunexIA Gestión.</p>`;

P['soluciones'] = {
  title: 'Soluciones de IA para empresas',
  seo: ['Soluciones de IA para la industria | Transforma con IA', 'ERP para la industria, automatización de procesos, asistentes técnicos, gestión documental y mejoras sobre SAP o tu ERP, con precios orientativos.', 'soluciones de automatización industrial con IA'],
  html: page(`${pagehead('<span>Soluciones</span>', 'Soluciones', 'Apps y servicios, con precio claro', 'Tres apps de la familia IndunexIA y servicios a medida. Todas arrancan con un diagnóstico gratuito por escrito y, cuando hay desarrollo, con un piloto que pruebas con tus propios datos antes de pagar el total.', btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('Precios orientativos (sin IVA)', [['Diagnóstico', 'Gratis'], ['IndunexIA Gestión', 'desde 590 €'], ['IndunexIA Presupuestos', 'desde 290 €'], ['IndunexIA Documentos', 'desde 190 €'], ['Automatización', 'desde 450 €'], ['Asistente técnico', 'desde 900 €'], ['Herramienta a medida', 'desde 2.500 €']]))}
${familia}
${sec(head('Servicios a medida', 'Cuando lo que necesitas no es una app, sino tu proceso automatizado', 'Lo montamos sobre los programas que ya usas.') + `<div class="tc-grid tc-grid--3">${SERVICIOS.filter(([i]) => ['flujo', 'chat', 'app'].includes(i)).map(([i, t, p, u, pr, l]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p><p class="tc-price"><span>Orientativo</span> ${pr}</p><a class="tc-link" href="${u}">${l}</a></article>`).join('')}</div>` + `<div class="tc-subhead tc-reveal"><span class="tc-eyebrow tc-eyebrow--plain">Soluciones concretas</span><p>Lo que montamos con más frecuencia:</p></div>` + chips, 'tc-sec--tight')}

<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', 'Tres pasos, y en ninguno pagas a ciegas')}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Lo que no prometemos', 'Lo que no prometemos, y lo que sí', 'No prometemos porcentajes de ahorro antes de ver tus datos ni una IA que decida sola. Esto sí:')}<div class="tc-grid tc-grid--4">${GARANTIAS.map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Antes de empezar')}${faq([
    ['¿Los precios son cerrados?', 'No: son orientativos para que sepas el orden de magnitud. Tras el diagnóstico gratuito te enviamos un presupuesto cerrado por escrito.'],
    ['¿Necesito conocimientos técnicos?', 'No. Tú nos explicas cómo trabajáis y nosotros nos encargamos de la parte técnica. Al terminar formamos a tu equipo y te dejamos una guía sencilla.'],
    ['¿Cuánto se tarda en tener algo funcionando?', 'Una automatización sencilla, una o dos semanas. Un asistente técnico, dos o tres. Una herramienta a medida, de cuatro a ocho, con versiones intermedias que ya podéis usar.'],
    ['¿Hay que pagar la IA aparte?', 'El consumo de los modelos de IA suele ser de pocos euros al mes en una pyme. Lo incluimos en el mantenimiento o lo pagas directamente al proveedor, como prefieras.'],
    ['¿Cuánto cuesta el mantenimiento?', 'Depende de la solución. Como referencia orientativa: desde 39 €/mes una automatización, desde 49 €/mes un asistente o el contenido automático, desde 59 €/mes el ERP para la industria (los tres primeros meses gratis, más 15 €/mes por cada usuario extra desde el primer mes) y desde 69 €/mes el soporte de una herramienta a medida. Te lo confirmamos en el presupuesto cerrado.'],
    ['¿Hay subvenciones?', 'Según el momento, programas como Kit Consulting o ayudas regionales a la digitalización pueden cubrir parte. En el diagnóstico te decimos si alguna encaja.'],
  ])}</div></section>
${band('Empieza por lo que más horas os quita', 'Te enviamos el diagnóstico por escrito, gratis y sin compromiso.')}`),
};

// Enlace de la bio de Instagram: todo lo útil en un vistazo, pensado para el móvil.
P['enlaces'] = {
  title: 'Enlaces',
  seo: ['Enlaces · Transforma con IA', 'Diagnóstico gratis, apps IndunexIA para la industria y el blog de Transforma con IA, en un solo sitio.', ''],
  html: page(`<section class="tc-sec" style="padding-top:110px"><div class="tc-wrap" style="max-width:560px">
<div class="tc-head tc-reveal" style="text-align:center;display:block"><div>${eyebrow('Transforma con IA · Murcia')}<h1 style="font-size:clamp(28px,6vw,40px)">IA práctica para la industria</h1><p>Apps que quitan papeleo y automatizaciones a medida. Elige por dónde empezar:</p></div></div>
<div style="display:grid;gap:12px;margin-top:22px">
${[['/contacto/', '📝 Diagnóstico gratis por escrito', 'Nos cuentas cómo trabajas y en 48 h te decimos qué automatizar primero'],
   ['/erp-industria/', '⚙️ IndunexIA Gestión', 'El programa de gestión con IA para talleres e industria'],
   ['/presupuestos-desde-plano/', '📐 IndunexIA Presupuestos', 'Del plano o la foto al presupuesto con tus tarifas'],
   ['/gestion-documental-ia/', '📁 IndunexIA Documentos', 'Facturas y albaranes ordenados solos en tu carpeta'],
   ['/blog/', '📰 Blog', 'Casos de IA en la industria y novedades explicadas'],
   ['/casos/', '🏭 Casos', 'Qué hemos montado y cómo funciona']].map(([u, t, d], n) => `<a class="tc-box tc-reveal${n === 0 ? ' tc-box--star' : ''}" href="${u}" style="display:block;text-decoration:none"><h3 style="margin:0 0 4px">${t}</h3><p style="margin:0">${d}</p></a>`).join('')}
</div></div></section>`),
};

const servicio = ({ crumb, eb, h1, lead, seo, resumen, que, como, precio, faqs, extra = '' }) => ({
  title: crumb, seo,
  html: page(`${pagehead(`<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>${crumb}</span>`, eb, h1, lead, btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('En resumen', resumen))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${head('Qué resolvemos', que[0], que[1])}<div class="tc-grid tc-grid--3">${que[2].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
${extra}
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', como)}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal">${eyebrow('Precio orientativo')}<h2>${precio[0]}</h2><p>${precio[1]}</p></div><div class="tc-box tc-reveal"><p class="tc-price" style="border:0;padding:0;margin:0">${/medida/.test(precio[2]) ? '' : '<span>Orientativo</span> '}${precio[2]}</p><p>${/medida/.test(precio[2]) ? 'Cada web es distinta: te enviamos un presupuesto cerrado adaptado a tus objetivos y requisitos.' : 'Precio de referencia. Tras el diagnóstico gratuito recibes un presupuesto cerrado.'}</p><div>${btn('/contacto/', 'Quiero un presupuesto')}</div></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Dudas habituales')}${faq(faqs)}</div></section>
${band('¿Lo vemos aplicado a tu empresa?', 'Te decimos por escrito si tiene sentido en tu caso y cuánto costaría. Gratis.')}`),
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

P['agentes-chatbots-ia'] = {
  title: 'Asistentes técnicos y chatbots',
  seo: ['Chatbot con IA para empresas y tiendas online | Transforma con IA', 'Asistente técnico con IA para tu web o tienda PrestaShop: fichas técnicas, comparativas, recomendaciones y compra desde el chat, 24/7. Desde 900 €.', 'chatbot con IA para empresas'],
  html: page(`${pagehead('<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>Asistentes técnicos y chatbots</span>', 'Asistentes técnicos con IA · 24/7', 'Un técnico de mostrador en tu web, que no se cansa y nunca cierra', 'Asistentes con IA con el perfil técnico de cada empresa: resuelven las dudas de tus clientes sobre materiales, medidas y compatibilidades, comparan productos, recomiendan lo adecuado y llevan a la compra directa en tu tienda online. Ya los hemos montado en empresas de Murcia y alrededores.', btn(DEMO_ASISTENTE, 'Pruébalo en una tienda de ejemplo') + btn('/contacto/', 'Pide tu diagnóstico gratis', true), facts('En resumen', [['Precio orientativo', 'desde 900 €'], ['Mantenimiento', 'desde 49 €/mes'], ['Plazo', '2 a 4 semanas'], ['Dónde', 'Web, PrestaShop, WooCommerce, WhatsApp']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${head('Qué hace', 'Lo que haría tu mejor técnico, a cualquier hora', 'Responde con TUS datos: tu catálogo, tus fichas, tus tarifas y la información de tu empresa. Si no sabe algo, lo dice y te pasa el contacto.')}<div class="tc-grid tc-grid--3">${[
    ['lupa', 'Fichas técnicas al momento', 'Medidas, materiales, presiones, roscas, normas… La ficha completa de cada referencia en segundos, sin buscar en PDF.'],
    ['objetivo', 'Recomienda según el uso', 'El cliente cuenta qué necesita («empujar 100 kg a 6 bar», «agua a 120 °C») y el asistente propone la opción adecuada y explica por qué.'],
    ['flujo', 'Compara y propone equivalencias', 'Tabla comparativa entre referencias y alternativas cuando algo no está en stock.'],
    ['caja', 'Compra directa desde el chat', 'Añade al carrito de tu tienda online (también varios productos a la vez), con precio y stock reales.'],
    ['chat', 'Información de tu empresa 24/7', 'Horarios, envíos, recogida, devoluciones, formas de pago y servicios, siempre igual de bien contado.'],
    ['telegram', 'Te pasa los clientes calientes', 'Si alguien quiere un presupuesto o hablar con una persona, recoge sus datos y te avisa al correo o a Telegram.'],
  ].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt" id="demo"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal">${eyebrow('Demo en vivo')}<h2>Pruébalo tú en una tienda de ejemplo</h2><p>Hemos montado una tienda ficticia de neumática e hidráulica tipo PrestaShop con su asistente técnico. Pregúntale lo que quieras: qué cilindro necesitas, que te compare dos válvulas, que te añada al carrito lo necesario para montar un circuito o cuánto tarda el envío.</p><p>Es exactamente lo que montamos para cada empresa, con su catálogo, su información y su forma de vender.</p><div class="tc-btns">${btn(DEMO_ASISTENTE, 'Abrir la tienda de ejemplo')}</div><p class="tc-nota">Empresa, productos y precios inventados.</p></div>
<div class="tc-movil-shots tc-reveal">${[['https://transformaconia.com/wp-content/uploads/2026/10/asistente-ia-recomienda.webp', 'Recomienda'], ['https://transformaconia.com/wp-content/uploads/2026/10/asistente-ia-compara.webp', 'Compara'], ['https://transformaconia.com/wp-content/uploads/2026/10/asistente-ia-carrito.webp', 'Añade al carrito']].map(([src, t]) => `<figure><img src="${src}" width="585" height="1266" alt="Asistente técnico con IA de ejemplo: ${t.toLowerCase()}" loading="lazy"><figcaption>${t}</figcaption></figure>`).join('')}</div></div></section>
<section class="tc-sec" id="precio"><div class="tc-wrap">${head('Precio', 'Tres planes, según lo que tenga que saber y hacer', 'Mantenimiento asequible con el uso de la IA incluido. Y si tu caso es distinto, lo hacemos a medida.')}${planesAsistente()}<div class="tc-btns" style="margin-top:22px">${btn('/contacto/', 'Pide tu diagnóstico gratis')}${btn(DEMO_ASISTENTE, 'Probar la demo', true)}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', 'Un asistente útil se diseña alrededor de tus datos')}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Preguntas frecuentes', 'Dudas habituales')}${faq([
    ['¿Responde solo con mis datos?', 'Sí. Consulta tu catálogo, tus fichas y tu información. Si algo no está, lo dice y pasa la consulta a una persona de tu equipo. No se inventa referencias ni precios.'],
    ['¿Funciona con mi tienda PrestaShop, WooCommerce o Shopify?', 'Sí. En el plan Tienda se conecta a tu tienda para leer precios y stock reales y añadir productos al carrito del cliente. Si tu web no es una tienda, el asistente informa y recoge el contacto.'],
    ['¿De qué depende el precio?', 'De cuántas referencias y documentos tiene que manejar, de las bases de datos a las que se conecta y de lo que tiene que hacer (carrito, pedidos, citas, WhatsApp). Tras el diagnóstico gratis te damos el precio cerrado por escrito.'],
    ['¿Qué incluye el mantenimiento?', 'El uso de la IA hasta las conversaciones del plan, las actualizaciones del catálogo y de la información, el soporte y los ajustes. Sin permanencia.'],
    ['¿Puede estar en WhatsApp?', 'Sí, mediante la API oficial de WhatsApp Business. También en tu web, en Telegram o como buscador técnico para tu propio equipo.'],
    ['¿Lo habéis hecho ya en otras empresas?', 'Sí, en empresas de Murcia y alrededores, cada uno con el perfil técnico de su negocio. Por confidencialidad no damos nombres, pero puedes probar uno igual en la tienda de ejemplo.'],
  ])}</div></section>
${band('¿Quieres uno así para tu empresa?', 'Cuéntanos qué te preguntan tus clientes y te enviamos por escrito cómo sería tu asistente y cuánto costaría. Gratis.')}`),
};


// ======================= PÁGINAS DE PRODUCTO (familia IndunexIA) =======================
// Cada app nueva = una entrada aquí: cabecera, capturas, «cómo se usa», qué incluye, planes, FAQ y CTA. Capturas en web-capturas-productos.json.
let CAPT = {};
try { CAPT = JSON.parse(fs.readFileSync(new URL('./web-capturas-productos.json', import.meta.url), 'utf8')); } catch {}
const planesApp = (lista, sufijo) => `<div class="tc-planes">${lista.map((p) => `<article class="tc-plan${p.top ? ' tc-plan--top' : ''} tc-reveal">${p.top ? '<span class="tc-plan__tag">El más elegido</span>' : ''}<h3>${p.nombre}</h3><p class="tc-plan__para">${p.para}</p><p class="tc-plan__precio"><b>${p.mes} €</b><small>al mes · ${sufijo}</small></p>${list(p.incluye)}</article>`).join('')}</div>`;
const producto = ({ slug, crumb, eb, h1, lead, seo, resumen, capturas = [], pasos, hace, planes, sufijo, puesta, notaPrecio, faqs, ejemplo, schema }) => ({
  title: crumb, seo,
  html: page(`${pagehead(`<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>${crumb}</span>`, eb, h1, lead, btn('/contacto/', 'Pide tu diagnóstico gratis') + (ejemplo ? btn(ejemplo[0], ejemplo[1], true) : btn('/soluciones/#familia', 'Ver la familia IndunexIA', true)), facts('En resumen', resumen))}
${capturas.filter(([k]) => CAPT[k]).length ? sec(shots(capturas.filter(([k]) => CAPT[k]).map(([k, alt, cap]) => [CAPT[k], alt, cap])), 'tc-sec--tight') : ''}
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo se usa', pasos[0], pasos[1])}<ol class="tc-steps" style="list-style:none;padding:0;margin:0">${pasos[2].map(([t, p], n) => `<li class="tc-step tc-reveal"><span class="tc-step__when">Paso ${n + 1}</span><h3>${t}</h3><p>${p}</p></li>`).join('')}</ol></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Qué incluye', hace[0], hace[1])}<div class="tc-grid tc-grid--3">${hace[2].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt" id="precio"><div class="tc-wrap">${head('Precios', 'Planes sin permanencia', `Precios sin IVA. Puesta en marcha desde ${puesta} € (lo dejamos configurado contigo). ${notaPrecio}`)}${planesApp(planes, sufijo)}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Preguntas frecuentes', 'Dudas habituales')}${faq(faqs)}</div></section>
${band('¿Lo vemos con tus documentos?', 'Te decimos por escrito si encaja en tu empresa y cuánto costaría. Gratis.')}
<script type="application/ld+json">${JSON.stringify(schema)}</script>`),
});

P['presupuestos-desde-plano'] = producto({
  slug: 'presupuestos-desde-plano', crumb: 'IndunexIA Presupuestos', eb: 'IndunexIA Presupuestos · de la familia IndunexIA',
  h1: 'Presupuestos desde un plano o una foto, con tus tarifas, en un minuto',
  lead: 'Subes el plano, el croquis o una foto con medidas. La IA mide piezas, kilos, cortes, soldaduras y horas; el programa aplica tus precios y tu cliente acepta con un enlace.',
  seo: ['Presupuestos desde plano con IA para talleres | IndunexIA', 'Software de presupuestos con IA para talleres: lee el plano o la foto, mide kilos, cortes, soldadura y horas y aplica tus tarifas. Desde 39 €/mes.', 'presupuestos desde plano con IA'],
  resumen: [['Desde', '39 €/mes'], ['Puesta en marcha', 'desde 290 €'], ['Lee', 'Planos, croquis, esquemas y fotos'], ['Sectores', 'Mecanizado, calderería, chapa y 7 más']],
  capturas: [['presu-editor', 'Presupuesto generado desde el plano de una mesa de inoxidable (ejemplo ficticio)', 'Del plano al presupuesto: cada línea dice si sale del plano, si está calculada o estimada'], ['presu-pdf', 'PDF del presupuesto con el logo de la empresa (ejemplo ficticio)', 'El PDF que recibe tu cliente, con tu logo']],
  pasos: ['Del plano al presupuesto en cuatro pasos', 'Sin tablas ni fórmulas: el programa hace las cuentas con tus precios.', [
    ['Sube el plano o haz una foto', 'PDF, imagen o una foto del croquis a mano. Varias hojas a la vez.'],
    ['La IA lo lee y lo mide', 'Material y kilos, metros de corte y soldadura, pliegues, superficies, componentes y horas de máquina.'],
    ['Revisas y ajustas', 'Todo es editable: cantidades, precios, margen. Eliges si el cliente lo ve desglosado o en una sola línea.'],
    ['Lo envías y lo aceptan online', 'PDF con tu logo y un enlace para que el cliente acepte con su nombre. Te enteras al momento.']]],
  hace: ['Pensado para la oficina técnica de un taller', 'La IA mide; los precios son siempre los tuyos.', [
    ['calc', 'Tus tarifas por sector', 'Mecanizado, calderería, chapa, carpintería metálica, cuadros eléctricos, neumática, reparación, climatización, madera y reformas.'],
    ['lupa', 'Cada dato dice de dónde sale', '«Del plano», «Calculado» o «Estimado»: revisas en segundos solo lo que hay que revisar.'],
    ['objetivo', 'Solo pregunta lo que falta', 'Si el plano no trae un dato que cambia el precio (espesor, material…), te prepara la pregunta para el cliente.'],
    ['doc', 'PDF con tu marca', 'Con tu logo, tus condiciones y el enlace para aceptarlo online.'],
    ['flujo', 'Conectado a tu ERP', 'API y avisos automáticos para SAP, Sage, a3 o IndunexIA Gestión (plan Profesional).'],
    ['grafica', 'Aprende tus precios', 'El precio que pones a un componente se recuerda para el siguiente presupuesto.']]],
  planes: [
    { nombre: 'Taller', mes: 39, para: 'Para empezar', incluye: ['15 presupuestos al mes', 'Un sector con tus tarifas', 'PDF con tu logo', 'Aceptación online', '1 usuario'] },
    { nombre: 'Profesional', mes: 69, top: true, para: 'Para talleres que presupuestan cada día', incluye: ['60 presupuestos al mes', 'Todos los sectores', 'Catálogo que aprende tus precios', 'API y avisos a tu ERP', '3 usuarios'] },
    { nombre: 'Industria', mes: 129, para: 'Para oficinas técnicas con volumen', incluye: ['200 presupuestos al mes', 'Todo lo del Profesional', 'Integración a medida con tu ERP', 'Usuarios ilimitados', 'Soporte prioritario'] }],
  sufijo: 'sin permanencia', puesta: 290, notaPrecio: 'Si usas IndunexIA Gestión Pro, ya viene incluido.',
  ejemplo: ['https://presupuestos.transformaconia.com/demo', 'Ver un presupuesto de ejemplo'],
  faqs: [
    ['¿Qué planos lee?', 'Planos de pieza y de conjunto en PDF o imagen, croquis a mano, esquemas eléctricos, neumáticos e hidráulicos, planos de planta y fotos con medidas.'],
    ['¿Y si la IA se equivoca?', 'Todo es editable antes de enviarlo y cada línea indica de dónde sale el dato. El precio final lo decides tú.'],
    ['¿Usa mis precios?', 'Sí. Pones tu €/hora de cada máquina, tu €/kg de cada material, tus metros de corte, soldadura o pintura y tu margen. En la puesta en marcha lo dejamos configurado contigo.'],
    ['¿Se conecta con mi programa?', 'Sí, a partir del plan Profesional: API y avisos automáticos cuando un presupuesto se crea o se acepta. Si tu programa no tiene API, valoramos cómo adaptarlo.'],
  ],
  schema: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'IndunexIA Presupuestos', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: 'Presupuestos desde plano o foto con IA para talleres e industria, con las tarifas de cada empresa.', offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: '39', highPrice: '129' }, publisher: { '@type': 'Organization', name: 'Transforma con IA', url: 'https://transformaconia.com' } },
});

const _servicioDocumentalAntiguo = servicio({
  crumb: 'Gestión documental con IA', eb: 'Gestión documental con IA',
  h1: 'Gestión documental con IA: cada papel, en su sitio y sin teclear',
  lead: 'Facturas de proveedor, albaranes, tickets, certificados, pedidos y planos. La IA los lee desde una foto, un PDF o un correo, extrae los datos, los clasifica y los registra en tu programa.',
  seo: ['Gestión documental con IA para empresas | Transforma con IA', 'Lectura automática de facturas, albaranes, tickets y certificados con IA: extrae los datos, los clasifica y los archiva en tu ERP. Desde 450 € + IVA.', 'gestión documental con IA'],
  resumen: [['Precio orientativo', 'desde 450 €'], ['Plazo', '1 a 3 semanas'], ['Documentos', 'Foto, PDF, correo'], ['Destino', 'Tu ERP, Excel o carpeta']],
  que: ['El papeleo que se come las tardes', 'Cada documento que alguien abre, lee y teclea en otro sitio es tiempo que la IA puede devolverte.', [
    ['doc', 'Facturas y albaranes de proveedor', 'Proveedor, fecha, líneas, importes e IVA leídos solos y registrados en tu programa. Lo dudoso, marcado para revisar.'],
    ['telegram', 'Tickets y gastos del equipo', 'Cada trabajador manda la foto por Telegram y el gasto queda registrado con su imputación.'],
    ['carpeta', 'Archivo y asesoría', 'Certificados, contratos y documentos clasificados por cliente u obra, y el paquete trimestral listo para la asesoría.']]],
  extra: `<section class="tc-sec"><div class="tc-wrap">${head('Caso de ejemplo', 'De la foto del ticket al paquete de la asesoría', 'Ficha resumida; la ficha completa está en la página de casos.')}${fichaHTML({ ic: 'carpeta', sector: 'Gestión documental', titulo: 'Facturas, albaranes y tickets sin teclear', problema: 'Los documentos llegan por correo, por foto y en papel, y alguien tiene que abrirlos, leerlos y pasar los datos a otro sitio.', solucion: 'La IA lee cada documento, extrae los datos, lo clasifica y lo deja registrado en tu programa. Lo dudoso queda marcado para que una persona lo revise.', pasos: ['Elegimos el documento que más se repite.', 'Configuramos la lectura con tus ejemplos reales.', 'Conectamos el destino: tu ERP, una hoja de cálculo o una carpeta.', 'Revisamos juntos los casos dudosos y afinamos.'], ejNota: 'Ejemplo ficticio', ejTxt: 'Capturas con una empresa inventada («Empresa X, S.L.») y clientes de demostración.', ej: shots([[IMG.fiscal, 'Paquete trimestral para la asesoría con datos ficticios', 'Documentación preparada para la asesoría'], [IMG.facturas, 'Facturas registradas con clientes de demostración', 'Facturas registradas sin teclear']]), sig: 'Te decimos qué documento compensa automatizar primero.', cta: diag() + btn('/casos/#documentacion', 'Ver la ficha de gestión documental: facturas y paquete para la asesoría', true) })}</div></section>`,
  como: 'Empezamos por el documento que más se repite',
  precio: ['Depende del volumen y del destino', 'Varía según los tipos de documento, cuántos llegan al mes y dónde hay que registrarlos.', 'desde <b>450 €</b> + IVA'],
  faqs: [
    ['¿Lee documentos escaneados o fotos malas?', 'Sí, la IA actual lee fotos y escaneos con bastante soltura. Si un dato no está claro, el documento se marca para que una persona lo revise.'],
    ['¿Dónde quedan guardados los documentos?', 'Donde trabajes: en tu ERP, en una carpeta compartida, en Google Drive o en nuestro programa de gestión. Siempre con servidores en la UE cuando es posible.'],
    ['¿Sirve para la asesoría?', 'Sí. Al final de cada trimestre se prepara el paquete de facturas y gastos ordenado para que tu asesor lo tenga completo y a tiempo.'],
  ],
});

P['gestion-documental-ia'] = producto({
  slug: 'gestion-documental-ia', crumb: 'IndunexIA Documentos', eb: 'IndunexIA Documentos · gestión documental con IA',
  h1: 'Gestión documental con IA: facturas y albaranes ordenados solos en tu carpeta',
  lead: 'Haz una foto o sube el PDF. La IA lee la factura, el ticket o el albarán, comprueba las cuentas y el CIF, avisa de duplicados y lo guarda en la carpeta de tu ordenador con su nombre. Adiós al archivador.',
  seo: ['Gestión documental con IA: facturas y albaranes | IndunexIA', 'Digitaliza facturas, tickets y albaranes con IA: lee los datos, comprueba las cuentas y los guarda ordenados en tu carpeta. Listado para la gestoría. Desde 29 €/mes.', 'gestión documental con IA'],
  resumen: [['Desde', '29 €/mes'], ['Puesta en marcha', 'desde 190 €'], ['Lee', 'Facturas, tickets, abonos, albaranes'], ['Guarda en', 'La carpeta de tu PC']],
  capturas: [['doc-lista', 'Facturas y albaranes leídos y listos para archivar (ejemplo ficticio)', 'Cada documento, leído y con la carpeta donde va'], ['doc-ficha', 'Datos leídos de una factura de ejemplo junto a la imagen', 'Revisas los datos al lado del documento']],
  pasos: ['De la foto a la carpeta en cuatro pasos', 'Sin instalar nada: funciona en el navegador (Chrome o Edge) y en el móvil.', [
    ['Foto o PDF', 'Desde el móvil en la nave o arrastrando los PDF del correo. Uno o muchos a la vez.'],
    ['La IA lo lee', 'Proveedor, CIF, número, fechas, base, IVA, retención, total y pedido.'],
    ['Se comprueba solo', 'Cuentas que no cuadran, CIF no válido, fecha rara o factura duplicada: te lo marca para revisar.'],
    ['Se guarda en tu carpeta', 'Tipo / año / trimestre / proveedor, con un nombre que se entiende. Y el listado para la gestoría en Excel.']]],
  hace: ['Menos papel, menos teclear, nada perdido', 'Lo que hoy es un archivador y una tarde de teclear.', [
    ['carpeta', 'Ordenado como tú quieras', 'Carpetas por tipo, año, trimestre y proveedor, o tu propia estructura (plan Profesional).'],
    ['escudo', 'Comprobaciones automáticas', 'Base + IVA = total, CIF válido, duplicados y fechas: lo raro se marca, lo bueno pasa solo.'],
    ['grafica', 'Listado para la gestoría', 'Libro de facturas recibidas del trimestre en Excel, en un clic.'],
    ['movil', 'Fotos desde el móvil', 'El encargado hace la foto del albarán en la nave y ya está en la bandeja.'],
    ['flujo', 'Conectado a tu ERP', 'API y avisos automáticos para pasar cada factura a SAP, Sage, a3 o IndunexIA Gestión (plan Profesional).'],
    ['euro', 'Tus datos, en tu PC', 'Si quieres, la copia de la nube se borra en cuanto se guarda en tu ordenador.']]],
  planes: [
    { nombre: 'Taller', mes: 29, para: 'Para dejar de guardar papeles', incluye: ['60 documentos al mes', 'Ordenados en tu carpeta', 'Fotos desde el móvil', 'Duplicados y cuentas comprobados', 'Listado para la gestoría'] },
    { nombre: 'Profesional', mes: 49, top: true, para: 'Para la oficina que recibe muchas facturas', incluye: ['300 documentos al mes', 'Tu propia estructura de carpetas', 'API y avisos a tu ERP', '3 usuarios', 'Soporte en 24 h'] },
    { nombre: 'Industria', mes: 99, para: 'Para varias sedes o mucho volumen', incluye: ['1.000 documentos al mes', 'Todo lo del Profesional', 'Integración a medida con tu ERP', 'Usuarios ilimitados', 'Soporte prioritario'] }],
  sufijo: 'sin permanencia', puesta: 190, notaPrecio: 'Si usas IndunexIA Gestión Profesional o Pro, los gastos por foto ya vienen incluidos. ¿Certificados, planos o una integración especial? Lo hacemos a medida.',
  faqs: [
    ['¿Hay que instalar algo?', 'No. Funciona en el navegador: en Chrome o Edge guarda directamente en la carpeta que elijas; en otros navegadores descarga un ZIP ya ordenado.'],
    ['¿Lee fotos malas o escaneos?', 'Sí. Si algo no se lee bien, el documento queda marcado para revisar en vez de guardarse con datos dudosos.'],
    ['¿Sirve para la gestoría?', 'Sí: cada trimestre descargas el libro de facturas recibidas en Excel, con fecha, proveedor, CIF, base, IVA y total.'],
    ['¿Dónde quedan mis documentos?', 'En tu ordenador, en la carpeta que elijas. La copia en la nube está en servidores de la UE y puedes hacer que se borre al archivar.'],
  ],
  schema: { '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'IndunexIA Documentos', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', description: 'Gestión documental con IA: lee facturas, tickets y albaranes, comprueba los datos y los guarda ordenados en la carpeta del ordenador.', offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: '29', highPrice: '99' }, publisher: { '@type': 'Organization', name: 'Transforma con IA', url: 'https://transformaconia.com' } },
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
  extra: `<section class="tc-sec"><div class="tc-wrap">${head('Caso de ejemplo', 'Una mejora sobre SAP, como muestra', 'Es un ejemplo de lo que se puede implementar, no un proyecto concreto.')}${fichaHTML({ ic: 'lupa', ejemplo: true, sector: 'Herramientas a medida y SAP', titulo: 'Un buscador de artículos que entiende a cada persona', problema: 'Cada persona nombra las piezas a su manera y el programa solo encuentra la descripción exacta, así que se pierde tiempo o se pide el artículo equivocado.', solucion: 'Una herramienta a medida que se conecta con SAP o con tu ERP, entiende lo que escribe cada persona y propone el artículo correcto.', pasos: ['Revisamos contigo cómo se busca hoy y qué falla.', 'Conectamos la herramienta a tus datos de artículos.', 'La pruebas con tu equipo en una primera versión.', 'Ampliamos por módulos lo que vayáis necesitando.'], ejNota: 'Ejemplo ficticio', ejTxt: 'Artículos y códigos inventados.', ej: adEj('Hoy', 'Con la herramienta', [['Buscas «junta tórica 30 por 3» y no aparece: está dada de alta con otra descripción.', 'La herramienta propone «JUNTA TÓRICA NBR 30X3» (código ficticio 200318) y dos medidas cercanas.']]), sig: 'Cuéntanos qué mejorarías en tu programa y lo valoramos.', cta: diag() + btn('/casos/#sap', 'Ver el ejemplo de búsqueda con IA sobre SAP', true) })}</div></section>`,
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
  html: page(`${pagehead('<span>Casos</span>', 'Casos', 'Casos de IA para la industria', 'Cada ficha cuenta el problema, la solución, cómo funciona, un ejemplo con datos ficticios y el siguiente paso. Sin nombres de clientes por confidencialidad. Si tienes un problema parecido, te contamos por escrito cómo lo resolveríamos en tu empresa.', btn('/contacto/', 'Tengo un problema parecido') + btn('/otros-sectores/', 'Casos de otros sectores', true), facts('Índice', CASOS_IND.map((c) => [c.sector, `<a href="#${c.id}">${c.titulo}</a>`])))}
<section class="tc-sec--gal" style="padding-bottom:16px">${galeriaInd}</section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${head('Fichas', 'Lo que hemos construido para la industria', 'Los datos de los ejemplos son inventados: empresas, clientes e importes ficticios.')}<div class="tc-casos">${CASOS_IND.filter((c) => !c.ejemplo).map(fichaHTML).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Ejemplo', 'Lo que se puede implementar', 'No es un proyecto concreto: es una muestra de lo que se puede hacer sobre un ERP que ya usas.')}<div class="tc-casos">${CASOS_IND.filter((c) => c.ejemplo).map(fichaHTML).join('')}</div></div></section>
${band('¿Tienes un problema parecido?', 'Cuéntanoslo y te decimos cómo lo resolveríamos y cuánto costaría. Gratis y sin compromiso.', btn('/contacto/', 'Pide tu diagnóstico gratis'))}`),
};

P['quienes-somos'] = {
  id: 7105, title: 'Quiénes somos',
  seo: ['Quiénes somos | Consultoría de IA industrial', 'Somos un grupo de expertos en IA de Murcia con más de 2 años de experiencia automatizando procesos en empresas industriales.', 'quiénes somos transforma con ia'],
  html: page(`${pagehead('<span>Quiénes somos</span>', 'Quiénes somos', 'Transforma con IA: consultoría de IA para la industria', 'Somos un grupo de expertos en IA de Murcia con más de 2 años de experiencia. Venimos de la industria y construimos nosotros mismos lo que implantamos.', btn('/contacto/', 'Pide tu diagnóstico gratis'), facts('En pocas palabras', [['Quiénes', 'Expertos en IA: consultores y desarrolladores'], ['Experiencia', 'Más de 2 años automatizando procesos'], ['Especialidad', 'Industria'], ['Dónde', 'Región de Murcia en persona y toda España en remoto']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-grid tc-grid--3">${[['equipo', 'Hablas con quien lo construye', 'Sin intermediarios entre el diagnóstico y el código.'], ['objetivo', 'Pruebas con tus datos', 'Un piloto real antes de pagar el total.'], ['reloj', 'Sin permanencia', 'Si deja de servirte, lo dejas. Con 30 días de aviso.']].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Quiénes construyen')}<h2>Un grupo de expertos en IA de Murcia</h2><p>Transforma con IA es una consultoría de inteligencia artificial y automatización de procesos para empresas industriales. Analizamos cómo trabaja la empresa, detectamos las tareas que más horas repiten y desarrollamos la solución: no hay intermediarios entre quien te escucha en el diagnóstico y quien escribe el código.</p><p>Venimos de la industria: conocemos el día a día de un taller, de una distribuidora o de un servicio técnico, con sus referencias, albaranes, plazos y urgencias, y de ahí sale el criterio para decidir qué compensa automatizar y qué no.</p><p>Enseñamos lo que hacemos en vídeos cortos, con datos de ejemplo, en nuestro <a class="tc-link" href="https://www.instagram.com/transformaconia.oficial/" target="_blank" rel="noopener">Instagram @transformaconia.oficial</a>.</p></div>
<div class="tc-box tc-reveal"><h3>Qué construimos</h3>${list(['Integraciones con el ERP (SAP u otros) y con el correo: pedidos, albaranes y facturas que entran sin teclear', 'Lectura automática de documentos: PDF, fotos y correos convertidos en datos validados', 'Agentes que consultan catálogos, fichas técnicas y bases de datos y responden con la referencia correcta', 'Automatizaciones con revisión humana en lo dudoso y confirmación en lo importante', 'Aplicaciones web a medida, usables desde el móvil, con usuarios y permisos'])}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', 'De un diagnóstico a una solución en producción')}
<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">1 · Diagnóstico</span><h3>Entender el proceso</h3><p>Gratis. Nos cuentas cómo circula hoy el trabajo, qué sistemas intervienen (ERP, correo, Excel) y dónde se pierde el tiempo, y te enviamos por escrito qué automatizar, cómo y cuánto costaría.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">2 · Piloto</span><h3>Con datos reales</h3><p>Una primera versión con tus documentos, tu catálogo o tus tarifas. Se mide con casos reales antes de comprometer el presupuesto completo.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">3 · Implantación</span><h3>En producción</h3><p>Se conecta con tu ERP o tus hojas de cálculo, se forma al equipo y se definen los puntos donde una persona revisa o confirma.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">4 · Mantenimiento</span><h3>Seguimiento y mejora</h3><p>Soporte, ajustes con el uso y cambios cuando cambian los documentos, los formatos o el ERP.</p></div></div></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Criterios técnicos', 'Cómo se construye')}
<div class="tc-grid tc-grid--3">
 <div class="tc-box tc-reveal">${icon('flujo')}<h3>Integración antes que sustitución</h3><p>Si tu ERP tiene API, la conexión es directa; si no la tiene, se valora cómo adaptarlo. No hace falta cambiar de programa para empezar.</p></div>
 <div class="tc-box tc-reveal">${icon('escudo')}<h3>Revisión humana</h3><p>La IA lee, clasifica y propone. Lo dudoso se marca para revisar y las acciones importantes piden confirmación a una persona.</p></div>
 <div class="tc-box tc-reveal">${icon('app')}<h3>Datos bajo control</h3><p>Accesos mínimos, servidores en la Unión Europea siempre que es posible y nada de lo que se monta se usa para entrenar modelos de terceros.</p></div>
</div></div></section>
${band('¿Tienes una tarea que te gustaría quitarte de encima?', 'Cuéntanos tu caso y te enviamos el diagnóstico por escrito, gratis.', btn('/contacto/', 'Pide tu diagnóstico gratis'))}`),
};

P['contacto'] = {
  id: 12, title: 'Contacto',
  seo: ['Contacto y diagnóstico gratis | Transforma con IA', 'Cuéntanos qué proceso queréis automatizar y te enviamos por escrito un diagnóstico gratuito en 48 horas laborables. info@transformaconia.com', 'consultoría automatización industrial contacto'],
  // 29-10-2026: el formulario va lo primero (antes quedaba a un tercio de página en el móvil); la explicación, condensada al lado.
  html: page(`<header class="tc-hero tc-pagehead tc-pagehead--corta">${DECO('b')}<div class="tc-wrap"><div class="tc-hero__copy">
<nav class="tc-crumbs" aria-label="Migas"><a href="/">Inicio</a><span aria-hidden="true">/</span><span>Contacto</span></nav>
${eyebrow('Diagnóstico gratis')}<h1>Pide tu diagnóstico gratis</h1><p class="tc-lead">Cuéntanos qué tarea os quita más horas y te enviamos por escrito, en 48 horas laborables, qué automatizaríamos, cómo y cuánto costaría. Sin compromiso.</p></div></div></header>
<section class="tc-sec tc-sec--tight" id="contacto"><div class="tc-wrap"><div class="tc-split tc-split--form">
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)">${FORM_CONTACTO}</div>
 <div class="tc-prose tc-reveal" style="gap:24px">
  <div style="display:grid;gap:12px"><h2 style="font-size:22px">Así trabajamos</h2>${list(['<b>Nos cuentas</b> las 2 o 3 tareas que más horas os quitan y qué programas usáis', '<b>Recibes por escrito</b>, en 48 horas laborables, qué automatizar primero, cómo y un precio orientativo', '<b>Lo lees con calma</b>, lo compartes con tu socio o tu gestoría y decides sin prisas', 'Si quieres seguir, <b>montamos un piloto con tus datos</b> antes de pagar el proyecto completo'])}</div>
  <div style="display:grid;gap:10px">${eyebrow('Correo directo')}<a class="tc-mail" href="mailto:info@transformaconia.com">info@transformaconia.com</a><p>Si lo prefieres, escríbenos directamente. Llega al mismo sitio.</p></div>
  <div style="display:grid;gap:10px">${eyebrow('Instagram')}<a class="tc-mail" href="https://www.instagram.com/transformaconia.oficial/" target="_blank" rel="noopener">@transformaconia.oficial</a><p>Vídeos cortos con los programas funcionando. También puedes escribirnos por mensaje directo.</p></div>
  <div style="display:grid;gap:10px"><h3>Dónde</h3><p>Estamos en Murcia y trabajamos en remoto con empresas de toda España. En la Región de Murcia vamos a tu empresa, taller o nave.</p></div>
 </div></div></div></section>`),
};

P['consultor-ia-murcia'] = {
  title: 'Consultoría de IA en Murcia',
  seo: ['Consultoría de IA en Murcia | Transforma con IA', 'Consultoría de inteligencia artificial y automatización para empresas industriales de la Región de Murcia, con diagnóstico gratis y puesta en marcha en tu empresa.', 'consultoría inteligencia artificial Murcia'],
  html: page(`${pagehead('<span>Consultoría de IA en Murcia</span>', 'Región de Murcia', 'Consultoría de IA y automatización para la industria murciana', 'Automatizaciones, ERP para la industria, asistentes técnicos y herramientas a medida para empresas de Murcia, Cartagena, Lorca, Molina de Segura, Alcantarilla y el resto de la región. Vamos a tu empresa. <a class="tc-link" href="#donde-trabajamos">Dónde trabajamos</a>.', btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('Visitas presenciales', [['Murcia y pedanías', 'Sí'], ['Cartagena', 'Sí'], ['Lorca', 'Sí'], ['Molina de Segura', 'Sí'], ['Resto de la región', 'Sí']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Cerca de ti')}<h2>Un equipo de la tierra que conoce sus polígonos</h2><p>El tejido empresarial murciano tiene mucho de metal, mecanizado, distribución industrial, agroindustria y servicios técnicos. Conocemos bien ese mundo porque venimos de él, y sabemos que cada taller trabaja a su manera.</p><p>Por eso el diagnóstico parte de lo que nos cuentas de tu día a día y te lo enviamos por escrito. En la Región de Murcia la puesta en marcha la hacemos en tu empresa, y el resto en remoto para que sea más ágil y económico.</p></div><div class="tc-box tc-reveal"><h3>Qué podemos hacer juntos</h3>${list(['Implantar el ERP para la industria en tu taller o empresa', 'Automatizar pedidos, albaranes y facturas', 'Asistente técnico para tu catálogo o tu mostrador', 'Gestión documental: facturas y tickets que se registran solos', 'Mejoras y herramientas a medida sobre SAP o tu ERP', 'Formación práctica en IA para tu equipo'])}</div></div></section>
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
    ['¿Trabajáis con empresas de fuera de la región?', 'Sí, con empresas de toda España en remoto: diagnóstico por escrito y puesta en marcha a distancia.'],
    ['¿Cuánto cuesta empezar?', 'El diagnóstico es gratis. Como referencia orientativa, una automatización parte de 450 € + IVA, el ERP para la industria desde 590 € de puesta en marcha (mantenimiento desde 59 €/mes de 69 €/mes) y un asistente técnico de 900 €.'],
  ])}</div></section>
${band('¿Eres de la Región de Murcia?', 'Escríbenos y pasamos por tu empresa a ver qué se puede automatizar.')}`),
};

P['privacidad'] = {
  id: 3, title: 'Política de privacidad',
  seo: ['Política de privacidad | Transforma con IA', 'Qué datos recogemos en transformaconia.com, para qué los usamos, cuánto tiempo los guardamos, quién los trata y cómo ejercer tus derechos.', ''],
  html: page(`${pagehead('<span>Privacidad</span>', 'Legal', 'Política de privacidad', 'Qué datos recogemos, para qué y cómo puedes ejercer tus derechos. Sin letra pequeña.')}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-prose" style="max-width:820px;gap:22px">
<div class="tc-prose"><h3>Responsable</h3><p>Transforma con IA (transformaconia.com). Contacto para cualquier asunto de privacidad: <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a>.</p></div>
<div class="tc-prose"><h3>Qué datos recogemos y para qué</h3><p><b>Formulario de contacto:</b> nombre, empresa, sector, correo y el mensaje que escribes. Los usamos solo para responderte y, si lo pides, preparar un presupuesto. Junto con tu mensaje guardamos la página por la que entraste y la web desde la que llegaste, para saber qué contenidos funcionan. Te enviamos un correo automático de confirmación y, después, la respuesta a tu consulta. Base legal: tu consentimiento y la aplicación de medidas precontractuales a petición tuya.</p><p><b>Protección contra abusos:</b> para evitar spam y envíos masivos, al enviar el formulario calculamos de tu dirección IP una huella cifrada con una clave aleatoria que cambia cada día y que borramos después. No guardamos tu IP y la huella se elimina a las 48 horas. Pasado ese tiempo no se puede volver a la IP original.</p></div>
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
