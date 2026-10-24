import "server-only";
// «Dame una idea»: UNA publicación para AHORA, sin programar nada para más adelante.
//   1) idea = la recomendación de artículo con más prioridad (el estratega ya cruza la web, la guía,
//      las visitas, Search Console y el radar); si no queda ninguna, pide temas nuevos una vez.
//   2) «Sí, redáctalo» = brief + redacción directa como BORRADOR (sin aprobar nada en Telegram).
//   3) «Publicar ya» = el borrador pasa a publicado en transformaconia.com en ese momento.
import { sql } from "../db";
import { publicador } from "../gateway";
import { editar, type Origen } from "../acciones";
import { ahoraWp } from "../wp";
import { generarQuePublicar } from "./generar";
import { rec as leerRec, type Rec } from "./datos";

export type EstadoBrief = { id: string; status: string; post_id: number | null; post_url: string | null; seo_score: number | null; error: string | null };
export type Idea = { rec: Rec; brief: EstadoBrief | null; desde: string; atascada: boolean };

const CLAVE = "idea_actual";

async function guardar(recId: number | null) {
  await sql`insert into seo.settings (key, value) values (${CLAVE}, ${sql.json({ rec_id: recId, desde: new Date().toISOString() } as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

/** La idea que se está viendo ahora (con el estado de su borrador si ya se pidió). */
export async function ideaActual(): Promise<Idea | null> {
  const [fila] = await sql<{ value: { rec_id: number | null; desde: string } }[]>`select value from seo.settings where key = ${CLAVE}`;
  if (!fila?.value?.rec_id) return null;
  const r = await leerRec(fila.value.rec_id);
  if (!r) return null;
  const [b] = r.brief_id
    ? await sql<EstadoBrief[]>`select id, status, post_id, post_url, seo_score, error from seo.briefs where id = ${r.brief_id}::uuid`
    : [];
  // en redacción y sin brief a los 10 minutos = algo se quedó a medias: se ofrece pedir otra idea
  const atascada = r.estado === "en_brief" && !b && Date.now() - new Date(fila.value.desde).getTime() > 10 * 60 * 1000;
  return { rec: r, brief: b ?? null, desde: fila.value.desde, atascada };
}

const candidata = async (saltar: number[]) =>
  (await sql<{ id: number }[]>`select id from seo.qp_recs where estado = 'abierta' and destino = 'articulo'
    and not (id = any(${saltar})) order by prioridad desc, id limit 1`)[0]?.id ?? null;

/**
 * Una idea nueva para publicar ya. La de antes, si no se llegó a redactar, queda como «saltada»
 * (no es un «no me interesa»: no enseña nada al estratega, solo no se vuelve a proponer).
 */
export async function darIdea(o: { origin: Origen; descartarActual?: "saltada" | "no_interesa" }) {
  const actual = await ideaActual();
  if (actual && (actual.rec.estado === "abierta" || actual.rec.estado === "interesa") && o.descartarActual) {
    if (o.descartarActual === "no_interesa") {
      const { votar } = await import("./datos");
      await votar(actual.rec.id, "no_interesa", o.origin);
    } else await sql`update seo.qp_recs set estado = 'saltada' where id = ${actual.rec.id}`;
  }
  const saltar = actual ? [actual.rec.id] : [];
  // 0 € si nada ha cambiado desde el último lote (reutiliza los candidatos)
  await generarQuePublicar({ origin: o.origin });
  let id = await candidata(saltar);
  if (!id) {
    await generarQuePublicar({ origin: o.origin, forzar: true }); // temas nuevos (~0,03 €)
    id = await candidata(saltar);
  }
  if (!id) throw new Error("Ahora mismo no encuentro un tema que no hayas visto ya. Prueba a cambiar los temas preferidos.");
  await guardar(id);
  return id;
}

/** «Sí, redáctalo»: brief + redacción directa como borrador. Devuelve cuando la redacción ya está en marcha. */
export async function redactarIdea(recId: number) {
  // Se reclama la idea de forma atómica: un doble clic o dos pestañas no lanzan dos redacciones.
  const [r] = await sql<Rec[]>`update seo.qp_recs set estado = 'en_brief' where id = ${recId} and estado in ('abierta', 'interesa') and brief_id is null
    returning id, keyword, secundarias, intencion, publico, pilar, destino, destino_ref, enlaces, cta, titulo, tipo`;
  if (!r) throw new Error("Esta idea ya se está redactando o ya no está disponible");
  const soltar = () => sql`update seo.qp_recs set estado = 'abierta' where id = ${recId} and brief_id is null`;
  // la hora de la base (la que pone created_at en seo.briefs), no la del servidor
  const [{ t0 }] = await sql<{ t0: Date }[]>`select now() - interval '5 seconds' as t0`;
  try {
    await publicador({
      action: "brief_pista", rec_id: Number(r.id), borrador: true,
      pista: {
        keyword: r.keyword, secundarias: r.secundarias, intencion: r.intencion, publico: r.publico, pilar: r.pilar, categoria: r.pilar,
        destino: r.destino, destino_ref: r.destino_ref, enlaces: r.enlaces, cta: r.cta, titulo: r.titulo, tipo: r.tipo,
      },
    });
  } catch (e) {
    await soltar();
    throw e;
  }
  // El brief tarda ~1 minuto: se espera aquí a que aparezca y se manda a redactar sin pasar por Telegram.
  // Si en esa ventana hay varios briefs de la app, manda el de la misma palabra clave.
  for (let i = 0; i < 45; i++) {
    await new Promise((ok) => setTimeout(ok, 4000));
    const [b] = await sql<{ id: string }[]>`select id from seo.briefs where origin = 'app' and created_at >= ${t0} and post_id is null and status = 'pending'
      and id not in (select brief_id from seo.qp_recs where brief_id is not null)
      order by (lower(brief->>'keyword_principal') = lower(${r.keyword})) desc, created_at desc limit 1`;
    if (b) {
      await sql`update seo.qp_recs set brief_id = ${b.id}::uuid where id = ${recId}`;
      await publicador({ action: "publish", brief_id: b.id });
      return b.id;
    }
  }
  await soltar();
  throw new Error("El resumen está tardando más de lo normal. Te llegará a Telegram y desde allí puedes aprobarlo; aquí puedes volver a intentarlo.");
}

/** «Publicar ya»: el borrador sale en transformaconia.com en este momento. */
export async function publicarIdea(recId: number, origin: Origen) {
  const i = await ideaActual();
  if (!i || String(i.rec.id) !== String(recId) || !i.brief?.post_id) throw new Error("Esta idea aún no tiene borrador");
  if (i.brief.status !== "draft") throw new Error("Este artículo ya no está en borrador");
  await editar(i.brief.post_id, { status: "publish", date: ahoraWp() }, { origin, tipo: "post", motivo: "Publicado desde «Dame una idea»" });
  await sql`update seo.qp_recs set estado = 'publicada' where id = ${recId}`;
  await sql`update seo.briefs set status = 'published', updated_at = now() where id = ${i.brief.id}::uuid`;
  return i.brief.post_id;
}

/** Cierra la tarjeta de la idea (un borrador ya redactado se queda en WordPress, en Artículos). */
export async function cerrarIdea() {
  await guardar(null);
}
