// Sincroniza la guía guardada en la base con los pilares, ritmo, voz y reglas nuevos de guia-base.ts (2026-10-09).
// Conserva lo demás (notas, próximos, cambios hechos desde la app).
import postgres from 'postgres';
import { GUIA_INICIAL, guiaATexto } from '../src/lib/guia-base.ts';
const sql = postgres(process.env.DATABASE_URL, { max: 1 });
const [{ value: g }] = await sql`select value from seo.settings where key='guia'`;
await sql`insert into seo.settings (key, value) values ('guia_backup_2026_10_09', ${sql.json(g)}) on conflict (key) do update set value = excluded.value`;
const nombres = new Set(g.pilares.map((p) => p.nombre));
for (const p of GUIA_INICIAL.pilares) {
  const i = g.pilares.findIndex((x) => x.nombre === p.nombre);
  if (i >= 0) g.pilares[i] = p; else g.pilares.push(p);
}
g.ritmo = GUIA_INICIAL.ritmo;
g.voz = GUIA_INICIAL.voz;
const extra = GUIA_INICIAL.reglas_seo.find((r) => r.startsWith('3-5 enlaces internos'));
g.reglas_seo = g.reglas_seo.map((r) => (r.startsWith('3-5 enlaces internos') ? extra : r));
g.posicionamiento = 'Transforma con IA es un medio de noticias de inteligencia artificial para empresas y un equipo de compañeros de Murcia que diseña e implementa soluciones de IA y automatización. Cada artículo cuenta qué ha cambiado y qué significa para un negocio, tanto para quien empieza como para quien ya usa la IA a diario, y lleva al lector a la solución que le encaja. El blog demuestra que sabemos hacerlo; las empresas nos contratan para que lo hagamos por ellas.';
g.texto = guiaATexto(g);
g.actualizada = new Date().toISOString();
await sql`update seo.settings set value = ${sql.json(g)}, updated_at = now() where key = 'guia'`;
console.log('pilares:', g.pilares.map((p) => p.nombre).join(' | '), '· antes', nombres.size, 'ahora', g.pilares.length);
await sql.end();
