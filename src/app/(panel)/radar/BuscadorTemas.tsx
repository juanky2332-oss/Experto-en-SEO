"use client";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { Search, Loader2, Sparkles, ExternalLink, Lightbulb, AlertTriangle } from "lucide-react";
import { Badge, tonoScore } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { buscarTemaAccion, prepararRadar } from "../acciones";
import type { ResultadoBusqueda } from "@/lib/temas";

const SUGERENCIAS = ["tendencias Claude", "agentes de IA para pymes", "novedades de ChatGPT", "Gemini para empresas", "automatización con n8n", "AI Act obligaciones pymes", "IA para atención al cliente"];

export function BuscadorTemas({ anteriores, inicial = "" }: { anteriores: ResultadoBusqueda[]; inicial?: string }) {
  const [q, setQ] = useState(inicial);
  const [res, setRes] = useState<ResultadoBusqueda | null>(anteriores[0] ?? null);
  const [err, setErr] = useState("");
  const [pend, start] = useTransition();

  const buscar = (texto: string) => {
    if (texto.trim().length < 3) return;
    setQ(texto);
    setErr("");
    start(async () => {
      const r = await buscarTemaAccion(texto);
      if (r.ok && r.data) setRes(r.data);
      else if (!r.ok) setErr(r.error);
    });
  };

  return (
    <section className="card mb-6 overflow-hidden">
      <div className="bg-gradient-to-br from-ink-950 to-[#1c2a52] px-5 py-6 text-white sm:px-7">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-100"><Sparkles size={16} /> Buscador de temas</p>
        <h2 className="mt-1 text-xl font-semibold">¿Sobre qué quieres publicar?</h2>
        <p className="mt-1 max-w-2xl text-sm text-slate-300">Escribe un tema y busco en la web las noticias y publicaciones más recientes y fiables, las puntúo por potencial SEO, te aviso si ya lo cubre tu blog y te propongo artículos.</p>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); buscar(q); }}>
          <div className="relative flex-1">
            <Search size={17} className="absolute top-3 left-3 text-slate-400" />
            <input autoFocus={!!inicial} value={q} onChange={(e) => setQ(e.target.value)} placeholder="p. ej. tendencias Claude, IA en clínicas, novedades de Gemini…" className="input py-2.5 pl-10 text-slate-900" />
          </div>
          <button className="btn btn-primary justify-center py-2.5" disabled={pend}>{pend ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />} {pend ? "Buscando en la web…" : "Buscar"}</button>
        </form>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {SUGERENCIAS.map((s) => <button key={s} type="button" disabled={pend} onClick={() => buscar(s)} className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200 hover:bg-white/20 disabled:opacity-50">{s}</button>)}
        </div>
        {pend && <p className="mt-3 text-xs text-slate-300">Leyendo fuentes actuales y cruzándolas con tu blog (30-90 segundos)…</p>}
        {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}
      </div>

      {res && (
        <div className="grid gap-6 p-5 sm:p-7 xl:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Resultados para «{res.consulta}»</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{res.panorama}</p>
            <ul className="mt-4 divide-y divide-[var(--line)]">
              {res.items.map((r) => (
                <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <a href={r.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-slate-900 hover:text-brand-700">{r.titulo} <ExternalLink size={12} className="mt-1 shrink-0" /></a>
                    <p className="mt-0.5 text-sm text-slate-600">{r.resumen}</p>
                    <p className="mt-1 text-xs text-slate-500">{r.por_que}</p>
                    {r.ya_cubierto && <p className="mt-1 flex items-center gap-1 text-xs text-amber-700"><AlertTriangle size={12} /> Ya lo cubre: «{r.ya_cubierto}» — mejor actualizar ese artículo.</p>}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge tone={tonoScore(r.interes)}>{r.interes}/100</Badge>
                      <Badge>{r.fuente}</Badge>
                      {r.keyword && <Badge tone="blue">{r.keyword}</Badge>}
                      <Badge tone="violet">{r.intencion}</Badge>
                      {r.fecha !== "s/f" && <span className="text-xs text-slate-400">{r.fecha}</span>}
                    </div>
                  </div>
                  {r.status === "new" || r.status === "sent" || r.status === "seen" ? (
                    <BotonAccion accion={prepararRadar.bind(null, r.id)} className={clsx("btn", r.ya_cubierto ? "btn-ghost" : "btn-soft")}>Preparar artículo</BotonAccion>
                  ) : <Badge tone="emerald">{r.status === "published" ? "Publicado" : "En preparación"}</Badge>}
                </li>
              ))}
            </ul>
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl border border-[var(--line)] p-4">
              <p className="flex items-center gap-1.5 text-sm font-semibold"><Lightbulb size={15} className="text-amber-500" /> Artículos que escribiría</p>
              <ul className="mt-3 space-y-3">
                {res.ideas.map((i, k) => (
                  <li key={k} className="text-sm">
                    <p className="font-medium text-slate-900">{i.titulo_articulo}</p>
                    <p className="text-xs text-slate-500">{i.angulo} · <span className="text-brand-700">{i.keyword}</span></p>
                    <p className="mt-0.5 text-xs text-slate-600">{i.por_que}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-500">Para escribir una idea, pulsa «Preparar artículo» en la fuente que mejor la respalde: el publicador investiga más en la web antes de redactar.</p>
            </div>
            {anteriores.length > 1 && (
              <div className="rounded-xl border border-[var(--line)] p-4">
                <p className="text-sm font-semibold">Búsquedas anteriores</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {anteriores.map((a) => <li key={a.creado}><button onClick={() => setRes(a)} className={clsx("rounded-full px-3 py-1 text-xs ring-1", a.creado === res.creado ? "bg-brand-600 text-white ring-brand-600" : "ring-[var(--line)] hover:ring-brand-500")}>{a.consulta}</button></li>)}
                </ul>
              </div>
            )}
            <div className="rounded-xl border border-dashed border-[var(--line)] p-4 text-xs text-slate-500">
              ¿Tienes ya el enlace? Pégalo en <a href="/publicar" className="text-brand-600 underline">Publicar</a> o mándalo al bot de Telegram.
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
