// Arbolito zigzag: niveles facetados con aristas en zigzag, sobre una base, con estrella arriba.
// Los escalones entre niveles bajan a 45°: se imprime parado y sin soportes.
import { circle } from '../core/geometry2d.js';
import { extrudeRegion, part, geometryFromMesh } from '../core/mesh.js';

const TAU = Math.PI * 2;

export default {
  id: 'arbol-zigzag',
  name: 'Arbolito zigzag con estrella',
  category: 'hogar',
  description: 'Pino de niveles facetados con aristas en zigzag, base y estrella dorada. Armalo en verde, rojo o dorado y hacé una familia de varios tamaños.',
  tags: ['navidad', 'árbol', 'pino', 'zigzag', 'estrella', 'mesa', 'decoración', 'facetado', 'low poly'],
  printTime: '1–3 h',
  defaults: { height: 150, diameter: 85, tiers: 5, points: 6, ridge: 22, notch: 20, star: true, baseHeight: 6, colorTree: '#2E9E58', colorStar: '#C9A24A', colorBase: '#C9A24A' },
  sections: [
    { title: 'Árbol', items: [
      { key: 'height', type: 'range', label: 'Alto total', min: 70, max: 260, step: 1, unit: 'mm' },
      { key: 'diameter', type: 'range', label: 'Diámetro de abajo', min: 40, max: 160, step: 1, unit: 'mm' },
      { key: 'tiers', type: 'stepper', label: 'Niveles', min: 2, max: 8 },
      { key: 'points', type: 'stepper', label: 'Puntas del zigzag', min: 4, max: 10 },
      { key: 'ridge', type: 'range', label: 'Profundidad del zigzag', min: 0, max: 40, step: 1, unit: '%' },
      { key: 'notch', type: 'range', label: 'Escalón entre niveles', min: 8, max: 32, step: 1, unit: '%' },
    ] },
    { title: 'Detalles', items: [
      { key: 'star', type: 'toggle', label: 'Estrella arriba' },
      { key: 'baseHeight', type: 'range', label: 'Altura de la base', min: 3, max: 14, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorTree', type: 'color', label: 'Árbol' },
      { key: 'colorBase', type: 'color', label: 'Base' },
      { key: 'colorStar', type: 'color', label: 'Estrella', visibleIf: (p) => p.star },
    ] },
  ],
  photo: { zoom: 0.95 },
  orientations: [{ id: 'upright', label: 'Parado sobre la base' }],

  build(p) {
    const issues = [];
    const H = p.height, R = p.diameter / 2, n = Math.round(p.tiers), K = Math.round(p.points), BH = p.baseHeight;
    const ridge = p.ridge / 100, notch = p.notch / 100;
    const tipR = Math.max(2.5, H * 0.02);
    // Estrella: bipirámide con 5 puntas, con la punta de abajo truncada para apoyarse en el árbol
    const Rs = p.star ? Math.max(7, H * 0.075) : 0, rsIn = Rs * 0.5;
    const hLow = p.star ? Rs - tipR : 0, hUp = p.star ? (Rs - tipR) * 1.1 : 0;
    const Ht = H - BH - (p.star ? hLow + hUp : 0);
    if (Ht < H * 0.4) issues.push({ level: 'warning', msg: 'El árbol queda muy bajo frente a la base y la estrella. Subí el alto total.' });

    // Perfil (radio, z) de abajo hacia arriba
    const prof = [[R, BH]];
    const zAt = (i) => BH + (Ht * i) / n;
    const Rb = (i) => R * (1 - i / n) + tipR * (i / n);              // radio de abajo de cada nivel
    let step45 = 0;
    for (let i = 0; i < n; i++) {
      const last = i === n - 1;
      const rTop = last ? tipR : Math.max(tipR, Rb(i + 1) * (1 - notch));
      if (i > 0) {
        const dr = Rb(i) - prof[prof.length - 1][0];            // escalón hacia afuera
        const dz = Math.min(dr * 1.05, (Ht / n) * 0.7);
        prof.push([Rb(i), zAt(i) + dz]);
        if (dz < dr * 1.0) step45 = Math.max(step45, Math.atan2(dr, dz));
      }
      prof.push([rTop, zAt(i + 1)]);
    }
    if (step45 > 0.9) issues.push({ level: 'warning', msg: 'Los escalones entre niveles quedan más planos que 45° y pueden necesitar soportes. Usá menos niveles o un escalón más chico.' });

    // Superficie: anillos con 2K vértices (puntas y valles alternados)
    const N = K * 2, V = [], Tr = [], rings = [];
    prof.forEach(([r, z]) => {
      rings.push(V.length);
      for (let k = 0; k < N; k++) {
        const a = (k / N) * TAU, rr = r * (k % 2 ? 1 - ridge : 1);
        V.push([Math.cos(a) * rr, Math.sin(a) * rr, z]);
      }
    });
    const nx = (k) => (k + 1) % N;
    for (let l = 0; l < rings.length - 1; l++) for (let k = 0; k < N; k++) {
      const a = rings[l] + k, b = rings[l] + nx(k), c = rings[l + 1] + nx(k), d = rings[l + 1] + k;
      Tr.push(a, b, c, a, c, d);
    }
    const cb = V.push([0, 0, BH]) - 1, ct = V.push([0, 0, prof[prof.length - 1][1]]) - 1, last = rings[rings.length - 1];
    for (let k = 0; k < N; k++) { Tr.push(cb, rings[0] + nx(k), rings[0] + k); Tr.push(ct, last + k, last + nx(k)); }

    // Base redonda
    const base = extrudeRegion(circle(0, 0, R + Math.max(3, R * 0.06), 96), 0, BH);

    const parts = [
      part('base', 'Base', p.colorBase, base),
      part('tree', 'Árbol', p.colorTree, geometryFromMesh(V, Tr), { focus: true }),
    ];
    if (p.star) {
      const zTip = prof[prof.length - 1][1], zMid = zTip + hLow, zTop = zMid + hUp;
      const SV = [], ST = [], lo = [], mid = [];
      for (let k = 0; k < 10; k++) {
        const a = Math.PI / 2 + (k / 10) * TAU, rm = k % 2 ? rsIn : Rs;
        lo.push(SV.push([Math.cos(a) * tipR, Math.sin(a) * tipR, zTip]) - 1);
        mid.push(SV.push([Math.cos(a) * rm, Math.sin(a) * rm, zMid]) - 1);
      }
      const c0 = SV.push([0, 0, zTip]) - 1, c1 = SV.push([0, 0, zTop]) - 1, nk = (k) => (k + 1) % 10;
      for (let k = 0; k < 10; k++) {
        ST.push(c0, lo[nk(k)], lo[k]);                            // fondo plano
        ST.push(lo[k], lo[nk(k)], mid[nk(k)], lo[k], mid[nk(k)], mid[k]);   // caras de abajo
        ST.push(c1, mid[k], mid[nk(k)]);                          // caras de arriba
      }
      parts.push(part('star', 'Estrella', p.colorStar, geometryFromMesh(SV, ST)));
    }
    issues.push({ level: 'info', msg: 'Imprimilo parado. La estrella se pega con una gota de adhesivo instantáneo (o imprimila en el mismo color y quedan unidos).' });
    return { parts, issues };
  },
};
