// Arranque de la app: estilos, enrutador y montaje de cada vista.
import './styles.css';
import { header, footer, bindHeader } from './ui/layout.js';
import { renderThumbnails } from './ui/thumbnails.js';
import { loadAdsense, activateAds } from './ui/ads.js';
import { startRouter, currentLocation } from './router.js';
import { resolve } from './routes.js';
import { SITE } from './config.js';
import { trackPage } from './ui/analytics.js';

const app = document.getElementById('app');
let cleanup = () => {};
let firstRender = true;

function setMeta(meta, path) {
  document.title = meta.title;
  let robots = document.head.querySelector('meta[name="robots"]');
  if (meta.noindex) { if (!robots) { robots = document.createElement('meta'); robots.name = 'robots'; document.head.appendChild(robots); } robots.content = 'noindex'; }
  else robots?.remove();
  const set = (sel, attr, value) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, value); };
  set('meta[name="description"]', 'content', meta.description || '');
  set('link[rel="canonical"]', 'href', SITE.url + (path === '/' ? '/' : path));
}

function render() {
  cleanup();
  const { path, query, fragment } = currentLocation();
  const { route, params } = resolve(path);
  // Las páginas sin publicidad no pueden quedar con el script de anuncios cargado.
  if (route.noAds && !firstRender && document.querySelector('script[src*="adsbygoogle.js"]')) { location.reload(); return; }
  app.innerHTML = header(route.section) + route.render(params, query) + footer();
  bindHeader(app);
  cleanup = route.mount(app, params, query) || (() => {});
  setMeta(route.meta(params), path);
  if (!route.noAds) { loadAdsense(); activateAds(app); }
  trackPage(path, location.search);
  if (fragment) document.getElementById(fragment)?.scrollIntoView({ block: 'start' });
  else if (!firstRender) window.scrollTo(0, 0);
  firstRender = false;
}

startRouter(render);
renderThumbnails();
