// Lista del blog aprobada por él el 17-11-2026: 8 artículos, martes y viernes desde HOY.
// Sustituye las dos ideas de la ruta que hablaban de precios (no damos precios en público) y deja el calendario
// en seo.settings «blog_plan» (lo publica /api/cron/blog). Uso: node --env-file=.env.local n8n/blog-lista-2026-11.mjs
import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
const L = (url, ancla) => ({ url, ancla });
const CTA = 'Pide tu diagnóstico gratis por escrito (48 h laborables)';
const PUBLICO = 'gerente o responsable técnico de taller o pyme industrial';

// ideas nuevas (sin precios)
const nuevas = [
  { titulo: '5 usos de la IA que ya funcionan en un taller (y 2 que todavía no)', keyword: 'ia en talleres', secundarias: ['usos de la inteligencia artificial en la industria', 'ia para pymes industriales', 'ejemplos ia empresa'], intencion: 'informacional', pilar: 'IA en la industria', tipo: 'guia', destino_ref: '/ia-talleres-industriales/', enlaces: [L('/ia-talleres-industriales/', 'IA para talleres industriales'), L('/soluciones/', 'soluciones de IA')], por_que: 'el atractivo de la semana: ejemplos reales que se comparten en Instagram' },
  { titulo: 'Cómo elegir un ERP para tu taller: 7 preguntas antes de firmar', keyword: 'cómo elegir un erp', secundarias: ['elegir erp pyme', 'qué debe tener un erp', 'erp para taller'], intencion: 'comercial', pilar: 'ERP para la industria', tipo: 'guia', destino_ref: '/erp-industria/', enlaces: [L('/erp-industria/', 'ERP para la industria'), L('/erp-taller-pequeno/', 'qué necesita un taller pequeño')], por_que: 'sustituye a «Cuánto cuesta un ERP» sin dar precios: quien elige está cerca de decidir' },
];
const ids = {};
for (const n of nuevas) {
  const [r] = await sql`insert into seo.qp_recs (lote, titulo, keyword, secundarias, intencion, publico, pilar, tipo, destino, destino_ref, enlaces, cta, por_que, esfuerzo, prioridad, estado)
    values ('ruta-2026-11', ${n.titulo}, ${n.keyword}, ${n.secundarias}, ${n.intencion}, ${PUBLICO}, ${n.pilar}, ${n.tipo}, 'articulo', ${n.destino_ref},
      ${sql.json(n.enlaces)}, ${CTA}, ${sql.json([{ motivo: n.por_que }])}, 'medio', 95, 'abierta') returning id`;
  ids[n.keyword] = Number(r.id);
}
// las dos de precios fuera (y el brief pendiente de «Cuánto cuesta un ERP», descartado)
await sql`update seo.briefs set status = 'rejected', updated_at = now() where id = (select brief_id from seo.qp_recs where id = 128) and status = 'pending'`;
await sql`update seo.qp_recs set estado = 'saltada' where id in (128, 130)`;
await sql`insert into seo.settings (key, value) values ('idea_actual', ${sql.json({ rec_id: null, desde: new Date().toISOString() })})
  on conflict (key) do update set value = excluded.value, updated_at = now()`;
await sql`update seo.qp_recs set titulo = 'Cómo pasar las facturas a la gestoría sin papeles antes del cierre del trimestre' where id = 141`;

const items = [
  ['2026-11-17', 136], ['2026-11-20', 131], ['2026-11-24', 129], ['2026-11-27', ids['ia en talleres']],
  ['2026-12-01', ids['cómo elegir un erp']], ['2026-12-04', 132], ['2026-12-08', 135], ['2026-12-11', 141],
];
const recs = await sql`select id, titulo from seo.qp_recs where id = any(${items.map(([, id]) => String(id))}::bigint[])`;
const titulo = (id) => recs.find((r) => Number(r.id) === id)?.titulo;
const plan = { items: items.map(([fecha, rec_id]) => ({ fecha, rec_id, titulo: titulo(rec_id), estado: 'pendiente' })), propuesta: null };
await sql`insert into seo.settings (key, value) values ('blog_plan', ${sql.json(plan)})
  on conflict (key) do update set value = excluded.value, updated_at = now()`;
// fecha_plan de cada idea = su día en el calendario
for (const [fecha, id] of items) await sql`update seo.qp_recs set fecha_plan = ${fecha} where id = ${id}`;
console.log(plan.items.map((i) => `${i.fecha} ${i.rec_id} ${i.titulo}`).join('\n'));
await sql.end();
