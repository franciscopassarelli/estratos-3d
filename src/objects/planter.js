import { geometryFromMesh, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

const TAU = Math.PI * 2;

function radius(variant, phi, R, p) {
  if (variant === 'faceted') {
    const s = TAU / p.sides;
    const local = ((phi % s) + s) % s;
    return (R * Math.cos(s / 2)) / Math.cos(local - s / 2);
  }
  if (variant === 'waves') return R + p.waveDepth * Math.cos(p.lobes * phi);
  return R;
}

export default {
  id: 'maceta',
  name: 'Maceta geométrica',
  category: 'hogar',
  description: 'Maceta facetada, ondulada o lisa, con giro, conicidad y agujero de drenaje.',
  tags: ['maceta', 'planta', 'decoración', 'hogar', 'jardín', 'suculenta'],
  printTime: '3–8 h',
  defaults: {
    variant: 'faceted', topDiameter: 95, bottomDiameter: 70, height: 85, sides: 6, lobes: 8, waveDepth: 3,
    twist: 40, wall: 2, floor: 3, drain: 8, color: '#B5563A',
  },
  sections: [
    { title: 'Diseño', items: [
      { key: 'variant', type: 'cards', label: 'Superficie', options: [
        { value: 'faceted', label: 'Facetada', hint: 'Caras planas' },
        { value: 'waves', label: 'Ondulada', hint: 'Lóbulos suaves' },
        { value: 'smooth', label: 'Lisa', hint: 'Circular' },
      ] },
      { key: 'sides', type: 'stepper', label: 'Cantidad de caras', min: 3, max: 12, visibleIf: (p) => p.variant === 'faceted' },
      { key: 'lobes', type: 'stepper', label: 'Cantidad de ondas', min: 3, max: 16, visibleIf: (p) => p.variant === 'waves' },
      { key: 'waveDepth', type: 'range', label: 'Profundidad de onda', min: 1, max: 8, step: 0.5, unit: 'mm', visibleIf: (p) => p.variant === 'waves' },
      { key: 'twist', type: 'range', label: 'Giro de abajo hacia arriba', min: 0, max: 120, step: 1, unit: '°', visibleIf: (p) => p.variant !== 'smooth' },
    ] },
    { title: 'Medidas', items: [
      { key: 'topDiameter', type: 'range', label: 'Diámetro superior', min: 40, max: 200, step: 1, unit: 'mm' },
      { key: 'bottomDiameter', type: 'range', label: 'Diámetro inferior', min: 30, max: 200, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto', min: 30, max: 200, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Grosor de pared', min: 1, max: 5, step: 0.1, unit: 'mm' },
      { key: 'floor', type: 'range', label: 'Grosor del fondo', min: 1.2, max: 8, step: 0.1, unit: 'mm' },
      { key: 'drain', type: 'range', label: 'Agujero de drenaje', min: 0, max: 25, step: 0.5, unit: 'mm', help: '0 = sin agujero' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Maceta' }] },
  ],
  orientations: [{ id: 'base', label: 'Apoyada sobre la base' }],

  build(p) {
    const issues = [];
    const variant = p.variant;
    const H = p.height, rb = p.bottomDiameter / 2, rt = p.topDiameter / 2;
    const sides = Math.round(p.sides);
    const twist = variant === 'smooth' ? 0 : (p.twist * Math.PI) / 180;
    const Nt = variant === 'faceted' ? sides * (twist ? 8 : 1) : variant === 'waves' ? Math.round(p.lobes) * 20 : 120;
    const L = twist ? 48 : 1;
    const wallR = variant === 'faceted' ? p.wall / Math.cos(Math.PI / sides) : p.wall * (variant === 'waves' ? 1.1 : 1);
    const params = { ...p, sides, lobes: Math.round(p.lobes) };
    const floorZ = p.floor;
    const drainR = p.drain / 2;

    const minInner = Math.min(rb, rt) - wallR - (variant === 'waves' ? p.waveDepth : 0);
    if (minInner < 8) return { parts: [], issues: [{ level: 'error', msg: 'El interior queda demasiado angosto. Aumentá los diámetros o reducí la pared.' }] };
    if (p.drain > 0 && drainR > minInner - 4) return { parts: [], issues: [{ level: 'error', msg: 'El agujero de drenaje es más grande que el fondo interior.' }] };

    const V = [], Tr = [];
    const ring = (z, R, rot) => {
      const start = V.length;
      for (let k = 0; k < Nt; k++) {
        const phi = (k / Nt) * TAU;
        const r = radius(variant, phi, R, params);
        const th = phi + rot;
        V.push([Math.cos(th) * r, Math.sin(th) * r, z]);
      }
      return start;
    };
    const circleRing = (z, r, rot) => {
      const start = V.length;
      for (let k = 0; k < Nt; k++) { const th = (k / Nt) * TAU + rot; V.push([Math.cos(th) * r, Math.sin(th) * r, z]); }
      return start;
    };
    const quad = (a, b, c, d) => { Tr.push(a, b, c, a, c, d); };
    const nx = (k) => (k + 1) % Nt;

    const O = [], I = [];
    for (let l = 0; l <= L; l++) {
      const z = (H * l) / L, t = z / H;
      O.push(ring(z, rb + (rt - rb) * t, twist * t));
    }
    for (let l = 0; l <= L; l++) {
      const z = floorZ + ((H - floorZ) * l) / L, t = z / H;
      I.push(ring(z, rb + (rt - rb) * t - wallR, twist * t));
    }
    for (let l = 0; l < L; l++) for (let k = 0; k < Nt; k++) {
      quad(O[l] + k, O[l] + nx(k), O[l + 1] + nx(k), O[l + 1] + k);
      quad(I[l] + nx(k), I[l] + k, I[l + 1] + k, I[l + 1] + nx(k));
    }
    for (let k = 0; k < Nt; k++) quad(O[L] + k, O[L] + nx(k), I[L] + nx(k), I[L] + k);
    if (drainR > 0) {
      const B = circleRing(0, drainR, 0), F = circleRing(floorZ, drainR, (twist * floorZ) / H);
      for (let k = 0; k < Nt; k++) {
        quad(O[0] + nx(k), O[0] + k, B + k, B + nx(k));
        quad(I[0] + k, I[0] + nx(k), F + nx(k), F + k);
        quad(B + nx(k), B + k, F + k, F + nx(k));
      }
    } else {
      const c0 = V.push([0, 0, 0]) - 1, c1 = V.push([0, 0, floorZ]) - 1;
      for (let k = 0; k < Nt; k++) { Tr.push(c0, O[0] + nx(k), O[0] + k); Tr.push(c1, I[0] + k, I[0] + nx(k)); }
    }

    if (p.wall < PRINT.minWall) issues.push({ level: 'warning', msg: `Pared de ${p.wall} mm: para una maceta se recomiendan al menos ${PRINT.minWall} mm (3 perímetros).` });
    if (p.drain === 0) issues.push({ level: 'info', msg: 'Sin drenaje: el agua puede acumularse. Si es para plantas reales, agregá un agujero.' });
    if (variant === 'waves' && p.waveDepth * Math.round(p.lobes) > rb * 0.9) issues.push({ level: 'warning', msg: 'Las ondas son muy marcadas para este diámetro: la pared puede quedar irregular.' });
    const taper = (Math.atan2(rt - rb, H) * 180) / Math.PI;
    if (taper > 40) issues.push({ level: 'warning', msg: `Las paredes se abren ${taper.toFixed(0)}° hacia afuera: puede necesitar soportes.` });

    return { parts: [part('body', 'Maceta', p.color, geometryFromMesh(V, Tr), { focus: false })], issues };
  },
};
