// Sube wordpress/llms-txt.php al snippet #9 y comprueba /llms.txt
import fs from 'node:fs';
import { wp } from './gw.mjs';
const antes = await wp('GET', 'code-snippets/v1/snippets/9');
fs.writeFileSync('_backups/snippet-9-' + Date.now() + '.php', antes.data.code || '');
const r = await wp('POST', 'code-snippets/v1/snippets/9', { code: fs.readFileSync('wordpress/llms-txt.php', 'utf8') });
console.log('snippet 9', r.status, JSON.stringify(r.data.code_error || ''));
const t = await fetch('https://transformaconia.com/llms.txt?nc=' + Date.now());
if (t.status >= 500) { await wp('POST', 'code-snippets/v1/snippets/9', { code: antes.data.code }); console.log('revertido'); }
else console.log((await t.text()).slice(0, 1600));
