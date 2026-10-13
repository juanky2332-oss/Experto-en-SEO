// Imágenes para compartir (WhatsApp, LinkedIn, Facebook, X): 1200x630 con el logo nuevo.
// Uso: node wordpress/marca/exportar-og.cjs   → og-transformaconia.png y og-gestion.png en esta carpeta
const fs = require('fs');
const puppeteer = require('C:/Users/juank/OneDrive/Desktop/PROYECTOS CLAUDE/ERP MUESTRA/node_modules/puppeteer-core');
const DIR = 'C:/Users/juank/OneDrive/Desktop/PROYECTOS CLAUDE/EXPERTO EN SEO/wordpress/marca/';
const svg = fs.readFileSync(DIR + 'simbolo.svg', 'utf8');
const css = `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700;800&display=swap" rel="stylesheet"><style>
html,body{margin:0}
.og{width:1200px;height:630px;box-sizing:border-box;padding:72px 84px;font-family:Poppins;color:#f4f0f8;position:relative;overflow:hidden;
 background:radial-gradient(800px 500px at 88% 8%,rgba(176,32,255,.42),transparent 60%),radial-gradient(600px 420px at 0% 100%,rgba(91,60,255,.28),transparent 60%),#08070b;display:flex;flex-direction:column;justify-content:space-between}
.og:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:48px 48px;mask-image:linear-gradient(180deg,#000,transparent 85%)}
.og>*{position:relative}
.lk{display:flex;align-items:center;gap:22px}
.lk svg{width:96px;height:96px;flex:none}
.w{font-weight:700;font-size:56px;letter-spacing:-.02em;line-height:1;white-space:nowrap}
.w em{font-style:normal;font-weight:500;color:#cdbfdc}
.grad{background:linear-gradient(100deg,#e08bff,#b020ff 60%,#7b5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
.tag{font-size:20px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#d27bff;margin-left:4px;padding-left:16px;border-left:3px solid #b020ff}
h1{margin:0;font-size:64px;line-height:1.06;font-weight:800;letter-spacing:-.025em;max-width:1000px}
.pie{display:flex;justify-content:space-between;align-items:center;font-size:24px;color:#a9a1b4}
.pie b{color:#f4f0f8;font-weight:600}
</style>`;
const tarjeta = (tag, h1, pie) => `<div class="og" id="x"><div class="lk">${svg}<span class="w">Transforma <em>con</em> <span class="grad">IA</span></span>${tag ? `<span class="tag">${tag}</span>` : ''}</div>
<h1>${h1}</h1><div class="pie">${pie}</div></div>`;
const piezas = [
  ['og-transformaconia.png', tarjeta('', 'Automatización de procesos e IA <span class="grad">para la industria.</span>', '<span>ERP para la industria · Asistentes técnicos · Automatización</span><b>transformaconia.com</b>')],
  ['og-gestion.png', tarjeta('Gestión', 'El ERP con IA <span class="grad">para la industria</span> y otros sectores.', '<span>Costes y margen · Presupuestos · Facturas · Cobros</span><b>Pruébalo 3 meses sin cuota</b>')],
];
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Users/juank/.cache/puppeteer/chrome/win64-145.0.7632.67/chrome-win64/chrome.exe', headless: 'new' });
  for (const [nombre, html] of piezas) {
    const p = await b.newPage();
    await p.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
    await p.setContent(`<!doctype html><html><head>${css}</head><body>${html}</body></html>`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    await (await p.$('#x')).screenshot({ path: DIR + nombre });
    console.log(nombre);
    await p.close();
  }
  await b.close();
})();

// Icono para compartir (2026-10-09, petición: al compartir debe salir el icono de la «T» de la barra de direcciones).
// 600x600, fondo blanco para que las esquinas redondeadas se vean igual en todas las apps.
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Users/juank/.cache/puppeteer/chrome/win64-145.0.7632.67/chrome-win64/chrome.exe', headless: 'new' });
  const p = await b.newPage();
  await p.setViewport({ width: 600, height: 600, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><html><body style="margin:0;background:#fff"><div id="x" style="width:600px;height:600px;display:grid;place-items:center">${svg.replace('<svg ', '<svg style="width:560px;height:560px" ')}</div></body></html>`);
  await (await p.$('#x')).screenshot({ path: DIR + 'icono-compartir.png' });
  console.log('icono-compartir.png');
  await b.close();
})();
