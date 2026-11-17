import "server-only";
// CALENDARIO DEL BLOG (17-11-2026, lo pidió él): 2 artículos por semana SÍ O SÍ (martes y viernes), de una lista
// que él aprueba. Cada día que toca se prepara el brief de esa idea y se PUBLICA solo, sin esperar al botón.
// Cuando se lanza el ÚLTIMO de la lista, le llega por Telegram la lista siguiente (8 artículos, 4 semanas) con
// «✅ Aprobar lista» / «🔄 Otra lista»; al aprobarla queda planificada y se sigue igual.
// Estado en seo.settings «blog_plan». Lo llama /api/cron/blog (n8n, martes y viernes por la mañana, con reintento).
import { sql } from "../db";
import { publicador, telegram } from "../gateway";
import { darIdea } from "./idea";
import { generarQuePublicar } from "./generar";

export type ItemBlog = { fecha: string; rec_id: number; titulo: string; estado?: "pendiente" | "esperando" | "lanzada"; brief_id?: string | null };
export type PlanBlog = { items: ItemBlog[]; propuesta?: { items: ItemBlog[]; enviada: string } | null };
const CLAVE = "blog_plan";
const DIAS = [2, 5]; // martes y viernes

const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
export const hoyMadrid = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const bonita = (f: string) => new Date(f + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export async function leerPlan(): Promise<PlanBlog | null> {
  const [f] = await sql<{ value: PlanBlog }[]>`select value from seo.settings where key = ${CLAVE}`;
  return f?.value ?? null;
}
async function guardar(p: PlanBlog) {
  await sql`insert into seo.settings (key, value) values (${CLAVE}, ${sql.json(p as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/** Las próximas n fechas de publicación (martes y viernes) después de `desde`. */
function siguientesFechas(desde: string, n: number) {
  const out: string[] = [];
  const d = new Date(desde + "T12:00:00Z");
  while (out.length < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (DIAS.includes(d.getUTCDay())) out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** El trabajo del día: publica el artículo que toca (o el atrasado). Devuelve qué ha hecho. */
export async function blogDelDia(): Promise<string> {
  const p = await leerPlan();
  if (!p?.items?.length) return "sin calendario";
  const hoy = hoyMadrid();
  const it = p.items.find((i) => i.fecha <= hoy && i.estado !== "lanzada");
  if (!it) {
    if (p.items.every((i) => i.estado === "lanzada") && !p.propuesta) await proponerLista(p);
    return "nada para hoy";
  }
  const [r] = await sql<{ estado: string; brief_id: string | null }[]>`select estado, brief_id from seo.qp_recs where id = ${it.rec_id}`;
  if (!r) return `la idea ${it.rec_id} no existe`;
  if (r.estado === "abierta" || r.estado === "saltada") {
    if (r.estado === "saltada") await sql`update seo.qp_recs set estado = 'abierta' where id = ${it.rec_id}`;
    await darIdea({ origin: "sistema", recId: it.rec_id, conNoticias: false });
  }
  // el brief tarda ~1 minuto en n8n: se espera hasta ~3,5 minutos; si no llega, el reintento de la tarde lo publica
  let brief: { id: string; status: string } | null = null;
  for (let k = 0; k < 21; k++) {
    const [b] = await sql<{ id: string; status: string }[]>`select b.id, b.status from seo.qp_recs q join seo.briefs b on b.id = q.brief_id where q.id = ${it.rec_id}`;
    if (b && b.status !== "generating_brief") { brief = b; break; }
    await new Promise((res) => setTimeout(res, 10_000));
  }
  if (!brief) {
    it.estado = "esperando";
    await guardar(p);
    return `esperando el brief de «${it.titulo}»`;
  }
  if (brief.status === "pending") await publicador({ action: "publish", brief_id: brief.id });
  it.estado = "lanzada";
  it.brief_id = brief.id;
  await guardar(p);
  // era el último de la lista: se propone la siguiente
  if (p.items.every((i) => i.estado === "lanzada")) await proponerLista(p);
  return `publicando «${it.titulo}» (${brief.status === "pending" ? "en 4-7 minutos" : brief.status})`;
}

/** Lista siguiente: 8 ideas abiertas (primero la ruta editorial), en martes y viernes desde el último de ahora. */
export async function proponerLista(p: PlanBlog, otra = false) {
  const usados = [...p.items, ...(p.propuesta?.items ?? [])].map((i) => i.rec_id);
  if (otra) await generarQuePublicar({ origin: "sistema", forzar: true }).catch((e) => console.error("ideas", e));
  const f = await sql<{ id: string; titulo: string }[]>`select id, titulo from seo.qp_recs where estado = 'abierta' and destino = 'articulo'
    and not (id = any(${usados.map(String)}::bigint[])) and titulo !~* '(cu[aá]nto cuesta|precio)'
    order by (lote like 'ruta-%') desc, fecha_plan nulls last, prioridad desc, id limit 8`;
  if (!f.length) {
    await telegram("📝 <b>Blog</b>: se ha publicado el último artículo de la lista y no me quedan ideas preparadas. Dime en Claude Code «prepara la lista del blog» y te la paso.");
    return;
  }
  const ultima = p.items.map((i) => i.fecha).sort().at(-1) ?? hoyMadrid();
  const fechas = siguientesFechas(ultima < hoyMadrid() ? hoyMadrid() : ultima, f.length);
  p.propuesta = { items: f.map((x, i) => ({ fecha: fechas[i], rec_id: Number(x.id), titulo: x.titulo, estado: "pendiente" })), enviada: new Date().toISOString() };
  await guardar(p);
  await telegram(
    `📝 <b>Blog: lista siguiente</b> (2 por semana, martes y viernes)\n\n${p.propuesta.items.map((i) => `• ${bonita(i.fecha)} · ${esc(i.titulo)}`).join("\n")}\n\nSi te parece bien, la apruebo y se publican solas en esas fechas.`,
    [{ text: "✅ Aprobar lista", data: "app:blsi:0" }, { text: "🔄 Otra lista", data: "app:blno:0" }],
  );
}

/** Botones de Telegram. */
export async function aprobarLista(): Promise<string> {
  const p = await leerPlan();
  if (!p?.propuesta?.items.length) return "No hay ninguna lista pendiente de aprobar.";
  // las ideas aprobadas quedan reservadas para el calendario (el «Dame una idea» suelto no las coge)
  p.items = [...p.items, ...p.propuesta.items];
  const n = p.propuesta.items.length;
  const desde = p.propuesta.items[0].fecha;
  p.propuesta = null;
  await guardar(p);
  return `✅ Lista aprobada: ${n} artículos, martes y viernes desde el ${bonita(desde)}. Te aviso de cada uno al publicarse.`;
}
export async function otraLista(): Promise<string> {
  const p = await leerPlan();
  if (!p) return "No hay calendario del blog.";
  const antes = p.propuesta?.items.map((i) => i.rec_id) ?? [];
  // las de la propuesta rechazada no vuelven a salir en la siguiente
  if (antes.length) await sql`update seo.qp_recs set estado = 'saltada' where id = any(${antes.map(String)}::bigint[]) and estado = 'abierta'`;
  p.propuesta = null;
  await proponerLista(p, true);
  return "🔄 Te preparo otra lista; te llega en un momento.";
}
