// Sustituye las cajas de autor con comillas simples (formato muy antiguo) por la actual.
import fs from 'node:fs';
import { wp } from './gw.mjs';
import { cajaAutor } from '../src/lib/guia-base.ts';
for (const id of [6576, 6146, 329]) {
  const p = (await wp('GET', `/wp/v2/posts/${id}?context=edit&_fields=id,content`)).data;
  fs.writeFileSync(`_backups/web-2026-10-08/post-${id}-caja.html`, p.content.raw);
  const c = p.content.raw.replace(/<aside class='tca-autor'>[\s\S]*?<\/aside>/, cajaAutor());
  const r = await wp('POST', `/wp/v2/posts/${id}`, { content: c });
  console.log(id, r.status, /Juan Carlos/.test(c) ? 'SIGUE' : 'limpio');
}
