import fs from 'node:fs';
import { wp } from './gw.mjs';
const defs = [
  ['Experto SEO · Rank Math en la API REST', 'wordpress/rankmath-rest.php', 'Creado por la app Experto en SEO. Permite leer/editar título SEO, meta description y keyword de Rank Math desde la API.'],
  ['Experto SEO · llms.txt para buscadores de IA', 'wordpress/llms-txt.php', 'Creado por la app Experto en SEO. Sirve /llms.txt con el índice del sitio para ChatGPT, Claude, Perplexity y Gemini.'],
];
const home = async () => (await fetch('https://transformaconia.com/?nocache=' + Date.now())).status;
console.log('home antes:', await home());
for (const [name, file, desc] of defs) {
  const code = fs.readFileSync(file, 'utf8');
  const c = await wp('POST', 'code-snippets/v1/snippets', { name, desc, code, scope: 'global', active: false, priority: 10 });
  console.log('creado', c.status, c.data.id, c.data.code_error || '');
  const a = await wp('POST', `code-snippets/v1/snippets/${c.data.id}/activate`);
  console.log('activado', a.status, a.data && a.data.active, JSON.stringify(a.data && a.data.code_error || ''));
  const h = await home();
  console.log('home después:', h);
  if (h >= 500) { await wp('POST', `code-snippets/v1/snippets/${c.data.id}/deactivate`); console.log('¡desactivado por seguridad!'); break; }
}
