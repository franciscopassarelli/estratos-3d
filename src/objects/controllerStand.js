import * as THREE from 'three';
import { union, difference, intersection, bbox, scale, stroke, rect, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

const rad = (d) => (d * Math.PI) / 180;
// (a, b, c) -> (x = c, y = a, z = b): permutación cíclica, conserva las normales
const TO_WORLD = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);

export default {
  id: 'soporte-mandos',
  name: 'Soporte para mandos de consola',
  category: 'tecnologia',
  description: 'Base inclinada para joysticks de PlayStation, Xbox o Switch Pro: los mandos quedan parados y recostados, con separadores y etiqueta al frente. Se imprime parado, sin soportes.',
  tags: ['joystick', 'mando', 'control', 'playstation', 'ps5', 'xbox', 'switch', 'gaming', 'soporte'],
  printTime: '3–6 h',
  defaults: {
    bays: 2, bayWidth: 95, slot: 64, lipHeight: 18, angle: 70, backHeight: 85, thickness: 4.5,
    dividers: true, dividerHeight: 45,
    text: 'GAME ON', font: 'bungee', textHeight: 9, relief: 1,
    color: '#F1F1EC', colorText: '#2563C9',
  },
  sections: [
    { title: 'Mandos', items: [
      { key: 'bays', type: 'stepper', label: 'Cantidad de mandos', min: 1, max: 3 },
      { key: 'bayWidth', type: 'range', label: 'Ancho de cada lugar', min: 60, max: 170, step: 1, unit: 'mm', help: 'Los mangos pueden sobresalir a los costados' },
      { key: 'slot', type: 'range', label: 'Espesor del mando apoyado', min: 35, max: 90, step: 0.5, unit: 'mm', help: 'De adelante hacia atrás, a la altura de los mangos' },
    ] },
    { title: 'Forma', items: [
      { key: 'angle', type: 'range', label: 'Inclinación del respaldo', min: 55, max: 85, step: 1, unit: '°' },
      { key: 'backHeight', type: 'range', label: 'Alto del respaldo', min: 40, max: 140, step: 1, unit: 'mm' },
      { key: 'lipHeight', type: 'range', label: 'Alto del frente', min: 10, max: 35, step: 0.5, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor de las paredes', min: 3, max: 8, step: 0.1, unit: 'mm' },
      { key: 'dividers', type: 'toggle', label: 'Separadores entre mandos', visibleIf: (p) => p.bays > 1 },
      { key: 'dividerHeight', type: 'range', label: 'Alto de los separadores', min: 20, max: 90, step: 1, unit: 'mm', visibleIf: (p) => p.bays > 1 && p.dividers },
    ] },
    { title: 'Etiqueta frontal', items: [
      { key: 'text', type: 'text', label: 'Texto (vacío = sin etiqueta)', maxLength: 18, placeholder: 'Ej.: PLAYER 1' },
      { key: 'font', type: 'font', label: 'Tipografía', visibleIf: (p) => !!p.text.trim() },
      { key: 'textHeight', type: 'range', label: 'Altura de letra', min: 5, max: 25, step: 0.5, unit: 'mm', visibleIf: (p) => !!p.text.trim() },
      { key: 'relief', type: 'range', label: 'Relieve', min: 0.6, max: 2, step: 0.1, unit: 'mm', visibleIf: (p) => !!p.text.trim() },
    ] },
    { title: 'Colores', items: [
      { key: 'color', type: 'color', label: 'Cuerpo' },
      { key: 'colorText', type: 'color', label: 'Etiqueta', visibleIf: (p) => !!p.text.trim() },
    ] },
  ],
  orientations: [{ id: 'standing', label: 'Parado, como se usa', hint: 'Sin soportes', matrix: null }],

  build(p) {
    const issues = [];
    const t = p.thickness, a = rad(p.angle), g = p.slot;
    const lipH = p.lipHeight, bayW = p.bayWidth, n = Math.round(p.bays);
    const Wt = n * bayW + (n > 1 && p.dividers ? 0 : 0);
    // Perfil (a = de adelante hacia atrás, b = altura)
    const footA = t + g + t / 2; // pie del respaldo
    const top = { x: footA + Math.cos(a) * p.backHeight, y: t / 2 + Math.sin(a) * p.backHeight };
    // Refuerzo a ≥ 50° para imprimirse parado sin soportes
    const att = { x: footA + Math.cos(a) * p.backHeight * 0.6, y: t / 2 + Math.sin(a) * p.backHeight * 0.6 };
    const braceFoot = att.x + att.y / Math.tan(rad(52));
    const D = Math.max(braceFoot + t / 2, top.x + t, footA + 25);
    const base = rect(D / 2, t / 2, D, t);
    const lip = rect(t / 2, lipH / 2, t, lipH);
    const back = stroke([{ x: footA, y: t / 2 }, top], t);
    const brace = stroke([att, { x: braceFoot, y: t / 2 }], t * 0.9);
    const clip = (r) => difference(r, rect(0, -250, 2000, 500));
    const profile = clip(union(base, lip, back, brace));
    const geos = [];
    const g0 = extrudeRegion(profile, 0, Wt); g0?.applyMatrix4(TO_WORLD); geos.push(g0);

    if (n > 1 && p.dividers) {
      const hs = Math.min(p.dividerHeight, top.y);
      // Separador: trapecio entre el frente y el respaldo, con el borde superior inclinado hacia adelante
      const plate = [[{ x: 0, y: 0 }, { x: footA + hs / Math.tan(a), y: 0 }, { x: footA + hs / Math.tan(a), y: hs }, { x: t, y: Math.max(lipH, hs * 0.55) }, { x: 0, y: Math.max(lipH, hs * 0.55) }]];
      const shape = clip(difference(intersection(plate, union(rect(D / 2, 150, D, 300))), profile));
      const dt = 3;
      for (let i = 1; i < n; i++) {
        const x0 = i * bayW - dt / 2;
        const gd = extrudeRegion(shape, x0, x0 + dt); gd?.applyMatrix4(TO_WORLD); geos.push(gd);
      }
    }
    const parts = [part('body', 'Cuerpo', p.color, geos)];

    const str = (p.text || '').trim();
    if (str) {
      const tr = textRegion(str, p.font, p.textHeight);
      if (tr.missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres que la tipografía no tiene: ${tr.missing.join(' ')}` });
      let r = tr.region, b = bbox(r);
      const maxW = Wt - 12, maxH = lipH - 4;
      if (b.w > maxW || b.h > maxH) { const s = Math.min(maxW / b.w, maxH / b.h); r = scale(r, s); b = bbox(r); issues.push({ level: 'info', msg: `La etiqueta se ajustó a ${(p.textHeight * s).toFixed(1)} mm de alto para entrar en el frente.` }); }
      if (thinFraction(r, PRINT.minFeature) > 0.08) issues.push({ level: 'warning', msg: 'La etiqueta tiene trazos muy finos. Agrandala o subí el alto del frente.' });
      const lg = extrudeRegion(r, 0, p.relief);
      if (lg) {
        lg.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
        lg.translate(Wt / 2 - b.cx, 0, lipH / 2 - b.cy + t * 0.25);
        parts.push(part('label', 'Etiqueta', p.colorText, lg, { focus: true, protrusion: p.relief }));
      }
    }

    if (lipH < 12) issues.push({ level: 'info', msg: 'Con un frente tan bajo, los mandos pueden deslizarse hacia adelante.' });
    if (top.x > D) issues.push({ level: 'warning', msg: 'El respaldo sobresale por detrás de la base.' });
    issues.push({ level: 'info', msg: 'Medí tu mando apoyado sobre los mangos: DualSense y Xbox rondan los 60–66 mm de espesor; el Pro Controller de Switch, unos 60 mm.' });
    return { parts: parts.filter(Boolean), issues };
  },
};
