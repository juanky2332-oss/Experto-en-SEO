"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lightbulb, PenLine, RefreshCw, ThumbsDown, Send, ExternalLink, Pencil, Loader2, CheckCircle2, X } from "lucide-react";
import { Badge } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { darIdeaAccion, redactarIdeaAccion, publicarIdeaAccion, cerrarIdeaAccion } from "../acciones";
import type { Idea } from "@/lib/que-publicar/idea";
import { SENAL_UI } from "./Tarjeta";

/**
 * «Dame una idea»: una sola publicación para AHORA. Titular y por qué → «Sí, redáctalo» (borrador
 * completo) → «Publicar ya en transformaconia.com». Nada se programa para más adelante.
 */
export function IdeaAhora({ idea, sitio }: { idea: Idea | null; sitio: string }) {
  const router = useRouter();
  const b = idea?.brief ?? null;
  const atascada = !!idea?.atascada;
  const redactando = !!idea && !atascada && idea.rec.estado === "en_brief" && (!b || b.status === "pending" || b.status === "generating");
  // mientras se redacta, se refresca sola cada 20 s para enseñar el botón de publicar en cuanto esté
  useEffect(() => {
    if (!redactando) return;
    const t = setInterval(() => router.refresh(), 20000);
    return () => clearInterval(t);
  }, [redactando, router]);

  const pedir = (
    <BotonAccion accion={() => darIdeaAccion()} className="btn btn-primary"
      confirmar="Miro cómo está la web y hacia dónde vamos y te propongo UNA publicación para ahora. Coste: 0 € si nada ha cambiado, ~0,03 € si hay que pensar temas nuevos. ¿Seguimos?">
      <Lightbulb size={15} /> Dame una idea
    </BotonAccion>
  );

  return (
    <section className="card mb-6 border-2 border-brand-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Lightbulb size={18} className="text-amber-500" /> ¿Qué publico ahora?</h2>
          <p className="text-[13px] text-slate-500">Una idea para publicar hoy, según lo que ya tiene la web y hacia dónde queremos llevarla. Sin programar nada.</p>
        </div>
        {!idea && pedir}
      </div>

      {idea && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Te propongo publicar</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{idea.rec.titulo}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge tone="blue">{idea.rec.keyword}</Badge>
            {idea.rec.pilar && <Badge>{idea.rec.pilar}</Badge>}
            {idea.rec.cta && <Badge tone="emerald">lleva a: {idea.rec.cta}</Badge>}
          </div>
          <ul className="mt-3 space-y-1">
            {idea.rec.por_que.length
              ? idea.rec.por_que.map((p, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600"><Badge tone={SENAL_UI[p.senal]?.tone}>{SENAL_UI[p.senal]?.label ?? p.senal}</Badge><span>{p.detalle}</span></li>)
              : <li className="text-[13px] text-slate-600">Encaja con la guía editorial y con el foco de la web: {idea.rec.publico}</li>}
          </ul>

          <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-[var(--line)] pt-3">
            {(idea.rec.estado === "abierta" || idea.rec.estado === "interesa") && (
              <>
                <BotonAccion accion={() => redactarIdeaAccion(idea.rec.id)} className="btn btn-primary"
                  confirmar={`Redacto «${idea.rec.titulo}» entero como BORRADOR (texto, SEO e imágenes). Coste aproximado: ~0,65 €. No se publica hasta que tú lo digas. ¿Seguimos?`}>
                  <PenLine size={15} /> Sí, redáctalo
                </BotonAccion>
                <BotonAccion accion={() => darIdeaAccion("saltada")} className="btn btn-ghost"><RefreshCw size={15} /> Otra idea</BotonAccion>
                <BotonAccion accion={() => darIdeaAccion("no_interesa")} className="btn btn-ghost"><ThumbsDown size={15} /> No me interesa este tema</BotonAccion>
              </>
            )}

            {redactando && (
              <p className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 size={15} className="animate-spin" /> {b?.status === "generating" ? "Redactando el borrador (4-7 minutos)…" : "Preparando el resumen y la estructura…"} Te aviso por Telegram.
              </p>
            )}

            {b?.status === "draft" && b.post_id && idea.rec.estado !== "publicada" && (
              <>
                <p className="w-full text-sm text-slate-700">📝 Borrador listo{b.seo_score ? <> · SEO <b>{b.seo_score}/100</b></> : null}. Échale un ojo y, si te gusta, publícalo.</p>
                <a href={`${sitio}/?p=${b.post_id}&preview=true`} target="_blank" rel="noreferrer" className="btn btn-soft"><ExternalLink size={15} /> Ver cómo queda</a>
                <Link href={`/articulos/${b.post_id}`} className="btn btn-ghost"><Pencil size={15} /> Retocar</Link>
                <BotonAccion accion={() => publicarIdeaAccion(idea.rec.id)} className="btn btn-primary" confirmar="Se publica AHORA en transformaconia.com. ¿Seguro?">
                  <Send size={15} /> Publicar ya en transformaconia.com
                </BotonAccion>
              </>
            )}

            {(idea.rec.estado === "publicada" || b?.status === "published") && (
              <p className="flex w-full flex-wrap items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 size={16} /> Publicado.
                {b?.post_url && <a href={b.post_url} target="_blank" rel="noreferrer" className="underline">Verlo en la web</a>}
              </p>
            )}

            {b?.status === "failed" && <p className="w-full text-sm text-rose-600">No se pudo redactar: {b.error || "error desconocido"}. Prueba con otra idea.</p>}

            {atascada && <p className="w-full text-sm text-rose-600">El borrador no llegó a prepararse. Pide otra idea o apruébalo desde Telegram si te llegó el resumen.</p>}
            {(idea.rec.estado === "publicada" || b?.status === "published" || b?.status === "failed" || b?.status === "rejected" || atascada) && pedir}
            <BotonAccion accion={() => cerrarIdeaAccion()} className="btn btn-ghost ml-auto"><X size={15} /> Cerrar</BotonAccion>
          </div>
        </div>
      )}
    </section>
  );
}
