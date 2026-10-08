// Cambia los enlaces a artículos retirados (2026-10-08) por su destino de redirección, en todos los artículos.
import fs from 'node:fs';
import { wp } from './gw.mjs';

const red = (await wp('GET', 'experto-seo/v1/redirecciones')).data || {};
const fijas = ['/blog-2/', '/privacy-policy/', '/blog-dark', '/author/', '/inicio/', '/servicios/', '/aviso-legal/', '/sobre-mi/'];
const retirados = Object.entries(red).filter(([de]) => !fijas.some((f) => de.startsWith(f)));
let total = 0;
for (let pg = 1; pg < 4; pg++) {
  const r = await wp('GET', `/wp/v2/posts?per_page=50&page=${pg}&status=publish&context=edit&_fields=id,title,content`);
  if (!Array.isArray(r.data) || !r.data.length) break;
  for (const p of r.data) {
    let c = p.content.raw;
    let n = 0;
    for (const [de, a] of retirados) {
      for (const comilla of ['"', "'"]) {
        for (const base of ['https://transformaconia.com', 'http://transformaconia.com']) {
          for (const ruta of [de, de.replace(/\/$/, '')]) {
            const viejo = comilla + base + ruta + comilla;
            if (c.includes(viejo)) { n += c.split(viejo).length - 1; c = c.split(viejo).join(comilla + a + comilla); }
          }
        }
      }
    }
    if (!n) continue;
    fs.writeFileSync(`_backups/web-2026-10-08/post-${p.id}-enlaces.html`, p.content.raw);
    const w = await wp('POST', `/wp/v2/posts/${p.id}`, { content: c });
    total += n;
    console.log(p.id, w.status, n, 'enlaces ·', p.title.raw);
  }
}
console.log('enlaces cambiados:', total);
