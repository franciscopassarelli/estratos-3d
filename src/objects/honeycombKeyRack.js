// Llavero de pared panal: celdas hexagonales y ganchos de otro color para colgar llaves.
// Se imprime con la cara de atrás sobre la cama; los ganchos tienen un tope con chanfle a 45° (sin soportes).
import { union, difference, offset, bbox, circle, regularPolygon, islandCount } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Centros de una grilla hexagonal (hexágonos con punta arriba), en mm. */
function hexGrid(cols, rows, s) {
  const r = s / Math.sqrt(3); // radio (centro a vértice) para un ancho entre caras s
  const cells = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) cells.push({ i, j, x: i * s + (j % 2 ? s / 2 : 0), y: -j * 1.5 * r });
  return { cells, r };
}

export default {
  id: 'llavero-pared-panal',
  name: 'Llavero de pared panal',
  category: 'organizacion',
  description: 'Panal de hexágonos para la entrada, con ganchos de otro color para colgar las llaves. Elegí cuántas celdas, cuántos ganchos y una forma irregular que cambia con la semilla.',
  tags: ['llaves', 'llavero', 'pared', 'entrada', 'panal', 'hexágono', 'colgador'],
  printTime: '2–4 h',
  defaults: { cols: 5, rows: 4, cell: 30, line: 3.2, thickness: 4, irregular: true, seed: 5, hooks: 5, hookLength: 12, screw: 4, colorBase: '#26272B', colorHooks: '#E8742A' },
  sections: [
    { title: 'Panal', items: [
      { key: 'cols', type: 'stepper', label: 'Columnas', min: 2, max: 8 },
      { key: 'rows', type: 'stepper', label: 'Filas', min: 2, max: 6 },
      { key: 'irregular', type: 'toggle', label: 'Forma irregular (quita algunas celdas del borde)' },
      { key: 'seed', type: 'stepper', label: 'Semilla de la forma', min: 1, max: 99, visibleIf: (p) => p.irregular },
    ] },
    { title: 'Ganchos', items: [
      { key: 'hooks', type: 'stepper', label: 'Cantidad de ganchos', min: 1, max: 10 },
      { key: 'hookLength', type: 'range', label: 'Largo de los ganchos', min: 8, max: 25, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Medidas', items: [
      { key: 'cell', type: 'range', label: 'Tamaño de cada celda', min: 20, max: 45, step: 1, unit: 'mm' },
      { key: 'line', type: 'range', label: 'Grosor de las líneas', min: 2.4, max: 6, step: 0.1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor del panal', min: 3, max: 8, step: 0.1, unit: 'mm' },
      { key: 'screw', type: 'range', label: 'Agujeros para tornillos', min: 3, max: 6, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Panal' },
      { key: 'colorHooks', type: 'color', label: 'Ganchos' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Con la cara de atrás sobre la cama' }],

  build(p) {
    const issues = [];
    const s = p.cell, L = p.line, T = p.thickness;
    const { cells: all, r } = hexGrid(Math.round(p.cols), Math.round(p.rows), s);
    const rand = rng(Math.round(p.seed) * 977 + 3);

    // Forma irregular: se quitan celdas del borde sin cortar el panal
    let cells = all;
    if (p.irregular) {
      const cols = Math.round(p.cols), rows = Math.round(p.rows);
      cells = all.filter((c) => {
        const edge = c.i === 0 || c.j === 0 || c.i === cols - 1 || c.j === rows - 1;
        const corner = (c.i === 0 || c.i === cols - 1) && (c.j === 0 || c.j === rows - 1);
        return !(edge && rand() < (corner ? 0.75 : 0.35));
      });
    }
    const hex = (c, rad) => regularPolygon(c.x, c.y, rad, 6, Math.PI / 2);
    // Las celdas vecinas comparten pared: apotema exterior = s/2 + L/2, interior = s/2 − L/2
    const dr = L / 2 / Math.cos(Math.PI / 6);
    const rings = cells.map((c) => difference(hex(c, r + dr), hex(c, r - dr)));

    // Dos celdas llenas para atornillar: arriba a la izquierda y arriba a la derecha
    const top = Math.max(...cells.map((c) => c.y));
    const topCells = cells.filter((c) => Math.abs(c.y - top) < 1e-6).sort((a, b) => a.x - b.x);
    const mounts = topCells.length > 1 ? [topCells[0], topCells[topCells.length - 1]] : topCells;
    // Celdas llenas para atornillar (con el agujero en el centro)
    const plates = mounts.map((c) => hex(c, r + dr));
    let lattice = union(...rings, ...plates);
    lattice = difference(lattice, union(...mounts.map((c) => circle(c.x, c.y, p.screw / 2, 32))));
    if (islandCount(lattice) > 1) issues.push({ level: 'error', msg: 'El panal quedó con celdas sueltas. Probá otra semilla o desactivá la forma irregular.' });

    // Ganchos en celdas distintas de las de atornillar, repartidos
    const free = cells.filter((c) => !mounts.includes(c));
    const nh = Math.min(Math.round(p.hooks), free.length);
    const picks = [];
    const order = [...free].sort((a, b) => a.j - b.j || a.i - b.i);
    for (let k = 0; k < nh; k++) picks.push(order[Math.floor(((k + 0.5) * order.length) / nh)]);
    const hooks = [];
    const pegR = r - dr; // llena el hueco de la celda
    for (const c of picks) {
      const stem = hex(c, pegR * 0.62);
      hooks.push(extrudeRegion(hex(c, pegR), 0, T)); // tapón dentro de la celda
      hooks.push(extrudeRegion(stem, T, T + p.hookLength - 3));
      // tope con chanfle de 45°: escalones de 0,3 mm
      for (let k = 0; k < 6; k++) {
        const z0 = T + p.hookLength - 3 + k * 0.5;
        hooks.push(extrudeRegion(offset(stem, Math.min(k + 1, 4) * 0.4), z0, z0 + 0.5));
      }
    }
    if (nh < Math.round(p.hooks)) issues.push({ level: 'info', msg: `Entran ${nh} ganchos en este panal.` });
    issues.push({ level: 'info', msg: 'Para dos colores con un solo extrusor: imprimí el panal y los ganchos por separado y pegá los ganchos en sus celdas, o cambiá de filamento en la capa donde empiezan los ganchos.' });
    const b = bbox(lattice);
    if (b.w > 210 || b.h > 210) issues.push({ level: 'warning', msg: 'El panal mide más de 21 cm: revisá que entre en tu impresora.' });

    return {
      parts: [
        part('base', 'Panal', p.colorBase, extrudeRegion(lattice, 0, T)),
        part('hooks', 'Ganchos', p.colorHooks, hooks, { focus: true, protrusion: 1.6 }),
      ],
      issues,
    };
  },
};
