import Link from "next/link";
import { Compass, Sparkles } from "lucide-react";
import { sql } from "@/lib/db";
import type { Plan } from "@/lib/ai";
import { Card, PageHeader, Badge, Empty, fecha, type Tono } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { generarPlan, resolverRecomendacion } from "../acciones";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Estrategia" };

type Rec = { id: number; created_at: Date; tipo: string; prioridad: "alta" | "media" | "baja"; titulo: string; detalle: string; post_id: number | null; payload: { cambio_titulo?: string }; status: string };

const TIPOS: Record<string, { label: string; tone: Tono; desc: string }> = {
  publicar: { label: "Publicar", tone: "emerald", desc: "Temas nuevos con oportunidad ahora" },
  actualizar: { label: "Actualizar", tone: "blue", desc: "Artículos existentes que pueden subir" },
  fusionar: { label: "Fusionar / redirigir", tone: "violet", desc: "Contenido que compite entre sí" },
  eliminar: { label: "Eliminar", tone: "rose", desc: "Borradores o duplicados sin valor" },
  estructura: { label: "Estructura", tone: "amber", desc: "Categorías, pilares y enlazado" },
  tecnico: { label: "Técnico", tone: "slate", desc: "Velocidad, indexación, datos estructurados" },
  no_publicar: { label: "No publicar", tone: "slate", desc: "Temas que conviene evitar" },
};
const PRIO: Record<string, Tono> = { alta: "rose", media: "amber", baja: "slate" };

export default async function Estrategia() {
  const [[plan], recs] = await Promise.all([
    sql<{ created_at: Date; data: Plan }[]>`select created_at, data from seo.audits where kind = 'plan' order by created_at desc limit 1`,
    sql<Rec[]>`select * from seo.recommendations where status = 'open' order by case prioridad when 'alta' then 0 when 'media' then 1 else 2 end, id`,
  ]);
  const calendario = [...recs.filter((r) => r.tipo === "publicar"), ...recs.filter((r) => r.tipo === "no_publicar")];
  const grupos = Object.keys(TIPOS).filter((t) => t !== "publicar" && t !== "no_publicar").map((t) => [t, recs.filter((r) => r.tipo === t)] as const).filter(([, l]) => l.length);
  const kw = (d: string) => d.match(/[Kk]eyword «([^»]+)»/)?.[1] ?? "";

  return (
    <>
      <PageHeader title="Estrategia" subtitle="Plan SEO a medida: la IA cruza tu inventario, la auditoría y el radar de noticias para decirte qué publicar, qué no, qué actualizar y qué fusionar.">
        <BotonAccion accion={generarPlan} className="btn btn-primary" confirmar="Voy a analizar todo el blog con IA (1-3 minutos). Las recomendaciones de IA abiertas se sustituyen por las nuevas. ¿Seguimos?">
          <Sparkles size={15} /> {plan ? "Regenerar plan" : "Generar plan"}
        </BotonAccion>
      </PageHeader>

      {calendario.length > 0 && (
        <Card className="mb-6" title="Calendario editorial: qué publicar" subtitle="Ordenado por prioridad. «Buscar fuentes» abre el buscador del Radar con la keyword; desde ahí, «Preparar artículo» lo redacta y publica.">
          <ul className="divide-y divide-[var(--line)]">
            {calendario.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900"><Badge tone={r.tipo === "publicar" ? PRIO[r.prioridad] : "slate"}>{r.tipo === "publicar" ? r.prioridad : "evitar"}</Badge>{r.titulo}</p>
                  <p className="mt-1 text-sm text-slate-600">{r.detalle}</p>
                </div>
                <div className="flex gap-2">
                  {r.tipo === "publicar" && <Link href={`/radar?q=${encodeURIComponent(kw(r.detalle) || r.titulo.replace(/^Semana d+ · (Pilar: )?/, ""))}`} className="btn btn-primary">Buscar fuentes</Link>}
                  <BotonAccion accion={resolverRecomendacion.bind(null, r.id, "applied")} className="btn btn-ghost">Hecho</BotonAccion>
                  <BotonAccion accion={resolverRecomendacion.bind(null, r.id, "dismissed")} className="btn btn-ghost">Descartar</BotonAccion>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {plan ? (
        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-1" title="Diagnóstico" subtitle={`Generado el ${fecha(plan.created_at, true)}`}>
            <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700">{plan.data.diagnostico}</p>
          </Card>
          <Card className="xl:col-span-2" title="Arquitectura de contenidos (clusters)" subtitle="Cada cluster = un artículo pilar enlazado por sus satélites. Así se gana autoridad temática.">
            <div className="grid gap-3 md:grid-cols-2">
              {plan.data.clusters.map((c) => (
                <div key={c.nombre} className="rounded-xl border border-[var(--line)] p-4">
                  <p className="flex items-center gap-2 font-medium"><Compass size={15} className="text-brand-600" /> {c.nombre}</p>
                  <p className="mt-1 text-xs text-slate-500">Pilar: <span className="text-slate-700">{c.pilar}</span></p>
                  {c.articulos.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{c.articulos.map((id) => <Link key={id} href={`/articulos/${id}`}><Badge tone="blue">#{id}</Badge></Link>)}</p>}
                  {c.huecos.length > 0 && <ul className="mt-2 list-disc pl-4 text-xs text-slate-600">{c.huecos.map((h, i) => <li key={i}>{h}</li>)}</ul>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      ) : <div className="mb-6"><Empty>Pulsa «Generar plan» para el primer análisis estratégico.</Empty></div>}

      <div className="space-y-6">
        {grupos.map(([tipo, lista]) => (
          <Card key={tipo} title={<span className="flex items-center gap-2"><Badge tone={TIPOS[tipo].tone}>{TIPOS[tipo].label}</Badge> <span className="text-sm font-normal text-slate-500">{TIPOS[tipo].desc}</span></span>}>
            <ul className="divide-y divide-[var(--line)]">
              {lista.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900"><Badge tone={PRIO[r.prioridad]}>{r.prioridad}</Badge>{r.titulo}</p>
                    <p className="mt-1 text-sm text-slate-600">{r.detalle}</p>
                    {r.payload?.cambio_titulo && <p className="mt-1 text-xs text-brand-700">Título propuesto: «{r.payload.cambio_titulo}»</p>}
                  </div>
                  <div className="flex gap-2">
                    {r.post_id && <Link href={`/articulos/${r.post_id}`} className="btn btn-soft">Abrir #{r.post_id}</Link>}
                    {r.payload?.cambio_titulo && r.post_id ? (
                      <BotonAccion accion={resolverRecomendacion.bind(null, r.id, "applied")} className="btn btn-primary" confirmar={`¿Cambiar el título a «${r.payload.cambio_titulo}»? (se puede deshacer)`}>Aplicar título</BotonAccion>
                    ) : (
                      <BotonAccion accion={resolverRecomendacion.bind(null, r.id, "applied")} className="btn btn-ghost">Hecho</BotonAccion>
                    )}
                    <BotonAccion accion={resolverRecomendacion.bind(null, r.id, "dismissed")} className="btn btn-ghost">Descartar</BotonAccion>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
