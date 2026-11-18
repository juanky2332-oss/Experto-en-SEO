// Guarda la guía de contenido (agente-ig/GUIA-CONTENIDO.md) en la base (seo.settings «ig_guia») para que el Radar la
// enseñe y la tenga en cuenta en cada movimiento de Instagram (18-11-2026, él). Hay que lanzarlo cada vez que cambie la guía.
// Uso: node --env-file=.env.local n8n/ig-guia.mjs
import fs from 'node:fs';
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const md = fs.readFileSync(new URL('../agente-ig/GUIA-CONTENIDO.md', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const version = (md.match(/Versión\s+([\w.]+)/) || [])[1] ?? '1';
await sql`insert into seo.settings (key, value) values ('ig_guia', ${sql.json({ md, version, actualizado: new Date().toISOString() })})
  on conflict (key) do update set value = excluded.value, updated_at = now()`;
console.log('guía guardada', version, md.length, 'caracteres');
await sql.end();
