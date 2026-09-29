import "server-only";

// API REST de n8n (no la pasarela): solo para mover la hora del disparador del radar.
const API = process.env.N8N_API_URL ?? "https://paneln8n.transformaconia.com/api/v1";
const RADAR_ID = "fVpdqBxFqgVrRyLZ";

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const key = process.env.N8N_API_KEY;
  if (!key) throw new Error("Falta N8N_API_KEY para cambiar la hora del radar en n8n");
  const r = await fetch(API + path, {
    method,
    headers: { "X-N8N-API-KEY": key, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`n8n ${method} ${path} → ${r.status}: ${t.slice(0, 300)}`);
  return (t ? JSON.parse(t) : null) as T;
}

type Nodo = { type: string; parameters: { rule?: { interval?: { field?: string; expression?: string }[] } } };
type Flujo = { name: string; nodes: Nodo[]; connections: unknown; settings: Record<string, unknown>; active: boolean };

/** El radar se dispara una sola vez al día a la hora elegida (Europe/Madrid): mueve el cron del flujo. */
export async function sincronizarHoraRadar(hora: number) {
  const cron = `0 ${hora} * * *`;
  const wf = await api<Flujo>("GET", `/workflows/${RADAR_ID}`);
  const disparador = wf.nodes.find((n) => n.type === "n8n-nodes-base.scheduleTrigger");
  const regla = disparador?.parameters.rule?.interval?.[0];
  if (!regla) throw new Error("El flujo del radar no tiene disparador programado");
  if (regla.expression === cron) return false;
  regla.field = "cronExpression";
  regla.expression = cron;
  // n8n solo acepta estos ajustes en el PUT
  const permitidos = ["saveExecutionProgress", "saveManualExecutions", "saveDataErrorExecution", "saveDataSuccessExecution", "executionTimeout", "errorWorkflow", "timezone", "executionOrder", "callerPolicy"];
  const settings = Object.fromEntries(Object.entries(wf.settings ?? {}).filter(([k]) => permitidos.includes(k)));
  if (wf.active) await api("POST", `/workflows/${RADAR_ID}/deactivate`);
  try {
    await api("PUT", `/workflows/${RADAR_ID}`, { name: wf.name, nodes: wf.nodes, connections: wf.connections, settings });
  } finally {
    // el webhook «Lanzar desde la app» vive en el mismo flujo: siempre se vuelve a activar
    await api("POST", `/workflows/${RADAR_ID}/activate`);
  }
  return true;
}
