import { sql } from "@/lib/db";
import { Card, PageHeader, Badge, tonoScore, fecha, Empty, type Tono } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { prepararRadar, descartarRadar, radarAhora } from "../acciones";
import { Radar as RadarIcon } from "lucide-react";
import { ultimasBusquedas } from "@/lib/temas";
import { BuscadorTemas } from "./BuscadorTemas";
import { ConfigRadar } from "./ConfigRadar";
import Link from "next/link";
import clsx from "clsx";
import { getRadarConfig, getRadarEstado, describirRadar, TIPO_CLAVES } from "@/lib/guia";
import { BadgeTipo, TIPO_UI } from "@/components/tipos";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Radar IA" };

type Item = { id: number; title: string; url: string; source: string; published_at: Date | null; score: number; resumen: string; motivo: string; keyword: string; categoria: string; cluster: string; tipo: string | null; status: string; digest_date: string };
type Digest = { fecha: string; data: { titular_dia?: string; puntos?: { titulo: string; explicacion: string; idx: number }[]; tendencia?: string } };

const EST: Record<string, { label: string; tone: Tono }> = {
  sent: { label: "Propuesta", tone: "violet" }, new: { label: "Por revisar", tone: "slate" }, prepared: { label: "Brief preparado", tone: "amber" },
  published: { label: "Publicada", tone: "emerald" }, skipped: { label: "Descartada", tone: "slate" },
};

export default async function Radar({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string }> }) {
  const { q, tipo } = await searchParams;
  const filtro = TIPO_CLAVES.find((t) => t === tipo) ?? null;
  // en dos tandas de 3: el pool de Postgres tiene 3 conexiones (pooler de Supabase)
  const [digests, todos, fuentes] = await Promise.all([
    sql<Digest[]>`select to_char(fecha,'YYYY-MM-DD') fecha, data from seo.digests order by fecha desc limit 7`,
    sql<Item[]>`select id, title, url, source, published_at, score, resumen, motivo, keyword, categoria, cluster, tipo, status, to_char(digest_date,'YYYY-MM-DD') digest_date
      from seo.radar where score is not null and created_at > now() - interval '14 days' order by digest_date desc, score desc limit 120`,
    sql<{ source: string; n: number }[]>`select source, count(*)::int n from seo.radar where created_at > now() - interval '14 days' group by 1 order by 2 desc`,
  ]);
  const [busquedas, cfg, estado] = await Promise.all([ultimasBusquedas(), getRadarConfig(), getRadarEstado()]);
  const items = filtro ? todos.filter((i) => i.tipo === filtro) : todos;
  const porTipo = new Map<string, number>();
  todos.forEach((i) => i.tipo && porTipo.set(i.tipo, (porTipo.get(i.tipo) ?? 0) + 1));
  const ultima = estado.hora ? `Última búsqueda: ${fecha(estado.hora, true)}.` : "";
  const hoy = digests[0];
  const clusters = new Map<string, number>();
  items.forEach((i) => i.cluster && clusters.set(i.cluster, (clusters.get(i.cluster) ?? 0) + 1));
  const tendencias = [...clusters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <>
      <PageHeader title="Radar IA" subtitle="Leo 21 fuentes de referencia (OpenAI, Anthropic y su blog de ingeniería, versiones de Claude Code, n8n, Cursor, Google, DeepMind, Simon Willison, Latent Space, Xataka…) y busco en la web tus temas preferidos. Clasifico cada noticia por tipo y puntúo qué merece artículo.">
        <BotonAccion accion={radarAhora} className="btn btn-primary"><RadarIcon size={15} /> Lanzar radar ahora</BotonAccion>
      </PageHeader>

      <ConfigRadar inicial={cfg} estado={`${describirRadar(cfg)} ${ultima}`} />

      <BuscadorTemas anteriores={busquedas} inicial={q ?? ""} />

      {hoy ? (
        <div className="mb-6 grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2" title={hoy.data.titular_dia ?? "Resumen del día"} subtitle={`Radar del ${fecha(hoy.fecha)}`}>
            <ul className="space-y-3">
              {hoy.data.puntos?.map((p, i) => <li key={i} className="text-sm"><b className="text-slate-900">{p.titulo}.</b> <span className="text-slate-600">{p.explicacion}</span></li>)}
            </ul>
            {hoy.data.tendencia && <p className="mt-4 rounded-xl bg-brand-50/70 p-3 text-sm text-slate-700"><b className="text-brand-700">Tendencia:</b> {hoy.data.tendencia}</p>}
          </Card>
          <Card title="Temas calientes (14 días)" subtitle="Clusters que más se repiten: candidatos a artículo pilar">
            <ul className="flex flex-wrap gap-2">{tendencias.map(([c, n]) => <li key={c}><Badge tone="blue">{c} · {n}</Badge></li>)}</ul>
            <p className="mt-4 text-xs text-slate-500">Noticias leídas por fuente: {fuentes.map((f) => `${f.source} ${f.n}`).join(" · ")}</p>
          </Card>
        </div>
      ) : <Empty>Todavía no hay radar. Pulsa «Lanzar radar ahora».</Empty>}

      <Card title="Noticias puntuadas" subtitle="Solo las que el editor IA consideró relevantes, con el tipo de artículo que mejor les saca partido. Pulsa «Preparar» y te llega el brief para aprobar.">
        <nav className="mb-4 flex flex-wrap gap-1.5" aria-label="Filtrar por tipo">
          <Link href="/radar" className={clsx("rounded-full px-3 py-1 text-xs ring-1 ring-inset", !filtro ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-[var(--line)]")}>Todas · {todos.length}</Link>
          {TIPO_CLAVES.map((t) => {
            const T = TIPO_UI[t];
            return <Link key={t} href={`/radar?tipo=${t}`} className={clsx("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ring-1 ring-inset", filtro === t ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-[var(--line)]")}><T.Icon size={12} />{T.label} · {porTipo.get(t) ?? 0}</Link>;
          })}
        </nav>
        {items.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {items.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <a href={r.url} target="_blank" rel="noreferrer" className="font-medium text-slate-900 hover:text-brand-700">{r.title}</a>
                  <p className="mt-0.5 text-sm text-slate-600">{r.resumen}</p>
                  <p className="mt-1 text-xs text-slate-500">{r.motivo}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge tone={tonoScore(r.score)}>{r.score}/100</Badge>
                    <BadgeTipo tipo={r.tipo} />
                    <Badge tone={EST[r.status]?.tone}>{EST[r.status]?.label ?? r.status}</Badge>
                    <Badge>{r.source}</Badge>
                    {r.keyword && <Badge tone="blue">{r.keyword}</Badge>}
                    <span className="text-xs text-slate-400">{r.published_at ? fecha(r.published_at, true) : fecha(r.digest_date)}</span>
                  </div>
                </div>
                {(r.status === "sent" || r.status === "new") && (
                  <div className="flex gap-2">
                    <BotonAccion accion={prepararRadar.bind(null, r.id)} className="btn btn-soft">Preparar</BotonAccion>
                    <BotonAccion accion={descartarRadar.bind(null, r.id)} className="btn btn-ghost">Descartar</BotonAccion>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : <Empty>{filtro ? "No hay noticias de este tipo en los últimos 14 días." : "Sin noticias puntuadas en los últimos 14 días."}</Empty>}
      </Card>
    </>
  );
}
