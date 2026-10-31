// Servilletero con arbolitos calados alrededor. Usa la misma pared con huecos que la pantalla de lámpara.
// Los árboles tienen los lados inclinados a más de 45°: se imprimen parados sin soportes.
import { difference, union, rect, thinFraction } from '../core/geometry2d.js';
import { part } from '../core/mesh.js';
import { wallMesh, makeMapper } from './lampShade.js';

const TAU = Math.PI * 2;

/**
 * Pino de tres pisos (hueco). Cada piso es un triángulo con los lados a más de 55°;
 * los escalones entre pisos quedan como «pisos» del hueco (material abajo), así que no hay voladizos.
 */
function treeHole(cx, y0, w, h) {
  const trunkH = h * 0.14, trunkW = w * 0.2, H = h - trunkH, yb = y0 + trunkH, a = w / 2;
  const tier = (b, t, half) => [[{ x: cx - half, y: yb + H * b }, { x: cx + half, y: yb + H * b }, { x: cx, y: yb + H * t }]];
  return union(
    tier(0, 0.62, a),
    tier(0.3, 0.82, a * 0.75),
    tier(0.55, 1, a * 0.5),
    rect(cx, y0 + trunkH / 2 + 0.2, trunkW, trunkH + 0.4),
  );
}

export default {
  id: 'servilletero',
  name: 'Servilletero con arbolitos',
  category: 'hogar',
  description: 'Aro para servilletas con pinos calados alrededor. Ideal para la mesa de Navidad: uno de cada color.',
  tags: ['navidad', 'servilletero', 'mesa', 'cena', 'árbol', 'pino', 'decoración'],
  printTime: '30–50 min',
  defaults: { diameter: 50, height: 32, wall: 2.4, trees: 7, treeSize: 72, band: 3.5, color: '#2E9E58' },
  sections: [
    { title: 'Medidas', items: [
      { key: 'diameter', type: 'range', label: 'Diámetro exterior', min: 38, max: 70, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto', min: 20, max: 50, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Pared', min: 1.6, max: 4, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Arbolitos', items: [
      { key: 'trees', type: 'stepper', label: 'Cantidad', min: 4, max: 12 },
      { key: 'treeSize', type: 'range', label: 'Tamaño de los árboles', min: 50, max: 90, step: 1, unit: '%' },
      { key: 'band', type: 'range', label: 'Borde liso arriba y abajo', min: 2, max: 8, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado' }],

  build(p) {
    const issues = [];
    const w = p.wall, H = p.height, apMid = p.diameter / 2 - w / 2;
    const C = TAU * apMid, n = Math.round(p.trees), pitch = C / n;
    const usable = H - 2 * p.band;
    if (usable < 10) return { parts: [], issues: [{ level: 'error', msg: 'El borde liso ocupa casi todo el alto: no entran los árboles.' }] };
    const th = usable * (p.treeSize / 100) + (1 - p.treeSize / 100) * 4;
    const tw = Math.min(pitch - 2, th * 0.68); // lados a ~56°
    const y0 = p.band + (usable - th) / 2;
    const holes = [];
    for (let i = 0; i < n; i++) holes.push(...treeHole((i + 0.5) * pitch, y0, tw, th));
    const region = difference(rect(C / 2, H / 2, C, H), holes);
    if (thinFraction(region, 1.6) > 0.04) issues.push({ level: 'warning', msg: 'Las uniones entre árboles quedan finas: usá menos árboles o un diámetro mayor.' });

    // Cortes cada ~2,5 mm para seguir la curva, sin caer sobre vértices de los huecos
    const xs = holes.flat().map((pt) => pt.x);
    const total = Math.max(48, Math.ceil(C / 2.5));
    const cuts = [];
    for (let i = 0; i <= total; i++) {
      let c = (i * C) / total;
      if (i > 0 && i < total) for (let t = 0; t < 8 && xs.some((x) => Math.abs(x - c) < 0.05); t++) c += 0.11;
      cuts.push(c);
    }
    const geo = wallMesh(region, C, H, w, cuts, makeMapper('round', 0, apMid, C));
    issues.push({ level: 'info', msg: `Diámetro interior: ${(p.diameter - 2 * w).toFixed(0)} mm. Una servilleta de tela doblada necesita unos 35–40 mm.` });
    return { parts: [part('ring', 'Servilletero', p.color, geo, { focus: true })], issues };
  },
};
