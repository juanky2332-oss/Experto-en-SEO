"use client";
import { useOptimistic, useTransition } from "react";
import clsx from "clsx";
import { CheckCircle2, Circle, ExternalLink } from "lucide-react";
import type { Pendiente } from "@/lib/pendientes";
import { marcarPendiente } from "@/app/(panel)/acciones";

/** Lista de pendientes fuera de la web (altas, directorios, negocio) con casilla para marcarlas. */
export function Pendientes({ lista }: { lista: Pendiente[] }) {
  const [, start] = useTransition();
  const [items, setItems] = useOptimistic(lista, (estado, cambio: { id: string; hecho: boolean }) => estado.map((p) => (p.id === cambio.id ? { ...p, hecho: cambio.hecho } : p)));
  const grupos = [...new Set(items.map((p) => p.grupo))];
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {grupos.map((g) => (
        <div key={g}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{g}</p>
          <ul className="space-y-2">
            {items.filter((p) => p.grupo === g).map((p) => (
              <li key={p.id} className={clsx("flex gap-3 rounded-lg border p-3", p.hecho ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200")}>
                <button
                  type="button"
                  aria-label={p.hecho ? `Marcar «${p.titulo}» como pendiente` : `Marcar «${p.titulo}» como hecho`}
                  className="mt-0.5 shrink-0"
                  onClick={() => start(async () => { setItems({ id: p.id, hecho: !p.hecho }); await marcarPendiente(p.id, !p.hecho); })}
                >
                  {p.hecho ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Circle size={18} className="text-slate-400" />}
                </button>
                <div className="min-w-0">
                  <p className={clsx("text-sm font-medium", p.hecho ? "text-slate-500 line-through" : "text-slate-800")}>
                    {p.titulo}
                    {p.enlace && <a href={p.enlace} target="_blank" rel="noreferrer" className="ml-1.5 inline-flex text-brand-600 hover:underline" aria-label="Abrir"><ExternalLink size={13} /></a>}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500">{p.detalle}{p.hecho && p.fecha ? ` · hecho el ${p.fecha}` : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
