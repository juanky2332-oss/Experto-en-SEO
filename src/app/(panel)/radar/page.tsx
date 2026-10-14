import { redirect } from "next/navigation";

// Ruta vieja: el buscador está en Noticias › Buscar y el radar en Noticias › Radar.
export default async function Radar({ searchParams }: { searchParams: Promise<{ q?: string; tipo?: string }> }) {
  const { q, tipo } = await searchParams;
  if (q) redirect(`/noticias?q=${encodeURIComponent(q)}`);
  redirect(tipo ? `/noticias/radar?tipo=${encodeURIComponent(tipo)}` : "/noticias/radar");
}
