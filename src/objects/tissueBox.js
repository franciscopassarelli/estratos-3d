// Caja de pañuelos redonda: cuerpo con ondas horizontales y estrías finas, y una tapa con
// agujero para sacar los pañuelos (o el papel de un rollo de centro). Dos piezas.
import * as THREE from 'three';
import { difference, circle, ellipse } from '../core/geometry2d.js';
import { extrudeRegion, part, geometryFromMesh } from '../core/mesh.js';

const TAU = Math.PI * 2;

function bodyRadius(p, th, t) {
  const tiers = Math.round(p.tiers), f = (t * tiers) % 1;
  const rd = p.texture ? p.ribDepth : 0;
  const R0 = p.inner / 2 + p.wall + rd + 0.6;
  return R0 + p.wave * Math.sin(Math.PI * f) + rd * Math.cos(Math.round(p.ribs) * th);
}

/** Recipiente: pared exterior e interior con piso, abierto arriba. */
function vesselMesh(p) {
  const H = p.height, w = p.wall, F = p.floor;
  const Nt = p.texture ? Math.round(p.ribs) * 4 : 180, L = Math.round(p.tiers) * 20;
  const V = [], T = [], outer = [], inner = [];
  for (let l = 0; l <= L; l++) {
    const t = l / L;
    outer.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = bodyRadius(p, th, t); V.push([Math.cos(th) * r, Math.sin(th) * r, H * t]); }
  }
  for (let l = 0; l <= L; l++) {
    const t = F / H + (1 - F / H) * (l / L);
    inner.push(V.length);
    for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU, r = bodyRadius(p, th, t) - w; V.push([Math.cos(th) * r, Math.sin(th) * r, H * t]); }
  }
  const nx = (k) => (k + 1) % Nt;
  for (let l = 0; l < L; l++) for (let k = 0; k < Nt; k++) {
    const a = outer[l] + k, b = outer[l] + nx(k), c = outer[l + 1] + nx(k), d = outer[l + 1] + k;
    T.push(a, b, c, a, c, d);
    const e = inner[l] + k, f = inner[l] + nx(k), g = inner[l + 1] + nx(k), h = inner[l + 1] + k;
    T.push(e, g, f, e, h, g);
  }
  // borde de arriba
  for (let k = 0; k < Nt; k++) {
    const O0 = outer[L] + k, O1 = outer[L] + nx(k), I0 = inner[L] + k, I1 = inner[L] + nx(k);
    T.push(O0, O1, I1, O0, I1, I0);
  }
  // piso: abajo (mira hacia abajo) y arriba (mira hacia arriba)
  const cb = V.length; V.push([0, 0, 0]);
  const ct = V.length; V.push([0, 0, F]);
  for (let k = 0; k < Nt; k++) {
    T.push(cb, outer[0] + nx(k), outer[0] + k);
    T.push(ct, inner[0] + k, inner[0] + nx(k));
  }
  return geometryFromMesh(V, T);
}

function minInnerTop(p) {
  let m = Infinity;
  for (let k = 0; k < 720; k++) m = Math.min(m, bodyRadius(p, (k / 720) * TAU, 1) - p.wall);
  return m;
}
function maxOuter(p) {
  let m = 0;
  for (let k = 0; k < 720; k++) m = Math.max(m, bodyRadius(p, (k / 720) * TAU, 0.5 / Math.round(p.tiers)));
  return m;
}

export default {
  id: 'caja-panuelos',
  name: 'Caja de pañuelos redonda',
  category: 'hogar',
  description: 'Cilindro con ondas y estrías finas, y tapa con agujero para sacar los pañuelos. Entra un rollo de papel de centro o un paquete de pañuelos. Dos piezas, dos colores.',
  tags: ['pañuelos', 'servilletas', 'caja', 'baño', 'cocina', 'rollo', 'ondas', 'decoración'],
  printTime: '6–10 h',
  defaults: { inner: 112, height: 130, tiers: 3, wave: 6, texture: true, ribs: 90, ribDepth: 0.8, wall: 1.8, floor: 1.6, opening: 'round', hole: 32, colorBody: '#B4BAC2', colorLid: '#8FD8CC' },
  sections: [
    { title: 'Medidas', items: [
      { key: 'inner', type: 'range', label: 'Diámetro interior', min: 70, max: 160, step: 1, unit: 'mm', help: 'Rollo de papel higiénico: 110–115 mm' },
      { key: 'height', type: 'range', label: 'Alto', min: 70, max: 220, step: 1, unit: 'mm' },
    ] },
    { title: 'Forma', items: [
      { key: 'tiers', type: 'stepper', label: 'Ondas', min: 1, max: 6 },
      { key: 'wave', type: 'range', label: 'Profundidad de las ondas', min: 0, max: 14, step: 0.5, unit: 'mm' },
      { key: 'texture', type: 'toggle', label: 'Estrías verticales' },
      { key: 'ribs', type: 'stepper', label: 'Cantidad de estrías', min: 40, max: 160, visibleIf: (p) => p.texture },
      { key: 'ribDepth', type: 'range', label: 'Profundidad de las estrías', min: 0.3, max: 2, step: 0.1, unit: 'mm', visibleIf: (p) => p.texture },
    ] },
    { title: 'Tapa', items: [
      { key: 'opening', type: 'segmented', label: 'Abertura', options: [{ value: 'round', label: 'Redonda' }, { value: 'slot', label: 'Ranura' }] },
      { key: 'hole', type: 'range', label: (p) => (p.opening === 'slot' ? 'Largo de la ranura' : 'Diámetro del agujero'), min: 20, max: 90, step: 1, unit: 'mm' },
    ] },
    { title: 'Paredes', items: [
      { key: 'wall', type: 'range', label: 'Pared', min: 1.2, max: 3, step: 0.1, unit: 'mm' },
      { key: 'floor', type: 'range', label: 'Piso', min: 1.2, max: 3, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBody', type: 'color', label: 'Cuerpo' },
      { key: 'colorLid', type: 'color', label: 'Tapa' },
    ] },
  ],
  orientations: [
    { id: 'body', label: 'Cuerpo', hint: 'Primera pieza: parada, boca arriba' },
    { id: 'lid', label: 'Tapa', hint: 'Segunda pieza: boca abajo, el aro hacia arriba' },
  ],
  views: [{ id: 'assembled', label: 'Armada' }],
  useOrientation: 'assembled',

  build(p, orientationId = 'body') {
    const issues = [];
    const body = vesselMesh(p);
    const Rin = minInnerTop(p), Rout = maxOuter(p) + 1.5;
    const clr = 0.4, lipW = 2, lipH = 7, T = 3.2;
    // Tapa: disco con abertura + aro que encastra adentro del cuerpo
    const open = p.opening === 'slot'
      ? ellipse(0, 0, Math.min(p.hole, Rin * 1.6) / 2, 6, 64)
      : circle(0, 0, Math.min(p.hole, Rin * 1.4) / 2, 96);
    const disc = difference(circle(0, 0, Rout, 180), open);
    const ring = difference(circle(0, 0, Rin - clr, 180), circle(0, 0, Rin - clr - lipW, 180));
    // Se imprime boca abajo: disco en la cama y el aro hacia arriba
    const lid = [extrudeRegion(disc, 0, T), extrudeRegion(ring, T, T + lipH)];
    if (orientationId === 'assembled') {
      const m = new THREE.Matrix4().makeTranslation(0, 0, p.height + T).multiply(new THREE.Matrix4().makeRotationX(Math.PI));
      lid.forEach((g) => g.applyMatrix4(m));
    }
    const h = p.height / Math.round(p.tiers);
    const slope = (Math.atan2(h, p.wave * Math.PI) * 180) / Math.PI;
    if (p.wave > 0 && slope < 45) issues.push({ level: 'warning', msg: `Las ondas quedan muy salidas (${slope.toFixed(0)}° de pendiente): bajá la profundidad o usá menos ondas.` });
    if (Rout * 2 > 215) issues.push({ level: 'warning', msg: 'Es más ancha que una cama de 22 cm. Achicá el diámetro.' });
    issues.push({ level: 'info', msg: `Adentro entra un rollo o paquete de hasta ${(Rin * 2).toFixed(0)} mm de diámetro y ${(p.height - p.floor).toFixed(0)} mm de alto.` });
    issues.push({ level: 'info', msg: 'El cuerpo se puede imprimir en modo vaso (Spiral vase) con piso: sale rapidísimo y en una sola pared.' });
    issues.push({ level: 'info', msg: 'Son dos piezas: elegí «Cuerpo» o «Tapa» en la orientación y descargá cada una.' });
    const parts = [];
    if (orientationId !== 'lid') parts.push(part('body', 'Cuerpo', p.colorBody, body, { focus: true }));
    if (orientationId !== 'body') parts.push(part('lid', 'Tapa', p.colorLid, lid, { focus: orientationId === 'lid' }));
    return {
      parts,
      issues,
      tissue: { z: p.height + T, r: Math.min(p.hole, Rin * 1.4) / 2, slot: p.opening === 'slot' },
    };
  },
};
