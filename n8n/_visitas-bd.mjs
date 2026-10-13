// Crea la tabla seo.visitas en Neon (idempotente).
import postgres from 'postgres';
import fs from 'node:fs';
import './lib.mjs';
const sql = postgres(process.env.DATABASE_URL, { prepare: false, ssl: 'require', max: 1 });
const s = fs.readFileSync('sql/seo.sql', 'utf8');
await sql.unsafe(s.slice(s.indexOf('-- Web: medición propia')));
console.log(await sql`select count(*) from seo.visitas`);
await sql.end();
