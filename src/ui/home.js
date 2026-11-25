import { featuredPromo } from '../content/promos.js';
import { esc, icon } from './dom.js';
import { galleryItems } from '../content/gallery.js';
import { activeEvent } from '../content/events.js';
import { galleryCard } from './pages.js';
import { bindLightbox } from './lightbox.js';
import { generalOrderLink } from '../content/contact.js';
import { TIENDA, destacados, productos } from '../content/tienda.js';
import { tiendaCard, fotosDe, peso } from './tienda.js';
import { OBJECTS } from '../objects/index.js';

export function homePage() {
  const dest = destacados().slice(0, 8);
  const collage = dest.filter((p) => fotosDe(p).length).slice(0, 3);
  const mayor = productos().find((p) => p.mayor);
  return `
  <main>
    <section class="hero hero-shop">
      <div class="wrap">
        <div class="hero-copy">
          <span class="eyebrow">Impresión 3D</span>
          <h1>Lámparas y objetos <span>impresos en 3D.</span></h1>
          <p class="lead">Diseñamos e imprimimos cada pieza. Elegí la que te guste, escribinos por WhatsApp y coordinamos color, pago y entrega.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg btn-cta" href="/tienda">${icon.bag} Ver la tienda</a>
            <a class="btn btn-lg btn-order" data-order="home_hero" href="${esc(generalOrderLink())}" target="_blank" rel="noopener">Consultar<span class="hide-m"> por WhatsApp</span></a>
          </div>
          <div class="hero-facts"><span>Impreso a pedido</span><span>Elegís el <b>color</b></span>${mayor ? '<span><b>Precio por mayor</b></span>' : ''}</div>
        </div>
        ${collage.length ? `<div class="shop-collage" aria-label="Productos destacados">${collage.map((p, i) => {
          const f = fotosDe(p)[0];
          return `<a class="sc-item sc-${i}" href="/tienda/${esc(p.id)}"><img src="${esc(i === 0 ? f.src : f.chica)}" width="${f.w}" height="${f.h}" alt="${esc(p.nombre)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><span>${esc(p.nombre)}</span></a>`;
        }).join('')}</div>` : ''}
      </div>
    </section>

    <section class="section wrap" aria-labelledby="shop-title">
      <div class="section-head">
        <div><span class="eyebrow">Tienda</span><h2 id="shop-title">Lo que tenemos para vos</h2></div>
        <a class="btn btn-soft btn-more hide-m" href="/tienda">Ver toda la tienda ${icon.arrow}</a>
      </div>
      <div class="sp-grid">${dest.map((p, i) => tiendaCard(p, i < 2)).join('')}</div>
      <a class="btn btn-soft btn-lg show-m sp-all" href="/tienda">Ver toda la tienda ${icon.arrow}</a>
    </section>

    ${(() => { const ev = activeEvent(); return ev ? `<div class="wrap"><a class="event-banner" href="${ev.path}"><span class="event-banner-icon">${icon.tree}</span><span><b>Especial ${esc(ev.label)}</b><span>${esc(ev.aviso)}</span></span>${icon.arrow}</a></div>` : ''; })()}
    ${(() => { const p = featuredPromo(); return p ? `<div class="wrap"><a class="promo-banner" href="/sorteos/${esc(p.slug)}"><span class="promo-banner-tag">Sorteo</span><span><b>${esc(p.title)}</b><span>Anotate gratis y participá por premios impresos en 3D.</span></span>${icon.arrow}</a></div>` : ''; })()}


    <div class="wrap"><section class="sp-band">
      <div>
        <h2>${mayor ? '¿Comprás varias unidades?' : '¿Buscás algo en particular?'}</h2>
        <p>${mayor ? `Tenemos precio por mayor: por ejemplo, ${esc(mayor.nombre)} a ${peso(mayor.mayor.precio)} c/u desde ${mayor.mayor.desde} unidades. También hacemos tandas para negocios y regalos.` : 'Contanos qué necesitás y te pasamos precio y plazo.'}</p>
      </div>
      <a class="btn btn-order btn-lg" data-order="home_mayor" href="${esc(generalOrderLink('¡Hola! Quiero consultar por una compra por mayor.'))}" target="_blank" rel="noopener">Consultar por WhatsApp</a>
    </section></div>

    ${(() => { const g = galleryItems().filter((x) => x.categoria !== 'proceso').slice(0, 4); return g.length ? `
    <section class="section wrap" aria-labelledby="gal-title">
      <div class="section-head">
        <div><span class="eyebrow">Trabajos</span><h2 id="gal-title">Así quedan impresos</h2></div>
        <a class="btn btn-soft btn-more" href="/galeria">Ver todos los trabajos ${icon.arrow}</a>
      </div>
      <div class="gallery gallery-home">${g.map((x) => galleryCard(x)).join('')}</div>
    </section>` : ''; })()}

    <section class="section wrap" id="como-comprar" aria-labelledby="how-title">
      <div class="section-head"><div><span class="eyebrow">Cómo comprar</span><h2 id="how-title">Simple y por WhatsApp</h2></div></div>
      <ol class="sp-steps">
        <li><b>1 · Elegí</b><span>Mirá los productos y los colores disponibles.</span></li>
        <li><b>2 · Escribinos</b><span>Tocá «Comprar» y se abre WhatsApp con el producto ya escrito.</span></li>
        <li><b>3 · Coordinamos</b><span>Confirmamos color, pago y entrega.</span></li>
        <li><b>4 · Lo imprimimos</b><span>Lo recibís en ${esc(TIENDA.plazo)} desde que confirmás.</span></li>
      </ol>
    </section>

    <div class="wrap"><section class="sp-medida">
      <div>
        <h2>¿Querés diseñar el tuyo?</h2>
        <p>Personalizá llaveros, carteles, organizadores y más (${OBJECTS.length} diseños) con vista previa en 3D. Descargá el archivo o pedinos que lo imprimamos.</p>
      </div>
      <a class="btn btn-lg btn-soft" href="/catalogo">Diseñá el tuyo ${icon.arrow}</a>
    </section></div>
  </main>`;
}

export function mountHome(root) {
  return bindLightbox(root);
}
