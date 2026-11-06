// Visor de un diseño desde las tarjetas: foto grande y modelo 3D que se gira con el dedo o el mouse.
// No es el editor: no tiene ajustes, solo mirar. Abajo hay un botón para pasar al editor.
// El 3D se carga recién cuando se pide (no pesa en la página).
import { esc, icon } from './dom.js';
import { getObject, subOf } from '../objects/index.js';
import { THUMBS, THUMB_VERSION, VARIANT_THUMBS } from '../content/thumbs.js';
import { VARIANTS, variantHref } from '../content/variants.js';
import { navigate } from '../router.js';

let openState = null;

/** Botón del ojito que va dentro de la foto de la tarjeta. */
export const eyeButton = (name) => `<button class="card-eye" type="button" aria-label="Ver ${esc(name)} en grande y girarlo en 3D" title="Ver en grande y girar en 3D">${icon.eye}</button>`;

/** Fotos del diseño: una por variante (la primera es la principal). */
export function slidesOf(def) {
  const vars = (VARIANTS[def.id] || []).filter((v, i) => (i === 0 ? THUMBS.has(def.id) : VARIANT_THUMBS.has(`${def.id}--${v.key}`)));
  if (vars.length > 1) {
    return vars.map((v, i) => ({ label: v.label, params: v.params || {}, href: variantHref(def.id, v),
      src: `${i ? `/miniaturas/variantes/${def.id}--${v.key}.webp` : `/miniaturas/${def.id}.webp`}?v=${THUMB_VERSION}` }));
  }
  return [{ label: '', params: {}, href: `/crear/${def.id}`, src: THUMBS.has(def.id) ? `/miniaturas/${def.id}.webp?v=${THUMB_VERSION}` : '' }];
}

export function bindPreview(root) {
  const onClick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (e.target.closest('.car-btn')) return; // las flechas del carrusel siguen en lo suyo
    const media = e.target.closest('.card-media');
    if (!media || !root.contains(media)) return;
    const a = media.closest('a.card[data-card]');
    const def = a && getObject(a.dataset.card);
    if (!def) return;
    e.preventDefault(); e.stopPropagation();
    const imgs = [...media.querySelectorAll('img.thumb-photo')];
    const on = imgs.findIndex((im) => im.classList.contains('is-on'));
    open(def, media.dataset.start ? Number(media.dataset.start) : Math.max(0, on));
  };
  root.addEventListener('click', onClick, true);
  return () => { root.removeEventListener('click', onClick, true); if (openState) close(true); };
}

function open(def, start = 0) {
  if (openState) return;
  const slides = slidesOf(def);
  let i = Math.min(start, slides.length - 1), mode = slides[0].src ? 'foto' : '3d', viewer = null, tdMod = null, token = 0;
  const models = new Map();
  const el = document.createElement('div');
  el.className = 'pv';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', `Vista de ${def.name}`);
  const many = slides.length > 1, hasPhoto = !!slides[0].src;
  el.innerHTML = `
    <div class="pv-box">
      <button class="pv-close" type="button" aria-label="Cerrar">${icon.x}</button>
      <div class="pv-stage">
        <img class="pv-img" alt="" draggable="false"${hasPhoto ? '' : ' hidden'}>
        <div class="pv-3d" hidden></div>
        <div class="pv-load" hidden>Cargando vista 3D…</div>
        <span class="pv-hint" hidden>${icon.view} Arrastrá para girar<span class="pv-hint-more"> · rueda o pellizco para acercar</span></span>
        ${many ? `<button class="pv-nav pv-prev" type="button" aria-label="Anterior">${icon.back}</button><button class="pv-nav pv-next" type="button" aria-label="Siguiente">${icon.arrow}</button>` : ''}
      </div>
      <div class="pv-side">
        <span class="eyebrow">${esc(subOf(def)?.label || '')}</span>
        <h3>${esc(def.name)}</h3>
        <p class="pv-var" ${many ? '' : 'hidden'}></p>
        <p class="pv-desc">${esc(def.description)}</p>
        <div class="pv-modes" role="tablist" aria-label="Cómo verlo">
          ${hasPhoto ? `<button type="button" role="tab" data-mode="foto">${icon.gallery} Foto</button>` : ''}
          <button type="button" role="tab" data-mode="3d">${icon.cube} Girar en 3D</button>
        </div>
        ${many ? '<div class="pv-dots" aria-hidden="true"></div>' : ''}
        <p class="pv-note">${hasPhoto ? 'La foto es un render del diseño. ' : ''}El 3D es el modelo real que se descarga.</p>
        <a class="btn btn-primary pv-go" href="${esc(slides[i].href)}">Personalizar este ${icon.arrow}</a>
      </div>
    </div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('lb-lock');
  const $q = (s) => el.querySelector(s);
  const img = $q('.pv-img'), box3d = $q('.pv-3d'), load = $q('.pv-load'), hint = $q('.pv-hint');

  const draw3d = async () => {
    const my = ++token;
    load.hidden = false;
    try {
      if (!tdMod) tdMod = await Promise.all([import('../viewer/Viewer.js'), import('../core/pipeline.js')]);
      if (my !== token || !openState || mode !== '3d') return;
      const [{ Viewer, webglAvailable }, { buildModel }] = tdMod;
      if (!webglAvailable()) throw new Error('webgl');
      if (!viewer) { viewer = new Viewer(box3d, { autoRotate: true, bed: false }); if (viewer.failed) { viewer = null; throw new Error('webgl'); } }
      const k = i;
      if (!models.has(k)) models.set(k, buildModel(def, { ...def.defaults, ...slides[k].params }, def.useOrientation || def.orientations[0].id));
      viewer.setModel(models.get(k).parts, { reframe: 'auto' });
      viewer.resize();
      load.hidden = true; hint.hidden = false;
    } catch {
      load.hidden = false; load.textContent = 'Tu navegador no permite la vista 3D. Podés verla en el editor.';
    }
  };
  const render = () => {
    const s = slides[i];
    el.querySelectorAll('.pv-modes button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode)));
    const is3 = mode === '3d';
    box3d.hidden = !is3; img.hidden = is3 || !hasPhoto; hint.hidden = true; load.hidden = true; load.textContent = 'Cargando vista 3D…';
    if (!is3) { img.src = s.src; img.alt = `${def.name}${s.label ? `: ${s.label}` : ''}`; img.classList.remove('pv-in'); void img.offsetWidth; img.classList.add('pv-in'); }
    const v = $q('.pv-var'); if (v) v.textContent = s.label;
    $q('.pv-go').setAttribute('href', s.href);
    const dots = $q('.pv-dots'); if (dots) dots.innerHTML = slides.map((_, k) => `<i${k === i ? ' class="on"' : ''}></i>`).join('');
    if (is3) draw3d();
  };
  const step = (d) => { i = (i + d + slides.length) % slides.length; render(); };

  el.addEventListener('click', (e) => {
    if (e.target === el || e.target.closest('.pv-close')) return close();
    if (e.target.closest('.pv-prev')) return step(-1);
    if (e.target.closest('.pv-next')) return step(1);
    const m = e.target.closest('.pv-modes button');
    if (m) { mode = m.dataset.mode; render(); return; }
    const go = e.target.closest('.pv-go');
    if (go) { // cerrar primero (saca la entrada del historial) y recién después ir al editor
      e.preventDefault(); const href = go.getAttribute('href');
      window.addEventListener('popstate', () => navigate(href), { once: true });
      close();
    }
  });
  // Deslizar la foto cambia de variante (en 3D el dedo gira el objeto)
  let sx = 0, sy = 0;
  img.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
  img.addEventListener('touchend', (e) => { const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; if (many && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1); });
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' && many) step(1);
    else if (e.key === 'ArrowLeft' && many) step(-1);
  };
  document.addEventListener('keydown', onKey);
  // «Atrás» del celular o del navegador cierra el visor en vez de salir de la página
  history.pushState({ ...(history.state || {}), preview: true }, '', location.href);
  window.__lightboxOpen = true;
  const onPop = () => close(true);
  window.addEventListener('popstate', onPop);
  openState = { el, onKey, onPop, dispose: () => { token++; viewer?.dispose(); models.forEach((m) => tdMod?.[1].disposeModel(m)); } };
  render();
  requestAnimationFrame(() => el.classList.add('pv-open'));
  $q('.pv-close').focus();
}

function close(fromHistory = false) {
  if (!openState) return;
  const { el, onKey, onPop, dispose } = openState;
  openState = null;
  document.removeEventListener('keydown', onKey);
  window.removeEventListener('popstate', onPop);
  window.__lightboxOpen = false;
  document.documentElement.classList.remove('lb-lock');
  el.classList.remove('pv-open');
  dispose();
  setTimeout(() => el.remove(), 200);
  if (!fromHistory) { window.__lightboxClosing = true; history.back(); }
}
