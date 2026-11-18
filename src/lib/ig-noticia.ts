import "server-only";
// 18-11-2026 (él: «organízate para tener las noticias que hagan falta actualizadas para hacer las historias y no fallar
// con las fechas»).
// · Noticia del día: a las 13:00 (L-V) se mira lo que el radar ha encontrado (seo.radar, busca cada mañana a las 8) y, si
//   hay una noticia REAL y útil para empresas e industria de aquí, se prepara una historia del estilo 3 con su fuente y
//   «qué hacer», y te llega por Telegram con un botón para quitarla. Sale a las 20:30 COMO EXTRA: no quita ninguna de las
//   2 programadas. Si no hay nada que valga la pena, no sale nada (mejor nada que relleno).
// · Calendario fijo: si una historia programada no sale su día, NO empuja a las demás; se recoloca en el primer hueco libre.
// · Aviso cuando el calendario se acaba (quedan menos de 2 semanas).
import { sql } from "@/lib/db";
import { telegram, esc } from "@/lib/gateway";
import { json, MODELO } from "@/lib/ai";
import { DIA_SEMANA } from "@/lib/ritmo";

const BASE = process.env.APP_URL ?? "https://experto-en-seo.vercel.app";
const hoy = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
const sumar = (f: string, d: number) => new Date(Date.parse(f + "T12:00:00Z") + d * 86400_000).toISOString().slice(0, 10);
const laborable = (f: string) => DIA_SEMANA(f) <= 5;
const POSES = ["senala", "piensa", "celebra", "malabares", "saluda"] as const;

type Cand = { id: number; title: string; source: string; url: string; published_at: Date | null; resumen: string | null; snippet: string | null; score: number | null };
type Propuesta = { hay: boolean; radar_id: number; motivo: string; murcia: boolean; titulo: string; acento: string; puntos: string[]; dice: string; tuerqui: string };

const SISTEMA = `Eres el editor de las historias de Instagram de Transforma con IA (Murcia): ayudamos a empresas, talleres e industria de la Región de Murcia con IA, automatización y programas de gestión.
Te paso noticias REALES que ha encontrado nuestro radar. Elige COMO MUCHO UNA que le sirva de verdad, hoy, al dueño de una pyme industrial, un taller o una empresa de servicios de aquí: ayudas y subvenciones, normativa que le obliga (factura electrónica, Verifactu…), herramientas de IA que puede usar ya, casos reales de industria, cosas de la Región de Murcia.
NO valen: rondas de financiación, bolsa, salidas a bolsa, cotilleos de grandes tecnológicas, política, modelos nuevos que no cambian nada a una pyme, noticias de fuera sin aplicación aquí. Si ninguna vale, devuelve hay=false (mejor nada que relleno).
Con la elegida escribe la historia (dura 5 segundos: muy poco texto, español de España, directo, que se entienda a la primera):
- titulo: máximo 45 caracteres, una frase o pregunta clara sobre la noticia («Ayudas para que tu nave gaste menos luz»). Sin siglas raras.
- acento: 1 a 3 palabras SEGUIDAS copiadas tal cual del título, las que más importan (van en color).
- puntos: exactamente 2 «qué hacer» concretos, en imperativo, máximo 42 caracteres cada uno («Junta las facturas de luz de un año»).
- dice: lo que dice Tuerqui (nuestra mascota, una tuerca simpática) en un bocadillo: máximo 65 caracteres, gracioso pero profesional y lógico, que ofrezca ayuda sin vender en frío. Nunca precios.
- tuerqui: la pose que mejor encaja: ${POSES.join(", ")}.
- murcia: true si la noticia es de la Región de Murcia.
No inventes NADA que no esté en el texto de la noticia: ni cifras, ni plazos, ni requisitos. Nada de precios nuestros, comisiones ni cupones.`;

const ESQUEMA = {
  type: "object", additionalProperties: false,
  required: ["hay", "radar_id", "motivo", "murcia", "titulo", "acento", "puntos", "dice", "tuerqui"],
  properties: {
    hay: { type: "boolean" }, radar_id: { type: "integer", description: "id de la noticia elegida (0 si no hay)" },
    motivo: { type: "string", description: "por qué le sirve a una pyme de aquí (o por qué ninguna vale)" },
    murcia: { type: "boolean" }, titulo: { type: "string" }, acento: { type: "string" },
    puntos: { type: "array", items: { type: "string" } }, dice: { type: "string" }, tuerqui: { type: "string", enum: [...POSES] },
  },
};

/** «Europa Press Murcia (búsqueda: …) · 13 nov» */
function fuenteDe(c: Cand) {
  const medio = c.source.replace(/\s*\(.*?\)\s*/g, " ").replace(/\s+/g, " ").trim();
  const f = c.published_at ? new Date(c.published_at).toLocaleDateString("es-ES", { day: "numeric", month: "short", timeZone: "Europe/Madrid" }).replace(".", "") : "";
  return f ? `${medio} · ${f}` : medio;
}

/** Comprueba que la historia cumple las reglas (si no, no sale: mejor nada que un fallo). */
function revisar(p: Propuesta): string | null {
  if (p.titulo.length > 48) return "título largo";
  if (!p.acento || !p.titulo.includes(p.acento)) return "acento fuera del título";
  if (p.puntos.length !== 2 || p.puntos.some((x) => !x.trim() || x.length > 46)) return "pasos";
  if (!p.dice || p.dice.length > 72) return "bocadillo";
  const todo = [p.titulo, ...p.puntos, p.dice].join(" ");
  if (/flownexion|comisi[oó]n|cup[oó]n|descuento/i.test(todo)) return "palabra prohibida";
  if (/\d+\s?(€|euros)\b.*(nuestro|te cobramos|cuesta)/i.test(todo)) return "precio";
  return null;
}

/** 13:00 L-V: prepara la historia de la noticia del día (si hay una que valga la pena). */
export async function noticiaDelDia(opts: { avisar?: boolean; prueba?: boolean } = {}) {
  const f = hoy();
  if (!laborable(f) && !opts.prueba) return { ok: true, nada: "fin de semana" };
  const id = `hn-${f}`;
  const [ya] = await sql<{ estado: string }[]>`select estado from seo.ig_cola where id = ${id}`;
  if (ya && !opts.prueba) return { ok: true, ya: ya.estado };
  const usadas = (await sql<{ r: string | null }[]>`select datos->>'radar_id' r from seo.ig_cola where id like 'hn-%'`).map((x) => Number(x.r)).filter(Boolean);
  const cands = (await sql<Cand[]>`select id, title, source, url, published_at, resumen, snippet, score from seo.radar
    where coalesce(published_at, created_at) > now() - interval '3 days' and coalesce(score, 0) >= 50 and coalesce(status, '') <> 'skip'
    order by score desc nulls last limit 30`).filter((c) => !usadas.includes(c.id)).slice(0, 20);
  if (!cands.length) return { ok: true, nada: "el radar no tiene noticias de estos días" };

  const p = await json<Propuesta>({
    sistema: SISTEMA, nombre: "historia_noticia", esquema: ESQUEMA, modelo: MODELO, esfuerzo: "medium", maxTokens: 4000,
    usuario: `Hoy es ${f}. Noticias:\n${JSON.stringify(cands.map((c) => ({ id: c.id, titular: c.title, medio: c.source, fecha: c.published_at, resumen: c.resumen ?? c.snippet ?? "" })))}`,
  });
  const c = cands.find((x) => x.id === p.radar_id);
  if (!p.hay || !c) return { ok: true, nada: p.motivo };
  const fallo = revisar(p);
  if (fallo) {
    if (opts.avisar !== false && !opts.prueba) await telegram(`📰 Hoy había una noticia («${esc(c.title)}») pero la historia no pasaba la revisión (${fallo}). No sale; las 2 programadas salen igual.`);
    return { ok: true, nada: `no pasa la revisión: ${fallo}` };
  }
  const datos = {
    v: 3, plantilla: "noticia", etiqueta: p.murcia ? "Noticia · Región de Murcia" : "Noticia", titulo: p.titulo.trim(), acento: p.acento.trim(),
    fuente: fuenteDe(c), puntos: p.puntos.map((x) => x.trim()), dice: p.dice.trim(), tuerqui: p.tuerqui, radar_id: c.id, url: c.url,
  };
  if (opts.prueba) return { ok: true, prueba: true, noticia: c.title, motivo: p.motivo, datos };
  const [m] = await sql<{ n: number }[]>`select coalesce(max(orden), 0)::int n from seo.ig_cola where tipo = 'historia'`;
  await sql`insert into seo.ig_cola (id, tipo, titulo, texto, estado, datos, historia_url, orden, fecha)
    values (${id}, 'historia', ${datos.titulo}, '', 'pendiente', ${sql.json(datos as never)}, ${`${BASE}/api/ig/historia?id=${id}`}, ${m.n + 1}, ${f})
    on conflict (id) do nothing`;
  if (opts.avisar !== false) await telegram(
    `📰 <b>Noticia de hoy para las historias (20:30)</b>\n${esc(datos.titulo)}\nFuente: <a href="${esc(c.url)}">${esc(datos.fuente)}</a>\nPor qué: ${esc(p.motivo)}\n\nAsí queda: ${BASE}/api/ig/historia?id=${id}\n\nSale como extra; las 2 programadas salen igual. Si no te convence, quítala.`,
    [{ text: "❌ Quitar la noticia", data: `app:hnno:${id}` }],
  );
  return { ok: true, id, titulo: datos.titulo };
}

/** Botón «Quitar la noticia». */
export async function quitarNoticia(id: string) {
  const r = await sql`update seo.ig_cola set estado = 'descartado' where id = ${id} and id like 'hn-%' and estado in ('pendiente', 'propuesto') returning id`;
  return r.length ? "Hecho: la noticia de hoy no sale. Las 2 programadas salen igual a las 20:30." : "Esa noticia ya no estaba pendiente (o ya ha salido).";
}

/** Las historias programadas que no salieron su día se recolocan en el primer día laborable con hueco (máx. 2 programadas
 *  por día), así las demás siguen en su fecha. Las noticias atrasadas no se recolocan: una noticia vieja no vale. */
export async function recolocarAtrasadas() {
  const f = hoy();
  const atrasadas = await sql<{ id: string }[]>`select id from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto')
    and orden is not null and fecha < ${f}::date order by fecha, orden`;
  const movidas: string[] = [];
  for (const a of atrasadas) {
    if (a.id.startsWith("hn-")) { await sql`update seo.ig_cola set estado = 'descartado' where id = ${a.id}`; continue; }
    for (let d = 1; d < 120; d++) {
      const dia = sumar(f, d);
      if (!laborable(dia)) continue;
      const [n] = await sql<{ n: number }[]>`select count(*)::int n from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto')
        and fecha = ${dia}::date and id not like 'hn-%'`;
      if (n.n < 2) { await sql`update seo.ig_cola set fecha = ${dia} where id = ${a.id}`; movidas.push(`${a.id} → ${dia}`); break; }
    }
  }
  return movidas;
}

/** Hasta qué día hay historias programadas y si hay que avisar (menos de 2 semanas). */
export async function coberturaHistorias() {
  const [r] = await sql<{ fin: string | null }[]>`select max(fecha)::text fin from seo.ig_cola where tipo = 'historia' and estado in ('pendiente', 'propuesto') and orden is not null and id not like 'hn-%'`;
  const fin = r.fin;
  const avisar = !fin || fin < sumar(hoy(), 14);
  const bonita = fin ? new Date(fin + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : null;
  return { fin, avisar, texto: fin ? `📲 Historias programadas hasta el ${bonita}.` : "📲 No quedan historias programadas.", };
}
