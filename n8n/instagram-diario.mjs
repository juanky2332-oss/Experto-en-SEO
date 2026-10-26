// INSTAGRAM DIARIO (panel Experto SEO): reloj de lunes a viernes que llama al panel.
//   13:00 → /api/cron/instagram            (reel del plan, responder comentarios, informe)
//   19:00 → /api/cron/instagram?fase=tarde (lista al móvil de lo que el PC no haya hecho)
// Usa la credencial «SEO Pasarela» (cabecera X-Seo-Key), así que aquí no hay ninguna clave.
//   node n8n/instagram-diario.mjs s94sCQwlpBRkImVX   (sin id crea otro)
import { Flow, CRED, APP_URL, n8n } from './lib.mjs';

const ID = process.argv[2] || null;
const f = new Flow('INSTAGRAM DIARIO (panel Experto SEO)');
const reloj = (hora) => ({ rule: { interval: [{ field: 'cronExpression', expression: `0 ${hora} * * 1-5` }] } });
const llamar = (fase) => ({
  method: 'GET', url: `${APP_URL}/api/cron/instagram${fase ? '?fase=' + fase : ''}`,
  authentication: 'genericCredentialType', genericAuthType: 'httpHeaderAuth',
  options: { timeout: 300000, response: { response: { neverError: true } } },
});
f.add('13:00 L-V', 'n8n-nodes-base.scheduleTrigger', 1.2, reloj(13), [0, 0]);
f.add('Mediodia', 'n8n-nodes-base.httpRequest', 4.2, llamar(''), [240, 0], { credentials: CRED.gateway });
f.add('19:00 L-V', 'n8n-nodes-base.scheduleTrigger', 1.2, reloj(19), [0, 220]);
f.add('Tarde', 'n8n-nodes-base.httpRequest', 4.2, llamar('tarde'), [240, 220], { credentials: CRED.gateway });
f.link('13:00 L-V', 'Mediodia');
f.link('19:00 L-V', 'Tarde');

const r = await n8n.upsert(f.json({ timezone: 'Europe/Madrid' }), ID);
await n8n.activate(r.id);
console.log('INSTAGRAM DIARIO ->', r.id);
