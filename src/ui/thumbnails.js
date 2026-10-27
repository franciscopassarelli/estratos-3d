// Miniaturas del catálogo renderizadas a partir de la geometría real de cada objeto.
import { Viewer, webglAvailable } from '../viewer/Viewer.js';
import { buildModel, disposeModel } from '../core/pipeline.js';
import { OBJECTS } from '../objects/index.js';

const cache = new Map();
const listeners = new Set();
let started = false;

export const thumbnail = (id) => cache.get(id) || null;
export function onThumbnail(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export function renderThumbnails() {
  if (started || !webglAvailable()) return;
  started = true;
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;width:480px;height:360px;pointer-events:none;';
  document.body.appendChild(host);
  const viewer = new Viewer(host, { bed: false });
  if (viewer.failed) { host.remove(); return; }
  const queue = [...OBJECTS];
  const next = () => {
    const def = queue.shift();
    if (!def) { viewer.dispose(); host.remove(); return; }
    const model = buildModel(def, def.defaults, (def.useOrientation || def.orientations[0].id));
    viewer.setModel(model.parts, { reframe: true });
    const url = viewer.snapshot(480, 360);
    disposeModel(model);
    if (url) { cache.set(def.id, url); listeners.forEach((fn) => fn(def.id, url)); }
    if (window.requestIdleCallback) window.requestIdleCallback(next, { timeout: 300 }); else setTimeout(next, 30);
  };
  setTimeout(next, 60);
}
