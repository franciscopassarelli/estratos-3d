// Navegación sin recargar la página.
// - Modo normal: rutas reales (/catalogo, /crear/llavero…) con la History API. Cada ruta
//   además existe como HTML estático generado en el build (ver tools/prerender.mjs).
// - Modo hash: solo para la versión empaquetada como artifact, donde no hay rutas de servidor.
/* global __HASH_ROUTER__ */
const HASH = typeof __HASH_ROUTER__ !== 'undefined' && __HASH_ROUTER__;

let onChange = () => {};
let pendingFragment = '';

export function currentLocation() {
  if (HASH) {
    const h = decodeURIComponent(location.hash.slice(1));
    const fragment = pendingFragment;
    pendingFragment = '';
    return { path: '/' + h.replace(/--/g, '/'), query: new URLSearchParams(), fragment };
  }
  return { path: location.pathname.replace(/\/+$/, '') || '/', query: new URLSearchParams(location.search), fragment: location.hash.slice(1) };
}

export function navigate(href, { replace = false } = {}) {
  const u = new URL(href, location.origin);
  if (HASH) {
    const h = '#' + u.pathname.slice(1).replace(/\/+$/, '').replace(/\//g, '--');
    pendingFragment = u.hash.slice(1);
    if (location.hash === h) onChange(); else location.hash = h;
    return;
  }
  const target = u.pathname + u.search + u.hash;
  if (target === location.pathname + location.search + location.hash) { onChange(); return; }
  history[replace ? 'replaceState' : 'pushState']({}, '', target);
  onChange();
}

export function startRouter(handler) {
  onChange = handler;
  window.addEventListener(HASH ? 'hashchange' : 'popstate', () => handler());
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === '_blank' || a.hasAttribute('download')) return;
    const href = a.getAttribute('href');
    if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/api/')) return;
    e.preventDefault();
    const u = new URL(href, location.origin);
    // Enlace a una sección de la misma página
    if (!HASH && u.pathname === location.pathname && u.hash && !u.search) {
      history.pushState({}, '', u.hash);
      document.getElementById(u.hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate(href);
  });
  // Compatibilidad con enlaces viejos (#editor-llavero, #catalogo…)
  if (!HASH && location.hash && location.pathname === '/') {
    const old = location.hash.slice(1);
    const map = { catalogo: '/catalogo', faq: '/ayuda', acerca: '/acerca', contacto: '/contacto', condiciones: '/condiciones', inicio: '/' };
    if (old.startsWith('editor-')) history.replaceState({}, '', `/crear/${old.slice(7)}`);
    else if (map[old]) history.replaceState({}, '', map[old]);
  }
  handler();
}
