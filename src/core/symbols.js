// Símbolos decorativos generados como geometría 2D cerrada (aptos para extruir).
import { union, circle, ellipse, regularPolygon, center, scale, bbox, translate, toSvgPath } from './geometry2d.js';

function heart() {
  const pts = [];
  for (let i = 0; i < 96; i++) {
    const t = (i / 96) * Math.PI * 2;
    pts.push({ x: 16 * Math.sin(t) ** 3, y: 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t) });
  }
  return [pts];
}
function star() {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? 0.45 : 1;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return [pts];
}
function bolt() {
  return [[[0.35, 1], [-0.45, -0.1], [-0.02, -0.1], [-0.3, -1], [0.5, 0.15], [0.07, 0.15], [0.35, 1]].slice(0, 6).map(([x, y]) => ({ x, y }))];
}
function paw() {
  return union(
    ellipse(0, -0.25, 0.48, 0.4),
    ellipse(-0.62, 0.22, 0.2, 0.26), ellipse(-0.24, 0.62, 0.2, 0.27),
    ellipse(0.24, 0.62, 0.2, 0.27), ellipse(0.62, 0.22, 0.2, 0.26),
  );
}
function crown() {
  const base = [[-1, -0.6], [1, -0.6], [1, 0.55], [0.5, 0.05], [0, 0.75], [-0.5, 0.05], [-1, 0.55]].map(([x, y]) => ({ x, y }));
  return union([base], circle(-1, 0.6, 0.16, 20), circle(0, 0.8, 0.16, 20), circle(1, 0.6, 0.16, 20));
}
function sparkle() {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 2 + (i / 8) * Math.PI * 2, r = i % 2 ? 0.28 : 1;
    pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
  }
  return [pts];
}
function hexagon() { return regularPolygon(0, 0, 1, 6, Math.PI / 6); }

export const SYMBOLS = [
  { id: 'none', label: 'Ninguno' },
  { id: 'heart', label: 'Corazón', make: heart },
  { id: 'star', label: 'Estrella', make: star },
  { id: 'bolt', label: 'Rayo', make: bolt },
  { id: 'paw', label: 'Huella', make: paw },
  { id: 'crown', label: 'Corona', make: crown },
  { id: 'sparkle', label: 'Destello', make: sparkle },
  { id: 'hexagon', label: 'Hexágono', make: hexagon },
];

const cache = new Map();
/** Región del símbolo centrada en el origen, con la altura indicada (mm). */
export function symbolRegion(id, height) {
  const def = SYMBOLS.find((s) => s.id === id);
  if (!def || !def.make) return [];
  if (!cache.has(id)) cache.set(id, center(union(def.make())));
  const r = cache.get(id);
  const b = bbox(r);
  return scale(r, height / b.h);
}

export function symbolSvgPath(id, size = 24) {
  const r = symbolRegion(id, 10);
  return r.length ? toSvgPath(r, size, 2) : '';
}

export { translate };
