import "server-only";
import { sql } from "./db";

// Lista de cosas por hacer fuera de la web (altas, directorios, negocio) para que no se olviden.
// Vive en seo.settings key 'pendientes'; el panel las marca y el informe del lunes recuerda las abiertas.
export type Pendiente = { id: string; grupo: "Altas" | "Visibilidad" | "Web" | "Negocio"; titulo: string; detalle: string; enlace?: string; hecho: boolean; fecha?: string };

export const PENDIENTES_BASE: Pendiente[] = [
  { id: "gsc", grupo: "Altas", titulo: "Google Search Console", detalle: "Verificar el dominio transformaconia.com y enviar /sitemap_index.xml. Sin esto no sabemos por qué búsquedas nos encuentran.", enlace: "https://search.google.com/search-console", hecho: false },
  { id: "bing", grupo: "Altas", titulo: "Bing Webmaster Tools", detalle: "Importar la web desde Search Console. ChatGPT busca en Bing: sin esto, es difícil que nos recomiende.", enlace: "https://www.bing.com/webmasters", hecho: false },
  { id: "gbp", grupo: "Altas", titulo: "Perfil de Empresa de Google", detalle: "Negocio de Murcia con área de servicio (sin mostrar dirección), categoría de consultoría informática, web y correo. Es lo que más pesa en búsquedas locales, Maps y Gemini.", enlace: "https://business.google.com", hecho: false },
  { id: "linkedin", grupo: "Visibilidad", titulo: "Página de empresa en LinkedIn", detalle: "Mismo nombre, logo y descripción que la web, y compartir allí los mejores artículos.", enlace: "https://www.linkedin.com/company/setup/new/", hecho: false },
  { id: "directorios", grupo: "Visibilidad", titulo: "Directorios de agencias de IA", detalle: "Darse de alta en Upliora, Sortlist y Clutch con el mismo nombre, descripción y enlace. Los asistentes de IA recomiendan a quien ven citado en varios sitios.", hecho: false },
  { id: "murcia", grupo: "Visibilidad", titulo: "Instituto de Fomento (INFO) y Cámara de Comercio de Murcia", detalle: "Aparecer en sus directorios de proveedores de digitalización e IA.", hecho: false },
  { id: "prensa", grupo: "Visibilidad", titulo: "Un caso en prensa local", detalle: "Contar un caso real (sin nombres si hace falta) a La Verdad o La Opinión de Murcia. Da enlaces y credibilidad.", hecho: false },
  { id: "kit", grupo: "Negocio", titulo: "Kit Digital / Kit Consulting", detalle: "Comprobar en la web oficial los requisitos para ser agente digitalizador. Muchas pymes buscan «Kit Consulting IA Murcia».", enlace: "https://www.acelerapyme.gob.es/", hecho: false },
  { id: "aviso", grupo: "Negocio", titulo: "Aviso legal", detalle: "Cuando se empiece a facturar, publicar el aviso legal con titular, NIF y domicilio (lo exige la LSSI).", hecho: false },
  { id: "precios", grupo: "Web", titulo: "5 artículos de «cuánto cuesta»", detalle: "Cuánto cuesta un chatbot con IA, automatizar un proceso, implantar IA en una pyme… con tabla y nuestros precios orientativos. Son lo que más citan ChatGPT y Gemini.", hecho: false },
  { id: "sectores", grupo: "Web", titulo: "Una página por sector", detalle: "Industria, mantenimiento, instaladores eléctricos, clínicas, despachos… cada una con contenido propio y enlace a su caso.", hecho: false },
  { id: "ciudades", grupo: "Web", titulo: "Páginas de Cartagena, Lorca, Molina y Alicante", detalle: "Con texto propio, no copias. El hueco local hoy lo ocupan directorios.", hecho: false },
  { id: "medir", grupo: "Web", titulo: "Medición mensual en buscadores de IA", detalle: "Una vez al mes, preguntar a ChatGPT, Gemini y Perplexity «agencia de IA en Murcia», «quién automatiza procesos con IA en Murcia»… y anotar si salimos.", hecho: false },
];

export async function getPendientes(): Promise<Pendiente[]> {
  const [r] = await sql<{ value: Pendiente[] }[]>`select value from seo.settings where key = 'pendientes'`;
  const guardados = new Map((r?.value ?? []).map((p) => [p.id, p]));
  // los nuevos de la lista base aparecen solos; se respeta lo ya marcado
  const lista = PENDIENTES_BASE.map((b) => ({ ...b, ...(guardados.get(b.id) ? { hecho: guardados.get(b.id)!.hecho, fecha: guardados.get(b.id)!.fecha } : {}) }));
  for (const p of guardados.values()) if (!PENDIENTES_BASE.some((b) => b.id === p.id)) lista.push(p);
  return lista;
}

export async function marcar(id: string, hecho: boolean) {
  const lista = (await getPendientes()).map((p) => (p.id === id ? { ...p, hecho, fecha: hecho ? new Date().toISOString().slice(0, 10) : undefined } : p));
  await sql`insert into seo.settings (key, value) values ('pendientes', ${sql.json(lista as never)})
    on conflict (key) do update set value = excluded.value, updated_at = now()`;
  return lista;
}
