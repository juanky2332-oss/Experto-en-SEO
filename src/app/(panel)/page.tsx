import Link from "next/link";
import { CalendarClock, RefreshCw, ShieldCheck, Wand2 } from "lucide-react";
import { sql } from "@/lib/db";
import { SITE } from "@/lib/wp";
import { inventario } from "@/lib/seo/inventario";
import { getRadarConfig } from "@/lib/guia";
import { listarRecs, exclusionesPropuestas } from "@/lib/que-publicar/datos";
import { COSTE_ESTIMADO } from "@/lib/que-publicar/generar";
import { Card, PageHeader, ScoreRing, Badge, Empty, fecha } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { generarQuePublicarAccion } from "./acciones";
import { Tarjeta } from "./que-publicar/Tarjeta";
import { Preferencias } from "./que-publicar/Preferencias";
import { IdeaAhora } from "./que-publicar/IdeaAhora";
import { ideaActual } from "@/lib/que-publicar/idea";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Qué publicar" };

const euros = (n: number) => `${n.toFixed(3).replace(".", ",")} €`;

export default async function QuePublicar() {
  const inv = await inventario();
  // tandas de ≤3 consultas (pool de 3 conexiones)
  const [recs, radar, [cache]] = await Promise.all([
    listarRecs(),
    getRadarConfig(),
    sql<{ value: { fecha: string; coste_eur: number; lote: string } }[]>`select value from seo.settings where key = 'qp_cache'`,
  ]);
  const [propuestas, [ultima], idea] = await Promise.all([
    exclusionesPropuestas(radar.excluir),
    sql<{ summary: string; after: { descartados?: { titulo: string; motivo: string }[] } | null }[]>`select summary, after from seo.actions where action = 'que_publicar' order by created_at desc limit 1`,
    ideaActual(),
  ]);

  const pub = inv.posts.filter((p) => p.status === "publish");
  const programados = inv.posts.filter((p) => p.status === "future").sort((a, b) => a.date.localeCompare(b.date));
  const criticos = pub.reduce((a, p) => a + p.analisis.problemas.filter((x) => x.gravedad === "critica").length, 0);
  const vivas = recs.filter((r) => (r.estado === "abierta" || r.estado === "interesa") && String(r.id) !== String(idea?.rec.id));
  const otras = recs.filter((r) => !(r.estado === "abierta" || r.estado === "interesa"));
  const c = cache?.value;
  const confirmar = `Genero un lote nuevo de 12-15 recomendaciones con una llamada al modelo rápido, sin búsqueda web. Coste estimado: ${COSTE_ESTIMADO}${c ? ` (el último costó ${euros(c.coste_eur)})` : ""}. Si nada ha cambiado desde el último lote no llamo a la IA y solo reordeno con tus votos (0 €). ¿Seguimos?`;

  return (
    <>
      <PageHeader title="Qué publicar" subtitle="El estratega SEO: cruza la guía editorial, lo publicado y programado, la auditoría, las visitas y los plazos para decirte qué publicar y dónde. La prioridad se calcula en código (encaje con el negocio + señales + lo que votas); la IA solo propone los temas.">
        <BotonAccion accion={generarQuePublicarAccion.bind(null, false)} className="btn btn-primary" confirmar={confirmar}><Wand2 size={15} /> Generar recomendaciones</BotonAccion>
        <BotonAccion accion={generarQuePublicarAccion.bind(null, true)} className="btn btn-ghost" confirmar={`Pido temas nuevos a la IA aunque nada haya cambiado. Coste estimado: ${COSTE_ESTIMADO}. ¿Seguimos?`}><RefreshCw size={15} /> Temas nuevos</BotonAccion>
      </PageHeader>

      <IdeaAhora idea={idea} sitio={SITE} />

      {/* cabecera compacta de salud: el detalle está en Resultados › Salud SEO */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Link href="/resultados/salud" className="card flex items-center gap-3 p-4 hover:ring-1 hover:ring-brand-200">
          <ScoreRing score={inv.salud} size={44} stroke={5} />
          <div><p className="text-[13px] text-slate-500">Salud SEO media</p><p className="text-sm font-medium text-slate-800">{pub.length} artículos publicados</p></div>
        </Link>
        <Link href="/auditoria" className="card flex items-center gap-3 p-4 hover:ring-1 hover:ring-brand-200">
          <ShieldCheck size={22} className={criticos ? "text-rose-500" : "text-emerald-500"} />
          <div><p className="text-[13px] text-slate-500">Problemas críticos</p><p className="text-sm font-medium text-slate-800">{criticos ? `${criticos} por arreglar` : "Ninguno"}</p></div>
        </Link>
        <div className="card flex items-center gap-3 p-4">
          <CalendarClock size={22} className="text-violet-500" />
          <div><p className="text-[13px] text-slate-500">Programados</p><p className="text-sm font-medium text-slate-800">{programados.length ? `${programados.length} · hasta el ${fecha(programados.at(-1)!.date)}` : "Ninguno"}</p></div>
        </div>
      </div>

      {programados.length > 0 && (
        <Card className="mb-6" title="Programados en WordPress" subtitle="Quedan de antes: ya no se programa nada nuevo. Las recomendaciones nunca repiten estos temas.">
          <ol className="flex gap-3 overflow-x-auto pb-1 scroll-thin">
            {programados.map((p) => (
              <li key={p.id} className="min-w-[210px] flex-1 rounded-xl border border-[var(--line)] p-3">
                <p className="text-xs font-medium text-violet-700">{new Date(p.date).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })}</p>
                <Link href={`/articulos/${p.id}`} className="mt-0.5 line-clamp-2 block text-sm font-medium text-slate-900 hover:text-brand-700">{p.title}</Link>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="mb-6" title="Tus preferencias" subtitle="Los mismos temas que usa el radar. Además, cada voto enseña al estratega qué pilares, destinos y palabras te interesan (los votos pierden la mitad de su peso cada 60 días).">
        <Preferencias favor={radar.temas} contra={radar.excluir} propuestas={propuestas} />
      </Card>

      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-900">Recomendaciones <span className="text-sm font-normal text-slate-500">· {vivas.length}</span></h2>
        {c && <p className="text-xs text-slate-500">Último lote: {fecha(c.fecha, true)} · {euros(c.coste_eur)}{ultima?.after?.descartados?.length ? ` · ${ultima.after.descartados.length} descartadas por los filtros (marcas, nombres, ya programado…)` : ""}</p>}
      </div>
      {vivas.length ? (
        <div className="grid gap-4 xl:grid-cols-2">{vivas.map((r) => <Tarjeta key={r.id} rec={r} sitio={SITE} />)}</div>
      ) : <Card><Empty>Aún no hay recomendaciones. Pulsa «Generar recomendaciones».</Empty></Card>}

      {otras.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-medium text-slate-600">Votadas y archivadas ({otras.length})</summary>
          <ul className="mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-white">
            {otras.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="text-slate-700">{r.titulo} <span className="text-slate-400">· {r.keyword}</span></span>
                <Badge tone={r.estado === "publicada" ? "blue" : "slate"}>{r.estado === "descartada" ? "No interesa" : r.estado === "publicada" ? "Ya publicado" : r.estado === "saltada" ? "Saltada" : r.estado}</Badge>
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}
