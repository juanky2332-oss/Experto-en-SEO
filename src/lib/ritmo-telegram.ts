import "server-only";
import { after } from "next/server";
import { telegram, esc } from "@/lib/gateway";
import { getRitmo, guardarRitmo, cambiarCada, describir, busquedaDe, RUTINAS, type Rutina } from "@/lib/ritmo";
import { replanificar } from "@/lib/plan-ig";
import { mediodia } from "@/lib/instagram-diario";

// /ritmo y /captar en el bot del SEO: ver y mandar en todas las rutinas automáticas desde Telegram.

const ALIAS: Record<string, Rutina | "todo"> = {
  publicaciones: "publicaciones", publicacion: "publicaciones", blog: "publicaciones", ideas: "publicaciones", idea: "publicaciones",
  captacion: "captacion", captación: "captacion", clientes: "captacion", busqueda: "captacion", búsqueda: "captacion",
  instagram: "instagram", ig: "instagram",
  seo: "seo", informe: "seo",
  todo: "todo", todas: "todo",
};

export const AYUDA_RITMO =
  "⏱ <b>Rutinas automáticas</b>\n/ritmo — cómo van y qué día toca\n/ritmo 3 — cada cuántos días (1-14)\n/ritmo pausa instagram · captacion · publicaciones · seo · todo\n/ritmo sigue … — quitar la pausa\n/ritmo busquedas calderería Molina; mecanizado Cartagena — las búsquedas de captación (por turnos)\n/ritmo ahora captacion · instagram — lanzarlo ya\n/captar oficio zona — buscar empresas ahora";

/** Lanza una búsqueda de captación en n8n (CAPTACIÓN JUANKY): el resultado llega por el bot de Juanky. */
async function captar(consulta: string) {
  const url = process.env.CAPTACION_WEBHOOK;
  if (!url) throw new Error("falta CAPTACION_WEBHOOK en Vercel");
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accion: "buscar", consulta }), signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`n8n respondió ${r.status}`);
}

export async function comandoCaptar(arg: string) {
  const q = arg.trim();
  if (q.length < 3) return { text: "Uso: /captar calderería Molina de Segura" };
  await captar(q);
  return { text: `🔎 Buscando <b>${esc(q)}</b>. El resultado te llega por el bot de Juanky en 5-15 minutos.` };
}

export async function comandoRitmo(arg: string): Promise<{ text: string }> {
  const [op = "", ...resto] = arg.trim().split(/\s+/).filter(Boolean);
  const o = op.toLowerCase();
  if (!o || o === "estado") return { text: `${describir(await getRitmo())}\n\n${AYUDA_RITMO}` };

  if (/^\d+$/.test(o)) {
    const n = Number(o);
    if (n < 1 || n > 14) return { text: "Pon un número de días entre 1 y 14. Ejemplo: /ritmo 3" };
    const r = await cambiarCada(n);
    const p = await replanificar();
    return { text: `✅ Ahora todo va cada <b>${n}</b> día${n > 1 ? "s" : ""}. He recolocado ${p.reels} reels y ${p.listas} listas de Instagram.\n\n${describir(r)}` };
  }

  if (o === "pausa" || o === "pausar" || o === "sigue" || o === "seguir" || o === "reanudar") {
    const quien = ALIAS[(resto[0] ?? "").toLowerCase()];
    if (!quien) return { text: `¿Cuál? ${Object.keys(RUTINAS).join(" · ")} · todo\nEjemplo: /ritmo ${o} instagram` };
    const pausa = o.startsWith("paus");
    const r = await getRitmo();
    const claves = quien === "todo" ? (Object.keys(RUTINAS) as Rutina[]) : [quien];
    const pausas = { ...r.pausas };
    for (const k of claves) pausas[k] = pausa;
    return { text: `${pausa ? "⏸ En pausa" : "▶️ En marcha"}: ${claves.join(", ")}.\n\n${describir(await guardarRitmo({ pausas }))}` };
  }

  if (o === "busquedas" || o === "búsquedas") {
    const lista = arg.trim().replace(/^b[uú]squedas\s*/i, "").split(/[;\n]/).map((x) => x.trim()).filter((x) => x.length >= 3).slice(0, 20);
    if (!lista.length) return { text: "Escríbelas separadas por punto y coma:\n/ritmo busquedas calderería Molina; mecanizado Cartagena; talleres Lorca" };
    return { text: `✅ ${lista.length} búsquedas guardadas.\n\n${describir(await guardarRitmo({ busquedas: lista }))}` };
  }

  if (o === "replanificar") {
    const p = await replanificar();
    return { text: `📅 Recolocados ${p.reels} reels y ${p.listas} listas en: ${p.dias.slice(0, 6).join(", ")}. /plan para verlo.` };
  }

  if (o === "ahora") {
    const quien = ALIAS[(resto[0] ?? "").toLowerCase()];
    if (quien === "captacion") {
      const q = resto.slice(1).join(" ") || busquedaDe(await getRitmo());
      if (!q) return { text: "No hay búsquedas guardadas: /ritmo busquedas …" };
      return comandoCaptar(q);
    }
    if (quien === "instagram") {
      after(async () => {
        const r = await mediodia();
        if (r.ok && "enviado" in r && !r.enviado) await telegram("📲 Instagram: nada nuevo que responder ahora mismo.");
      });
      return { text: "📲 Reviso Instagram (comentarios y, si hoy toca, el reel). Si hay algo te lo cuento en un minuto. Para publicar ya el siguiente reel: /reel" };
    }
    if (quien === "publicaciones") return { text: "Para una publicación ahora: /idea" };
    if (quien === "seo") return { text: "Para ver el SEO ahora: /estado" };
    return { text: "Uso: /ritmo ahora captacion · instagram (y /idea, /estado, /reel)" };
  }
  return { text: AYUDA_RITMO };
}
