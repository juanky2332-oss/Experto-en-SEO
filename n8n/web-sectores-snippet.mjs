// Sube wordpress/sectores-migas.php como snippet propio (migas de las páginas de sector). Revierte si hay 5xx.
// Independiente del snippet #13. Si la web da error 5xx tras activarlo, lo desactiva (o restaura la versión anterior).
import fs from 'node:fs';
import { wp } from './gw.mjs';
const IDS = 'n8n/web-sectores-id.json';
const ids = fs.existsSync(IDS) ? JSON.parse(fs.readFileSync(IDS, 'utf8')) : {};
const code = fs.readFileSync('wordpress/sectores-migas.php', 'utf8');
const ok = async () => { for (const u of ['/', '/blog/', '/contacto/', '/industria/', '/distribucion-industrial/']) { const s = (await fetch('https://transformaconia.com' + u + '?nocache=' + Date.now())).status; if (s >= 500) return false; } return true; };
let id = ids.snippet, antes = null;
if (id) { antes = (await wp('GET', `code-snippets/v1/snippets/${id}`)).data; fs.writeFileSync(`_backups/snippet-sectores-${id}-${Date.now()}.php`, antes.code || ''); }
const r = id ? await wp('POST', `code-snippets/v1/snippets/${id}`, { code })
  : await wp('POST', 'code-snippets/v1/snippets', { name: 'Transforma · migas de sectores', desc: 'Migas Inicio > Industria > sector. Fuente: wordpress/sectores-migas.php', code, scope: 'global', active: false, priority: 10 });
console.log('guardado', r.status, r.data.id, JSON.stringify(r.data.code_error || ''));
id = r.data.id; ids.snippet = id; fs.writeFileSync(IDS, JSON.stringify(ids, null, 1));
if (r.data.code_error) { console.log('¡el código tiene errores; no se activa!'); process.exit(1); }
if (!r.data.active) { const a = await wp('POST', `code-snippets/v1/snippets/${id}/activate`); console.log('activado', a.status, a.data.active, JSON.stringify(a.data.code_error || '')); }
if (!(await ok())) {
  if (antes) await wp('POST', `code-snippets/v1/snippets/${id}`, { code: antes.code }); else await wp('POST', `code-snippets/v1/snippets/${id}/deactivate`);
  console.log('¡ERROR 5xx! revertido');
} else console.log('web OK');
