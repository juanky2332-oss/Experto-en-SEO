import { redirect } from "next/navigation";

// Ruta vieja: «Visitas» vive ahora en Resultados.
export default async function Visitas({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const { dias } = await searchParams;
  redirect(dias ? `/resultados?dias=${encodeURIComponent(dias)}` : "/resultados");
}
