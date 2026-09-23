import { inventario } from "@/lib/seo/inventario";
import { PageHeader } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { Tabla, type FilaTabla } from "./Tabla";
import { limpiezaMasiva } from "../acciones";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Artículos" };

export default async function Articulos({ searchParams }: { searchParams: Promise<{ problema?: string }> }) {
  const { problema } = await searchParams;
  const inv = await inventario();
  const cats = Object.fromEntries(inv.categorias.map((c) => [c.id, c.name]));
  const filas: FilaTabla[] = inv.posts.map((p) => ({
    id: p.id, title: p.title, status: p.status, date: p.date, link: p.link, slug: p.slug,
    categoria: p.categories.map((c) => cats[c]).filter(Boolean).join(", "),
    score: p.analisis.score, palabras: p.analisis.metricas.palabras, internos: p.analisis.metricas.internos,
    keyword: p.analisis.keyword, problemas: p.analisis.problemas.map((x) => ({ codigo: x.codigo, titulo: x.titulo, gravedad: x.gravedad })),
  }));
  const limpiables = inv.posts.filter((p) => p.analisis.problemas.some((x) => x.arreglo === "quitar_schema_duplicado" || x.arreglo === "quitar_nombre_completo")).length;
  const aviso = `Voy a limpiar ${limpiables} artículos: quitar datos estructurados duplicados, abreviar la firma del autor y corregir enlaces de contacto rotos. Todo queda en el historial y se puede deshacer. ¿Seguimos?`;
  return (
    <>
      <PageHeader title="Artículos" subtitle="Todos los artículos del blog con su puntuación SEO y lo que falla. Entra en cualquiera para editarlo o mejorarlo con IA.">
        {limpiables > 0 && (
          <BotonAccion accion={limpiezaMasiva} className="btn btn-soft" confirmar={aviso}>
            🧹 Limpieza segura ({limpiables})
          </BotonAccion>
        )}
      </PageHeader>
      <Tabla filas={filas} categorias={inv.categorias.map((c) => c.name)} problemaInicial={problema} />
    </>
  );
}
