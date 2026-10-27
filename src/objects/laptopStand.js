import * as THREE from 'three';
import { union, difference } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

const rad = (d) => (d * Math.PI) / 180;
const TO_WORLD = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);

export default {
  id: 'soporte-notebook',
  name: 'Base vertical para notebook o tablet',
  category: 'tecnologia',
  description: 'Soporte de escritorio para guardar la notebook o la tablet de pie. La ranura se calcula con el grosor de tu equipo, con o sin funda, y puede tener hasta tres lugares.',
  tags: ['notebook', 'laptop', 'tablet', 'ipad', 'vertical', 'escritorio', 'soporte', 'macbook'],
  printTime: '2–5 h',
  defaults: {
    device: 18, sleeve: 0, clearance: 1, slots: 1, gap: 14,
    length: 140, depth: 70, height: 32, slotDepth: 24, tilt: 5,
    color: '#26272B',
  },
  sections: [
    { title: 'Tu equipo', items: [
      { key: 'device', type: 'range', label: 'Grosor del equipo cerrado', min: 5, max: 45, step: 0.5, unit: 'mm', help: 'Tablet: 6–9 mm · notebook delgada: 14–18 mm · gamer: 25–35 mm' },
      { key: 'sleeve', type: 'range', label: 'Funda (grosor extra)', min: 0, max: 10, step: 0.5, unit: 'mm', help: '0 = sin funda' },
      { key: 'clearance', type: 'range', label: 'Holgura', min: 0.3, max: 4, step: 0.1, unit: 'mm' },
      { key: 'slots', type: 'stepper', label: 'Cantidad de ranuras', min: 1, max: 3 },
      { key: 'gap', type: 'range', label: 'Separación entre ranuras', min: 6, max: 40, step: 0.5, unit: 'mm', visibleIf: (p) => p.slots > 1 },
    ] },
    { title: 'Medidas de la base', items: [
      { key: 'length', type: 'range', label: 'Largo (a lo largo del equipo)', min: 60, max: 210, step: 1, unit: 'mm' },
      { key: 'depth', type: 'range', label: 'Profundidad', min: 40, max: 180, step: 1, unit: 'mm', help: 'Se agranda sola si no entran las ranuras' },
      { key: 'height', type: 'range', label: 'Alto', min: 18, max: 60, step: 0.5, unit: 'mm' },
      { key: 'slotDepth', type: 'range', label: 'Profundidad de la ranura', min: 10, max: 50, step: 0.5, unit: 'mm' },
      { key: 'tilt', type: 'range', label: 'Inclinación', min: 0, max: 15, step: 0.5, unit: '°' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Base' }] },
  ],
  orientations: [{ id: 'base', label: 'Apoyada como se usa', hint: 'Sin soportes' }],

  build(p) {
    const issues = [];
    const s = p.device + p.sleeve + p.clearance;
    const n = Math.round(p.slots);
    const tl = rad(p.tilt);
    const H = p.height, sd = Math.min(p.slotDepth, H - 3);
    if (sd < p.slotDepth) issues.push({ level: 'info', msg: `La ranura se limitó a ${sd.toFixed(1)} mm de profundidad para dejar 3 mm de fondo.` });
    const wallMin = 8;
    const shift = sd * Math.tan(tl);
    const need = n * s + (n - 1) * p.gap + 2 * wallMin + shift;
    const D = Math.max(p.depth, need);
    if (D > p.depth) issues.push({ level: 'info', msg: `La profundidad se agrandó a ${D.toFixed(0)} mm para que entren las ranuras con paredes firmes.` });
    const ch = Math.min(5, H / 4);
    const block = [[{ x: -D / 2, y: 0 }, { x: D / 2, y: 0 }, { x: D / 2, y: H - ch }, { x: D / 2 - ch, y: H }, { x: -D / 2 + ch, y: H }, { x: -D / 2, y: H - ch }]];
    // Ranuras: paralelogramos inclinados hacia atrás (+x), con un chaflán de entrada arriba
    const span = n * s + (n - 1) * p.gap;
    const slots = [];
    const flare = Math.min(2, Math.max(0, (p.gap - 2) / 2));
    const w = s / Math.cos(tl) / 2; // medio ancho horizontal de la ranura inclinada
    for (let i = 0; i < n; i++) {
      const topX = -span / 2 + s / 2 + i * (s + p.gap) + shift / 2;
      const botX = topX - shift;
      const k = Math.tan(tl);
      slots.push([[
        { x: botX - w, y: H - sd }, { x: botX + w, y: H - sd },
        { x: topX + w + 5 * k, y: H + 5 }, { x: topX - w + 5 * k, y: H + 5 },
      ]]);
      if (flare > 0.3) slots.push([[{ x: topX - w - k * flare, y: H - flare }, { x: topX + w - k * flare, y: H - flare }, { x: topX + w + flare, y: H + 0.01 }, { x: topX + w + flare, y: H + 2 }, { x: topX - w - flare, y: H + 2 }, { x: topX - w - flare, y: H + 0.01 }]]);
    }
    const profile = difference(block, union(...slots));
    const g = extrudeRegion(profile, -p.length / 2, p.length / 2);
    g?.applyMatrix4(TO_WORLD);

    issues.push({ level: 'info', msg: `Ranura de ${s.toFixed(1)} mm (${p.device} mm de equipo${p.sleeve ? ` + ${p.sleeve} mm de funda` : ''} + ${p.clearance} mm de holgura).` });
    if (p.length < 80 && p.device > 15) issues.push({ level: 'info', msg: 'Para una notebook, un largo de 100 mm o más la sostiene mejor.' });
    if (H < sd + 3) issues.push({ level: 'warning', msg: 'El fondo bajo la ranura queda muy delgado.' });
    issues.push({ level: 'info', msg: 'Pegale abajo unas gomitas o un paño antideslizante para que no se mueva ni raye el escritorio.' });
    return { parts: [part('body', 'Base', p.color, g)], issues };
  },
};
