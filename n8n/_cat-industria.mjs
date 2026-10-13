import { wp } from './gw.mjs';
const ex = await wp('GET', '/wp/v2/categories?slug=ia-en-la-industria');
const body = { name: 'IA en la industria', slug: 'ia-en-la-industria', description: 'Casos reales de empresas industriales que aplican IA en fabricación, mantenimiento, distribución y logística: qué hicieron, qué ganaron y qué puedes copiar.' };
const r = ex.data?.[0] ? await wp('POST', `/wp/v2/categories/${ex.data[0].id}`, body) : await wp('POST', '/wp/v2/categories', body);
console.log(r.status, r.data.id, r.data.link);
