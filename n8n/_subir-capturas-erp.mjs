// Sube capturas del programa de gestión (metal) a WordPress y las añade a web-capturas.json
import fs from 'node:fs';
import { gw } from './gw.mjs';
const DIR = '../LANDING ERP/transformaconia-gestion/capturas/';
const F = { calculadora: 'calculadora.webp', inicio: 'inicio.webp', movil: 'm-inicio.webp' };
const IMG = JSON.parse(fs.readFileSync('n8n/web-capturas.json', 'utf8'));
for (const [k, f] of Object.entries(F)) {
  if (IMG['erp_' + k]) continue;
  const r = await gw({ action: 'media', filename: `erp-metal-ia-${k}.webp`, mime: 'image/webp', base64: fs.readFileSync(DIR + f).toString('base64') });
  console.log(k, r.status, r.data?.source_url || JSON.stringify(r).slice(0, 200));
  if (r.data?.source_url) IMG['erp_' + k] = r.data.source_url;
}
fs.writeFileSync('n8n/web-capturas.json', JSON.stringify(IMG, null, 1));
