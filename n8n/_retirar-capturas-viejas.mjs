// Borra del WordPress las capturas antiguas que mostraban nombres de empresa que podían ser reales
import { wp } from './gw.mjs';
const viejas = ['programa-gestion-ia-facturas', 'caso-ia-cobros', 'caso-ia-veterinaria'];
const borrar = process.argv.includes('--borrar');
for (const v of viejas) {
  const m = (await wp('GET', `/wp/v2/media?search=${v}&_fields=id,source_url`)).data || [];
  for (const x of m.filter((x) => x.source_url.includes(v + '.') || x.source_url.includes(v + '-'))) {
    const usos = [];
    for (const t of ['posts', 'pages']) {
      const r = (await wp('GET', `/wp/v2/${t}?search=${encodeURIComponent(v)}&status=publish,draft&_fields=id,link&per_page=50`)).data || [];
      usos.push(...r.map((y) => y.link));
    }
    console.log(x.id, x.source_url, 'usos:', usos.length, usos.slice(0, 3).join(' '));
    if (borrar && !usos.length) console.log('  borrada', (await wp('DELETE', `/wp/v2/media/${x.id}?force=true`)).status);
  }
}
