import { notFound } from "next/navigation";
import { obtener, etiquetas as todasEtiquetas, medio } from "@/lib/wp";
import { inventario } from "@/lib/seo/inventario";
import { sql, type Accion } from "@/lib/db";
import { Editor } from "./Editor";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: `Editar #${(await params).id}` };
}

export default async function EditarArticulo({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tipo?: string }> }) {
  const { id: idStr } = await params;
  const tipo = (await searchParams).tipo === "page" ? "page" : "post";
  const id = Number(idStr);
  if (!Number.isInteger(id)) notFound();
  const [entrada, inv, tags, acciones] = await Promise.all([
    obtener(id, tipo).catch(() => null),
    inventario(),
    todasEtiquetas(),
    sql<Accion[]>`select * from seo.actions where target_id = ${String(id)} order by created_at desc limit 15`,
  ]);
  if (!entrada) notFound();
  const portada = entrada.featured_media ? await medio(entrada.featured_media).catch(() => null) : null;
  const ctx = {
    anio: inv.ctx.anio,
    urlsInternas: [...(inv.ctx.urlsInternas ?? [])],
    entrantes: inv.ctx.entrantes?.get(id) ?? 0,
    similares: inv.ctx.similares?.get(id) ?? [],
  };
  return (
    <Editor
      key={entrada.modified}
      entrada={entrada}
      tipo={tipo}
      categorias={inv.categorias.map((c) => ({ id: c.id, name: c.name }))}
      etiquetas={entrada.tags.map((t) => tags.find((x) => x.id === t)?.name ?? "").filter(Boolean)}
      portada={portada ? { url: portada.source_url, alt: portada.alt_text, kb: Math.round((portada.media_details?.filesize ?? 0) / 1024) } : null}
      ctx={ctx}
      acciones={acciones.map((a) => ({ id: a.id, created_at: new Date(a.created_at).toISOString(), origin: a.origin, summary: a.summary, status: a.status, deshacible: !!a.before }))}
    />
  );
}
