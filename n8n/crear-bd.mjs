// Crea (o completa) la base de datos del Experto SEO en el Postgres de DATABASE_URL
// y apunta la credencial Postgres de n8n a esa misma base.
//   node --env-file=.env.local n8n/crear-bd.mjs            (esquema + ajustes iniciales + credencial n8n)
//   node --env-file=.env.local n8n/crear-bd.mjs --sin-n8n  (solo la base)
import postgres from 'postgres';
import fs from 'node:fs';
import { CRED } from './lib.mjs';
import { GUIA_INICIAL, RADAR_DEFECTO, guiaATexto } from '../src/lib/guia-base.ts';

const url = process.env.DATABASE_URL;
if (!url) throw new Error('Falta DATABASE_URL');
const sql = postgres(url, { prepare: false, ssl: 'require', max: 1 });

await sql.unsafe(fs.readFileSync(new URL('../sql/seo.sql', import.meta.url), 'utf8'));
const semillas = {
  radar: RADAR_DEFECTO,
  radar_estado: {},
  guia: { ...GUIA_INICIAL, texto: guiaATexto(GUIA_INICIAL) },
  publicacion: { modo: 'publicar', score_minimo: 80, imagenes: 'gpt-image-2' },
};
for (const [key, value] of Object.entries(semillas))
  await sql`insert into seo.settings (key, value) values (${key}, ${sql.json(value)}) on conflict (key) do nothing`;
const tablas = await sql`select table_name from information_schema.tables where table_schema = 'seo' order by 1`;
console.log('BD lista:', tablas.map((t) => t.table_name).join(', '));
await sql.end();

if (!process.argv.includes('--sin-n8n')) {
  // La credencial de n8n usa conexión directa (sin pooler) con SSL.
  const u = new URL(url.replace(/^postgres(ql)?:/, 'http:'));
  const data = {
    host: u.hostname.replace('-pooler.', '.'),
    port: +(u.port || 5432),
    database: u.pathname.slice(1) || 'postgres',
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    ssl: 'require',
    allowUnauthorizedCerts: false,
    sshTunnel: false,
  };
  // La API pública de n8n no edita credenciales: se crea una nueva y se apunta lib.mjs a ella.
  // Después hay que redesplegar radar.mjs y publicador.mjs para que la usen.
  const r = await fetch(`${process.env.N8N_API_URL}/credentials`, {
    method: 'POST',
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: CRED.pg.postgres.name, type: 'postgres', data }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.id) throw new Error(`n8n no creó la credencial: ${r.status} ${JSON.stringify(j).slice(0, 500)}`);
  const lib = new URL('./lib.mjs', import.meta.url);
  fs.writeFileSync(lib, fs.readFileSync(lib, 'utf8').replace(`id: '${CRED.pg.postgres.id}'`, `id: '${j.id}'`));
  console.log(`Credencial n8n nueva ${j.id} (antes ${CRED.pg.postgres.id}); redespliega: node --env-file=.env.local n8n/radar.mjs && node --env-file=.env.local n8n/publicador.mjs`);
}
