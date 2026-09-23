import "server-only";
import { sql } from "./db";
import { listar } from "./wp";
import { buscarTema, type IdeaTema } from "./ai";
import { registrar, type Origen } from "./acciones";

export type ItemTema = {
  id: number; titulo: string; url: string; fuente: string; fecha: string; resumen: string; por_que: string;
  keyword: string; interes: number; intencion: string; ya_cubierto: string; status: string;
};
export type ResultadoBusqueda = { consulta: string; panorama: string; ideas: IdeaTema[]; items: ItemTema[]; creado: string };

/** Busca en la web lo mejor sobre un tema y lo deja en el radar listo para preparar. */
export async function investigarTema(consulta: string, origin: Origen): Promise<ResultadoBusqueda> {
  const q = consulta.trim().slice(0, 200);
  if (q.length < 3) throw new Error("Escribe un tema un poco más concreto");
  const blog = (await listar("post", "publish")).map((p) => p.title);
  const r = await buscarTema(q, blog);
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Madrid" });
  const validos = r.resultados.filter((x) => /^https?:\/\/[^\s]+\.[a-z]{2,}/i.test(x.url) && !/news\.google\.|google\.com\/search/i.test(x.url));
  const items: ItemTema[] = [];
  for (const x of validos) {
    const fecha = /^\d{4}-\d{2}-\d{2}$/.test(x.fecha) ? x.fecha : null;
    const [fila] = await sql<{ id: number; status: string }[]>`
      insert into seo.radar (url, title, source, published_at, snippet, resumen, score, motivo, keyword, cluster, status, digest_date)
      values (${x.url}, ${x.titulo}, ${x.fuente}, ${fecha}, ${x.resumen}, ${x.resumen}, ${x.interes},
              ${x.ya_cubierto ? `${x.por_que} · Ya cubierto en: ${x.ya_cubierto}` : x.por_que}, ${x.keyword}, ${"búsqueda: " + q}, 'new', ${hoy})
      on conflict (url) do update set score = excluded.score, resumen = excluded.resumen, motivo = excluded.motivo,
        keyword = excluded.keyword, cluster = excluded.cluster
      returning id, status`;
    items.push({ ...x, id: fila.id, status: fila.status });
  }
  items.sort((a, b) => b.interes - a.interes);
  const res: ResultadoBusqueda = { consulta: q, panorama: r.panorama, ideas: r.ideas, items, creado: new Date().toISOString() };
  await sql`insert into seo.audits (kind, target, score, data) values ('busqueda', ${q}, ${items[0]?.interes ?? 0}, ${sql.json(res as never)})`;
  await registrar({ origin, action: "buscar_tema", target_type: "tema", target_id: q, summary: `Búsqueda de temas «${q}»: ${items.length} fuentes y ${r.ideas.length} ideas de artículo` });
  return res;
}

export async function ultimasBusquedas(n = 6) {
  const filas = await sql<{ data: ResultadoBusqueda }[]>`select data from seo.audits where kind = 'busqueda' order by created_at desc limit ${n}`;
  if (!filas.length) return [];
  // estado actual de cada fuente (puede haberse preparado o publicado después)
  const ids = filas.flatMap((f) => f.data.items.map((i) => i.id));
  const estados = new Map((await sql<{ id: number; status: string }[]>`select id, status from seo.radar where id = any(${ids})`).map((e) => [e.id, e.status]));
  return filas.map((f) => ({ ...f.data, items: f.data.items.map((i) => ({ ...i, status: estados.get(i.id) ?? i.status })) }));
}
