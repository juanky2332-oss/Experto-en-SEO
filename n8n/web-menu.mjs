// Solo el menú principal (extraído de web-estructura.mjs, sin tocar redirecciones ni autores). Uso: node --env-file=.env.local n8n/web-menu.mjs
import { wp } from './gw.mjs';
const log = console.log;
const MENU = 2;
await wp('POST', `/wp/v2/menus/${MENU}`, { name: 'Principal', locations: ['top_nav'] });
const viejos = (await wp('GET', `/wp/v2/menu-items?menus=${MENU}&per_page=100&_fields=id`)).data || [];
for (const v of viejos) await wp('DELETE', `/wp/v2/menu-items/${v.id}?force=true`);
const S = 'https://transformaconia.com';
const arbol = [
  ['Industria', '/industria/', [['IA para la industria', '/industria/'], ['Talleres industriales', '/industria/#talleres'], ['Distribución industrial', '/distribucion-industrial/'], ['Mantenimiento industrial', '/industria/#mantenimiento'], ['Instaladoras', '/industria/#instaladoras'], ['Consultoría de IA en Murcia', '/consultor-ia-murcia/'], ['Dónde trabajamos', '/consultor-ia-murcia/#donde-trabajamos']]],
  ['Soluciones', '/soluciones/', [['ERP para la industria', '/erp-industria/'], ['Automatización de procesos', '/automatizacion-procesos-ia/'], ['Asistentes técnicos y chatbots', '/agentes-chatbots-ia/'], ['Gestión documental con IA', '/gestion-documental-ia/'], ['Herramientas a medida y SAP', '/desarrollo-a-medida-ia/'], ['Cómo trabajamos y precios', '/soluciones/']]],
  ['ERP industria', '/erp-industria/'],
  ['Casos', '/casos/', [['Casos', '/casos/'], ['Otros sectores', '/otros-sectores/'], ['Quiénes somos', '/quienes-somos/']]],
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
