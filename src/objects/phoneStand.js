import { union, difference, stroke, rect } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';
import * as THREE from 'three';

const rad = (d) => (d * Math.PI) / 180;

export default {
  id: 'soporte-celular',
  name: 'Soporte para celular',
  category: 'tecnologia',
  description: 'Soporte de escritorio con ángulo, ranura y labio ajustables. Se imprime de costado, sin soportes.',
  tags: ['celular', 'teléfono', 'escritorio', 'soporte', 'tablet'],
  printTime: '1–2 h',
  defaults: {
    width: 70, angle: 65, backLength: 95, baseDepth: 90, slot: 12, lipHeight: 12, thickness: 5,
    cable: true, cableWidth: 18, color: '#E8742A',
  },
  sections: [
    { title: 'Medidas', items: [
      { key: 'width', type: 'range', label: 'Ancho', min: 40, max: 160, step: 1, unit: 'mm' },
      { key: 'angle', type: 'range', label: 'Inclinación del respaldo', min: 50, max: 80, step: 1, unit: '°' },
      { key: 'backLength', type: 'range', label: 'Largo del respaldo', min: 50, max: 150, step: 1, unit: 'mm' },
      { key: 'baseDepth', type: 'range', label: 'Profundidad de la base', min: 55, max: 140, step: 1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor de las paredes', min: 3, max: 8, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Apoyo del celular', items: [
      { key: 'slot', type: 'range', label: 'Espacio para el celular (con funda)', min: 7, max: 22, step: 0.5, unit: 'mm' },
      { key: 'lipHeight', type: 'range', label: 'Altura del labio frontal', min: 6, max: 25, step: 0.5, unit: 'mm' },
      { key: 'cable', type: 'toggle', label: 'Abertura para el cable de carga' },
      { key: 'cableWidth', type: 'range', label: 'Ancho de la abertura', min: 10, max: 30, step: 1, unit: 'mm', visibleIf: (p) => p.cable },
    ] },
    { title: 'Colores', items: [
      { key: 'color', type: 'color', label: 'Cuerpo' },
    ] },
  ],
  // Geometría nativa: perfil en XY extruido en Z (= de costado sobre la cama).
  orientations: [
    { id: 'side', label: 'De costado (recomendado)', hint: 'Sin soportes y con capas a favor de la resistencia', matrix: null },
    { id: 'standing', label: 'De pie', hint: 'Como se usa; necesita soportes bajo el respaldo', matrix: new THREE.Matrix4().makeRotationX(Math.PI / 2) },
  ],
  useOrientation: 'standing',

  build(p) {
    const issues = [];
    const T = p.thickness, a = rad(p.angle);
    const foot = { x: T + p.slot + T / 2, y: T / 2 };
    const top = { x: foot.x + Math.cos(a) * p.backLength, y: foot.y + Math.sin(a) * p.backLength };
    const braceFrom = { x: foot.x + Math.cos(a) * p.backLength * 0.62, y: foot.y + Math.sin(a) * p.backLength * 0.62 };
    const rearX = Math.max(p.baseDepth - T / 2, foot.x + 10);

    const W = p.width, lipTop = T + p.lipHeight;
    // Perfil lateral (x = profundidad, y = altura): base + respaldo + refuerzo.
    const baseS = stroke([{ x: 0, y: T / 2 }, { x: rearX + T / 2, y: T / 2 }], T, 'butt');
    const backS = stroke([foot, top], T);
    const braceS = stroke([braceFrom, { x: rearX, y: T / 2 }], T * 0.9);
    const clipBottom = (r) => difference(r, rect(0, -250, 1000, 500));
    const body = clipBottom(union(baseS, backS, braceS));

    // Labio frontal: se dibuja de frente (a = ancho, b = altura) y se extruye en el grosor.
    // La abertura del cable tiene lados a 51° para imprimirse de costado sin soportes.
    let lip = rect(W / 2, (T + lipTop) / 2, W, p.lipHeight);
    if (p.cable) {
      const k = 1.25;
      const g = Math.min(p.cableWidth, W - 20 - 2 * k * p.lipHeight);
      if (g >= 8) {
        lip = difference(lip, [[{ x: (W - g) / 2, y: T - 0.01 }, { x: (W + g) / 2, y: T - 0.01 }, { x: (W + g) / 2 + k * p.lipHeight + 0.5, y: lipTop + 0.5 }, { x: (W - g) / 2 - k * p.lipHeight - 0.5, y: lipTop + 0.5 }]]);
        if (g < p.cableWidth) issues.push({ level: 'info', msg: `La abertura para el cable se limitó a ${g.toFixed(0)} mm por el ancho del soporte.` });
      } else issues.push({ level: 'warning', msg: 'El soporte es demasiado angosto para la abertura del cable; se omitió.' });
    }
    const lipGeo = extrudeRegion(lip, 0, T);
    // (a, b, c) -> (x = T - c, y = b, z = a): rotación sin reflejo, mantiene las normales hacia afuera.
    if (lipGeo) lipGeo.applyMatrix4(new THREE.Matrix4().set(0, 0, -1, T, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1));

    const parts = [part('body', 'Cuerpo', p.color, [extrudeRegion(body, 0, W), lipGeo])];

    if (top.x > p.baseDepth - T / 2) issues.push({ level: 'warning', msg: 'El respaldo sobresale por detrás de la base: el celular podría volcarlo. Aumentá la profundidad de la base o el ángulo.' });
    if (p.lipHeight < T + 3) issues.push({ level: 'info', msg: 'Con un labio tan bajo, el celular puede deslizarse.' });
    if (W < 55) issues.push({ level: 'info', msg: 'Con menos de 55 mm de ancho, el soporte es menos estable para celulares grandes.' });
    return { parts: parts.filter(Boolean), issues };
  },
};
