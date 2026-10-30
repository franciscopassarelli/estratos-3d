import { icon, esc } from './dom.js';
import { SITE } from '../config.js';
import { featuredPromo } from '../content/promos.js';

const logo = `<span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>Estratos <small>3D</small></span>`;

export function header(section) {
  const cur = (r) => (section === r ? ' aria-current="page"' : '');
  return `
  <header class="site-header">
    <div class="wrap">
      <a class="logo" href="/" aria-label="${esc(SITE.name)}, inicio">${logo}</a>
      <button class="icon-btn menu-btn" id="menu-btn" aria-label="Abrir menú" aria-expanded="false">${icon.menu}</button>
      <nav class="nav" id="nav">
        <a href="/"${cur('inicio')}>Inicio</a>
        <a href="/catalogo"${cur('catalogo')}>Catálogo</a>
        <a href="/guias"${cur('guias')}>Guías</a>
        <a href="/galeria"${cur('galeria')}>Galería</a>
        <a href="/ayuda"${cur('ayuda')}>Ayuda</a>
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
    <nav class="side-links">
      <a href="/"${cur('inicio')}>${icon.home}<span>Inicio</span></a>
      <a href="/galeria"${cur('galeria')}>${icon.gallery}<span>Galería</span></a>
      <a href="/guias"${cur('guias')}>${icon.book}<span>Guías</span></a>
      <a href="/ayuda"${cur('ayuda')}>${icon.help}<span>Ayuda</span></a>
    </nav>
    ${promo ? `<div class="side-bottom"><a class="side-promo" href="/sorteos/${esc(promo.slug)}" title="${esc(promo.title)}">${icon.gift}<span>Sorteo</span><i class="side-dot" aria-hidden="true"></i></a></div>` : ''}
  </aside>`;
}

/** Barra de íconos abajo (celular), con Crear en el centro. */
function tabBar(cur) {
  return `
  <nav class="tabbar" aria-label="Navegación">
    <a href="/"${cur('inicio')}>${icon.home}<span>Inicio</span></a>
    <a href="/galeria"${cur('galeria')}>${icon.gallery}<span>Galería</span></a>
    <a class="tab-create" href="/catalogo"${cur('catalogo')}><span class="tab-create-btn">${icon.plus}</span><span>Crear</span></a>
    <a href="/guias"${cur('guias')}>${icon.book}<span>Guías</span></a>
    <a href="/ayuda"${cur('ayuda')}>${icon.help}<span>Ayuda</span></a>
  </nav>`;
}

export function footer() {
  return `
  <footer class="site-footer">
    <div class="wrap">
      <div>
        <a class="logo" href="/">${logo}</a>
        <p class="fine">Los archivos se generan en tu navegador a partir de tus medidas. Revisalos siempre en tu laminador antes de imprimir.</p>
      </div>
      <div>
        <h4>Herramienta</h4>
        <ul><li><a href="/catalogo">Catálogo</a></li><li><a href="/#como-funciona">Cómo funciona</a></li><li><a href="/guias">Guías</a></li><li><a href="/galeria">Galería</a></li><li><a href="/acerca">Acerca de</a></li></ul>
      </div>
      <div>
        <h4>Ayuda</h4>
        <ul><li><a href="/ayuda">Preguntas frecuentes</a></li><li><a href="/contacto">Contacto</a></li></ul>
      </div>
      <div>
        <h4>Legal</h4>
        <ul><li><a href="/privacidad">Política de privacidad</a></li><li><a href="/condiciones">Condiciones de uso</a></li></ul>
      </div>
    </div>
  </footer>`;
}

export function bindHeader(root) {
  const btn = root.querySelector('#menu-btn'), nav = root.querySelector('#nav');
  btn?.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
  });
  nav?.addEventListener('click', (e) => { if (e.target.closest('a')) nav.classList.remove('open'); });
}
