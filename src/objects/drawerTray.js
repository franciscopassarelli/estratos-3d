import { union, difference, intersection, offset, roundedRect } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

export default {
  id: 'bandeja-cajon',
  name: 'Organizador modular de cajones',
  category: 'organizacion',
  description: 'Bandejas a la medida exacta de tu cajón: cargás el interior del cajón, elegís en cuántos módulos dividirlo y la grilla de compartimentos de cada uno.',
  tags: ['cajón', 'bandeja', 'organizador', 'modular', 'cubiertos', 'herramientas', 'maquillaje', 'gridfinity'],
  printTime: '2–6 h por módulo',
  defaults: {
    drawerW: 300, drawerD: 200, height: 50, tolerance: 1.5,
    modulesX: 2, modulesY: 1, divX: 2, divY: 2,
    wall: 1.6, divider: 1.2, floor: 1.6, radius: 5, dividerPct: 85,
    printSet: 'one', color: '#8B9098',
  },
  sections: [
    { title: 'Medidas del cajón', items: [
      { key: 'drawerW', type: 'range', label: 'Ancho interior del cajón', min: 60, max: 800, step: 1, unit: 'mm' },
      { key: 'drawerD', type: 'range', label: 'Profundidad interior del cajón', min: 60, max: 800, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto de la bandeja', min: 15, max: 120, step: 1, unit: 'mm', help: 'Dejá unos milímetros menos que el alto útil del cajón' },
      { key: 'tolerance', type: 'range', label: 'Holgura total', min: 0, max: 6, step: 0.5, unit: 'mm', help: 'Se resta al ancho y a la profundidad para que entre sin forzar' },
    ] },
    { title: 'Módulos', items: [
      { key: 'modulesX', type: 'stepper', label: 'Módulos a lo ancho', min: 1, max: 6 },
      { key: 'modulesY', type: 'stepper', label: 'Módulos a lo profundo', min: 1, max: 6 },
      { key: 'printSet', type: 'segmented', label: 'Qué descargar', options: [{ value: 'one', label: 'Un módulo' }, { value: 'all', label: 'Todos' }] },
    ] },
    { title: 'Compartimentos de cada módulo', items: [
      { key: 'divX', type: 'stepper', label: 'Columnas', min: 1, max: 8 },
      { key: 'divY', type: 'stepper', label: 'Filas', min: 1, max: 8 },
      { key: 'dividerPct', type: 'range', label: 'Alto de las divisiones', min: 30, max: 100, step: 1, unit: '%', help: 'Más bajas facilitan sacar las cosas con los dedos' },
    ] },
    { title: 'Paredes', items: [
      { key: 'wall', type: 'range', label: 'Pared exterior', min: 1.2, max: 4, step: 0.1, unit: 'mm' },
      { key: 'divider', type: 'range', label: 'Divisiones', min: 0.8, max: 3, step: 0.1, unit: 'mm' },
      { key: 'floor', type: 'range', label: 'Fondo', min: 1, max: 4, step: 0.1, unit: 'mm' },
      { key: 'radius', type: 'range', label: 'Radio de las esquinas', min: 0, max: 15, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Bandeja' }] },
  ],
  orientations: [{ id: 'base', label: 'Apoyada sobre el fondo' }],

  build(p) {
    const issues = [];
    const mx = Math.round(p.modulesX), my = Math.round(p.modulesY);
    const gapIn = 0.6; // separación entre módulos dentro del cajón
    const W = (p.drawerW - p.tolerance - (mx - 1) * gapIn) / mx;
    const D = (p.drawerD - p.tolerance - (my - 1) * gapIn) / my;
    const cx = Math.round(p.divX), cy = Math.round(p.divY);
    const inW = W - 2 * p.wall, inD = D - 2 * p.wall;
    const cw = (inW - (cx - 1) * p.divider) / cx, cd = (inD - (cy - 1) * p.divider) / cy;
    if (cw < 10 || cd < 10) return { parts: [], issues: [{ level: 'error', msg: `Los compartimentos quedan de ${Math.min(cw, cd).toFixed(1)} mm. Usá menos columnas o filas, o menos módulos.` }] };

    const outer = roundedRect(0, 0, W, D, p.radius, 12);
    const inner = offset(outer, -p.wall);
    const cells = [];
    const r = Math.max(0.6, Math.min(p.radius - p.wall, 6));
    for (let i = 0; i < cx; i++) for (let j = 0; j < cy; j++) {
      const x = -inW / 2 + cw / 2 + i * (cw + p.divider), y = -inD / 2 + cd / 2 + j * (cd + p.divider);
      cells.push(roundedRect(x, y, cw, cd, r, 8));
    }
    // Hasta la altura de las divisiones, paredes y divisiones son una sola región; arriba, solo la pared.
    const low = difference(outer, union(...cells));
    const H = p.height, hd = p.floor + (H - p.floor) * (p.dividerPct / 100);
    const one = () => [
      extrudeRegion(outer, 0, p.floor),
      extrudeRegion(low, p.floor, hd),
      H - hd > 0.05 ? extrudeRegion(intersection(difference(outer, inner), low), hd, H) : null,
    ].filter(Boolean);

    const geos = [];
    const count = p.printSet === 'all' ? mx * my : 1;
    const cols = p.printSet === 'all' ? mx : 1;
    const gap = 8;
    for (let k = 0; k < count; k++) {
      const i = k % cols, j = Math.floor(k / cols), rows = Math.ceil(count / cols);
      const dx = (i - (cols - 1) / 2) * (W + gap), dy = ((rows - 1) / 2 - j) * (D + gap);
      for (const g of one()) { g.translate(dx, dy, 0); geos.push(g); }
    }

    issues.push({ level: 'info', msg: `${mx * my === 1 ? 'Una bandeja' : `${mx * my} módulos`} de ${W.toFixed(1)} × ${D.toFixed(1)} mm, con compartimentos de ${cw.toFixed(1)} × ${cd.toFixed(1)} mm.` });
    if (W > PRINT.bed.x || D > PRINT.bed.y) issues.push({ level: 'warning', msg: `Cada módulo mide ${W.toFixed(0)} × ${D.toFixed(0)} mm y no entra en una cama de ${PRINT.bed.x} × ${PRINT.bed.y} mm. Sumá módulos para dividirlo.` });
    else if (p.printSet === 'all' && mx * my > 1) issues.push({ level: 'info', msg: 'Si no entran todos juntos en tu cama, elegí "Un módulo" e imprimilos de a uno: son todos iguales.' });
    if (p.wall < PRINT.minWall) issues.push({ level: 'warning', msg: `Pared de ${p.wall} mm: por debajo de ${PRINT.minWall} mm la bandeja queda flexible.` });
    if (p.divider < PRINT.minFeature) issues.push({ level: 'warning', msg: 'Las divisiones son más finas que dos líneas de extrusión.' });
    return { parts: [part('body', 'Bandeja', p.color, geos)], issues };
  },
};
