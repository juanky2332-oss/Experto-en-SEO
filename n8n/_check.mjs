// Comprueba la sintaxis JS de todos los Code nodes de un flujo generado.
import fs from 'node:fs';
const wf = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
let mal = 0;
for (const n of wf.nodes) if (n.type === 'n8n-nodes-base.code') {
  try { new Function('$', '$input', '$json', 'return (async () => {' + n.parameters.jsCode + '\n})'); }
  catch (e) { mal++; console.log('✗', n.name, e.message); }
}
console.log(mal ? mal + ' con errores' : 'sintaxis OK (' + wf.nodes.filter(n => n.type === 'n8n-nodes-base.code').length + ' Code nodes)');
