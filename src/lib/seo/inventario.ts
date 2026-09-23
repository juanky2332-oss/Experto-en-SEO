import "server-only";
import { listar, categorias, type Entrada, type Termino, SITE } from "../wp";
import { analizar, detectarCanibalizacion, enlacesEntrantes, urlNormal, type Analisis, type Contexto } from "./analizar";
import { sql } from "../db";

export type Fila = Entrada & { analisis: Analisis };
export type Inventario = {
  posts: Fila[];
  paginas: Fila[];
  categorias: Termino[];
  ctx: Contexto;
  salud: number; // media ponderada de los publicados
};

export const anioActual = () => Number(new Date().toLocaleDateString("en-GB", { timeZone: "Europe/Madrid", year: "numeric" }));

export async function inventario(): Promise<Inventario> {
  const [posts, paginas, cats] = await Promise.all([listar("post"), listar("page"), categorias()]);
  const publicados = [...posts, ...paginas].filter((e) => e.status === "publish");
  const ctx: Contexto = {
    anio: anioActual(),
    urlsInternas: new Set([`${SITE}/`, ...publicados.map((e) => urlNormal(e.link)), ...cats.map((c) => `${SITE}/category/${c.slug}/`)]),
    entrantes: enlacesEntrantes(publicados),
    similares: detectarCanibalizacion(posts.filter((e) => e.status === "publish")),
  };
  const conAnalisis = (e: Entrada): Fila => ({ ...e, analisis: analizar(e, ctx) });
  const P = posts.map(conAnalisis);
  const G = paginas.map(conAnalisis);
  const pub = P.filter((p) => p.status === "publish");
  const salud = pub.length ? Math.round(pub.reduce((a, p) => a + p.analisis.score, 0) / pub.length) : 0;
  return { posts: P, paginas: G, categorias: cats, ctx, salud };
}

/** Guarda la foto del día (una vez al día basta; lo llama el cron y el botón "Reanalizar"). */
export async function guardarFoto(inv: Inventario) {
  const filas = [...inv.posts, ...inv.paginas].filter((p) => p.status === "publish");
  const datos = filas.map((f) => ({ post_id: f.id, title: f.title, url: f.link, score: f.analisis.score, issues: f.analisis.problemas, metrics: f.analisis.metricas }));
  const json = JSON.stringify(datos);
  await sql`insert into seo.post_scores (post_id, title, url, score, issues, metrics, updated_at)
    select post_id, title, url, score, issues, metrics, now()
    from json_to_recordset((${json}::text)::json) as x(post_id int, title text, url text, score int, issues jsonb, metrics jsonb)
    on conflict (post_id) do update set title = excluded.title, url = excluded.url, score = excluded.score, issues = excluded.issues, metrics = excluded.metrics, updated_at = now()`;
  await sql`insert into seo.score_history (fecha, post_id, score)
    select current_date, post_id, score from json_to_recordset((${json}::text)::json) as x(post_id int, score int)
    on conflict (fecha, post_id) do update set score = excluded.score`;
  // puntuación global del sitio: post_id = 0 (no existe ninguna entrada con id 0)
  await sql`insert into seo.score_history (fecha, post_id, score) values (current_date, 0, ${inv.salud})
    on conflict (fecha, post_id) do update set score = excluded.score`;
}

export async function historialSalud(dias = 60) {
  return sql<{ fecha: string; score: number }[]>`
    select to_char(fecha, 'YYYY-MM-DD') as fecha, score from seo.score_history
    where post_id = 0 and fecha > current_date - ${dias}::int order by fecha`;
}
