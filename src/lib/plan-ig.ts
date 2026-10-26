import "server-only";
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { subir } from "@/lib/redes";

// Plan diario de Instagram (seo.ig_plan, cargado con n8n/ig-plan.mjs). Cada mañana el cron le propone el del día por Telegram;
// con «✅ Adelante» el servidor publica el reel (si lo hay) y el agente local (Claude + Chrome, 13:00) hace seguir/comentar/responder.
// Con «❌ Hoy no» no se hace nada ese día.

type Tarea = { tipo: string; detalle: string; ref?: string | null; cuentas?: string[] };
type Dia = { fecha: string; titulo: string; tareas: Tarea[]; estado: string };

const ICONO: Record<string, string> = { reel: "🎬", seguir: "➕", comentar: "💬", responder: "↩️", informe: "📊", captacion: "🎯", preparar: "🛠" };
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
  return `📅 <b>Plan de Instagram</b>\n\n${l.map((d) => `${est[d.estado] ?? "•"} <b>${esc(bonita(d.fecha))}</b> — ${esc(d.titulo)}\n${d.tareas.map((t) => `   ${ICONO[t.tipo] ?? "•"} ${esc(t.detalle)}`).join("\n")}`).join("\n\n")}\n\nCada mañana te llega el del día para que digas sí o no.`;
}
