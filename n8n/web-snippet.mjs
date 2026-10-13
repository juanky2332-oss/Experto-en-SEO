// Sube wordpress/web-transformaconia.php como snippet «Transforma · diseño de la web» y comprueba la web.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { wp } from './gw.mjs';
const IDS = 'n8n/web-ids.json';
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
// El CSS (wordpress/web-transformaconia.css) se incrusta como texto con su hash: el snippet lo escribe en uploads/tc/ y lo sirve con wp_enqueue_style
const css = fs.readFileSync('wordpress/web-transformaconia.css', 'utf8');
if (css.includes('\nTCCSS')) throw new Error('el CSS contiene el cierre del nowdoc');
const ver = crypto.createHash('md5').update(css).digest('hex').slice(0, 10);
const fuente = fs.readFileSync('wordpress/web-transformaconia.php', 'utf8');
if (!fuente.includes('/*@@TC_CSS@@*/')) throw new Error('falta el marcador /*@@TC_CSS@@*/');
const code = fuente.replace('/*@@TC_CSS@@*/', () => "define( 'TC_CSS_VER', '" + ver + "' );\nfunction tc_css_texto() {\n\treturn <<<'TCCSS'\n" + css.replace(/\n$/, '') + "\nTCCSS;\n}");
console.log('css', css.length, 'bytes, ver', ver);
const ok = async () => { for (const u of ['/', '/openai-devday-agentes-codex/', '/blog/']) { const s = (await fetch('https://transformaconia.com' + u + '?nocache=' + Date.now())).status; if (s >= 500) return false; } return true; };
let id = ids.snippet, antes = null;
if (id) { antes = (await wp('GET', `code-snippets/v1/snippets/${id}`)).data; fs.writeFileSync(`_backups/snippet-${id}-${Date.now()}.php`, antes.code || ''); }
const r = id ? await wp('POST', `code-snippets/v1/snippets/${id}`, { code })
  : await wp('POST', 'code-snippets/v1/snippets', { name: 'Transforma · diseño de la web', desc: 'Portada, páginas de soluciones, pie, CTA de artículos, textos en español y datos estructurados. Fuente: wordpress/web-transformaconia.php', code, scope: 'global', active: false, priority: 10 });
console.log('guardado', r.status, r.data.id, JSON.stringify(r.data.code_error || ''));
id = r.data.id; ids.snippet = id; fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
if (!r.data.active) { const a = await wp('POST', `code-snippets/v1/snippets/${id}/activate`); console.log('activado', a.status, a.data.active, JSON.stringify(a.data.code_error || '')); }
if (!(await ok())) {
  if (antes) await wp('POST', `code-snippets/v1/snippets/${id}`, { code: antes.code }); else await wp('POST', `code-snippets/v1/snippets/${id}/deactivate`);
  console.log('¡ERROR 500! revertido');
} else console.log('web OK');
