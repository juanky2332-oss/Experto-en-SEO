import Link from "next/link";
import { Activity, AlertTriangle, FileText, Radar, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { inventario, historialSalud, guardarFoto } from "@/lib/seo/inventario";
import { NOMBRE_PROBLEMA } from "@/lib/seo/analizar";
import { sql, type Accion } from "@/lib/db";
import { Card, PageHeader, Stat, ScoreRing, Badge, GRAVEDAD, tonoScore, fecha, Empty } from "@/components/ui";
import { GraficaSalud } from "@/components/Grafica";
import { BotonAccion } from "@/components/BotonAccion";
import { reanalizar, prepararRadar } from "./acciones";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export default async function Resumen() {
  const inv = await inventario();
  const [historial, radar, digest, acciones, fotoHoy, calendario] = await Promise.all([
    historialSalud(),
    sql<{ id: number; title: string; source: string; score: number; resumen: string; status: string; keyword: string }[]>`
      select id, title, source, score, resumen, status, keyword from seo.radar
      where score is not null and status in ('sent','new') and created_at > now() - interval '3 days' order by score desc limit 5`,
    sql<{ fecha: string; data: { titular_dia?: string; puntos?: { titulo: string; explicacion: string }[] } }[]>`select to_char(fecha,'YYYY-MM-DD') fecha, data from seo.digests order by fecha desc limit 1`,
    sql<Accion[]>`select * from seo.actions order by created_at desc limit 8`,
    sql`select 1 from seo.score_history where post_id = 0 and fecha = current_date`,
    sql<{ id: number; titulo: string; prioridad: string; detalle: string }[]>`select id, titulo, prioridad, detalle from seo.recommendations where status = 'open' and tipo = 'publicar' order by case prioridad when 'alta' then 0 when 'media' then 1 else 2 end, id limit 5`,
  ]);
  if (!fotoHoy.length) await guardarFoto(inv); // primera visita del día: se guarda la foto para la gráfica

  const pub = inv.posts.filter((p) => p.status === "publish");
  const borradores = inv.posts.filter((p) => p.status === "draft");
  const todos = pub.flatMap((p) => p.analisis.problemas.map((x) => ({ ...x, post: p })));
  const criticos = todos.filter((x) => x.gravedad === "critica").length;
  const altos = todos.filter((x) => x.gravedad === "alta").length;

  // Qué arreglar primero: agrupado por tipo de problema, ordenado por impacto
  const porCodigo = new Map<string, { titulo: string; gravedad: keyof typeof GRAVEDAD; n: number; ejemplo: number }>();
  for (const x of todos) {
    const k = x.codigo;
    const g = porCodigo.get(k);
    porCodigo.set(k, { titulo: NOMBRE_PROBLEMA[k] ?? x.titulo, gravedad: x.gravedad, n: (g?.n ?? 0) + 1, ejemplo: g?.ejemplo ?? x.post.id });
  }
  const peso = { critica: 4, alta: 3, media: 2, baja: 1 };
  const prioridades = [...porCodigo.entries()].sort((a, b) => peso[b[1].gravedad] * b[1].n - peso[a[1].gravedad] * a[1].n).slice(0, 7);
  const peores = [...pub].sort((a, b) => a.analisis.score - b.analisis.score).slice(0, 5);
  const d = digest[0];

  return (
    <>
      <PageHeader title="Resumen" subtitle={`Estado SEO de transformaconia.com a ${fecha(new Date())}. Todo se lee en directo de WordPress.`}>
        <BotonAccion accion={reanalizar} className="btn btn-ghost"><RefreshCw size={15} /> Reanalizar</BotonAccion>
        <Link href="/estrategia" className="btn btn-primary"><Sparkles size={15} /> Ver plan</Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="card flex items-center gap-4 p-5">
          <ScoreRing score={inv.salud} size={64} stroke={7} />
          <div>
            <p className="text-[13px] text-slate-500">Salud SEO media</p>
            <p className="text-sm font-medium text-slate-800">{inv.salud >= 85 ? "Excelente" : inv.salud >= 70 ? "Buena, con margen" : inv.salud >= 50 ? "Mejorable" : "Necesita trabajo"}</p>
            <p className="text-xs text-slate-500">de {pub.length} artículos publicados</p>
          </div>
        </div>
        <Stat label="Problemas críticos" value={criticos} hint={`${altos} de prioridad alta`} icon={<AlertTriangle size={18} />} tone={criticos ? "rose" : "emerald"} />
        <Stat label="Publicados · borradores" value={`${pub.length} · ${borradores.length}`} hint={`${inv.categorias.length} categorías`} icon={<FileText size={18} />} tone="blue" />
        <Stat label="Radar IA (3 días)" value={radar.length} hint="temas con potencial para publicar" icon={<Radar size={18} />} tone="violet" />
      </div>

      {calendario.length > 0 && (
        <Card className="mt-6" title="Tu calendario editorial" subtitle="Lo siguiente que conviene publicar, por prioridad" action={<Link href="/estrategia" className="text-sm text-brand-600 hover:underline">Ver todo</Link>}>
          <ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {calendario.map((c, i) => {
              const kw = c.detalle.match(/[Kk]eyword «([^»]+)»/)?.[1] ?? "";
              return (
                <li key={c.id} className="rounded-xl border border-[var(--line)] p-4">
                  <p className="text-xs text-slate-500">{i + 1}. <Badge tone={c.prioridad === "alta" ? "rose" : "amber"}>{c.prioridad}</Badge></p>
                  <p className="mt-1.5 text-sm font-medium text-slate-900">{c.titulo}</p>
                  {kw && <Link href={`/radar?q=${encodeURIComponent(kw)}`} className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline">Buscar fuentes para «{kw}» →</Link>}
                </li>
              );
            })}
          </ol>
        </Card>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2" title="Evolución de la salud SEO" subtitle="Una foto al día; sube a medida que se aplican las mejoras" action={<TrendingUp size={18} className="text-slate-400" />}>
          <GraficaSalud datos={historial} />
        </Card>
        <Card title="Qué arreglar primero" subtitle="Problemas agrupados por impacto">
          <ul className="space-y-2.5">
            {prioridades.map(([codigo, x]) => (
              <li key={codigo} className="flex items-center justify-between gap-3 text-sm">
                <Link href={`/articulos?problema=${codigo}`} className="flex min-w-0 items-center gap-2 hover:text-brand-700">
                  <Badge tone={GRAVEDAD[x.gravedad].tone}>{x.n}</Badge>
                  <span className="truncate">{x.titulo}</span>
                </Link>
              </li>
            ))}
            {!prioridades.length && <Empty>Sin problemas pendientes 🎉</Empty>}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card title="Qué publicar hoy" subtitle={d ? `Radar del ${fecha(d.fecha)}: ${d.data.titular_dia ?? ""}` : "El radar se ejecuta cada día a las 8:30"} action={<Link href="/radar" className="text-sm text-brand-600 hover:underline">Radar completo</Link>}>
          <ul className="divide-y divide-[var(--line)]">
            {radar.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{r.title}</p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{r.resumen}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5"><Badge tone={tonoScore(r.score)}>{r.score}/100</Badge><Badge>{r.source}</Badge>{r.keyword && <Badge tone="blue">{r.keyword}</Badge>}</p>
                </div>
                <BotonAccion accion={prepararRadar.bind(null, r.id)} className="btn btn-soft">Preparar</BotonAccion>
              </li>
            ))}
            {!radar.length && <Empty>No hay temas pendientes. Lanza el radar desde la sección Radar IA.</Empty>}
          </ul>
        </Card>
        <Card title="Artículos que más necesitan ayuda" action={<Link href="/articulos" className="text-sm text-brand-600 hover:underline">Todos</Link>}>
          <ul className="divide-y divide-[var(--line)]">
            {peores.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <ScoreRing score={p.analisis.score} size={38} stroke={4} />
                <Link href={`/articulos/${p.id}`} className="min-w-0 flex-1 hover:text-brand-700">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <p className="truncate text-xs text-slate-500">{p.analisis.problemas.slice(0, 2).map((x) => x.titulo).join(" · ")}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        {d?.data.puntos && (
          <Card title="Lo que hay que saber hoy en IA" subtitle="Resumen del editor IA a partir de 14 fuentes de referencia">
            <ul className="space-y-3">
              {d.data.puntos.map((p, i) => (
                <li key={i} className="text-sm"><span className="font-medium text-slate-900">{p.titulo}.</span> <span className="text-slate-600">{p.explicacion}</span></li>
              ))}
            </ul>
          </Card>
        )}
        <Card title="Últimos cambios" subtitle="Trazabilidad completa: app, Telegram y n8n" action={<Link href="/historial" className="text-sm text-brand-600 hover:underline">Historial</Link>}>
          <ul className="space-y-2.5">
            {acciones.map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <Activity size={15} className="mt-0.5 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="text-slate-800">{a.summary}</p>
                  <p className="text-xs text-slate-500">{fecha(a.created_at, true)} · {a.origin}{a.status === "cancelled" ? " · deshecho" : ""}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
