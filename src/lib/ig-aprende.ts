import "server-only";
// RESUMEN SEMANAL QUE APRENDE (17-11-2026, él: «el domingo haces un resumen de todo, aprendes de ese resumen y del
// histórico, y te vas mejorando poco a poco»). Cada domingo:
//   1) junta la semana: seguidores (quién llega, quién se va y POR QUÉ: qué le habíamos hecho antes), me gusta y
//      comentarios que recibimos, publicaciones y sus números, y lo que hicimos nosotros (seguir, comentar, me gusta);
//   2) lo compara con las semanas anteriores (seo.ig_semanas) y revisa si las decisiones de la semana pasada funcionaron;
//   3) saca aprendizajes y DECISIONES para la semana siguiente, que el agente lee antes de trabajar (ig-plan «decisiones»).
// Todo con reglas sobre datos reales: nada inventado. Con pocos datos lo dice.
import { sql } from "./db";
import { refrescar } from "./ig-estadisticas";

const dia = (d: Date) => d.toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const sumar = (f: string, n: number) => { const d = new Date(f + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

export type Semana = {
  desde: string; hasta: string;
  seguidores: { inicio: number | null; fin: number; nuevos: string[]; seVan: string[] };
  porQue: { cuenta: string; motivo: string }[];
  recibidos: { megusta: number; comentarios: number; quien: { cuenta: string; n: number }[] };
  publicaciones: { tipo: string; fecha: string; vistas: number; alcance: number; likes: number; texto: string }[];
  nuestras: { seguir: number; comentar: number; megusta: number; devuelven: number; devuelvenPct: number; conComentario: number; conComentarioPct: number };
  alcance: number;
  aprendizajes: string[];
  decisiones: string[];
  revision: string[];
};

export async function resumenSemanal(hasta = dia(new Date())): Promise<{ semana: Semana; texto: string }> {
  await refrescar().catch((e) => console.error("estadísticas", e));
  const desde = sumar(hasta, -6);
  // seguidores al empezar y ahora (foto diaria)
  const [h] = await sql<{ value: Record<string, number> }[]>`select value from seo.settings where key = 'ig_seguidores'`;
  const hist = h?.value ?? {};
  const fechas = Object.keys(hist).sort();
  const inicio = fechas.filter((f) => f < desde).map((f) => hist[f]).at(-1) ?? null;
  const fin = hist[fechas.at(-1) ?? ""] ?? 0;
  const rec = await sql<{ tipo: string; cuenta: string; url: string | null; texto: string | null; fecha: string }[]>`
    select tipo, cuenta, url, texto, fecha::text from seo.ig_recibidos where fecha between ${desde}::date and ${hasta}::date`;
  const nuevos = [...new Set(rec.filter((r) => r.tipo === "nos_sigue").map((r) => r.cuenta))];
  const seVan = [...new Set(rec.filter((r) => r.tipo === "deja_de_seguir").map((r) => r.cuenta))];
  // POR QUÉ nos sigue cada uno: lo que le hicimos antes de que nos siguiera
  const porQue: Semana["porQue"] = [];
  for (const c of nuevos) {
    const cuando = rec.find((r) => r.tipo === "nos_sigue" && r.cuenta === c)!.fecha;
    const antes = await sql<{ tipo: string; fecha: string }[]>`select tipo, fecha::text from seo.ig_acciones where lower(cuenta) = ${c} and fecha <= ${cuando}::date and tipo in ('seguir', 'comentar', 'megusta') order by fecha`;
    const tipos = new Set(antes.map((a) => a.tipo));
    const motivo = !antes.length ? "sin contacto previo: nos encontró por el contenido"
      : tipos.has("comentar") ? `la seguimos y le comentamos (${antes[0].fecha})`
      : tipos.has("megusta") ? `la seguimos y le dimos me gusta (${antes[0].fecha})`
      : `la seguimos (${antes[0].fecha})`;
    porQue.push({ cuenta: c, motivo });
  }
  const megusta = rec.filter((r) => r.tipo === "le_gusta");
  const quienMap = new Map<string, number>(); for (const r of megusta) quienMap.set(r.cuenta, (quienMap.get(r.cuenta) ?? 0) + 1);
  const quien = [...quienMap.entries()].map(([cuenta, n]) => ({ cuenta, n })).sort((a, b) => b.n - a.n).slice(0, 10);
  // publicaciones de la semana
  const pubs = (await sql<{ tipo: string; publicado_at: Date; datos: { vistas?: number; alcance?: number; likes?: number; texto?: string } }[]>`
    select tipo, publicado_at, datos from seo.ig_metricas where publicado_at >= ${desde}::date and publicado_at < ${sumar(hasta, 1)}::date order by publicado_at`)
    .map((p) => ({ tipo: p.tipo, fecha: p.publicado_at.toLocaleString("sv-SE", { timeZone: "Europe/Madrid" }).slice(0, 16), vistas: p.datos.vistas ?? 0, alcance: p.datos.alcance ?? 0, likes: p.datos.likes ?? 0, texto: (p.datos.texto ?? "").split("\n")[0].slice(0, 70) }));
  // lo que hicimos y cuántos nos devuelven el seguimiento
  const acc = await sql<{ tipo: string; cuenta: string }[]>`select tipo, lower(cuenta) cuenta from seo.ig_acciones where fecha between ${desde}::date and ${hasta}::date and tipo in ('seguir', 'comentar', 'megusta')`;
  const [lista] = await sql<{ value: { lista: string[] } }[]>`select value from seo.settings where key = 'ig_seguidores_lista'`;
  const nosSiguen = new Set(lista?.value?.lista ?? []);
  const seguidas = [...new Set(acc.filter((a) => a.tipo === "seguir").map((a) => a.cuenta))];
  const comentadas = new Set(acc.filter((a) => a.tipo === "comentar").map((a) => a.cuenta));
  const devuelven = seguidas.filter((c) => nosSiguen.has(c)).length;
  const conCom = seguidas.filter((c) => comentadas.has(c));
  const conComDev = conCom.filter((c) => nosSiguen.has(c)).length;
  const sinCom = seguidas.filter((c) => !comentadas.has(c));
  const sinComDev = sinCom.filter((c) => nosSiguen.has(c)).length;
  const [cu] = await sql<{ value: { alcanceDiario?: Record<string, number> } }[]>`select value from seo.settings where key = 'ig_cuenta'`;
  const alcance = Object.entries(cu?.value?.alcanceDiario ?? {}).filter(([f]) => f >= desde && f <= hasta).reduce((s, [, v]) => s + v, 0);

  // ---- comparación con el histórico y aprendizaje
  const prev = await sql<{ semana: string; datos: Semana }[]>`select semana::text, datos from seo.ig_semanas where semana < ${desde}::date order by semana desc limit 4`;
  const ant = prev[0]?.datos;
  const aprendizajes: string[] = [];
  const decisiones: string[] = [];
  const revision: string[] = [];
  const dif = (a: number, b?: number) => (b === undefined ? "" : ` (${a - b >= 0 ? "+" : ""}${a - b} frente a la semana anterior)`);
  if (conCom.length >= 3 && sinCom.length >= 3) {
    const a = pct(conComDev, conCom.length), b = pct(sinComDev, sinCom.length);
    aprendizajes.push(`Nos devuelven el seguimiento el ${a} % de las que seguimos Y comentamos, frente al ${b} % de las que solo seguimos.`);
    decisiones.push(a > b ? "Comentar a todas las empresas que sigamos (devuelven más el seguimiento)." : "Comentar solo cuando la publicación lo merezca: comentar no está trayendo más seguidores.");
  }
  const sinContacto = porQue.filter((p) => p.motivo.startsWith("sin contacto")).length;
  if (nuevos.length) aprendizajes.push(`${nuevos.length} seguidores nuevos: ${nuevos.length - sinContacto} después de que interactuáramos con ellos y ${sinContacto} que llegaron solos por el contenido.`);
  if (nuevos.length && sinContacto / nuevos.length >= 0.5) decisiones.push("El contenido atrae solo: mantener el ritmo de reels y repetir el tipo de la publicación que más se vio.");
  const mejor = [...pubs].sort((a, b) => b.vistas - a.vistas)[0];
  if (mejor) aprendizajes.push(`La publicación de la semana: ${mejor.tipo} del ${mejor.fecha} (${mejor.vistas} visualizaciones) — «${mejor.texto}».`);
  if (ant) {
    if (alcance < ant.alcance && acc.length < (ant.nuestras.seguir + ant.nuestras.comentar + ant.nuestras.megusta)) decisiones.push("Ha bajado el alcance y también nuestra actividad: volver al volumen completo de seguir, comentar y me gusta todos los días.");
    // ¿funcionaron las decisiones de la semana pasada?
    for (const d of ant.decisiones ?? []) revision.push(`«${d}» → seguidores ${fin - (inicio ?? fin) >= 0 ? "+" : ""}${fin - (inicio ?? fin)} (la semana anterior ${ant.seguidores.fin - (ant.seguidores.inicio ?? ant.seguidores.fin) >= 0 ? "+" : ""}${ant.seguidores.fin - (ant.seguidores.inicio ?? ant.seguidores.fin)}), alcance ${alcance}${dif(alcance, ant.alcance)}.`);
  }
  if (megusta.length && quien[0]) aprendizajes.push(`Quien más nos da me gusta: @${quien[0].cuenta} (${quien[0].n}). Si es una empresa que encaja, merece un mensaje.`);
  if (!aprendizajes.length) aprendizajes.push("Aún hay pocos datos esta semana: sigo apuntándolo todo para la próxima.");

  const semana: Semana = {
    desde, hasta, seguidores: { inicio, fin, nuevos, seVan }, porQue,
    recibidos: { megusta: megusta.length, comentarios: rec.filter((r) => r.tipo === "nos_comenta").length, quien },
    publicaciones: pubs,
    nuestras: { seguir: acc.filter((a) => a.tipo === "seguir").length, comentar: acc.filter((a) => a.tipo === "comentar").length, megusta: acc.filter((a) => a.tipo === "megusta").length,
      devuelven, devuelvenPct: pct(devuelven, seguidas.length), conComentario: conCom.length, conComentarioPct: pct(conComDev, conCom.length) },
    alcance, aprendizajes, decisiones, revision,
  };
  await sql`insert into seo.ig_semanas (semana, datos) values (${desde}, ${sql.json(semana as never)})
    on conflict (semana) do update set datos = excluded.datos, creado = now()`;
  // las decisiones quedan donde el agente las lee antes de trabajar
  await sql`insert into seo.settings (key, value) values ('ig_decisiones', ${sql.json({ semana: desde, decisiones } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;

  const e = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);
  const L: string[] = [];
  L.push(`📊 <b>Instagram: resumen de la semana</b> (${desde.slice(5)} → ${hasta.slice(5)})`);
  L.push(`👥 Seguidores: <b>${fin}</b>${inicio !== null ? ` (${fin - inicio >= 0 ? "+" : ""}${fin - inicio})` : ""}${seVan.length ? ` · se van: ${seVan.map((c) => "@" + c).join(", ")}` : ""}`);
  if (porQue.length) L.push(`<b>Quién nos sigue y por qué</b>\n${porQue.map((p) => `• @${e(p.cuenta)} — ${e(p.motivo)}`).join("\n")}`);
  L.push(`❤️ Me gusta recibidos: ${megusta.length}${quien.length ? ` (${quien.slice(0, 5).map((q) => `@${q.cuenta} ${q.n}`).join(", ")})` : ""} · 💬 comentarios: ${semana.recibidos.comentarios}`);
  L.push(`🎯 Nosotros: ${semana.nuestras.seguir} seguidas (nos devuelven ${semana.nuestras.devuelven}, ${semana.nuestras.devuelvenPct} %) · ${semana.nuestras.comentar} comentarios · ${semana.nuestras.megusta} me gusta`);
  L.push(`👁 Cuentas alcanzadas: ${alcance}${dif(alcance, ant?.alcance)}`);
  if (pubs.length) L.push(`<b>Publicaciones</b>\n${pubs.map((p) => `• ${p.fecha.slice(5)} ${p.tipo}: ${p.vistas} visualiz. · ${p.likes} me gusta`).join("\n")}`);
  L.push(`🧠 <b>Lo aprendido</b>\n${aprendizajes.map((a) => "• " + e(a)).join("\n")}`);
  if (revision.length) L.push(`🔁 <b>¿Funcionó lo que decidimos?</b>\n${revision.map((a) => "• " + e(a)).join("\n")}`);
  L.push(decisiones.length ? `✅ <b>Esta semana hago</b>\n${decisiones.map((a) => "• " + e(a)).join("\n")}` : "✅ Esta semana sigo igual: no hay datos para cambiar nada todavía.");
  return { semana, texto: L.join("\n\n") };
}
