import { n8n } from './lib.mjs';
const [wf, n] = [process.argv[2], +(process.argv[3] || 1)];
const l = await n8n.get(`/executions?workflowId=${wf}&limit=${n}&includeData=true`);
for (const e of l.data) {
  console.log('== exec', e.id, e.status, e.startedAt);
  const rd = e.data?.resultData; if (!rd) continue;
  if (rd.error) console.log('ERROR:', rd.error.message, '| node:', rd.error.node?.name, '|', (rd.error.description||'').slice(0,300));
  for (const [name, runs] of Object.entries(rd.runData || {})) {
    const r = runs[runs.length - 1];
    const out = r.data?.main?.map(o => (o || []).length).join('/');
    console.log(' -', name, r.executionStatus || '', 'items:', out, r.error ? 'ERR: ' + r.error.message.slice(0, 300) : '');
  }
}
