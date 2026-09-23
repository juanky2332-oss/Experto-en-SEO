import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { inventario } from "@/lib/seo/inventario";
import { Card, PageHeader, ScoreRing, Badge, ESTADOS, GRAVEDAD } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Páginas" };

export default async function Paginas() {
  const inv = await inventario();
  const paginas = [...inv.paginas].sort((a, b) => a.analisis.score - b.analisis.score);
  return (
    <>
      <PageHeader title="Páginas" subtitle="Portada, servicios, productos y contacto. Son las que convierten: título, meta y estructura tienen que ser impecables." />
      <Card>
        <ul className="divide-y divide-[var(--line)]">
          {paginas.map((p) => (
            <li key={p.id} className="flex flex-wrap items-start gap-4 py-4 first:pt-0 last:pb-0">
              <ScoreRing score={p.analisis.score} size={42} stroke={4} />
              <div className="min-w-0 flex-1">
                <Link href={`/articulos/${p.id}?tipo=page`} className="font-medium text-slate-900 hover:text-brand-700">{p.title}</Link>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <Badge tone={ESTADOS[p.status]?.tone}>{ESTADOS[p.status]?.label}</Badge>
                  /{p.slug}/
                  <a href={p.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand-600">ver <ExternalLink size={11} /></a>
                </p>
                <div className="mt-2 flex flex-col gap-1">
                  {p.analisis.problemas.slice(0, 3).map((x) => (
                    <span key={x.codigo} className="flex items-center gap-1.5 text-xs"><Badge tone={GRAVEDAD[x.gravedad].tone}>{GRAVEDAD[x.gravedad].label}</Badge><span className="text-slate-600">{x.titulo}</span></span>
                  ))}
                </div>
              </div>
              <Link href={`/articulos/${p.id}?tipo=page`} className="btn btn-soft">Editar</Link>
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
