// Exporta el logo nuevo: cabecera (transparente, x3), icono 512 y versión para fondo claro.
const fs = require('fs');
const puppeteer = require('C:/Users/juank/OneDrive/Desktop/PROYECTOS CLAUDE/ERP MUESTRA/node_modules/puppeteer-core');
const DIR = 'C:/Users/juank/OneDrive/Desktop/PROYECTOS CLAUDE/EXPERTO EN SEO/wordpress/marca/';
const svg = fs.readFileSync(DIR + 'simbolo.svg', 'utf8');
const css = `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@500;700&display=swap" rel="stylesheet"><style>
html,body{margin:0;background:transparent;font-family:Poppins}
.lk{display:inline-flex;align-items:center;gap:13px;padding:2px}
.lk svg{width:52px;height:52px;flex:none}
.w{font-weight:700;font-size:31px;letter-spacing:-.02em;color:#fff;line-height:1;white-space:nowrap}
.w em{font-style:normal;font-weight:500;color:#cdbfdc}
.w b{background:linear-gradient(100deg,#e08bff,#b020ff 60%,#7b5cff);-webkit-background-clip:text;background-clip:text;color:transparent}
.claro .w{color:#15101b}.claro .w em{color:#5a5066}
.ico svg{width:512px;height:512px;display:block}
</style>`;
const piezas = [
  ['logo-cabecera.png', `<span class="lk" id="x">${svg}<span class="w">Transforma <em>con</em> <b>IA</b></span></span>`, 3],
  ['logo-fondo-claro.png', `<span class="lk claro" id="x">${svg}<span class="w">Transforma <em>con</em> <b>IA</b></span></span>`, 3],
  ['icono-512.png', `<span class="ico" id="x" style="display:inline-block">${svg}</span>`, 1],
];
(async () => {
  const b = await puppeteer.launch({ executablePath: 'C:/Users/juank/.cache/puppeteer/chrome/win64-145.0.7632.67/chrome-win64/chrome.exe', headless: 'new' });
  for (const [nombre, html, esc] of piezas) {
    const p = await b.newPage();
    await p.setViewport({ width: 900, height: 600, deviceScaleFactor: esc });
    await p.setContent(`<!doctype html><html><head>${css}</head><body>${html}</body></html>`, { waitUntil: 'networkidle0' });
    await p.evaluate(() => document.fonts.ready);
    const el = await p.$('#x');
    await el.screenshot({ path: DIR + nombre, omitBackground: true });
    const bb = await el.boundingBox();
    console.log(nombre, Math.round(bb.width * esc) + 'x' + Math.round(bb.height * esc));
    await p.close();
  }
  await b.close();
})();
