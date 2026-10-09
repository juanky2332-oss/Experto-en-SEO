// 2026-10-09: guía y radar orientados a consultoría industrial; pilar «IA en la industria» y temas del radar.
import postgres from 'postgres';
import { GUIA_INICIAL, guiaATexto } from '../src/lib/guia-base.ts';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const [{ value: g }] = await sql`select value from seo.settings where key='guia'`;
await sql`insert into seo.settings (key, value) values ('guia_backup_2026_10_09b', ${sql.json(g)}) on conflict (key) do update set value = excluded.value`;
for (const p of GUIA_INICIAL.pilares) { const i = g.pilares.findIndex((x) => x.nombre === p.nombre); if (i >= 0) g.pilares[i] = p; else g.pilares.push(p); }
g.ritmo = GUIA_INICIAL.ritmo;
g.reglas_seo = g.reglas_seo.map((r) => (r.startsWith('3-5 enlaces internos') ? GUIA_INICIAL.reglas_seo.find((x) => x.startsWith('3-5 enlaces internos')) : r));
g.posicionamiento = 'Transforma con IA es una consultoría de inteligencia artificial y automatización de procesos especializada en la industria, con base en Murcia. El blog es secundario pero útil: demuestra que sabemos de IA y, sobre todo, cuenta casos reales de empresas industriales que aplican IA (qué hicieron, qué beneficios obtuvieron y qué puede copiar una pyme), además de la actualidad que importa. Cada artículo lleva al lector a la solución que le encaja: ERP para el metal, asistentes técnicos, gestión documental o automatizaciones.';
g.texto = guiaATexto(g);
g.actualizada = new Date().toISOString();
await sql`update seo.settings set value = ${sql.json(g)}, updated_at = now() where key = 'guia'`;
const r = await sql`select value from seo.settings where key='radar'`;
const cfg = r[0]?.value || {};
const nuevos = ['IA en la industria casos de éxito', 'inteligencia artificial fabricación España', 'mantenimiento predictivo con IA', 'visión artificial control de calidad', 'IA sector metal mecanizado', 'automatización industrial con IA pymes'];
cfg.temas = [...new Set([...(cfg.temas || []), ...nuevos])];
if (cfg.tipos && !cfg.tipos.includes('empresa')) cfg.tipos.push('empresa');
await sql`insert into seo.settings (key, value) values ('radar', ${sql.json(cfg)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
console.log('pilares:', g.pilares.length, '| temas radar:', cfg.temas.join(', '), '| tipos:', (cfg.tipos || []).join(','));
await sql.end();
