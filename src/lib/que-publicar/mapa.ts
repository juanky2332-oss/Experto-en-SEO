// Mapa de palabras clave → página dueña (11-11-2026). Una búsqueda, una URL: evita que el blog compita con las páginas.
// Si una idea apunta a una de estas búsquedas, no puede ser un artículo nuevo: como mucho, ampliar la página dueña.
import { mismoTema } from "./prioridad.ts";

export const MAPA_KEYWORDS: { url: string; kws: string[] }[] = [
  { url: "/", kws: ["consultoría ia murcia", "consultoría inteligencia artificial murcia", "consultora ia murcia", "agencia ia murcia", "consultoría ia industrial"] },
  { url: "/consultor-ia-murcia/", kws: ["automatización industrial murcia", "transformación digital murcia", "digitalización empresas murcia"] },
  { url: "/erp-industria/", kws: ["erp para la industria", "erp para talleres", "erp talleres mecanizado", "erp mecanizados", "programa de gestión taller industrial"] },
  { url: "/presupuestos-desde-plano/", kws: ["presupuestos desde plano", "presupuesto desde plano con ia", "software de presupuestos para talleres"] },
  { url: "/gestion-documental-ia/", kws: ["gestión documental con ia", "gestor documental con inteligencia artificial", "digitalizar facturas y albaranes"] },
  { url: "/automatizar-facturas-proveedores/", kws: ["automatizar facturas de proveedores", "automatización facturas proveedores", "digitalización facturas proveedores", "gestión de facturas de proveedores", "control de facturas de proveedores"] },
  { url: "/coste-hora-maquina-taller/", kws: ["coste hora máquina", "precio hora mecanizado"] },
  { url: "/erp-taller-pequeno/", kws: ["erp taller pequeño"] },
  { url: "/ia-talleres-industriales/", kws: ["software gestión taller industrial", "software taller industrial"] },
  { url: "/ia-mantenimiento-industrial/", kws: ["ia mantenimiento industrial", "software mantenimiento industrial"] },
  { url: "/mantenimiento-predictivo-ia/", kws: ["mantenimiento predictivo con ia", "mantenimiento predictivo"] },
  { url: "/ia-empresas-instaladoras/", kws: ["software para empresas instaladoras", "ia para empresas instaladoras"] },
  { url: "/avisos-partes-trabajo-instaladores/", kws: ["partes de trabajo instaladores", "gestión de avisos instaladores"] },
  { url: "/distribucion-industrial/", kws: ["chatbot para distribuidores industriales", "asistente técnico distribuidores"] },
  { url: "/automatizacion-procesos-ia/", kws: ["automatización de procesos industriales", "automatización de procesos con ia"] },
  { url: "/kit-consulting-ia/", kws: ["kit consulting inteligencia artificial", "kit consulting ia"] },
  { url: "/verifactu-pymes-industriales/", kws: ["verifactu pymes", "verifactu"] },
  { url: "/ayudas-digitalizacion-pyme-murcia/", kws: ["ayudas digitalización empresas murcia", "cheque tic murcia", "subvenciones digitalización murcia"] },
  { url: "/automatizar-compras-empresa/", kws: ["automatizar compras empresa", "comparación de ofertas proveedores"] },
  { url: "/informes-produccion-semanales/", kws: ["informes de producción semanales", "informe de producción"] },
];

/** Página dueña de una búsqueda, o null si la búsqueda está libre. */
export function duenaDe(keyword: string): string | null {
  for (const e of MAPA_KEYWORDS) if (e.kws.some((k) => mismoTema(keyword, k))) return e.url;
  return null;
}
