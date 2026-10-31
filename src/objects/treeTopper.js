// Estrella para la punta del árbol: facetada (con volumen, como tallada) o calada (con ventanas triangulares).
// Se imprime acostada y se ata a la rama de arriba con un precinto o alambre por los agujeros del soporte.
import { union, difference, offset, bbox, circle, roundedRect, islandCount, thinFraction } from '../core/geometry2d.js';
import { extrudeRegion, part, geometryFromMesh } from '../core/mesh.js';

/** Vértices del contorno de la estrella (puntas e interiores alternados, la primera punta arriba). */
function starPoints(n, R, r) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / n, k = i % 2 ? r : R;
    pts.push([Math.cos(a) * k, Math.sin(a) * k]);
  }
  return pts;
}

export default {
  id: 'estrella-arbol',
  name: 'Estrella para la punta del árbol',
  category: 'hogar',
  description: 'Estrella facetada o calada con ventanas, con un soporte que se ata a la rama de arriba. Elegí el tamaño y la cantidad de puntas.',
  tags: ['navidad', 'estrella', 'árbol', 'punta', 'adorno', 'decoración'],
  printTime: '1–3 h',
  defaults: { style: 'faceted', points: 5, size: 130, depth: 22, sharp: 42, thickness: 3, frame: 3.2, stem: true, color: '#C9A24A' },
  sections: [
    { title: 'Forma', items: [
      { key: 'style', type: 'cards', label: 'Estilo', options: [
        { value: 'faceted', label: 'Facetada', hint: 'Con volumen, como tallada' },
        { value: 'open', label: 'Calada', hint: 'Marco con ventanas triangulares' },
      ] },
      { key: 'points', type: 'stepper', label: 'Puntas', min: 4, max: 8 },
      { key: 'size', type: 'range', label: 'Tamaño (de punta a punta)', min: 70, max: 200, step: 1, unit: 'mm' },
      { key: 'sharp', type: 'range', label: 'Grosor de las puntas', min: 30, max: 60, step: 1, unit: '%', help: 'Más bajo = puntas más finas' },
    ] },
    { title: 'Medidas', items: [
      { key: 'depth', type: 'range', label: 'Altura del relieve', min: 8, max: 35, step: 1, unit: '%', visibleIf: (p) => p.style === 'faceted', help: 'Qué tan alto sube el centro respecto del tamaño' },
      { key: 'frame', type: 'range', label: 'Ancho del marco', min: 2, max: 6, step: 0.1, unit: 'mm', visibleIf: (p) => p.style === 'open' },
      { key: 'thickness', type: 'range', label: 'Grosor de la base', min: 2, max: 6, step: 0.1, unit: 'mm' },
      { key: 'stem', type: 'toggle', label: 'Soporte para atar a la rama' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'El dorado seda es el que más brilla con las luces del árbol.' }] },
  ],
  orientations: [{ id: 'flat', label: 'Acostada, con la cara plana sobre la cama' }],

  build(p) {
    const issues = [];
    const n = Math.round(p.points), R = p.size / 2, r = R * (p.sharp / 100), T = p.thickness;
    const pts = starPoints(n, R, r);
    const outline = [pts.map(([x, y]) => ({ x, y }))];
    const volumes = [];

    // Soporte: lengüeta hacia abajo con dos agujeros para un precinto o alambre
    let stem = [];
    if (p.stem) {
      const w = Math.max(10, R * 0.16), L = Math.max(30, R * 0.55);
      const topY = -r * Math.cos(Math.PI / n) + 2; // se mete un poco adentro de la estrella
      const body = roundedRect(0, topY - L / 2, w, L, w / 2);
      const holes = [circle(0, topY - L * 0.45, 2, 32), circle(0, topY - L * 0.8, 2, 32)];
      stem = difference(body, union(...holes));
    }

    if (p.style === 'open') {
      // Marco: la estrella menos una ventana por cada triángulo (centro, punta, interior)
      const f = p.frame;
      const windows = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        windows.push(offset([[{ x: 0, y: 0 }, { x: a[0], y: a[1] }, { x: b[0], y: b[1] }]], -f / 2, 'miter'));
      }
      let frame = difference(outline, union(...windows));
      if (stem.length) frame = union(frame, stem);
      if (islandCount(frame) > 1) issues.push({ level: 'error', msg: 'El marco quedó cortado en partes. Aumentá el ancho del marco.' });
      // Las puntas de la estrella son agudas por naturaleza: solo se mide el marco interior.
      const inner = difference(frame, difference(outline, offset(outline, -Math.max(4, f * 1.5))));
      if (thinFraction(inner, 1.6) > 0.04) issues.push({ level: 'warning', msg: 'Hay partes del marco muy finas. Aumentá el ancho del marco o el grosor de las puntas.' });
      volumes.push(extrudeRegion(frame, 0, T));
      issues.push({ level: 'info', msg: 'Calada: se ven las luces del árbol a través de las ventanas.' });
    } else {
      // Facetada: base plana + caras inclinadas que suben hasta el centro
      const H = (p.size * p.depth) / 100;
      const V = [], Tr = [], m = pts.length;
      const c0 = V.push([0, 0, 0]) - 1, apex = V.push([0, 0, T + H]) - 1;
      const lo = V.length; pts.forEach(([x, y]) => V.push([x, y, 0]));
      const hi = V.length; pts.forEach(([x, y]) => V.push([x, y, T]));
      for (let i = 0; i < m; i++) {
        const j = (i + 1) % m;
        Tr.push(c0, lo + j, lo + i); // fondo (hacia abajo)
        Tr.push(lo + i, lo + j, hi + j, lo + i, hi + j, hi + i); // borde
        Tr.push(apex, hi + i, hi + j); // facetas
      }
      volumes.push(geometryFromMesh(V, Tr));
      if (stem.length) volumes.push(extrudeRegion(stem, 0, T));
      if (H / (R - r) > 1) issues.push({ level: 'info', msg: 'Relieve muy alto: las caras quedan empinadas. Se imprime bien, pero usa más material.' });
    }
    if (p.size > 160) issues.push({ level: 'info', msg: 'Una estrella grande pesa: atala firme a la rama de arriba o a un palito de brochette.' });
    return { parts: [part('star', 'Estrella', p.color, volumes, { focus: true })], issues };
  },
};
