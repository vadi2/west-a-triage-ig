(() => { const s = document.currentScript; if (s && !document.getElementById('cv-css')) {
  const l = document.createElement('link'); l.id = 'cv-css'; l.rel = 'stylesheet'; l.href = s.src.replace(/[^/]*$/, 'app.css');
  document.head.appendChild(l); } })();
{
const DATA = window.CV_DATA;
const MODELS = DATA.models;
const ROOT = document.querySelector('.cv');
const MODE = (ROOT && ROOT.dataset.cv) || 'standalone';
const IG = MODE === 'standalone' ? DATA.meta.igUrl : '';
const TGT = MODE === 'standalone' ? ' target="_blank" rel="noopener"' : '';
const TYPES = {
  text: ['T', 'Text'], coded: ['≡', 'Coded text (chosen from a list)'], quantity: ['Q', 'Quantity with unit'], count: ['#', 'Count'], decimal: ['#', 'Number'], ratio: ['½', 'Ratio'],
  date: ['D', 'Date'], datetime: ['DT', 'Date and time'], time: ['⏲', 'Time'], period: ['↔', 'Period (from - to)'],
  id: ['ID', 'Identifier'], bool: ['✓', 'Yes / no'], link: ['→', 'Link to another record'], group: ['▤', 'Group of elements']
};

// ---------- helpers ----------
const dateInput = (id, v, label, time) => {
  const lab = label ? ` aria-label="${esc(label)}"` : '';
  if (time === false && /^\d{4}-\d\d-\d\d[T ]/.test(v)) v = v.slice(0, 10);
  if (!v && time) return `<input id="${id}" type="datetime-local"${lab}>`;
  if (!v || /^\d{4}-\d\d-\d\d$/.test(v)) return `<input id="${id}" type="date" value="${esc(v || '')}"${lab}>`;
  if (/^\d{4}-\d\d-\d\d[T ]\d\d:\d\d/.test(v)) return `<input id="${id}" type="datetime-local" value="${esc(v.slice(0, 16).replace(' ', 'T'))}"${lab}>`;
  return `<input id="${id}" type="text" class="unit" placeholder="yyyy-mm-dd" value="${esc(v)}"${lab}>`;
};
const bindingLead = v => {
  const lead = STRENGTH[v.strength] || ADDITIONAL[v.strength] || 'Also from';
  const low = lead.charAt(0).toLowerCase() + lead.slice(1);
  return v.when ? `When ${v.when}, ${low}` : v.on ? `${v.on} ${low}` : lead;
};
const ADDITIONAL = { maximum: 'Never outside', minimum: 'Must at least support', current: 'New records from', ui: 'Offered to users from', starter: 'Commonly from', component: 'Partly from' };
const STRENGTH = { required: 'Must be from', extensible: 'From this list where it has a fitting code', preferred: 'Preferably from', example: 'For example from' };
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = t => `<span class="ti ${t}" title="${esc(TYPES[t][1])}" aria-label="${esc(TYPES[t][1])}">${TYPES[t][0]}</span>`;
function occ(card) {
  if (!card) return { mand: false, rep: false };
  const [min, max] = card.split('..');
  return { mand: min !== '0', rep: max === '*' || +max > 1 };
}
function tags(n, withRef = true) {
  if (!n.card) return '<span class="chip opt">Grouping for readability</span>';
  const o = occ(n.card);
  let h = o.mand ? `<span class="chip mand">Mandatory</span>` : `<span class="chip opt">Optional</span>`;
  if (o.rep) h += `<span class="chip rep">Repeats</span>`;
  if (n.ms) h += `<span class="chip ms" title="Systems must be able to send and receive this">Must support</span>`;
  if (withRef && n.type === 'link') h += `<span class="chip ref">${esc(n.target)}</span>`;
  return h;
}
function walk(n, fn, depth = 0, parent = null) { fn(n, depth, parent); (n.children || []).forEach(c => walk(c, fn, depth + 1, n)); }

let state = { model: (ROOT && ROOT.dataset.cvModel) || MODELS[0].id, view: MODE === 'profile' ? 'data' : 'overview', paths: false, example: false, step: 0 };
try { const s = JSON.parse(localStorage.getItem('clinical-views') || '{}'); if (typeof s.paths === 'boolean') state.paths = s.paths; } catch (e) {}
function save() { try { localStorage.setItem('clinical-views', JSON.stringify({ paths: state.paths })); } catch (e) {} }

const VIEWS = Object.fromEntries(MODELS.map(m => [m.id, [...(MODE === 'profile' ? [] : ['overview']), 'data', 'mindmap', 'form', ...(m.steps ? ['exchange'] : [])]]));
const VIEW_NAMES = { overview: 'Overview', data: 'Data', mindmap: 'Mind map', form: 'Form preview', exchange: 'Exchange' };

function readHash() {
  if (MODE === 'profile') return;
  let h = location.hash.slice(1);
  try { if (MODELS.some(x => x.id === decodeURIComponent(h))) h += '-overview'; } catch (e) { return; }
  const i = h.lastIndexOf('-');
  let m = i < 0 ? h : h.slice(0, i), v = i < 0 ? '' : h.slice(i + 1);
  try { m = decodeURIComponent(m); } catch (e) { return; }
  if (MODELS.some(x => x.id === m)) state.model = m;
  if (v && VIEWS[state.model].includes(v)) state.view = v; else if (m) state.view = VIEWS[state.model][0];
}
function writeHash() { if (MODE === 'profile') return; const h = '#' + encodeURIComponent(state.model) + '-' + state.view; if (location.hash !== h) history.replaceState(null, '', h); }

// ---------- render shell ----------
function render() {
  const m = MODELS.find(x => x.id === state.model);
  const tabs = MODELS.filter(x => x.featured), rest = MODELS.filter(x => !x.featured);
  const byType = {}; rest.forEach(x => (byType[x.sub] = byType[x.sub] || []).push(x));
  document.getElementById('models').innerHTML = tabs.map(x =>
    `<button role="tab" id="tab-${x.id}" aria-selected="${x.id === m.id}" data-model="${x.id}">${esc(x.title)} <small>${esc(x.sub)}</small></button>`).join('') +
    (rest.length ? `<label class="pick${m.featured ? '' : ' on'}"><span>${tabs.length ? 'Other profiles' : 'Profile'}</span><select id="pick" aria-label="Profile">
      ${m.featured ? '<option value="">Choose a profile</option>' : ''}
      ${Object.keys(byType).sort().map(t => `<optgroup label="${esc(t)}">${byType[t].map(x =>
        `<option value="${esc(x.id)}"${x.id === m.id ? ' selected' : ''}>${esc(x.title)}</option>`).join('')}</optgroup>`).join('')}
    </select></label>` : '');
  const kind = m.kind === 'use-case' ? 'Use case - combines several profiles' : 'Profile';
  document.getElementById('titlebar').innerHTML =
    `<h2><span class="ti group" style="width:26px;height:22px;font-size:12px">${esc(m.icon)}</span>${esc(m.title)}</h2>
     <span class="meta">${kind} · ${esc(m.resource)}</span>
     <span class="status">${esc(cap(m.status))}${m.experimental ? ' · experimental' : ''}</span>`;
  document.getElementById('views').innerHTML = VIEWS[m.id].map(v =>
    `<button role="tab" aria-selected="${v === state.view}" data-view="${v}">${VIEW_NAMES[v]}</button>`).join('') +
    (MODE === 'profile' ? `<a class="all" href="clinical-views.html#${encodeURIComponent(m.id)}">All clinical views</a>` : '');
  const pane = document.getElementById('pane');
  ({ overview: renderOverview, data: renderData, mindmap: renderMindmap, form: renderForm, exchange: renderExchange })[state.view](pane, m);
  writeHash();
}

document.getElementById('models').addEventListener('click', e => {
  const b = e.target.closest('button[data-model]'); if (!b) return;
  state.model = b.dataset.model; if (!VIEWS[state.model].includes(state.view)) state.view = VIEWS[state.model][0]; render();
});
document.getElementById('models').addEventListener('change', e => {
  if (e.target.id !== 'pick' || !e.target.value) return;
  state.model = e.target.value; if (!VIEWS[state.model].includes(state.view)) state.view = VIEWS[state.model][0]; render();
});
document.getElementById('views').addEventListener('click', e => {
  const b = e.target.closest('button[data-view]'); if (!b) return;
  state.view = b.dataset.view; render();
});
if (MODE !== 'profile') window.addEventListener('hashchange', () => { readHash(); render(); });

// ---------- overview ----------
function renderOverview(pane, m) {
  let total = 0, mand = 0, ms = 0;
  // an element is mandatory only when every element above it is too; a required group with no such part counts once
  const count = (n, req) => (n.children || []).reduce((any, c) => {
    const r = req && (!c.card || occ(c.card).mand), before = mand;
    if (!c.children || c.type === 'link') { total++; if (r && c.card) mand++; if (c.ms) ms++; }
    if (c.children && !count(c, r) && r && c.card && c.type !== 'link') mand++;
    return any || mand > before;
  }, false);
  count(m.root, true);
  const usesBlock = m.uses ? `<div><h3>Built from</h3><div class="uses v">${m.uses.map(([t, p]) => `<a href="${esc(IG + p)}"${TGT}>${icon('link')} ${esc(t)}</a>`).join('')}</div></div>` : '';
  pane.innerHTML = `<div class="ov">
    <dl>
      ${m.concept ? `<dt>Concept</dt><dd><p><b>${esc(m.concept)}</b></p></dd>` : ''}
      ${m.description ? `<dt>Description</dt><dd><p>${esc(m.description)}</p></dd>` : ''}
      ${m.purpose ? `<dt>Purpose</dt><dd><p>${esc(m.purpose)}</p></dd>` : ''}
      ${m.use && m.use.length ? `<dt>Use</dt><dd>${m.use.map(p => `<p>${esc(p)}</p>`).join('')}</dd>` : ''}
      ${m.misuse && m.misuse.length ? `<dt>Misuse</dt><dd>${m.misuse.map(p => `<p>${esc(p)}</p>`).join('')}</dd>` : ''}
      ${m.rules && m.rules.length ? `<dt>Rules</dt><dd>${m.rules.map(r => `<p>${esc(r)}</p>`).join('')}</dd>` : ''}
      ${m.keywords && m.keywords.length ? `<dt>Keywords</dt><dd><div class="kw">${m.keywords.map(k => `<span>${esc(k)}</span>`).join('')}</div></dd>` : ''}
    </dl>
    <aside class="side">
      <div class="counts"><div><b>${total}</b><span>data elements</span></div><div><b>${mand}</b><span>mandatory</span></div><div><b>${ms}</b><span>must support</span></div></div>
      <div><h3>FHIR resource</h3><div class="v">${esc(m.resource)}</div></div>
      ${m.base ? `<div><h3>Based on</h3><div class="v">${m.base.href ? `<a href="${esc(m.base.href)}" target="_blank" rel="noopener">${esc(m.base.title)}</a>` : esc(m.base.title)}</div></div>` : ''}
      <div><h3>Profile (version ${esc(m.version)})</h3><div class="v"><code>${esc(m.profile)}</code></div></div>
      <div><h3>Specification</h3><div class="v"><a href="${esc(IG + m.igPage)}"${TGT}>Open in the ${esc(DATA.meta.guideName)}</a></div></div>
      ${m.example ? `<div><h3>Example values from</h3><div class="v">${(m.examples || [[m.example, m.examplePage]]).map(([r, pg]) => pg ? `<a href="${esc(IG + pg + '.html')}"${TGT}>${esc(r)}</a>` : esc(r)).join('<br>')}</div></div>` : ''}
      <div><h3>Publisher</h3><div class="v">${esc(m.publisher)}</div></div>
      ${DATA.meta.languages.length ? `<div><h3>Languages</h3><div class="v">${esc(DATA.meta.languages.join(', '))}</div></div>` : ''}
      ${usesBlock}
      <div><h3>Data types</h3><div class="legend">${Object.keys(TYPES).map(t => `<div>${icon(t)} ${esc(TYPES[t][1])}</div>`).join('')}</div></div>
    </aside>
  </div>`;
}

// ---------- data table ----------
function consHtml(n) {
  let h = '';
  if (n.values && n.values.length) h += `<ul>${n.values.map(v => `<li>${esc(v)}</li>`).join('')}</ul>`;
  if (n.target) h += `<div>Refers to: ${esc(n.target)}</div>`;
  if (n.vs) [n.vs, ...(n.vs.also || [])].forEach(v => { h += `<div>${esc(bindingLead(v))}: ${v.page ? `<a href="${esc(IG + v.page)}"${TGT}>${esc(v.title)}</a>` : esc(v.title)}${v.note ? ` (${esc(v.note)})` : ''}</div>`; });
  if (n.ex) h += `<div class="ex">Example: <b>${esc(n.ex)}</b></div>`;
  return h;
}
function renderData(pane, m) {
  let rows = '';
  walk(m.root, (n, d) => {
    if (n === m.root) return;
    const path = state.paths && n.path ? `<div class="path">${esc(n.path)}</div>` : '';
    if (n.type === 'group' || (n.type === 'link' && n.children)) {
      rows += `<tr class="grp d${d > 1 ? 1 : 0}"><td colspan="3" style="padding-left:${12 + (d - 1) * 22}px">
        <div class="el"><div class="nm">${icon(n.type)}<span class="gname">${esc(n.label)}</span> <span style="font-weight:400">${tags(n)}</span></div>
        ${n.desc ? `<div class="typ" style="font-size:13px">${esc(n.desc)}</div>` : ''}${n.values ? `<div class="typ" style="font-size:13px">${n.values.map(esc).join(' · ')}</div>` : ''}${path}</div></td></tr>`;
      return;
    }
    rows += `<tr><td style="padding-left:${12 + (d - 1) * 22}px"><div class="el">
        <div class="nm">${icon(n.type)}${esc(n.label)}</div>
        <div class="typ">${esc(TYPES[n.type][1])}${n.typeText ? ` (${esc(n.typeText)})` : ''}</div>
        <div class="tags">${tags(n)}</div>${path}</div></td>
      <td><div class="desc">${esc(n.desc || '')}</div></td>
      <td><div class="cons">${consHtml(n)}</div></td></tr>`;
  });
  pane.innerHTML = `<div class="toolbar">
      <label><input type="checkbox" id="opt-paths" ${state.paths ? 'checked' : ''}> Show FHIR paths</label>
      <span class="sp"></span><span>Grey bars are groups, purple dashed items link to another record.</span></div>
    <div class="tbl-wrap"><table class="data"><thead><tr><th style="width:32%">Data element</th><th>Description</th><th style="width:28%">Allowed values</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  pane.querySelector('#opt-paths').onchange = e => { state.paths = e.target.checked; save(); renderData(pane, m); };
}

// ---------- mind map ----------
const mmCollapsed = {};
MODELS.forEach(m => walk(m.root, n => { if (n.collapsed) mmCollapsed[n.uid] = true; }));
const mmZoomBy = {}; let mmZoom = 1, mmSel = null;
const measureCtx = document.createElement('canvas').getContext('2d');
function textW(s, font) { measureCtx.font = font; return measureCtx.measureText(s).width; }

function renderMindmap(pane, m) {
  pane.innerHTML = `<div class="mm-tools">
      <button class="tbtn" id="mm-out" aria-label="Zoom out">−</button>
      <button class="tbtn" id="mm-in" aria-label="Zoom in">+</button>
      <button class="tbtn" id="mm-exp">Expand all</button>
      <button class="tbtn" id="mm-col">Collapse all</button></div>
    <div class="mm-box" id="mm-box"></div>
    <div class="mm-detail" id="mm-detail"><span class="muted">Select a data element to see what it holds.</span></div>`;
  const draw = () => drawMindmap(pane.querySelector('#mm-box'), m, pane.querySelector('#mm-detail'));
  const zoomTo = z => { mmZoomBy[m.id] = mmZoom = Math.max(.4, Math.min(1.8, z)); draw(); };
  pane.querySelector('#mm-in').onclick = () => zoomTo(mmZoom + .15);
  pane.querySelector('#mm-out').onclick = () => zoomTo(mmZoom - .15);
  pane.querySelector('#mm-exp').onclick = () => { walk(m.root, n => { delete mmCollapsed[n.uid]; }); draw(); };
  pane.querySelector('#mm-col').onclick = () => { m.root.children.forEach(c => { if (c.children) mmCollapsed[c.uid] = true; }); draw(); };
  const box = pane.querySelector('#mm-box');
  mmZoom = mmZoomBy[m.id] ?? 1;
  const size = draw();
  if (mmZoomBy[m.id] === undefined) zoomTo(Math.min(1, (box.clientWidth - 4) / size.W, (box.clientHeight - 4) / size.Ht));
  requestAnimationFrame(() => { box.scrollLeft = (box.scrollWidth - box.clientWidth) / 2; box.scrollTop = (box.scrollHeight - box.clientHeight) / 2; });
  if (mmSel) showDetail(pane.querySelector('#mm-detail'), findNode(m, mmSel));
}
function findNode(m, uid) { let r = null; walk(m.root, n => { if (n.uid === uid) r = n; }); return r; }

function drawMindmap(box, m, detail) {
  const ROW = 34, H = 26, GAPX = 46, PAD = 30;
  const FONT = '500 13px "IBM Plex Sans", system-ui, sans-serif', FONTB = '600 13px "IBM Plex Sans", system-ui, sans-serif';
  const vis = n => n.children && n.children.length && !mmCollapsed[n.uid] ? n.children : [];
  const leaves = n => { const c = vis(n); return c.length ? c.reduce((a, x) => a + leaves(x), 0) : 1; };
  const nodeW = n => Math.ceil(textW(n.label, n.type === 'group' ? FONTB : FONT)) + 24 + (n.type === 'group' ? 0 : 26) + (n.children ? 0 : 0);

  const tops = m.root.children;
  const total = tops.reduce((a, c) => a + leaves(c), 0);
  const right = [], left = [];
  let acc = 0;
  tops.forEach(c => { const k = leaves(c); (acc + k / 2 <= total / 2 ? right : left).push(c); if (right.includes(c)) acc += k; });

  const placed = [];
  function layoutSide(list, dir) {
    const colW = [];
    const depthW = (n, d) => { colW[d] = Math.max(colW[d] || 0, nodeW(n)); vis(n).forEach(c => depthW(c, d + 1)); };
    list.forEach(n => depthW(n, 0));
    let row = 0;
    const items = [];
    const place = (n, d, parent) => {
      const c = vis(n);
      let y;
      if (c.length) { const ys = c.map(x => place(x, d + 1, n)); y = (ys[0] + ys[ys.length - 1]) / 2; }
      else { y = row * ROW; row++; }
      items.push({ n, d, y, parent });
      return y;
    };
    list.forEach(n => place(n, 0, m.root));
    const off = (row - 1) * ROW / 2;
    const colX = [];
    let x = 0;
    colW.forEach((w, d) => { colX[d] = x; x += w + GAPX; });
    items.forEach(it => {
      it.y -= off; it.w = nodeW(it.n);
      it.x = colX[it.d]; it.dir = dir; it.colW = colW[it.d];
    });
    return { items, width: x - GAPX, rows: row };
  }
  const rootW = Math.ceil(textW(m.root.label, '600 17px "IBM Plex Sans", system-ui, sans-serif')) + 48, rootH = 44;
  const R = layoutSide(right, 1), Lf = layoutSide(left, -1);
  const gap0 = 70;
  const halfH = Math.max(R.rows, Lf.rows, 2) * ROW / 2 + PAD;
  const leftExt = Lf.items.length ? Lf.width + gap0 : 0;
  const rightExt = R.items.length ? R.width + gap0 : 0;
  const cx = PAD + leftExt + rootW / 2, cy = halfH;
  const W = cx + rootW / 2 + rightExt + PAD, Ht = halfH * 2;

  const pos = new Map();
  pos.set(m.root, { x: cx - rootW / 2, y: cy - rootH / 2, w: rootW, h: rootH, cx, cy });
  for (const it of R.items) { const x = cx + rootW / 2 + gap0 + it.x; pos.set(it.n, { x, y: cy + it.y - H / 2, w: it.w, h: H, cy: cy + it.y, dir: 1 }); }
  for (const it of Lf.items) { const x = cx - rootW / 2 - gap0 - it.x - it.w; pos.set(it.n, { x, y: cy + it.y - H / 2, w: it.w, h: H, cy: cy + it.y, dir: -1 }); }

  let edges = '', nodes = '';
  const all = [...R.items, ...Lf.items];
  for (const it of all) {
    const p = pos.get(it.parent), c = pos.get(it.n), dir = c.dir;
    const isRoot = it.parent === m.root;
    let sx = dir > 0 ? p.x + p.w : p.x;
    if (!isRoot && it.parent.children) sx += dir * 14;
    const sy = isRoot ? p.cy : p.cy;
    const ex = dir > 0 ? c.x : c.x + c.w, ey = c.cy;
    const mx = (sx + ex) / 2;
    edges += `<path class="mm-edge" d="M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}"/>`;
  }
  const nodeSvg = (n, p) => {
    const cls = n === m.root ? 'root' : n.type === 'group' ? 'group' : n.type === 'link' ? 'link' : 'leaf';
    const sel = mmSel === n.uid ? ' sel' : '';
    if (n === m.root) return `<g class="mm-node root${sel}" data-uid="${n.uid}"><rect class="box" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.h / 2}"/><text x="${p.cx}" y="${p.cy + 6}" text-anchor="middle">${esc(n.label)}</text></g>`;
    let g = `<g class="mm-node ${cls}${sel}" data-uid="${n.uid}" tabindex="0" role="button" aria-label="${esc(n.label)}"><title>${esc(n.label)} - ${esc(TYPES[n.type][1])}${n.card ? ', ' + esc(n.card) : ''}</title>`;
    g += `<rect class="box" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="4"/>`;
    let tx = p.x + 12;
    if (n.type !== 'group') {
      const col = getComputedStyle(document.documentElement).getPropertyValue(`--${n.type === 'link' ? 'link' : 't-' + ({ count: 'qty', decimal: 'qty', ratio: 'qty', quantity: 'qty', datetime: 'date', time: 'date', period: 'date' }[n.type] || n.type)}`);
      g += `<g class="ico" style="color:${col.trim()}"><rect x="${p.x + 8}" y="${p.y + 5}" width="20" height="16" rx="3" ${n.type === 'link' ? 'stroke-dasharray="3 2"' : ''}/><text x="${p.x + 18}" y="${p.y + 17}" text-anchor="middle">${esc(TYPES[n.type][0])}</text></g>`;
      tx = p.x + 34;
    }
    g += `<text class="lbl" x="${tx}" y="${p.y + 18}">${esc(n.label)}</text>`;
    if (occ(n.card).mand) g += `<circle class="mand-dot" cx="${p.x + p.w - 6}" cy="${p.y + 6}" r="3"><title>Mandatory</title></circle>`;
    g += `</g>`;
    if (n.children && n.children.length) {
      const tx2 = p.dir > 0 ? p.x + p.w + 8 : p.x - 8;
      g += `<g class="mm-tog" data-tog="${n.uid}" style="cursor:pointer" role="button" tabindex="0" aria-label="${mmCollapsed[n.uid] ? 'Open' : 'Close'} ${esc(n.label)}"><circle cx="${tx2}" cy="${p.cy}" r="7"/><text x="${tx2}" y="${p.cy + 4}" text-anchor="middle">${mmCollapsed[n.uid] ? '+' : '−'}</text></g>`;
    }
    return g;
  };
  nodes += nodeSvg(m.root, pos.get(m.root));
  for (const it of all) nodes += nodeSvg(it.n, pos.get(it.n));

  box.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * mmZoom}" height="${Ht * mmZoom}" viewBox="0 0 ${W} ${Ht}" role="img" aria-label="Mind map of ${esc(m.title)}">${edges}${nodes}</svg>`;
  const svg = box.querySelector('svg');
  const act = e => {
    const t = e.target.closest('[data-tog]');
    if (t) { const id = t.dataset.tog; mmCollapsed[id] ? delete mmCollapsed[id] : (mmCollapsed[id] = true); drawMindmap(box, m, detail); box.querySelector(`[data-tog="${id}"]`)?.focus(); return; }
    const g = e.target.closest('.mm-node');
    if (g) { mmSel = g.dataset.uid; drawMindmap(box, m, detail); showDetail(detail, findNode(m, mmSel)); box.querySelector(`.mm-node[data-uid="${mmSel}"]`)?.focus(); }
  };
  svg.addEventListener('click', act);
  svg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(e); } });
  return { W, Ht };
}
function showDetail(el, n) {
  if (!n) return;
  const kids = n.children ? `<p class="muted">${n.children.length} element${n.children.length > 1 ? 's' : ''}: ${n.children.map(c => esc(c.label)).join(', ')}</p>` : '';
  el.innerHTML = `<div class="hd">${icon(n.type)} ${esc(n.label)} ${tags(n)}</div>
    ${n.desc ? `<p>${esc(n.desc)}</p>` : ''}
    ${n.values ? `<p class="muted">Allowed values: ${n.values.map(esc).join(' · ')}</p>` : ''}
    ${n.vs ? [n.vs, ...(n.vs.also || [])].map(v => `<p class="muted">${esc(bindingLead(v))}: ${esc(v.title)}${v.note ? ` (${esc(v.note)})` : ''}</p>`).join('') : ''}
    ${n.target ? `<p class="muted">Refers to: ${esc(n.target)}</p>` : ''}
    ${n.def ? `<p class="muted">FHIR definition: ${esc(n.def)}</p>` : ''}
    ${n.ex ? `<p class="muted">Example: <b style="color:var(--ink);font-weight:500">${esc(n.ex)}</b></p>` : ''}
    ${kids}
    ${n.path ? `<p class="muted" style="font-family:var(--mono);font-size:12px">${esc(n.path)}</p>` : ''}`;
}

// ---------- form preview ----------
const formClosed = {};
function control(n, v, id) {
  switch (n.type) {
    case 'coded': {
      const opts = n.options || [];
      const hasV = v && !opts.includes(v);
      const listNote = n.vs && (!opts.length || n.more) ? `${n.vs.title}${n.vs.total ? ` (${n.vs.total} codes)` : ''}` : '';
      return `<select id="${id}"><option value="">${esc(listNote ? 'Choose - ' + listNote : 'Choose...')}</option>${hasV ? `<option selected>${esc(v)}</option>` : ''}${opts.map(o => `<option ${o === v ? 'selected' : ''}${n.scores?.[o] != null ? ` value="${esc(o)}"` : ''}>${esc(n.scores?.[o] != null ? `${o} (${n.scores[o]})` : o)}</option>`).join('')}</select>`;
    }
    case 'date': return dateInput(id, /^\d{4}-\d\d-\d\d/.test(v) ? v.slice(0, 10) : v);
    case 'datetime': return dateInput(id, v, '', true);
    case 'time': return `<input id="${id}" type="text" class="unit" placeholder="hh:mm" value="${esc(v.slice(0, 5))}">`;
    case 'bool': return `<input id="${id}" type="checkbox" ${v === 'true' ? 'checked' : ''}>`;
    case 'count': return `<input id="${id}" type="number" class="num" min="${n.range?.[0] ?? 0}"${n.range?.[1] != null ? ` max="${n.range[1]}"` : ''} value="${esc(v)}">`;
    case 'decimal': return `<input id="${id}" type="number" class="num" step="any"${n.range?.[0] != null ? ` min="${n.range[0]}"` : ''}${n.range?.[1] != null ? ` max="${n.range[1]}"` : ''} value="${esc(v)}">`;
    case 'quantity': { const [a, ...b] = v.split(' '); return `<input id="${id}" type="text" class="num" inputmode="decimal" value="${esc(a || '')}" aria-label="${esc(n.label)} amount"><input id="${id}-u" type="text" class="unit" placeholder="unit" value="${esc(b.join(' '))}" aria-label="${esc(n.label)} unit">`; }
    case 'ratio': { const cut = v.lastIndexOf(' / '), halves = cut >= 0 ? [v.slice(0, cut), v.slice(cut + 3)] : [v.split('/')[0], v.split('/').slice(1).join('/')], side = h => (h || '').trim().match(/^(\S+)(?:\s+(.+))?$/) || []; const [a, b] = halves.map(side); return `<input id="${id}" class="num" value="${esc(a[1] || '')}" aria-label="${esc(n.label)} numerator"><input id="${id}-a" class="unit" placeholder="unit" value="${esc(a[2] || '')}" aria-label="${esc(n.label)} numerator unit"><span class="sep">per</span><input id="${id}-b" class="num" value="${esc(b[1] || '')}" aria-label="${esc(n.label)} denominator"><input id="${id}-c" class="unit" placeholder="unit" value="${esc(b[2] || '')}" aria-label="${esc(n.label)} denominator unit">`; }
    case 'period': { const p = v.split(', ')[0], [from, to] = /^until /.test(p) ? ['', p.slice(6)] : /^since /.test(p) ? [p.slice(6), ''] : [p.split(' to ')[0], p.split(' to ')[1] || '']; const time = ![from, to].some(x => /^\d{4}-\d\d-\d\d$/.test(x)); return `${dateInput(id, from, n.label + ' from', time)}<span class="sep">to</span>${dateInput(id + '-b', to, n.label + ' to', time)}`; }
    case 'link': return `<span class="refbox" id="${id}">${icon('link')} ${esc(v || 'Select ' + n.target)}</span>`;
    default: return `<input id="${id}" type="text" value="${esc(v)}" placeholder="${n.type === 'id' ? 'Number' : ''}">`;
  }
}
function formNode(n, d) {
  if (n.children) {
    const closed = formClosed[n.uid] ?? (d > 1 && !!n.collapsed);
    const lk = n.type === 'link';
    return `<div class="fs ${lk ? 'link' : ''} d${d > 1 ? 1 : 0} ${closed ? 'closed' : ''}" data-fs="${n.uid}">
      <button class="fh" aria-expanded="${!closed}"><span class="tw">▾</span>${icon(n.type)} ${esc(n.label)} ${n.card ? `<span class="car">[${esc(n.card)}]</span>` : ''}${lk ? `<span class="chip ref">${esc(n.target)}</span>` : ''}</button>
      <div class="fb">${n.desc ? `<div class="note">${esc(n.desc)}</div>` : ''}${n.values ? `<div class="note">${n.values.map(esc).join(' · ')}</div>` : ''}${n.children.map(c => formNode(c, d + 1)).join('')}</div></div>`;
  }
  const o = occ(n.card);
  const ex = state.example ? n.fx || n.exs || (n.ex ? [n.ex] : []) : [];
  const notes = (n.values || []).filter(x => /^(Range|Minimum|Maximum|Rule): /.test(x));
  const fixed = (n.values || []).find(x => x.startsWith('Fixed: ') || n.type === 'quantity' && x.startsWith('Unit: '));
  const vals = /\.\.1$/.test(n.card || '') ? [ex[0] || ''] : ex.length ? ex : [''];
  // a quantity fixed to a unit alone fills the unit box, not the amount
  if (fixed && !vals[0] && n.type !== 'link') vals[0] = n.type === 'quantity' && (fixed.startsWith('Unit: ') || !/^(?:[<>]=?)?[-+.\d]/.test(fixed.split(': ')[1])) ? ' ' + fixed.split(': ')[1] : fixed.slice(fixed.indexOf(': ') + 2);
  const ctl = (v, i) => {
    const cid = 'f-' + n.uid + (i ? '-' + i : '');
    const h = control(n, v, cid);
    return i ? h.replace(new RegExp(`id="${cid}"(?![^>]*aria-label)`), `id="${cid}" aria-label="${esc(n.label)} ${i + 1}"`) : h;
  };
  return `<div class="fr"><label class="fl" for="f-${n.uid}">${icon(n.type)} ${esc(n.label)}${o.mand ? ' <span class="req" title="Mandatory">*</span>' : ''} <span class="car">[${esc(n.card)}]</span></label><div class="fc">${vals.map((v, i) => `<div class="fv">${ctl(v, i)}</div>`).join('')}${notes.map(x => `<div class="note">${esc(x)}</div>`).join('')}</div></div>`;
}
function renderForm(pane, m) {
  pane.innerHTML = `<div class="toolbar">
      <button class="tbtn" id="opt-ex">${state.example ? 'Clear example data' : 'Fill with example data'}</button>
      <span class="sp"></span><span><span class="req" style="color:var(--mand);font-weight:700">*</span> mandatory · [min..max] how many times an element may occur</span></div>
    <div class="form">${m.root.children.map(c => formNode(c, 1)).join('')}</div>`;
  pane.querySelector('#opt-ex').onclick = () => { state.example = !state.example; renderForm(pane, m); };
  pane.querySelector('.form').addEventListener('click', e => {
    const h = e.target.closest('.fh'); if (!h) return;
    const fs = h.parentElement; const closed = fs.classList.toggle('closed');
    formClosed[fs.dataset.fs] = closed; h.setAttribute('aria-expanded', String(!closed));
  });
}

// ---------- exchange ----------
function renderExchange(pane, m) {
  state.step = Math.min(state.step, m.steps.length - 1);
  const s = m.steps[state.step];
  const byLabel = l => m.root.children.find(c => c.label === l) || (l === 'Prescription' ? m.root.children[0] : null);
  const pkg = (labels, asRef) => labels.map(l => {
    const n = byLabel(l); if (!n) return '';
    const leaves = []; walk(n, x => { if (!x.children) leaves.push(x); });
    return `<div class="item ${asRef || n.type === 'link' ? 'link' : ''}"><div class="hd">${icon(asRef ? 'link' : n.type)} ${esc(n.label)} ${asRef ? '<span class="chip ref">reference only</span>' : ''}</div>
      ${asRef ? `<div class="note" style="font-size:12px;color:var(--muted)">Sent as a link to the existing ${esc(n.label.toLowerCase())} record, not copied.</div>` :
        `<div class="fields">${leaves.map(x => `<span title="${esc(TYPES[x.type][1])}">${icon(x.type)}${esc(x.label)}</span>`).join('')}</div>`}</div>`;
  }).join('');
  const arrow = `<svg viewBox="0 0 40 10" aria-hidden="true"><path d="M0 5 H34" stroke="currentColor" stroke-width="1.5"/><path d="M33 1 L39 5 L33 9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;
  pane.innerHTML = `<div class="flow" role="tablist" aria-label="Steps">${m.steps.map((x, i) =>
      `<button class="step" role="tab" aria-selected="${i === state.step}" data-step="${i}"><span class="n">${esc(x.n)}</span><h3>${esc(x.title)}</h3><span class="who">${esc(x.who)}</span></button>`).join('')}</div>
    <div class="ex-body">
      <div>
        <h3>${esc(s.title)}</h3>
        <div class="lane"><span class="actor">${esc(s.from)}</span><span class="arrow">${arrow}</span><span class="actor">${esc(s.to)}</span></div>
        <p>${esc(s.text)}</p>
        ${s.reads ? `<p style="color:var(--muted)">Reads first: ${s.reads.map(esc).join(', ')}.</p>` : ''}
        ${(s.status || []).length ? `<h3 style="margin-top:14px">Status after this step</h3><div class="stflow">${s.status.map(([a, b]) => `<div><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('')}</div>` : ''}
        ${s.callout ? `<div class="callout">${esc(s.callout)}</div>` : ''}
      </div>
      <div>
        <h3>What is sent</h3>
        <div class="pk">${pkg(s.sends || [], false)}${pkg(s.refs || [], true)}</div>
      </div>
    </div>`;
  pane.querySelector('.flow').addEventListener('click', e => {
    const b = e.target.closest('[data-step]'); if (!b) return; state.step = +b.dataset.step; renderExchange(pane, m);
  });
}

if (MODE === 'standalone') {
  document.getElementById('title').textContent = DATA.meta.title;
  document.getElementById('intro').textContent = DATA.meta.intro || 'The data these profiles exchange: an overview, a data table, a mind map and a form preview of each.';
  document.getElementById('proto').textContent = DATA.meta.guideName + ' ' + DATA.meta.igVersion + (DATA.meta.built ? ' · built ' + DATA.meta.built : '');
}
readHash();
render();
if (MODE === 'profile') {
  // the template's profile tabs are fixed in its layout, so add the view as one more tab once they exist
  const toTab = () => {
    const tabs = document.getElementById('tabs'), list = tabs && tabs.querySelector(':scope > ul'), $ = window.jQuery;
    if (!list || !$ || !$(tabs).tabs('instance')) return;
    const host = ROOT.closest('.cv-host');
    const li = document.createElement('li');
    li.innerHTML = '<a href="#tabs-clinical">Clinical View</a>';
    list.appendChild(li);
    const panel = document.createElement('div');
    panel.id = 'tabs-clinical';
    tabs.appendChild(panel);
    panel.appendChild(ROOT);
    host.remove();
    $(tabs).tabs('refresh');
    let saved = null;
    try { saved = sessionStorage.getItem('fhir-resource-tab-index'); } catch (e) {}
    const idx = list.children.length - 1, linked = location.hash === '#tabs-clinical' || location.hash === '#clinical-view';
    if (saved === String(idx) || linked) $(tabs).tabs('option', 'active', idx);
    if (linked) tabs.scrollIntoView();
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', toTab) : toTab();
}
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (state.view === 'mindmap') render(); });
}
