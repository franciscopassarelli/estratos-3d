import { OBJECTS, CATEGORIES, objectsIn, subOf } from '../objects/index.js';
import { thumbnail, onThumbnail } from './thumbnails.js';
import { esc, icon, $, $$ } from './dom.js';
import { adSlot, activateAds } from './ads.js';
import { allItems } from '../core/pipeline.js';
import { THUMBS, THUMB_VERSION } from '../content/thumbs.js';

const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

export function card(def) {
  const items = allItems(def);
  const colors = items.filter((i) => i.type === 'color').length;
  const params = items.filter((i) => i.type !== 'color').length;
  const img = thumbnail(def.id);
  return `
  <a class="card" href="/crear/${def.id}" data-card="${def.id}">
    <div class="card-media">
      ${THUMBS.has(def.id)
        ? `<img class="thumb-photo" src="/miniaturas/${def.id}.webp?v=${THUMB_VERSION}" alt="${esc(def.name)} para imprimir en 3D" width="960" height="720" loading="lazy" decoding="async">`
        : img ? `<img src="${img}" alt="Vista 3D de ${esc(def.name)}">` : `<span class="placeholder">Generando vista…</span>`}
      <span class="tag">${esc(subOf(def)?.label || catLabel(def.category))}</span>
    </div>
    <div class="card-body">
      <h3>${esc(def.name)}</h3>
      <p>${esc(def.description)}</p>
      <div class="card-meta"><span>${params} ajustes</span><span>${colors} ${colors === 1 ? 'color' : 'colores'}</span><span>${esc(def.printTime)}</span></div>
      <span class="card-cta">Personalizar ${icon.arrow}</span>
    </div>
  </a>`;
}

export function bindThumbs(root) {
  return onThumbnail((id, url) => {
    for (const el of $$(`[data-card="${id}"] .card-media`, root)) {
      const ph = el.querySelector('.placeholder');
      if (ph) ph.outerHTML = `<img src="${url}" alt="Vista 3D">`;
    }
  });
}

export function catalogPage(state) {
  return `
  <main class="wrap">
    <div class="page-head">
      <span class="eyebrow">Catálogo</span>
      <h1>Elegí qué querés imprimir</h1>
      <p class="lead">Cada diseño se genera con geometría real a partir de tus medidas. Abrilo, ajustalo y descargá el archivo listo para tu laminador.</p>
    </div>
    <div class="filters">
      <label class="search"><span class="sr">Buscar por nombre</span>${icon.search}<input id="cat-search" type="search" placeholder="Buscar: llavero, maceta, placa…" value="${esc(state.query || '')}"></label>
      <div class="chips" role="group" aria-label="Filtrar por categoría" id="cat-chips">${catChips(state)}</div>
    </div>
    <div class="subchips" role="group" aria-label="Filtrar por tipo" id="sub-chips">${subChips(state)}</div>
    <p class="cat-count" id="cat-count" aria-live="polite"></p>
    <div class="cards" id="cat-grid"></div>
    <div class="after-grid">${adSlot('inline')}</div>
  </main>`;
}

const n = (k) => `<span class="chip-n">${k}</span>`;
function catChips(state) {
  const cat = state.category || 'all';
  return `<button class="chip" data-cat="all" aria-pressed="${cat === 'all'}">Todos ${n(OBJECTS.length)}</button>`
    + CATEGORIES.map((c) => `<button class="chip${c.personal ? ' chip-personal' : ''}" data-cat="${c.id}" aria-pressed="${cat === c.id}">${esc(c.label)} ${n(objectsIn(c.id).length)}</button>`).join('');
}
function subChips(state) {
  const cat = CATEGORIES.find((c) => c.id === state.category);
  if (!cat || !cat.subs || cat.subs.length < 2) return '';
  const sub = state.sub || 'all';
  return `<span class="subchips-label">${esc(cat.label)}:</span>`
    + `<button class="subchip" data-sub="all" aria-pressed="${sub === 'all'}">Todo</button>`
    + cat.subs.map((s) => `<button class="subchip" data-sub="${s.id}" aria-pressed="${sub === s.id}">${esc(s.label)} ${n(s.ids.length)}</button>`).join('');
}

export function mountCatalog(root, state) {
  const grid = $('#cat-grid', root), subBox = $('#sub-chips', root), count = $('#cat-count', root);
  const norm = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const syncUrl = () => {
    const u = new URL(location.href);
    u.searchParams.delete('categoria'); u.searchParams.delete('tipo');
    if (state.category && state.category !== 'all') u.searchParams.set('categoria', state.category);
    if (state.sub && state.sub !== 'all') u.searchParams.set('tipo', state.sub);
    history.replaceState(history.state, '', u.pathname + u.search);
  };
  const render = () => {
    const q = norm((state.query || '').trim());
    const list = objectsIn(state.category, state.sub).filter((o) => {
      if (!q) return true;
      const hay = norm([o.name, o.description, subOf(o)?.label || '', ...o.tags].join(' '));
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
    count.textContent = `${list.length} ${list.length === 1 ? 'diseño' : 'diseños'}`;
    grid.innerHTML = list.length ? list.map(card).join('')
      : `<div class="empty">No encontramos diseños con esa búsqueda${state.category !== 'all' ? ' en esta categoría' : ''}. Probá con otra palabra o elegí <b>Todos</b>.</div>`;
  };
  render();
  $('#cat-search', root).addEventListener('input', (e) => { state.query = e.target.value; render(); });
  $('#cat-chips', root).addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.category = b.dataset.cat; state.sub = 'all';
    $$('#cat-chips .chip', root).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    subBox.innerHTML = subChips(state);
    syncUrl(); render();
  });
  subBox.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sub]');
    if (!b) return;
    state.sub = b.dataset.sub;
    $$('.subchip', subBox).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    syncUrl(); render();
  });
  activateAds(root);
  const off = bindThumbs(root);
  return () => off();
}
