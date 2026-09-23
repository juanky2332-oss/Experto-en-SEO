"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { guardarAjustes } from "../acciones";

export function FormAjustes({ modo: m0, minimo: n0 }: { modo: "publicar" | "borrador"; minimo: number }) {
  const [modo, setModo] = useState(m0);
  const [minimo, setMinimo] = useState(n0);
  const [msg, setMsg] = useState("");
  const [pend, start] = useTransition();
  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2">
        {([["publicar", "Publicar directamente", "Si el control de calidad supera el mínimo, se publica. Si no, queda en borrador."], ["borrador", "Siempre en borrador", "Lo reviso yo en la app o en WordPress antes de publicar."]] as const).map(([k, t, d]) => (
          <button key={k} type="button" onClick={() => setModo(k)} className={clsx("rounded-xl border p-4 text-left", modo === k ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-100" : "border-[var(--line)]")}>
            <p className="text-sm font-medium">{t}</p><p className="mt-1 text-xs text-slate-500">{d}</p>
          </button>
        ))}
      </div>
      <div>
        <label className="text-sm font-medium">Puntuación SEO mínima para publicar: <b>{minimo}</b></label>
        <input type="range" min={50} max={100} step={5} value={minimo} onChange={(e) => setMinimo(Number(e.target.value))} className="mt-2 w-full accent-brand-600" />
      </div>
      <button className="btn btn-primary" disabled={pend} onClick={() => start(async () => { const r = await guardarAjustes(modo, minimo); setMsg(r.ok ? "Guardado" : r.error); })}>Guardar</button>
      {msg && <span className="ml-3 text-sm text-slate-600">{msg}</span>}
    </div>
  );
}
