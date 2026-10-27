import "server-only";
import { sql } from "../db";
import { inventario } from "../seo/inventario";
import { getGuia, getRadarConfig, normalizar, type Guia, type RadarConfig } from "../guia";
import { RE_MARCAS } from "./prioridad";
import { ultimaGsc } from "../gsc";
import { casiPagina1, sinPaginaDedicada, type OportunidadGsc } from "./gsc-senal";

// Señales que alimentan «Qué publicar». Todo se lee en directo; consultas a Postgres en tandas de ≤3 (pool max 3).

export type Plazo = { id: string; titulo: string; fecha: string | null; estado: "confirmado" | "por_confirmar"; nota: string; keywords: string[] };
export type Programado = { id: number; titulo: string; keyword: string; fecha: string; slug: string };
export type PaginaSenal = { slug: string; ruta: string; titulo: string; keyword: string; visitas30: number; conversiones: number };

export type Senales = {
  guia: Guia;
  radarCfg: RadarConfig;
  /** noticias de los últimos 7 días; «medios» = cuántos medios distintos cuentan lo mismo en 4 días (movimiento) */
  radar: { id: number; titulo: string; keyword: string; score: number; medios: number }[];
  /** lo último publicado y lo próximo en Instagram, para complementar y no repetir */
  instagram: string[];
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
  /** Search Console (última foto de 28 días); vacío si no está conectado o aún no hay datos */
  gsc: { fecha: string | null; cerca: OportunidadGsc[]; sinPagina: OportunidadGsc[] };
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
    // Las noticias buscadas al pedir una idea cuentan aunque la búsqueda diaria esté apagada (27-10-2026)
    sql<{ id: number; titulo: string; keyword: string; score: number }[]>`
      select id, title titulo, coalesce(keyword, '') keyword, score from seo.radar
      where score >= 55 and created_at > now() - interval '7 days' and status in ('new', 'sent', 'seen') order by score desc limit 25`,
    sql<{ ruta: string; n: number; desde: Date | null }[]>`
      select ruta, count(*)::int n, min(created_at) desde from seo.visitas where evento = 'visita' and created_at > now() - interval '30 days' group by ruta`,
    sql<{ etiqueta: string; n: number }[]>`
      select coalesce(etiqueta, '') etiqueta, count(*)::int n from seo.visitas where evento = 'conversion' group by 1`,
  ]);
  const plazos = await getPlazos();
  // Movimiento: medios distintos con 3+ palabras importantes en común en los últimos 4 días (sin IA, 0 €)
  const recientes = await sql<{ title: string; source: string }[]>`select title, source from seo.radar where created_at > now() - interval '4 days'`;
  const palabras = (t: string) => new Set(t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 4));
  const bolsas = recientes.map((x) => ({ s: x.source, p: palabras(x.title) }));
  const medios = (t: string) => {
    const p = palabras(t);
    const fuentes = new Set<string>();
    for (const b of bolsas) {
      let n = 0;
      for (const w of p) if (b.p.has(w) && ++n >= 3) break;
      if (n >= 3) fuentes.add(b.s);
    }
    return Math.max(1, fuentes.size);
  };
  const instagram = await sql<{ t: string }[]>`
    (select '[publicado ' || to_char(coalesce(publicado_at, fecha), 'DD/MM') || '] ' || titulo t from seo.ig_cola where estado = 'publicado' order by coalesce(publicado_at, fecha) desc nulls last limit 6)
    union all
    (select '[previsto ' || to_char(fecha, 'DD/MM') || '] ' || titulo from seo.ig_cola where estado in ('pendiente','propuesto') and tipo in ('reel','carrusel') order by fecha limit 4)`.catch(() => []);

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

  // Search Console: un fallo aquí nunca debe tumbar «Qué publicar»
  const gsc: Senales["gsc"] = { fecha: null, cerca: [], sinPagina: [] };
  try {
    const g = await ultimaGsc();
    if (g) {
      const texto = new Map<string, string>();
      for (const p of [...inv.paginas, ...inv.posts].filter((x) => x.status === "publish")) texto.set(`/${p.slug}/`, `${p.title} ${kw(p.meta)} ${p.slug.replace(/-/g, " ")}`);
      gsc.fecha = g.fecha;
      gsc.cerca = casiPagina1(g.consultas).slice(0, 15);
      gsc.sinPagina = sinPaginaDedicada(g.consultas, (r) => texto.get(r)).slice(0, 15);
    }
  } catch (e) {
    console.error("gsc-senales", e);
  }

  const pilares = guia.pilares.map((pl) => {
    const kws = pl.keywords.map(normalizar).filter(Boolean);
    const ps = pub.filter((p) => kws.some((k) => normalizar(`${p.title} ${kw(p.meta)} ${p.slug.replace(/-/g, " ")}`).includes(k)));
    return { nombre: pl.nombre, categoria: pl.categoria, total: ps.length, ultimo: ps.map((p) => p.date).sort().at(-1) ?? null };
  });
  const problema = (codigo: string) => pub.filter((p) => p.analisis.problemas.some((x) => x.codigo === codigo));

  return {
    guia, radarCfg,
    radar: radar.filter((r) => !RE_MARCAS.test(`${r.titulo} ${r.keyword}`)).map((r) => ({ ...r, medios: medios(r.titulo) })),
    instagram: instagram.map((x) => x.t),
    publicados: pub.map((p) => ({ titulo: p.title, keyword: kw(p.meta), slug: p.slug, fecha: p.date.slice(0, 10) })),
    // los borradores ya redactados también cuentan: no se propone otra vez un tema que ya está escrito
    programados: inv.posts.filter((p) => p.status === "future" || p.status === "draft").sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ id: p.id, titulo: p.title, keyword: kw(p.meta), fecha: p.date.slice(0, 10), slug: p.slug })),
    paginas, pilares,
    canibalizacion: problema("canibalizacion").map((p) => ({ titulo: p.title, con: p.analisis.problemas.find((x) => x.codigo === "canibalizacion")?.detalle ?? "" })),
    huerfanos: problema("huerfano").map((p) => ({ titulo: p.title, slug: p.slug })),
    sinVisitas: paginas.filter((p) => p.visitas30 === 0).map((p) => p.ruta),
    medicionDesde: desde ? desde.toISOString().slice(0, 10) : null,
    conversiones, plazos, gsc,
  };
}
