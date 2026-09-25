import Link from "next/link";
import { RefreshCw, Target, Users, Layers, Image as ImageIcon, ShieldCheck, Bot, Ban, CalendarDays, NotebookPen } from "lucide-react";
import { getGuia, cobertura, ultimoDiagnostico } from "@/lib/guia";
import { Card, PageHeader, Badge, Empty, fecha } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { BadgeTipo, TIPO_UI } from "@/components/tipos";
import { recalcularProximosAccion } from "../acciones";
import { PedirCambio, Seccion } from "./Editables";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Guía editorial" };

const dias = (d: string | null) => (d ? Math.floor((Date.now() - Date.parse(d)) / 864e5) : null);

export default async function GuiaEditorial() {
  const g = await getGuia();
  const [cob, diag] = await Promise.all([cobertura(g), ultimoDiagnostico()]);
  const maxTipo = Math.max(1, ...cob.tipos.map((t) => t.trimestre));

  return (
    <>
      <PageHeader title="Guía editorial" subtitle={<>A quién escribimos, sobre qué, con qué formato y qué no publicar. Es la guía que siguen el <b>radar</b> (para puntuar y clasificar noticias) y el <b>redactor</b> (estructura, extensión, llamada a la acción y estilo de imagen de cada tipo). Versión {g.version} · actualizada el {fecha(g.actualizada)}.</>}>
        <BotonAccion accion={recalcularProximosAccion} className="btn btn-primary" confirmar="Analizo lo publicado y el radar con IA para proponer los próximos artículos (30-60 s, unos céntimos). ¿Seguimos?">
          <RefreshCw size={15} /> Recalcular qué publicar
        </BotonAccion>
      </PageHeader>

      <PedirCambio />

      <div className="mb-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3" title="Qué publicar después" subtitle={diag ? `${diag.data.diagnostico} (calculado el ${fecha(diag.created_at, true)})` : "Pulsa «Recalcular qué publicar» para que la IA cruce la guía con lo publicado y el radar. Se recalcula solo cada lunes."}>
          {g.proximos.length ? (
            <ol className="divide-y divide-[var(--line)]">
              {g.proximos.map((p, i) => (
                <li key={i} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900"><span className="mr-1.5 text-slate-400">{i + 1}.</span>{p.titulo}</p>
                    <p className="mt-0.5 text-sm text-slate-600">{p.por_que}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5"><BadgeTipo tipo={p.tipo} /><Badge tone="blue">{p.keyword}</Badge><Badge>{p.pilar}</Badge></div>
                  </div>
                  <Link href={`/radar?q=${encodeURIComponent(p.keyword)}`} className="btn btn-soft">Buscar fuentes</Link>
                </li>
              ))}
            </ol>
          ) : <Empty>Todavía no hay propuestas. Pulsa «Recalcular qué publicar».</Empty>}
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <Card title="Cobertura por tipo" subtitle={`${cob.total} artículos publicados · ${cob.mes} en los últimos 30 días. Barras: últimos 90 días.`}>
            <ul className="space-y-2.5">
              {cob.tipos.map((t) => {
                const T = TIPO_UI[t.clave]; const d = dias(t.ultimo);
                return (
                  <li key={t.clave}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800"><T.Icon size={14} className="text-slate-500" />{t.nombre}</span>
                      <span className="text-xs text-slate-500">{t.total} en total · {t.mes} este mes{d != null ? ` · último hace ${d} d` : " · ninguno"}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-brand-500" style={{ width: `${Math.max(3, (t.trimestre / maxTipo) * 100)}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Pilares (clusters)" subtitle="Artículos que ya cubren cada pilar según sus keywords.">
            <ul className="space-y-2 text-sm">
              {cob.pilares.map((p) => {
                const d = dias(p.ultimo);
                return (
                  <li key={p.nombre} className="flex items-start justify-between gap-3">
                    <span className="text-slate-800" title={p.titulos.join("\n")}>{p.nombre}</span>
                    <Badge tone={p.total === 0 ? "rose" : d != null && d > 60 ? "amber" : "emerald"}>{p.total === 0 ? "sin cubrir" : `${p.total} · hace ${d} d`}</Badge>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card title={<span className="inline-flex items-center gap-2"><Target size={16} className="text-brand-600" />Posicionamiento</span>} subtitle="Qué somos para el lector y por qué nos contratan las empresas">
          <Seccion campo="posicionamiento" valor={g.posicionamiento} />
          <p className="mt-5 mb-2 text-sm font-medium text-slate-800">Embudo: del lector al cliente</p>
          <Seccion campo="embudo" valor={g.embudo} />
        </Card>
        <Card title={<span className="inline-flex items-center gap-2"><Users size={16} className="text-brand-600" />A quién escribimos</span>} subtitle="Se cambia con «Pide un cambio»">
          <div className="space-y-4">
            {g.audiencias.map((a) => (
              <div key={a.nombre} className="rounded-xl border border-[var(--line)] p-4">
                <p className="flex flex-wrap items-center gap-2 font-medium text-slate-900">{a.nombre}<Badge tone="violet">{a.peso}</Badge></p>
                <p className="mt-1.5 text-sm text-slate-600"><b className="text-slate-700">Quién:</b> {a.quien}</p>
                <p className="mt-1 text-sm text-slate-600"><b className="text-slate-700">Busca:</b> {a.que_busca}</p>
                <p className="mt-1 text-sm text-slate-600"><b className="text-slate-700">Cómo ganarlo:</b> {a.como_ganarla}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mb-6" title={<span className="inline-flex items-center gap-2"><Layers size={16} className="text-brand-600" />Tipos de contenido</span>} subtitle="Cada tipo tiene su objetivo, su estructura, su llamada a la acción y su estilo de imagen. El radar clasifica las noticias con estos tipos y el redactor aplica la plantilla.">
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {g.tipos.map((t) => {
            const T = TIPO_UI[t.clave];
            return (
              <div key={t.clave} className="flex flex-col rounded-xl border border-[var(--line)] p-4">
                <p className="flex items-center gap-2 font-semibold text-slate-900"><T.Icon size={16} className="text-brand-600" />{t.nombre}</p>
                <p className="mt-0.5 text-xs text-slate-500">Categoría /{t.categoria}/ · {t.extension} · {t.cadencia}</p>
                <p className="mt-2 text-sm text-slate-700">{t.objetivo}</p>
                <ol className="mt-2 list-decimal space-y-0.5 pl-5 text-[13px] text-slate-600">{t.estructura.map((e, i) => <li key={i}>{e}</li>)}</ol>
                <p className="mt-3 text-[13px] text-slate-600"><b className="text-slate-700">Llamada a la acción:</b> {t.cta}</p>
                <p className="mt-2 flex gap-1.5 rounded-lg bg-slate-50 p-2.5 text-[13px] text-slate-600"><ImageIcon size={14} className="mt-0.5 shrink-0 text-slate-400" />{t.estilo_imagen}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="mb-6" title="Pilares y keywords semilla" subtitle="Los clusters sobre los que construimos autoridad. Cada artículo nuevo enlaza a su pilar.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {g.pilares.map((p) => (
            <div key={p.nombre} className="rounded-xl border border-[var(--line)] p-4">
              <p className="font-medium text-slate-900">{p.nombre}</p>
              <p className="mt-0.5 text-xs text-slate-500">/{p.categoria}/</p>
              <p className="mt-1.5 text-sm text-slate-600">{p.descripcion}</p>
              <div className="mt-2 flex flex-wrap gap-1">{p.keywords.map((k) => <Badge key={k} tone="blue">{k}</Badge>)}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title={<span className="inline-flex items-center gap-2"><CalendarDays size={16} className="text-brand-600" />Ritmo de publicación</span>}><Seccion campo="ritmo" valor={g.ritmo} /></Card>
        <Card title={<span className="inline-flex items-center gap-2"><Ban size={16} className="text-rose-500" />Qué no publicar</span>}><Seccion campo="no_publicar" valor={g.no_publicar} /></Card>
        <Card title={<span className="inline-flex items-center gap-2"><ShieldCheck size={16} className="text-brand-600" />Reglas SEO (Google)</span>}><Seccion campo="reglas_seo" valor={g.reglas_seo} /></Card>
        <Card title={<span className="inline-flex items-center gap-2"><Bot size={16} className="text-brand-600" />Reglas para buscadores con IA</span>} subtitle="Para que ChatGPT, Perplexity, Gemini y los AI Overviews nos citen"><Seccion campo="reglas_ia" valor={g.reglas_ia} /></Card>
        <Card title="Voz y estilo"><Seccion campo="voz" valor={g.voz} /></Card>
        <Card title={<span className="inline-flex items-center gap-2"><NotebookPen size={16} className="text-brand-600" />Notas y aprendizajes</span>} subtitle="Lo que vamos aprendiendo; la IA añade aquí lo que detecta al recalcular"><Seccion campo="notas" valor={g.notas} vacio="Aún no hay notas. Se irán añadiendo al recalcular o puedes escribirlas tú." /></Card>
      </div>
    </>
  );
}
