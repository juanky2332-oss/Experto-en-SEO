// Muestra la última ejecución de un flujo: node --env-file=.env.local n8n/_ultima.mjs <workflowId>
const r = await fetch(process.env.N8N_API_URL + `/executions?workflowId=${process.argv[2]}&limit=1&includeData=true`, { headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY } });
for (const e of (await r.json()).data) {
  console.log(e.id, e.status, e.finished);
  const rd = e.data.resultData.runData;
  for (const k in rd) { const r0 = rd[k][0]; console.log('  ', k, r0.executionStatus || '', (r0.data?.main?.[0] || []).length + ' items', JSON.stringify(r0.error?.message || '').slice(0, 300)); }
}
