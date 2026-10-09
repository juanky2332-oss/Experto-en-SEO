// Sube capturas con nombres de empresa ficticios (CLIENTE DEMO, VetDemo) y actualiza web-capturas.json
import fs from 'node:fs';
import { gw } from './gw.mjs';
const SRC = process.argv[2];
const IMG = JSON.parse(fs.readFileSync('n8n/web-capturas.json', 'utf8'));
const F = { facturas: 'facturas-demo.webp', cobros: 'cobros-demo.webp', veterinaria: 'veterinaria-demo.webp' };
for (const [k, f] of Object.entries(F)) {
  const r = await gw({ action: 'media', filename: `${k === 'veterinaria' ? 'software-clinicas' : 'erp-metal-ia-' + k}-demo.webp`, mime: 'image/webp', base64: fs.readFileSync(SRC + f).toString('base64') });
  console.log(k, r.status, r.data?.source_url);
  if (r.data?.source_url) IMG[k] = r.data.source_url;
}
fs.writeFileSync('n8n/web-capturas.json', JSON.stringify(IMG, null, 1));
