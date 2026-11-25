// Tienda: tarjetas de producto, página /tienda y ficha /tienda/<id>.
import { TIENDA, productos, getProducto } from '../content/tienda.js';
import FOTOS from '../content/tienda-fotos.js';
import { generalOrderLink } from '../content/contact.js';
import { esc, icon, $ } from './dom.js';

export const peso = (n) => '$' + Math.round(n).toLocaleString('es-AR');
export const fotosDe = (p) => (FOTOS[p.id] || []).map(([f, w, h]) => ({ src: `/tienda/${f}`, chica: `/tienda/${f.replace(/\.webp$/, '-chica.webp')}`, w, h }));
const precioTxt = (p) => (p.precio ? peso(p.precio) : 'Consultá el precio');
const pedirLink = (p, color = '') => generalOrderLink(`¡Hola! Quiero comprar: ${p.nombre}${color ? ` (${color})` : ''}. Lo vi en la web de Estratos 3D.`);

const WA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12.04 2a9.9 9.9 0 0 0-8.46 15.03L2 22l5.1-1.34A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 0 16.2 8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.02.8.81-2.94-.2-.31A8.1 8.1 0 0 1 12.04 3.8zM8.6 7.6c-.2 0-.5.07-.76.35-.26.29-1 1-1 2.43s1.03 2.82 1.17 3.01c.15.2 2.03 3.23 5 4.4 2.47.97 2.97.78 3.5.73.54-.05 1.73-.7 1.97-1.39.24-.68.24-1.27.17-1.39-.07-.12-.27-.2-.56-.34-.3-.15-1.73-.86-2-.95-.27-.1-.47-.15-.66.14-.2.3-.76.95-.93 1.15-.17.2-.34.22-.64.07a7.9 7.9 0 0 1-2.33-1.44 8.7 8.7 0 0 1-1.6-2c-.17-.3 0-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.49.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.57-.48-.5-.66-.5z"/></svg>';

export function tiendaCard(p, eager = false) {
  const f = fotosDe(p)[0];
  const img = f ? `<img src="${esc(f.chica)}" srcset="${esc(f.chica)} 640w, ${esc(f.src)} ${f.w}w" sizes="(max-width: 560px) 46vw, 280px" width="${f.w}" height="${f.h}" alt="${esc(p.nombre)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async">` : '';
  return `<article class="sp-card">
    <a class="sp-foto" href="/tienda/${esc(p.id)}" aria-label="Ver ${esc(p.nombre)}">${img}</a>
    <div class="sp-info">
      <h3><a href="/tienda/${esc(p.id)}">${esc(p.nombre)}</a></h3>
      <div class="sp-precio"><b${p.precio ? '' : ' class="sp-consulta"'}>${precioTxt(p)}</b>${p.mayor ? `<small>${esc(peso(p.mayor.precio))} c/u desde ${p.mayor.desde} unidades</small>` : ''}</div>
      <a class="btn btn-order sp-pedir" data-order="tienda" data-objeto="${esc(p.nombre)}" href="${esc(pedirLink(p))}" target="_blank" rel="noopener">${WA} Comprar</a>
    </div>
  </article>`;
}

const COMO = `
  <ol class="sp-steps">
    <li><b>1 · Elegí</b><span>Mirá los productos y los colores disponibles.</span></li>
    <li><b>2 · Escribinos</b><span>Tocá «Comprar» y se abre WhatsApp con el producto ya escrito.</span></li>
    <li><b>3 · Coordinamos</b><span>Confirmamos color, pago y entrega.</span></li>
    <li><b>4 · Lo imprimimos</b><span>Lo recibís en ${esc(TIENDA.plazo)} desde que confirmás.</span></li>
  </ol>`;

const MAYOR = () => {
  const m = productos().filter((p) => p.mayor);
  return m.length ? `<section class="sp-band"><div><h2>¿Comprás varias unidades?</h2><p>Precio por mayor: ${m.map((p) => `${esc(p.nombre)} a ${peso(p.mayor.precio)} c/u desde ${p.mayor.desde} unidades`).join(' · ')}. También hacemos tandas para negocios y regalos corporativos.</p></div><a class="btn btn-order btn-lg" data-order="tienda_mayor" href="${esc(generalOrderLink('¡Hola! Quiero consultar por una compra por mayor.'))}" target="_blank" rel="noopener">Consultar por mayor</a></section>` : '';
};

const MEDIDA = `
  <section class="sp-medida">
    <div>
      <h2>¿Querés algo distinto?</h2>
      <p>Diseñá tu propio objeto en la web (llaveros con nombre, carteles, organizadores…) y pedínoslo impreso: te llega el link con tus ajustes por WhatsApp.</p>
    </div>
    <a class="btn btn-lg btn-soft" href="/catalogo">Diseñá el tuyo ${icon.arrow}</a>
  </section>`;

export function tiendaPage() {
  const list = productos();
  const cats = TIENDA.categorias.map((c) => ({ ...c, items: list.filter((p) => p.categoria === c.id) })).filter((c) => c.items.length);
  const sueltos = list.filter((p) => !TIENDA.categorias.some((c) => c.id === p.categoria));
  if (sueltos.length) cats.push({ id: 'otros', titulo: 'Otros', items: sueltos });
  return `
  <main class="wrap shop-page">
    <header class="sp-head">
      <span class="eyebrow">Tienda</span>
      <h1>Productos impresos en 3D</h1>
      <p>Diseñados e impresos por nosotros. Elegí el que te guste y comprá por WhatsApp.</p>
    </header>
    ${cats.length > 1 ? `<div class="pp-tabs" role="group" aria-label="Categorías"><button type="button" data-cat="" aria-pressed="true">Todo <small>${list.length}</small></button>${cats.map((c) => `<button type="button" data-cat="${esc(c.id)}" aria-pressed="false">${esc(c.titulo)} <small>${c.items.length}</small></button>`).join('')}</div>` : ''}
    ${list.length ? cats.map((c) => `<section class="sp-group" data-cat="${esc(c.id)}" aria-label="${esc(c.titulo)}">${cats.length > 1 ? `<h2>${esc(c.titulo)}</h2>` : ''}<div class="sp-grid">${c.items.map((p, i) => tiendaCard(p, i < 2)).join('')}</div></section>`).join('') : '<p class="empty">Estamos cargando los productos.</p>'}
    <p class="note sp-note">Precios por unidad, actualizados en ${esc(TIENDA.actualizado)}. Confirmamos el valor final por WhatsApp antes de imprimir.</p>
    ${MAYOR()}
    <section class="sp-como"><h2>Cómo comprar</h2>${COMO}</section>
    ${MEDIDA}
  </main>`;
}

export function productoPage(id) {
  const p = getProducto(id);
  const fs = fotosDe(p);
  const otros = productos().filter((x) => x.id !== p.id && x.categoria === p.categoria).slice(0, 4);
  const colores = p.colores || [];
  return `
  <main class="wrap shop-page sp-detail">
    <nav class="sp-crumbs" aria-label="Ubicación"><a href="/tienda">Tienda</a> <span aria-hidden="true">/</span> <span>${esc(p.nombre)}</span></nav>
    <div class="sp-layout">
      <div class="sp-gallery">
        ${fs.length ? `<div class="sp-main" id="sp-main">
          <div class="sp-track" id="sp-track" tabindex="0" aria-label="Fotos de ${esc(p.nombre)}">${fs.map((f, i) => `<div class="sp-slide"><img src="${esc(i === 0 ? f.src : f.chica)}"${i ? ` data-full="${esc(f.src)}"` : ''} width="${f.w}" height="${f.h}" alt="${esc(p.nombre)}${fs.length > 1 ? `, foto ${i + 1}` : ''}" decoding="async"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}></div>`).join('')}</div>
          ${fs.length > 1 ? `<span class="sp-count" id="sp-count" aria-hidden="true">1 / ${fs.length}</span><div class="sp-dots" id="sp-dots" aria-hidden="true">${fs.map((_, i) => `<i${i === 0 ? ' class="on"' : ''}></i>`).join('')}</div>` : ''}
        </div>` : ''}
        ${fs.length > 1 ? `<div class="sp-thumbs">${fs.map((f, i) => `<button type="button" data-i="${i}" aria-label="Ver foto ${i + 1}" aria-pressed="${i === 0}"><img src="${esc(f.chica)}" width="72" height="72" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
      </div>
      <div class="sp-buy">
        <h1>${esc(p.nombre)}</h1>
        <div class="sp-precio sp-precio-big"><b${p.precio ? '' : ' class="sp-consulta"'}>${precioTxt(p)}</b>${p.mayor ? `<small>${esc(peso(p.mayor.precio))} c/u llevando ${p.mayor.desde} o más</small>` : ''}</div>
        <p class="sp-desc">${esc(p.descripcion || '')}</p>
        ${colores.length ? `<fieldset class="sp-colores"><legend>Color</legend>${colores.map((c, i) => `<label><input type="radio" name="color" value="${esc(c)}"${i === 0 ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('')}</fieldset>` : ''}
        <a class="btn btn-order btn-lg sp-comprar" id="sp-comprar" data-order="tienda_ficha" data-objeto="${esc(p.nombre)}" href="${esc(pedirLink(p, colores[0] || ''))}" target="_blank" rel="noopener">${WA} Comprar por WhatsApp</a>
        ${p.detalles?.length ? `<div class="sp-incluye"><h2>Detalles</h2><ul class="sp-detalles">${p.detalles.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}
        <p class="sp-entrega">Impreso a pedido · Lo recibís en ${esc(p.plazo || TIENDA.plazo)} desde que confirmás.</p>
      </div>
    </div>
    ${otros.length ? `<section class="sp-group"><h2>También te puede gustar</h2><div class="sp-grid">${otros.map((x) => tiendaCard(x)).join('')}</div></section>` : ''}
    ${MAYOR()}
    <div class="sp-sticky" role="region" aria-label="Comprar">
      <div class="sp-sticky-precio"><b${p.precio ? '' : ' class="sp-consulta"'}>${precioTxt(p)}</b>${p.mayor ? `<small>${esc(peso(p.mayor.precio))} desde ${p.mayor.desde}</small>` : ''}</div>
      <a class="btn btn-order sp-sticky-btn" id="sp-comprar-bar" data-order="tienda_ficha_barra" data-objeto="${esc(p.nombre)}" href="${esc(pedirLink(p, colores[0] || ''))}" target="_blank" rel="noopener">${WA} Comprar por WhatsApp</a>
    </div>
  </main>`;
}

export function mountTienda(root, id) {
  const offs = [];
  const on = (el, ev, fn) => { if (!el) return; el.addEventListener(ev, fn); offs.push(() => el.removeEventListener(ev, fn)); };
  // Filtro por categoría
  const tabs = $('.pp-tabs', root);
  on(tabs, 'click', (e) => {
    const b = e.target.closest('button[data-cat]');
    if (!b) return;
    tabs.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    root.querySelectorAll('.sp-group[data-cat]').forEach((g) => { g.hidden = !!b.dataset.cat && g.dataset.cat !== b.dataset.cat; });
  });
  // Ficha: fotos y color
  const p = id ? getProducto(id) : null;
  if (p) {
    const track = $('#sp-track', root), thumbs = $('.sp-thumbs', root), count = $('#sp-count', root), dots = $('#sp-dots', root);
    const n = track ? track.children.length : 0;
    const mark = (i) => {
      thumbs?.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-pressed', String(k === i)));
      dots?.querySelectorAll('i').forEach((x, k) => x.classList.toggle('on', k === i));
      if (count) count.textContent = `${i + 1} / ${n}`;
    };
    // Las fotos grandes se bajan recién cuando se acerca el usuario
    const loadFull = (i) => { const im = track.children[i]?.querySelector('img[data-full]'); if (im) { im.src = im.dataset.full; im.removeAttribute('data-full'); } };
    if (track && n > 1) {
      let t = 0;
      on(track, 'scroll', () => {
        cancelAnimationFrame(t);
        t = requestAnimationFrame(() => { const i = Math.round(track.scrollLeft / track.clientWidth); mark(i); loadFull(i); loadFull(i + 1); });
      });
      loadFull(1);
    }
    on(thumbs, 'click', (e) => {
      const b = e.target.closest('button[data-i]');
      if (!b || !track) return;
      const i = Number(b.dataset.i);
      loadFull(i);
      track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
      mark(i);
    });
    const bars = [$('#sp-comprar', root), $('#sp-comprar-bar', root)].filter(Boolean);
    on($('.sp-colores', root), 'change', (e) => { if (e.target.name === 'color') bars.forEach((a) => { a.href = pedirLink(p, e.target.value); }); });
  }
  return () => offs.forEach((f) => f());
}
