// Florero low poly: anillos de polígonos rotados medio lado entre sí, así las caras quedan como triángulos.
// Se descarga sólido para imprimir en modo vaso.
import { geometryFromMesh, part } from '../core/mesh.js';

const TAU = Math.PI * 2;

export default {
  id: 'florero-low-poly',
  name: 'Florero low poly',
  category: 'hogar',
  description: 'Florero facetado con triángulos, con panza y cuello a elección. Hueco para imprimir normal o sólido para modo vaso.',
  tags: ['florero', 'jarrón', 'low poly', 'facetado', 'decoración', 'flores', 'modo vaso'],
  printTime: '1–3 h',
  defaults: { mode: 'hollow', height: 170, diameter: 90, sides: 9, rows: 5, belly: 22, neck: 72, twist: 0, wall: 1.6, floor: 2, color: '#F1F1EC' },
  sections: [
    { title: 'Forma', items: [
      { key: 'mode', type: 'cards', label: 'Tipo de impresión', options: [
        { value: 'hollow', label: 'Hueco', hint: 'Con pared y piso, se imprime normal' },
        { value: 'vase', label: 'Modo vaso', hint: 'Sólido para imprimir en espiral' },
      ] },
      { key: 'sides', type: 'stepper', label: 'Lados', min: 5, max: 14 },
      { key: 'rows', type: 'stepper', label: 'Filas de facetas', min: 2, max: 10 },
      { key: 'belly', type: 'range', label: 'Panza', min: 0, max: 45, step: 1, unit: '%', help: 'Cuánto se ensancha en el medio' },
      { key: 'neck', type: 'range', label: 'Boca', min: 40, max: 120, step: 1, unit: '%', help: 'Diámetro de la boca respecto de la base' },
      { key: 'twist', type: 'range', label: 'Giro', min: 0, max: 120, step: 5, unit: '°' },
    ] },
    { title: 'Medidas', items: [
      { key: 'height', type: 'range', label: 'Alto', min: 80, max: 240, step: 1, unit: 'mm' },
      { key: 'diameter', type: 'range', label: 'Diámetro de la base', min: 50, max: 140, step: 1, unit: 'mm' },
      { key: 'wall', type: 'range', label: 'Pared', min: 1.2, max: 4, step: 0.1, unit: 'mm', visibleIf: (p) => p.mode === 'hollow' },
      { key: 'floor', type: 'range', label: 'Piso', min: 1.2, max: 6, step: 0.1, unit: 'mm', visibleIf: (p) => p.mode === 'hollow' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'En blanco mate o en PLA seda las facetas se marcan con la luz.' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado (modo vaso)' }],

  build(p) {
    const issues = [];
    const n = Math.round(p.sides), L = Math.round(p.rows), H = p.height, R0 = p.diameter / 2;
    const Rn = R0 * (p.neck / 100), bulge = p.belly / 100;
    const twist = (p.twist * Math.PI) / 180;
    // Perfil: base -> panza (a 40 % del alto) -> boca
    const radius = (t) => {
      const lin = R0 + (Rn - R0) * t;
      return lin + R0 * bulge * Math.sin(Math.PI * Math.min(1, t / 0.85));
    };
    const V = [], T = [], rings = [];
    for (let l = 0; l <= L; l++) {
      const t = l / L, z = H * t, R = radius(t), off = (l % 2) * (Math.PI / n) + twist * t;
      rings.push(V.length);
      for (let k = 0; k < n; k++) { const a = off + (k / n) * TAU; V.push([Math.cos(a) * R, Math.sin(a) * R, z]); }
    }
    // Entre anillos alternados: triángulos hacia arriba y hacia abajo (antiprisma)
    for (let l = 0; l < L; l++) {
      const A = rings[l], B = rings[l + 1], up = l % 2 === 0; // si el anillo de arriba está corrido +½ lado
      for (let k = 0; k < n; k++) {
        const k1 = (k + 1) % n;
        if (up) { T.push(A + k, A + k1, B + k); T.push(A + k1, B + k1, B + k); }
        else { T.push(A + k, A + k1, B + k1); T.push(A + k, B + k1, B + k); }
      }
    }
    const c0 = V.push([0, 0, 0]) - 1, top = rings[L];
    for (let k = 0; k < n; k++) T.push(c0, rings[0] + (k + 1) % n, rings[0] + k);
    const hollow = p.mode === 'hollow';
    if (!hollow) {
      const c1 = V.push([0, 0, H]) - 1;
      for (let k = 0; k < n; k++) T.push(c1, top + k, top + (k + 1) % n);
    } else {
      // Pared interior: los mismos anillos corridos hacia adentro el grosor de la pared, desde el piso hasta la boca
      const w = p.wall, F = Math.min(p.floor, H * 0.3), kIn = w / Math.cos(Math.PI / n);
      const inner = [];
      for (let l = 0; l <= L; l++) {
        const t = l / L, z = l === 0 ? F : H * t, tz = z / H, R = radius(tz) - kIn;
        const off = (l % 2) * (Math.PI / n) + twist * t;
        if (R < 3) return { parts: [], issues: [{ level: 'error', msg: 'La pared es demasiado gruesa para este tamaño de boca.' }] };
        inner.push(V.length);
        for (let k = 0; k < n; k++) { const a = off + (k / n) * TAU; V.push([Math.cos(a) * R, Math.sin(a) * R, z]); }
      }
      // Interior (caras mirando hacia adentro): mismo patrón con el orden invertido
      for (let l = 0; l < L; l++) {
        const A = inner[l], B = inner[l + 1], up = l % 2 === 0;
        for (let k = 0; k < n; k++) {
          const k1 = (k + 1) % n;
          if (up) { T.push(A + k, B + k, A + k1); T.push(A + k1, B + k, B + k1); }
          else { T.push(A + k, B + k1, A + k1); T.push(A + k, B + k, B + k1); }
        }
      }
      // Borde de la boca (mira hacia arriba) y piso interior
      const it = inner[L];
      for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; T.push(top + k, top + k1, it + k1); T.push(top + k, it + k1, it + k); }
      const cf = V.push([0, 0, F]) - 1;
      for (let k = 0; k < n; k++) T.push(cf, inner[0] + k, inner[0] + (k + 1) % n);
    }

    // Pendiente máxima de las caras (para el modo vaso)
    let worst = 90;
    for (let l = 0; l < L; l++) {
      const dr = Math.abs(radius((l + 1) / L) - radius(l / L)), dz = H / L;
      worst = Math.min(worst, (Math.atan2(dz, dr) * 180) / Math.PI);
    }
    if (worst < 45) issues.push({ level: 'warning', msg: `Algunas caras quedan muy inclinadas (${worst.toFixed(0)}°): en modo vaso pueden fallar. Bajá la panza o agregá filas.` });
    if (hollow) issues.push({ level: 'info', msg: `Hueco con pared de ${p.wall} mm: se imprime con la configuración normal. Si lo vas a usar con agua, poné 3–4 perímetros o usá PETG.` });
    else issues.push({ level: 'info', msg: 'Se descarga como sólido: en el laminador activá «modo vaso» (Spiral vase) con 3 capas inferiores. Si lo vas a usar con agua, usá una línea de 0,8 mm o PETG.' });
    return { parts: [part('vase', 'Florero', p.color, geometryFromMesh(V, T), { focus: true, protrusion: 1, flat: true })], issues };
  },
};
