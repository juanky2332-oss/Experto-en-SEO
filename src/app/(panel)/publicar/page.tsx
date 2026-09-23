import Link from "next/link";
import { sql, getAjustes } from "@/lib/db";
import { Card, PageHeader, Badge, tonoScore, fecha, Empty, type Tono } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { FormUrl } from "./FormUrl";
import { publicarBrief, rechazarBrief } from "../acciones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Publicar" };

type Brief = {
  id: string; created_at: Date; updated_at: Date; origin: string; source_url: string; source_title: string; source_name: string; status: string;
  post_id: number | null; post_url: string | null; seo_score: number | null; error: string | null;
  brief: { titular?: string; resumen_linea?: string; interes?: number; publicar?: boolean; motivo?: string; keyword_principal?: string; categoria?: string; angulo?: string; canibaliza?: { post_id: number; titulo: string } };
};

const EST: Record<string, { label: string; tone: Tono }> = {
  pending: { label: "Esperando tu aprobación", tone: "amber" },
  generating: { label: "Redactando…", tone: "violet" },
  published: { label: "Publicado", tone: "emerald" },
  draft: { label: "En borrador", tone: "slate" },
  rejected: { label: "Descartado", tone: "slate" },
  failed: { label: "Falló", tone: "rose" },
};

export default async function Publicar() {
  const [briefs, ajustes] = await Promise.all([
    sql<Brief[]>`select id, created_at, updated_at, origin, source_url, source_title, source_name, status, post_id, post_url, seo_score, error, brief
      from seo.briefs order by created_at desc limit 60`,
    getAjustes(),
  ]);
  const pendientes = briefs.filter((b) => b.status === "pending");
  const resto = briefs.filter((b) => b.status !== "pending");
  return (
    <>
      <PageHeader title="Publicar" subtitle="Pega el enlace de una noticia de IA: la leo, te preparo el resumen con veredicto editorial y, si lo apruebas, redacto, genero las fotos y publico con el SEO completo.">
        <Badge tone={ajustes.modo === "publicar" ? "emerald" : "amber"}>{ajustes.modo === "publicar" ? `Publicación automática si SEO ≥ ${ajustes.score_minimo}` : "Siempre en borrador"}</Badge>
      </PageHeader>
      <Card className="mb-6" title="Nueva publicación a partir de una noticia" subtitle="También puedes mandar el enlace al bot de Telegram; es lo mismo.">
        <FormUrl />
        <ol className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-5">
          {["Lee la noticia (o la rescata con un lector alternativo)", "Brief: resumen, interés, keyword, preguntas y canibalización", "Tú apruebas aquí o en Telegram", "Investiga hoy en la web, redacta, controla el SEO y lo revisa", "3 fotos realistas WebP, Rank Math, IndexNow y aviso"].map((t, i) => (
            <li key={i} className="rounded-lg bg-slate-50 p-2.5"><b className="text-slate-700">{i + 1}.</b> {t}</li>
          ))}
        </ol>
      </Card>

      <Card className="mb-6" title={`Pendientes de aprobar (${pendientes.length})`}>
        {pendientes.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {pendientes.map((b) => <FilaBrief key={b.id} b={b} />)}
          </ul>
        ) : <Empty>No hay propuestas esperando. Las del radar diario llegan cada mañana.</Empty>}
      </Card>

      <Card title="Historial de publicaciones">
        {resto.length ? <ul className="divide-y divide-[var(--line)]">{resto.map((b) => <FilaBrief key={b.id} b={b} />)}</ul> : <Empty>Aún no hay publicaciones con el sistema nuevo.</Empty>}
      </Card>
    </>
  );
}

function FilaBrief({ b }: { b: Brief }) {
  const e = EST[b.status] ?? { label: b.status, tone: "slate" as Tono };
  const colgado = b.status === "generating" && Date.now() - new Date(b.updated_at).getTime() > 20 * 60_000;
  return (
    <li className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-900">{b.brief.titular ?? b.source_title}</p>
        {b.brief.resumen_linea && <p className="mt-0.5 text-sm text-slate-600">{b.brief.resumen_linea}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <Badge tone={e.tone}>{colgado ? "Se quedó colgado" : e.label}</Badge>
          {typeof b.brief.interes === "number" && <Badge tone={tonoScore(b.brief.interes)}>Interés {b.brief.interes}</Badge>}
          {b.seo_score != null && <Badge tone={tonoScore(b.seo_score)}>SEO {b.seo_score}</Badge>}
          {b.brief.keyword_principal && <Badge tone="blue">{b.brief.keyword_principal}</Badge>}
          <span>{b.source_name} · {fecha(b.created_at, true)} · vía {b.origin}</span>
          <a href={b.source_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">fuente</a>
        </div>
        {b.brief.canibaliza?.post_id ? <p className="mt-1 text-xs text-amber-700">⚠️ Parecido a «{b.brief.canibaliza.titulo}» (#{b.brief.canibaliza.post_id})</p> : null}
        {b.brief.motivo && b.status === "pending" && <p className="mt-1 text-xs text-slate-500">{b.brief.motivo}</p>}
        {b.error && <p className="mt-1 text-xs text-rose-600">{b.error}</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        {(b.status === "pending" || b.status === "failed" || b.status === "rejected" || colgado) && (
          <BotonAccion accion={publicarBrief.bind(null, b.id)} className="btn btn-primary">{b.status === "pending" ? "Redactar y publicar" : "Reintentar"}</BotonAccion>
        )}
        {b.status === "pending" && <BotonAccion accion={rechazarBrief.bind(null, b.id)} className="btn btn-ghost">Descartar</BotonAccion>}
        {b.post_id && <Link href={`/articulos/${b.post_id}`} className="btn btn-soft">Editar</Link>}
        {b.post_url && b.status === "published" && <a href={b.post_url} target="_blank" rel="noreferrer" className="btn btn-ghost">Ver</a>}
      </div>
    </li>
  );
}
