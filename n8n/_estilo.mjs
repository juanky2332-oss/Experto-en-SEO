// Sube wordpress/estilo-editorial.php al snippet #12 (estilo editorial del blog) y comprueba la web.
import fs from 'node:fs';
import { wp } from './gw.mjs';
const ID = 12;
const code = fs.readFileSync('wordpress/estilo-editorial.php', 'utf8');
const antes = await wp('GET', `code-snippets/v1/snippets/${ID}`);
console.log('snippet', ID, antes.status, antes.data.name, 'activo:', antes.data.active);
fs.writeFileSync('_backups/snippet-12-' + Date.now() + '.php', antes.data.code || '');
const r = await wp('POST', `code-snippets/v1/snippets/${ID}`, { code });
console.log('actualizado', r.status, JSON.stringify(r.data.code_error || ''), 'activo:', r.data.active);
const h = (await fetch('https://transformaconia.com/?nocache=' + Date.now())).status;
console.log('home:', h);
if (h >= 500) { await wp('POST', `code-snippets/v1/snippets/${ID}`, { code: antes.data.code }); console.log('¡restaurado por seguridad!'); }
