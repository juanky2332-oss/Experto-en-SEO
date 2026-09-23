import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { inventario } from "@/lib/seo/inventario";
import { auditarSitio } from "@/lib/seo/sitio";
import { sql } from "@/lib/db";
import { Card, PageHeader, ScoreRing, Badge, GRAVEDAD, fecha, Empty, tonoScore } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { Velocidad } from "./Velocidad";
import { borrarEtiquetasVacias } from "../acciones";

export const dynamic = "force-dynamic";
export const maxDuration = 120;
export const metadata = { title: "Auditoría" };

type Speed = { created_at: Date; data: { url: string; rendimiento: number; seo: number; accesibilidad: number; practicas: number; lcp: string; cls: string; tbt: string; fcp: string; oportunidades: { titulo: string; ahorroMs: number }[] } };

export default async function Auditoria() {
  const inv = await inventario();
  const [a, velocidades] = await Promise.all([
    auditarSitio(inv),
    sql<Speed[]>`select distinct on (target) created_at, data from seo.audits where kind = 'speed' order by target, created_at desc`,
  ]);
  const pubs = inv.posts.filter((p) => p.status === "publish");
  const grupos: { ids: number[]; titulos: string[] }[] = [];
  const vistos = new Set<number>();
  for (const p of a.canib) {
    if (vistos.has(p.id)) continue;
    const sim = inv.ctx.similares?.get(p.id) ?? [];
    const ids = [p.id, ...sim.map((s) => s.id)];
    ids.forEach((i) => vistos.add(i));
    grupos.push({ ids, titulos: [p.title, ...sim.map((s) => s.title)] });
  }
  const recientes = [...pubs].sort((x, y) => y.date.localeCompare(x.date)).slice(0, 5);

  return (
    <>
      <PageHeader title="Auditoría técnica" subtitle="Revisión completa del sitio: rastreo, indexación, arquitectura, contenido, imágenes y velocidad. Se ejecuta en directo cada vez que entras." />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Chequeos del sitio" action={<ScoreRing score={a.score} size={48} stroke={5} label="Puntuación técnica" />}>
          <ul className="divide-y divide-[var(--line)]">
            {a.chequeos.map((x) => (
              <li key={x.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                {x.ok ? <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" /> : <XCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />}
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">{x.titulo}{!x.ok && <Badge tone={GRAVEDAD[x.gravedad].tone}>{GRAVEDAD[x.gravedad].label}</Badge>}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{x.detalle}</p>
                </div>
                {x.accion && !x.ok && <Link href={x.accion} className="btn btn-soft shrink-0 text-xs">Ver</Link>}
                {x.id === "tags" && !x.ok && <BotonAccion accion={borrarEtiquetasVacias} className="btn btn-soft shrink-0 text-xs" confirmar="¿Eliminar las etiquetas sin ningún artículo?">Eliminar</BotonAccion>}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card title="Velocidad (PageSpeed, móvil)" subtitle="Core Web Vitals: factor de posicionamiento">
            <Velocidad urls={[{ label: "Portada", url: "https://transformaconia.com/" }, ...recientes.map((p) => ({ label: p.title.slice(0, 50), url: p.link }))]} />
            <ul className="mt-4 space-y-3">
              {velocidades.map((v) => (
                <li key={v.data.url} className="rounded-xl border border-[var(--line)] p-3 text-sm">
                  <p className="truncate text-xs text-slate-500">{v.data.url.replace("https://transformaconia.com", "") || "/"} · {fecha(v.created_at, true)}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone={tonoScore(v.data.rendimiento)}>Rendimiento {v.data.rendimiento}</Badge>
                    <Badge tone={tonoScore(v.data.seo)}>SEO {v.data.seo}</Badge>
                    <Badge tone={tonoScore(v.data.accesibilidad)}>Accesib. {v.data.accesibilidad}</Badge>
                  </div>
                  <p className="mt-2 text-xs text-slate-600">LCP {v.data.lcp} · CLS {v.data.cls} · TBT {v.data.tbt}</p>
                  {v.data.oportunidades.length > 0 && <ul className="mt-1 list-disc pl-4 text-xs text-slate-500">{v.data.oportunidades.map((o) => <li key={o.titulo}>{o.titulo} (−{(o.ahorroMs / 1000).toFixed(1)} s)</li>)}</ul>}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Canibalización" subtitle="Artículos que compiten por la misma búsqueda: fusiona el débil en el fuerte (y redirige)">
          {grupos.length ? (
            <ul className="space-y-3">
              {grupos.map((g, i) => (
                <li key={i} className="rounded-xl border border-[var(--line)] p-3 text-sm">
                  {g.ids.map((id, j) => <p key={id}><Link href={`/articulos/${id}`} className="hover:text-brand-700"><Badge tone="blue">#{id}</Badge> {g.titulos[j]}</Link></p>)}
                </li>
              ))}
            </ul>
          ) : <Empty>Sin canibalización detectada.</Empty>}
        </Card>
        <Card title="Artículos huérfanos" subtitle="Ningún otro artículo les enlaza">
          {a.huerfanos.length ? (
            <ul className="space-y-1.5 text-sm">
              {a.huerfanos.slice(0, 25).map((p) => <li key={p.id}><Link href={`/articulos/${p.id}`} className="hover:text-brand-700">{p.title}</Link></li>)}
              {a.huerfanos.length > 25 && <li className="text-xs text-slate-500">…y {a.huerfanos.length - 25} más</li>}
            </ul>
          ) : <Empty>Todos reciben enlaces.</Empty>}
        </Card>
      </div>
    </>
  );
}
