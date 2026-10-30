import { OBJECTS, CATEGORIES, categoriesOf, getObject } from '../objects/index.js';
import { Viewer, webglAvailable } from '../viewer/Viewer.js';
import { buildModel, disposeModel } from '../core/pipeline.js';
import { FONTS } from '../core/text.js';
import { card, bindThumbs } from './catalog.js';
import { adSlot } from './ads.js';
import { featuredPromo } from '../content/promos.js';
import { esc, icon, $, debounce, storage } from './dom.js';
import { galleryItems } from '../content/gallery.js';
import { galleryCard } from './pages.js';

const FEATURED = ['llavero', 'display-qr', 'posavasos', 'pantalla-lampara', 'soporte-auriculares', 'cartel-wifi', 'soporte-mandos', 'placa'];

export function homePage() {
  return `
  <main>
    <section class="hero">
      <div class="wrap">
        <div class="hero-copy">
          <span class="eyebrow">Diseño paramétrico · 3MF · STL · OBJ</span>
          <h1>Piezas a medida para tu impresora 3D, <span>sin saber modelar.</span></h1>
          <p class="lead">Elegí un objeto, cambiá medidas, textos y colores, y mirá el resultado en 3D mientras lo ajustás. Al terminar, descargás un archivo real generado con tus valores y revisado antes de imprimir.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg btn-cta" href="/catalogo">${icon.plus} Crear un objeto</a>
            <a class="btn btn-lg btn-soft" href="/#como-funciona">Cómo funciona ${icon.chevron}</a>
          </div>
          <div class="hero-facts"><span><b>${OBJECTS.length}</b> diseños editables</span><span><b>${FONTS.length}</b> tipografías para relieve</span><span>Capa de <b>0,20 mm</b> como referencia</span></div>
        </div>
        <div class="demo">
          <div class="demo-stage" id="demo-stage"><span class="tag"><span class="dot"></span>Vista previa en vivo</span></div>
          <div class="demo-form">
            <label class="ctl-label" for="demo-text">Probá con un nombre</label>
            <div class="demo-row">
              <input id="demo-text" type="text" maxlength="14" value="Sofía" autocomplete="off">
              <a class="btn btn-primary" id="demo-go" href="/crear/llavero">Personalizar ${icon.arrow}</a>
            </div>
            <div class="seg" role="group" aria-label="Tipografía">
              ${FONTS.map((f, i) => `<button type="button" data-font="${f.id}" aria-pressed="${i === 0}" style="font-family:${f.css}">${esc(f.label.split(' ')[0])}</button>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>

    ${(() => { const p = featuredPromo(); return p ? `<div class="wrap"><a class="promo-banner" href="/sorteos/${esc(p.slug)}"><span class="promo-banner-tag">Sorteo</span><span><b>${esc(p.title)}</b><span>Anotate gratis y participá por premios impresos en 3D.</span></span>${icon.arrow}</a></div>` : ''; })()}

    <section class="section wrap" aria-labelledby="cats-title">
      <div class="section-head"><div><span class="eyebrow">Categorías</span><h2 id="cats-title">¿Qué necesitás imprimir?</h2></div></div>
      <div class="cat-grid">
        ${CATEGORIES.map((c) => {
          const n = OBJECTS.filter((o) => categoriesOf(o).includes(c.id)).length;
          return `<a class="cat" href="/catalogo?categoria=${c.id}"><span class="count ${n ? '' : 'soon'}">${n ? `${n} ${n === 1 ? 'diseño' : 'diseños'}` : 'Próximamente'}</span><h3>${esc(c.label)}</h3><p>${esc(c.blurb)}</p></a>`;
        }).join('')}
      </div>
    </section>

    <section class="section wrap" aria-labelledby="pop-title">
      <div class="section-head">
        <div><span class="eyebrow">Diseños destacados</span><h2 id="pop-title">Listos para personalizar</h2></div>
        <a class="btn btn-ghost" href="/catalogo">Ver catálogo ${icon.arrow}</a>
      </div>
      <div class="cards cards-featured">${FEATURED.map(getObject).filter(Boolean).map(card).join('')}</div>
    </section>

    <div class="wrap">${adSlot('inline')}</div>

    ${(() => { const g = galleryItems().slice(0, 4); return g.length ? `
    <section class="section wrap" aria-labelledby="gal-title">
      <div class="section-head">
        <div><span class="eyebrow">Hecho con Estratos 3D</span><h2 id="gal-title">Así quedan impresos</h2></div>
        <a class="btn btn-ghost" href="/galeria">Ver galería ${icon.arrow}</a>
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
  const offThumbs = bindThumbs(root);
  const stage = $('#demo-stage', root);
  const def = getObject('llavero');
  let params = { ...def.defaults, text: 'Sofía', font: 'archivo' };
  let viewer = null, model = null;
  if (webglAvailable()) {
    viewer = new Viewer(stage, { autoRotate: true, bed: false });
    if (viewer.failed) viewer = null;
  }
  if (!viewer) stage.insertAdjacentHTML('beforeend', '<div class="fallback"><strong>Vista 3D no disponible</strong><span>Tu navegador no permite WebGL. Igual podés personalizar y descargar archivos desde el editor.</span></div>');
  const update = () => {
    if (!viewer) return;
    const next = buildModel(def, params, 'flat');
    viewer.setModel(next.parts, { reframe: 'auto' });
    disposeModel(model);
    model = next;
  };
  update();
  const deb = debounce(update, 120);
  $('#demo-text', root).addEventListener('input', (e) => { params.text = e.target.value; deb(); });
  root.querySelector('.demo .seg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-font]');
    if (!b) return;
    params.font = b.dataset.font;
    root.querySelectorAll('.demo [data-font]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    update();
  });
  $('#demo-go', root).addEventListener('click', () => {
    const saved = storage.get(`estratos:params:${def.id}`, {});
    storage.set(`estratos:params:${def.id}`, { ...saved, text: params.text, font: params.font });
  });
  return () => { offThumbs(); viewer?.dispose(); disposeModel(model); };
}
