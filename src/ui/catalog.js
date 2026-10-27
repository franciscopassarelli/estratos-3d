import { OBJECTS, CATEGORIES, categoriesOf } from '../objects/index.js';
import { thumbnail, onThumbnail } from './thumbnails.js';
import { esc, icon, $, $$ } from './dom.js';
import { adSlot, activateAds } from './ads.js';
import { allItems } from '../core/pipeline.js';

const catLabel = (id) => CATEGORIES.find((c) => c.id === id)?.label || id;

export function card(def) {
  const items = allItems(def);
  const colors = items.filter((i) => i.type === 'color').length;
  const params = items.filter((i) => i.type !== 'color').length;
  const img = thumbnail(def.id);
  return `
  <a class="card" href="/crear/${def.id}" data-card="${def.id}">
    <div class="card-media">
      ${img ? `<img src="${img}" alt="Vista 3D de ${esc(def.name)}">` : `<span class="placeholder">Generando vista…</span>`}
      <span class="tag">${esc(catLabel(def.category))}</span>
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
  const cat = state.category || 'all';
  return `
  <main class="wrap">
    <div class="page-head">
      <span class="eyebrow">Catálogo</span>
      <h1>Elegí qué querés imprimir</h1>
      <p class="lead">Cada diseño se genera con geometría real a partir de tus medidas. Abrilo, ajustalo y descargá el archivo listo para tu laminador.</p>
    </div>
    <div class="filters">
      <label class="search"><span class="sr">Buscar por nombre</span>${icon.search}<input id="cat-search" type="search" placeholder="Buscar: llavero, maceta, placa…" value="${esc(state.query || '')}"></label>
      <div class="chips" role="group" aria-label="Filtrar por categoría">
        <button class="chip" data-cat="all" aria-pressed="${cat === 'all'}">Todos</button>
        ${CATEGORIES.map((c) => `<button class="chip" data-cat="${c.id}" aria-pressed="${cat === c.id}">${esc(c.label)}</button>`).join('')}
      </div>
    </div>
    <div class="cards" id="cat-grid"></div>
    <div class="after-grid">${adSlot('inline')}</div>
  </main>`;
}

export function mountCatalog(root, state) {
  const grid = $('#cat-grid', root);
  const render = () => {
    const q = (state.query || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const list = OBJECTS.filter((o) => {
      if (state.category && state.category !== 'all' && !categoriesOf(o).includes(state.category)) return false;
      if (!q) return true;
      const hay = [o.name, o.description, ...o.tags].join(' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      return q.split(/\s+/).every((w) => hay.includes(w));
    });
    let html = list.map(card);
    if (!list.length) {
      const c = CATEGORIES.find((x) => x.id === state.category);
      html = [`<div class="empty">${c && !q ? `Todavía no hay diseños en <b>${esc(c.label)}</b>. Estamos preparando nuevos objetos para esta categoría.` : 'No encontramos diseños con esa búsqueda. Probá con otra palabra.'}</div>`];
    }
    grid.innerHTML = html.join('');
  };
  render();
  $('#cat-search', root).addEventListener('input', (e) => { state.query = e.target.value; render(); });
  root.querySelector('.chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    state.category = b.dataset.cat;
    $$('.chip', root).forEach((c) => c.setAttribute('aria-pressed', String(c === b)));
    render();
  });
  activateAds(root);
  const off = bindThumbs(root);
  return () => off();
}
