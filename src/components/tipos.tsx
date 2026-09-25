import { Newspaper, Lightbulb, Route, Wrench, Workflow, Building2 } from "lucide-react";
import type { TipoClave } from "@/lib/guia-base";
import { Badge, type Tono } from "./ui";

export const TIPO_UI: Record<TipoClave, { label: string; tone: Tono; Icon: typeof Newspaper; corto: string }> = {
  actualidad: { label: "Actualidad", tone: "blue", Icon: Newspaper, corto: "Lo que acaba de pasar y qué cambia" },
  truco: { label: "Trucos y consejos", tone: "amber", Icon: Lightbulb, corto: "Comandos, atajos y configuraciones" },
  guia: { label: "Guías y rutas", tone: "emerald", Icon: Route, corto: "Paso a paso y rutas de aprendizaje" },
  herramienta: { label: "Herramientas", tone: "violet", Icon: Wrench, corto: "Análisis y comparativas" },
  automatizacion: { label: "Automatización", tone: "lime", Icon: Workflow, corto: "Flujos n8n, agentes y MCP" },
  empresa: { label: "IA en la empresa", tone: "slate", Icon: Building2, corto: "Casos, ROI y regulación" },
};

export function BadgeTipo({ tipo }: { tipo: string | null | undefined }) {
  const t = TIPO_UI[(tipo ?? "") as TipoClave];
  if (!t) return null;
  return <Badge tone={t.tone}><t.Icon size={12} /> {t.label}</Badge>;
}
