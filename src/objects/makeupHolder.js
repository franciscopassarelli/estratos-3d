// Organizador de maquillaje: bandeja baja adelante y tubos hexagonales escalonados atrás para pinceles.
import { union, difference, offset, bbox, regularPolygon, roundedRect, rect } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

export default {
  id: 'organizador-maquillaje',
  name: 'Organizador de maquillaje',
  category: 'organizacion',
  description: 'Bandeja para paletas y labiales con tubos hexagonales escalonados para pinceles, más altos atrás. Elegí cuántos tubos y sus alturas.',
  tags: ['maquillaje', 'pinceles', 'cosmética', 'baño', 'tocador', 'organizador', 'hexágono'],
  printTime: '5–9 h',
  defaults: { cols: 3, rows: 2, cell: 42, front: 70, back: 110, tray: 40, trayHeight: 28, wall: 1.8, color: '#26272B' },
  sections: [
    { title: 'Tubos', items: [
      { key: 'cols', type: 'stepper', label: 'Tubos por fila', min: 2, max: 5 },
      { key: 'rows', type: 'stepper', label: 'Filas', min: 1, max: 2 },
      { key: 'cell', type: 'range', label: 'Ancho de cada tubo', min: 28, max: 60, step: 1, unit: 'mm' },
      { key: 'front', type: 'range', label: 'Alto fila de adelante', min: 40, max: 140, step: 1, unit: 'mm' },
      { key: 'back', type: 'range', label: 'Alto fila de atrás', min: 50, max: 180, step: 1, unit: 'mm', visibleIf: (p) => p.rows > 1 },
    ] },
    { title: 'Bandeja', items: [
      { key: 'tray', type: 'range', label: 'Profundidad de la bandeja', min: 0, max: 80, step: 1, unit: 'mm', help: '0 = sin bandeja' },
      { key: 'trayHeight', type: 'range', label: 'Alto de la bandeja', min: 12, max: 50, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Paredes', min: 1.2, max: 3, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado' }],

  build(p) {
    const issues = [];
    const s = p.cell, R = s / Math.sqrt(3), w = p.wall, k = (w / 2) / Math.cos(Math.PI / 6);
    const cols = Math.round(p.cols), rows = Math.round(p.rows), F = 2;
    const vols = [], cells = [];
    // Filas de hexágonos con punta arriba; la fila de atrás corrida medio tubo, encajada en la de adelante
    for (let r = 0; r < rows; r++) {
      const n = r === 1 ? cols - 1 : cols;
      for (let c = 0; c < n; c++) cells.push({ x: (c - (n - 1) / 2) * s, y: r * 1.5 * R, h: r === 1 ? Math.max(p.back, p.front + 10) : p.front });
    }
    const hex = (c, rad) => regularPolygon(c.x, c.y, rad, 6, Math.PI / 2);
    for (const c of cells) vols.push(extrudeRegion(difference(hex(c, R + k), hex(c, R - k)), 0, c.h));
    const cupsOutline = union(...cells.map((c) => hex(c, R + k)));
    vols.push(extrudeRegion(cupsOutline, 0, F));

    // Bandeja adelante (y negativo), del ancho total de los tubos
    if (p.tray > 0) {
      const cb = bbox(cupsOutline);
      const W = cb.w + 2 * w, D = p.tray + (cb.cy - cb.minY) + w;
      const cy = cb.cy - D / 2;
      const outer = roundedRect(cb.cx, cy, W, D, 4);
      const inner = offset(outer, -w);
      vols.push(extrudeRegion(outer, 0, F));
      vols.push(extrudeRegion(difference(outer, inner), F, p.trayHeight));
      if (p.trayHeight >= p.front) issues.push({ level: 'info', msg: 'La bandeja es tan alta como los tubos de adelante: bajala para que se vean los pinceles.' });
    }
    if (s - w < 26) issues.push({ level: 'info', msg: 'Tubos angostos: entran pinceles finos, pero no los de base o rubor.' });
    issues.push({ level: 'info', msg: `${cells.length} tubos de ${(s - w).toFixed(0)} mm por dentro.` });
    return { parts: [part('body', 'Organizador', p.color, vols, { focus: true })], issues };
  },
};
