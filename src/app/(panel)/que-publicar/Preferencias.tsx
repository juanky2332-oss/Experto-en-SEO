"use client";
import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { guardarPreferenciasQp } from "../acciones";

/** Temas a favor y en contra (son los mismos que usa el radar: radar.temas y radar.excluir). */
export function Preferencias({ favor, contra, propuestas }: { favor: string[]; contra: string[]; propuestas: string[] }) {
  const [f, setF] = useState(favor);
  const [c, setC] = useState(contra);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pend, start] = useTransition();
  const guardar = (nf: string[], nc: string[]) => start(async () => {
    setMsg(null);
    const r = await guardarPreferenciasQp(nf, nc);
    setMsg(r.ok ? { ok: true, t: "Guardado. Se tendrá en cuenta en el próximo lote." } : { ok: false, t: r.error });
  });

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Lista titulo="Temas a favor" ayuda="Suben la prioridad (señal «tema preferido»). Máx. 8." valores={f} max={8} tono="bg-brand-50 text-brand-700 ring-brand-100"
        alCambiar={(v) => { setF(v); guardar(v, c); }} disabled={pend} />
      <Lista titulo="Temas en contra" ayuda="Nunca se recomiendan. Máx. 12." valores={c} max={12} tono="bg-rose-50 text-rose-700 ring-rose-200"
        alCambiar={(v) => { setC(v); guardar(f, v); }} disabled={pend} />
      {propuestas.length > 0 && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 md:col-span-2">
          Has dicho «no me interesa» tres veces o más a temas con estas palabras. ¿Las añado a «en contra»?
          <div className="mt-2 flex flex-wrap gap-1.5">
            {propuestas.map((p) => <button key={p} type="button" disabled={pend} onClick={() => { const v = [...c, p]; setC(v); guardar(f, v); }} className="btn btn-soft py-1 text-xs"><Plus size={12} /> {p}</button>)}
          </div>
        </div>
      )}
      {(pend || msg) && <p className={`text-xs md:col-span-2 ${msg && !msg.ok ? "text-rose-600" : "text-emerald-600"}`}>{pend ? <Loader2 size={13} className="inline animate-spin" /> : msg?.t}</p>}
    </div>
  );
}

function Lista({ titulo, ayuda, valores, max, tono, alCambiar, disabled }: { titulo: string; ayuda: string; valores: string[]; max: number; tono: string; alCambiar: (v: string[]) => void; disabled: boolean }) {
  const [nuevo, setNuevo] = useState("");
  const anadir = () => {
    const t = nuevo.trim().replace(/\s+/g, " ").slice(0, 60);
    if (t.length < 2 || valores.includes(t) || valores.length >= max) return;
    alCambiar([...valores, t]);
    setNuevo("");
  };
  return (
    <div>
      <p className="text-sm font-medium text-slate-800">{titulo}</p>
      <p className="text-xs text-slate-500">{ayuda}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {valores.map((v) => (
          <li key={v} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tono}`}>
            {v}
            <button type="button" aria-label={`Quitar ${v}`} disabled={disabled} onClick={() => alCambiar(valores.filter((x) => x !== v))} className="opacity-60 hover:opacity-100"><X size={12} /></button>
          </li>
        ))}
        {!valores.length && <li className="text-xs text-slate-400">Ninguno</li>}
      </ul>
      <form className="mt-2 flex gap-1.5" onSubmit={(e) => { e.preventDefault(); anadir(); }}>
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Añadir tema…" className="input py-1.5 text-sm" disabled={disabled || valores.length >= max} />
        <button className="btn btn-ghost" disabled={disabled || valores.length >= max}><Plus size={14} /></button>
      </form>
    </div>
  );
}
