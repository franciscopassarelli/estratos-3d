// Organizador de labiales: una columna de celdas en rombo (cuadrados girados 45°).
// Los rombos tienen los techos a 45°, así que se imprime parado sin soportes. Tiene fondo cerrado.
import * as THREE from 'three';
import { union, difference, intersection, offset, rect, bbox, translate, islandCount } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

/** Rombo con semidiagonal horizontal h y vertical k·h (k > 1: techos a más de 45°). */
const diamond = (cx, cy, h, k) => [[{ x: cx, y: cy - k * h }, { x: cx + h, y: cy }, { x: cx, y: cy + k * h }, { x: cx - h, y: cy }]];
const K = 1.2; // techos a ~50°

export default {
  id: 'organizador-labiales',
  name: 'Organizador de labiales',
  category: 'organizacion',
  description: 'Columna de celdas en rombo para labiales, delineadores o cosas chicas. Elegí el tamaño de las celdas, el ancho y el alto.',
  tags: ['labiales', 'maquillaje', 'cosmética', 'tocador', 'baño', 'organizador', 'rombos'],
  printTime: '3–6 h',
  defaults: { item: 24, cols: 2, rows: 7, depth: 50, wall: 1.6, back: true, color: '#F1F1EC' },
  sections: [
    { title: 'Celdas', items: [
      { key: 'item', type: 'range', label: 'Diámetro de lo que guardás', min: 12, max: 40, step: 0.5, unit: 'mm', help: 'Labial: 20–24 mm · Delineador: 10–12 mm' },
      { key: 'cols', type: 'stepper', label: 'Columnas', min: 1, max: 4 },
      { key: 'rows', type: 'stepper', label: 'Filas', min: 3, max: 12 },
      { key: 'depth', type: 'range', label: 'Profundidad', min: 25, max: 90, step: 1, unit: 'mm' },
    ] },
    { title: 'Medidas', items: [
      { key: 'wall', type: 'range', label: 'Paredes', min: 1.2, max: 3, step: 0.1, unit: 'mm' },
      { key: 'back', type: 'toggle', label: 'Fondo cerrado (para que no se caigan para atrás)' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado', matrix: new THREE.Matrix4().makeRotationX(Math.PI / 2) }],

  build(p) {
    const issues = [];
    const w = p.wall;
    // Semidiagonal para que entre un círculo de diámetro «item» (+1 mm de juego)
    const h = (p.item / 2 + 0.5) * Math.sqrt(1 + K * K) / K;
    // Separación entre vecinos (a lo largo de los lados) para dejar una pared de grosor w
    const a = h + (w * Math.sqrt(1 + 1 / (K * K))) / 2;
    const cols = Math.round(p.cols), rows = Math.round(p.rows);
    const pts = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) pts.push({ x: (c + (r % 2 ? 0.5 : 0) - (cols - 1) / 2 - 0.25) * 2 * a, y: r * K * a });
    const holes = union(...pts.map((c) => diamond(c.x, c.y, h, K)));
    const outerR = offset(holes, w, 'miter');
    let frame = difference(outerR, holes);
    // Corte plano abajo y una base para que se pare firme
    const ob = bbox(outerR);
    const cutY = ob.minY + K * h * 0.6;
    frame = intersection(frame, rect(ob.cx, (cutY + ob.maxY) / 2 + 1, ob.w + 4, ob.maxY - cutY + 2));
    const base = rect(ob.cx, cutY + w, ob.w * 0.9, w * 2);
    frame = translate(union(frame, base), 0, -cutY);
    if (islandCount(frame) > 1) issues.push({ level: 'error', msg: 'Las celdas quedaron sueltas. Aumentá las paredes.' });

    const vols = [extrudeRegion(frame, 0, p.depth)];
    if (p.back) {
      const silhouette = translate(intersection(outerR, rect(ob.cx, (cutY + ob.maxY) / 2 + 1, ob.w + 4, ob.maxY - cutY + 2)), 0, -cutY);
      vols.push(extrudeRegion(union(silhouette, translate(base, 0, -cutY)), -1.6, 0));
    }
    const b = bbox(frame);
    if (b.h > 230) issues.push({ level: 'warning', msg: 'Mide más de 23 cm de alto: revisá que entre en tu impresora.' });
    if (b.h / Math.max(b.w, 1) > 3.2) issues.push({ level: 'info', msg: 'Es alto y angosto: imprimilo con brim (borde de adherencia) para que no se mueva.' });
    issues.push({ level: 'info', msg: `${pts.length} celdas. Los techos de los rombos están a 50°: se imprime parado, sin soportes.` });
    return { parts: [part('body', 'Organizador', p.color, vols, { focus: true })], issues };
  },
};
