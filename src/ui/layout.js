import { icon, esc } from './dom.js';
import { SITE } from '../config.js';

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
      <a class="btn btn-primary btn-sm header-cta" href="/catalogo">${icon.plus} Crear un objeto</a>
    </div>
  </header>`;
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
