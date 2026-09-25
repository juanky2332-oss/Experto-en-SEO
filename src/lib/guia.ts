import "server-only";
import { sql } from "./db";
import { registrar, type Origen } from "./acciones";
import { GUIA_INICIAL, RADAR_DEFECTO, TIPO_CLAVES, guiaATexto, type Guia, type RadarConfig, type TipoClave } from "./guia-base";

export * from "./guia-base";

// ---------------------------------------------------------------- guía editorial (seo.settings 'guia')
export async function getGuia(): Promise<Guia> {
  const [r] = await sql<{ value: Guia }[]>`select value from seo.settings where key = 'guia'`;
  if (!r) return GUIA_INICIAL;
  // campos nuevos que pueda traer la guía base y no la guardada
  return { ...GUIA_INICIAL, ...r.value, tipos: r.value.tipos?.length ? r.value.tipos : GUIA_INICIAL.tipos };
}

/** Guarda la guía (con su versión en texto para los prompts) y deja el cambio en el historial con deshacer. */
export async function guardarGuia(nueva: Guia, o: { origin: Origen; resumen: string }) {
  const antes = await getGuia();
  const g: Guia = { ...nueva, version: (antes.version ?? 1) + 1, actualizada: new Date().toISOString().slice(0, 10) };
  await sql`insert into seo.settings (key, value) values ('guia', ${sql.json({ ...g, texto: guiaATexto(g) } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  const accion = await registrar({ origin: o.origin, action: "guia", target_type: "ajuste", target_id: "guia", summary: `Guía editorial v${g.version}: ${o.resumen}`, before: antes });
  return { guia: g, accion };
}

// ---------------------------------------------------------------- radar automático (seo.settings 'radar')
export async function getRadarConfig(): Promise<RadarConfig> {
  const [r] = await sql<{ value: Partial<RadarConfig> }[]>`select value from seo.settings where key = 'radar'`;
  return { ...RADAR_DEFECTO, ...(r?.value ?? {}) };
}

export async function getRadarEstado(): Promise<{ ultima_busqueda?: string; origen?: string; hora?: string }> {
  const [r] = await sql<{ value: { ultima_busqueda?: string; origen?: string; hora?: string } }[]>`select value from seo.settings where key = 'radar_estado'`;
  return r?.value ?? {};
}

const limpiarLista = (xs: unknown, max = 12) =>
  [...new Set((Array.isArray(xs) ? xs : []).map((x) => String(x).trim().replace(/\s+/g, " ").slice(0, 60)).filter((x) => x.length > 1))].slice(0, max);

export function validarRadar(c: Partial<RadarConfig>): RadarConfig {
  const base = { ...RADAR_DEFECTO, ...c };
  const tipos = (base.tipos ?? []).filter((t): t is TipoClave => TIPO_CLAVES.includes(t as TipoClave));
  return {
    activo: !!base.activo,
    frecuencia: (["diario", "semanal", "panel"] as const).includes(base.frecuencia) ? base.frecuencia : "diario",
    dia_semana: Math.min(7, Math.max(1, Math.round(Number(base.dia_semana) || 1))),
    hora: Math.min(22, Math.max(6, Math.round(Number(base.hora) || 8))),
    temas: limpiarLista(base.temas, 8),
    excluir: limpiarLista(base.excluir, 12),
    tipos: tipos.length ? tipos : [...TIPO_CLAVES],
    buscar_web: !!base.buscar_web,
    max_propuestas: Math.min(10, Math.max(1, Math.round(Number(base.max_propuestas) || 5))),
    score_minimo: Math.min(95, Math.max(40, Math.round(Number(base.score_minimo) || 70))),
  };
}

export const DIAS = ["", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

export function describirRadar(c: RadarConfig) {
  if (!c.activo) return "Apagado: no busca ni avisa (puedes lanzarlo a mano).";
  const cuando = c.frecuencia === "diario" ? `cada día a las ${c.hora}:00` : c.frecuencia === "semanal" ? `busca cada día a las ${c.hora}:00 y te avisa los ${DIAS[c.dia_semana]}` : `busca cada día a las ${c.hora}:00, sin avisos (solo en el panel)`;
  return `Encendido: ${cuando}${c.temas.length ? ` · prioriza ${c.temas.join(", ")}` : ""}.`;
}

export async function guardarRadarConfig(c: Partial<RadarConfig>, o: { origin: Origen }) {
  const antes = await getRadarConfig();
  const nueva = validarRadar({ ...antes, ...c });
  await sql`insert into seo.settings (key, value) values ('radar', ${sql.json(nueva as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  await registrar({ origin: o.origin, action: "radar_config", target_type: "ajuste", target_id: "radar", summary: `Radar: ${describirRadar(nueva)}`, before: antes });
  return nueva;
}

/** Deshace un cambio de ajustes guardados (guía o radar). */
export async function restaurarAjuste(key: string, valor: unknown) {
  if (key === "guia") {
    const g = valor as Guia;
    await sql`update seo.settings set value = ${sql.json({ ...g, texto: guiaATexto(g) } as never)}, updated_at = now() where key = 'guia'`;
  } else if (key === "radar") {
    await sql`update seo.settings set value = ${sql.json(validarRadar(valor as RadarConfig) as never)}, updated_at = now() where key = 'radar'`;
  } else throw new Error("Ajuste desconocido");
}

// ---------------------------------------------------------------- cobertura real (se recalcula con cada visita)
export type Cobertura = {
  tipos: { clave: TipoClave; nombre: string; total: number; mes: number; trimestre: number; ultimo: string | null }[];
  pilares: { nombre: string; total: number; ultimo: string | null; titulos: string[] }[];
  total: number;
  mes: number;
};

const normalizar = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9.]+/g, " ").trim();

export async function cobertura(g: Guia): Promise<Cobertura> {
  const { listar, categorias } = await import("./wp");
  const [posts, cats] = await Promise.all([listar("post", "publish"), categorias()]);
  const slugDe = new Map(cats.map((c) => [c.id, c.slug]));
  const hace = (d: number) => Date.now() - d * 864e5;
  const tipos = g.tipos.map((t) => {
    const ps = posts.filter((p) => p.categories.some((c) => slugDe.get(c) === t.categoria));
    return {
      clave: t.clave, nombre: t.nombre, total: ps.length,
      mes: ps.filter((p) => Date.parse(p.date) > hace(30)).length,
      trimestre: ps.filter((p) => Date.parse(p.date) > hace(90)).length,
      ultimo: ps.map((p) => p.date).sort().at(-1) ?? null,
    };
  });
  const pilares = g.pilares.map((pl) => {
    const kws = pl.keywords.map(normalizar).filter(Boolean);
    const ps = posts.filter((p) => {
      const t = normalizar(`${p.title} ${p.meta?.rank_math_focus_keyword ?? ""} ${p.slug.replace(/-/g, " ")}`);
      return kws.some((k) => t.includes(k));
    });
    return { nombre: pl.nombre, total: ps.length, ultimo: ps.map((p) => p.date).sort().at(-1) ?? null, titulos: ps.slice(0, 6).map((p) => p.title) };
  });
  return { tipos, pilares, total: posts.length, mes: posts.filter((p) => Date.parse(p.date) > hace(30)).length };
}

async function contextoBlog(g: Guia) {
  const { listar } = await import("./wp");
  const [cob, posts, radar] = await Promise.all([
    cobertura(g),
    listar("post", "publish"),
    sql<{ title: string; score: number; tipo: string | null; keyword: string }[]>`
      select title, score, tipo, keyword from seo.radar where score >= 60 and created_at > now() - interval '14 days' order by score desc limit 20`,
  ]);
  return [
    `PUBLICADO POR TIPO (total · últimos 30 días · 90 días · último): ${cob.tipos.map((t) => `${t.nombre} ${t.total}·${t.mes}·${t.trimestre}·${t.ultimo?.slice(0, 10) ?? "nunca"}`).join(" | ")}`,
    `PUBLICADO POR PILAR: ${cob.pilares.map((p) => `${p.nombre} ${p.total} (último ${p.ultimo?.slice(0, 10) ?? "nunca"})`).join(" | ")}`,
    `ARTÍCULOS PUBLICADOS (fecha · título · keyword):\n${posts.slice(0, 80).map((p) => `- ${p.date.slice(0, 10)} · ${p.title} · ${(p.meta?.rank_math_focus_keyword ?? "").split(",")[0]}`).join("\n")}`,
    `RADAR (últimos 14 días, puntuación · tipo · titular · keyword):\n${radar.map((r) => `- ${r.score} · ${r.tipo ?? "?"} · ${r.title} · ${r.keyword}`).join("\n")}`,
  ].join("\n\n");
}

/** «Pide un cambio»: la IA reescribe la guía según la instrucción y queda en el historial con deshacer. */
export async function pedirCambioGuia(instruccion: string, origin: Origen) {
  const texto = instruccion.trim().slice(0, 1500);
  if (texto.length < 5) throw new Error("Cuéntame un poco más qué quieres cambiar");
  const { modificarGuia } = await import("./ai");
  const g = await getGuia();
  const r = await modificarGuia(g, texto, await contextoBlog(g));
  const { resumen_cambios, ...nueva } = r;
  // salvaguardas: los 6 tipos siempre existen y con estilo de imagen
  const tipos = g.tipos.map((t) => ({ ...t, ...(nueva.tipos.find((n) => n.clave === t.clave) ?? {}) }));
  const { guia, accion } = await guardarGuia({ ...g, ...nueva, tipos }, { origin, resumen: resumen_cambios });
  return { guia, accion, resumen: resumen_cambios };
}

/** Recalcula «qué publicar después» con lo publicado y el radar. */
export async function recalcularProximos(origin: Origen) {
  const { proximosArticulos } = await import("./ai");
  const g = await getGuia();
  const r = await proximosArticulos(guiaATexto(g), await contextoBlog(g));
  const notas = [...new Set([...g.notas, ...r.notas.map((n) => `${new Date().toISOString().slice(0, 10)}: ${n}`)])].slice(-15);
  const { guia } = await guardarGuia({ ...g, proximos: r.proximos, notas }, { origin, resumen: `próximos artículos recalculados (${r.proximos.length}). ${r.diagnostico}` });
  await sql`insert into seo.audits (kind, target, score, data) values ('guia_proximos', 'sitio', ${r.proximos.length}, ${sql.json(r as never)})`;
  return { guia, diagnostico: r.diagnostico };
}

export async function ultimoDiagnostico() {
  const [r] = await sql<{ created_at: Date; data: { diagnostico: string } }[]>`select created_at, data from seo.audits where kind = 'guia_proximos' order by created_at desc limit 1`;
  return r ?? null;
}
