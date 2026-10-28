// Google Analytics 4 con Consent Mode v2.
// - En el Espacio Económico Europeo, el Reino Unido y Suiza todo arranca denegado (sin cookies)
//   hasta que haya un mensaje de consentimiento; en el resto se miden las visitas normalmente.
// - Es una SPA: cada cambio de página se envía a mano como page_view.
import { SITE, analyticsEnabled } from '../config.js';

const CONSENT_REGIONS = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'IS', 'LI', 'NO', 'GB', 'CH'];
let ready = false;
let lastPath = '';

function init() {
  if (ready || !analyticsEnabled()) return ready;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  const denied = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied', region: CONSENT_REGIONS };
  window.gtag('consent', 'default', denied);
  window.gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
  window.gtag('js', new Date());
  window.gtag('config', SITE.gaId, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(SITE.gaId)}`;
  document.head.appendChild(s);
  ready = true;
  return ready;
}

/** Registra una vista de página (no se mide el panel privado). */
export function trackPage(path, search = '') {
  if (path.startsWith('/admin') || !init()) return;
  const full = path + search;
  if (full === lastPath) return;
  lastPath = full;
  window.gtag('event', 'page_view', { page_location: location.origin + full, page_path: full, page_title: document.title });
}

/** Evento propio, por ejemplo una descarga. */
export function trackEvent(name, params = {}) {
  if (!init()) return;
  window.gtag('event', name, params);
}
