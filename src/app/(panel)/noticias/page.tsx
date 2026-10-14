import { PageHeader } from "@/components/ui";
import { ultimasBusquedas } from "@/lib/temas";
import { BuscadorTemas } from "./BuscadorTemas";

export const dynamic = "force-dynamic";
export const maxDuration = 300;
export const metadata = { title: "Noticias · Buscar" };

export default async function BuscarNoticias({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const busquedas = await ultimasBusquedas();
  return (
    <>
      <PageHeader title="Buscar noticias" subtitle="Escribe cualquier tema y busco en la web las noticias recientes relacionadas. De cada una puedes crear un brief: el publicador la lee, prepara el resumen y te lo manda para aprobar." />
      <BuscadorTemas anteriores={busquedas} inicial={q ?? ""} />
    </>
  );
}
