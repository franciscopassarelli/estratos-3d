// Posavasos con forma de hoja de monstera: contorno de hoja, nervadura central y calados laterales.
import { union, difference, offset, stroke, ellipse, bbox, translate, islandCount } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

/** Contorno de la hoja: casi redonda, con punta corta arriba y la muesca del tallo abajo. */
function leafOutline(size, width) {
  const pts = [];
  for (let i = 0; i < 180; i++) {
    const t = (i / 180) * Math.PI * 2; // 0 = arriba
    const up = Math.cos(t);
    // Radio base redondo, con una punta suave arriba y la muesca del tallo abajo
    let r = 1 + 0.18 * Math.max(0, up) ** 6 - 0.06 * up;
    const dn = Math.max(0, -up);
    r -= 0.5 * Math.exp(-((Math.sin(t) / 0.12) ** 2)) * dn ** 4;
    pts.push({ x: Math.sin(t) * r * width, y: up * r });
  }
  const ring = [pts], b = bbox(ring), s = size / b.h;
  return translate(ring.map((rg) => rg.map((p) => ({ x: p.x * s, y: p.y * s }))), -b.cx * s, -b.cy * s);
}

/** Calado: cuña curva, angosta junto a la nervadura y ancha en el borde. */
function slit(side, y0, S, len, w0, w1, rise, bend) {
  const L = [], R = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const x = side * (S * 0.07 + len * t), y = y0 + rise * t + bend * t * t;
    const dx = side * len, dy = rise + 2 * bend * t, n = Math.hypot(dx, dy);
    const nx = -dy / n, ny = dx / n, hw = (w0 + (w1 - w0) * t * t) / 2;
    L.push({ x: x + nx * hw, y: y + ny * hw }); R.push({ x: x - nx * hw, y: y - ny * hw });
  }
  return [[...L, ...R.reverse()]];
}

export default {
  id: 'posavasos-monstera',
  name: 'Posavasos hoja de monstera',
  category: 'hogar',
  description: 'Set de posavasos con forma de hoja de monstera, con nervadura y calados. Elegí tamaño, cantidad de calados y cuántos hacer.',
  tags: ['posavasos', 'monstera', 'hoja', 'planta', 'mesa', 'cocina', 'deco', 'regalo', 'verde'],
  printTime: '30–50 min c/u',
  defaults: { size: 100, width: 0.95, slits: 4, holes: true, thickness: 4, count: 2, color: '#5E7A4B' },
  sections: [
    { title: 'Hoja', items: [
      { key: 'size', type: 'range', label: 'Tamaño', min: 70, max: 150, step: 1, unit: 'mm' },
      { key: 'width', type: 'range', label: 'Ancho de la hoja', min: 0.8, max: 1.15, step: 0.01, unit: '×' },
      { key: 'slits', type: 'stepper', label: 'Calados por lado', min: 2, max: 6 },
      { key: 'holes', type: 'toggle', label: 'Agujeritos junto a la nervadura' },
    ] },
    { title: 'Set', items: [
      { key: 'count', type: 'stepper', label: 'Cantidad', min: 1, max: 6 },
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2.4, max: 6, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'Verde oliva o verde mate quedan muy naturales.' }] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const S = p.size, leaf = leafOutline(S, p.width);
    const b = bbox(leaf), n = Math.round(p.slits);
    const cuts = [];
    // Nervadura central: ranura fina desde la muesca del tallo hasta el 55 % del alto
    cuts.push(stroke([{ x: 0, y: b.minY + S * 0.06 }, { x: 0, y: b.minY + S * 0.55 }], Math.max(1.2, S * 0.012), 'round'));
    const ys = [];
    for (let k = 0; k < n; k++) ys.push(b.minY + S * (0.2 + (0.6 * (k + 0.5)) / n));
    for (const y0 of ys) for (const side of [-1, 1]) cuts.push(slit(side, y0, S, S * 0.62, S * 0.012, S * 0.075, S * 0.16, S * 0.04));
    // Agujeritos ovalados entre calados, cerca de la nervadura
    if (p.holes) for (let k = 0; k < n - 1; k++) for (const side of [-1, 1]) {
      const y = (ys[k] + ys[k + 1]) / 2 + S * 0.035;
      cuts.push(ellipse(side * S * 0.16, y, S * 0.018, S * 0.034, 24));
    }
    let shape = difference(leaf, union(...cuts));
    // Redondea un poco las puntas que dejan los calados en el borde
    shape = offset(offset(shape, -0.6), 0.6);
    const islands = islandCount(shape);
    if (islands > 1) issues.push({ level: 'error', msg: 'La hoja quedó cortada en partes. Usá menos calados o un tamaño mayor.' });
    if (S < 90) issues.push({ level: 'info', msg: 'Por debajo de 9 cm, un vaso grande puede quedar desbalanceado.' });

    const c = Math.round(p.count), cols = c <= 2 ? 1 : c > 4 ? 3 : 2, gap = 6;
    const vols = [];
    for (let i = 0; i < c; i++) {
      const x = (i % cols - (cols - 1) / 2) * (b.w + gap), y = -Math.floor(i / cols) * (b.h + gap);
      vols.push(extrudeRegion(translate(shape, x, y), 0, p.thickness));
    }
    const span = Math.max(cols * (b.w + gap), Math.ceil(c / cols) * (b.h + gap));
    if (span > 220) issues.push({ level: 'info', msg: 'El set completo no entra en una cama de 22 cm: imprimilos en tandas.' });
    issues.push({ level: 'info', msg: 'Podés pegarles abajo un círculo de corcho o goma EVA para que no rayen la mesa.' });
    return { parts: [part('leaf', 'Posavasos', p.color, vols, { focus: true })], issues };
  },
};
