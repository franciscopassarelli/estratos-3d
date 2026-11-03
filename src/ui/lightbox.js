// Visor de fotos de la galería en la misma página: flechas, deslizar en el celular, zoom con clic
// o doble toque, y se cierra con la X, tocando afuera, con Esc o con el botón «atrás» del celular.
import { icon } from './dom.js';

let openState = null;

export function bindLightbox(root) {
  const onClick = (e) => {
    const a = e.target.closest('a.gal-photo');
    if (!a || !root.contains(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    const links = [...root.querySelectorAll('a.gal-photo')];
    const items = links.map((l) => {
      const fig = l.closest('figure');
      return {
        src: l.dataset.poster || l.getAttribute('href'),
        video: l.dataset.video || '',
        alt: l.querySelector('img')?.alt || '',
        title: fig?.querySelector('figcaption b')?.textContent || '',
        who: fig?.querySelector('.gal-who')?.innerHTML || '',
        cta: fig?.querySelector('.gal-cta')?.outerHTML || '',
      };
    });
    open(items, links.indexOf(a));
  };
  root.addEventListener('click', onClick);
  return () => { root.removeEventListener('click', onClick); if (openState) close(true); };
}

function open(items, index) {
  if (openState) return;
  const el = document.createElement('div');
  el.className = 'lightbox';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Foto de la galería');
  el.innerHTML = `
    <button class="lb-btn lb-close" type="button" aria-label="Cerrar">${icon.x}</button>
    ${items.length > 1 ? `<button class="lb-btn lb-prev" type="button" aria-label="Foto anterior">${icon.back}</button>
    <button class="lb-btn lb-next" type="button" aria-label="Foto siguiente">${icon.arrow}</button>` : ''}
    <div class="lb-stage"><img class="lb-img" alt="" draggable="false"><video class="lb-vid" controls playsinline muted loop preload="metadata" hidden></video></div>
    <div class="lb-caption"><div><b class="lb-title"></b><span class="lb-who"></span></div><span class="lb-count"></span><span class="lb-cta"></span></div>`;
  document.body.appendChild(el);
  document.documentElement.classList.add('lb-lock');
  const img = el.querySelector('.lb-img'), stage = el.querySelector('.lb-stage'), vid = el.querySelector('.lb-vid');
  let i = index, zoom = false;

  const show = (k) => {
    i = (k + items.length) % items.length;
    const it = items[i];
    setZoom(false);
    img.classList.remove('lb-in'); void img.offsetWidth; img.classList.add('lb-in');
    vid.pause();
    if (it.video) {
      // Video: se reproduce solo (sin sonido, como en redes) y tiene controles
      img.hidden = true; vid.hidden = false;
      vid.poster = it.src; vid.src = it.video; vid.setAttribute('aria-label', it.alt);
      vid.play().catch(() => {});
    } else {
      vid.hidden = true; vid.removeAttribute('src'); vid.load(); img.hidden = false;
      img.src = it.src; img.alt = it.alt;
    }
    el.querySelector('.lb-title').textContent = it.title;
    el.querySelector('.lb-who').innerHTML = it.who;
    el.querySelector('.lb-cta').innerHTML = it.cta;
    el.querySelector('.lb-count').textContent = items.length > 1 ? `${i + 1} / ${items.length}` : '';
    // Precarga la siguiente
    if (items.length > 1) { const pre = new Image(); pre.src = items[(i + 1) % items.length].src; }
  };
  const setZoom = (on, x = 0.5, y = 0.5) => {
    zoom = on;
    img.style.transformOrigin = `${x * 100}% ${y * 100}%`;
    img.classList.toggle('lb-zoom', on);
  };
  const toggleZoom = (cx, cy) => {
    if (!vid.hidden) return;
    const r = img.getBoundingClientRect();
    setZoom(!zoom, Math.min(1, Math.max(0, (cx - r.left) / r.width)), Math.min(1, Math.max(0, (cy - r.top) / r.height)));
  };

  // Con zoom, la foto sigue al mouse
  const onMove = (e) => {
    if (!zoom || e.pointerType === 'touch') return;
    const r = stage.getBoundingClientRect();
    img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
  };
  img.addEventListener('click', (e) => { if (e.pointerType !== 'touch' && !matchMedia('(pointer: coarse)').matches) toggleZoom(e.clientX, e.clientY); });
  stage.addEventListener('pointermove', onMove);

  // Tocar afuera de la foto cierra
  el.addEventListener('click', (e) => {
    if (e.target === el || e.target === stage) close();
    if (e.target.closest('.lb-close')) close();
    if (e.target.closest('.lb-prev')) show(i - 1);
    if (e.target.closest('.lb-next')) show(i + 1);
  });

  // Celular: deslizar para cambiar, deslizar hacia abajo para cerrar, doble toque para zoom
  let sx = 0, sy = 0, st = 0, lastTap = 0;
  stage.addEventListener('touchstart', (e) => { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); } }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy, now = Date.now();
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && now - st < 300) {
      if (now - lastTap < 300) { toggleZoom(t.clientX, t.clientY); lastTap = 0; } else lastTap = now;
      return;
    }
    if (zoom) return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
    else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) close();
  });

  const onKey = (e) => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight') show(i + 1);
    else if (e.key === 'ArrowLeft') show(i - 1);
  };
  document.addEventListener('keydown', onKey);

  // El botón «atrás» del celular o del navegador cierra la foto en vez de salir de la página
  history.pushState({ ...(history.state || {}), lightbox: true }, '', location.href);
  window.__lightboxOpen = true;
  const onPop = () => close(true);
  window.addEventListener('popstate', onPop);

  openState = { el, onKey, onPop };
  show(i);
  requestAnimationFrame(() => el.classList.add('lb-open'));
  el.querySelector('.lb-close').focus();
}

function close(fromHistory = false) {
  if (!openState) return;
  const { el, onKey, onPop } = openState;
  openState = null;
  document.removeEventListener('keydown', onKey);
  window.removeEventListener('popstate', onPop);
  window.__lightboxOpen = false;
  document.documentElement.classList.remove('lb-lock');
  el.classList.remove('lb-open');
  setTimeout(() => el.remove(), 200);
  // Si se cerró con la X, Esc o tocando afuera, se saca la entrada que agregamos al historial
  if (!fromHistory) { window.__lightboxClosing = true; history.back(); }
}

