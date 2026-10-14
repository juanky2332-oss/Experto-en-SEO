"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ThumbsUp, ThumbsDown, CheckCircle2, Sparkles, ExternalLink, Loader2, Search, Link2, Megaphone, MapPin, FileText } from "lucide-react";
import { Badge, ScoreRing, type Tono } from "@/components/ui";
import { votarRec, crearBriefRec } from "../acciones";
import type { Rec } from "@/lib/que-publicar/datos";

export const DESTINO_UI: Record<string, string> = {
  articulo: "Artículo nuevo del blog", ampliar_pagina: "Ampliar una página", pagina_sector: "Página de sector", pagina_local: "Página local", faq: "Preguntas frecuentes en una página",
};
export const SENAL_UI: Record<string, { label: string; tone: Tono }> = {
  radar: { label: "Radar", tone: "violet" }, hueco_pilar: { label: "Pilar sin cubrir", tone: "rose" }, canibalizacion: { label: "Canibalización", tone: "amber" },
  huerfano: { label: "Artículos huérfanos", tone: "amber" }, sin_trafico: { label: "Página sin visitas", tone: "amber" }, plazo: { label: "Plazo", tone: "rose" },
  conversion: { label: "Página que convierte", tone: "emerald" }, tema_favor: { label: "Tema preferido", tone: "blue" },
  gsc_cerca: { label: "Casi en página 1", tone: "emerald" }, gsc_sin_pagina: { label: "Sin página dedicada", tone: "violet" },
};
const ESTADO_UI: Record<string, { label: string; tone: Tono }> = {
  interesa: { label: "Te interesa", tone: "emerald" }, descartada: { label: "No interesa", tone: "slate" }, publicada: { label: "Ya publicado", tone: "blue" }, en_brief: { label: "En brief", tone: "violet" },
};
const fechaCorta = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

type Voto = "interesa" | "no_interesa" | "publicado" | "mas_como_esto";

export function Tarjeta({ rec, sitio, compacta = false }: { rec: Rec; sitio: string; compacta?: boolean }) {
  const [pend, start] = useTransition();
  const [err, setErr] = useState("");
  const votar = (v: Voto) => start(async () => {
    setErr("");
    const r = await votarRec(rec.id, v);
    if (!r.ok) setErr(r.error);
  });
  const [borrador, setBorrador] = useState(false);
  const crearBrief = () => {
    if (!window.confirm(`Crear el brief de «${rec.titulo}»${borrador && !rec.radar_id ? " (solo borrador)" : ""}.\n\nCoste aproximado: ~0,05 € el brief. La redacción posterior (~0,6 €) solo se lanza si luego apruebas el brief en Telegram o en Publicar.\n\n¿Continuar?`)) return;
    start(async () => {
      setErr("");
      const r = await crearBriefRec(rec.id, borrador);
      if (!r.ok) setErr(r.error);
    });
  };
  const est = ESTADO_UI[rec.estado];
  const gsc = rec.por_que.find((p) => p.gsc)?.gsc;
  const viva = rec.estado === "abierta" || rec.estado === "interesa";

  return (
    <article className={clsx("card flex flex-col p-5", !viva && "opacity-70")}>
      <div className="flex items-start gap-3">
        <ScoreRing score={rec.prioridad} size={44} stroke={5} label={`Prioridad ${rec.prioridad}/100 (calculada: encaje con el negocio + señales + lo que has votado)`} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900">{rec.titulo}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="blue">{rec.keyword}</Badge>
            {rec.secundarias.map((s) => <Badge key={s}>{s}</Badge>)}
            {gsc ? <Badge tone="emerald">GSC: {gsc.impresiones} impresiones · posición {String(gsc.posicion).replace(".", ",")}</Badge> : <Badge className="text-slate-400">sin dato de volumen</Badge>}
          </div>
        </div>
        {est && <Badge tone={est.tone}>{est.label}</Badge>}
      </div>

      <dl className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-medium text-slate-500">Dónde</dt>
        <dd className="text-slate-800"><MapPin size={13} className="mr-1 inline text-slate-400" />{DESTINO_UI[rec.destino] ?? rec.destino}{rec.destino_ref ? <> · <a href={`${sitio}${rec.destino_ref}`} target="_blank" rel="noreferrer" className="text-brand-700 hover:underline">{rec.destino_ref}</a></> : null}</dd>
        {!compacta && <>
          <dt className="font-medium text-slate-500">Para quién</dt>
          <dd className="text-slate-700">{rec.publico}{rec.intencion ? <span className="text-slate-400"> · intención {rec.intencion}</span> : null}</dd>
          <dt className="font-medium text-slate-500">Pilar</dt>
          <dd className="text-slate-700">{rec.pilar}{rec.esfuerzo ? <span className="text-slate-400"> · esfuerzo {rec.esfuerzo}</span> : null}{rec.fecha_plan ? <span className="text-slate-400"> · hueco sugerido {fechaCorta(rec.fecha_plan)}</span> : null}</dd>
          {rec.enlaces.length > 0 && <>
            <dt className="font-medium text-slate-500"><Link2 size={13} className="inline" /> Enlaces</dt>
            <dd className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-700">{rec.enlaces.map((e) => <span key={e.url}>«{e.ancla}» → <span className="text-brand-700">{e.url}</span></span>)}</dd>
          </>}
          {rec.cta && <>
            <dt className="font-medium text-slate-500"><Megaphone size={13} className="inline" /> CTA</dt>
            <dd className="text-slate-700">{rec.cta}</dd>
          </>}
        </>}
      </dl>

      <div className="mt-3">
        <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Por qué ahora</p>
        {rec.por_que.length ? (
          <ul className="mt-1.5 space-y-1">
            {rec.por_que.map((p, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600"><Badge tone={SENAL_UI[p.senal]?.tone}>{SENAL_UI[p.senal]?.label ?? p.senal}</Badge><span>{p.detalle}</span></li>)}
          </ul>
        ) : <p className="mt-1 text-[13px] text-slate-500">Encaja con la guía editorial; no hay una señal concreta que lo adelante.</p>}
      </div>

      {!compacta && (
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-[var(--line)] pt-3">
          <button type="button" disabled={pend} onClick={() => votar("interesa")} className="btn btn-soft"><ThumbsUp size={14} /> Me interesa</button>
          <button type="button" disabled={pend} onClick={() => votar("no_interesa")} className="btn btn-ghost"><ThumbsDown size={14} /> No me interesa</button>
          <button type="button" disabled={pend} onClick={() => votar("publicado")} className="btn btn-ghost"><CheckCircle2 size={14} /> Ya publicado</button>
          <button type="button" disabled={pend} onClick={() => votar("mas_como_esto")} className="btn btn-ghost"><Sparkles size={14} /> Más como esto</button>
          {viva && (
            <span className="flex items-center gap-2">
              <button type="button" disabled={pend} onClick={crearBrief} className="btn btn-soft"><FileText size={14} /> Crear brief</button>
              {!rec.radar_id && <label className="flex items-center gap-1 text-xs text-slate-500"><input type="checkbox" checked={borrador} onChange={(e) => setBorrador(e.target.checked)} /> Solo borrador</label>}
            </span>
          )}
          {rec.destino_ref && <a href={`${sitio}${rec.destino_ref}`} target="_blank" rel="noreferrer" className="btn btn-ghost"><ExternalLink size={14} /> Abrir destino</a>}
          <Link href={`/noticias?q=${encodeURIComponent(rec.keyword)}`} className="btn btn-ghost"><Search size={14} /> Buscar noticias</Link>
          {pend && <Loader2 size={15} className="animate-spin text-slate-400" />}
          {err && <span className="text-xs text-rose-600">{err}</span>}
        </div>
      )}
    </article>
  );
}
