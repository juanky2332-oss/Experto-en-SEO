"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lightbulb, PenLine, RefreshCw, ThumbsDown, Send, ExternalLink, Pencil, Loader2, CheckCircle2, X, Target, KeyRound, ListOrdered } from "lucide-react";
import { Badge } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { darIdeaAccion, redactarIdeaAccion, publicarIdeaAccion, cerrarIdeaAccion } from "../acciones";
import type { Idea } from "@/lib/que-publicar/idea";
import { SENAL_UI } from "./Tarjeta";

/**
 * «Dame una idea»: una sola publicación para AHORA. Propuesta con cómo quedará (titular, palabras
 * clave, secciones, objetivo SEO) → «✍️ Redactar y publicar ahora» → publicada en transformaconia.com.
 * Lo mismo llega a Telegram con los mismos botones; esta tarjeta y el bot ven el mismo brief.
 */
export function IdeaAhora({ idea, sitio }: { idea: Idea | null; sitio: string }) {
  const router = useRouter();
  const b = idea?.brief ?? null;
  const p = b?.propuesta ?? null;
  const preparando = !!idea && !idea.atascada && idea.rec.estado === "en_brief" && !b;
  const redactando = b?.status === "generating";
  const pendiente = b?.status === "pending";
  const publicada = b?.status === "published" || idea?.rec.estado === "publicada";
  const enBorrador = b?.status === "draft" && !publicada;
  const terminada = publicada || b?.status === "failed" || b?.status === "rejected" || !!idea?.atascada || idea?.rec.estado === "descartada";
  // mientras se prepara o se redacta, se refresca sola para enseñar el siguiente paso en cuanto esté
  useEffect(() => {
    if (!preparando && !redactando) return;
    const t = setInterval(() => router.refresh(), preparando ? 8000 : 20000);
    return () => clearInterval(t);
  }, [preparando, redactando, router]);

  const pedir = (texto = "Dame una idea") => (
    <BotonAccion accion={() => darIdeaAccion()} className="btn btn-primary"
      confirmar="Miro cómo está la web y hacia dónde vamos y te propongo UNA publicación para ahora, con cómo quedará. Coste: ~0,05 € (la propuesta). Llega aquí y a Telegram en ~1 minuto. ¿Seguimos?">
      <Lightbulb size={15} /> {texto}
    </BotonAccion>
  );
  const titulo = p?.titular || idea?.rec.titulo || "";
  const secundarias = p?.keywords_secundarias?.length ? p.keywords_secundarias : idea?.rec.secundarias ?? [];

  return (
    <section className="card mb-6 border-2 border-brand-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900"><Lightbulb size={18} className="text-amber-500" /> ¿Qué publico ahora?</h2>
          <p className="text-[13px] text-slate-500">Una idea para publicar hoy, según lo que ya tiene la web y hacia dónde queremos llevarla. También en Telegram con <code>/idea</code>. Nada se programa.</p>
        </div>
        {!idea && pedir()}
      </div>

      {idea && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{publicada ? "Publicado" : "Te propongo publicar"}</p>
          <h3 className="mt-1 text-xl font-semibold text-slate-900">{titulo}</h3>
          {p?.resumen_linea && <p className="mt-1 text-sm text-slate-600">{p.resumen_linea}</p>}

          {preparando && (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><Loader2 size={15} className="animate-spin" /> Preparando cómo quedará (titular, palabras clave, secciones y SEO)… ~1 minuto. Te llega también a Telegram.</p>
          )}

          {!preparando && (
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-500 uppercase"><KeyRound size={13} /> Palabras clave</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge tone="blue">{p?.keyword_principal || idea.rec.keyword}</Badge>
                  {secundarias.slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-500 uppercase"><Target size={13} /> Objetivo SEO 100/100</p>
                <p className="mt-1 text-[13px] text-slate-600">6-8 H2 · keyword en título, URL, meta y entradilla · 3+ enlaces internos{idea.rec.cta ? <> (lleva a {idea.rec.cta})</> : null} · fuentes · FAQ con schema · 3 imágenes WebP con alt · Rank Math e IndexNow. Si no llega al listón, queda en borrador y decides tú.</p>
              </div>
              <div>
                {!!p?.preguntas?.length && <>
                  <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-slate-500 uppercase"><ListOrdered size={13} /> Secciones previstas</p>
                  <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[13px] text-slate-700">{p.preguntas.slice(0, 6).map((q) => <li key={q}>{q}</li>)}</ol>
                </>}
                <ul className="mt-3 space-y-1">
                  {p?.interes ? <li className="text-[13px] text-slate-600"><Badge tone={p.interes >= 75 ? "emerald" : p.interes >= 55 ? "amber" : "rose"}>Interés {p.interes}/100</Badge> {p.motivo}</li> : null}
                  {idea.rec.por_que.slice(0, 2).map((x, i) => <li key={i} className="flex items-start gap-2 text-[13px] text-slate-600"><Badge tone={SENAL_UI[x.senal]?.tone}>{SENAL_UI[x.senal]?.label ?? x.senal}</Badge><span>{x.detalle}</span></li>)}
                  {p?.canibaliza?.post_id ? <li className="text-[13px] text-amber-700">⚠️ Ya hay algo parecido: «{p.canibaliza.titulo}» (#{p.canibaliza.post_id})</li> : null}
                </ul>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-[var(--line)] pt-3">
            {pendiente && (
              <>
                <BotonAccion accion={() => redactarIdeaAccion(idea.rec.id)} className="btn btn-primary"
                  confirmar={`Redacto «${titulo}» y lo PUBLICO en transformaconia.com (texto, SEO e imágenes, ~0,6 €, 4-7 minutos). ¿Seguimos?`}>
                  <PenLine size={15} /> Redactar y publicar ahora
                </BotonAccion>
                <BotonAccion accion={() => darIdeaAccion("saltada")} className="btn btn-ghost"><RefreshCw size={15} /> Otra idea</BotonAccion>
                <BotonAccion accion={() => darIdeaAccion("no_interesa")} className="btn btn-ghost"><ThumbsDown size={15} /> No me interesa este tema</BotonAccion>
              </>
            )}

            {redactando && <p className="flex items-center gap-2 text-sm text-slate-600"><Loader2 size={15} className="animate-spin" /> Redactando y publicando (4-7 minutos)… Te aviso por Telegram.</p>}

            {enBorrador && b?.post_id && (
              <>
                <p className="w-full text-sm text-slate-700">📝 Se ha quedado en borrador porque no pasó el control de calidad{b.seo_score ? <> (SEO <b>{b.seo_score}/100</b>)</> : null}. Míralo y, si te vale, publícalo.</p>
                <a href={`${sitio}/?p=${b.post_id}&preview=true`} target="_blank" rel="noreferrer" className="btn btn-soft"><ExternalLink size={15} /> Ver cómo queda</a>
                <Link href={`/articulos/${b.post_id}`} className="btn btn-ghost"><Pencil size={15} /> Retocar</Link>
                <BotonAccion accion={() => publicarIdeaAccion(idea.rec.id)} className="btn btn-primary" confirmar="Se publica AHORA en transformaconia.com. ¿Seguro?">
                  <Send size={15} /> Publicar ahora
                </BotonAccion>
              </>
            )}

            {publicada && (
              <p className="flex w-full flex-wrap items-center gap-2 text-sm text-emerald-700">
                <CheckCircle2 size={16} /> Publicado en transformaconia.com{b?.seo_score ? ` · SEO ${b.seo_score}/100` : ""}.
                {b?.post_url && <a href={b.post_url} target="_blank" rel="noreferrer" className="underline">Verlo en la web</a>}
              </p>
            )}
            {b?.status === "failed" && <p className="w-full text-sm text-rose-600">No se pudo redactar: {b.error || "error desconocido"}.</p>}
            {b?.status === "rejected" && <p className="w-full text-sm text-slate-600">Descartada.</p>}
            {idea.atascada && <p className="w-full text-sm text-rose-600">La propuesta no llegó a prepararse. Pide otra.</p>}

            {terminada && pedir(publicada ? "Dame otra idea" : "Pedir otra idea")}
            <BotonAccion accion={() => cerrarIdeaAccion()} className="btn btn-ghost ml-auto"><X size={15} /> Cerrar</BotonAccion>
          </div>
        </div>
      )}
    </section>
  );
}
