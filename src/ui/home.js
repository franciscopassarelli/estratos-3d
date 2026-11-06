import { OBJECTS, MAIN_OBJECTS, CATEGORIES, categoriesOf, getObject } from '../objects/index.js';
import { Viewer, webglAvailable } from '../viewer/Viewer.js';
import { buildModel, disposeModel } from '../core/pipeline.js';
import { card, bindThumbs, bindCarousels } from './catalog.js';
import { bindPreview } from './preview.js';
import { adSlot } from './ads.js';
import { featuredPromo } from '../content/promos.js';
import { esc, icon, $ } from './dom.js';
import { galleryItems } from '../content/gallery.js';
import { activeEvent } from '../content/events.js';
import { galleryCard } from './pages.js';
import { bindLightbox } from './lightbox.js';
import { generalOrderLink } from '../content/contact.js';
import { THUMB_VERSION } from '../content/thumbs.js';

const SHOWCASE = ['lampara-led', 'porta-capsulas', 'botellero', 'tachito-tapa', 'llavero-articulado', 'organizador-labiales', 'caja-panuelos', 'soporte-celular'];
const SHOWCASE_LABEL = 'Ejemplos del catálogo';
// «Inspirate»: atajos con miniatura debajo de los botones del inicio
const INSPIRE = [
  { label: 'Lámparas', sub: 'con luz LED', obj: 'lampara-led', href: '/catalogo?categoria=hogar&tipo=lamparas' },
  { label: 'Organizadores', sub: 'escritorio y casa', obj: 'organizador-labiales', href: '/catalogo?categoria=organizacion' },
  { label: 'Llaveros', sub: 'con tu nombre', obj: 'llavero-articulado', href: '/catalogo?categoria=accesorios' },
  { label: 'Gaming', sub: 'soportes y mandos', obj: 'soporte-mandos', href: '/catalogo?categoria=tecnologia' },
  { label: 'Para negocios', sub: 'carteles con QR', obj: 'display-qr', href: '/catalogo?categoria=negocios' },
];
const thumbUrl = (id) => `/miniaturas/${id}.webp?v=${THUMB_VERSION}`;
// Pestañas de «Diseños listos para personalizar»
const TABS = [{ id: 'rec', label: 'Recomendados' }, { id: 'hogar', label: 'Hogar' }, { id: 'organizacion', label: 'Organización' }, { id: 'accesorios', label: 'Accesorios' }, { id: 'tecnologia', label: 'Gaming y tecnología' }, { id: 'negocios', label: 'Negocios' }];
const TAB_MAX = 8;
function tabbedDesigns() {
  const byTab = Object.fromEntries(TABS.map((t) => [t.id, t.id === 'rec' ? FEATURED.map(getObject).filter(Boolean) : MAIN_OBJECTS.filter((o) => categoriesOf(o).includes(t.id)).slice(0, TAB_MAX)]));
  const all = new Map();
  for (const t of TABS) for (const d of byTab[t.id]) { if (!all.has(d.id)) all.set(d.id, { d, tabs: [] }); all.get(d.id).tabs.push(t.id); }
  return [...all.values()];
}

const FEATURED = ['lampara-led', 'porta-capsulas', 'botellero', 'tachito-tapa', 'llavero-articulado', 'organizador-labiales', 'caja-panuelos', 'soporte-celular'];

export function homePage() {
  return `
  <main>
    <section class="hero">
      <div class="wrap">
        <div class="hero-copy">
          <span class="eyebrow">Generador gratis para impresión 3D</span>
          <h1>Objetos para imprimir en 3D, <span>hechos a tu medida.</span></h1>
          <p class="lead">Elegí un diseño, escribí tu nombre o ajustá las medidas y descargá el archivo listo para tu impresora. Gratis y sin saber modelar.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg btn-cta" href="/catalogo">${icon.plus} Ver el catálogo</a>
            <a class="btn btn-lg btn-soft" href="/#como-funciona">Cómo funciona ${icon.chevron}</a>
          </div>
          <div class="inspire" aria-label="Inspirate">
            <span class="inspire-title">Inspirate</span>
            <div class="inspire-row">
              ${INSPIRE.map((i) => `<a class="inspire-pill" href="${i.href}"><img src="${thumbUrl(i.obj)}" alt="" width="40" height="40" loading="lazy" decoding="async"><span><b>${esc(i.label)}</b><small>${esc(i.sub)}</small></span></a>`).join('')}
            </div>
          </div>
          <div class="hero-facts"><span><b>${MAIN_OBJECTS.length}</b> diseños editables</span><span>Descarga en <b>3MF · STL · OBJ</b></span><span>Sin registrarte</span></div>
          <a class="hero-print" href="/pedidos">¿No tenés impresora? <b>Pedilo impreso</b> ${icon.arrow}</a>
        </div>
        <div class="demo demo-mini">
          <div class="demo-stage" id="demo-stage"><span class="tag"><span class="dot"></span>Vista 3D en vivo</span></div>
          <div class="demo-form demo-show">
            <div class="show-info">
              <span class="eyebrow" id="show-cat">${esc(SHOWCASE_LABEL)}</span>
              <b id="show-name">${esc(getObject(SHOWCASE[0])?.name || '')}</b>
            </div>
            <div class="show-dots" id="show-dots" role="tablist" aria-label="Objetos de ejemplo"></div>
            <a class="btn btn-primary" id="demo-go" href="/crear/${SHOWCASE[0]}">Personalizar este ${icon.arrow}</a>
          </div>
        </div>
      </div>
    </section>

    ${(() => { const ev = activeEvent(); return ev ? `<div class="wrap"><a class="event-banner" href="${ev.path}"><span class="event-banner-icon">${icon.tree}</span><span><b>Especial ${esc(ev.label)}</b><span>${esc(ev.aviso)}</span></span>${icon.arrow}</a></div>` : ''; })()}
    ${(() => { const p = featuredPromo(); return p ? `<div class="wrap"><a class="promo-banner" href="/sorteos/${esc(p.slug)}"><span class="promo-banner-tag">Sorteo</span><span><b>${esc(p.title)}</b><span>Anotate gratis y participá por premios impresos en 3D.</span></span>${icon.arrow}</a></div>` : ''; })()}

    <section class="section wrap" aria-labelledby="pop-title">
      <div class="section-head">
        <div><span class="eyebrow">Los más elegidos</span><h2 id="pop-title">Diseños listos para personalizar</h2></div>
        <a class="btn btn-soft btn-more" id="feat-more" href="/catalogo">Ver catálogo completo ${icon.arrow}</a>
      </div>
      <div class="feat-tabs" role="tablist" aria-label="Filtrar diseños">
        ${TABS.map((t, i) => `<button type="button" role="tab" data-tab="${t.id}" aria-selected="${i === 0}">${esc(t.label)}</button>`).join('')}
      </div>
      <div class="cards cards-featured" id="feat-cards">${tabbedDesigns().map(({ d, tabs }) => `<div class="fcard" data-tabs="${tabs.join(' ')}"${tabs.includes('rec') ? '' : ' hidden'}>${card(d)}</div>`).join('')}</div>
    </section>

    <section class="section wrap" aria-labelledby="cats-title">
      <div class="section-head"><div><span class="eyebrow">Explorá por tipo</span><h2 id="cats-title">Encontrá lo que necesitás imprimir</h2></div></div>
      <div class="cat-grid">
        ${CATEGORIES.map((c) => {
          const n = OBJECTS.filter((o) => categoriesOf(o).includes(c.id)).length;
          return `<a class="cat" href="/catalogo?categoria=${c.id}"><span class="count ${n ? '' : 'soon'}">${n ? `${n} ${n === 1 ? 'diseño' : 'diseños'}` : 'Próximamente'}</span><h3>${esc(c.label)}</h3><p>${esc(c.blurb)}</p></a>`;
        }).join('')}
      </div>
    </section>

    <div class="wrap"><section class="order-band" aria-labelledby="order-title">
      <div>
        <h2 id="order-title">¿No tenés impresora 3D?</h2>
        <p>Descargá el archivo y llevalo a imprimir, o pedinos la pieza ya impresa por WhatsApp.</p>
      </div>
      <div class="order-band-actions"><a class="btn btn-order btn-lg" data-order="home" href="${generalOrderLink()}" target="_blank" rel="noopener">Pedir por WhatsApp</a><a class="order-band-more" href="/pedidos">Cómo pedir</a></div>
    </section></div>

    <div class="wrap">${adSlot('inline')}</div>

    ${(() => { const g = galleryItems().slice(0, 4); return g.length ? `
    <section class="section wrap" aria-labelledby="gal-title">
      <div class="section-head">
        <div><span class="eyebrow">Hecho con Estratos 3D</span><h2 id="gal-title">Así quedan impresos</h2></div>
        <a class="btn btn-soft btn-more" href="/galeria">Ver galería completa ${icon.arrow}</a>
      </div>
      <div class="gallery gallery-home">${g.map((x) => galleryCard(x)).join('')}</div>
    </section>` : ''; })()}

    <section class="section wrap" id="como-funciona" aria-labelledby="how-title">
      <div class="section-head"><div><span class="eyebrow">Cómo funciona</span><h2 id="how-title">De la idea al archivo en cuatro pasos</h2></div></div>
      <ol class="steps" style="list-style:none;margin:0;padding:0">
        <li class="step"><span class="n">01</span><h3>Elegí</h3><p>Buscá en el catálogo el objeto que se parece a lo que necesitás.</p></li>
        <li class="step"><span class="n">02</span><h3>Personalizá</h3><p>Ajustá medidas, textos, tipografías, símbolos y colores. Solo ves los controles que tienen sentido para ese objeto.</p></li>
        <li class="step"><span class="n">03</span><h3>Previsualizá</h3><p>Giralo y acercalo en 3D. La herramienta revisa paredes finas, piezas sueltas, voladizos y el tamaño de la cama.</p></li>
        <li class="step"><span class="n">04</span><h3>Descargá</h3><p>Bajá un 3MF con colores por pieza, un STL o un OBJ, generados con tus valores exactos.</p></li>
      </ol>
    </section>

    <section class="section wrap" aria-labelledby="fmt-title">
      <div class="section-head"><div><span class="eyebrow">Formatos</span><h2 id="fmt-title">¿Qué archivo me conviene?</h2></div></div>
      <div class="table-scroll">
        <table class="formats">
          <thead><tr><th>Formato</th><th>Colores</th><th>Ideal para</th></tr></thead>
          <tbody>
            <tr><td>3MF</td><td>Sí, una pieza por color</td><td>Bambu Studio, PrusaSlicer, OrcaSlicer y Cura. Recomendado para impresoras multicolor o cambios de filamento.</td></tr>
            <tr><td>STL</td><td>No</td><td>Compatible con cualquier laminador. Podés bajarlo unido o con un archivo por pieza para asignar colores a mano.</td></tr>
            <tr><td>OBJ</td><td>Sí, con archivo .mtl</td><td>Programas de modelado y render, o laminadores que lean materiales OBJ.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>`;
}

export function mountHome(root) {
  const offThumbs = bindThumbs(root), offCar = bindCarousels(root);
  const offLightbox = bindLightbox(root), offPreview = bindPreview(root);
  const tabsEl = $('.feat-tabs', root), moreEl = $('#feat-more', root);
  const onTab = (e) => {
    const b = e.target.closest('button[data-tab]');
    if (!b) return;
    const id = b.dataset.tab;
    tabsEl.querySelectorAll('button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    root.querySelectorAll('#feat-cards .fcard').forEach((c) => { c.hidden = !c.dataset.tabs.split(' ').includes(id); });
    if (moreEl) moreEl.href = id === 'rec' ? '/catalogo' : `/catalogo?categoria=${id}`;
  };
  tabsEl?.addEventListener('click', onTab);
  const stage = $('#demo-stage', root);
  const defs = SHOWCASE.map(getObject).filter(Boolean);
  let viewer = null, idx = 0, timer = null, stopped = false;
  const models = new Map();
  if (webglAvailable()) {
    viewer = new Viewer(stage, { autoRotate: true, bed: false });
    if (viewer.failed) viewer = null;
  }
  if (!viewer) stage.insertAdjacentHTML('beforeend', '<div class="fallback"><strong>Vista 3D no disponible</strong><span>Tu navegador no permite WebGL. Igual podés personalizar y descargar archivos desde el editor.</span></div>');
  const dots = $('#show-dots', root), nameEl = $('#show-name', root), go = $('#demo-go', root);
  dots.innerHTML = defs.map((d, i) => `<button type="button" role="tab" data-i="${i}" aria-label="${esc(d.name)}" aria-selected="${i === 0}"></button>`).join('');
  const show = (i) => {
    idx = (i + defs.length) % defs.length;
    const def = defs[idx];
    nameEl.textContent = def.name;
    go.href = `/crear/${def.id}`;
    dots.querySelectorAll('button').forEach((x, k) => x.setAttribute('aria-selected', String(k === idx)));
    if (!viewer) return;
    if (!models.has(def.id)) models.set(def.id, buildModel(def, def.defaults, def.useOrientation || def.orientations[0].id));
    viewer.setModel(models.get(def.id).parts, { reframe: 'auto' });
  };
  const schedule = () => {
    clearTimeout(timer);
    if (stopped || !viewer) return;
    timer = setTimeout(() => { if (!document.hidden) show(idx + 1); schedule(); }, 4500);
  };
  show(0); schedule();
  dots.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-i]');
    if (!b) return;
    show(Number(b.dataset.i)); schedule();
  });
  return () => {
    stopped = true; clearTimeout(timer); tabsEl?.removeEventListener('click', onTab);
    offThumbs(); offCar(); offLightbox(); offPreview(); viewer?.dispose();
    models.forEach(disposeModel);
  };
}
