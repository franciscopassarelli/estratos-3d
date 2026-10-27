// Publicidad.
// - Sin ID de AdSense en src/config.js: se muestran espacios de prueba con la palabra ANUNCIO.
// - Con ID: bloques reales de AdSense. Los formatos de pantalla completa entre páginas
//   ("viñeta") y fijo en un borde ("anclado") se activan desde el panel de AdSense con
//   Anuncios automáticos; no se programan a mano porque AdSense no permite poner sus
//   anuncios en ventanas emergentes propias.
import { SITE, adsEnabled } from '../config.js';

const SIZES = { banner: '728 × 90 · 320 × 100 en celulares', inline: 'Formato adaptable' };

export function adSlot(kind) {
  const slot = SITE.adSlots[kind];
  // Con AdSense activo pero sin ID de bloque, no se dibuja nada: los Anuncios automáticos ubican los suyos.
  if (adsEnabled() && !slot) return '';
  if (adsEnabled()) {
    return `<div class="ad-wrap ad-wrap-${kind}"><span class="ad-label">Publicidad</span>
      <ins class="adsbygoogle" style="display:block" data-ad-client="${SITE.adsenseClient}" data-ad-slot="${slot}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
  }
  return `<aside class="ad ad-${kind}" aria-label="Espacio publicitario"><b>ANUNCIO</b><small>${SIZES[kind]}</small></aside>`;
}

/** Carga el script de AdSense una sola vez (también habilita los Anuncios automáticos). */
export function loadAdsense() {
  if (!adsEnabled() || document.querySelector('script[src*="adsbygoogle.js"]')) return;
  const s = document.createElement('script');
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${SITE.adsenseClient}`;
  document.head.appendChild(s);
}

/** Pide un anuncio para cada bloque nuevo de la página. */
export function activateAds(root) {
  if (!adsEnabled()) return;
  root.querySelectorAll('ins.adsbygoogle:not([data-queued])').forEach((ins) => {
    ins.setAttribute('data-queued', '');
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch { /* bloqueador de anuncios */ }
  });
}
