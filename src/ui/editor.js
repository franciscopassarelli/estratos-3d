import { getObject, CATEGORIES } from '../objects/index.js';
import { storableParams, buildModel, disposeModel, statusOf, sanitize } from '../core/pipeline.js';
import { exportModel, slug } from '../export/formats.js';
import { saveFiles, deliveryMode } from '../export/save.js';
import { Viewer, webglAvailable } from '../viewer/Viewer.js';
import { FONTS } from '../core/text.js';
import { SYMBOLS, symbolSvgPath } from '../core/symbols.js';
import { FILAMENTS, PRINT } from '../core/palette.js';
import { adSlot, activateAds } from './ads.js';
import { guideForObject } from '../content/guides.js';
import { esc, icon, $, $$, debounce, storage, toast, fmtBytes, fmtNum } from './dom.js';

const FORMATS = {
  '3mf': { label: '3MF', desc: 'Recomendado. Conserva una pieza por color, listas para asignar filamentos en tu laminador.' },
  stl: { label: 'STL', desc: 'Compatible con todos los laminadores. No guarda colores.' },
  obj: { label: 'OBJ', desc: 'Incluye un archivo .mtl con los colores. Útil para otros programas 3D.' },
};
const STATUS_TEXT = { ok: 'Listo para descargar', warning: 'Revisá las advertencias', error: 'Hay problemas que corregir' };
const STATUS_ICON = { ok: icon.okCircle, warning: icon.warn, error: icon.error };
const LEVEL_ICON = { ok: icon.okCircle, info: icon.info, warning: icon.warn, error: icon.error };

const labelOf = (item, p) => (typeof item.label === 'function' ? item.label(p) : item.label);

// ---------- Controles ----------
function control(item, p) {
  const id = `p-${item.key}`;
  const v = p[item.key];
  const head = (extra = '') => `<div class="ctl-head"><label for="${id}" data-label>${esc(labelOf(item, p))}</label>${extra}</div>`;
  const help = item.help ? `<span class="ctl-help">${esc(item.help)}</span>` : '';
  const pressed = (val) => `aria-pressed="${v === val}"`;
  let body = '';
  switch (item.type) {
    case 'range':
      body = head(`<span class="num"><input type="number" id="${id}-n" data-key="${item.key}" data-num min="${item.min}" max="${item.max}" step="${item.step}" value="${v}" aria-label="${esc(labelOf(item, p))} en ${item.unit}">${esc(item.unit)}</span>`)
        + `<input type="range" id="${id}" data-key="${item.key}" min="${item.min}" max="${item.max}" step="${item.step}" value="${v}">` + help;
      break;
    case 'text':
      body = head(`<span class="ctl-help mono" data-count>${[...(v || '')].length}/${item.maxLength}</span>`)
        + `<input type="text" id="${id}" data-key="${item.key}" maxlength="${item.maxLength}" value="${esc(v)}" placeholder="${esc(item.placeholder || '')}" autocomplete="off">` + help;
      break;
    case 'segmented':
      body = `<span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><div class="seg" role="group">${item.options.map((o) => `<button type="button" data-key="${item.key}" data-value="${o.value}" ${pressed(o.value)}>${esc(o.label)}</button>`).join('')}</div>` + help;
      break;
    case 'cards':
      body = `<span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><div class="opt-cards" role="group">${item.options.map((o) => `<button type="button" data-key="${item.key}" data-value="${o.value}" ${pressed(o.value)}><b>${esc(o.label)}</b><span>${esc(o.hint || '')}</span></button>`).join('')}</div>`;
      break;
    case 'font':
      body = `<span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><div class="fonts" role="group">${FONTS.map((f) => `<button type="button" data-key="${item.key}" data-value="${f.id}" ${pressed(f.id)}><span class="sample" style="font-family:${f.css}">${esc(previewText(p))}</span><span class="name">${esc(f.label)} · ${esc(f.note)}</span></button>`).join('')}</div>`;
      break;
    case 'symbol':
      body = `<span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><div class="symbols" role="group">${SYMBOLS.map((s) => `<button type="button" data-key="${item.key}" data-value="${s.id}" ${pressed(s.id)} title="${esc(s.label)}" aria-label="${esc(s.label)}">${s.id === 'none' ? '—' : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${symbolSvgPath(s.id)}" fill="currentColor" fill-rule="nonzero"/></svg>`}</button>`).join('')}</div>`;
      break;
    case 'color': {
      const named = FILAMENTS.find((f) => f.hex.toLowerCase() === String(v).toLowerCase());
      body = `<div class="ctl-head"><span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><span class="color-name" data-color-name>${esc(named ? named.name : v)}</span></div>
        <div class="swatches" role="group">${FILAMENTS.map((f) => `<button type="button" class="swatch" style="background:${f.hex}" data-key="${item.key}" data-value="${f.hex}" ${pressed(f.hex)} title="${esc(f.name)}" aria-label="${esc(f.name)}"></button>`).join('')}
        <label class="swatch-custom" title="Otro color">${icon.plus}<input type="color" data-key="${item.key}" value="${v}" aria-label="Elegir otro color"></label></div>`;
      break;
    }
    case 'stepper':
      body = `<div class="ctl-head"><span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><span class="stepper"><button type="button" data-key="${item.key}" data-step="-1" aria-label="Menos">−</button><output data-out>${v}</output><button type="button" data-key="${item.key}" data-step="1" aria-label="Más">+</button></span></div>`;
      break;
    case 'toggle':
      body = `<label class="switch"><span class="ctl-label" data-label>${esc(labelOf(item, p))}</span><input type="checkbox" id="${id}" data-key="${item.key}" ${v ? 'checked' : ''}></label>`;
      break;
    default:
      body = '';
  }
  return `<div class="ctl" data-item="${item.key}">${body}</div>`;
}

function previewText(p) {
  const t = (p.text || p.line1 || p.label || 'Aa').trim() || 'Aa';
  return t.length > 12 ? t.slice(0, 12) + '…' : t;
}

function editorGuide(def) {
  const g = guideForObject(def.id);
  if (!g) return '';
  return `
    <section class="editor-guide">
      <div><span class="eyebrow">${esc(g.kind)}</span><h2>${esc(g.sections[0].h)}</h2></div>
      <div class="editor-guide-body">${g.sections[0].html}${g.sections[1] ? `<h3>${esc(g.sections[1].h)}</h3>${g.sections[1].html}` : ''}
        <a class="btn" href="/guias/${g.slug}">Leer la guía completa ${icon.arrow}</a></div>
    </section>`;
}

// ---------- Página ----------
export function editorPage(id) {
  const def = getObject(id);
  if (!def) return `<main class="wrap"><div class="page-head"><h1>No encontramos ese diseño</h1><p class="lead">Puede que el enlace sea viejo. <a href="/catalogo">Volver al catálogo</a>.</p></div></main>`;
  const cat = CATEGORIES.find((c) => c.id === def.category);
  return `
  <main class="wrap editor-page">
    <div class="editor-top">
      <nav class="crumbs" aria-label="Ubicación"><a href="/catalogo">Catálogo</a><span>/</span><span>${esc(cat?.label || '')}</span></nav>
      <h1>${esc(def.name)}</h1>
    </div>
    <div class="editor">
      <div class="stage-col">
        <div class="stage" id="stage">
          <div class="stage-tools">
            <button class="btn btn-sm" id="view-reset" type="button" title="Volver a la vista inicial">${icon.reset}<span>Vista inicial</span></button>
            <button class="btn btn-sm" id="view-detail" type="button" title="Acercar al detalle">${icon.zoom}<span>Detalle</span></button>
            ${def.useOrientation ? `<button class="btn btn-sm" id="view-mode" type="button" aria-pressed="true">${icon.phone}<span>Ver en la cama</span></button>` : ''}
          </div>
          <div class="stage-dims" id="stage-dims"></div>
          <span class="stage-hint" id="stage-hint">Arrastrá para girar · rueda o pellizco para acercar</span>
        </div>
      </div>
      <div class="panel" id="panel">
        <div class="panel-head">
          <span class="status" id="status" role="status"></span>
          <button class="btn btn-ghost btn-sm" id="reset" type="button">${icon.reset} Restablecer</button>
        </div>
        <div id="controls"></div>
        <details class="group" open id="print-group">
          <summary>Preparación para imprimir ${icon.chevron}</summary>
          <div class="group-body" id="print-body"></div>
        </details>
        <div class="export" id="export"></div>
      </div>
    </div>
    ${editorGuide(def)}
    ${adSlot('banner')}
    <div class="mobile-bar" id="mobile-bar">
      <span class="mono" id="mobile-dims"></span>
      <button class="btn btn-primary" id="mobile-dl" type="button">${icon.download} Descargar</button>
    </div>
  </main>`;
}

export function mountEditor(root, id) {
  const def = getObject(id);
  if (!def) return () => {};
  const KEY = `estratos:params:${def.id}`;
  let params = sanitize(def, storage.get(KEY, {}));
  let orientation = storage.get(`${KEY}:orientation`, def.orientations[0].id);
  if (!def.orientations.some((o) => o.id === orientation)) orientation = def.orientations[0].id;
  let viewUse = !!def.useOrientation;
  let format = storage.get('estratos:format', '3mf');
  let stlMode = 'merged';
  let model = null, shown = null;
  let confirmOpen = false;

  const stage = $('#stage', root);
  let viewer = null;
  if (webglAvailable()) { viewer = new Viewer(stage); if (viewer.failed) viewer = null; }
  if (!viewer) {
    stage.insertAdjacentHTML('beforeend', '<div class="fallback"><strong>Tu navegador no puede mostrar la vista 3D</strong><span>Podés seguir ajustando el diseño: las medidas, las comprobaciones y la descarga funcionan igual.</span></div>');
    $('.stage-tools', root).hidden = true; $('#stage-hint', root).hidden = true;
    stage.style.height = 'auto'; stage.style.minHeight = '200px';
  }

  // ---- Controles
  const controlsEl = $('#controls', root);
  const renderControls = () => {
    controlsEl.innerHTML = def.sections.map((s, i) => `
      <details class="group" ${i < 2 || s.items.some((it) => it.type === 'text') ? 'open' : ''}>
        <summary>${esc(s.title)} ${icon.chevron}</summary>
        <div class="group-body">${s.items.map((it) => control(it, params)).join('')}</div>
      </details>`).join('');
    syncVisibility();
  };
  const items = def.sections.flatMap((s) => s.items);
  const syncVisibility = () => {
    for (const it of items) {
      const el = controlsEl.querySelector(`[data-item="${it.key}"]`);
      if (!el) continue;
      el.hidden = it.visibleIf ? !it.visibleIf(params) : false;
      if (typeof it.label === 'function') el.querySelectorAll('[data-label]').forEach((l) => { l.textContent = labelOf(it, params); });
    }
    controlsEl.querySelectorAll('.fonts .sample').forEach((s) => { s.textContent = previewText(params); });
  };
  const setParam = (key, value, immediate = false) => {
    params[key] = value;
    syncVisibility();
    immediate ? rebuild.flush() : rebuild();
  };

  controlsEl.addEventListener('input', (e) => {
    const t = e.target, key = t.dataset.key;
    if (!key) return;
    const item = items.find((i) => i.key === key);
    if (item.type === 'range') {
      if (t.type === 'range') { const n = $(`#p-${key}-n`, root); if (n) n.value = t.value; setParam(key, Number(t.value)); }
      else if (t.value !== '' && Number.isFinite(Number(t.value))) {
        const val = Math.min(item.max, Math.max(item.min, Number(t.value)));
        const r = $(`#p-${key}`, root); if (r) r.value = val;
        setParam(key, val);
      }
    } else if (item.type === 'text') {
      const c = t.closest('.ctl').querySelector('[data-count]');
      if (c) c.textContent = `${[...t.value].length}/${item.maxLength}`;
      setParam(key, t.value);
    } else if (item.type === 'color') {
      setColor(key, t.value);
    }
  });
  controlsEl.addEventListener('change', (e) => {
    const t = e.target, key = t.dataset.key;
    if (!key) return;
    if (t.type === 'checkbox') setParam(key, t.checked, true);
    if (t.dataset.num !== undefined) { t.value = params[key]; }
  });
  const setColor = (key, hex) => {
    const ctl = controlsEl.querySelector(`[data-item="${key}"]`);
    ctl.querySelectorAll('.swatch').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value.toLowerCase() === hex.toLowerCase())));
    const named = FILAMENTS.find((f) => f.hex.toLowerCase() === hex.toLowerCase());
    ctl.querySelector('[data-color-name]').textContent = named ? named.name : hex.toUpperCase();
    setParam(key, hex, true);
  };
  controlsEl.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-key]');
    if (!b) return;
    const key = b.dataset.key, item = items.find((i) => i.key === key);
    if (b.dataset.step) {
      const val = Math.min(item.max, Math.max(item.min, params[key] + Number(b.dataset.step)));
      b.parentElement.querySelector('[data-out]').textContent = val;
      setParam(key, val, true);
      return;
    }
    if (item.type === 'color') { setColor(key, b.dataset.value); return; }
    b.parentElement.querySelectorAll('button[data-key]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    setParam(key, b.dataset.value, true);
  });

  // ---- Modelo
  const stageDims = $('#stage-dims', root), statusEl = $('#status', root), printBody = $('#print-body', root);
  let firstBuild = true;
  const rebuild = debounce(() => {
    const next = buildModel(def, params, orientation);
    let display = next;
    if (viewUse && def.useOrientation && def.useOrientation !== orientation) display = buildModel(def, params, def.useOrientation);
    viewer?.setModel(display.parts, { reframe: firstBuild ? true : 'auto' });
    firstBuild = false;
    if (shown && shown !== model) disposeModel(shown);
    disposeModel(model);
    model = next; shown = display;
    params = { ...next.params };
    storage.set(KEY, storableParams(def, params));
    renderStatus();
  }, 90);

  const renderStatus = () => {
    const st = statusOf(model);
    statusEl.className = `status ${st}`;
    statusEl.innerHTML = `${STATUS_ICON[st]} ${STATUS_TEXT[st]}`;
    const a = model.analysis;
    stageDims.innerHTML = a ? `<span class="tag mono">${fmtNum(a.dims.x)} × ${fmtNum(a.dims.y)} × ${fmtNum(a.dims.z)} mm</span>` : '';
    $('#mobile-dims', root).textContent = a ? `${fmtNum(a.dims.x, 0)} × ${fmtNum(a.dims.y, 0)} × ${fmtNum(a.dims.z, 0)} mm` : 'Sin geometría';
    renderPrint();
    renderExport();
  };

  const renderPrint = () => {
    const a = model.analysis;
    const checks = [];
    if (a) {
      const vols = a.perPart.reduce((s, p) => s + p.volumes, 0);
      checks.push(a.closed
        ? { level: 'ok', msg: `Archivo generado: ${model.parts.length} ${model.parts.length === 1 ? 'pieza' : 'piezas'} (${vols} ${vols === 1 ? 'volumen cerrado' : 'volúmenes cerrados'}), ${a.triangles.toLocaleString('es-AR')} triángulos.` }
        : { level: 'error', msg: 'La geometría generada tiene aristas abiertas.' });
      if (a.overhang <= 2) checks.push({ level: 'ok', msg: 'No necesita soportes en esta orientación.' });
      if (a.floating === 0) checks.push({ level: 'ok', msg: 'Todas las partes se apoyan en la cama o sobre otra parte.' });
      if (a.fitsBed) checks.push({ level: 'ok', msg: `Entra en una cama de ${PRINT.bed.x} × ${PRINT.bed.y} mm.` });
    }
    const order = { error: 0, warning: 1, info: 2, ok: 3 };
    const all = [...model.issues, ...checks].sort((x, y) => order[x.level] - order[y.level]);
    const orient = def.orientations.length > 1 ? `
      <div class="ctl"><span class="ctl-label">Orientación de impresión</span>
        <div class="opt-cards" role="group">${def.orientations.map((o) => `<button type="button" data-orient="${o.id}" aria-pressed="${o.id === orientation}"><b>${esc(o.label)}</b><span>${esc(o.hint || '')}</span></button>`).join('')}</div></div>` : `<p class="note">Orientación: ${esc(def.orientations[0].label.toLowerCase())}.</p>`;
    printBody.innerHTML = `
      ${orient}
      <ul class="checks">${all.map((c) => `<li class="${c.level}">${LEVEL_ICON[c.level]}<span>${esc(c.msg)}</span></li>`).join('')}</ul>
      ${a ? `<dl class="stats">
        <div><dt>Medidas finales</dt><dd>${fmtNum(a.dims.x)} × ${fmtNum(a.dims.y)} × ${fmtNum(a.dims.z)} mm</dd></div>
        <div><dt>Volumen sólido</dt><dd>${fmtNum(a.volume / 1000)} cm³</dd></div>
        <div><dt>PLA al 100 %</dt><dd>${fmtNum(a.grams)} g · ${fmtNum(a.filamentMeters, 2)} m</dd></div>
        <div><dt>Tiempo orientativo</dt><dd>${esc(def.printTime)}</dd></div>
      </dl>
      <div class="parts-list">${model.parts.map((p) => `<div><i style="background:${p.color}"></i>${esc(p.name)}<span>${a.perPart.find((x) => x.id === p.id)?.triangles.toLocaleString('es-AR')} tri.</span></div>`).join('')}</div>` : ''}
      <p class="note">Sugerido: capa de 0,20 mm, 3 perímetros y 15–20 % de relleno. El peso real será menor que el de PLA al 100 %. Estas son comprobaciones automáticas básicas: un archivo generado correctamente no garantiza una impresión perfecta; revisá siempre la vista previa de tu laminador.</p>`;
  };
  printBody.addEventListener('click', (e) => {
    const b = e.target.closest('[data-orient]');
    if (!b) return;
    orientation = b.dataset.orient;
    storage.set(`${KEY}:orientation`, orientation);
    firstBuild = true;
    rebuild.flush();
  });

  // ---- Exportación
  const exportEl = $('#export', root);
  let zipNote = false;
  deliveryMode().then((m) => { zipNote = m === 'zip'; if (model) renderExport(); });
  const renderExport = () => {
    const st = statusOf(model);
    const multi = model.parts.length > 1;
    exportEl.innerHTML = `
      <div class="ctl"><span class="ctl-label">Formato de descarga</span>
        <div class="seg" role="group" id="fmt">${Object.entries(FORMATS).map(([k, f]) => `<button type="button" data-fmt="${k}" aria-pressed="${k === format}">${f.label}</button>`).join('')}</div>
        <p class="fmt-desc">${esc(FORMATS[format].desc)}${format === 'stl' && multi ? ' Elegí si querés un archivo o uno por color:' : ''}</p>
        ${format === 'stl' && multi ? `<div class="seg" role="group" id="stl-mode"><button type="button" data-stl="merged" aria-pressed="${stlMode === 'merged'}">Un solo archivo</button><button type="button" data-stl="parts" aria-pressed="${stlMode === 'parts'}">Uno por pieza</button></div>` : ''}
      </div>
      ${confirmOpen ? `<div class="confirm-box" role="alert"><strong>El diseño tiene errores.</strong><span>${esc(model.issues.filter((i) => i.level === 'error').map((i) => i.msg).join(' '))}</span><div class="row"><button class="btn btn-sm" data-dl-force type="button">Descargar igual</button><button class="btn btn-sm btn-ghost" data-dl-cancel type="button">Seguir editando</button></div></div>` : ''}
      <button class="btn btn-primary btn-lg" id="dl" type="button" ${model.parts.length ? '' : 'disabled'}>${icon.download} Descargar ${FORMATS[format].label}</button>
      ${zipNote ? '<p class="note">En esta vista los archivos se entregan dentro de un .zip; descomprimilo antes de abrirlo en el laminador.</p>' : ''}
      ${st === 'warning' ? '<p class="note">Podés descargar con advertencias; revisalas antes de imprimir.</p>' : ''}`;
  };
  exportEl.addEventListener('click', (e) => {
    const f = e.target.closest('[data-fmt]');
    if (f) { format = f.dataset.fmt; storage.set('estratos:format', format); renderExport(); return; }
    const s = e.target.closest('[data-stl]');
    if (s) { stlMode = s.dataset.stl; renderExport(); return; }
    if (e.target.closest('#dl')) { requestDownload(); return; }
    if (e.target.closest('[data-dl-force]')) { confirmOpen = false; renderExport(); openDownload(); return; }
    if (e.target.closest('[data-dl-cancel]')) { confirmOpen = false; renderExport(); }
  });
  const requestDownload = () => {
    if (!model?.parts.length) { toast('No hay geometría para descargar. Revisá los mensajes del panel.', 'error'); return; }
    if (statusOf(model) === 'error') { confirmOpen = true; renderExport(); exportEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
    openDownload();
  };
  $('#mobile-dl', root).addEventListener('click', requestDownload);

  const openDownload = () => {
    const snapshot = model;
    const fmtLabel = FORMATS[format].label;
    const bd = document.createElement('div');
    bd.className = 'modal-backdrop';
    bd.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="dl-title">
        <div class="modal-head"><h3 id="dl-title">Descarga ${fmtLabel}</h3><button class="icon-btn" data-close aria-label="Cerrar">${icon.x}</button></div>
        <div>
          <div class="dl-state" id="dl-state" aria-live="polite"><span><span class="spinner"></span> Generando el archivo ${fmtLabel}…</span></div>
        </div>
      </div>`;
    document.body.appendChild(bd);
    const close = () => { bd.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    bd.addEventListener('click', (e) => {
      if (e.target === bd || e.target.closest('[data-close]')) close();
    });
    bd.querySelector('[data-close]').focus();
    const state = bd.querySelector('#dl-state');
    setTimeout(() => {
      let files;
      try { files = exportModel(snapshot, format, { stlMode }); } catch (err) {
        console.error(err);
        state.innerHTML = `<strong>No se pudo generar el archivo.</strong><span>Probá con otro formato o restablecé el diseño. Detalle: ${esc(err.message)}</span>`;
        return;
      }
      const total = files.reduce((s, f) => s + f.bytes.length, 0);
      const bundle = slug(`${snapshot.def.id}-${snapshot.params.text || snapshot.params.line1 || snapshot.params.label || ''}`) + `-${format}`;
      state.innerHTML = `
        <strong>Archivo generado</strong>
        ${files.map((f) => `<span class="file">${esc(f.name)}</span>`).join('')}
        <span class="note">${fmtBytes(total)} · ${fmtNum(snapshot.analysis.dims.x)} × ${fmtNum(snapshot.analysis.dims.y)} × ${fmtNum(snapshot.analysis.dims.z)} mm${format === 'stl' ? ' · sin color' : ''}</span>
        <button class="btn btn-primary" data-save type="button">${icon.download} Guardar archivo</button>
        <button class="btn btn-ghost btn-sm" data-close type="button">Cancelar</button>`;
      state.querySelector('[data-save]').focus();
      state.querySelector('[data-save]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Preparando…';
        try {
          const res = await saveFiles(files, bundle);
          state.innerHTML = `<strong>Descarga iniciada</strong><span class="file">${esc(res.container)}</span>${res.zipped ? `<span class="note">Contiene: ${res.files.map(esc).join(', ')}</span>` : ''}<span class="note">Abrilo en tu laminador y revisá la vista previa antes de imprimir.</span><button class="btn" data-close type="button">Listo</button>`;
          toast(`Descargado: ${res.container} (${fmtBytes(res.bytes)})`);
        } catch (err) {
          const code = err && err.code;
          btn.disabled = false;
          btn.innerHTML = `${icon.download} Guardar archivo`;
          if (code === 'declined') toast('Cancelaste la descarga. Podés intentarlo de nuevo.');
          else if (code === 'rate_limited') toast('Ya hay una descarga esperando confirmación. Esperá unos segundos.', 'error');
          else toast('No se pudo guardar el archivo en esta vista. Probá abrir la página en otro navegador.', 'error');
        }
      });
    }, 60);
  };

  // ---- Vista
  $('#view-reset', root)?.addEventListener('click', () => viewer?.frame('full'));
  $('#view-detail', root)?.addEventListener('click', () => viewer?.frame('detail'));
  $('#view-mode', root)?.addEventListener('click', (e) => {
    viewUse = !viewUse;
    const b = e.currentTarget;
    b.setAttribute('aria-pressed', String(viewUse));
    b.querySelector('span').textContent = viewUse ? 'Ver en la cama' : 'Ver en uso';
    firstBuild = true;
    rebuild.flush();
  });
  $('#reset', root).addEventListener('click', () => {
    params = { ...def.defaults };
    orientation = def.orientations[0].id;
    storage.remove(KEY);
    renderControls();
    firstBuild = true;
    rebuild.flush();
    toast('Se restableció el diseño original.');
  });

  renderControls();
  rebuild.flush();
  activateAds(root);
  return () => { viewer?.dispose(); if (shown !== model) disposeModel(shown); disposeModel(model); };
}
