// Retira (papelera) artículos antiguos fuera de tema y redirige su URL a la categoría (2026-10-08).
import fs from 'node:fs';
import { wp } from './gw.mjs';
const IDS = [5893, 6137, 6157, 6181, 6217, 6224, 6273, 6283, 6294, 6095, 6538, 5964, 5981, 6061, 6247, 5941];
const CAT = { 45: '/category/noticias-ia/', 6: '/category/sobre-la-ia/', 7: '/category/servicios-y-herramientas-de-ia/', 46: '/category/guias-ia/', 1: '/category/automatizacion/' };
const posts = JSON.parse(fs.readFileSync('_backups/web-2026-10-08/posts.json', 'utf8'));
const red = (await wp('GET', 'experto-seo/v1/redirecciones')).data || {};
for (const id of IDS) {
  const p = posts.find((x) => x.id === id);
  red[`/${p.slug}/`] = 'https://transformaconia.com' + (CAT[p.categories[0]] || '/blog/');
}
const g = await wp('POST', 'experto-seo/v1/redirecciones', red);
console.log('redirecciones', Object.keys(g.data).length);
for (const id of IDS) { const r = await wp('DELETE', `/wp/v2/posts/${id}`); console.log(id, r.status, r.data?.status); }
