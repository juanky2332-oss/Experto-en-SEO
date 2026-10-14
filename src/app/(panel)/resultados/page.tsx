import Link from "next/link";
import { BarChart3, MousePointerClick, Mail, Smartphone, CalendarCheck } from "lucide-react";
import { sql } from "@/lib/db";
import { Card, PageHeader, Stat, Empty } from "@/components/ui";
import { GraficaVisitas } from "@/components/Grafica";
import { ultimaGsc } from "@/lib/gsc";
import { agruparConsultas, casiPagina1 } from "@/lib/que-publicar/gsc-senal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultados" };

type Fila = { clave: string; n: number };

function Lista({ filas, vacio, enlace }: { filas: Fila[]; vacio: string; enlace?: boolean }) {
  return filas.length ? (
      <ul className="divide-y divide-[var(--line)] text-sm">
        {filas.map((f) => (
          <li key={f.clave} className="flex items-center justify-between gap-3 py-2">
            {enlace ? <a href={`https://transformaconia.com${f.clave}`} target="_blank" rel="noreferrer" className="min-w-0 truncate text-brand-600 hover:underline">{f.clave}</a> : <span className="min-w-0 truncate text-slate-700">{f.clave}</span>}
            <span className="font-medium text-slate-900 tabular-nums">{f.n}</span>
          </li>
        ))}
      </ul>
    ) : <Empty>{vacio}</Empty>;
}

type FilaG = { k: string; clics: number; impresiones: number; posicion: number };
function TablaGsc({ filas, vacio, enlace }: { filas: FilaG[]; vacio: string; enlace?: boolean }) {
  if (!filas.length) return <Empty>{vacio}</Empty>;
  return (
    <table className="w-full text-sm">
      <thead><tr className="text-left text-xs text-slate-500"><th className="py-1 font-medium">&nbsp;</th><th className="px-2 text-right font-medium">Clics</th><th className="px-2 text-right font-medium">Impr.</th><th className="px-2 text-right font-medium">CTR</th><th className="pl-2 text-right font-medium">Pos.</th></tr></thead>
      <tbody className="divide-y divide-[var(--line)]">
        {filas.map((f) => (
          <tr key={f.k}>
            <td className="break-words py-1.5 text-slate-700" title={f.k}>{enlace ? <a href={`https://transformaconia.com${f.k}`} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">{f.k}</a> : f.k}</td>
            <td className="px-2 text-right tabular-nums">{f.clics}</td>
            <td className="px-2 text-right tabular-nums">{f.impresiones}</td>
            <td className="px-2 text-right tabular-nums">{f.impresiones ? (Math.round((f.clics / f.impresiones) * 1000) / 10).toString().replace(".", ",") : 0} %</td>
            <td className="pl-2 text-right tabular-nums">{(Math.round(f.posicion * 10) / 10).toString().replace(".", ",")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Medición propia de transformaconia.com (sin cookies ni IP): flujo n8n «WEB TRANSFORMACONIA → visitas» → seo.visitas
export default async function Visitas({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = [7, 30, 90].includes(Number((await searchParams).dias)) ? Number((await searchParams).dias) : 30;
  const desde = sql`created_at > now() - make_interval(days => ${dias}::int)`;
  // tandas de ≤3 consultas (con el pool max:3, más en paralelo cuelga la conexión en local)
  // VISITAS salen de seo.visitas; FORMULARIOS de seo.contactos y RESERVAS de seo.reservas, siempre sin pruebas (es_prueba = false)
  const [tot, porDia, paginas] = await Promise.all([
    sql<{ visitas: number; clics: number; contactos: number; reservas: number; movil: number }[]>`
      select count(*) filter (where evento = 'visita')::int visitas, count(*) filter (where evento = 'clic')::int clics,
             (select count(*) from seo.contactos where tipo = 'contacto' and not es_prueba and ${desde})::int contactos,
             (select count(*) from seo.reservas where estado = 'confirmada' and not es_prueba and ${desde})::int reservas,
             count(*) filter (where evento = 'visita' and disp = 'movil')::int movil
      from seo.visitas where ${desde}`,
    sql<{ fecha: string; visitas: number }[]>`
      select to_char(d, 'YYYY-MM-DD') fecha, coalesce(v.n, 0)::int visitas
      from generate_series((now() at time zone 'Europe/Madrid')::date - (${dias}::int - 1), (now() at time zone 'Europe/Madrid')::date, interval '1 day') d
      left join (select (created_at at time zone 'Europe/Madrid')::date dia, count(*) n from seo.visitas where evento = 'visita' and ${desde} group by 1) v on v.dia = d
      order by d`,
    sql<Fila[]>`select ruta clave, count(*)::int n from seo.visitas where evento = 'visita' and ${desde} group by 1 order by 2 desc limit 15`,
  ]);
  const [origen, clics, entradas] = await Promise.all([
    sql<Fila[]>`select coalesce(nullif(ref, ''), 'Directo o sin dato') clave, count(*)::int n from seo.visitas where evento = 'visita' and ${desde} group by 1 order by 2 desc limit 10`,
    sql<Fila[]>`select etiqueta clave, count(*)::int n from seo.visitas where evento = 'clic' and ${desde} group by 1 order by 2 desc limit 10`,
    sql<Fila[]>`select coalesce(nullif(etiqueta, ''), 'Sin dato') || ' · ' || case ruta when '/evento/reserva-hecha' then 'reserva' else 'formulario' end clave, count(*)::int n
                 from seo.visitas where evento = 'conversion' and ${desde} group by ruta, etiqueta order by 2 desc limit 12`,
  ]);
  // contactos del mes natural (Madrid): por página de entrada, por procedencia y por estado de seguimiento
  const mes = sql`created_at >= (date_trunc('month', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid') and tipo = 'contacto' and not es_prueba`;
  const [cEntrada, cProcede, cEstado] = await Promise.all([
    sql<Fila[]>`select coalesce(nullif(entrada, ''), 'Sin dato (formulario anterior a la medición)') clave, count(*)::int n from seo.contactos where ${mes} group by 1 order by 2 desc limit 10`,
    sql<Fila[]>`select coalesce(nullif(concat_ws(' · ', nullif(procedencia, ''), nullif(utm_source, '')), ''), 'Directo o sin dato') clave, count(*)::int n from seo.contactos where ${mes} group by 1 order by 2 desc limit 10`,
    sql<Fila[]>`select estado clave, count(*)::int n from seo.contactos where ${mes} group by 1 order by 2 desc`,
  ]);
  // embudo del mes natural (Madrid): páginas vistas → formularios → reservas, sin pruebas
  const mesV = sql`created_at >= (date_trunc('month', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid')`;
  const [embudo] = await sql<{ visitas: number; contactos: number; reservas: number }[]>`
    select (select count(*) from seo.visitas where evento = 'visita' and ${mesV})::int visitas,
           (select count(*) from seo.contactos where tipo = 'contacto' and not es_prueba and ${mesV})::int contactos,
           (select count(*) from seo.reservas where estado = 'confirmada' and not es_prueba and ${mesV})::int reservas`;
  const ETIQ: Record<string, string> = { nuevo: "Sin responder", respondido: "Respondidos", diagnostico: "Diagnóstico acordado", no_encaja: "No encajan" };
  const cEstadoVista = cEstado.map((f) => ({ clave: ETIQ[f.clave] ?? f.clave, n: f.n }));
  const totalMes = cEntrada.reduce((a, f) => a + f.n, 0);
  const t = tot[0];
  const gsc = await ultimaGsc().catch(() => null);
  const topConsultas = gsc ? agruparConsultas(gsc.consultas).sort((a, b) => b.impresiones - a.impresiones || b.clics - a.clics).slice(0, 15) : [];
  const topPaginas = gsc ? [...gsc.paginas].sort((a, b) => b.impresiones - a.impresiones).slice(0, 10) : [];
  const oportunidades = gsc ? casiPagina1(gsc.consultas).slice(0, 10) : [];
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <>
      <PageHeader title="Visitas" subtitle="Medición propia de transformaconia.com: sin cookies, sin guardar IP y sin contar tus propias visitas con la sesión de WordPress abierta ni a los robots.">
        {[7, 30, 90].map((d) => <Link key={d} href={`/resultados?dias=${d}`} className={`btn ${d === dias ? "btn-primary" : "btn-ghost"}`}>{d} días</Link>)}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Páginas vistas" value={t.visitas} hint={`últimos ${dias} días`} icon={<BarChart3 size={18} />} tone="blue" />
        <Stat label="Clics en contactar" value={t.clics} hint={`${pct(t.clics, t.visitas)} % de las visitas`} icon={<MousePointerClick size={18} />} tone="violet" />
        <Stat label="Formularios enviados" value={t.contactos} hint="sin pruebas" icon={<Mail size={18} />} tone="emerald" />
        <Stat label="Reservas del diagnóstico" value={t.reservas} hint="confirmadas, sin pruebas" icon={<CalendarCheck size={18} />} tone="blue" />
        <Stat label="Desde el móvil" value={`${pct(t.movil, t.visitas)} %`} hint={`${t.movil} páginas vistas`} icon={<Smartphone size={18} />} tone="amber" />
      </div>
      <Card className="mt-6" title="Búsquedas en Google (28 días)" subtitle={gsc ? `Search Console, hasta el ${gsc.fecha}: ${gsc.clics} clics y ${gsc.impresiones} impresiones. Google solo da las consultas con suficientes búsquedas, así que el total de páginas es mayor que la suma de consultas.` : "Search Console aún no ha enviado datos."}>
        {gsc ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Top 15 consultas</p>
              <TablaGsc filas={topConsultas.map((f) => ({ k: f.consulta, ...f }))} vacio="Sin consultas todavía." />
            </div>
            <div className="space-y-6">
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Páginas con más impresiones</p>
                <TablaGsc filas={topPaginas.map((f) => ({ k: f.pagina, ...f }))} vacio="Sin páginas todavía." enlace />
              </div>
              <div>
                <p className="mb-1 text-xs font-medium tracking-wide text-slate-500 uppercase">Oportunidades (posición 8-30)</p>
                <TablaGsc filas={oportunidades.map((f) => ({ k: f.consulta, ...f }))} vacio="Ninguna consulta entre las posiciones 8 y 30 con impresiones suficientes." />
              </div>
            </div>
          </div>
        ) : <Empty>Sin datos de Search Console todavía.</Empty>}
      </Card>
      <Card className="mt-6" title="Embudo del mes" subtitle="Mes natural, sin pruebas: páginas vistas → formularios enviados → reservas del diagnóstico">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { k: "Páginas vistas", v: embudo.visitas, h: "visitas del mes" },
            { k: "Formularios enviados", v: embudo.contactos, h: `${pct(embudo.contactos, embudo.visitas)} % de las páginas vistas` },
            { k: "Reservas del diagnóstico", v: embudo.reservas, h: `${pct(embudo.reservas, embudo.visitas)} % de las páginas vistas` },
          ].map((e, i) => (
            <div key={e.k} className="rounded-xl border border-[var(--line)] p-4">
              <p className="text-[13px] text-slate-500">{i + 1}. {e.k}</p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{e.v}</p>
              <p className="mt-1 text-xs text-slate-500">{e.h}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="mt-6" title="Páginas vistas por día"><GraficaVisitas datos={porDia} /></Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Páginas más vistas"><Lista filas={paginas} vacio="Sin visitas todavía." enlace /></Card>
        <Card title="De dónde llegan" subtitle="Dominio de procedencia (google.com = búsqueda en Google)"><Lista filas={origen} vacio="Sin visitas todavía." /></Card>
        <Card title="Botones de contacto pulsados"><Lista filas={clics} vacio="Nadie ha pulsado todavía un botón de contacto." /></Card>
        <Card title="Conversiones por página de entrada" subtitle="Formularios y reservas completados, sin pruebas: primera página que vieron en su visita"><Lista filas={entradas} vacio="Aún no hay formularios ni reservas." /></Card>
        <Card title="Contactos de este mes: por página de entrada" subtitle={`${totalMes} ${totalMes === 1 ? "contacto" : "contactos"} en el mes natural. La entrada es la primera página que vieron en su visita.`}><Lista filas={cEntrada} vacio="Aún no hay contactos este mes." /></Card>
        <Card title="Contactos de este mes: por procedencia" subtitle="Dominio de origen y, si había, campaña (utm_source)"><Lista filas={cProcede} vacio="Aún no hay contactos este mes." /></Card>
        <Card title="Contactos de este mes: seguimiento" subtitle="Se actualiza con los botones del aviso de Telegram"><Lista filas={cEstadoVista} vacio="Aún no hay contactos este mes." /></Card>
      </div>
    </>
  );
}
