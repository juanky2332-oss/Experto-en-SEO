import "server-only";
import { sql } from "../db";
import { inventario } from "../seo/inventario";
import { getGuia, getRadarConfig, normalizar, type Guia, type RadarConfig } from "../guia";
import { RE_MARCAS } from "./prioridad";

// Señales que alimentan «Qué publicar». Todo se lee en directo; consultas a Postgres en tandas de ≤3 (pool max 3).

export type Plazo = { id: string; titulo: string; fecha: string | null; estado: "confirmado" | "por_confirmar"; nota: string; keywords: string[] };
export type Programado = { id: number; titulo: string; keyword: string; fecha: string; slug: string };
export type PaginaSenal = { slug: string; ruta: string; titulo: string; keyword: string; visitas30: number; conversiones: number };

export type Senales = {
  guia: Guia;
  radarCfg: RadarConfig;
  /** solo si el radar está encendido; apagado = lista vacía (decisión del usuario 2026-10-14) */
  radar: { id: number; titulo: string; keyword: string; score: number }[];
  publicados: { titulo: string; keyword: string; slug: string; fecha: string }[];
  programados: Programado[];
  paginas: PaginaSenal[];
  pilares: { nombre: string; categoria: string; total: number; ultimo: string | null }[];
  canibalizacion: { titulo: string; con: string }[];
  huerfanos: { titulo: string; slug: string }[];
  sinVisitas: string[]; // rutas de páginas comerciales sin visitas en 30 días
  medicionDesde: string | null;
  conversiones: Record<string, number>; // por página de entrada
  plazos: Plazo[];
};

// Páginas que no se recomiendan como destino (legales o productos antiguos en noindex)
const PAGINAS_FUERA = new Set(["privacidad", "app-transforma-note", "auditoria", "gestoria-tu-gestor-de-documentos", "xperto-industrial", "contacto", "blog", "transforma-con-ia", "quienes-somos", "diseno-web"]);

export async function getPlazos(): Promise<Plazo[]> {
  const [r] = await sql<{ value: Plazo[] }[]>`select value from seo.settings where key = 'qp_plazos'`;
  return Array.isArray(r?.value) ? r.value : [];
}

export async function recogerSenales(): Promise<Senales> {
  // tanda 1: WordPress (pasarela) + 2 consultas
  const [inv, guia, radarCfg] = await Promise.all([inventario(), getGuia(), getRadarConfig()]);
  // tanda 2: 3 consultas
  const [radar, visitas, conv] = await Promise.all([
    radarCfg.activo
      ? sql<{ id: number; titulo: string; keyword: string; score: number }[]>`
          select id, title titulo, coalesce(keyword, '') keyword, score from seo.radar
          where score >= 60 and created_at > now() - interval '14 days' and status in ('new', 'sent', 'seen') order by score desc limit 25`
      : Promise.resolve([]),
    sql<{ ruta: string; n: number; desde: Date | null }[]>`
      select ruta, count(*)::int n, min(created_at) desde from seo.visitas where evento = 'visita' and created_at > now() - interval '30 days' group by ruta`,
    sql<{ etiqueta: string; n: number }[]>`
      select coalesce(etiqueta, '') etiqueta, count(*)::int n from seo.visitas where evento = 'conversion' group by 1`,
  ]);
  const plazos = await getPlazos();

  const pub = inv.posts.filter((p) => p.status === "publish");
  const kw = (m: { rank_math_focus_keyword?: string }) => m.rank_math_focus_keyword ?? "";
  const visitasDe = new Map(visitas.map((v) => [v.ruta, v.n]));
  const conversiones: Record<string, number> = {};
  for (const c of conv) {
    const ruta = c.etiqueta.replace(/^https?:\/\/[^/]+/, "").replace(/[?#].*$/, "") || "/";
    conversiones[ruta] = (conversiones[ruta] ?? 0) + c.n;
  }
  const paginas: PaginaSenal[] = inv.paginas
    .filter((p) => p.status === "publish" && !PAGINAS_FUERA.has(p.slug))
    .map((p) => ({ slug: p.slug, ruta: `/${p.slug}/`, titulo: p.title, keyword: kw(p.meta), visitas30: visitasDe.get(`/${p.slug}/`) ?? 0, conversiones: conversiones[`/${p.slug}/`] ?? 0 }));
  const desde = visitas.map((v) => v.desde).filter(Boolean).sort((a, b) => +a! - +b!)[0];

  const pilares = guia.pilares.map((pl) => {
    const kws = pl.keywords.map(normalizar).filter(Boolean);
    const ps = pub.filter((p) => kws.some((k) => normalizar(`${p.title} ${kw(p.meta)} ${p.slug.replace(/-/g, " ")}`).includes(k)));
    return { nombre: pl.nombre, categoria: pl.categoria, total: ps.length, ultimo: ps.map((p) => p.date).sort().at(-1) ?? null };
  });
  const problema = (codigo: string) => pub.filter((p) => p.analisis.problemas.some((x) => x.codigo === codigo));

  return {
    guia, radarCfg,
    radar: radar.filter((r) => !RE_MARCAS.test(`${r.titulo} ${r.keyword}`)),
    publicados: pub.map((p) => ({ titulo: p.title, keyword: kw(p.meta), slug: p.slug, fecha: p.date.slice(0, 10) })),
    programados: inv.posts.filter((p) => p.status === "future").sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ id: p.id, titulo: p.title, keyword: kw(p.meta), fecha: p.date.slice(0, 10), slug: p.slug })),
    paginas, pilares,
    canibalizacion: problema("canibalizacion").map((p) => ({ titulo: p.title, con: p.analisis.problemas.find((x) => x.codigo === "canibalizacion")?.detalle ?? "" })),
    huerfanos: problema("huerfano").map((p) => ({ titulo: p.title, slug: p.slug })),
    sinVisitas: paginas.filter((p) => p.visitas30 === 0).map((p) => p.ruta),
    medicionDesde: desde ? desde.toISOString().slice(0, 10) : null,
    conversiones, plazos,
  };
}
