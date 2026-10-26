// Mete en la cola de Instagram (seo.ig_cola) los reels de un CALENDARIO.md de la fábrica de vídeos.
// Antes hay que copiar los .mp4 y las portadas a LANDING ERP/transformaconia-gestion/ig/<carpeta>/ y desplegarla
// (`vercel deploy --prod`): así quedan públicos en demo.transformaconia.com/ig/<carpeta>/.
//
//   node n8n/ig-cola.mjs "<ruta a CALENDARIO.md>" <carpeta> <año> <mes 1-12>
//   node n8n/ig-cola.mjs "../FABRICA DE VIDEOS/salida/instagram/noviembre/CALENDARIO.md" noviembre 2026 11
//
// Formato de cada reel en el calendario: «## martes 3 · Título», «Vídeo: x.mp4 · Portada: y.jpg» y el texto en un bloque ```.
// Solo toca los que siguen pendientes o propuestos (lo publicado o descartado no se pisa).
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import './lib.mjs'; // carga .env.local

const [ruta, carpeta, anio, mes] = process.argv.slice(2);
if (!ruta || !carpeta || !anio || !mes) throw new Error('Uso: node n8n/ig-cola.mjs <CALENDARIO.md> <carpeta> <año> <mes>');
const BASE = `https://demo.transformaconia.com/ig/${carpeta}`;
const md = fs.readFileSync(path.resolve(ruta), 'utf8');

const reels = md.split(/^## /m).slice(1).map((bloque) => {
  const [cabecera] = bloque.split('\n');
  const dia = Number(cabecera.match(/(\d{1,2})/)?.[1]);
  const titulo = cabecera.split('·').slice(1).join('·').trim();
  const video = bloque.match(/Vídeo:\s*(\S+\.mp4)/)?.[1];
  const portada = bloque.match(/Portada:\s*(\S+\.jpg)/)?.[1];
  const texto = bloque.match(/```\n([\s\S]*?)\n```/)?.[1];
  if (!dia || !titulo || !video || !texto) throw new Error(`Reel mal formado: ${cabecera}`);
  return {
    id: video.replace(/\.mp4$/, ''), titulo, texto, fecha: `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
    video_url: `${BASE}/${video}`, portada_url: portada ? `${BASE}/${portada}` : null,
  };
});

// los archivos tienen que estar ya publicados (Instagram y Telegram los descargan de ahí)
for (const r of reels) {
  const h = await fetch(r.video_url, { method: 'HEAD' });
  if (!h.ok) throw new Error(`${r.video_url} → ${h.status}: despliega antes la landing`);
}

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require', prepare: false });
for (const r of reels) {
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, video_url, portada_url, fecha)
    values (${r.id}, 'reel', ${r.titulo}, ${r.texto}, ${r.video_url}, ${r.portada_url}, ${r.fecha})
    on conflict (id) do update set titulo = excluded.titulo, texto = excluded.texto, video_url = excluded.video_url,
      portada_url = excluded.portada_url, fecha = excluded.fecha
    where seo.ig_cola.estado in ('pendiente', 'propuesto')`;
  console.log(r.fecha, r.id, '·', r.titulo);
}
await sql.end();
