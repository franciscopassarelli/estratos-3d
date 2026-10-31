// Árbol de Navidad cónico con superficie ondulada y giro. Pensado para imprimir en modo vaso:
// sale una sola pared, rápido y con muy poco material.
import { geometryFromMesh, part } from '../core/mesh.js';

const TAU = Math.PI * 2;

export default {
  id: 'arbol-conico',
  name: 'Árbol de Navidad cónico',
  category: 'hogar',
  description: 'Pino cónico con ondas que giran hacia la punta, para imprimir en modo vaso. Hacé varios de distintos tamaños y colores para la mesa.',
  tags: ['navidad', 'árbol', 'pino', 'cono', 'modo vaso', 'mesa', 'decoración'],
  printTime: '40 min–2 h',
  defaults: { height: 150, diameter: 80, lobes: 9, waveDepth: 5, twist: 140, color: '#2E9E58' },
  sections: [
    { title: 'Forma', items: [
      { key: 'height', type: 'range', label: 'Alto', min: 60, max: 240, step: 1, unit: 'mm' },
      { key: 'diameter', type: 'range', label: 'Diámetro de la base', min: 30, max: 140, step: 1, unit: 'mm' },
      { key: 'lobes', type: 'stepper', label: 'Ondas', min: 0, max: 16 },
      { key: 'waveDepth', type: 'range', label: 'Profundidad de las ondas', min: 1, max: 12, step: 0.5, unit: 'mm', visibleIf: (p) => p.lobes > 0 },
      { key: 'twist', type: 'range', label: 'Giro', min: 0, max: 360, step: 5, unit: '°' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'En PLA seda o con brillo las ondas reflejan la luz.' }] },
  ],
  orientations: [{ id: 'upright', label: 'Parado (modo vaso)' }],

  build(p) {
    const issues = [];
    const H = p.height, R0 = p.diameter / 2, lobes = Math.round(p.lobes);
    const twist = (p.twist * Math.PI) / 180, tipZ = H; // la punta cierra en un vértice
    const Nt = lobes ? lobes * 24 : 120, L = 80;
    const V = [], Tr = [], rings = [];
    for (let l = 0; l < L; l++) {
      const t = l / L, z = H * t;
      const R = R0 * (1 - t), rot = twist * t;
      // Las ondas se achican hacia la punta para no cruzarse
      const depth = Math.min(p.waveDepth, R * 0.45) * (1 - t * 0.6);
      rings.push(V.length);
      for (let k = 0; k < Nt; k++) {
        const phi = (k / Nt) * TAU;
        const r = Math.max(0.2, R + (lobes ? depth * Math.cos(lobes * phi) : 0));
        V.push([Math.cos(phi + rot) * r, Math.sin(phi + rot) * r, z]);
      }
    }
    const nx = (k) => (k + 1) % Nt;
    for (let l = 0; l < L - 1; l++) for (let k = 0; k < Nt; k++) {
      const a = rings[l] + k, b = rings[l] + nx(k), c = rings[l + 1] + nx(k), d = rings[l + 1] + k;
      Tr.push(a, b, c, a, c, d);
    }
    const c0 = V.push([0, 0, 0]) - 1, tip = V.push([0, 0, tipZ]) - 1, last = rings[L - 1];
    for (let k = 0; k < Nt; k++) { Tr.push(c0, rings[0] + nx(k), rings[0] + k); Tr.push(tip, last + k, last + nx(k)); }

    const slope = (Math.atan2(H, R0) * 180) / Math.PI;
    if (slope < 55) issues.push({ level: 'warning', msg: `La pared queda inclinada a ${slope.toFixed(0)}°: en modo vaso conviene que el árbol sea más alto que ancho (más de 55°).` });
    issues.push({ level: 'info', msg: 'Se descarga como un sólido: en el laminador activá «modo vaso» (Spiral vase) con 2–3 capas inferiores. Una línea de 0,6–0,8 mm lo hace más firme.' });
    return { parts: [part('tree', 'Árbol', p.color, geometryFromMesh(V, Tr), { focus: true, protrusion: 1 })], issues };
  },
};
