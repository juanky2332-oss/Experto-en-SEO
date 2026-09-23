"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { ArrowLeft, ExternalLink, Save, Sparkles, Wand2, ImagePlus, Trash2, Eye, Code2, Undo2, Loader2, Check, X, Globe, EyeOff } from "lucide-react";
import { analizar, type Arreglo, type EntradaAnalizable } from "@/lib/seo/analizar";
import type { Entrada } from "@/lib/wp";
import { Badge, ScoreRing, GRAVEDAD, ESTADOS, fecha } from "@/components/ui";
import {
  guardarEntrada, cambiarEstado, mandarAPapelera, deshacerAccion, arreglosSeguros,
  iaMeta, iaMejorar, iaAlts, iaNuevaPortada, type Resultado,
} from "../../acciones";
import type { SugerenciaMeta } from "@/lib/ai";

type Props = {
  entrada: Entrada;
  tipo: "post" | "page";
  categorias: { id: number; name: string }[];
  etiquetas: string[];
  portada: { url: string; alt: string; kb: number } | null;
  ctx: { anio: number; urlsInternas: string[]; entrantes: number; similares: { id: number; title: string }[] };
  acciones: { id: number; created_at: string; origin: string; summary: string; status: string; deshacible: boolean }[];
};

const PRESETS: { label: string; instruccion: string }[] = [
  { label: "Actualizar a hoy", instruccion: "Actualiza el artículo con la información más reciente disponible hoy (busca en la web), corrige datos y años desfasados, y deja claro qué ha cambiado. Mantén la estructura y lo que siga siendo válido." },
  { label: "Respuesta directa arriba", instruccion: "Reescribe la introducción para que el primer párrafo (40-70 palabras) responda directamente a la pregunta principal de la keyword, y que cada H2 empiece con una frase autónoma citable por buscadores de IA." },
  { label: "Añadir FAQ", instruccion: "Añade al final una sección de Preguntas frecuentes con 4 preguntas reales que la gente busca sobre este tema, con respuestas de 40-70 palabras que respondan en la primera frase." },
  { label: "Enlaces internos", instruccion: "Añade 3-5 enlaces internos a artículos relacionados de la lista, con anclas descriptivas dentro de frases naturales, y corrige enlaces internos rotos." },
  { label: "Más completo", instruccion: "Amplía el artículo donde se queda corto: explica el cómo y el porqué, añade una tabla comparativa si encaja, listas escaneables y un ejemplo aplicado a una pyme española. Objetivo 1.500+ palabras sin relleno." },
  { label: "Estructura H2/H3", instruccion: "Reorganiza el contenido en 4-6 secciones H2 claras (una con la keyword principal) con H3 donde haga falta, párrafos cortos y listas. No elimines información." },
];

export function Editor({ entrada, tipo, categorias, etiquetas, portada, ctx, acciones }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(entrada.title);
  const [slug, setSlug] = useState(entrada.slug);
  const [excerpt, setExcerpt] = useState(entrada.excerpt);
  const [content, setContent] = useState(entrada.content);
  const [cat, setCat] = useState<number>(entrada.categories[0] ?? 0);
  const [tags, setTags] = useState(etiquetas.join(", "));
  const [seoTitle, setSeoTitle] = useState(entrada.meta.rank_math_title ?? "");
  const [metaDesc, setMetaDesc] = useState(entrada.meta.rank_math_description ?? "");
  const [kw, setKw] = useState(entrada.meta.rank_math_focus_keyword ?? "");
  const [vista, setVista] = useState<"preview" | "html">("preview");
  const [aviso, setAviso] = useState<{ ok: boolean; t: string } | null>(null);
  const [pend, start] = useTransition();
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [sugerencia, setSugerencia] = useState<SugerenciaMeta | null>(null);
  const [propuesta, setPropuesta] = useState<{ contenido: string; cambios: string[] } | null>(null);
  const [instruccion, setInstruccion] = useState("");

  const analisis = useMemo(() => {
    const e: EntradaAnalizable = {
      id: entrada.id, type: tipo, status: entrada.status, date: entrada.date, slug, link: entrada.link, title, content, excerpt,
      featured_media: entrada.featured_media,
      meta: { rank_math_title: seoTitle, rank_math_description: metaDesc, rank_math_focus_keyword: kw },
    };
    return analizar(e, {
      anio: ctx.anio,
      urlsInternas: new Set(ctx.urlsInternas),
      entrantes: new Map([[entrada.id, ctx.entrantes]]),
      similares: new Map([[entrada.id, ctx.similares]]),
    });
  }, [title, slug, content, excerpt, seoTitle, metaDesc, kw, entrada, tipo, ctx]);

  const tagsIni = etiquetas.join(", ");
  const cambios = useMemo(() => {
    const c: Record<string, unknown> = {};
    if (title !== entrada.title) c.title = title;
    if (slug !== entrada.slug) c.slug = slug;
    if (excerpt !== entrada.excerpt) c.excerpt = excerpt;
    if (content !== entrada.content) c.content = content;
    if (tipo === "post" && cat && cat !== entrada.categories[0]) c.categories = [cat];
    if (tags !== tagsIni) c.etiquetasTexto = tags.split(",").map((t) => t.trim()).filter(Boolean);
    const meta: Record<string, string> = {};
    if (seoTitle !== (entrada.meta.rank_math_title ?? "")) meta.rank_math_title = seoTitle;
    if (metaDesc !== (entrada.meta.rank_math_description ?? "")) meta.rank_math_description = metaDesc;
    if (kw !== (entrada.meta.rank_math_focus_keyword ?? "")) meta.rank_math_focus_keyword = kw;
    if (Object.keys(meta).length) c.meta = meta;
    return c;
  }, [title, slug, excerpt, content, cat, tags, seoTitle, metaDesc, kw, entrada, tipo, tagsIni]);
  const hayCambios = Object.keys(cambios).length > 0;

  function ejecutar<T>(clave: string, fn: () => Promise<Resultado<T>>, ok?: (d: T) => void, refrescar = false) {
    setOcupado(clave);
    setAviso(null);
    start(async () => {
      const r = await fn();
      setOcupado(null);
      if (!r.ok) return setAviso({ ok: false, t: r.error });
      if (r.mensaje) setAviso({ ok: true, t: r.mensaje });
      ok?.(r.data as T);
      if (refrescar) router.refresh();
    });
  }

  const guardar = () => ejecutar("guardar", () => guardarEntrada(entrada.id, tipo, cambios), undefined, true);
  const pedirMeta = () => ejecutar("meta", () => iaMeta(entrada.id, tipo), (d) => setSugerencia(d as SugerenciaMeta));
  const mejorar = (ins: string) => ejecutar("mejorar", () => iaMejorar(entrada.id, tipo, ins, content), (d) => setPropuesta(d as { contenido: string; cambios: string[] }));
  const alts = () => ejecutar("alts", () => iaAlts(entrada.id, tipo, content), (d) => {
    const x = d as { contenido: string; n: number };
    setContent(x.contenido);
    setAviso({ ok: true, t: `${x.n} textos alternativos generados leyendo cada imagen. Revisa y guarda.` });
  });

  const arreglar = (a?: Arreglo) => {
    if (!a) return;
    if (a === "ia_meta" || a === "ia_keyword" || a === "ia_titulo") return pedirMeta();
    if (a === "ia_alt") return alts();
    if (a === "quitar_schema_duplicado" || a === "quitar_nombre_completo") {
      if (hayCambios) return setAviso({ ok: false, t: "Guarda antes tus cambios; este arreglo se aplica directamente en WordPress." });
      return ejecutar("seguro", () => arreglosSeguros(entrada.id, tipo), undefined, true);
    }
    const mapa: Partial<Record<Arreglo, string>> = { ia_faq: PRESETS[2].instruccion, ia_enlaces: PRESETS[3].instruccion, ia_actualizar: PRESETS[0].instruccion };
    if (mapa[a]) mejorar(mapa[a]!);
  };

  const cont = (n: number, min: number, max: number) => (
    <span className={clsx("text-xs tabular-nums", n === 0 ? "text-slate-400" : n < min || n > max ? "text-amber-600" : "text-emerald-600")}>{n} car.</span>
  );
  const serpTitulo = (seoTitle || `${title} - Transforma con IA`).replace(/%sep%/g, "-").replace(/%sitename%/g, "Transforma con IA").replace(/%title%/g, title);
  const serpDesc = metaDesc || excerpt;

  return (
    <div className="pb-24">
      {/* Cabecera */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href={tipo === "page" ? "/paginas" : "/articulos"} className="btn btn-ghost px-2.5"><ArrowLeft size={16} /></Link>
        <ScoreRing score={analisis.score} size={46} stroke={5} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-slate-900">{title || "(sin título)"}</p>
          <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Badge tone={ESTADOS[entrada.status]?.tone}>{ESTADOS[entrada.status]?.label ?? entrada.status}</Badge>
            #{entrada.id} · {fecha(entrada.date)} · editado {fecha(entrada.modified, true)}
            <a href={entrada.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600 hover:underline">ver en la web <ExternalLink size={11} /></a>
          </p>
        </div>
        {entrada.status === "publish" ? (
          <button className="btn btn-ghost" disabled={pend} onClick={() => ejecutar("estado", () => cambiarEstado(entrada.id, tipo, "draft"), undefined, true)}><EyeOff size={15} /> Pasar a borrador</button>
        ) : (
          <button className="btn btn-soft" disabled={pend || hayCambios} title={hayCambios ? "Guarda primero" : ""} onClick={() => ejecutar("estado", () => cambiarEstado(entrada.id, tipo, "publish"), undefined, true)}><Globe size={15} /> Publicar</button>
        )}
        <button className="btn btn-danger" disabled={pend} onClick={() => { if (confirm("¿Enviar a la papelera? Se puede recuperar durante 30 días (y desde el historial).")) ejecutar("papelera", () => mandarAPapelera(entrada.id, tipo), () => router.push("/articulos")); }}><Trash2 size={15} /></button>
      </div>

      {aviso && (
        <div className={clsx("mb-4 flex items-start justify-between gap-3 rounded-xl px-4 py-3 text-sm", aviso.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>
          <span>{aviso.t}</span><button onClick={() => setAviso(null)}><X size={15} /></button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Título y URL */}
          <section className="card p-5">
            <div className="flex items-center justify-between"><label className="text-sm font-medium">Título (H1)</label>{cont(title.length, 45, 65)}</div>
            <input className="input mt-1.5 text-base font-medium" value={title} onChange={(e) => setTitle(e.target.value)} />
            <div className="mt-4 flex items-center justify-between"><label className="text-sm font-medium">URL</label>{cont(slug.length, 3, 60)}</div>
            <div className="mt-1.5 flex items-center rounded-[10px] border border-[var(--line)] bg-slate-50 pl-3 text-sm text-slate-500">
              transformaconia.com/<input className="input rounded-l-none border-0 border-l" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />/
            </div>
            {slug !== entrada.slug && entrada.status === "publish" && (
              <p className="mt-2 text-xs text-amber-700">Cambiar la URL de un artículo publicado: WordPress redirige la antigua automáticamente, pero pierde algo de señal temporalmente. Hazlo solo si la actual es mala.</p>
            )}
          </section>

          {/* SEO Google */}
          <section className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold">Cómo te ve Google (Rank Math)</h2>
              <button className="btn btn-soft" disabled={pend} onClick={pedirMeta}>{ocupado === "meta" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Sugerir con IA</button>
            </div>
            <div className="mt-4 rounded-xl border border-[var(--line)] bg-white p-4">
              <p className="truncate text-xs text-slate-600">transformaconia.com › {slug}</p>
              <p className="mt-1 truncate text-lg leading-snug text-[#1a0dab]">{serpTitulo.length > 62 ? serpTitulo.slice(0, 60) + "…" : serpTitulo}</p>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{serpDesc ? (serpDesc.length > 158 ? serpDesc.slice(0, 155) + "…" : serpDesc) : <i>Sin descripción: Google elegirá un trozo del texto.</i>}</p>
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <div className="flex items-center justify-between"><label className="text-sm font-medium">Título SEO <span className="font-normal text-slate-400">(vacío = título + nombre del sitio)</span></label>{cont(serpTitulo.length, 30, 60)}</div>
                <input className="input mt-1.5" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={`${title} - Transforma con IA`} />
              </div>
              <div>
                <div className="flex items-center justify-between"><label className="text-sm font-medium">Meta description</label>{cont(metaDesc.length, 130, 158)}</div>
                <textarea className="input mt-1.5" rows={2} value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Keywords <span className="font-normal text-slate-400">(la primera es la principal; separa con comas)</span></label>
                <input className="input mt-1.5" value={kw} onChange={(e) => setKw(e.target.value)} />
              </div>
            </div>
            {sugerencia && (
              <div className="mt-4 rounded-xl bg-brand-50/60 p-4 text-sm ring-1 ring-brand-100">
                <div className="flex items-center justify-between"><p className="font-medium text-brand-700">Propuesta de la IA</p><button onClick={() => setSugerencia(null)}><X size={15} /></button></div>
                <p className="mt-1 text-xs text-slate-600">{sugerencia.motivo}</p>
                <ul className="mt-3 space-y-2">
                  <Fila label="Keyword" valor={[sugerencia.focus_keyword, ...sugerencia.keywords_secundarias].join(", ")} aplicar={() => setKw([sugerencia.focus_keyword, ...sugerencia.keywords_secundarias].join(","))} />
                  <Fila label="Título SEO" valor={sugerencia.seo_title} aplicar={() => setSeoTitle(sugerencia.seo_title)} />
                  <Fila label="Meta" valor={sugerencia.meta_description} aplicar={() => setMetaDesc(sugerencia.meta_description)} />
                  {sugerencia.titulos.map((t, i) => <Fila key={i} label={`H1 ${i + 1}`} valor={t} aplicar={() => setTitle(t)} />)}
                </ul>
                <button className="btn btn-primary mt-3" onClick={() => { setKw([sugerencia.focus_keyword, ...sugerencia.keywords_secundarias].join(",")); setSeoTitle(sugerencia.seo_title); setMetaDesc(sugerencia.meta_description); setSugerencia(null); }}>
                  <Check size={15} /> Aplicar keyword, título SEO y meta
                </button>
              </div>
            )}
          </section>

          {/* Contenido */}
          <section className="card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] px-5 py-3">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                <button onClick={() => setVista("preview")} className={clsx("flex items-center gap-1.5 rounded-md px-3 py-1 text-sm", vista === "preview" && "bg-white shadow-sm")}><Eye size={14} /> Vista previa</button>
                <button onClick={() => setVista("html")} className={clsx("flex items-center gap-1.5 rounded-md px-3 py-1 text-sm", vista === "html" && "bg-white shadow-sm")}><Code2 size={14} /> HTML</button>
              </div>
              <button className="btn btn-ghost" disabled={pend} onClick={alts}>{ocupado === "alts" ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} Alt de imágenes con IA</button>
            </div>
            <div className="border-b border-[var(--line)] bg-slate-50/60 px-5 py-4">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-medium"><Wand2 size={15} className="text-brand-600" /> Mejorar con IA <span className="font-normal text-slate-500">— te enseño la propuesta antes de tocar nada</span></p>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => <button key={p.label} disabled={pend} onClick={() => mejorar(p.instruccion)} className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-[var(--line)] hover:ring-brand-500 disabled:opacity-50">{p.label}</button>)}
              </div>
              <div className="mt-2 flex gap-2">
                <input className="input" value={instruccion} onChange={(e) => setInstruccion(e.target.value)} placeholder="O pide lo que quieras: «añade una tabla de precios», «enfócalo a clínicas»…" />
                <button className="btn btn-primary" disabled={pend || !instruccion.trim()} onClick={() => mejorar(instruccion)}>{ocupado === "mejorar" ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} Mejorar</button>
              </div>
              {ocupado === "mejorar" && <p className="mt-2 text-xs text-slate-500">La IA está reescribiendo el artículo (1-3 minutos; si hay que actualizar, también busca en la web)…</p>}
            </div>
            {propuesta && (
              <div className="border-b border-[var(--line)] bg-brand-50/50 px-5 py-4">
                <p className="text-sm font-medium text-brand-700">Propuesta lista — cambios:</p>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">{propuesta.cambios.map((c, i) => <li key={i}>{c}</li>)}</ul>
                <div className="mt-3 flex gap-2">
                  <button className="btn btn-primary" onClick={() => { setContent(propuesta.contenido); setPropuesta(null); setVista("preview"); setAviso({ ok: true, t: "Propuesta aplicada al editor. Revisa la vista previa y pulsa Guardar para publicarla en WordPress." }); }}><Check size={15} /> Aplicar al editor</button>
                  <button className="btn btn-ghost" onClick={() => setPropuesta(null)}>Descartar</button>
                </div>
              </div>
            )}
            <div className="p-5">
              {vista === "preview" ? (
                <article className="preview max-w-none text-[15px] text-slate-800" dangerouslySetInnerHTML={{ __html: content.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "") }} />
              ) : (
                <textarea className="input scroll-thin min-h-[600px] font-mono text-[12.5px] leading-relaxed" value={content} onChange={(e) => setContent(e.target.value)} spellCheck={false} />
              )}
            </div>
          </section>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          <section className="card p-5">
            <div className="flex items-center gap-3">
              <ScoreRing score={analisis.score} size={56} stroke={6} />
              <div>
                <p className="font-semibold">Análisis SEO en vivo</p>
                <p className="text-xs text-slate-500">Se recalcula mientras escribes</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2.5">
              {analisis.problemas.map((p) => (
                <li key={p.codigo} className="rounded-lg border border-[var(--line)] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium"><Badge tone={GRAVEDAD[p.gravedad].tone}>{GRAVEDAD[p.gravedad].label}</Badge>{p.titulo}</p>
                      {p.detalle && <p className="mt-1 text-xs text-slate-500">{p.detalle}</p>}
                    </div>
                    {p.arreglo && <button disabled={pend} onClick={() => arreglar(p.arreglo)} className="btn btn-soft shrink-0 px-2.5 py-1 text-xs">Arreglar</button>}
                  </div>
                </li>
              ))}
              {!analisis.problemas.length && <li className="text-sm text-emerald-600">Sin problemas detectados.</li>}
            </ul>
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              {[
                ["Palabras", analisis.metricas.palabras.toLocaleString("es-ES")], ["Lectura", `${analisis.metricas.lecturaMin} min`], ["H2 / H3", `${analisis.metricas.h2} / ${analisis.metricas.h3}`],
                ["Internos", analisis.metricas.internos], ["Externos", analisis.metricas.externos], ["Le enlazan", ctx.entrantes],
              ].map(([k, v]) => (
                <div key={String(k)} className="rounded-lg bg-slate-50 p-2"><dt className="text-[11px] text-slate-500">{k}</dt><dd className="text-sm font-semibold">{v}</dd></div>
              ))}
            </dl>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="text-[15px] font-semibold">Publicación</h2>
            {tipo === "post" && (
              <div>
                <label className="text-sm font-medium">Categoría</label>
                <select className="input mt-1.5" value={cat} onChange={(e) => setCat(Number(e.target.value))}>
                  {categorias.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            {tipo === "post" && (
              <div>
                <label className="text-sm font-medium">Etiquetas <span className="font-normal text-slate-400">(2-4 entidades)</span></label>
                <input className="input mt-1.5" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="OpenAI, ChatGPT…" />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between"><label className="text-sm font-medium">Extracto</label>{cont(excerpt.length, 80, 200)}</div>
              <textarea className="input mt-1.5" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Imagen destacada</label>
              {portada ? (
                <div className="mt-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={portada.url} alt={portada.alt} className="aspect-[3/2] w-full rounded-xl object-cover" />
                  <p className="mt-1 text-xs text-slate-500">{portada.kb ? `${portada.kb} KB · ` : ""}{portada.url.split(".").pop()?.toUpperCase()} · alt: {portada.alt || <b className="text-amber-600">sin alt</b>}</p>
                </div>
              ) : <p className="mt-1 text-sm text-amber-700">Sin imagen destacada.</p>}
              <button className="btn btn-ghost mt-2 w-full justify-center" disabled={pend} onClick={() => { if (confirm("Generar una foto nueva con gpt-image-2 (unos 0,05-0,15 €) y ponerla como destacada?")) ejecutar("portada", () => iaNuevaPortada(entrada.id, tipo), undefined, true); }}>
                {ocupado === "portada" ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />} {ocupado === "portada" ? "Generando (~1 min)…" : "Nueva portada con IA"}
              </button>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="text-[15px] font-semibold">Historial de este {tipo === "page" ? "página" : "artículo"}</h2>
            <ul className="mt-3 space-y-2.5">
              {acciones.map((a) => (
                <li key={a.id} className="text-sm">
                  <p className={clsx("text-slate-700", a.status === "cancelled" && "line-through opacity-60")}>{a.summary}</p>
                  <p className="flex items-center gap-2 text-xs text-slate-500">
                    {fecha(a.created_at, true)} · {a.origin}
                    {a.deshacible && a.status !== "cancelled" && (
                      <button className="inline-flex items-center gap-0.5 text-brand-600 hover:underline" disabled={pend} onClick={() => { if (confirm("¿Deshacer este cambio?")) ejecutar("undo", () => deshacerAccion(a.id), undefined, true); }}><Undo2 size={12} /> deshacer</button>
                    )}
                  </p>
                </li>
              ))}
              {!acciones.length && <li className="text-sm text-slate-500">Todavía no hay cambios registrados.</li>}
            </ul>
          </section>
        </div>
      </div>

      {/* Barra de guardado */}
      <div className={clsx("fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 backdrop-blur transition lg:left-60", hayCambios ? "translate-y-0" : "translate-y-full")}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-6 py-3">
          <p className="text-sm text-slate-600">Cambios sin guardar: <b>{Object.keys(cambios).map((k) => ({ title: "título", slug: "URL", excerpt: "extracto", content: "contenido", categories: "categoría", etiquetasTexto: "etiquetas", meta: "SEO" })[k] ?? k).join(", ")}</b></p>
          <div className="flex gap-2">
            <button className="btn btn-ghost" disabled={pend} onClick={() => window.location.reload()}>Descartar</button>
            <button className="btn btn-primary" disabled={pend} onClick={guardar}>{ocupado === "guardar" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar en WordPress</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fila({ label, valor, aplicar }: { label: string; valor: string; aplicar: () => void }) {
  return (
    <li className="flex items-start justify-between gap-3">
      <p className="min-w-0 text-slate-700"><span className="mr-1 text-xs font-medium text-slate-500">{label}:</span>{valor} <span className="text-xs text-slate-400">({valor.length})</span></p>
      <button onClick={aplicar} className="shrink-0 text-xs font-medium text-brand-600 hover:underline">usar</button>
    </li>
  );
}
