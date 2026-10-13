import Link from "next/link";
import { BarChart3, MousePointerClick, Mail, Smartphone } from "lucide-react";
import { sql } from "@/lib/db";
import { Card, PageHeader, Stat, Empty } from "@/components/ui";
import { GraficaVisitas } from "@/components/Grafica";

export const dynamic = "force-dynamic";
export const metadata = { title: "Visitas" };

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

// Medición propia de transformaconia.com (sin cookies ni IP): flujo n8n «WEB TRANSFORMACONIA → visitas» → seo.visitas
export default async function Visitas({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const dias = [7, 30, 90].includes(Number((await searchParams).dias)) ? Number((await searchParams).dias) : 30;
  const desde = sql`created_at > now() - make_interval(days => ${dias}::int)`;
  // tandas de ≤3 consultas (con el pool max:3, más en paralelo cuelga la conexión en local)
  const [tot, porDia, paginas] = await Promise.all([
    sql<{ visitas: number; clics: number; contactos: number; movil: number }[]>`
      select count(*) filter (where evento = 'visita')::int visitas, count(*) filter (where evento = 'clic')::int clics,
             count(*) filter (where evento = 'contacto')::int contactos, count(*) filter (where evento = 'visita' and disp = 'movil')::int movil
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
    sql<Fila[]>`select ruta clave, count(*)::int n from seo.visitas where evento = 'contacto' and ${desde} group by 1 order by 2 desc limit 10`,
  ]);
  // contactos del mes natural (Madrid): por página de entrada, por procedencia y por estado de seguimiento
  const mes = sql`created_at >= (date_trunc('month', now() at time zone 'Europe/Madrid') at time zone 'Europe/Madrid') and tipo = 'contacto'`;
  const [cEntrada, cProcede, cEstado] = await Promise.all([
    sql<Fila[]>`select coalesce(nullif(entrada, ''), 'Sin dato (formulario anterior a la medición)') clave, count(*)::int n from seo.contactos where ${mes} group by 1 order by 2 desc limit 10`,
    sql<Fila[]>`select coalesce(nullif(concat_ws(' · ', nullif(procedencia, ''), nullif(utm_source, '')), ''), 'Directo o sin dato') clave, count(*)::int n from seo.contactos where ${mes} group by 1 order by 2 desc limit 10`,
    sql<Fila[]>`select estado clave, count(*)::int n from seo.contactos where ${mes} group by 1 order by 2 desc`,
  ]);
  const ETIQ: Record<string, string> = { nuevo: "Sin responder", respondido: "Respondidos", diagnostico: "Diagnóstico acordado", no_encaja: "No encajan" };
  const cEstadoVista = cEstado.map((f) => ({ clave: ETIQ[f.clave] ?? f.clave, n: f.n }));
  const totalMes = cEntrada.reduce((a, f) => a + f.n, 0);
  const t = tot[0];
  const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

  return (
    <>
      <PageHeader title="Visitas" subtitle="Medición propia de transformaconia.com: sin cookies, sin guardar IP y sin contar tus propias visitas con la sesión de WordPress abierta ni a los robots.">
        {[7, 30, 90].map((d) => <Link key={d} href={`/visitas?dias=${d}`} className={`btn ${d === dias ? "btn-primary" : "btn-ghost"}`}>{d} días</Link>)}
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Páginas vistas" value={t.visitas} hint={`últimos ${dias} días`} icon={<BarChart3 size={18} />} tone="blue" />
        <Stat label="Clics en contactar" value={t.clics} hint={`${pct(t.clics, t.visitas)} % de las visitas`} icon={<MousePointerClick size={18} />} tone="violet" />
        <Stat label="Formularios enviados" value={t.contactos} hint="contactos que llegaron bien" icon={<Mail size={18} />} tone="emerald" />
        <Stat label="Desde el móvil" value={`${pct(t.movil, t.visitas)} %`} hint={`${t.movil} páginas vistas`} icon={<Smartphone size={18} />} tone="amber" />
      </div>
      <Card className="mt-6" title="Páginas vistas por día"><GraficaVisitas datos={porDia} /></Card>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Páginas más vistas"><Lista filas={paginas} vacio="Sin visitas todavía." enlace /></Card>
        <Card title="De dónde llegan" subtitle="Dominio de procedencia (google.com = búsqueda en Google)"><Lista filas={origen} vacio="Sin visitas todavía." /></Card>
        <Card title="Botones de contacto pulsados"><Lista filas={clics} vacio="Nadie ha pulsado todavía un botón de contacto." /></Card>
        <Card title="Páginas desde las que escriben"><Lista filas={entradas} vacio="Aún no ha llegado ningún formulario." enlace /></Card>
        <Card title="Contactos de este mes: por página de entrada" subtitle={`${totalMes} ${totalMes === 1 ? "contacto" : "contactos"} en el mes natural. La entrada es la primera página que vieron en su visita.`}><Lista filas={cEntrada} vacio="Aún no hay contactos este mes." /></Card>
        <Card title="Contactos de este mes: por procedencia" subtitle="Dominio de origen y, si había, campaña (utm_source)"><Lista filas={cProcede} vacio="Aún no hay contactos este mes." /></Card>
        <Card title="Contactos de este mes: seguimiento" subtitle="Se actualiza con los botones del aviso de Telegram"><Lista filas={cEstadoVista} vacio="Aún no hay contactos este mes." /></Card>
      </div>
    </>
  );
}
