// Arranque de la app: estilos, enrutador y montaje de cada vista.
import './styles.css';
import { header, footer, bindHeader } from './ui/layout.js';
import { renderThumbnails } from './ui/thumbnails.js';
import { loadAdsense, activateAds } from './ui/ads.js';
import { startRouter, currentLocation } from './router.js';
import { resolve } from './routes.js';
import { SITE } from './config.js';

const app = document.getElementById('app');
let cleanup = () => {};
let firstRender = true;

function setMeta(meta, path) {
  document.title = meta.title;
  const set = (sel, attr, value) => { const el = document.head.querySelector(sel); if (el) el.setAttribute(attr, value); };
  set('meta[name="description"]', 'content', meta.description || '');
  set('link[rel="canonical"]', 'href', SITE.url + (path === '/' ? '/' : path));
}

function render() {
  cleanup();
  const { path, query, fragment } = currentLocation();
  const { route, params } = resolve(path);
  app.innerHTML = header(route.section) + route.render(params, query) + footer();
  bindHeader(app);
  cleanup = route.mount(app, params) || (() => {});
  setMeta(route.meta(params), path);
  activateAds(app);
  if (fragment) document.getElementById(fragment)?.scrollIntoView({ block: 'start' });
  else if (!firstRender) window.scrollTo(0, 0);
  firstRender = false;
}

loadAdsense();
startRouter(render);
renderThumbnails();
