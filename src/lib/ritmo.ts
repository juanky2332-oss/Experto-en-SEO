import "server-only";
import { sql } from "@/lib/db";
import { esc } from "@/lib/gateway";

// Ritmo de las rutinas automáticas (decidido el 27-10-2026): todo cada 3 días y a Telegram SOLO si ha pasado algo.
// Una sola fuente (seo.settings.ritmo) que leen el panel SEO (idea de publicación, informe SEO, Instagram) y n8n
// (CAPTACIÓN JUANKY lee la misma fila con su nodo Postgres y repite la cuenta de «¿toca hoy?»: si cambias la fórmula, cámbiala allí).
// Un día «toca» cuando los días desde `desde` son múltiplo de `cada`.

export const RUTINAS = {
  publicaciones: "💡 Publicación del blog: te propongo una idea con «Redactar y publicar»",
  captacion: "🎯 Captación: busco empresas nuevas y te digo a quién toca escribir",
  instagram: "📲 Instagram: reel, lista de seguir y comentar e informe (las respuestas a comentarios salen cada día)",
  seo: "📈 Informe SEO: solo si algo ha cambiado (caídas, Google, enlaces rotos)",
} as const;
export type Rutina = keyof typeof RUTINAS;

export type Ritmo = {
  cada: number;
  desde: string; // YYYY-MM-DD
  pausas: Partial<Record<Rutina, boolean>>;
  busquedas: string[]; // rotan, una por día que toca
  ultimo_seo?: { salud: number; clics: number | null; criticos: number; scores?: Record<number, number> };
};

const POR_DEFECTO: Ritmo = {
  cada: 3,
  desde: "2026-10-30",
  pausas: {},
  busquedas: [
    "talleres de mecanizado Murcia",
    "calderería Molina de Segura",
    "carpintería metálica Cartagena",
    "estructuras metálicas Alcantarilla",
    "mantenimiento industrial Murcia",
    "talleres de soldadura Lorca",
    "fabricación de maquinaria Murcia",
    "talleres industriales San Javier",
  ],
};

export const hoyMadrid = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const dias = (a: string, b: string) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86_400_000);
const sumar = (f: string, n: number) => new Date(Date.parse(f + "T12:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
export const bonita = (f: string) => new Date(f + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export async function getRitmo(): Promise<Ritmo> {
  const [r] = await sql<{ value: Partial<Ritmo> }[]>`select value from seo.settings where key = 'ritmo'`;
  return { ...POR_DEFECTO, ...(r?.value ?? {}), pausas: { ...(r?.value?.pausas ?? {}) } };
}

export async function guardarRitmo(cambios: Partial<Ritmo>) {
  const r = { ...(await getRitmo()), ...cambios };
  await sql`insert into seo.settings (key, value) values ('ritmo', ${sql.json(r as never)}) on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return r;
}

export function toca(r: Ritmo, fecha = hoyMadrid()) {
  const d = dias(r.desde, fecha);
  return d >= 0 && d % r.cada === 0;
}

/** Próximos días que tocan desde `desdeFecha` (incluida). */
export function proximos(r: Ritmo, n: number, desdeFecha = hoyMadrid()) {
  const l: string[] = [];
  for (let f = desdeFecha; l.length < n; f = sumar(f, 1)) if (toca(r, f)) l.push(f);
  return l;
}

/** ¿Hoy toca esta rutina? (día del ritmo y sin pausa) */
export async function tocaHoy(rutina: Rutina) {
  const r = await getRitmo();
  return !r.pausas[rutina] && toca(r);
}

/** Cambia cada cuántos días, sin saltos raros: el siguiente día que tocaba sigue siendo el primero del ritmo nuevo. */
export async function cambiarCada(cada: number) {
  const r = await getRitmo();
  const [siguiente] = proximos(r, 1);
  return guardarRitmo({ cada, desde: siguiente });
}

export function describir(r: Ritmo) {
  const [a, b, c] = proximos(r, 3);
  const hoy = toca(r) ? " (hoy toca)" : "";
  const rutinas = (Object.keys(RUTINAS) as Rutina[]).map((k) => `${r.pausas[k] ? "⏸" : "▶️"} ${RUTINAS[k]}${r.pausas[k] ? " — <b>en pausa</b>" : ""}`).join("\n");
  return (
    `⏱ <b>Rutinas automáticas: cada ${r.cada} día${r.cada > 1 ? "s" : ""}</b>${hoy}\n` +
    `Próximos: ${[a, b, c].map(bonita).join(" · ")}\n\n${rutinas}\n\n` +
    `A Telegram solo te llega algo si ha pasado algo: empresas nuevas, comentarios respondidos, un reel publicado, una idea para publicar o un cambio en Google.\n\n` +
    `🔎 Búsquedas de captación (una cada vez, por turnos):\n${r.busquedas.map((x, i) => `${i + 1}. ${esc(x)}`).join("\n")}`
  );
}

/** La búsqueda de captación que corresponde a un día (rota la lista). La misma cuenta está en n8n («Qué toca»). */
export function busquedaDe(r: Ritmo, fecha = hoyMadrid()) {
  if (!r.busquedas.length) return null;
  const vuelta = Math.floor(Math.max(dias(r.desde, fecha), 0) / r.cada);
  return r.busquedas[vuelta % r.busquedas.length];
}
