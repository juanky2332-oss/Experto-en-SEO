// Migración única (idempotente): columna tipo en el radar, ajustes del radar,
// guía editorial inicial y categoría «Trucos y consejos de IA» en WordPress.
//   N8N_BASE=https://paneln8n.transformaconia.com node n8n/migrar-radar-guia.mjs
import { sql, wp } from './comun.mjs';
import { GUIA_INICIAL, RADAR_DEFECTO, guiaATexto } from '../src/lib/guia-base.ts';

await sql`alter table seo.radar add column if not exists tipo text`;
await sql`insert into seo.settings (key, value) values ('radar', ${sql.json(RADAR_DEFECTO)}) on conflict (key) do nothing`;
await sql`insert into seo.settings (key, value) values ('guia', ${sql.json({ ...GUIA_INICIAL, texto: guiaATexto(GUIA_INICIAL) })}) on conflict (key) do nothing`;
await sql`insert into seo.settings (key, value) values ('radar_estado', '{}'::jsonb) on conflict (key) do nothing`;
console.log('BD lista');

const cats = await wp('GET', 'wp/v2/categories?per_page=100&_fields=id,slug,name');
if (!(cats.data || []).some((c) => c.slug === 'trucos-y-consejos-ia')) {
  const r = await wp('POST', 'wp/v2/categories', {
    name: 'Trucos y consejos de IA', slug: 'trucos-y-consejos-ia',
    description: 'Trucos, comandos, atajos y configuraciones para sacar más partido a Claude, ChatGPT, n8n y los agentes de IA. Probados y listos para copiar.',
  });
  console.log('Categoría creada:', r.status, r.data?.id);
  await sql`insert into seo.actions (origin, action, target_type, target_id, summary) values ('sistema', 'crear_categoria', 'category', ${String(r.data?.id)}, 'Nueva categoría: Trucos y consejos de IA')`;
} else console.log('La categoría ya existía');
await sql.end();
