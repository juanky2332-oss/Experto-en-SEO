// Copia de seguridad previa al rediseño de la web (2026-10-08).
import fs from 'node:fs';
import { wp } from './gw.mjs';
const D = '_backups/web-2026-10-08/';
const save = (n, d) => fs.writeFileSync(D + n, JSON.stringify(d, null, 1));
const pages = await wp('GET', '/wp/v2/pages?per_page=100&status=publish,draft,private&context=edit');
save('pages.json', pages.data); console.log('pages', pages.status, pages.data.length);
for (const p of pages.data) { const m = await wp('GET', `/wp/v2/pages/${p.id}?context=edit`); save(`page-${p.id}-meta.json`, m.data.meta ?? {}); }
const sn = await wp('GET', 'code-snippets/v1/snippets'); save('snippets.json', sn.data); console.log('snippets', sn.status, sn.data.map(s => `${s.id}:${s.active ? 'on' : 'off'}:${s.name}`).join(' | '));
const us = await wp('GET', '/wp/v2/users?context=edit&per_page=100'); save('users.json', us.data); console.log('users', us.data.map(u => `${u.id}:${u.slug}:${u.name}:${u.roles}`).join(' | '));
const st = await wp('GET', '/wp/v2/settings'); save('settings.json', st.data);
const mn = await wp('GET', '/wp/v2/menus?context=edit'); save('menus.json', mn.data); console.log('menus', mn.status, JSON.stringify(mn.data).slice(0, 400));
const ml = await wp('GET', '/wp/v2/menu-locations'); save('menu-locations.json', ml.data); console.log('locations', mn.status, JSON.stringify(ml.data).slice(0, 600));
