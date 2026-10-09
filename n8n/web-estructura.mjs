// Menú, URLs, redirecciones, autor y ajustes generales de transformaconia.com (rediseño 2026-10-08; v4 industria 2026-10-09).
import { wp, gw } from './gw.mjs';
const log = (...a) => console.log(...a);
// 1) URLs: el blog pasa a /blog/ (Contacto ya está en /contacto/)
log('blog', (await wp('POST', '/wp/v2/pages/314', { slug: 'blog', title: 'Noticias de IA' })).data.link);
// 2) demos del tema fuera
for (const id of [5765, 5835, 7108]) log('demo', id, (await wp('POST', `/wp/v2/pages/${id}`, { status: 'draft' })).data.status);
// 3) autores: sin correo personal
log('user2', (await wp('POST', '/wp/v2/users/2', { slug: 'redaccion', name: 'Redacción Transforma con IA', first_name: 'Redacción', last_name: 'Transforma con IA', nickname: 'Redacción Transforma con IA', description: 'Equipo de Transforma con IA: compañeros de Murcia dedicados a la inteligencia artificial y la automatización. Contamos la actualidad de la IA cada mañana y la aplicamos en empresas de toda España.', url: 'https://transformaconia.com/quienes-somos/' })).data.slug);
log('user1', (await wp('POST', '/wp/v2/users/1', { slug: 'transforma-con-ia', name: 'Transforma con IA', nickname: 'Transforma con IA', first_name: 'Transforma', last_name: 'con IA' })).data.slug);
const pages = (await wp('GET', '/wp/v2/pages?per_page=100&status=publish&author=1&_fields=id')).data || [];
for (const p of pages) await wp('POST', `/wp/v2/pages/${p.id}`, { author: 2 });
log('páginas reasignadas', pages.length);
// 4) lema
log('lema', (await wp('POST', '/wp/v2/settings', { description: 'Consultoría de IA y automatización de procesos para la industria' })).data.description);
// 5) redirecciones (se fusionan con las existentes)
const red = (await wp('GET', 'experto-seo/v1/redirecciones')).data || {};
Object.assign(red, {
  '/blog-2/': 'https://transformaconia.com/blog/',
  '/privacy-policy/': 'https://transformaconia.com/privacidad/',
  '/blog-dark-landing/': 'https://transformaconia.com/',
  '/blog-dark-all-posts/': 'https://transformaconia.com/blog/',
  '/author/publica_noticias_n8n/': 'https://transformaconia.com/author/redaccion/',
  '/author/juan-carlos-ros/': 'https://transformaconia.com/author/redaccion/',
  '/sobre-mi/': 'https://transformaconia.com/quienes-somos/',
  '/author/juancarlosrosbautistagmail-com/': 'https://transformaconia.com/quienes-somos/',
  '/inicio/': 'https://transformaconia.com/',
  '/servicios/': 'https://transformaconia.com/soluciones/',
  '/aviso-legal/': 'https://transformaconia.com/privacidad/',
  '/gestion/': 'https://transformaconia.com/erp-metal/',
  '/boletin/': 'https://transformaconia.com/blog/',
  '/sectores-industriales/': 'https://transformaconia.com/industria/',
  '/erp/': 'https://transformaconia.com/erp-metal/',
  '/sectores/': 'https://transformaconia.com/industria/',
});
log('redirecciones', Object.keys((await wp('POST', 'experto-seo/v1/redirecciones', red)).data).length);
// 6) menú principal
const MENU = 2;
await wp('POST', `/wp/v2/menus/${MENU}`, { name: 'Principal', locations: ['top_nav'] });
const viejos = (await wp('GET', `/wp/v2/menu-items?menus=${MENU}&per_page=100&_fields=id`)).data || [];
for (const v of viejos) await wp('DELETE', `/wp/v2/menu-items/${v.id}?force=true`);
const S = 'https://transformaconia.com';
const arbol = [
  ['Industria', '/industria/', [['IA para la industria', '/industria/'], ['Metal y mecanizado', '/industria/#metal'], ['Distribución industrial', '/distribucion-industrial/'], ['Mantenimiento industrial', '/industria/#mantenimiento'], ['Instaladoras', '/industria/#instaladoras'], ['Consultoría de IA en Murcia', '/consultor-ia-murcia/']]],
  ['Soluciones', '/soluciones/', [['ERP para el metal', '/erp-metal/'], ['Automatización de procesos', '/automatizacion-procesos-ia/'], ['Asistentes técnicos y chatbots', '/agentes-chatbots-ia/'], ['Gestión documental con IA', '/gestion-documental-ia/'], ['Herramientas a medida y SAP', '/desarrollo-a-medida-ia/'], ['Contenido automático', '/contenido-automatico-ia/'], ['Diseño web', '/diseno-web/'], ['Cómo trabajamos y precios', '/soluciones/']]],
  ['ERP metal', '/erp-metal/'],
  ['Casos', '/casos/', [['Casos de éxito', '/casos/'], ['Otros sectores', '/otros-sectores/'], ['Quiénes somos', '/quienes-somos/']]],
  ['Blog', '/blog/', [['IA en la industria', '/category/ia-en-la-industria/'], ['Todo el blog', '/blog/'], ['Noticias de IA', '/category/noticias-ia/'], ['Guías prácticas', '/category/guias-ia/'], ['Trucos y consejos', '/category/trucos-y-consejos-ia/'], ['Automatización y agentes', '/category/automatizacion/'], ['IA en la empresa', '/category/sobre-la-ia/']]],
  ['Diagnóstico gratis', '/contacto/', null, ['tc-menu-cta']],
];
let orden = 1;
for (const [t, u, hijos, clases] of arbol) {
  const r = await wp('POST', '/wp/v2/menu-items', { title: t, url: S + u, menus: MENU, menu_order: orden++, status: 'publish', type: 'custom', classes: clases || [] });
  log('menú', t, r.status, r.data.id);
  for (const [ht, hu] of hijos || []) {
    const h = await wp('POST', '/wp/v2/menu-items', { title: ht, url: S + hu, menus: MENU, parent: r.data.id, menu_order: orden++, status: 'publish', type: 'custom' });
    if (h.status >= 300) log('  error', ht, JSON.stringify(h.data).slice(0, 200));
  }
}
log('ubicaciones', JSON.stringify((await wp('GET', '/wp/v2/menu-locations/top_nav')).data.menu));
