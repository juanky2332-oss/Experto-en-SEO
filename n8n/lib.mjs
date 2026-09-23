// Utilidades para construir y desplegar los flujos de n8n desde código.
// Lee N8N_API_URL y N8N_API_KEY de ../.env.local (nunca se suben al repo).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const envFile = path.join(dir, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

// ---- IDs de credenciales en n8n (no son secretos) ----
export const CRED = {
  telegram: { telegramApi: { id: 'pvhJbmNAGHfoJfpw', name: 'Pruebas n8n' } },
  wp: { httpBasicAuth: { id: 'axfNH3vHTVJVQpRH', name: 'publicar transformaconia.com' } },
  openai: { openAiApi: { id: 'PKO0JcWCfqExbo7X', name: 'Agente n8n prueba' } },
  pg: { postgres: { id: 'KHmCHpGN6WZkuMZQ', name: 'SEO Transformaconia (Postgres esquema seo)' } },
  gateway: { httpHeaderAuth: { id: 'r0oxvQOpLoBFtNXQ', name: 'SEO Pasarela (clave app Experto SEO)' } },
};

export const CHAT_ID = '8765904';
export const WP = 'https://transformaconia.com';
export const APP_URL = process.env.APP_URL || 'https://experto-en-seo.vercel.app';

const uid = (name) => crypto.createHash('md5').update(name).digest('hex').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*$/, '$1-$2-$3-$4-$5');

export class Flow {
  constructor(name) { this.name = name; this.nodes = []; this.connections = {}; }
  add(name, type, typeVersion, parameters, pos, extra = {}) {
    const node = { id: uid(this.name + '/' + name), name, type, typeVersion, position: pos, parameters, ...extra };
    this.nodes.push(node);
    return name;
  }
  // conecta salida `out` de `from` a la entrada `inp` de `to`
  link(from, to, out = 0, inp = 0, kind = 'main') {
    const c = (this.connections[from] ||= {});
    const arr = (c[kind] ||= []);
    while (arr.length <= out) arr.push([]);
    arr[out].push({ node: to, type: kind, index: inp });
  }
  chain(...names) { for (let i = 0; i < names.length - 1; i++) this.link(names[i], names[i + 1]); }
  json(settings = {}) {
    return { name: this.name, nodes: this.nodes, connections: this.connections, settings: { executionOrder: 'v1', ...settings } };
  }
}

// ---- Nodos frecuentes ----
export const code = (js, mode) => ({ jsCode: js, ...(mode ? { mode } : {}) });

// Petición a /v1/responses: el Code node anterior deja el cuerpo en $json.req
export const OPENAI_HTTP = {
  method: 'POST',
  url: 'https://api.openai.com/v1/responses',
  authentication: 'predefinedCredentialType',
  nodeCredentialType: 'openAiApi',
  sendBody: true,
  specifyBody: 'json',
  jsonBody: '={{ JSON.stringify($json.req) }}',
  options: { timeout: 600000 },
};
// JS (para pegar dentro de un Code node) que construye req a partir de las variables sistema y usuario
export function reqJs({ model = 'gpt-5.5', effort = 'low', schemaName, schema, tools, maxTokens = 16000 }) {
  return `const req = { model: ${JSON.stringify(model)}, reasoning: { effort: ${JSON.stringify(effort)} }, max_output_tokens: ${maxTokens},${tools ? ' tools: ' + JSON.stringify(tools) + ',' : ''}
  instructions: sistema, input: usuario,
  text: { format: { type: 'json_schema', name: ${JSON.stringify(schemaName)}, strict: true, schema: ${JSON.stringify(schema)} } } };`;
}

// Comprueba que ninguna expresión n8n lleve '}}' dentro (rompe el parser)
export function checkExpr(wf) {
  const bad = [];
  const walk = (v, where) => {
    if (typeof v === 'string' && v.startsWith('=')) {
      const a = (v.match(/{{/g) || []).length, b = (v.match(/}}/g) || []).length;
      if (a !== b) bad.push(where + ' ({{:' + a + ' }}:' + b + ')');
    } else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, where + '.' + k);
  };
  for (const n of wf.nodes) walk(n.parameters, n.name);
  if (bad.length) throw new Error('Expresiones desequilibradas:\n' + bad.join('\n'));
}

// Código JS para sacar el JSON de una respuesta de /v1/responses
export const PARSE_RESPONSES = `
function leerRespuesta(r) {
  if (!r) throw new Error('Respuesta vacía de OpenAI');
  if (r.error && r.error.message) throw new Error('OpenAI: ' + r.error.message);
  let txt = r.output_text || '';
  if (!txt && Array.isArray(r.output)) {
    for (const o of r.output) {
      if (o.type === 'message' && Array.isArray(o.content)) {
        for (const c of o.content) if (c.type === 'output_text' && c.text) txt += c.text;
      }
    }
  }
  if (!txt) throw new Error('OpenAI no devolvió texto (estado: ' + (r.status || '?') + ', motivo: ' + JSON.stringify(r.incomplete_details || '') + ')');
  try { return JSON.parse(txt); } catch (e) {
    const m = txt.match(/\\{[\\s\\S]*\\}/); if (m) return JSON.parse(m[0]);
    throw new Error('JSON inválido de OpenAI: ' + txt.slice(0, 200));
  }
}
function fuentesWeb(r) {
  const out = [];
  for (const o of (r && r.output) || []) {
    if (o.type === 'message') for (const c of o.content || []) for (const a of c.annotations || []) {
      if (a.type === 'url_citation' && a.url) out.push({ url: a.url, titulo: a.title || '' });
    }
  }
  return out;
}
`;

// ---- API de n8n ----
async function api(method, p, body) {
  const r = await fetch(process.env.N8N_API_URL + p, {
    method,
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status}: ${t.slice(0, 800)}`);
  return j;
}
export const n8n = {
  get: (p) => api('GET', p),
  async upsert(wf, id) {
    if (id) {
      try { await api('POST', `/workflows/${id}/deactivate`); } catch {}
      const r = await api('PUT', `/workflows/${id}`, wf);
      return r;
    }
    return api('POST', '/workflows', wf);
  },
  activate: (id) => api('POST', `/workflows/${id}/activate`),
  deactivate: (id) => api('POST', `/workflows/${id}/deactivate`),
  del: (id) => api('DELETE', `/workflows/${id}`),
};
