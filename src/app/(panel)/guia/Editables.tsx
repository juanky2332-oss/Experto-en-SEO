"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { Loader2, Pencil, Sparkles, Send } from "lucide-react";
import { guardarSeccionGuia, pedirCambioGuiaAccion, type CampoGuia } from "../acciones";

/** Sección de la guía que se puede editar a mano: texto o lista (una línea por punto). */
export function Seccion({ campo, valor, vacio = "Sin puntos todavía." }: { campo: CampoGuia; valor: string | string[]; vacio?: string }) {
  const lista = Array.isArray(valor);
  const [editando, setEditando] = useState(false);
  const [txt, setTxt] = useState(lista ? valor.join("\n") : valor);
  const [err, setErr] = useState("");
  const [pend, start] = useTransition();
  if (editando)
    return (
      <div className="space-y-2">
        <textarea className="input min-h-40 text-sm leading-relaxed" value={txt} onChange={(e) => setTxt(e.target.value)} />
        {lista && <p className="text-xs text-slate-500">Un punto por línea.</p>}
        <div className="flex items-center gap-2">
          <button className="btn btn-primary" disabled={pend} onClick={() => start(async () => { const r = await guardarSeccionGuia(campo, txt); if (r.ok) setEditando(false); else setErr(r.error); })}>
            {pend && <Loader2 size={14} className="animate-spin" />} Guardar
          </button>
          <button className="btn btn-ghost" onClick={() => { setEditando(false); setTxt(lista ? valor.join("\n") : valor); }}>Cancelar</button>
          {err && <span className="text-xs text-rose-600">{err}</span>}
        </div>
      </div>
    );
  return (
    <div className="group relative">
      <button onClick={() => setEditando(true)} className="absolute -top-1 right-0 rounded-md p-1.5 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 focus:opacity-100" aria-label="Editar sección"><Pencil size={14} /></button>
      {lista ? (
        valor.length ? <ul className="list-disc space-y-1.5 pr-8 pl-5 text-sm text-slate-700">{valor.map((x, i) => <li key={i}>{x}</li>)}</ul> : <p className="text-sm text-slate-500">{vacio}</p>
      ) : <p className="pr-8 text-sm leading-relaxed text-slate-700">{valor}</p>}
    </div>
  );
}

const EJEMPLOS = [
  "Quiero más trucos de Claude Code y menos noticias de financiación",
  "Añade un pilar sobre RAG y bases de conocimiento para empresas",
  "Las imágenes de las guías, mejor con fondo oscuro",
  "Los artículos de empresa deben apuntar a clínicas y talleres",
];

/** Caja para pedir cambios a la guía en lenguaje normal (la IA la reescribe). */
export function PedirCambio() {
  const [txt, setTxt] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pend, start] = useTransition();
  const enviar = () => start(async () => {
    setMsg(null);
    const r = await pedirCambioGuiaAccion(txt);
    if (r.ok) { setMsg({ ok: true, t: `Hecho: ${r.data}` }); setTxt(""); } else setMsg({ ok: false, t: r.error });
  });
  return (
    <section className="card mb-6 overflow-hidden">
      <div className="bg-gradient-to-br from-ink-950 to-[#1c2a52] px-5 py-5 text-white sm:px-7">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-100"><Sparkles size={16} /> Pide un cambio</p>
        <p className="mt-1 max-w-2xl text-sm text-slate-300">Dime en lenguaje normal qué quieres cambiar de la línea editorial. La IA ajusta la guía, el radar y el redactor la usan desde ese momento, y te llega por Telegram con botón de deshacer.</p>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); if (txt.trim()) enviar(); }}>
          <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="p. ej. más contenido de agentes con MCP para desarrolladores" className="input flex-1 py-2.5 text-slate-900" />
          <button className="btn btn-primary justify-center py-2.5" disabled={pend || !txt.trim()}>{pend ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} {pend ? "Ajustando la guía…" : "Aplicar"}</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {EJEMPLOS.map((s) => <button key={s} type="button" disabled={pend} onClick={() => setTxt(s)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/20 disabled:opacity-50">{s}</button>)}
        </div>
        {pend && <p className="mt-3 text-xs text-slate-300">Reescribiendo la guía con tu cambio (20-60 segundos)…</p>}
        {msg && <p className={clsx("mt-3 text-sm", msg.ok ? "text-emerald-300" : "text-rose-300")}>{msg.t}</p>}
      </div>
    </section>
  );
}
