import { getAjustes } from "@/lib/db";
import { Card, PageHeader } from "@/components/ui";
import { BotonAccion } from "@/components/BotonAccion";
import { FormAjustes } from "./FormAjustes";
import { probarTelegram } from "../acciones";
import { salir } from "../../login/actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ajustes" };

const COMANDOS = [
  ["/tema tendencias Claude", "Busca en la web lo mejor sobre un tema y te propone qué publicar"],
  ["/estado", "Salud SEO, problemas críticos y temas del radar"],
  ["/articulos", "Los 10 artículos que más ayuda necesitan"],
  ["/post 6807", "Ficha SEO de un artículo con sus problemas"],
  ["/titulo 6807 Nuevo título", "Cambia el título"],
  ["/meta 6807 Texto", "Cambia la meta description"],
  ["/keyword 6807 palabra clave", "Cambia la keyword principal"],
  ["/arreglar 6807", "Aplica los arreglos seguros"],
  ["/publicar 6807 · /borrador 6807", "Cambia el estado"],
  ["/borrar 6807", "A la papelera (pide confirmación)"],
  ["/radar", "Resumen de IA de hoy"],
  ["/radar on · off", "Enciende o apaga el radar automático"],
  ["/radar diario · semanal · panel", "Cada cuánto te avisa (panel = sin avisos)"],
  ["/radar ahora", "Lanza el radar en este momento"],
  ["/guia más trucos de n8n", "Cambia la guía editorial con lenguaje normal"],
  ["/recomendaciones", "Lo más urgente del plan SEO"],
  ["/buscar texto", "Busca artículos"],
  ["Texto libre", "«Cambia la meta del artículo de ChatGPT móvil para que sea más directa»: el asistente lo entiende y lo hace"],
  ["Un enlace", "Prepara el resumen de esa noticia para publicarla"],
];

export default async function Ajustes() {
  const a = await getAjustes();
  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Publicación automática" subtitle="Qué hace el publicador de n8n cuando apruebas una noticia">
          <FormAjustes modo={a.modo} minimo={a.score_minimo} />
        </Card>
        <Card title="Telegram" subtitle="El mismo bot del publicador. Todo cambio hecho aquí te llega con botón de deshacer.">
          <BotonAccion accion={probarTelegram} className="btn btn-soft">Enviar mensaje de prueba</BotonAccion>
          <ul className="mt-4 space-y-1.5 text-sm">
            {COMANDOS.map(([c, d]) => <li key={c}><code className="rounded bg-slate-100 px-1.5 py-0.5 text-[12.5px] text-slate-800">{c}</code> <span className="text-slate-600">— {d}</span></li>)}
          </ul>
        </Card>
        <Card title="Cómo está montado" subtitle="Para que sepas qué toca cada pieza">
          <ul className="space-y-2 text-sm text-slate-700">
            <li><b>WordPress</b> (transformaconia.com): se lee y edita a través de la <b>pasarela de n8n</b>, que guarda la contraseña de aplicación. La app nunca la ve.</li>
            <li><b>n8n</b>: «Transformaconia - Publicador IA SEO v3», «RADAR IA DIARIO» (comprueba cada hora su configuración y trabaja a la hora que elijas en Radar IA) y «SEO PASARELA».</li>
            <li><b>Base de datos</b>: esquema <code>seo</code> en Supabase (proyecto ERP PRUEBA, separado de las tablas del ERP).</li>
            <li><b>IA</b>: gpt-5.5 para redactar y analizar, gpt-5.4-mini para el asistente y la visión, gpt-image-2 para las imágenes (WebP), con un estilo visual distinto por tipo de artículo (ver Guía editorial).</li>
            <li><b>Rank Math</b>: título SEO, meta, keyword, schema, sitemap e IndexNow. Snippets «Experto SEO» en Code Snippets.</li>
          </ul>
        </Card>
        <Card title="Sesión">
          <form action={salir}><button className="btn btn-ghost">Cerrar sesión</button></form>
        </Card>
      </div>
    </>
  );
}
