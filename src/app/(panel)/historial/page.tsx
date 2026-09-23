import Link from "next/link";
import { sql, type Accion } from "@/lib/db";
import { Card, PageHeader, Badge, fecha, Empty, type Tono } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { deshacerAccion } from "../acciones";

export const dynamic = "force-dynamic";
export const metadata = { title: "Historial" };

const ORIGEN: Record<string, Tono> = { app: "blue", telegram: "violet", n8n: "emerald", sistema: "slate" };

export default async function Historial({ searchParams }: { searchParams: Promise<{ origen?: string }> }) {
  const { origen } = await searchParams;
  const acciones = await sql<Accion[]>`select * from seo.actions ${origen ? sql`where origin = ${origen}` : sql``} order by created_at desc limit 300`;
  return (
    <>
      <PageHeader title="Historial" subtitle="Todo lo que se ha cambiado en la web, desde dónde y cuándo. Los cambios con estado anterior guardado se pueden deshacer.">
        {["", "app", "telegram", "n8n", "sistema"].map((o) => (
          <Link key={o} href={o ? `/historial?origen=${o}` : "/historial"} className={`btn ${origen === o || (!origen && !o) ? "btn-primary" : "btn-ghost"}`}>{o || "Todo"}</Link>
        ))}
      </PageHeader>
      <Card>
        {acciones.length ? (
          <ul className="divide-y divide-[var(--line)]">
            {acciones.map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${a.status === "cancelled" ? "text-slate-400 line-through" : "text-slate-800"}`}>{a.summary}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <Badge tone={ORIGEN[a.origin] ?? "slate"}>{a.origin}</Badge>
                    <span>{a.action}</span>
                    <span>· {fecha(a.created_at, true)}</span>
                    {a.target_type === "post" || a.target_type === "page" ? <Link href={`/articulos/${a.target_id}${a.target_type === "page" ? "?tipo=page" : ""}`} className="text-brand-600 hover:underline">#{a.target_id}</Link> : null}
                    {a.status === "cancelled" && <Badge>deshecho</Badge>}
                    {a.status === "failed" && <Badge tone="rose">falló</Badge>}
                  </p>
                  {a.error && <p className="mt-1 text-xs text-rose-600">{a.error}</p>}
                </div>
                {!!a.before && a.status === "done" && (a.target_type === "post" || a.target_type === "page") && (
                  <BotonAccion accion={deshacerAccion.bind(null, a.id)} className="btn btn-ghost text-xs" confirmar="¿Deshacer este cambio?">Deshacer</BotonAccion>
                )}
              </li>
            ))}
          </ul>
        ) : <Empty>Sin acciones registradas.</Empty>}
      </Card>
    </>
  );
}
