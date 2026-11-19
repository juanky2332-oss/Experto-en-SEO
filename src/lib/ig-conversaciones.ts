import "server-only";
// 19-11-2026 · «Para escribir hoy» (él: «vamos más directo, a ver si hacemos más conversiones»). El paso que faltaba:
// seguir y comentar calienta, pero la venta B2B en Instagram pasa por el mensaje privado. Cada día laborable a las 19:00
// le llegan por Telegram hasta 3 empresas que YA se han interesado (nos siguen de vuelta o nos han dado varios «me gusta»)
// con un mensaje sugerido para que lo mande ÉL desde el móvil (nunca un programa: regla anti-bot). Botones: Escrito / Saltar.
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";

const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const MAX_DIA = 3;

// Mensajes que abren conversación sin vender (se alternan para no mandar siempre el mismo)
const SIGUE = [
  "¡Hola! Gracias por seguirnos 🙌 Hemos estado viendo vuestro trabajo y tiene muy buena pinta. Por curiosidad, ¿qué es lo que más tiempo os quita en la oficina: facturas, presupuestos, albaranes…?",
  "¡Buenas! Gracias por el follow 🙌 Nos dedicamos a quitar papeleo a talleres e industria de la Región. ¿Cómo lo lleváis vosotros con las facturas y los presupuestos, a mano o con algún programa?",
  "¡Hola! Gracias por seguirnos 👋 Nos gusta mucho lo que hacéis. Si alguna vez os apetece ver cómo otras empresas de aquí se están quitando horas de papeles, nos lo decís y os lo enseñamos sin compromiso.",
];
const GUSTA = [
  "¡Hola! Gracias por los «me gusta» 🙌 ¿Os pasa también eso en el día a día? Nos dedicamos justo a quitar ese papeleo a talleres e industria de aquí.",
  "¡Buenas! Gracias por pasaros por nuestras publicaciones 👋 Por curiosidad, ¿qué tarea os gustaría quitaros de encima en la oficina?",
];

type Cand = { cuenta: string; motivo: string; tipo: "sigue" | "gusta" };

/** Empresas que se han interesado y a las que aún no hemos escrito (solo cuentas que elegimos nosotros al seguir). */
export async function candidatas(limite = MAX_DIA): Promise<Cand[]> {
  const elegidas = new Set((await sql<{ c: string }[]>`select distinct lower(cuenta) c from seo.ig_acciones where tipo = 'seguir'`).map((x) => x.c));
  const hechas = new Set((await sql<{ c: string }[]>`select distinct lower(cuenta) c from seo.ig_acciones where tipo in ('mensaje', 'mensaje_saltar')`).map((x) => x.c));
  const [s] = await sql<{ value: { lista?: string[] } }[]>`select value from seo.settings where key = 'ig_seguidores_lista'`;
  const out: Cand[] = [];
  for (const c of s?.value?.lista ?? []) {
    const k = c.toLowerCase();
    if (elegidas.has(k) && !hechas.has(k)) out.push({ cuenta: c, motivo: "Nos sigue (la seguimos nosotros antes)", tipo: "sigue" });
  }
  const gustan = await sql<{ c: string; n: number; com: number }[]>`select lower(cuenta) c, count(*) filter (where tipo = 'le_gusta')::int n, count(*) filter (where tipo = 'nos_comenta')::int com
    from seo.ig_recibidos where fecha > current_date - 21 group by 1`;
  for (const g of gustan) {
    if ((g.n >= 2 || g.com >= 1) && elegidas.has(g.c) && !hechas.has(g.c) && !out.some((o) => o.cuenta.toLowerCase() === g.c))
      out.push({ cuenta: g.c, motivo: g.com ? `Nos ha comentado (${g.com})` : `Nos ha dado ${g.n} «me gusta»`, tipo: "gusta" });
  }
  return out.slice(0, limite);
}

/** 19:00 L-V: la lista «Para escribir hoy» a Telegram (un mensaje por empresa, con su texto para copiar). */
export async function conversacionesDelDia() {
  const [ya] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_acciones where tipo in ('mensaje', 'mensaje_saltar') and fecha = ${hoy()}`;
  if (ya.n >= MAX_DIA) return { ok: true, enviadas: 0, motivo: "ya hechas hoy" };
  const l = await candidatas(MAX_DIA - ya.n);
  if (!l.length) return { ok: true, enviadas: 0 };
  const [{ n: total }] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_acciones where tipo = 'mensaje'`;
  await telegram(`💬 <b>Para escribir hoy</b> (${l.length})\nEmpresas que ya se han interesado en nosotros. Escríbeles TÚ desde el móvil (copia el texto, cámbialo a tu gusto y mándalo). Sin prisa, uno cada pocos minutos.`);
  for (const [i, c] of l.entries()) {
    const banco = c.tipo === "sigue" ? SIGUE : GUSTA;
    const texto = banco[(total + i) % banco.length];
    await telegram(
      `${i + 1}. <a href="https://ig.me/m/${esc(c.cuenta)}">@${esc(c.cuenta)}</a> · ${esc(c.motivo)}\n\n<code>${esc(texto)}</code>\n\n(Toca el nombre y se abre la conversación en Instagram.)`,
      [{ text: "✅ Escrito", data: `app:dmok:${c.cuenta}` }, { text: "Saltar", data: `app:dmno:${c.cuenta}` }],
    );
  }
  return { ok: true, enviadas: l.length };
}

/** Botones «Escrito» / «Saltar». */
export async function mensajeHecho(cuenta: string, escrito: boolean) {
  const c = cuenta.replace(/^@/, "").toLowerCase();
  const [r] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_acciones where lower(cuenta) = ${c} and tipo in ('mensaje', 'mensaje_saltar')`;
  if (r.n) return `Ya estaba apuntado @${c}.`;
  await sql`insert into seo.ig_acciones (tipo, cuenta, fecha) values (${escrito ? "mensaje" : "mensaje_saltar"}, ${c}, ${hoy()})`;
  return escrito ? `✅ Apuntado: le has escrito a @${c}. Si contesta, dímelo y lo seguimos.` : `Vale, @${c} no vuelve a salir.`;
}
