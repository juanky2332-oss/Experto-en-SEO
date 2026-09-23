"use client";
import { useState, useTransition, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import type { Resultado } from "@/app/(panel)/acciones";

/** Botón que ejecuta una server action y muestra el resultado. */
export function BotonAccion({ accion, children, className = "btn btn-ghost", confirmar, alTerminar }: {
  accion: () => Promise<Resultado>; children: ReactNode; className?: string; confirmar?: string; alTerminar?: (r: Resultado) => void;
}) {
  const [pend, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        disabled={pend}
        className={clsx(className)}
        onClick={() => {
          if (confirmar && !window.confirm(confirmar)) return;
          setMsg(null);
          start(async () => {
            const r = await accion();
            setMsg(r.ok ? (r.mensaje ? { ok: true, t: r.mensaje } : null) : { ok: false, t: r.error });
            alTerminar?.(r);
          });
        }}
      >
        {pend && <Loader2 size={15} className="animate-spin" />}
        {children}
      </button>
      {msg && <span className={clsx("text-xs", msg.ok ? "text-emerald-600" : "text-rose-600")}>{msg.t}</span>}
    </span>
  );
}
