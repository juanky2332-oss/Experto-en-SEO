import "server-only";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { subir } from "@/lib/redes";
import { getRitmo, proximos, hoyMadrid } from "@/lib/ritmo";

// Plan de Instagram (seo.ig_plan). Desde el 27-10-2026 va al ritmo de las rutinas (cada 3 días, src/lib/ritmo.ts):
// cada día que toca sale el siguiente reel de la cola y la lista de seguir/comentar (seo.ig_movil) de ese día.
// replanificar() recoloca reels y listas pendientes en los próximos días del ritmo (lo llama /ritmo al cambiarlo).
// Los botones «Adelante / Hoy no» de antes (aprobar/rechazar) siguen funcionando para mensajes viejos.

type Tarea = { tipo: string; detalle: string; ref?: string | null; cuentas?: string[] };
type Dia = { fecha: string; titulo: string; tareas: Tarea[]; estado: string };

const ICONO: Record<string, string> = { reel: "🎬", seguir: "➕", comentar: "💬", responder: "↩️", informe: "📊", captacion: "🎯", preparar: "🛠", historia: "📸" };
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const bonita = (f: string) => new Date(f + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

async function dia(fecha: string) {
  const [d] = await sql<Dia[]>`select fecha::text, titulo, tareas, estado from seo.ig_plan where fecha = ${fecha}`;
  return d ?? null;
}

export async function hayPlanHoy() {
  return !!(await dia(hoy()));
}

function texto(d: Dia) {
  const lineas = d.tareas.map((t) => {
    const cuentas = t.cuentas?.length ? `\n     <i>${t.cuentas.map((c) => "@" + esc(c)).join(", ")}</i>` : "";
    return `${ICONO[t.tipo] ?? "•"} ${esc(t.detalle)}${cuentas}`;
  });
  return `📅 <b>Instagram · ${esc(bonita(d.fecha))}</b> — ${esc(d.titulo)}\n\n${lineas.join("\n")}\n\nSi me dices que sí, el reel sale ya y lo demás lo hago a las 13:00 desde el ordenador (tiene que estar encendido). Al terminar te mando lo que he hecho.`;
}

/** Cron de la mañana: propone el plan de hoy (una sola vez). */
export async function proponerPlanDeHoy() {
  const d = await dia(hoy());
  if (!d || d.estado !== "pendiente") return false;
  const r = await telegram(texto(d), [{ text: "✅ Adelante", data: `app:plsi:${d.fecha}` }, { text: "❌ Hoy no", data: `app:plno:${d.fecha}` }]);
  if (r.ok) await sql`update seo.ig_plan set estado = 'propuesto', propuesto_at = now() where fecha = ${d.fecha} and estado = 'pendiente'`;
  return r.ok;
}

/** «✅ Adelante». Devuelve el texto de respuesta y, si hay reel, su id para subirlo después de responder. */
export async function aprobar(fecha: string): Promise<{ text: string; reel: string | null }> {
  const [d] = await sql<Dia[]>`update seo.ig_plan set estado = 'aprobado', aprobado_at = now() where fecha = ${fecha} and estado in ('pendiente', 'propuesto') returning fecha::text, titulo, tareas, estado`;
  if (!d) {
    const x = await dia(fecha);
    return { text: x ? `Ese día ya estaba ${x.estado}.` : "No encuentro ese día en el plan.", reel: null };
  }
  const reel = d.tareas.find((t) => t.tipo === "reel" && t.ref)?.ref ?? null;
  return { text: `👍 Hecho. ${reel ? "Subo el reel ahora (1-3 min) y " : ""}a las 13:00 me pongo con el resto. Te aviso al terminar.`, reel };
}

export async function rechazar(fecha: string) {
  const [d] = await sql<{ fecha: string }[]>`update seo.ig_plan set estado = 'rechazado' where fecha = ${fecha} and estado in ('pendiente', 'propuesto') returning fecha::text`;
  return d ? "De acuerdo, hoy no toco Instagram. Mañana te propongo el siguiente." : "Ese día ya no estaba pendiente.";
}

export async function subirReelDelPlan(id: string) {
  await telegram(await subir(id));
}

/** /plan → hoy y los próximos 6 días. */
export async function resumenPlan() {
  const l = await sql<Dia[]>`select fecha::text, titulo, tareas, estado from seo.ig_plan where fecha >= ${hoy()} order by fecha limit 6`;
  if (!l.length) return "No hay plan cargado para los próximos días.";
  const est: Record<string, string> = { pendiente: "⏳", propuesto: "📨", aprobado: "👍", rechazado: "❌", hecho: "✅" };
  return `📅 <b>Plan de Instagram</b>\n\n${l.map((d) => `${est[d.estado] ?? "•"} <b>${esc(bonita(d.fecha))}</b> — ${esc(d.titulo)}\n${d.tareas.map((t) => `   ${ICONO[t.tipo] ?? "•"} ${esc(t.detalle)}`).join("\n")}`).join("\n\n")}\n\nVa solo: el día que toca se publica y, si ha pasado algo, te llega el informe. /ritmo para cambiarlo.`;
}

const sumar = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);

/** Recoloca los reels pendientes y las listas de seguir/comentar sin hacer en los próximos días del ritmo. */
export async function replanificar() {
  const r = await getRitmo();
  const hoy = hoyMadrid();
  const [hecho] = await sql`select 1 from seo.ig_plan where fecha = ${hoy} and estado in ('hecho', 'rechazado')`;
  const inicio = hecho ? sumar(hoy, 1) : hoy;
  const reels = await sql<{ id: string; titulo: string; tipo: string }[]>`select id, titulo, tipo from seo.ig_cola where tipo in ('reel', 'carrusel') and estado in ('pendiente', 'propuesto') order by fecha nulls last, id`;
  const listas = (await sql<{ fecha: string }[]>`select distinct fecha::text from seo.ig_movil where not hecho and fecha >= ${hoy}::date order by 1`).map((x) => x.fecha);
  const dias = proximos(r, Math.max(reels.length, listas.length, 1), inicio);
  // una sola sentencia: los cambios de fecha no se pisan entre sí
  const pares = listas.map((vieja, i) => ({ vieja, nueva: dias[i] }));
  if (pares.length) await sql`update seo.ig_movil m set fecha = v.nueva from jsonb_to_recordset(${sql.json(pares as never)}) as v(vieja date, nueva date) where m.fecha = v.vieja and not m.hecho`;
  for (const [i, e] of reels.entries()) await sql`update seo.ig_cola set fecha = ${dias[i]} where id = ${e.id}`;
  await sql`delete from seo.ig_plan where fecha >= ${inicio}::date and estado in ('pendiente', 'propuesto', 'aprobado')`;
  for (const [i, f] of dias.entries()) {
    const tareas: Tarea[] = [];
    if (reels[i]) tareas.push({ tipo: "reel", ref: reels[i].id, detalle: `${reels[i].tipo === "carrusel" ? "Carrusel" : "Reel"}: ${reels[i].titulo}` });
      tareas.push({ tipo: "historia", detalle: "Historias: aviso de la publicación nueva + 2 del banco" });
    if (listas[i]) {
      tareas.push({ tipo: "seguir", detalle: "Seguir las cuentas de la lista (desde el ordenador o, si está apagado, te llega al móvil a las 19:00)" });
      tareas.push({ tipo: "comentar", detalle: "Un comentario corto y natural en una publicación de cada una" });
    }
    if (!tareas.length) continue;
    const pieza = reels[i]?.tipo === "carrusel" ? "Carrusel" : "Reel";
    const titulo = reels[i] && listas[i] ? `${pieza}, historias, seguir y comentar` : reels[i] ? `${pieza} e historias` : "Seguir y comentar";
    await sql`insert into seo.ig_plan (fecha, titulo, tareas) values (${f}, ${titulo}, ${sql.json(tareas as never)})
      on conflict (fecha) do update set titulo = excluded.titulo, tareas = excluded.tareas, estado = 'pendiente' where seo.ig_plan.estado in ('pendiente', 'propuesto', 'aprobado')`;
  }
  return { reels: reels.length, listas: listas.length, dias };
}
