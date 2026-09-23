// SEO PASARELA — n8n guarda las credenciales de WordPress y Telegram; la app
// Experto en SEO le habla por webhook (cabecera X-Seo-Key) para leer/escribir
// en transformaconia.com y avisar por Telegram. Así la app nunca ve esas claves.
//
// POST /webhook/seo-pasarela
//   { action:'wp', method, path, body? }          -> { status, total, totalPages, data }
//   { action:'media', filename, mime, base64 }    -> { status, data }
//   { action:"tg", text, buttons?:[{text,data}] (0-2) } -> { ok }
//   { action:'openai', endpoint:'responses'|'images/generations', body } -> respuesta de OpenAI (credencial de n8n)
import { Flow, CRED, CHAT_ID, WP, n8n } from './lib.mjs';

const ID = process.argv[2] || null;
const f = new Flow('SEO PASARELA (app Experto en SEO)');

f.add('Webhook app', 'n8n-nodes-base.webhook', 2, {
  httpMethod: 'POST', path: 'seo-pasarela', authentication: 'headerAuth', responseMode: 'responseNode', options: {},
}, [0, 300], { webhookId: 'seo-pasarela', credentials: CRED.gateway });

f.add('Que accion', 'n8n-nodes-base.switch', 3.2, {
  rules: { values: ['wp', 'media', 'tg', 'openai'].map((a) => ({
    conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
      conditions: [{ leftValue: '={{ $json.body.action }}', rightValue: a, operator: { type: 'string', operation: 'equals' } }] },
    renameOutput: true, outputKey: a,
  })) },
  options: { fallbackOutput: 'extra' },
}, [220, 300]);

// ---------- WordPress REST ----------
f.add('Lleva cuerpo', 'n8n-nodes-base.if', 2.2, {
  conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
    conditions: [{ leftValue: '={{ ["POST","PUT","PATCH"].includes(($json.body.method || "GET").toUpperCase()) }}', rightValue: true, operator: { type: 'boolean', operation: 'true', singleValue: true } }] },
  options: {},
}, [440, 100]);

const wpOpts = { timeout: 90000, response: { response: { fullResponse: true, neverError: true } } };
f.add('WP escribir', 'n8n-nodes-base.httpRequest', 4.2, {
  method: '={{ ($json.body.method || "POST").toUpperCase() }}',
  url: `={{ "${WP}/wp-json/" + String($json.body.path).replace(/^\\//, "") }}`,
  authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.body.body || {}) }}',
  options: wpOpts,
}, [660, 0], { credentials: CRED.wp });
f.add('WP leer', 'n8n-nodes-base.httpRequest', 4.2, {
  method: '={{ ($json.body.method || "GET").toUpperCase() }}',
  url: `={{ "${WP}/wp-json/" + String($json.body.path).replace(/^\\//, "") }}`,
  authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  options: wpOpts,
}, [660, 200], { credentials: CRED.wp });

const respondWp = {
  respondWith: 'json',
  responseBody: '={{ JSON.stringify({ status: $json.statusCode, total: ($json.headers || {})["x-wp-total"] || null, totalPages: ($json.headers || {})["x-wp-totalpages"] || null, data: $json.body }) }}',
  options: {},
};
f.add('Responder WP', 'n8n-nodes-base.respondToWebhook', 1.1, respondWp, [880, 100]);

// ---------- Subida de medios (base64 -> binario -> /wp/v2/media) ----------
f.add('Base64 a archivo', 'n8n-nodes-base.convertToFile', 1.1, {
  operation: 'toBinary', sourceProperty: 'body.base64', binaryPropertyName: 'data',
  options: { fileName: '={{ $json.body.filename }}', mimeType: '={{ $json.body.mime || "image/webp" }}' },
}, [440, 400]);
f.add('WP subir medio', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: `${WP}/wp-json/wp/v2/media`,
  authentication: 'genericCredentialType', genericAuthType: 'httpBasicAuth',
  sendHeaders: true, headerParameters: { parameters: [
    { name: 'Content-Disposition', value: '=attachment; filename="{{ $(\'Webhook app\').item.json.body.filename }}"' },
    { name: 'Content-Type', value: '={{ $(\'Webhook app\').item.json.body.mime || "image/webp" }}' },
  ] },
  sendBody: true, contentType: 'binaryData', inputDataFieldName: 'data',
  options: wpOpts,
}, [660, 400], { credentials: CRED.wp });
f.add('Responder medio', 'n8n-nodes-base.respondToWebhook', 1.1, respondWp, [880, 400]);

// ---------- Telegram ----------
f.add('Cuantos botones', 'n8n-nodes-base.code', 2, { jsCode: `
const b = $json.body || {};
const botones = Array.isArray(b.buttons) ? b.buttons.slice(0, 2) : [];
let texto = String(b.text || '').slice(0, 4000);
return [{ json: { texto, botones, n: botones.length } }];` }, [440, 650]);
f.add('Segun botones', 'n8n-nodes-base.switch', 3.2, {
  rules: { values: [0, 1, 2].map((n) => ({
    conditions: { options: { caseSensitive: true, typeValidation: 'loose', version: 2 }, combinator: 'and',
      conditions: [{ leftValue: '={{ $json.n }}', rightValue: n, operator: { type: 'number', operation: 'equals' } }] },
    renameOutput: true, outputKey: `b${n}`,
  })) },
  options: {},
}, [660, 650]);

const tgBase = { chatId: CHAT_ID, text: '={{ $json.texto }}', additionalFields: { appendAttribution: false, parse_mode: 'HTML', disable_web_page_preview: true } };
const btn = (i) => ({
  text: `={{ $json.botones[${i}].text }}`,
  additionalFields: { callback_data: `={{ $json.botones[${i}].data }}` },
});
f.add('TG sin botones', 'n8n-nodes-base.telegram', 1.2, tgBase, [880, 550], { credentials: CRED.telegram, onError: 'continueRegularOutput' });
f.add('TG 1 boton', 'n8n-nodes-base.telegram', 1.2, { ...tgBase, replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [btn(0)] } }] } }, [880, 650], { credentials: CRED.telegram, onError: 'continueRegularOutput' });
f.add('TG 2 botones', 'n8n-nodes-base.telegram', 1.2, { ...tgBase, replyMarkup: 'inlineKeyboard', inlineKeyboard: { rows: [{ row: { buttons: [btn(0), btn(1)] } }] } }, [880, 750], { credentials: CRED.telegram, onError: 'continueRegularOutput' });
f.add('Responder TG', 'n8n-nodes-base.respondToWebhook', 1.1, {
  respondWith: 'json', responseBody: '={{ JSON.stringify({ ok: !$json.error, message_id: ($json.result || {}).message_id || null, error: $json.error ? String($json.error.message || $json.error) : null }) }}', options: {},
}, [1100, 650]);

f.add('OpenAI', 'n8n-nodes-base.httpRequest', 4.2, {
  method: 'POST', url: '={{ "https://api.openai.com/v1/" + ($json.body.endpoint === "images/generations" ? "images/generations" : "responses") }}',
  authentication: 'predefinedCredentialType', nodeCredentialType: 'openAiApi',
  sendBody: true, specifyBody: 'json', jsonBody: '={{ JSON.stringify($json.body.body || {}) }}',
  options: { timeout: 600000, response: { response: { fullResponse: true, neverError: true } } },
}, [440, 1000], { credentials: CRED.openai });
f.add('Responder OpenAI', 'n8n-nodes-base.respondToWebhook', 1.1, {
  respondWith: 'json', responseBody: '={{ JSON.stringify({ status: $json.statusCode, data: $json.body }) }}', options: {},
}, [660, 1000]);
f.add('Accion desconocida', 'n8n-nodes-base.respondToWebhook', 1.1, {
  respondWith: 'json', responseBody: '={{ JSON.stringify({ error: "accion desconocida: " + $json.body.action }) }}', options: { responseCode: 400 },
}, [440, 850]);

f.link('Webhook app', 'Que accion');
f.link('Que accion', 'Lleva cuerpo', 0);
f.link('Que accion', 'Base64 a archivo', 1);
f.link('Que accion', 'Cuantos botones', 2);
f.link('Que accion', 'OpenAI', 3);
f.link('Que accion', 'Accion desconocida', 4);
f.chain('OpenAI', 'Responder OpenAI');
f.link('Lleva cuerpo', 'WP escribir', 0);
f.link('Lleva cuerpo', 'WP leer', 1);
f.link('WP escribir', 'Responder WP');
f.link('WP leer', 'Responder WP');
f.chain('Base64 a archivo', 'WP subir medio', 'Responder medio');
f.link('Cuantos botones', 'Segun botones');
f.link('Segun botones', 'TG sin botones', 0);
f.link('Segun botones', 'TG 1 boton', 1);
f.link('Segun botones', 'TG 2 botones', 2);
for (const n of ['TG sin botones', 'TG 1 boton', 'TG 2 botones']) f.link(n, 'Responder TG');

const r = await n8n.upsert(f.json(), ID);
await n8n.activate(r.id);
console.log('SEO PASARELA ->', r.id);
