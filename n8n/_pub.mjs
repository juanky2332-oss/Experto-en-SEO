import './lib.mjs';
const body = JSON.parse(process.argv[2]);
const r = await fetch(process.env.N8N_BASE + '/webhook/seo-publicador', { method: 'POST', headers: { 'X-Seo-Key': process.env.SEO_GATEWAY_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
console.log(r.status, await r.text());
