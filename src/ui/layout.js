import { icon, esc } from './dom.js';
import { SITE } from '../config.js';
import { featuredPromo } from '../content/promos.js';
import { activeEvent, EVENTS } from '../content/events.js';
import { OBJECTS, CATEGORIES, categoriesOf } from '../objects/index.js';

const logo = `<span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Estratos <small>3D</small></span>`;

export function header(section) {
  const cur = (r) => (section === r ? ' aria-current="page"' : '');
  return `
  <header class="site-header">
    <div class="wrap">
      <a class="logo" href="/" aria-label="${esc(SITE.name)}, inicio">${logo}</a>
      <button class="icon-btn menu-btn" id="menu-btn" aria-label="Abrir menú" aria-expanded="false">${icon.menu}</button>
      <nav class="nav" id="nav" aria-label="Menú principal">
        <div class="nav-card" role="dialog" aria-label="Menú">
          <button class="icon-btn nav-close" id="nav-close" type="button" aria-label="Cerrar menú">${icon.x}</button>
        <a href="/"${cur('inicio')}>Inicio</a>
        <a href="/catalogo"${cur('catalogo')}>Catálogo</a>
        <a href="/guias"${cur('guias')}>Guías</a>
        <a href="/galeria"${cur('galeria')}>Galería</a>
        ${(() => { const ev = activeEvent(); return ev ? `<a class="nav-event" href="${ev.path}"${cur(`evento-${ev.id}`)}>${icon.tree} ${esc(ev.label)}</a>` : ''; })()}
        <a href="/pedidos"${cur('pedidos')}>Pedí impreso</a>
        <a href="/ayuda"${cur('ayuda')}>Ayuda</a>
          <a class="btn btn-primary nav-cta" href="/catalogo">${icon.plus} Crear un objeto</a>
        </div>
      </nav>
      <a class="btn btn-primary btn-sm btn-cta header-cta" href="/catalogo">${icon.plus} Crear un objeto</a>
    </div>
  </header>
  ${sideNav(cur)}
  ${tabBar(cur)}`;
}

/** Menú lateral (compu): logo, botón Crear y secciones con ícono y nombre. */
function sideNav(cur) {
  const promo = featuredPromo();
  return `
  <aside class="side-nav" aria-label="Navegación principal">
    <a class="side-logo" href="/" aria-label="${esc(SITE.name)}, inicio"><span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span></a>
    <a class="side-create" href="/catalogo"${cur('catalogo')}><span class="side-create-btn">${icon.plus}</span><span>Crear</span></a>
    ${(() => { const ev = activeEvent(); return ev ? `<a class="side-event" href="${ev.path}"${cur(`evento-${ev.id}`)}>${icon.tree}<span>${esc(ev.label)}</span></a>` : ''; })()}
    <nav class="side-links">
      <i class="side-sep" aria-hidden="true"></i>
      <a href="/"${cur('inicio')}>${icon.home}<span>Inicio</span></a>
      <div class="side-item">
        <a href="/catalogo"${cur('catalogo')}>${icon.grid}<span>Catálogo</span></a>
        ${catalogFly()}
      </div>
      <a href="/galeria"${cur('galeria')}>${icon.gallery}<span>Galería</span></a>
      <i class="side-sep" aria-hidden="true"></i>
      <a href="/guias"${cur('guias')}>${icon.book}<span>Guías</span></a>
      <a href="/pedidos"${cur('pedidos')}>${icon.bag}<span>Pedidos</span></a>
      <a href="/ayuda"${cur('ayuda')}>${icon.help}<span>Ayuda</span></a>
    </nav>
    ${promo ? `<div class="side-bottom"><a class="side-promo" href="/sorteos/${esc(promo.slug)}" title="${esc(promo.title)}">${icon.gift}<span>Sorteo</span><i class="side-dot" aria-hidden="true"></i></a></div>` : ''}
  </aside>`;
}

/** Menú que se abre al apoyar el mouse sobre «Catálogo»: categorías con cantidad de diseños. */
function catalogFly() {
  const cats = CATEGORIES.filter((c) => !c.seasonal);
  const n = (id) => OBJECTS.filter((o) => categoriesOf(o).includes(id)).length;
  return `
        <div class="side-fly"><div class="side-fly-panel" role="group" aria-label="Categorías del catálogo">
          <a class="fly-link fly-all" href="/catalogo">${icon.grid}<span>Todo el catálogo</span></a>
          <span class="fly-title">Categorías</span>
          ${cats.map((c) => `<a class="fly-link" href="/catalogo?categoria=${c.id}"><span>${esc(c.label)}</span><small>${n(c.id)}</small></a>`).join('')}
          <span class="fly-sep" aria-hidden="true"></span>
          <span class="fly-title">Atajos</span>
          <a class="fly-link" href="/pedidos"><span>Pedilo impreso</span></a>
          <a class="fly-link" href="/galeria"><span>Así quedan impresos</span></a>
        </div></div>`;
}

/** Barra de íconos abajo (celular), con Crear en el centro. */
function tabBar(cur) {
  return `
  <nav class="tabbar" aria-label="Navegación">
    <a href="/"${cur('inicio')}>${icon.home}<span>Inicio</span></a>
    <a href="/galeria"${cur('galeria')}>${icon.gallery}<span>Galería</span></a>
    <a class="tab-create" href="/catalogo"${cur('catalogo')}><span class="tab-create-btn">${icon.plus}</span><span>Catálogo</span></a>
    <a href="/guias"${cur('guias')}>${icon.book}<span>Guías</span></a>
    <a href="/ayuda"${cur('ayuda')}>${icon.help}<span>Ayuda</span></a>
  </nav>`;
}

export function footer() {
  return `
  <footer class="site-footer">
    <div class="wrap foot">
      <div class="foot-brand">
        <a class="logo" href="/">${logo}</a>
        <p class="fine">Los archivos se generan en tu navegador. Revisalos siempre en tu laminador antes de imprimir.</p>
      </div>
      <nav class="foot-links" aria-label="Enlaces del sitio">
        <a href="/catalogo">Catálogo</a><a href="/guias">Guías</a><a href="/galeria">Galería</a><a href="/pedidos">Pedí impreso</a>${EVENTS.map((e) => `<a href="${e.path}">${esc(e.label)}</a>`).join('')}<a href="/ayuda">Preguntas</a><a href="/contacto">Contacto</a><a href="/acerca">Acerca de</a>
      </nav>
      <div class="foot-social" aria-label="Redes">
        <a href="https://www.instagram.com/${esc(SITE.instagram)}" target="_blank" rel="noopener">Instagram</a>
        <a href="https://www.tiktok.com/@${esc(SITE.instagram)}" target="_blank" rel="noopener">TikTok</a>
      </div>
      <p class="foot-legal">© ${new Date().getFullYear()} ${esc(SITE.name)} · <a href="/privacidad">Privacidad</a> · <a href="/condiciones">Condiciones de uso</a></p>
    </div>
  </footer>`;
}

export function bindHeader(root) {
  const btn = root.querySelector('#menu-btn'), nav = root.querySelector('#nav'), head = root.querySelector('.site-header');
  const close = root.querySelector('#nav-close');
  if (!btn || !nav) return;
  // En el celular el menú es un cuadro en el centro con el fondo oscurecido
  const set = (open) => {
    nav.classList.toggle('open', open);
    head?.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-lock', open);
    btn.setAttribute('aria-expanded', String(open));
    if (open) close?.focus({ preventScroll: true }); else if (document.activeElement && nav.contains(document.activeElement)) btn.focus({ preventScroll: true });
  };
  btn.addEventListener('click', () => set(!nav.classList.contains('open')));
  close?.addEventListener('click', () => set(false));
  nav.addEventListener('click', (e) => { if (e.target === nav || e.target.closest('a')) set(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) set(false); });
  matchMedia('(min-width: 821px)').addEventListener?.('change', (e) => { if (e.matches) set(false); });
}
