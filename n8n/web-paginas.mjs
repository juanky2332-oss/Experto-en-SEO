// Páginas de negocio de transformaconia.com (diseño del snippet «Transforma · diseño de la web»).
// Uso: node n8n/web-paginas.mjs [slug ...]   (sin argumentos publica todas; guarda copia antes de sobrescribir)
// Voz: equipo («nosotros»), sin nombres propios. Precios siempre orientativos. Nunca contar artículos publicados.
// Nada inventado: ni clientes, ni testimonios, ni cifras de ahorro sin medir.
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
};
const icon = (n) => `<span class="tc-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg></span>`;
const btn = (href, txt, ghost = false) => `<a class="tc-btn${ghost ? ' tc-btn--ghost' : ''}" href="${href}">${txt} ${ARROW}</a>`;
const eyebrow = (t) => `<span class="tc-eyebrow">${t}</span>`;
const head = (eb, h2, p = '', extra = '') => `<div class="tc-head tc-reveal"><div>${eyebrow(eb)}<h2>${h2}</h2>${p ? `<p>${p}</p>` : ''}</div>${extra}</div>`;
const sec = (inner, cls = '', id = '') => `<section class="tc-sec ${cls}"${id ? ` id="${id}"` : ''}><div class="tc-wrap">${inner}</div></section>`;
const list = (items) => `<ul class="tc-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const page = (body) => `<!--tc--><div class="tc">${body}</div>`;
const facts = (titulo, filas) => `<aside class="tc-hero__panel"><div class="tc-hero__panel-h"><span>${titulo}</span></div><dl class="tc-facts">${filas.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></aside>`;
const pagehead = (crumbs, eb, h1, lead, btns = '', aside = '') => `<header class="tc-hero tc-pagehead"><div class="tc-wrap${aside ? ' tc-hero__grid' : ''}"><div class="tc-hero__copy">
<nav class="tc-crumbs" aria-label="Migas"><a href="/">Inicio</a><span aria-hidden="true">/</span>${crumbs}</nav>
${eyebrow(eb)}<h1>${h1}</h1><p class="tc-lead">${lead}</p>${btns ? `<div class="tc-btns">${btns}</div>` : ''}</div>${aside}</div></header>`;
const faq = (items) => `<div class="tc-faq tc-reveal">${items.map(([q, a]) => `<details><summary>${H(q)}</summary><p>${H(a)}</p></details>`).join('')}</div>
<script type="application/json" class="tc-faq-data">${JSON.stringify(items).replace(/</g, '\\u003c')}</script>`;
const band = (h, p, b = btn('/contacto/', 'Pide tu diagnóstico gratis')) => sec(`<div class="tc-band tc-reveal"><div><h2>${h}</h2><p>${p}</p></div><div class="tc-btns">${b}</div></div>`, 'tc-sec--tight');
const shot = (src, alt, cap = '') => `<figure class="tc-shot"><div class="tc-shot__bar" aria-hidden="true"><i></i><i></i><i></i></div><img src="${src}" width="1440" height="900" alt="${alt}" loading="lazy" decoding="async">${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
const shots = (lista) => lista.length === 1 ? shot(...lista[0]) : `<div class="tc-shots" style="--n:${lista.length}">${lista.map((x) => shot(...x)).join('')}</div>`;
const GALERIA = [
  [IMG.facturas, 'Programa de gestión con IA: facturas', 'Programa de gestión con IA', '/casos/#gestion'],
  [IMG.fundalex, 'Buscador de jurisprudencia con IA', 'Buscador jurídico con IA', '/casos/#despachos'],
  [IMG.veterinaria, 'Software de gestión para clínicas veterinarias', 'Software para clínicas', '/casos/#clinicas'],
  [IMG.refuerzo, 'Aplicación de refuerzo escolar con IA', 'Refuerzo escolar con IA', '/casos/#educacion'],
  [IMG.fiscal, 'Paquete trimestral para la asesoría', 'Fiscal y asesoría automática', '/casos/#gestion'],
  [IMG.medio, 'Medio de noticias de IA publicado con agentes', 'Medio publicado con agentes', '/casos/#medio'],
  [IMG.cobros, 'Cobros y vencimientos', 'Control de cobros', '/casos/#gestion'],
];
const galeria = `<div class="tc-gal" aria-label="Capturas de herramientas que hemos construido"><div class="tc-gal__row">${[...GALERIA, ...GALERIA].map(([src, alt, t, u], i) => `<a class="tc-gal__item" href="${u}"${i >= GALERIA.length ? ' aria-hidden="true" tabindex="-1"' : ''}><img src="${src}" alt="${i >= GALERIA.length ? '' : alt}" width="1440" height="900" loading="lazy" decoding="async"><span>${t}</span></a>`).join('')}</div></div>`;
const flow = (pasos) => `<ol class="tc-flow">${pasos.map((p) => `<li>${p}</li>`).join('')}</ol>`;

const FUENTES = ['OpenAI', 'Google', 'Google DeepMind', 'Anthropic', 'Hugging Face', 'n8n', 'GitHub Copilot', 'Cursor', 'MIT Technology Review', 'TechCrunch', 'The Verge', 'Wired', 'Ars Technica', 'Xataka', 'Genbeta', 'The Decoder', 'MarkTechPost', 'Latent Space', 'Simon Willison'];
const marquee = `<div class="tc-marquee" aria-label="Fuentes que seguimos cada mañana"><span class="tc-marquee__label">Leemos cada mañana</span><div class="tc-marquee__track"><div class="tc-marquee__row">${[...FUENTES, ...FUENTES].map((f) => `<span>${f}</span>`).join('')}</div></div></div>`;

// Demo animada de un asistente (ejemplo ilustrativo, rotulado como tal)
const CHAT = [
  ['c', 'Buenas, ¿cuánto me costaría revisar el aire acondicionado de la oficina? Son 3 splits.'],
  ['b', 'Hola. La revisión de 3 splits sale por 135 € + IVA e incluye limpieza de filtros y comprobación de gas. Tengo hueco el jueves a las 10:00 o el viernes a las 16:00. ¿Cuál te va mejor?'],
  ['c', 'El jueves.'],
  ['b', 'Reservado el jueves a las 10:00 ✓ Te envío el presupuesto por correo y un recordatorio el día antes.'],
];
const chatDemo = `<figure class="tc-chat tc-reveal" aria-label="Ejemplo de conversación con un asistente de IA">
<div class="tc-chat__top"><span class="tc-chat__av">IA</span><div><b>Asistente de Climatización Ejemplo</b><small><i></i>en línea · responde al instante</small></div></div>
<div class="tc-chat__body">${CHAT.map(([q, t], i) => `<p class="tc-chat__m tc-chat__m--${q}" style="--d:${0.6 + i * 1.6}s">${t}</p>`).join('')}<p class="tc-chat__typing" style="--d:${0.6 + CHAT.length * 1.6}s" aria-hidden="true"><span></span><span></span><span></span></p></div>
<figcaption>Ejemplo ilustrativo de un asistente de IA para una empresa de climatización: presupuesta, agenda y avisa sin que nadie toque el teléfono.</figcaption></figure>`;

const SECTORES = [
  ['rayo', 'Material eléctrico e instaladoras', ['Presupuestos a partir de mediciones y listas de material', 'Lectura automática de albaranes y facturas de proveedor', 'Partes de trabajo dictados por voz desde la obra']],
  ['aire', 'Neumática', ['Buscador de equivalencias de referencias entre fabricantes', 'Respuesta automática a pedidos y consultas por correo', 'Configurador de cilindros, válvulas y racorería']],
  ['gota', 'Hidráulica y oleohidráulica', ['Identificación de latiguillos y racores a partir de una foto', 'Historial de reparaciones por máquina y cliente', 'Ofertas preparadas desde la petición del cliente']],
  ['tuerca', 'Mecanizado y calderería', ['Presupuesto con tiempos de máquina a partir del plano', 'Albaranes y partes firmados en el móvil', 'Seguimiento de órdenes de trabajo y entregas']],
  ['caja', 'Suministro industrial', ['Asistente técnico que responde con la ficha del producto', 'Equivalencias entre marcas en segundos', 'Catálogo con búsqueda que entiende referencias mal escritas']],
  ['llave', 'Mantenimiento industrial', ['Órdenes de trabajo por Telegram o WhatsApp', 'Asistente que consulta los manuales de tus máquinas', 'Informes de intervención generados solos']],
  ['chip', 'Automatización industrial e integradores', ['Documentación de proyecto generada a partir del programa', 'Ofertas técnicas con el histórico de proyectos', 'Asistente de soporte para técnicos en campo']],
  ['copo', 'Climatización y frío industrial', ['Avisos de avería clasificados por urgencia', 'Planificación de rutas de mantenimiento preventivo', 'Certificados y revisiones periódicas automáticas']],
];
const OTROS_SECTORES = [['cal', 'Clínicas y centros con cita'], ['balanza', 'Despachos y asesorías'], ['caja', 'Distribución y ecommerce'], ['libro', 'Educación y formación']];

const SERVICIOS = [
  ['flujo', 'Automatización de procesos', 'Pedidos, facturas, correos e informes que hoy se pasan a mano entre programas empiezan a moverse solos.', '/automatizacion-procesos-ia/', 'desde <b>450 €</b>'],
  ['chat', 'Agentes y chatbots de IA', 'Asistentes que atienden a clientes o a tu equipo con la información real de tu empresa: web, WhatsApp o Telegram.', '/agentes-chatbots-ia/', 'desde <b>900 €</b>'],
  ['app', 'Herramientas a medida', 'Aplicaciones con IA para lo que ningún programa estándar resuelve: leer documentos, buscar en tu catálogo, conectar con SAP o Excel.', '/desarrollo-a-medida-ia/', 'desde <b>2.500 €</b>'],
  ['erp', 'Programa de gestión con IA', 'Presupuestos, albaranes, facturas, cobros y gastos en un solo sitio. Los tickets se registran con una foto.', '/gestion/', 'desde <b>690 €</b>'],
  ['noticia', 'Noticias y páginas automáticas', 'Un blog que se publica solo, fichas y páginas generadas con IA y revisadas antes de salir. Como este medio.', '/contenido-automatico-ia/', 'desde <b>600 €</b>'],
  ['objetivo', 'Diagnóstico y plan de IA', 'Analizamos cómo trabajáis y te decimos qué automatizar primero, cómo y cuánto costaría. Por escrito y sin compromiso.', '/contacto/', '<b>Gratis</b>'],
];
const servCards = (cols = 3) => `<div class="tc-grid tc-grid--${cols}">${SERVICIOS.map(([i, t, p, u, pr]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p><p class="tc-price">${/Gratis/.test(pr) ? '' : '<span>Orientativo</span> '}${pr}</p><a class="tc-link" href="${u}">Ver más</a></article>`).join('')}</div>`;

const SOLUCIONES_CONCRETAS = [
  ['Lectura automática de facturas', '/automatizacion-procesos-ia/'], ['Presupuestos automáticos', '/desarrollo-a-medida-ia/'], ['Chatbot de WhatsApp', '/agentes-chatbots-ia/'],
  ['Asistente técnico de catálogo', '/agentes-chatbots-ia/'], ['Pedidos del correo al ERP', '/automatizacion-procesos-ia/'], ['Gastos por foto en Telegram', '/gestion/'],
  ['Reservas y recordatorios', '/agentes-chatbots-ia/'], ['Informes que llegan solos', '/automatizacion-procesos-ia/'], ['Prospección comercial con IA', '/automatizacion-procesos-ia/'],
  ['Blog automático para tu web', '/contenido-automatico-ia/'], ['Conexión con SAP y Excel', '/desarrollo-a-medida-ia/'], ['Formación en IA para equipos', '/contacto/'],
];
const chips = `<div class="tc-chips tc-reveal">${SOLUCIONES_CONCRETAS.map(([t, u]) => `<a href="${u}">${t}</a>`).join('')}</div>`;

const PASOS = `<div class="tc-steps">
<div class="tc-step tc-reveal"><span class="tc-step__when">30 minutos · gratis</span><h3>Diagnóstico</h3><p>Nos cuentas qué tarea os quita más tiempo. Te decimos si merece la pena automatizarla, cómo lo haríamos y cuánto costaría. Sin compromiso.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">1 a 3 semanas</span><h3>Prototipo funcionando</h3><p>Montamos una primera versión con tus datos reales. La pruebas en tu día a día y ajustamos lo necesario antes de cerrar nada.</p></div>
<div class="tc-step tc-reveal"><span class="tc-step__when">Desde el primer mes</span><h3>Puesta en marcha y soporte</h3><p>Lo dejamos instalado, documentado y vigilado. Si algo falla nos enteramos antes que tú, y lo vamos mejorando con el uso.</p></div></div>`;

const ANTES_DESPUES = [
  ['Pasar a mano al programa los pedidos que llegan por correo', 'El pedido entra solo y alguien revisa únicamente los dudosos'],
  ['Buscar una referencia en tres catálogos para contestar a un cliente', 'El asistente responde con la ficha y la equivalencia en segundos'],
  ['Guardar tickets en un cajón hasta final de trimestre', 'Foto al ticket por Telegram y el gasto queda registrado'],
  ['Preparar el mismo informe cada lunes a primera hora', 'El informe llega solo al correo a la hora que digas'],
];
const antesDespues = `<div class="tc-ad tc-reveal"><div class="tc-ad__h"><span>Hoy</span><span>Con IA</span></div>${ANTES_DESPUES.map(([a, d]) => `<div class="tc-ad__row"><p class="tc-ad__antes">${a}</p><span class="tc-ad__arrow" aria-hidden="true">${ARROW}</span><p class="tc-ad__despues">${d}</p></div>`).join('')}</div>`;

const FORM_CONTACTO = `<form class="tc-form" data-tc-form="contacto" data-ok="¡Recibido! Te respondemos en menos de 24 horas laborables en tu correo." novalidate>
<div class="tc-form__row"><div class="tc-field"><label for="tc-nombre">Nombre</label><input id="tc-nombre" name="nombre" required autocomplete="name"></div>
<div class="tc-field"><label for="tc-empresa">Empresa</label><input id="tc-empresa" name="empresa" autocomplete="organization"></div></div>
<div class="tc-form__row"><div class="tc-field"><label for="tc-email">Correo</label><input id="tc-email" name="email" type="email" required autocomplete="email"></div>
<div class="tc-field"><label for="tc-sector">Sector</label><select id="tc-sector" name="sector"><option value="">Elige uno</option>${SECTORES.map((s) => `<option>${s[1]}</option>`).join('')}${OTROS_SECTORES.map((s) => `<option>${s[1]}</option>`).join('')}<option>Otro</option></select></div></div>
<div class="tc-field"><label for="tc-mensaje">¿Qué tarea os quita más tiempo?</label><textarea id="tc-mensaje" name="mensaje" required placeholder="Ej.: cada día pasamos a mano los pedidos que llegan por correo al programa de gestión…"></textarea></div>
<label class="tc-hp" aria-hidden="true">Web <input name="web" tabindex="-1" autocomplete="off"></label>
<label class="tc-check"><input type="checkbox" required id="tc-acepto"> <span>He leído la <a href="/privacidad/">política de privacidad</a> y acepto que uséis mis datos para responderme.</span></label>
<div><button class="tc-btn" type="submit">Enviar y pedir diagnóstico ${ARROW}</button></div>
<p class="tc-msg" role="status" aria-live="polite"></p></form>`;

const FORM_BOLETIN = (id = 'tc-bol') => `<form class="tc-form" data-tc-form="boletin" data-ok="Casi está: te hemos enviado un correo para confirmar la suscripción." novalidate>
<div class="tc-inline"><label class="tc-hp" aria-hidden="true">Web <input name="web" tabindex="-1" autocomplete="off"></label>
<input id="${id}" name="email" type="email" required placeholder="tu@empresa.com" aria-label="Tu correo" autocomplete="email">
<button class="tc-btn" type="submit">Suscribirme gratis ${ARROW}</button></div>
<label class="tc-check"><input type="checkbox" required id="${id}-ok"> <span>Acepto la <a href="/privacidad/">política de privacidad</a>. Un correo a la semana, baja en un clic.</span></label>
<p class="tc-msg" role="status" aria-live="polite"></p></form>`;

// ======================= PÁGINAS =======================
const P = {};

P['transforma-con-ia'] = {
  id: 5851, title: 'Transforma con IA',
  seo: ['Noticias de IA y automatización para empresas | Transforma con IA', 'La IA que necesitas entender y la automatización que tu empresa necesita: noticias de inteligencia artificial cada mañana y una agencia de IA en Murcia que las aplica.', 'noticias de inteligencia artificial'],
  html: page(`
<header class="tc-hero tc-hero--home"><div class="tc-wrap tc-hero__grid">
 <div class="tc-hero__copy">
  <span class="tc-live"><i></i>Actualizado hoy · [tc_fecha]</span>
  <h1 class="tc-h1-home"><span>La IA que necesitas entender.</span> <span class="tc-grad tc-shine">La automatización que tu empresa necesita.</span></h1>
  <p class="tc-lead"><b class="tc-lead__k">Haz que la IA trabaje para tu empresa.</b> Diseñamos e implementamos soluciones de IA y automatización que ahorran tiempo y mejoran tus procesos. Y cada día te contamos las novedades, herramientas y aplicaciones de la IA para que sepas qué está pasando y qué puedes aprovechar.</p>
  <div class="tc-perfiles">
   <div class="tc-perfil"><b>¿Empiezas con la IA?</b><span>Te la contamos claro y sin tecnicismos.</span></div>
   <div class="tc-perfil"><b>¿Ya la usas a diario?</b><span>Lanzamientos, agentes y trucos avanzados.</span></div>
  </div>
  <div class="tc-btns">${btn('#ultimas', 'Leer las noticias de hoy')}${btn('#contacto', 'Quiero automatizar mi empresa', true)}</div>
 </div>
 <aside class="tc-hero__panel" aria-label="Últimas noticias"><div class="tc-hero__panel-h"><span><i class="tc-dot"></i>Última hora</span><a class="tc-link" href="/blog/">Ver todo</a></div>[tc_ticker n=5]</aside>
</div>
<div class="tc-wrap">${marquee}</div></header>

<section class="tc-sec tc-sec--tight" id="ultimas"><div class="tc-wrap">${head('Destacado', 'Últimas noticias de inteligencia artificial', '', '<a class="tc-link" href="/blog/">Todas las noticias</a>')}[tc_destacadas]</div></section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${head('Así funciona', 'De la noticia a tu empresa, en tres pasos')}
<div class="tc-ruta">
 <div class="tc-ruta__paso tc-reveal"><span class="tc-ruta__n">01</span>${icon('noticia')}<h3>Te enteras</h3><p>Cada mañana, lo que ha pasado en la IA y merece tu tiempo. Nada de ruido ni de titulares vacíos.</p></div>
 <div class="tc-ruta__paso tc-reveal"><span class="tc-ruta__n">02</span>${icon('lupa')}<h3>Lo entiendes</h3><p>Qué es, qué cambia, cuánto cuesta y para quién sirve. Con ejemplos reales y fuentes enlazadas.</p></div>
 <div class="tc-ruta__paso tc-reveal"><span class="tc-ruta__n">03</span>${icon('rayo')}<h3>Lo aplicas</h3><p>Si encaja en tu empresa, lo montamos: automatizaciones, asistentes y herramientas que trabajan por ti.</p></div>
</div></div></section>
${band('¿Tu equipo pierde horas en tareas repetitivas?', 'Pasar pedidos a mano, buscar referencias, preparar presupuestos, contestar siempre lo mismo. En 30 minutos te decimos qué se puede automatizar y cuánto costaría.', btn('#contacto', 'Analizamos tu caso gratis'))}
<section class="tc-sec"><div class="tc-wrap tc-cats">
 <div>${head('Trucos y consejos', 'Saca más partido a la IA desde hoy', '', '<a class="tc-link" href="/category/trucos-y-consejos-ia/">Más trucos</a>')}[tc_categoria slug="trucos-y-consejos-ia" n=4]</div>
 <div>${head('Guías prácticas', 'Aprende a usar la IA en el trabajo', '', '<a class="tc-link" href="/category/guias-ia/">Más guías</a>')}[tc_categoria slug="guias-ia" n=4 excluir_recientes=1]</div>
 <div>${head('IA en la empresa', 'Estrategia, empleo y casos reales', '', '<a class="tc-link" href="/category/sobre-la-ia/">Más artículos</a>')}[tc_categoria slug="sobre-la-ia" n=4 excluir_recientes=1]</div>
</div></section>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap tc-split tc-split--center">
 <div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Agencia de IA y automatización')}<h2>Cada día tu empresa pierde horas en tareas que una IA ya puede hacer</h2><p>Contestar las mismas preguntas, pasar datos de un programa a otro, buscar una referencia, perseguir un ticket. Nuestro trabajo es encontrar esas tareas y quitártelas de encima con inteligencia artificial: asistentes que atienden, automatizaciones que mueven la información y herramientas hechas a tu medida.</p><p>Lo de la derecha no es un vídeo: es el tipo de conversación que un asistente nuestro tiene con tus clientes mientras tu equipo sigue trabajando.</p><div class="tc-btns">${btn('/agentes-chatbots-ia/', 'Ver agentes y chatbots')}</div></div>
 ${chatDemo}
</div></section>

<section class="tc-sec"><div class="tc-wrap">${head('Servicios', 'Servicios de automatización con IA para empresas', 'Desde una automatización pequeña hasta un programa completo. Todo empieza con un diagnóstico gratis y precios orientativos claros.', '<a class="tc-link" href="/soluciones/">Cómo trabajamos y precios</a>')}${servCards()}
<div class="tc-subhead tc-reveal"><span class="tc-eyebrow">Soluciones concretas</span><p>Algunas de las cosas que montamos con más frecuencia:</p></div>${chips}
</div></section>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal">${eyebrow('Antes y después')}<h2>Lo que hoy se hace a mano, mañana se hace solo</h2><p>Cada noticia que publicamos es algo que ya sabemos montar. Estos son cambios habituales en las empresas con las que trabajamos.</p></div>${antesDespues}</div></section>

<section class="tc-sec"><div class="tc-wrap">${head('Ventajas', 'Lo que gana tu empresa con la IA')}
<div class="tc-grid tc-grid--4">
 <div class="tc-box tc-reveal">${icon('reloj')}<h3>Recuperas horas</h3><p>Las tareas repetitivas pasan a hacerse solas y tu equipo se dedica a lo que de verdad aporta.</p></div>
 <div class="tc-box tc-reveal">${icon('escudo')}<h3>Menos errores</h3><p>Nada de teclear dos veces: los datos se leen y se pasan solos, y lo dudoso se marca para revisar.</p></div>
 <div class="tc-box tc-reveal">${icon('chat')}<h3>Atención a cualquier hora</h3><p>Tus clientes reciben respuesta al instante, también por la noche y en fin de semana.</p></div>
 <div class="tc-box tc-reveal">${icon('grafica')}<h3>Decisiones con datos</h3><p>Informes y avisos que llegan solos para saber cómo va el negocio sin preparar nada.</p></div>
</div>
<div class="tc-stats tc-reveal" style="margin-top:28px"><div><b>+15</b><span>herramientas con IA construidas y en uso</span></div><div><b>21</b><span>fuentes de IA revisadas cada mañana</span></div><div><b>&lt; 24 h</b><span>para responder a tu consulta</span></div><div><b>0 €</b><span>el diagnóstico inicial</span></div></div>
</div></section>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Sectores', 'Una agencia de IA que habla el idioma de tu sector', '', '<a class="tc-link" href="/sectores-industriales/">IA para la industria</a>')}
<div class="tc-sectores tc-reveal">${[...SECTORES.map(([i, t, items]) => [i, t, items[0]]), ...OTROS_SECTORES.map(([i, t]) => [i, t, ''])].map(([i, t, d]) => `<a class="tc-sector" href="${d ? '/sectores-industriales/' : '/casos/'}">${icon(i)}<span><b>${t}</b>${d ? `<small>${d}</small>` : ''}</span></a>`).join('')}</div>
</div></section>

<section class="tc-sec"><div class="tc-wrap">${head('Casos de éxito', 'El problema que había y cómo lo resolvimos', '', '<a class="tc-link" href="/casos/">Ver todos los casos</a>')}
<div class="tc-grid tc-grid--3">
 <article class="tc-box tc-pc tc-reveal">${icon('lupa')}<span class="tc-pc__l tc-pc__l--p">Problema</span><p>Encontrar el artículo correcto en SAP llevaba demasiado tiempo: había que saber exactamente cómo estaba dado de alta.</p><span class="tc-pc__l">Solución</span><p>Una capa de IA que busca artículos como habla la gente y se sincroniza con SAP según las necesidades de cada cliente.</p><a class="tc-link" href="/casos/#sap">Ver el caso</a></article>
 <article class="tc-box tc-pc tc-reveal">${icon('chat')}<span class="tc-pc__l tc-pc__l--p">Problema</span><p>Los clientes de una tienda online técnica llamaban para preguntar equivalencias y stock, a menudo fuera de horario.</p><span class="tc-pc__l">Solución</span><p>Un asistente conectado al catálogo y al stock real que responde con la ficha y lleva al cliente al carrito.</p><a class="tc-link" href="/casos/#distribucion">Ver el caso</a></article>
 <article class="tc-box tc-pc tc-reveal">${icon('erp')}<span class="tc-pc__l tc-pc__l--p">Problema</span><p>Presupuestos en Word, albaranes en papel, facturas en Excel y tickets perdidos. Cada trimestre, días de papeleo.</p><span class="tc-pc__l">Solución</span><p>Un programa de gestión con IA: del presupuesto a la factura en un clic y los gastos con una foto.</p><a class="tc-link" href="/casos/#gestion">Ver el caso</a></article>
</div></div></section>

<section class="tc-sec tc-sec--tight tc-sec--gal"><div class="tc-wrap">${head('Hecho por nosotros', 'Así son las herramientas que construimos', 'Pantallas reales de aplicaciones que hemos desarrollado. Pasa el ratón para pararlas y pulsa para ver el caso.', '<a class="tc-link" href="/casos/">Ver los casos</a>')}</div>${galeria}</section>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', 'De la idea a funcionando, sin sorpresas')}${PASOS}</div></section>

<section class="tc-sec"><div class="tc-wrap tc-newsletter"><div class="tc-reveal" style="display:grid;gap:14px">${eyebrow('Boletín semanal')}<h2>Lo que importa de la IA esta semana, en 5 minutos</h2><p class="tc-lead">Cada lunes, gratis: las noticias de inteligencia artificial que de verdad afectan a una empresa, con qué hacer con cada una. Sin relleno y con baja en un clic.</p></div><div class="tc-reveal">${FORM_BOLETIN('tc-bol-home')}</div></div></section>

<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Lo que suelen preguntarnos')}${faq([
    ['¿Qué es Transforma con IA?', 'Un medio de noticias de inteligencia artificial pensado para empresas y, a la vez, una agencia de IA y automatización con base en Murcia. Montamos automatizaciones, agentes de IA, chatbots, herramientas a medida y contenido automático para pymes e industria de toda España.'],
    ['¿Qué tareas se pueden automatizar con IA?', 'Casi cualquier tarea repetitiva con documentos o datos: leer facturas y pedidos, contestar consultas de clientes, preparar presupuestos, pasar información entre programas, generar informes o publicar contenido. En el diagnóstico gratuito vemos cuáles compensan en tu caso.'],
    ['¿Cuánto cuesta automatizar un proceso con IA?', 'Como referencia orientativa, una automatización sencilla parte de 450 € + IVA, un chatbot o agente de IA de 900 € y una herramienta a medida de 2.500 €. Cada caso es distinto: tras el diagnóstico gratuito recibes un presupuesto cerrado.'],
    ['¿Es rentable la IA para una pyme?', 'Suele serlo cuando sustituye horas de trabajo repetitivo cada semana. Por eso empezamos calculando cuánto tiempo se dedica hoy a la tarea y cuánto quedaría, para que decidas con números antes de gastar nada.'],
    ['¿Cada cuánto publicáis noticias de IA?', 'Casi a diario. Cada mañana un sistema propio revisa 21 fuentes (OpenAI, Google, Anthropic, n8n y medios especializados), selecciona lo relevante para empresas y lo explicamos con contexto práctico.'],
    ['¿Trabajáis fuera de Murcia?', 'Sí. Trabajamos en remoto con empresas de toda España. Si estás en la Región de Murcia y lo prefieres, podemos vernos en persona.'],
    ['¿Cómo puedo seguir vuestras noticias?', 'Entrando en el blog cada mañana o apuntándote gratis al boletín semanal: cada lunes recibes en tu correo las noticias de IA que importan a una empresa, con qué hacer con cada una.'],
  ])}</div></section>

<section class="tc-sec" id="contacto"><div class="tc-wrap tc-split">
 <div class="tc-prose tc-reveal" style="gap:18px">${eyebrow('Hablemos')}<h2>Cuéntanos qué necesitas y te decimos cómo resolverlo</h2><p>En menos de 24 horas laborables te respondemos con una primera valoración. Si tiene sentido, hacemos un diagnóstico gratuito de 30 minutos y te enviamos por escrito qué automatizaríamos, cómo y por cuánto.</p>${list(['Sin compromiso y sin permanencias', 'Precios orientativos desde el principio', 'En remoto en toda España, en persona en Murcia'])}<p>¿Prefieres el correo? <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a></p></div>
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)">${FORM_CONTACTO}</div>
</div></section>
`),
};

P['soluciones'] = {
  title: 'Soluciones de IA para empresas',
  seo: ['Servicios de IA y automatización para empresas | Transforma con IA', 'Automatización de procesos, agentes y chatbots, herramientas a medida, programa de gestión, contenido automático y diagnóstico gratuito. Cómo trabajamos y precios orientativos.', 'servicios de inteligencia artificial para empresas'],
  html: page(`${pagehead('<span>Soluciones</span>', 'Soluciones', 'Servicios de inteligencia artificial para empresas, con precio claro', 'Seis formas de empezar. Todas arrancan con un diagnóstico gratuito de 30 minutos y, cuando hay desarrollo, con un prototipo que pruebas con tus propios datos antes de decidir.', btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos reales', true), facts('Precios orientativos', [['Diagnóstico', 'Gratis'], ['Automatización', 'desde 450 €'], ['Agente o chatbot', 'desde 900 €'], ['Herramienta a medida', 'desde 2.500 €'], ['Programa de gestión', 'desde 690 €'], ['Contenido automático', 'desde 600 €']]))}
${sec(servCards() + `<div class="tc-subhead tc-reveal"><span class="tc-eyebrow">Soluciones concretas</span><p>Lo que montamos con más frecuencia:</p></div>` + chips, 'tc-sec--tight')}
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', 'Tres pasos, y en ninguno pagas a ciegas')}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Por qué con nosotros', 'Lo que nos diferencia')}
<div class="tc-grid tc-grid--4">
 <div class="tc-box tc-reveal">${icon('radar')}<h3>Al día, de verdad</h3><p>Seguimos la actualidad de la IA cada mañana para el blog. Lo que proponemos usa lo último que funciona.</p></div>
 <div class="tc-box tc-reveal">${icon('tuerca')}<h3>Hablamos tu idioma</h3><p>Hemos trabajado con industria, distribución, servicios técnicos, clínicas, despachos y educación. Sin palabras de moda.</p></div>
 <div class="tc-box tc-reveal">${icon('escudo')}<h3>Tus datos, controlados</h3><p>Accesos mínimos, servidores en la UE cuando es posible y todo documentado. Lo que montamos es tuyo.</p></div>
 <div class="tc-box tc-reveal">${icon('reloj')}<h3>Rápido y sin permanencias</h3><p>Prototipo en semanas, no meses. El mantenimiento es mes a mes y lo dejas cuando quieras.</p></div>
</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Antes de empezar')}${faq([
    ['¿Los precios son cerrados?', 'No: son orientativos para que sepas el orden de magnitud. Tras el diagnóstico gratuito te enviamos un presupuesto cerrado por escrito.'],
    ['¿Necesito conocimientos técnicos?', 'No. Tú nos explicas cómo trabajáis y nosotros nos encargamos de la parte técnica. Al terminar te dejamos una guía sencilla de uso.'],
    ['¿Cuánto se tarda en tener algo funcionando?', 'Una automatización sencilla, una o dos semanas. Un chatbot o agente, dos o tres. Una herramienta a medida, de cuatro a ocho, con versiones intermedias que ya podéis usar.'],
    ['¿Hay que pagar la IA aparte?', 'El consumo de los modelos de IA suele ser de pocos euros al mes en una pyme. Lo incluimos en el mantenimiento o lo pagas directamente al proveedor, como prefieras.'],
  ])}</div></section>
${band('Empieza por lo que más tiempo os quita', 'Un diagnóstico de 30 minutos, gratis y sin compromiso.')}`),
};

const servicio = ({ crumb, eb, h1, lead, seo, resumen, que, como, precio, faqs }) => ({
  title: crumb, seo,
  html: page(`${pagehead(`<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>${crumb}</span>`, eb, h1, lead, btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('En resumen', resumen))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap">${head('Qué resolvemos', que[0], que[1])}<div class="tc-grid tc-grid--3">${que[2].map(([i, t, p]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3><p>${p}</p></article>`).join('')}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo trabajamos', como)}${PASOS}</div></section>
<section class="tc-sec"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal">${eyebrow('Precio orientativo')}<h2>${precio[0]}</h2><p>${precio[1]}</p></div><div class="tc-box tc-reveal"><p class="tc-price" style="border:0;padding:0;margin:0"><span>Orientativo</span> ${precio[2]}</p><p>Precio de referencia. Tras el diagnóstico gratuito recibes un presupuesto cerrado.</p><div>${btn('/contacto/', 'Quiero un presupuesto')}</div></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Preguntas frecuentes', 'Dudas habituales')}${faq(faqs)}</div></section>
${band('¿Lo vemos aplicado a tu empresa?', 'En 30 minutos te decimos si tiene sentido en tu caso y cuánto costaría. Gratis.')}`),
});

P['automatizacion-procesos-ia'] = servicio({
  crumb: 'Automatización de procesos', eb: 'Automatización de procesos con IA',
  h1: 'Automatización de procesos con IA para que tu equipo deje de copiar y pegar',
  lead: 'Conectamos tu correo, tu programa de gestión, tus hojas de cálculo y tus documentos para que la información se mueva sola, con IA donde hace falta leer, clasificar o redactar.',
  seo: ['Automatización de procesos con IA para empresas | Transforma con IA', 'Automatizamos pedidos, facturas, correos e informes con IA y n8n. Precio orientativo desde 450 € + IVA, prototipo en 1-2 semanas y diagnóstico gratis.', 'automatización de procesos con IA'],
  resumen: [['Precio orientativo', 'desde 450 €'], ['Plazo', '1 a 2 semanas'], ['Tecnología', 'n8n + IA'], ['Mantenimiento', 'desde 39 €/mes']],
  que: ['Las tareas que nadie quiere hacer', 'Si alguien repite la misma tarea cada día con el ordenador, casi seguro que se puede automatizar.', [
    ['doc', 'Documentos que llegan por correo', 'Pedidos, facturas y albaranes en PDF o foto: la IA los lee y mete los datos en tu programa.'],
    ['flujo', 'Datos entre programas', 'Lo que entra en la web, el CRM o el ERP se sincroniza solo con el resto, sin teclear dos veces.'],
    ['reloj', 'Informes y avisos', 'Informes que se preparan solos y te llegan al correo o a Telegram cuando digas.']]],
  como: 'Primero entendemos el proceso, después lo automatizamos',
  precio: ['Depende del proceso', 'Varía según cuántos programas hay que conectar y cuánto tiene que «pensar» la IA.', 'desde <b>450 €</b> + IVA'],
  faqs: [
    ['¿Qué es n8n y por qué lo usáis?', 'Una plataforma de automatización de código abierto que alojamos en servidores propios. Conecta cientos de programas e incluye IA, sin pagar por cada ejecución como en Zapier o Make.'],
    ['¿Funciona con mi programa de gestión?', 'Si tiene API, exportaciones, correo o incluso una carpeta compartida, casi siempre hay forma de conectarlo. Lo comprobamos en el diagnóstico.'],
    ['¿Qué pasa si la automatización falla?', 'Cada flujo tiene avisos de error: si algo no cuadra nos llega un mensaje y lo revisamos. Nada se pierde en silencio.'],
  ],
});

P['agentes-chatbots-ia'] = servicio({
  crumb: 'Agentes y chatbots de IA', eb: 'Agentes y chatbots de IA',
  h1: 'Agentes y chatbots de IA que conocen tu empresa de verdad',
  lead: 'Asistentes que responden con tu catálogo, tus tarifas y tus manuales. Para atender a clientes en tu web o WhatsApp, o para que tu equipo encuentre cualquier dato en segundos.',
  seo: ['Agentes de IA y chatbots para empresas | Transforma con IA', 'Chatbots y agentes de IA entrenados con tu catálogo, manuales y datos. En tu web, WhatsApp o Telegram. Precio orientativo desde 900 € + IVA.', 'agentes de IA para empresas'],
  resumen: [['Precio orientativo', 'desde 900 €'], ['Plazo', '2 a 3 semanas'], ['Canales', 'Web, WhatsApp, Telegram'], ['Mantenimiento', 'desde 49 €/mes']],
  que: ['Respuestas correctas, a cualquier hora', 'Un buen agente no se inventa nada: consulta tus datos y, si no sabe algo, lo dice y avisa a una persona.', [
    ['chat', 'Atención al cliente 24/7', 'Dudas de producto, disponibilidad o plazos en tu web o WhatsApp, y paso a una persona cuando hace falta.'],
    ['lupa', 'Buscador técnico interno', 'Tu equipo pregunta en lenguaje normal y el agente contesta con el manual, la ficha o el histórico correcto.'],
    ['flujo', 'Agentes que hacen tareas', 'Crean el presupuesto, registran el pedido o preparan el correo, siempre con tu confirmación.']]],
  como: 'Un agente útil se diseña alrededor de tus datos',
  precio: ['Depende de lo que tenga que saber y hacer', 'Varía según la información que deba consultar y las acciones que pueda realizar.', 'desde <b>900 €</b> + IVA'],
  faqs: [
    ['¿Qué diferencia hay entre un chatbot y un agente de IA?', 'Un chatbot responde preguntas. Un agente además actúa: consulta sistemas, crea documentos o lanza tareas. Empezamos por lo que tu caso necesite.'],
    ['¿Se puede equivocar?', 'Lo reducimos al mínimo obligándole a responder solo con tus datos y a reconocer cuando no sabe algo. Las acciones importantes siempre piden confirmación.'],
    ['¿Puede estar en WhatsApp?', 'Sí, mediante la API oficial de WhatsApp Business. También en tu web, en Telegram o dentro de tus herramientas internas.'],
  ],
});

P['desarrollo-a-medida-ia'] = servicio({
  crumb: 'Herramientas a medida', eb: 'Desarrollo a medida con IA',
  h1: 'Herramientas a medida con IA para lo que ningún programa estándar resuelve',
  lead: 'Aplicaciones web hechas para vuestra forma de trabajar: leen documentos, buscan en tu catálogo, calculan presupuestos y se conectan con SAP, Excel o tu ERP.',
  seo: ['Desarrollo de software a medida con IA | Transforma con IA', 'Aplicaciones web a medida con inteligencia artificial: lectura de documentos, buscadores técnicos, conexión con SAP. Precio orientativo desde 2.500 € + IVA.', 'desarrollo de software a medida con IA'],
  resumen: [['Precio orientativo', 'desde 2.500 €'], ['Plazo', '4 a 8 semanas'], ['Integraciones', 'SAP, Excel, ERP'], ['Soporte', 'desde 69 €/mes']],
  que: ['Cuando el Excel ya no da más de sí', 'Hay procesos tan propios de tu empresa que ningún programa estándar los cubre. Ahí una herramienta a medida marca la diferencia.', [
    ['app', 'Aplicaciones web propias', 'Desde el ordenador o el móvil, con usuarios y permisos, sin instalar nada.'],
    ['doc', 'IA que lee y entiende', 'Planos, pedidos, fotos de tickets, fichas técnicas: la herramienta extrae lo importante y lo ordena.'],
    ['flujo', 'Conectada a lo que ya usas', 'Exporta e importa con SAP, Excel, tu ERP o tu tienda online sin romper vuestra forma de trabajar.']]],
  como: 'Versiones que ya puedes usar desde las primeras semanas',
  precio: ['Depende del alcance', 'Varía según las pantallas, integraciones y usuarios. Se entrega por fases para que la uséis cuanto antes.', 'desde <b>2.500 €</b> + IVA'],
  faqs: [
    ['¿La herramienta es mía?', 'Sí. Lo que montamos para ti es tuyo, con su documentación. Si un día quieres llevarlo a otro proveedor, puedes.'],
    ['¿Dónde se aloja?', 'En proveedores en la nube con servidores en la Unión Europea siempre que es posible. El alojamiento suele ir incluido en el soporte.'],
    ['¿Se puede ampliar después?', 'Sí. Se diseña por módulos para ir añadiendo funciones según las vayáis necesitando.'],
  ],
});

P['contenido-automatico-ia'] = servicio({
  crumb: 'Noticias y páginas automáticas', eb: 'Contenido automático con IA',
  h1: 'Noticias y páginas que se publican solas, con tu visto bueno',
  lead: 'Montamos sistemas que buscan novedades, redactan, ilustran y publican en tu web: un blog de actualidad de tu sector, fichas de producto o páginas por zona. Este medio funciona exactamente así.',
  seo: ['Noticias y páginas automáticas con IA para tu web | Transforma con IA', 'Blog de noticias automático, fichas de producto y páginas generadas con IA y revisadas antes de publicarse. Precio orientativo desde 600 € + IVA.', 'blog automático con IA'],
  resumen: [['Precio orientativo', 'desde 600 €'], ['Plazo', '1 a 3 semanas'], ['Funciona con', 'WordPress y otras webs'], ['Mantenimiento', 'desde 49 €/mes']],
  que: ['Tu web, siempre viva', 'Publicar con regularidad es lo que más ayuda a aparecer en Google y en ChatGPT, y lo primero que se abandona por falta de tiempo.', [
    ['noticia', 'Blog de noticias de tu sector', 'Cada mañana se revisan tus fuentes y te llegan propuestas al móvil. Apruebas con un toque y el artículo sale redactado, ilustrado y optimizado.'],
    ['doc', 'Páginas automáticas', 'Fichas de producto, páginas por ciudad o por servicio generadas desde tu catálogo o tus datos, revisadas antes de publicarse.'],
    ['sobre', 'Boletines para tus clientes', 'Un boletín periódico con tus novedades y las de tu sector, preparado solo y enviado con tu marca.']]],
  como: 'Tú decides qué se publica; el sistema hace el resto',
  precio: ['Depende de la web y del volumen', 'Varía según el tipo de contenido, las fuentes y cuántas publicaciones al mes quieras.', 'desde <b>600 €</b> + IVA'],
  faqs: [
    ['¿Se publica algo sin que yo lo vea?', 'Solo si tú quieres. Lo normal es que te llegue la propuesta por Telegram o correo y se publique cuando la apruebas.'],
    ['¿Google penaliza el contenido hecho con IA?', 'Google penaliza el contenido pobre o masivo, no la herramienta. Por eso cada pieza se basa en fuentes reales, aporta criterio propio y pasa una revisión antes de publicarse.'],
    ['¿Cuánto cuesta la IA de cada artículo?', 'Unos céntimos por texto y algo más por las imágenes. Va incluido en el mantenimiento o lo pagas directamente al proveedor.'],
  ],
});

P['gestion'] = {
  title: 'Programa de gestión con IA',
  seo: ['Programa de gestión (ERP) con IA para empresas de oficio | Transforma con IA', 'Presupuestos, albaranes firmados, facturas, cobros y gastos por foto desde el móvil. TransformaConIA Gestión: puesta en marcha desde 690 € y 3 meses gratis.', 'programa de gestión con IA'],
  html: page(`${pagehead('<a href="/soluciones/">Soluciones</a><span aria-hidden="true">/</span><span>Programa de gestión</span>', 'TransformaConIA Gestión', 'El programa para llevar tu empresa. Y la IA te hace el papeleo.', 'Un programa de gestión para empresas de servicios técnicos: presupuestos, albaranes firmados, facturas, cobros y gastos, con un asistente de IA y Telegram para registrarlo todo desde el móvil.', btn('https://transformaconia-gestion.vercel.app/', 'Ver el programa y pedir una demo') + btn('/contacto/', 'Hacer una pregunta', true), facts('Oferta de lanzamiento', [['Puesta en marcha', '<s style="color:var(--tc-dim);font-weight:400">990 €</s> 690 €'], ['Mantenimiento', '69 €/mes'], ['Primeros 3 meses', 'Gratis'], ['Usuario extra', '15 €/mes'], ['Permanencia', 'Ninguna']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-reveal">${shots([[IMG.facturas, 'Facturas en el programa de gestión', 'Facturas'], [IMG.cobros, 'Cobros y vencimientos', 'Cobros y vencimientos'], [IMG.fiscal, 'Paquete trimestral para la asesoría', 'Fiscal y asesor']])}<p class="tc-nota">Pantallas reales del programa con datos de ejemplo.</p></div></section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-grid tc-grid--3">
 <article class="tc-box tc-reveal">${icon('doc')}<h3>Factura en minutos</h3><p>Presupuestos, albaranes y facturas enlazados. El asistente los prepara y tú solo revisas y envías.</p></article>
 <article class="tc-box tc-reveal">${icon('reloj')}<h3>Cobra antes</h3><p>Ves de un vistazo qué está pendiente y el programa te recuerda a quién reclamar.</p></article>
 <article class="tc-box tc-reveal">${icon('telegram')}<h3>Deduce cada ticket</h3><p>Foto del ticket por Telegram: la IA lee importe, IVA y proveedor y lo registra.</p></article>
</div></div></section>
${band('¿Quieres verlo con tus propios datos?', 'Te enseñamos el programa en una videollamada y te decimos qué habría que configurar para tu empresa.', btn('https://transformaconia-gestion.vercel.app/', 'Pedir una demo'))}`),
};

P['sectores-industriales'] = {
  title: 'IA para la industria',
  seo: ['Inteligencia artificial para empresas industriales | Transforma con IA', 'Qué se puede automatizar con IA en empresas eléctricas, de neumática, hidráulica, mecanizado, suministro industrial, mantenimiento, automatización y frío industrial.', 'inteligencia artificial para la industria'],
  html: page(`${pagehead('<span>IA para la industria</span>', 'Sectores industriales', 'Inteligencia artificial para empresas industriales', 'Buena parte de lo que hemos construido es para la industria y los oficios técnicos. Estas son las tareas que más tiempo ahorran en cada sector.', btn('/contacto/', 'Cuéntanos tu caso') + btn('/casos/', 'Ver casos reales', true), facts('Sectores', SECTORES.map(([, t], i) => [String(i + 1).padStart(2, '0'), t])))}
${sec(`<div class="tc-grid tc-grid--4">${SECTORES.map(([i, t, items]) => `<article class="tc-box tc-reveal">${icon(i)}<h3>${t}</h3>${list(items)}</article>`).join('')}</div>`, 'tc-sec--tight')}
<section class="tc-sec tc-sec--alt"><div class="tc-wrap tc-split tc-split--center"><div class="tc-prose tc-reveal">${eyebrow('Por qué en la industria')}<h2>Referencias, albaranes y ERP: donde la IA más ahorra</h2><p>En una empresa industrial gran parte del tiempo se va en buscar referencias, traducir lo que pide un cliente a un código de producto, pasar documentos de un programa a otro y preparar ofertas. Son tareas repetitivas, con reglas claras y muchos datos: justo donde la IA funciona mejor.</p></div><div class="tc-prose tc-reveal"><p class="tc-quote">Si tu equipo técnico pasa más tiempo buscando información que resolviendo problemas, hay algo que automatizar.</p></div></div></section>
${band('¿Tu sector no aparece?', 'Da igual: si hay tareas repetitivas con datos, hay algo que automatizar. Cuéntanos cómo trabajáis.')}`),
};

const CASOS = [
  { id: 'sap', ic: 'lupa', sector: 'ERP SAP', titulo: 'Sacar más partido a SAP con IA',
    problema: 'Buscar un artículo en SAP era lento: había que conocer el código o la descripción exacta con la que estaba dado de alta, y con miles de referencias se perdía mucho tiempo o se elegía el que no era.',
    solucion: 'Una capa de inteligencia artificial que mejora la búsqueda de artículos: entiende lo que escribe la persona con sus propias palabras, tolera errores y sinónimos y propone el artículo correcto. Además, la sincronizamos con el ERP SAP según las necesidades de cada cliente para potenciarlo aún más.',
    resultado: 'Se encuentra el artículo correcto en segundos y SAP se aprovecha más, sin cambiar de programa ni de forma de trabajar.',
    flujo: ['Lo que busca el usuario', 'Búsqueda con IA', 'Artículo correcto', 'Sincronizado con SAP'], tags: ['SAP', 'Búsqueda inteligente', 'Integración a medida'] },
  { id: 'distribucion', ic: 'chat', sector: 'Distribución técnica B2B', titulo: 'Un asistente técnico dentro de la tienda online',
    problema: 'Los clientes profesionales de una tienda online técnica llamaban o escribían para preguntar equivalencias entre marcas, medidas y disponibilidad. Cada consulta ocupaba a un técnico y muchas llegaban fuera de horario.',
    solucion: 'Un asistente dentro de la tienda conectado al catálogo y al stock real. Entiende la referencia aunque venga incompleta, da todas las equivalencias, muestra la ficha técnica completa y añade el producto al carrito.',
    resultado: 'Las consultas técnicas se resuelven solas a cualquier hora y el cliente compra sin esperar respuesta.',
    flujo: ['Pregunta del cliente', 'Catálogo y stock', 'Ficha y equivalencias', 'Al carrito'], tags: ['Chatbot', 'Tienda online', 'Stock en tiempo real'], chat: true },
  { id: 'gestion', ic: 'erp', sector: 'Servicios técnicos', titulo: 'Del papel a un programa de gestión con IA',
    problema: 'Presupuestos en Word, albaranes en papel, facturas en Excel y tickets de gasto en la guantera. Nadie sabía de un vistazo qué estaba pendiente de cobro y cada trimestre se iban días en preparar los papeles para la asesoría.',
    solucion: 'Un programa de gestión propio: presupuesto, albarán firmado en el móvil y factura en un clic; cobros y vencimientos a la vista; gastos registrados mandando la foto del ticket por Telegram, y un asistente de IA que prepara documentos y pide confirmación.',
    resultado: 'Toda la gestión en un solo sitio y el paquete trimestral para la asesoría sale con un botón.',
    flujo: ['Presupuesto', 'Albarán firmado', 'Factura', 'Paquete para la asesoría'], tags: ['ERP', 'Telegram', 'Lectura de tickets'], imgs: [[IMG.facturas, 'Facturas en el programa de gestión'], [IMG.cobros, 'Cobros y vencimientos'], [IMG.fiscal, 'Paquete trimestral para la asesoría']] },
  { id: 'clinicas', ic: 'cal', sector: 'Clínicas y centros con cita', titulo: 'Software de gestión para clínicas veterinarias',
    problema: 'Las citas se daban por teléfono, las fichas estaban en papel o en hojas sueltas y las vacunas pendientes dependían de que alguien se acordara de avisar al dueño.',
    solucion: 'Un programa todo en uno para la clínica: agenda de citas, fichas de cada mascota con su historia clínica, control de vacunaciones, recordatorios automáticos por WhatsApp y facturación.',
    resultado: 'La clínica ve el día de un vistazo y los avisos de citas y vacunas salen solos. El mismo modelo sirve para fisioterapia, estética o cualquier centro con cita previa.',
    flujo: ['Cita', 'Ficha y vacunas', 'Recordatorio por WhatsApp', 'Factura'], tags: ['Agenda', 'WhatsApp', 'Facturación'], imgs: [[IMG.veterinaria, 'Software de gestión para clínicas veterinarias']] },
  { id: 'despachos', ic: 'balanza', sector: 'Despachos de abogados', titulo: 'Buscador de jurisprudencia que entiende el caso',
    problema: 'Encontrar sentencias útiles para un caso exige horas en buscadores oficiales poco amigables, probando combinaciones de palabras clave.',
    solucion: 'Un buscador al que se le describe el caso con palabras normales. Busca en la fuente oficial del poder judicial y devuelve las resoluciones relevantes con su referencia oficial para comprobarlas.',
    resultado: 'Del caso al fundamento en minutos, siempre con la cita oficial a mano para verificarla.',
    flujo: ['Caso descrito', 'Fuente oficial', 'Resoluciones relevantes', 'Cita verificable'], tags: ['IA', 'Búsqueda semántica', 'Fuente oficial'], imgs: [[IMG.fundalex, 'Buscador de jurisprudencia con resultado verificado']] },
  { id: 'educacion', ic: 'libro', sector: 'Educación', titulo: 'Refuerzo escolar con una foto del ejercicio',
    problema: 'Muchos alumnos de ESO se atascan con los deberes de Matemáticas o Física y en casa no siempre hay quien se los explique.',
    solucion: 'Una aplicación de chat: el alumno hace una foto al ejercicio y la IA lo lee, lo resuelve, comprueba el resultado y lo explica paso a paso. También prepara exámenes de práctica con la solución al lado.',
    resultado: 'Explicaciones a cualquier hora, con el resultado comprobado antes de enseñarlo.',
    flujo: ['Foto del ejercicio', 'Lectura con IA', 'Resolución comprobada', 'Explicación paso a paso'], tags: ['IA multimodal', 'Chat', 'Educación'], imgs: [[IMG.refuerzo, 'Aplicación de refuerzo escolar con IA']] },
  { id: 'medio', ic: 'radar', sector: 'Contenido', titulo: 'Este mismo medio, publicado por un equipo de agentes',
    problema: 'Mantener un medio de actualidad exige leer decenas de fuentes cada día y escribir con rigor. Hecho a mano, se come las mañanas.',
    solucion: 'Un sistema de agentes en n8n que cada mañana revisa 21 fuentes, puntúa las noticias y nos propone las mejores por Telegram. Tras nuestra aprobación investiga, redacta, ilustra, optimiza para buscadores y publica.',
    resultado: 'Actualidad casi diaria con fuentes enlazadas y revisión humana antes de publicar.',
    flujo: ['21 fuentes', 'Selección con IA', 'Aprobación por Telegram', 'Publicado'], tags: ['n8n', 'Agentes', 'WordPress'], imgs: [[IMG.medio, 'Archivo de noticias de este medio']] },
  { id: 'ventas', ic: 'iman', sector: 'Ventas', titulo: 'Prospección comercial que prepara cada correo',
    problema: 'Encontrar empresas a las que ofrecer un servicio, estudiar cada una y escribirle algo personalizado llevaba horas por contacto.',
    solucion: 'Se escribe un nicho («clínicas dentales en Murcia») y el sistema encuentra los negocios, analiza su web con IA, puntúa la oportunidad, busca el contacto y deja el correo personalizado en borrador.',
    resultado: 'Correos personalizados y revisados por una persona antes de enviarse, en minutos en lugar de horas.',
    flujo: ['Nicho y zona', 'Análisis de su web', 'Contacto', 'Borrador personalizado'], tags: ['IA', 'Google Maps', 'Gmail'] },
];
const MINI_CHAT = `<figure class="tc-chat tc-chat--mini" aria-label="Ejemplo de conversación con el asistente técnico"><div class="tc-chat__top"><span class="tc-chat__av">IA</span><div><b>Asistente técnico</b><small><i></i>en línea</small></div></div><div class="tc-chat__body">
<p class="tc-chat__m tc-chat__m--c" style="--d:.4s">¿Tenéis un equivalente de esta referencia pero de otra marca? La necesito para mañana.</p>
<p class="tc-chat__m tc-chat__m--b" style="--d:1.8s">Sí, hay dos equivalencias directas con las mismas medidas. De la primera tenemos 14 unidades en stock y sale hoy. Aquí tienes la ficha técnica. ¿La añado al carrito?</p>
<p class="tc-chat__m tc-chat__m--c" style="--d:3.4s">Sí, 4 unidades.</p>
<p class="tc-chat__m tc-chat__m--b" style="--d:4.8s">Añadidas ✓ Puedes finalizar el pedido cuando quieras.</p></div><figcaption>Ejemplo ilustrativo de conversación.</figcaption></figure>`;
const casoHTML = (c, i) => `<article class="tc-caso tc-reveal${i % 2 ? ' tc-caso--rev' : ''}" id="${c.id}">
<div class="tc-caso__txt">
<header class="tc-caso__h">${icon(c.ic)}<div><span class="tc-eyebrow">${c.sector}</span><h3>${c.titulo}</h3></div></header>
<div class="tc-caso__pc"><div class="tc-caso__p"><span class="tc-pc__l tc-pc__l--p">El problema</span><p>${c.problema}</p></div><div class="tc-caso__s"><span class="tc-pc__l">La solución</span><p>${c.solucion}</p></div></div>
${flow(c.flujo)}
<footer class="tc-caso__r"><span class="tc-caso__ok" aria-hidden="true">✓</span><p><b>Resultado:</b> ${c.resultado}</p></footer>
<div class="tc-tags">${c.tags.map((t) => `<span>${t}</span>`).join('')}</div>
</div>
<div class="tc-caso__vis">${c.imgs ? shots(c.imgs) : c.chat ? MINI_CHAT : `<div class="tc-caso__flowbig">${flow(c.flujo)}</div>`}</div>
</article>`;

P['casos'] = {
  title: 'Casos de éxito',
  seo: ['Casos de éxito de IA y automatización: problema y solución | Transforma con IA', 'IA integrada con SAP, asistente técnico en tienda online, programa de gestión con IA, software para clínicas, buscador jurídico y más: el problema que había y cómo lo resolvimos.', 'casos de éxito inteligencia artificial'],
  html: page(`${pagehead('<span>Casos</span>', 'Casos de éxito', 'El problema que había y cómo lo resolvimos', 'Proyectos que hemos construido y están funcionando. Sin nombres de clientes por confidencialidad, pero con lo que hacía falta resolver, lo que montamos y cómo funciona. Si quieres ver alguno en marcha, te lo enseñamos en una videollamada.', btn('/contacto/', 'Tengo un problema parecido'), facts('Índice', CASOS.map((c) => [c.sector, `<a href="#${c.id}">Ver</a>`])))}
<section class="tc-sec--gal" style="padding-bottom:16px">${galeria}</section>
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-casos">${CASOS.map((c, i) => casoHTML(c, i)).join('')}</div></section>
${band('¿Tienes un problema parecido?', 'Cuéntanoslo y te decimos cómo lo resolveríamos y cuánto costaría. Gratis y sin compromiso.')}`),
};

P['quienes-somos'] = {
  id: 7105, title: 'Quiénes somos',
  seo: ['Quiénes somos: agencia de IA y automatización en Murcia | Transforma con IA', 'Somos un equipo de compañeros de Murcia dedicados a la inteligencia artificial y la automatización. Contamos la actualidad de la IA y la aplicamos en empresas de toda España.', 'agencia de inteligencia artificial Murcia'],
  html: page(`${pagehead('<span>Quiénes somos</span>', 'Quiénes somos', 'Un equipo de Murcia que vive la IA cada día', 'Somos varios compañeros que nos dedicamos a la inteligencia artificial y la automatización. Contamos lo que pasa en este mundo cada mañana y lo ponemos a trabajar en empresas de toda España.', btn('/contacto/', 'Hablemos'), facts('En pocas palabras', [['Dónde', 'Murcia'], ['Trabajamos', 'En remoto, toda España'], ['Presencial', 'Región de Murcia'], ['Respuesta', 'menos de 24 h'], ['Herramientas en uso', '+15']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Qué hacemos')}<h2>Contamos la IA y la aplicamos</h2><p>Transforma con IA tiene dos caras que se alimentan entre sí. Por un lado, un medio en el que cada mañana revisamos lo que se publica en el mundo de la inteligencia artificial y explicamos qué significa para una empresa. Por otro, una agencia en la que convertimos esas novedades en automatizaciones, agentes, aplicaciones y contenido automático.</p><p>Seguir la actualidad a diario nos permite proponer lo que de verdad funciona hoy. Y construir para empresas reales nos obliga a separar lo útil del ruido cuando escribimos.</p></div>
<div class="tc-prose tc-reveal"><p class="tc-quote">La mejor automatización es la que tu equipo deja de notar porque simplemente funciona.</p><p>Hemos trabajado con distribución técnica, empresas que usan SAP, servicios técnicos, clínicas, despachos y educación. Hablamos el idioma de cada sector: referencias, albaranes, citas, expedientes o plazos de entrega.</p></div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Cómo somos', 'Lo que puedes esperar de nosotros')}
<div class="tc-grid tc-grid--4">
 <div class="tc-box tc-reveal">${icon('equipo')}<h3>Cercanos</h3><p>Hablas siempre con quien lo construye. Sin comerciales de por medio ni tickets que se pierden.</p></div>
 <div class="tc-box tc-reveal">${icon('escudo')}<h3>Claros</h3><p>Precios orientativos desde el principio, presupuesto cerrado por escrito y nada de permanencias.</p></div>
 <div class="tc-box tc-reveal">${icon('radar')}<h3>Al día</h3><p>Probamos cada novedad de la IA antes de recomendarla. Si algo no aporta, te lo decimos.</p></div>
 <div class="tc-box tc-reveal">${icon('mapa')}<h3>De Murcia</h3><p>En remoto para toda España y en persona en la Región de Murcia cuando hace falta.</p></div>
</div></div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Con qué trabajamos', 'Herramientas elegidas por lo que resuelven')}
<div class="tc-grid tc-grid--3">
 <div class="tc-box tc-reveal">${icon('flujo')}<h3>Automatización</h3><p>n8n en servidor propio, conectado a correo, Telegram, WhatsApp, hojas de cálculo y ERP.</p></div>
 <div class="tc-box tc-reveal">${icon('chat')}<h3>Modelos de IA</h3><p>OpenAI, Anthropic (Claude) y Google (Gemini), elegidos para cada tarea por calidad y coste.</p></div>
 <div class="tc-box tc-reveal">${icon('app')}<h3>Aplicaciones</h3><p>Aplicaciones web modernas con bases de datos en la nube europea, usuarios y permisos.</p></div>
</div></div></section>
${band('¿Tienes una tarea que te gustaría quitarte de encima?', 'Escríbenos y lo vemos juntos en 30 minutos.')}`),
};

P['contacto'] = {
  id: 12, title: 'Contacto',
  seo: ['Contacto y diagnóstico gratis | Transforma con IA', 'Cuéntanos qué tarea os quita más tiempo y te respondemos en menos de 24 horas con un diagnóstico gratuito. info@transformaconia.com · Murcia y toda España.', 'contacto agencia IA'],
  html: page(`${pagehead('<span>Contacto</span>', 'Contacto', 'Cuéntanos qué os quita más tiempo', 'Te respondemos en menos de 24 horas laborables con una primera valoración. Si tiene sentido, hacemos el diagnóstico gratuito de 30 minutos.', '', facts('Cómo funciona', [['Respuesta', 'menos de 24 h'], ['Diagnóstico', '30 min, gratis'], ['Compromiso', 'Ninguno'], ['Zona', 'Toda España'], ['Presencial', 'Región de Murcia']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split">
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px)">${FORM_CONTACTO}</div>
 <div class="tc-prose tc-reveal" style="gap:26px">
  <div style="display:grid;gap:10px">${eyebrow('Correo directo')}<a class="tc-mail" href="mailto:info@transformaconia.com">info@transformaconia.com</a><p>Si lo prefieres, escríbenos directamente. Llega al mismo sitio.</p></div>
  <div style="display:grid;gap:12px">${eyebrow('Qué pasa después')}${list(['Leemos tu mensaje y te respondemos en menos de 24 horas laborables', 'Si encaja, hacemos una videollamada de 30 minutos, gratis', 'Te enviamos por escrito qué automatizaríamos, cómo y un precio orientativo'])}</div>
  <div style="display:grid;gap:10px">${eyebrow('Dónde')}<p>Somos un equipo de Murcia y trabajamos en remoto con empresas de toda España. Si estás en la Región de Murcia y prefieres vernos en persona, lo organizamos.</p></div>
 </div></div></section>`),
};

P['consultor-ia-murcia'] = {
  title: 'Agencia de IA en Murcia',
  seo: ['Agencia de inteligencia artificial en Murcia | Transforma con IA', 'Agencia de IA y automatización en Murcia: chatbots, agentes, automatización de procesos y herramientas a medida para empresas de la Región de Murcia. Visitas presenciales.', 'agencia inteligencia artificial Murcia'],
  html: page(`${pagehead('<span>Agencia de IA en Murcia</span>', 'Región de Murcia', 'Agencia de inteligencia artificial y automatización en Murcia', 'Automatizaciones, agentes de IA y herramientas a medida para empresas de Murcia, Cartagena, Lorca, Molina de Segura y el resto de la región. En remoto o en persona, como prefieras.', btn('/contacto/', 'Pide tu diagnóstico gratis') + btn('/casos/', 'Ver casos', true), facts('Visitas presenciales', [['Murcia', 'Sí'], ['Cartagena', 'Sí'], ['Lorca', 'Sí'], ['Molina de Segura', 'Sí'], ['Resto de la región', 'Sí']]))}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap tc-split"><div class="tc-prose tc-reveal">${eyebrow('Cerca de ti')}<h2>IA aplicada a la empresa murciana, con un equipo al que puedes ver en persona</h2><p>Muchas empresas de la región quieren aprovechar la inteligencia artificial pero no saben por dónde empezar ni en quién confiar. Trabajar con alguien cercano facilita lo más importante: entender cómo trabajáis antes de proponer nada.</p><p>El tejido empresarial murciano tiene mucho de industria, distribución, agroalimentación y servicios técnicos. En todos hay tareas repetitivas con documentos y datos que la IA puede quitar de encima.</p></div><div class="tc-box tc-reveal"><h3>Qué podemos hacer juntos</h3>${list(['Automatizar pedidos, facturas y correos', 'Chatbots para atender clientes en la web o WhatsApp', 'Asistentes que consultan tu catálogo o tus manuales', 'Herramientas a medida conectadas a tu ERP', 'Formación práctica en IA para tu equipo'])}</div></div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap">${head('Soluciones', 'Seis formas de empezar')}${servCards()}</div></section>
<section class="tc-sec"><div class="tc-wrap">${head('Preguntas frecuentes', 'IA para empresas de Murcia')}${faq([
    ['¿Hacéis visitas presenciales en Murcia?', 'Sí. En la Región de Murcia podemos vernos en tu empresa para entender el proceso. El resto del proyecto se trabaja en remoto para que sea más ágil y económico.'],
    ['¿Trabajáis con empresas de fuera de la región?', 'Sí, con empresas de toda España en remoto, por videollamada.'],
    ['¿Cuánto cuesta empezar?', 'El diagnóstico es gratis. Como referencia orientativa, una automatización parte de 450 € + IVA, un chatbot o agente de 900 € y una herramienta a medida de 2.500 €.'],
  ])}</div></section>
${band('¿Eres de la Región de Murcia?', 'Escríbenos y nos tomamos un café para ver qué se puede automatizar en tu empresa.')}`),
};

P['boletin'] = {
  title: 'Boletín de IA',
  seo: ['Boletín semanal de inteligencia artificial para empresas | Transforma con IA', 'Cada lunes y gratis, las noticias de IA que importan a una empresa explicadas en cinco minutos, con qué hacer con cada una. Baja en un clic.', 'boletín inteligencia artificial'],
  html: page(`${pagehead('<span>Boletín</span>', 'Boletín semanal · gratis', 'Mantente al día en IA sin perder la mañana', 'Cada lunes, las noticias de inteligencia artificial que de verdad afectan a una empresa, explicadas en cinco minutos y con qué hacer con cada una. Gratis y sin relleno.', btn('#apuntate', 'Apuntarme gratis'))}
<section class="tc-sec tc-sec--tight" id="apuntate"><div class="tc-wrap tc-split">
 <div class="tc-box tc-reveal" style="padding:clamp(22px,3vw,36px);gap:18px"><p class="tc-msg" id="tc-estado" role="status"></p><span class="tc-eyebrow">Gratis</span><h2 style="font-size:26px">Apúntate al boletín</h2><p>Lo esencial de la semana en cinco minutos.</p>${FORM_BOLETIN('tc-bol-pag')}</div>
 <div class="tc-prose tc-reveal" style="gap:14px">${eyebrow('Últimos temas')}<p>Lo que hemos contado estos días:</p><div class="tc-hero__panel" style="animation:none">[tc_ticker n=5]</div></div>
</div></section>
<section class="tc-sec tc-sec--alt"><div class="tc-wrap"><div class="tc-grid tc-grid--3">
 <div class="tc-box tc-reveal">${icon('reloj')}<h3>5 minutos</h3><p>Lo esencial de la semana, sin tener que leer veinte webs.</p></div>
 <div class="tc-box tc-reveal">${icon('tuerca')}<h3>Para empresas</h3><p>Cada noticia con su aplicación práctica para un negocio.</p></div>
 <div class="tc-box tc-reveal">${icon('escudo')}<h3>Sin spam</h3><p>Un correo a la semana. Te das de baja con un clic cuando quieras.</p></div>
</div></div></section>`),
};

P['privacidad'] = {
  id: 3, title: 'Política de privacidad',
  seo: ['Política de privacidad | Transforma con IA', 'Qué datos recogemos en transformaconia.com, para qué los usamos y cómo ejercer tus derechos.', ''],
  html: page(`${pagehead('<span>Privacidad</span>', 'Legal', 'Política de privacidad', 'Qué datos recogemos, para qué y cómo puedes ejercer tus derechos. Sin letra pequeña.')}
<section class="tc-sec tc-sec--tight"><div class="tc-wrap"><div class="tc-prose" style="max-width:820px;gap:22px">
<div class="tc-prose"><h3>Responsable</h3><p>Transforma con IA (transformaconia.com). Contacto para cualquier asunto de privacidad: <a class="tc-link" href="mailto:info@transformaconia.com">info@transformaconia.com</a>.</p></div>
<div class="tc-prose"><h3>Qué datos recogemos y para qué</h3><p><b>Formulario de contacto:</b> nombre, empresa, sector, correo y el mensaje que escribes. Los usamos solo para responderte y, si lo pides, preparar un presupuesto. Base legal: tu consentimiento y la aplicación de medidas precontractuales a petición tuya.</p><p><b>Boletín semanal:</b> tu correo electrónico. Lo usamos solo para enviarte el boletín, después de que confirmes la suscripción desde el correo que te enviamos. Base legal: tu consentimiento. Cada boletín incluye un enlace para darte de baja al instante.</p></div>
<div class="tc-prose"><h3>Cuánto tiempo los guardamos</h3><p>Los datos de contacto, mientras dure la relación y un máximo de dos años después del último contacto. Los del boletín, hasta que te des de baja.</p></div>
<div class="tc-prose"><h3>Quién más los trata</h3><p>Para funcionar usamos proveedores que tratan los datos por nuestra cuenta: el alojamiento de la web (Hostinger), el correo electrónico (Google) y la base de datos (Neon, con servidores en Fráncfort, UE). No vendemos ni cedemos tus datos a terceros.</p></div>
<div class="tc-prose"><h3>Cookies</h3><p>Esta web no usa cookies de publicidad ni de seguimiento. Solo pueden instalarse cookies técnicas necesarias para que la web funcione, que no requieren consentimiento.</p></div>
<div class="tc-prose"><h3>Tus derechos</h3><p>Puedes pedir acceso, rectificación, supresión, oposición, limitación y portabilidad de tus datos escribiendo a info@transformaconia.com. Si crees que no los hemos tratado bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).</p></div>
<p style="font-size:14px;color:var(--tc-dim)">Última actualización: 8 de octubre de 2026.</p>
</div></div></section>`),
};

// ======================= PUBLICACIÓN =======================
const solo = process.argv.slice(2);
const BK = '_backups/web-2026-10-08/';
for (const [slug, def] of Object.entries(P)) {
  if (solo.length && !solo.includes(slug)) continue;
  let id = def.id;
  if (!id) {
    const f = await wp('GET', `/wp/v2/pages?slug=${slug}&status=publish,draft&_fields=id`);
    id = f.data?.[0]?.id;
  }
  if (id) {
    const old = await wp('GET', `/wp/v2/pages/${id}?context=edit&_fields=id,slug,content`);
    if (old.data?.content?.raw && !old.data.content.raw.startsWith('<!--tc-->')) fs.writeFileSync(`${BK}page-${id}-antes.html`, old.data.content.raw);
  }
  const [t, d, k] = def.seo;
  const body = { title: def.title, slug, status: 'publish', content: def.html, template: '', comment_status: 'closed', author: 2, meta: { rank_math_title: t, rank_math_description: d, rank_math_focus_keyword: k } };
  const r = id ? await wp('POST', `/wp/v2/pages/${id}`, body) : await wp('POST', '/wp/v2/pages', body);
  console.log(slug, r.status, r.data?.id, r.data?.link || JSON.stringify(r.data).slice(0, 300));
}
