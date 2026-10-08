// Menú, URLs, redirecciones, autor y ajustes generales de transformaconia.com (rediseño 2026-10-08).
import { wp, gw } from './gw.mjs';
const log = (...a) => console.log(...a);
// 1) URLs: el blog pasa a /blog/ (Contacto ya está en /contacto/)
log('blog', (await wp('POST', '/wp/v2/pages/314', { slug: 'blog', title: 'Noticias de IA' })).data.link);
// 2) demos del tema fuera
for (const id of [5765, 5835]) log('demo', id, (await wp('POST', `/wp/v2/pages/${id}`, { status: 'draft' })).data.status);
// 3) autores: sin correo personal
log('user2', (await wp('POST', '/wp/v2/users/2', { slug: 'redaccion', name: 'Redacción Transforma con IA', first_name: 'Redacción', last_name: 'Transforma con IA', nickname: 'Redacción Transforma con IA', description: 'Equipo de Transforma con IA: compañeros de Murcia dedicados a la inteligencia artificial y la automatización. Contamos la actualidad de la IA cada mañana y la aplicamos en empresas de toda España.', url: 'https://transformaconia.com/quienes-somos/' })).data.slug);
log('user1', (await wp('POST', '/wp/v2/users/1', { slug: 'transforma-con-ia', name: 'Transforma con IA', nickname: 'Transforma con IA', first_name: 'Transforma', last_name: 'con IA' })).data.slug);
const pages = (await wp('GET', '/wp/v2/pages?per_page=100&status=publish&author=1&_fields=id')).data || [];
for (const p of pages) await wp('POST', `/wp/v2/pages/${p.id}`, { author: 2 });
log('páginas reasignadas', pages.length);
// 4) lema
log('lema', (await wp('POST', '/wp/v2/settings', { description: 'Noticias de IA y automatización para empresas' })).data.description);
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
});
log('redirecciones', Object.keys((await wp('POST', 'experto-seo/v1/redirecciones', red)).data).length);
// 6) menú principal
const MENU = 2;
await wp('POST', `/wp/v2/menus/${MENU}`, { name: 'Principal', locations: ['top_nav'] });
const viejos = (await wp('GET', `/wp/v2/menu-items?menus=${MENU}&per_page=100&_fields=id`)).data || [];
for (const v of viejos) await wp('DELETE', `/wp/v2/menu-items/${v.id}?force=true`);
const S = 'https://transformaconia.com';
const arbol = [
  ['Noticias', '/blog/', [['Todas las noticias', '/blog/'], ['Noticias de IA', '/category/noticias-ia/'], ['Guías prácticas', '/category/guias-ia/'], ['Herramientas de IA', '/category/servicios-y-herramientas-de-ia/'], ['Trucos y consejos', '/category/trucos-y-consejos-ia/'], ['Automatización y agentes', '/category/automatizacion/'], ['IA en la empresa', '/category/sobre-la-ia/'], ['Boletín semanal', '/boletin/']]],
  ['Soluciones', '/soluciones/', [['Cómo trabajamos y precios', '/soluciones/'], ['Automatización de procesos', '/automatizacion-procesos-ia/'], ['Agentes y chatbots de IA', '/agentes-chatbots-ia/'], ['Herramientas a medida', '/desarrollo-a-medida-ia/'], ['Programa de gestión con IA', '/gestion/'], ['Noticias y páginas automáticas', '/contenido-automatico-ia/'], ['IA para la industria', '/sectores-industriales/']]],
  ['Casos de éxito', '/casos/'],
  ['Quiénes somos', '/quienes-somos/'],
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
