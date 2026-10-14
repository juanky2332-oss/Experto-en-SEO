import "server-only";
import { sql } from "../db";
import { tokens, type PorQue } from "./prioridad";
import { estadoTrasVoto, proponerExclusiones, type Feedback, type Voto, VOTOS } from "./aprender";
import { recalcularPesos } from "./generar";

export type Rec = {
  id: number; created_at: Date; lote: string; titulo: string; keyword: string; secundarias: string[]; intencion: string | null; publico: string | null;
  pilar: string | null; tipo: string | null; destino: string; destino_ref: string | null; enlaces: { url: string; ancla: string }[]; cta: string | null;
  por_que: PorQue[]; esfuerzo: string | null; prioridad: number; radar_id: number | null; brief_id: string | null; fecha_plan: string | null; estado: string;
};

const COLS = sql`id, created_at, lote, titulo, keyword, secundarias, intencion, publico, pilar, tipo, destino, destino_ref, enlaces, cta, por_que, esfuerzo, prioridad, radar_id, brief_id, to_char(fecha_plan, 'YYYY-MM-DD') fecha_plan, estado`;

/** Las mejores recomendaciones vivas (abiertas o que interesan), por prioridad. */
export async function topRecs(n = 3) {
  return sql<Rec[]>`select ${COLS} from seo.qp_recs where estado in ('abierta', 'interesa') order by prioridad desc, id limit ${n}`;
}

export async function listarRecs() {
  return sql<Rec[]>`select ${COLS} from seo.qp_recs order by case estado when 'interesa' then 0 when 'abierta' then 1 when 'en_brief' then 2 when 'publicada' then 3 else 4 end, prioridad desc, id limit 120`;
}

/** Guarda el voto, cambia el estado de la recomendación y recalcula los pesos aprendidos. */
export async function votar(id: number, voto: Voto, origen = "app") {
  if (!VOTOS.includes(voto)) throw new Error("Voto no válido");
  const [r] = await sql<Rec[]>`select ${COLS} from seo.qp_recs where id = ${id}`;
  if (!r) throw new Error("No encuentro esa recomendación");
  await sql`insert into seo.qp_feedback (rec_id, voto, origen, pilar, destino, tipo, fuente, tokens)
    values (${id}, ${voto}, ${origen}, ${r.pilar}, ${r.destino}, ${r.tipo}, ${r.por_que[0]?.senal ?? "guia"}, ${tokens(r.keyword)})`;
  await sql`update seo.qp_recs set estado = ${estadoTrasVoto(voto)} where id = ${id}`;
  await recalcularPesos();
  return r;
}

/** Palabras que conviene añadir a «temas en contra» (3+ «no interesa»). */
export async function exclusionesPropuestas(yaExcluidas: string[]) {
  const fb = await sql<Feedback[]>`select created_at, voto, pilar, destino, tipo, fuente, tokens from seo.qp_feedback where voto = 'no_interesa' and created_at > now() - interval '180 days'`;
  return proponerExclusiones(fb, yaExcluidas);
}
