// Cambia la caja «Sobre el autor» antigua (con <strong>, ilegible sobre fondo oscuro) por la actual
// en todos los artículos. Conserva el CTA de cada uno. Queda en el historial (deshacer desde la app).
// Uso: node --env-file=.env.local n8n/caja-autor.mjs [--aplicar]
import { wp, sql, registrar } from './comun.mjs';
import { ponerCajaAutor } from '../src/lib/guia-base.ts';

const aplicar = process.argv.includes('--aplicar');
const posts = [];
for (let page = 1; ; page++) {
  const r = await wp('GET', `wp/v2/posts?per_page=100&page=${page}&status=publish,draft,future,pending&context=edit&_fields=id,title,content,status`);
  if (r.status !== 200 || !Array.isArray(r.data) || !r.data.length) break;
  posts.push(...r.data);
  if (r.data.length < 100) break;
}
let n = 0;
for (const p of posts) {
  const antes = p.content.raw;
  if (!/<aside class="tca-autor"/.test(antes)) continue;
  const despues = ponerCajaAutor(antes);
  if (despues === antes) continue;
  n++;
  console.log(`${aplicar ? 'cambio' : 'cambiaría'} #${p.id} [${p.status}] ${p.title.raw}`);
  if (!aplicar) continue;
  const w = await wp('POST', `wp/v2/posts/${p.id}`, { content: despues });
  if (w.status !== 200) { console.log('  ✗ WordPress', w.status); continue; }
  await registrar({ action: 'editar', id: p.id, summary: `Caja de autor legible (nuevo formato) — «${p.title.raw}»`, before: { content: antes } });
}
console.log(`${posts.length} artículos revisados · ${n} ${aplicar ? 'actualizados' : 'por actualizar (usa --aplicar)'}`);
await sql.end();
