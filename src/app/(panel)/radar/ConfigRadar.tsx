"use client";
import { useState, useTransition, type ReactNode } from "react";
import clsx from "clsx";
import { Loader2, Power, X, Plus, Globe } from "lucide-react";
import { TIPO_CLAVES, type RadarConfig, type TipoClave } from "@/lib/guia-base";
import { TIPO_UI } from "@/components/tipos";
import { guardarRadar } from "../acciones";

const DIAS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const SUGERENCIAS = ["Claude Code", "n8n", "MCP", "agentes de IA", "OpenAI API", "Cursor", "Codex", "Gemini", "prompts avanzados", "Claude skills", "RAG", "AI Act"];

export function ConfigRadar({ inicial, estado }: { inicial: RadarConfig; estado: string }) {
  const [c, setC] = useState(inicial);
  const [guardado, setGuardado] = useState(inicial);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pend, start] = useTransition();
  const cambios = JSON.stringify(c) !== JSON.stringify(guardado);
  const set = <K extends keyof RadarConfig>(k: K, v: RadarConfig[K]) => setC((x) => ({ ...x, [k]: v }));

  const guardar = (nuevo: RadarConfig) =>
    start(async () => {
      const r = await guardarRadar(nuevo);
      if (r.ok && r.data) { setC(r.data); setGuardado(r.data); setMsg({ ok: true, t: r.mensaje ?? "Guardado" }); }
      else if (!r.ok) setMsg({ ok: false, t: r.error });
    });

  const interruptor = () => { const n = { ...c, activo: !c.activo }; setC(n); guardar(n); };

  return (
    <section className="card mb-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--line)] px-5 py-4">
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">Radar automático</h2>
          <p className="mt-0.5 text-[13px] text-slate-500">{estado}</p>
        </div>
        <button type="button" onClick={interruptor} disabled={pend} role="switch" aria-checked={c.activo}
          className={clsx("group inline-flex items-center gap-3 rounded-full py-1.5 pr-4 pl-1.5 text-sm font-semibold transition", c.activo ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200")}>
          <span className={clsx("relative h-7 w-12 rounded-full transition", c.activo ? "bg-emerald-500" : "bg-slate-300")}>
            <span className={clsx("absolute top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow transition-all", c.activo ? "left-[22px]" : "left-0.5")}>
              {pend ? <Loader2 size={13} className="animate-spin text-slate-500" /> : <Power size={13} className={c.activo ? "text-emerald-600" : "text-slate-400"} />}
            </span>
          </span>
          {c.activo ? "ON · Encendido" : "OFF · Apagado"}
        </button>
      </header>

      <div className={clsx("grid gap-6 p-5 lg:grid-cols-2", !c.activo && "opacity-60")}>
        <div className="space-y-5">
          <Campo titulo="¿Cuándo te aviso?">
            <div className="grid gap-2 sm:grid-cols-3">
              {([["diario", "Cada día", "Resumen y propuestas cada mañana"], ["semanal", "Cada semana", "Busca a diario, te avisa un día"], ["panel", "Sin avisos", "Solo lo verás en este panel"]] as const).map(([k, t, d]) => (
                <button key={k} type="button" onClick={() => set("frecuencia", k)} className={clsx("rounded-xl border p-3 text-left", c.frecuencia === k ? "border-brand-500 bg-brand-50/60 ring-2 ring-brand-100" : "border-[var(--line)]")}>
                  <p className="text-sm font-medium">{t}</p><p className="mt-0.5 text-xs text-slate-500">{d}</p>
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              {c.frecuencia === "semanal" && (
                <>Los <select className="input w-auto py-1.5" value={c.dia_semana} onChange={(e) => set("dia_semana", Number(e.target.value))}>{DIAS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}</select></>
              )}
              a las <select className="input w-auto py-1.5" value={c.hora} onChange={(e) => set("hora", Number(e.target.value))}>{Array.from({ length: 17 }, (_, i) => i + 6).map((h) => <option key={h} value={h}>{h}:00</option>)}</select>
              <span className="text-xs text-slate-500">(hora de Madrid)</span>
            </div>
          </Campo>

          <Campo titulo="¿Qué tipos de contenido te interesan?" ayuda="El editor IA clasifica cada noticia y solo te propone estos tipos.">
            <div className="flex flex-wrap gap-2">
              {TIPO_CLAVES.map((k) => {
                const on = c.tipos.includes(k); const T = TIPO_UI[k];
                return (
                  <button key={k} type="button" title={T.corto} onClick={() => set("tipos", on ? c.tipos.filter((x) => x !== k) : [...c.tipos, k] as TipoClave[])}
                    className={clsx("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ring-1 ring-inset transition", on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-slate-600 ring-[var(--line)] hover:bg-slate-50")}>
                    <T.Icon size={14} /> {T.label}
                  </button>
                );
              })}
            </div>
          </Campo>
        </div>

        <div className="space-y-5">
          <Campo titulo="Temas preferidos" ayuda="Puntúan más y, si activas la búsqueda web, los busco también fuera de las fuentes fijas.">
            <Chips valores={c.temas} onChange={(v) => set("temas", v)} max={8} sugerencias={SUGERENCIAS} placeholder="p. ej. Claude Code" />
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm">
              <input type="checkbox" className="mt-0.5 accent-brand-600" checked={c.buscar_web} onChange={(e) => set("buscar_web", e.target.checked)} />
              <span><Globe size={14} className="mr-1 inline text-brand-600" />Buscar también en la web mis temas preferidos <span className="text-xs text-slate-500">(una búsqueda al día, unos céntimos)</span></span>
            </label>
          </Campo>
          <Campo titulo="Temas a evitar">
            <Chips valores={c.excluir} onChange={(v) => set("excluir", v)} max={12} placeholder="p. ej. criptomonedas" />
          </Campo>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo titulo={`Propuestas por aviso: ${c.max_propuestas}`}>
              <input type="range" min={1} max={10} value={c.max_propuestas} onChange={(e) => set("max_propuestas", Number(e.target.value))} className="w-full accent-brand-600" />
            </Campo>
            <Campo titulo={`Interés mínimo: ${c.score_minimo}/100`}>
              <input type="range" min={40} max={95} step={5} value={c.score_minimo} onChange={(e) => set("score_minimo", Number(e.target.value))} className="w-full accent-brand-600" />
            </Campo>
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] px-5 py-3">
        <button className="btn btn-primary" disabled={pend || !cambios} onClick={() => guardar(c)}>{pend && <Loader2 size={15} className="animate-spin" />} Guardar configuración</button>
        {cambios && <span className="text-xs text-amber-600">Cambios sin guardar</span>}
        {msg && <span className={clsx("text-xs", msg.ok ? "text-emerald-600" : "text-rose-600")}>{msg.t}</span>}
      </footer>
    </section>
  );
}

function Campo({ titulo, ayuda, children }: { titulo: string; ayuda?: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-800">{titulo}</p>
      {ayuda && <p className="mb-2 text-xs text-slate-500">{ayuda}</p>}
      <div className={ayuda ? "" : "mt-2"}>{children}</div>
    </div>
  );
}

function Chips({ valores, onChange, max, sugerencias = [], placeholder }: { valores: string[]; onChange: (v: string[]) => void; max: number; sugerencias?: string[]; placeholder: string }) {
  const [txt, setTxt] = useState("");
  const add = (v: string) => {
    const t = v.trim().replace(/,$/, "");
    if (t.length > 1 && !valores.some((x) => x.toLowerCase() === t.toLowerCase()) && valores.length < max) onChange([...valores, t]);
    setTxt("");
  };
  const libres = sugerencias.filter((s) => !valores.some((v) => v.toLowerCase() === s.toLowerCase()));
  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white p-1.5">
        {valores.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-0.5 pr-1 pl-2.5 text-sm text-brand-700">
            {v}<button type="button" aria-label={`Quitar ${v}`} onClick={() => onChange(valores.filter((x) => x !== v))} className="rounded-full p-0.5 hover:bg-brand-100"><X size={12} /></button>
          </span>
        ))}
        {valores.length < max && (
          <input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={valores.length ? "" : placeholder}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(txt); } else if (e.key === "Backspace" && !txt && valores.length) onChange(valores.slice(0, -1)); }}
            onBlur={() => txt && add(txt)} className="min-w-[8rem] flex-1 px-1.5 py-1 text-sm outline-none" />
        )}
      </div>
      {libres.length > 0 && valores.length < max && (
        <div className="mt-2 flex flex-wrap gap-1">
          {libres.slice(0, 8).map((s) => <button key={s} type="button" onClick={() => add(s)} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-200"><Plus size={11} />{s}</button>)}
        </div>
      )}
    </div>
  );
}
