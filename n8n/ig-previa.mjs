// Vista previa de lo que va a salir en Instagram (16-11-2026, pedida por el dueño: «¿puedo ver todo antes de que se suba?»).
// Lee el plan diario (seo.ig_plan) y la cola (seo.ig_cola) y escribe una página con cada día: vídeo, portada y texto exacto,
// más el banco de historias en el orden en que van a salir. Sin enlazar desde ningún sitio y con noindex.
// Uso: node --env-file=.env.local n8n/ig-previa.mjs   →   LANDING ERP/transformaconia-gestion/ig/previa/index.html
//      (luego «vercel deploy --prod» en la landing). Se ve en https://demo.transformaconia.com/ig/previa/
import fs from 'node:fs';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
const plan = await sql`select fecha::text f, titulo, tareas, estado from seo.ig_plan where fecha >= ${hoy}::date order by fecha limit 30`;
const cola = Object.fromEntries((await sql`select * from seo.ig_cola where tipo in ('reel', 'carrusel')`).map((x) => [x.id, x]));
const banco = await sql`select id, titulo, video_url, historia_url, datos from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null order by orden`;
await sql.end();

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const bonita = (f) => { const d = new Date(f + 'T12:00:00'); return `${DIAS[d.getDay()]} ${d.getDate()}-${d.getMonth() + 1}`; };
const ICO = { reel: '🎬', historia: '📲', seguir: '➕', comentar: '💬', preparar: '🛠' };

const pieza = (e) => {
  if (!e) return '<p class="aviso">⚠️ La pieza no está en la cola.</p>';
  const media = e.video_url
    ? `<video controls playsinline preload="none" poster="${esc(e.portada_url ?? '')}"><source src="${esc(e.video_url)}" type="video/mp4"></video>`
    : (e.datos?.imagenes ?? []).length
      ? `<div class="carrusel">${e.datos.imagenes.map((u) => `<img src="${esc(u)}" loading="lazy" alt="">`).join('')}</div>`
      : e.portada_url ? `<img src="${esc(e.portada_url)}" loading="lazy" alt="">` : '';
  return `<div class="pieza"><div class="media">${media}</div><div class="texto"><div class="estado ${esc(e.estado)}">${esc(e.estado)}</div><h3>${esc(e.titulo)}</h3><pre>${esc(e.texto)}</pre></div></div>`;
};

const dias = plan.map((d) => {
  const ref = d.tareas.find((t) => t.ref)?.ref;
  return `<section class="dia"><h2>${esc(bonita(d.f))} <small>${esc(d.titulo)}</small></h2>
<ul class="tareas">${d.tareas.map((t) => `<li>${ICO[t.tipo] ?? '•'} ${esc(t.detalle)}</li>`).join('')}</ul>
${ref ? pieza(cola[ref]) : ''}</section>`;
}).join('\n');

const historias = banco.map((h, i) => `<figure class="hist"><span class="n">${i + 1}</span>${h.video_url
  ? `<video controls playsinline preload="none"><source src="${esc(h.video_url)}" type="video/mp4"></video>`
  : `<img src="${esc(h.historia_url)}" loading="lazy" alt="">`}<figcaption>${esc(h.titulo)}</figcaption></figure>`).join('');

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Instagram · lo que va a salir</title>
<style>
:root{--bg:#0b0614;--card:#160d24;--line:#2b1d40;--txt:#f1ecf8;--dim:#a99bbd;--acc:#b05cff}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:16px}
main{max-width:980px;margin:0 auto}h1{font-size:26px;margin:8px 0 4px}p.sub{color:var(--dim);margin:0 0 24px}
.dia{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:18px;margin:0 0 18px}
.dia h2{margin:0 0 8px;font-size:20px;text-transform:capitalize}.dia h2 small{color:var(--dim);font-weight:500;font-size:14px;text-transform:none;margin-left:6px}
.tareas{margin:0 0 12px;padding-left:0;list-style:none;color:var(--dim);font-size:14px}.tareas li{margin:2px 0}
.pieza{display:grid;grid-template-columns:minmax(0,240px) minmax(0,1fr);gap:18px;align-items:start}
.media video,.media img{width:100%;border-radius:14px;background:#000;display:block}
.carrusel{display:flex;gap:8px;overflow-x:auto}.carrusel img{width:200px;flex:0 0 auto}
.texto h3{margin:0 0 8px;font-size:17px}pre{white-space:pre-wrap;font:inherit;font-size:15px;margin:0;background:#0f0819;border:1px solid var(--line);border-radius:12px;padding:12px}
.estado{display:inline-block;font-size:12px;padding:2px 10px;border-radius:99px;background:#2b1d40;color:var(--dim);margin-bottom:6px}.estado.publicado{background:#12c26b33;color:#5fe0a0}
.aviso{color:#ffb4c4}
.hists{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.hist{margin:0;position:relative}.hist video,.hist img{width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:12px;background:#000;display:block}
.hist figcaption{font-size:13px;color:var(--dim);margin-top:6px}.hist .n{position:absolute;top:8px;left:8px;background:var(--acc);color:#fff;border-radius:99px;font-size:12px;padding:1px 8px;z-index:1}
@media(max-width:640px){.pieza{grid-template-columns:1fr}.media{max-width:280px}}
</style></head><body><main>
<h1>Instagram: lo que va a salir</h1>
<p class="sub">Generado el ${esc(new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' }))} desde el plan diario y la cola. Los reels salen a las 13:00; las historias, a las 13:10 de los días que tocan. Si cambias algo, pídeme que la regenere.</p>
${dias || '<p>No hay nada planificado.</p>'}
<section class="dia"><h2>Banco de historias <small>salen en este orden</small></h2><div class="hists">${historias || '<p>Vacío.</p>'}</div></section>
</main></body></html>`;

const out = new URL('../../LANDING ERP/transformaconia-gestion/ig/previa/', import.meta.url);
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(new URL('index.html', out), html);
console.log('vista previa:', plan.length, 'días,', banco.length, 'historias');
