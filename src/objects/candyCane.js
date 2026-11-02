// Bastón de caramelo con rayas que siguen la curva y, si querés, ramita de acebo con bayas.
// Se imprime plano. La parte curva sirve para colgarlo de una rama.
import { union, difference, intersection, offset, bbox, translate, stroke, circle } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

const poly = (pts) => {
  const a = pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0);
  return [(a < 0 ? [...pts].reverse() : pts).map(([x, y]) => ({ x, y }))];
};

/** Hoja puntiaguda (dos arcos), de largo L y ancho W, girada `ang` grados desde (cx, cy). */
function leaf(cx, cy, L, W, ang) {
  const n = 14, a = (ang * Math.PI) / 180, pts = [];
  const put = (u, v) => pts.push([cx + u * Math.cos(a) - v * Math.sin(a), cy + u * Math.sin(a) + v * Math.cos(a)]);
  for (let i = 0; i <= n; i++) { const t = i / n; put(t * L, Math.sin(t * Math.PI) * W / 2); }
  for (let i = n - 1; i >= 1; i--) { const t = i / n; put(t * L, -Math.sin(t * Math.PI) * W / 2); }
  return poly(pts);
}

export default {
  id: 'baston-caramelo',
  name: 'Bastón de caramelo',
  category: 'hogar',
  description: 'Bastón rayado con gancho para colgar en el árbol. Podés sumarle acebo con bayas. Rayas rojas, verdes o del color que quieras.',
  tags: ['navidad', 'bastón', 'caramelo', 'candy cane', 'acebo', 'adorno', 'árbol', 'rayas'],
  printTime: '30–60 min',
  defaults: { size: 120, width: 15, thickness: 4, stripes: 7, slant: 55, relief: 0.8, holly: true, colorBase: '#F1F1EC', colorStripe: '#C9302C', colorLeaf: '#2E9E58', colorBerry: '#C9302C' },
  sections: [
    { title: 'Forma', items: [
      { key: 'size', type: 'range', label: 'Alto', min: 60, max: 220, step: 1, unit: 'mm' },
      { key: 'width', type: 'range', label: 'Grosor del bastón', min: 9, max: 30, step: 0.5, unit: 'mm' },
      { key: 'stripes', type: 'stepper', label: 'Rayas', min: 3, max: 14 },
      { key: 'slant', type: 'range', label: 'Inclinación de las rayas', min: 35, max: 70, step: 1, unit: '°' },
      { key: 'holly', type: 'toggle', label: 'Acebo con bayas' },
    ] },
    { title: 'Medidas', items: [
      { key: 'thickness', type: 'range', label: 'Espesor', min: 2.4, max: 8, step: 0.1, unit: 'mm' },
      { key: 'relief', type: 'range', label: 'Altura de las rayas', min: 0.4, max: 2, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Bastón' },
      { key: 'colorStripe', type: 'color', label: 'Rayas' },
      { key: 'colorLeaf', type: 'color', label: 'Hojas', visibleIf: (p) => p.holly },
      { key: 'colorBerry', type: 'color', label: 'Bayas', visibleIf: (p) => p.holly },
    ] },
  ],
  photo: { zoom: 0.9 },
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const H = p.size, w = Math.min(p.width, H * 0.3), T = p.thickness, RL = p.relief;
    const Ro = H * 0.21, Rc = Math.max(w / 2 + 2, Ro - w / 2);       // radio del gancho (eje central)
    const y0 = H / 2 - Ro;                                          // donde termina el tramo recto
    // Eje central: tramo recto + gancho de 215°
    const axis = [];
    const nS = 12;
    for (let i = 0; i <= nS; i++) axis.push({ x: 0, y: -H / 2 + (i / nS) * (y0 + H / 2) });
    const sweep = 215, nA = 48;
    for (let i = 1; i <= nA; i++) { const a = (180 - (i / nA) * sweep) * Math.PI / 180; axis.push({ x: Rc + Math.cos(a) * Rc, y: y0 + Math.sin(a) * Rc }); }
    // Largo acumulado y vectores
    const sAcc = [0];
    for (let i = 1; i < axis.length; i++) sAcc.push(sAcc[i - 1] + Math.hypot(axis[i].x - axis[i - 1].x, axis[i].y - axis[i - 1].y));
    const total = sAcc[sAcc.length - 1];
    const tang = axis.map((q, i) => { const a = axis[Math.max(0, i - 1)], b = axis[Math.min(axis.length - 1, i + 1)]; const L = Math.hypot(b.x - a.x, b.y - a.y) || 1; return { x: (b.x - a.x) / L, y: (b.y - a.y) / L }; });
    const at = (s) => { // punto, tangente interpolados a largo s
      s = Math.min(total, Math.max(0, s));
      let i = 1; while (i < sAcc.length - 1 && sAcc[i] < s) i++;
      const t = (s - sAcc[i - 1]) / ((sAcc[i] - sAcc[i - 1]) || 1);
      const P = { x: axis[i - 1].x + (axis[i].x - axis[i - 1].x) * t, y: axis[i - 1].y + (axis[i].y - axis[i - 1].y) * t };
      const Tg = { x: tang[i - 1].x * (1 - t) + tang[i].x * t, y: tang[i - 1].y * (1 - t) + tang[i].y * t };
      const L = Math.hypot(Tg.x, Tg.y) || 1;
      return { P, t: { x: Tg.x / L, y: Tg.y / L } };
    };

    // Bastón: tramo recto con corte plano abajo + gancho redondeado
    const cutS = y0 + H / 2;
    const shaft = stroke(axis.slice(0, nS + 1), w, 'butt');
    const hook = stroke(axis.slice(nS), w, 'round');
    const cane = union(shaft, hook);

    // Rayas que acompañan la curva
    const per = total / p.stripes;
    const lean = 1 / Math.max(0.35, Math.tan((p.slant * Math.PI) / 180));
    const band = (s0, s1) => {
      const h = w / 2 + 2, m = Math.max(2, Math.round((s1 - s0) / 3));
      const Lc = [], Rc2 = [];
      for (let i = 0; i <= m; i++) {
        const s = s0 + ((s1 - s0) * i) / m, { P, t } = at(s), n = { x: -t.y, y: t.x };
        Lc.push([P.x + n.x * h + t.x * lean * h, P.y + n.y * h + t.y * lean * h]);
        Rc2.push([P.x - n.x * h - t.x * lean * h, P.y - n.y * h - t.y * lean * h]);
      }
      return poly([...Lc, ...Rc2.reverse()]);
    };
    const bands = [];
    for (let i = 0; i < p.stripes; i++) bands.push(band(i * per + per * 0.5, i * per + per));
    let stripes = intersection(union(...bands), cane);
    stripes = offset(offset(stripes, -0.15), 0.15); // quita puntas que se tocan en un solo punto

    // Acebo en el cuello del gancho
    let leaves = [], berries = [];
    if (p.holly) {
      const cx = 0, cy = y0 - w * 0.3, L = Math.max(13, w * 1.5), W = Math.max(6, w * 0.62);
      leaves = union(leaf(cx, cy, L, W, 150), leaf(cx, cy, L, W, 35), leaf(cx, cy, L * 0.9, W * 0.9, -90 + 0));
      const br = Math.max(2.3, w * 0.17);
      berries = union(circle(cx - br * 0.2, cy + br * 0.2, br, 24), circle(cx + br * 1.5, cy - br * 0.6, br, 24), circle(cx + br * 0.2, cy - br * 1.7, br, 24));
      leaves = difference(leaves, berries);
    }
    const holly = union(leaves.length ? leaves : [], berries.length ? berries : []);
    let baseRegion = cane;
    if (holly.length) { baseRegion = difference(cane, holly); stripes = difference(stripes, offset(holly, 0.2)); }
    // el acebo puede sobresalir del bastón: queda unido porque toca su borde
    const top = T + (stripes.length ? RL : 0);

    if (w < 11 && p.stripes > 9) issues.push({ level: 'warning', msg: 'Con tantas rayas en un bastón fino cada una queda muy angosta. Bajá la cantidad de rayas o engrosá el bastón.' });
    if (per * 0.5 < 3) issues.push({ level: 'warning', msg: `Cada raya mide ${(per * 0.5).toFixed(1)} mm de ancho: puede salir irregular. Usá menos rayas o un bastón más alto.` });
    const parts = [
      part('base', 'Bastón', p.colorBase, extrudeRegion(baseRegion, 0, T)),
      stripes.length ? part('stripes', 'Rayas', p.colorStripe, extrudeRegion(stripes, T, top), { focus: true }) : null,
      leaves.length ? part('leaves', 'Hojas', p.colorLeaf, extrudeRegion(leaves, 0, top)) : null,
      berries.length ? part('berries', 'Bayas', p.colorBerry, extrudeRegion(berries, 0, top + 0.6)) : null,
    ].filter(Boolean);
    return { parts, issues };
  },
};
