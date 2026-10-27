import { union, difference, roundedRect, circle, bbox, scale } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';
import * as THREE from 'three';

export default {
  id: 'organizador',
  name: 'Organizador de escritorio',
  category: 'organizacion',
  description: 'Caja con compartimentos o portalápices en grilla, con etiqueta frontal opcional.',
  tags: ['organizador', 'caja', 'lápices', 'escritorio', 'bandeja', 'cajón'],
  printTime: '3–6 h',
  defaults: {
    variant: 'grid', width: 150, depth: 80, height: 70, cols: 3, rows: 1, wall: 2, floor: 2, radius: 6,
    label: 'ESTUDIO', font: 'bungee', labelHeight: 10, labelRelief: 1,
    color: '#F1F1EC', colorLabel: '#2E9E58',
  },
  sections: [
    { title: 'Forma', items: [
      { key: 'variant', type: 'cards', label: 'Compartimentos', options: [
        { value: 'grid', label: 'Rectangulares', hint: 'Divisiones rectas' },
        { value: 'cups', label: 'Portalápices', hint: 'Huecos circulares' },
      ] },
      { key: 'cols', type: 'stepper', label: 'Columnas', min: 1, max: 6 },
      { key: 'rows', type: 'stepper', label: 'Filas', min: 1, max: 4 },
    ] },
    { title: 'Medidas', items: [
      { key: 'width', type: 'range', label: 'Ancho', min: 40, max: 210, step: 1, unit: 'mm' },
      { key: 'depth', type: 'range', label: 'Profundidad', min: 40, max: 210, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto', min: 20, max: 140, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Grosor de pared', min: 0.8, max: 5, step: 0.1, unit: 'mm' },
      { key: 'floor', type: 'range', label: 'Grosor del fondo', min: 1, max: 5, step: 0.1, unit: 'mm' },
      { key: 'radius', type: 'range', label: 'Radio de las esquinas', min: 0, max: 20, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Etiqueta frontal', items: [
      { key: 'label', type: 'text', label: 'Texto (vacío = sin etiqueta)', maxLength: 18, placeholder: 'Ej.: LÁPICES' },
      { key: 'font', type: 'font', label: 'Tipografía', visibleIf: (p) => !!p.label.trim() },
      { key: 'labelHeight', type: 'range', label: 'Altura de letra', min: 5, max: 30, step: 0.5, unit: 'mm', visibleIf: (p) => !!p.label.trim() },
      { key: 'labelRelief', type: 'range', label: 'Relieve', min: 0.6, max: 2, step: 0.1, unit: 'mm', visibleIf: (p) => !!p.label.trim() },
    ] },
    { title: 'Colores', items: [
      { key: 'color', type: 'color', label: 'Cuerpo' },
      { key: 'colorLabel', type: 'color', label: 'Etiqueta', visibleIf: (p) => !!p.label.trim() },
    ] },
  ],
  orientations: [{ id: 'base', label: 'Apoyado sobre el fondo' }],

  build(p) {
    const issues = [];
    const { width: W, depth: D, height: H, wall, floor } = p;
    const cols = Math.round(p.cols), rows = Math.round(p.rows);
    const outer = roundedRect(0, 0, W, D, p.radius, 12);
    const cw = (W - (cols + 1) * wall) / cols, cd = (D - (rows + 1) * wall) / rows;
    if (cw < 8 || cd < 8) return { parts: [], issues: [{ level: 'error', msg: 'Los compartimentos quedan de menos de 8 mm. Reducí columnas o filas, o agrandá el organizador.' }] };
    const cells = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const x = -W / 2 + wall + cw / 2 + i * (cw + wall), y = -D / 2 + wall + cd / 2 + j * (cd + wall);
      if (p.variant === 'cups') cells.push(circle(x, y, Math.min(cw, cd) / 2, 64));
      else cells.push(roundedRect(x, y, cw, cd, Math.max(0.5, p.radius - wall), 8));
    }
    const holes = union(...cells);
    const walls = difference(outer, holes);
    const geoms = [extrudeRegion(outer, 0, floor), extrudeRegion(walls, floor, H)];
    const parts = [part('body', 'Cuerpo', p.color, geoms)];

    if (wall < PRINT.minWall) issues.push({ level: 'warning', msg: `Paredes de ${wall} mm: por debajo de ${PRINT.minWall} mm suelen quedar frágiles o con huecos.` });
    if (floor < 1.2) issues.push({ level: 'warning', msg: 'El fondo es muy delgado; usá al menos 1,2 mm.' });
    if (Math.min(cw, cd) < 18) issues.push({ level: 'info', msg: `Los compartimentos miden ${Math.min(cw, cd).toFixed(1)} mm: pueden quedar chicos para lápices o tijeras.` });
    if (H > Math.min(W, D) * 2.2) issues.push({ level: 'warning', msg: 'Es muy alto en relación a su base: podría volcarse con peso.' });

    if (p.label && p.label.trim()) {
      const maxW = W - 2 * Math.max(p.radius, 3) - 6;
      const maxH = H - floor - 6;
      let lh = Math.min(p.labelHeight, maxH);
      let tr = textRegion(p.label.trim(), p.font, lh);
      const tb = bbox(tr.region);
      let region = tr.region;
      if (tb.w > maxW || tb.h > maxH) {
        const s = Math.min(maxW / tb.w, maxH / tb.h);
        region = scale(region, s);
        lh *= s;
        issues.push({ level: 'info', msg: `La etiqueta se ajustó a ${lh.toFixed(1)} mm de alto para entrar en el frente.` });
      }
      if (lh < 4.5) issues.push({ level: 'warning', msg: 'La etiqueta quedó muy pequeña para imprimirse con detalle.' });
      if (tr.missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres no disponibles: ${tr.missing.join(' ')}` });
      const g = extrudeRegion(region, 0, p.labelRelief);
      if (g) {
        // Plano XY -> frente del organizador (cara y = -D/2), sobresaliendo hacia -Y.
        g.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        g.translate(0, -D / 2, floor + (H - floor) / 2);
        parts.push(part('label', 'Etiqueta', p.colorLabel, g, { focus: true, protrusion: p.labelRelief }));
      }
    }
    return { parts: parts.filter(Boolean), issues };
  },
};
