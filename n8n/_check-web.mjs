// Comprobación de la web publicada: purga caché, busca textos prohibidos, redirecciones y datos estructurados.
// Uso: node --env-file=.env.local n8n/_check-web.mjs
import { wp } from './gw.mjs';
console.log('purga', (await wp('POST', 'tc/v1/purgar', {})).status);
const S = 'https://transformaconia.com';
const PAGS = ['/', '/industria/', '/erp-industria/', '/distribucion-industrial/', '/otros-sectores/', '/soluciones/', '/automatizacion-procesos-ia/', '/agentes-chatbots-ia/', '/gestion-documental-ia/', '/desarrollo-a-medida-ia/', '/contenido-automatico-ia/', '/diseno-web/', '/casos/', '/quienes-somos/', '/contacto/', '/consultor-ia-murcia/', '/blog/'];
const PROHIBIDO = /n8n|Claude|Anthropic|OpenAI|Gemini|Zapier|para el metal|ERP metal|erp-metal|automatización falla|Calculadora de mecanizado/gi;
for (const u of PAGS) {
  const r = await fetch(S + u + '?nc=' + Date.now());
  const h = await r.text();
  const vis = h.replace(/<script[\s\S]*?<\/script>/g, (m) => (/ld\+json/.test(m) ? m : '')).replace(/https?:\/\/paneln8n[^"']*/g, '');
  const malos = [...new Set((vis.match(PROHIBIDO) || []).map((x) => x.toLowerCase()))];
  const tipos = [...h.matchAll(/"@type":"([A-Za-z]+)"/g)].map((m) => m[1]);
  console.log(r.status, u, malos.length ? 'PROHIBIDO: ' + malos.join(', ') : 'limpio', '| schema:', [...new Set(tipos)].filter((t) => /FAQ|Software|Professional|Breadcrumb/.test(t)).join(','));
}
for (const u of ['/erp-metal/', '/gestion/', '/erp/']) {
  const r = await fetch(S + u, { redirect: 'manual' });
  console.log('redirección', u, r.status, r.headers.get('location'));
}
