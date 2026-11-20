// 20-11-2026 · CANTERA: empresas nuevas de la Región de Murcia que pueden ser clientes (él: «haz un scrapeo para ver
// por otro lado empresas que puedan tener Instagram, que nos vengan bien seguir y que son propensas a ser futuros
// clientes»). SIN tocar Instagram: la IA busca en la web (búsqueda oficial de OpenAI) empresas reales por oficio con
// web propia; cada web nueva entra en el Radar (/api/analyze), que le busca el Instagram EN SU PROPIA WEB y lo verifica.
// Luego `ig-grupos.mjs` las puntúa y las reparte en los grupos de cada día.
// Uso: node --env-file=.env.local n8n/ig-cantera.mjs [--solo-buscar] [--max=N]
import fs from 'node:fs';

const MODELO = process.env.OPENAI_MODEL ?? 'gpt-5.5';
const SALIDA = 'n8n/ig-cantera-resultado.json';
// Oficios que son nuestro cliente (ERP, documentos, presupuestos, automatización) → sector del Radar
const OFICIOS = [
  ['calderería y estructuras metálicas', 'Industria y metal'],
  ['mecanizado CNC y tornería', 'Industria y metal'],
  ['carpintería metálica y cerrajería industrial', 'Industria y metal'],
  ['soldadura y montajes industriales', 'Industria y metal'],
  ['mantenimiento industrial', 'Industria y metal'],
  ['fabricación de maquinaria', 'Maquinaria y herramienta'],
  ['reparación de maquinaria agrícola e industrial', 'Maquinaria y herramienta'],
  ['hidráulica y neumática industrial', 'Maquinaria y herramienta'],
  ['suministros industriales y ferretería industrial', 'Ferretería'],
  ['instalaciones eléctricas industriales', 'Electricidad y fontanería'],
  ['climatización, frío industrial y fontanería para empresas', 'Electricidad y fontanería'],
  ['carpintería de aluminio y PVC', 'Construcción y materiales'],
  ['talleres de vehículo industrial y camión', 'Taller y automoción'],
  ['fabricación de envases y embalaje', 'Industria y metal'],
];
const ZONAS = 'Murcia, Cartagena, Lorca, Molina de Segura, Alcantarilla, Totana, Alhama de Murcia, Cieza, Yecla, Jumilla, Caravaca, Águilas, Mazarrón, San Javier, Torre-Pacheco, Las Torres de Cotillas, Santomera y sus polígonos';

const ESQUEMA = { type: 'object', additionalProperties: false, required: ['empresas'], properties: { empresas: { type: 'array', items: {
  type: 'object', additionalProperties: false, required: ['nombre', 'web', 'municipio', 'instagram', 'fuente'],
  properties: { nombre: { type: 'string' }, web: { type: 'string', description: 'dominio de su web propia (no directorios ni redes)' }, municipio: { type: 'string' },
    instagram: { type: ['string', 'null'], description: 'usuario de Instagram SOLO si lo has visto enlazado en su web o en una fuente fiable; si no, null' }, fuente: { type: 'string', description: 'URL donde lo has comprobado' } } } } } };

async function buscar(oficio) {
  const r = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODELO, reasoning: { effort: 'low' }, max_output_tokens: 6000,
      tools: [{ type: 'web_search', search_context_size: 'medium', user_location: { type: 'approximate', country: 'ES', region: 'Murcia' } }],
      instructions: 'Buscas empresas REALES para una lista de clientes potenciales. Solo empresas de la Región de Murcia (España), pequeñas o medianas, con web propia. Nada de grandes multinacionales, directorios, portales, franquicias ni empresas cerradas. No inventes nada: si no lo has visto en internet, no lo pongas.',
      input: `Lista hasta 15 empresas de ${oficio} en la Región de Murcia (${ZONAS}). Para cada una: nombre, dominio de su web propia, municipio, su usuario de Instagram solo si aparece enlazado en su web o en una fuente fiable (si no, null) y la URL donde lo has comprobado.`,
      text: { format: { type: 'json_schema', name: 'empresas', strict: true, schema: ESQUEMA } },
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${j.error?.message ?? ''}`);
  const t = j.output_text ?? (j.output ?? []).flatMap((o) => o.content ?? []).filter((c) => c.type === 'output_text').map((c) => c.text).join('');
  return JSON.parse(t).empresas;
}

const dominio = (w) => { try { return new URL(/^https?:/.test(w) ? w : `https://${w}`).hostname.replace(/^www\./, '').toLowerCase(); } catch { return ''; } };
const NO = /facebook|instagram|linkedin|paginasamarillas|infoisinfo|empresite|einforma|axesor|google|youtube|twitter|tiktok|wikipedia|cylex|habitissimo|milanuncios|europages|kompass|qdq|guiaempresa/;

const args = process.argv.slice(2);
const max = Number((args.find((a) => a.startsWith('--max=')) ?? '').split('=')[1]) || 400;
let res = fs.existsSync(SALIDA) ? JSON.parse(fs.readFileSync(SALIDA, 'utf8')) : { empresas: {}, oficiosHechos: [] };

// 1) buscar por oficio (se guarda tras cada uno: si se corta, sigue por donde iba)
for (const [oficio, sector] of OFICIOS) {
  if (res.oficiosHechos.includes(oficio)) continue;
  try {
    const l = await buscar(oficio);
    let nuevas = 0;
    for (const e of l) {
      const d = dominio(e.web);
      if (!d || NO.test(d) || res.empresas[d]) continue;
      res.empresas[d] = { ...e, dominio: d, sector, oficio, estado: 'encontrada' };
      nuevas++;
    }
    res.oficiosHechos.push(oficio);
    console.log(`${oficio}: ${l.length} encontradas, ${nuevas} nuevas`);
  } catch (e) { console.log(`${oficio}: ERROR ${e.message}`); }
  fs.writeFileSync(SALIDA, JSON.stringify(res, null, 1));
}
if (args.includes('--solo-buscar')) process.exit(0);

// 2) meterlas en el Radar (análisis + Instagram buscado en su propia web)
const H = { 'x-ig-key': process.env.RADAR_IG_KEY, 'content-type': 'application/json' };
const post = async (p, b) => { try { const r = await fetch(process.env.RADAR_URL + p, { method: 'POST', headers: H, body: JSON.stringify(b), signal: AbortSignal.timeout(300_000) }); return r.ok ? r.json() : { error: r.status }; } catch (e) { return { error: e.message }; } };
let hechas = 0;
for (const e of Object.values(res.empresas)) {
  if (e.estado !== 'encontrada' || hechas >= max) continue;
  hechas++;
  const ficha = { lista: 'Cantera Región de Murcia', nombre: e.nombre.slice(0, 120), ciudad: e.municipio.slice(0, 60), provincia: 'Murcia' };
  const a = await post('/api/analyze', { domain: e.dominio, ficha, sector: e.sector });
  if (a.error || !a.record) { e.estado = 'error'; e.error = String(a.error); }
  else {
    let ig = a.record.instagram;
    if (!ig?.handle) ig = (await post('/api/instagram', { domain: a.record.domain })).instagram;
    e.estado = 'en_radar'; e.duplicada = Boolean(a.duplicate);
    e.igRadar = ig?.handle ?? null; e.igEstado = ig?.status ?? null;
  }
  fs.writeFileSync(SALIDA, JSON.stringify(res, null, 1));
  console.log(`${hechas}. ${e.dominio} → ${e.estado}${e.igRadar ? ` · @${e.igRadar} (${e.igEstado})` : ''}`);
}
const v = Object.values(res.empresas);
console.log(`\nTOTAL: ${v.length} empresas · en el Radar ${v.filter((x) => x.estado === 'en_radar').length} · con Instagram fiable ${v.filter((x) => ['verificado', 'oficial'].includes(x.igEstado)).length}`);
