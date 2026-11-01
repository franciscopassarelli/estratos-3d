// Soporte para celular de una sola cinta: la base sube por atrás en una curva en C y sostiene
// un respaldo inclinado con labio abajo. El respaldo puede ir liso o con un diseño grabado.
// Se imprime de costado (el perfil apoyado en la cama): sin soportes y con las capas a favor.
import * as THREE from 'three';
import { union, difference, stroke, rect, roundedRect, intersection, bbox, translate, scale, circle, offset } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';

const rad = (d) => (d * Math.PI) / 180;

/** Manzana genérica (fruta con hoja, sin mordida), alto 1. */
function apple() {
  const body = [];
  for (let i = 0; i < 120; i++) {
    const t = (i / 120) * Math.PI * 2, s = Math.sin(t), c = Math.cos(t);
    // dos lóbulos arriba, base redondeada
    const r = 0.5 + 0.06 * Math.cos(2 * t) - 0.05 * Math.max(0, c) ** 8 - 0.06 * Math.max(0, -c) ** 10;
    body.push({ x: s * r * 1.02, y: c * r * 0.98 });
  }
  const leaf = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40, a = Math.PI * t;
    leaf.push({ x: 0.06 + 0.22 * t, y: 0.52 + 0.2 * t + 0.07 * Math.sin(a) });
  }
  for (let i = 40; i >= 0; i--) {
    const t = i / 40, a = Math.PI * t;
    leaf.push({ x: 0.06 + 0.22 * t, y: 0.52 + 0.2 * t - 0.07 * Math.sin(a) });
  }
  const stem = stroke([{ x: 0, y: 0.42 }, { x: 0.02, y: 0.62 }], 0.05, 'round');
  return union([body], [leaf], stem);
}

/** Cabeza de robot genérica (antenas, ojos), alto 1. */
function robot() {
  const head = difference(roundedRect(0, 0, 1, 0.7, 0.18), union(circle(-0.22, 0.05, 0.09, 32), circle(0.22, 0.05, 0.09, 32), roundedRect(0, -0.2, 0.42, 0.07, 0.035)));
  const ant = union(stroke([{ x: -0.28, y: 0.33 }, { x: -0.38, y: 0.5 }], 0.05), stroke([{ x: 0.28, y: 0.33 }, { x: 0.38, y: 0.5 }], 0.05), circle(-0.38, 0.5, 0.05, 20), circle(0.38, 0.5, 0.05, 20));
  return union(head, ant);
}

const fitInto = (region, w, h) => {
  const b = bbox(region), s = Math.min(w / b.w, h / b.h);
  return translate(scale(region, s), -b.cx * s, -b.cy * s);
};

export default {
  id: 'soporte-celular',
  name: 'Soporte para celular',
  category: 'tecnologia',
  description: 'Una sola cinta que sube por atrás en curva y sostiene el respaldo inclinado. Respaldo liso, con ranuras, ondas, una manzana, un robot o tu nombre grabado. Se imprime de costado, sin soportes.',
  tags: ['celular', 'teléfono', 'escritorio', 'soporte', 'iphone', 'android', 'cargador', 'regalo'],
  printTime: '2–4 h',
  defaults: {
    design: 'liso', text: 'Ana', width: 75, angle: 68, backLength: 110, curve: 28, slot: 12, lipHeight: 11, thickness: 4.5,
    cable: true, color: '#F1F1EC',
  },
  sections: [
    { title: 'Respaldo', items: [
      { key: 'design', type: 'cards', label: 'Diseño', options: [
        { value: 'liso', label: 'Liso', hint: 'Sin grabado' },
        { value: 'ranuras', label: 'Ranuras', hint: 'Líneas finas horizontales' },
        { value: 'ondas', label: 'Ondas', hint: 'Líneas onduladas' },
        { value: 'manzana', label: 'Manzana', hint: 'Fruta con hoja' },
        { value: 'robot', label: 'Robot', hint: 'Cabeza con antenas' },
        { value: 'texto', label: 'Nombre', hint: 'Tu texto grabado' },
      ] },
      { key: 'text', type: 'text', label: 'Texto', maxLength: 12, placeholder: 'Tu nombre', visibleIf: (p) => p.design === 'texto' },
    ] },
    { title: 'Medidas', items: [
      { key: 'width', type: 'range', label: 'Ancho', min: 50, max: 140, step: 1, unit: 'mm', help: 'Celulares: 70–80 mm · Tablets: 120 mm o más' },
      { key: 'angle', type: 'range', label: 'Inclinación del respaldo', min: 55, max: 80, step: 1, unit: '°' },
      { key: 'backLength', type: 'range', label: 'Largo del respaldo', min: 70, max: 160, step: 1, unit: 'mm' },
      { key: 'curve', type: 'range', label: 'Altura de la curva', min: 18, max: 45, step: 1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor de la cinta', min: 3, max: 7, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Apoyo del celular', items: [
      { key: 'slot', type: 'range', label: 'Espacio para el celular (con funda)', min: 7, max: 22, step: 0.5, unit: 'mm' },
      { key: 'lipHeight', type: 'range', label: 'Altura del labio', min: 6, max: 20, step: 0.5, unit: 'mm' },
      { key: 'cable', type: 'toggle', label: 'Paso para el cable de carga' },
    ] },
    { title: 'Colores', items: [{ key: 'color', type: 'color', label: 'Cuerpo' }] },
  ],
  // Geometría nativa: perfil en XY extruido en Z (= de costado sobre la cama).
  orientations: [{ id: 'side', label: 'De costado (recomendado)', hint: 'Sin soportes y con capas a favor de la resistencia' }],
  views: [{ id: 'standing', label: 'Parado', matrix: new THREE.Matrix4().makeRotationX(Math.PI / 2) }],
  useOrientation: 'standing',

  build(p) {
    const issues = [];
    const t = p.thickness, W = p.width, Rc = p.curve, a = rad(p.angle);
    const d = { x: Math.cos(a), y: Math.sin(a) }, n = { x: -Math.sin(a), y: Math.cos(a) }; // a lo largo / hacia el frente
    const L = p.backLength, L1 = Math.min(L * 0.42, 50), L2 = L - L1;

    // Base hacia atrás, curva en C abierta hacia adelante y unión con el respaldo
    const J = { x: 0, y: t / 2 + 2 * Rc };             // punto donde la cinta toca el respaldo
    const bottom = { x: J.x - d.x * L1, y: J.y - d.y * L1 };
    const B = Math.max(Rc * 0.9, J.x + 20);            // donde arranca la curva
    const front = Math.min(bottom.x - p.slot - 14, -L1 * d.x - 18);
    const arc = [];
    for (let i = 0; i <= 48; i++) { const th = -Math.PI / 2 + (Math.PI * i) / 48; arc.push({ x: B + Rc * Math.cos(th), y: t / 2 + Rc + Rc * Math.sin(th) }); }
    const band = stroke([{ x: front, y: t / 2 }, ...arc, { x: J.x + t * 0.3, y: J.y }], t, 'round');

    // Labio: sale del pie del respaldo hacia adelante y sube
    const lb = { x: bottom.x + n.x * t, y: bottom.y + n.y * t };
    const lipPts = [{ x: bottom.x + n.x * t * 0.5, y: bottom.y + n.y * t * 0.5 }, { x: lb.x + n.x * p.slot, y: lb.y + n.y * p.slot },
      { x: lb.x + n.x * p.slot + d.x * p.lipHeight, y: lb.y + n.y * p.slot + d.y * p.lipHeight }];
    const lip = stroke(lipPts, t, 'round');

    // Respaldo: losa en su propio sistema (u a lo largo, v a lo ancho, w hacia el frente)
    const M = new THREE.Matrix4().set(d.x, 0, n.x, J.x, d.y, 0, n.y, J.y, 0, -1, 0, W, 0, 0, 0, 1);
    // Esquinas redondeadas solo arriba (lejos de la cama): las de abajo, rectas, no tienen voladizo
    const slab = union(roundedRect((L2 - L1) / 2, W / 2, L, W, Math.min(8, W / 6)), rect((L2 - L1) / 2, W * 0.75, L, W / 2));
    const depth = Math.min(0.9, t * 0.25);
    let art = [];
    const fu = (L2 - L1) / 2 + L * 0.1, fv = W / 2; // centro del diseño (un poco arriba del medio)
    if (p.design === 'ranuras') {
      for (let u = -L1 + 14; u < L2 - 10; u += 6) art.push(stroke([{ x: u, y: 7 }, { x: u, y: W - 7 }], 1.4, 'round'));
    } else if (p.design === 'ondas') {
      for (let u = -L1 + 16; u < L2 - 12; u += 9) {
        const pts = []; for (let k = 0; k <= 40; k++) { const v = 7 + ((W - 14) * k) / 40; pts.push({ x: u + 2.2 * Math.sin((v / W) * Math.PI * 4), y: v }); }
        art.push(stroke(pts, 1.4, 'round'));
      }
    } else if (p.design === 'manzana' || p.design === 'robot') {
      const sh = p.design === 'manzana' ? apple() : robot();
      // girado: el «arriba» del dibujo apunta hacia arriba del respaldo (u)
      const rot = sh.map((r) => r.map((q) => ({ x: q.y, y: -q.x })));
      const size = Math.min(W * 0.62, L * 0.5);
      art.push(translate(fitInto(rot, size, size), fu, fv));
    } else if (p.design === 'texto' && (p.text || '').trim()) {
      const tx = textRegion(p.text.trim(), 'archivo', 10);
      const rot = tx.region.map((r) => r.map((q) => ({ x: q.y, y: -q.x })));
      art.push(translate(fitInto(rot, Math.min(16, L * 0.2), W * 0.78), fu, fv));
    }
    const pattern = art.length ? offset(offset(intersection(union(...art), roundedRect((L2 - L1) / 2, W / 2, L - 8, W - 8, 4)), 0.15), -0.15) : [];
    const back = [extrudeRegion(slab, 0, t - (pattern.length ? depth : 0))];
    if (pattern.length) back.push(extrudeRegion(difference(slab, pattern), t - depth, t));
    back.forEach((g) => g.applyMatrix4(M));

    // Cinta y labio extruidos a lo ancho; con paso de cable: hueco en la curva y corte en el labio
    const vols = [];
    if (p.cable) {
      const g = 6, hole = rect(B + Rc, t / 2 + Rc, t + 4, 12);
      vols.push(extrudeRegion(band, 0, W / 2 - g), extrudeRegion(difference(band, hole), W / 2 - g, W / 2 + g), extrudeRegion(band, W / 2 + g, W));
      // La parte de arriba del labio arranca en rampa (más alta hacia la punta): el techo del corte queda a 45°
      const upper = extrudeRegion(lip, W / 2 + g, W), z0 = W / 2 + g, pos = upper.attributes.position;
      const tip = lipPts[2], tl = Math.hypot(tip.x - bottom.x, tip.y - bottom.y), ux = (tip.x - bottom.x) / tl, uy = (tip.y - bottom.y) / tl;
      for (let i = 0; i < pos.count; i++) {
        if (Math.abs(pos.getZ(i) - z0) > 1e-4) continue;
        const sx = (pos.getX(i) - bottom.x) * ux + (pos.getY(i) - bottom.y) * uy; // lineal: pendiente pareja
        pos.setZ(i, z0 + Math.min(W - z0 - 1, (sx - t * 0.5) * 1.15));
      }
      if (z0 + (tl - t * 0.5) * 1.15 > W - 1) issues.push({ level: 'info', msg: 'Con este ancho, el corte del cable termina con un techito plano en la punta del labio: suele imprimirse bien, pero podés desactivar el paso del cable.' });
      vols.push(extrudeRegion(lip, 0, W / 2 - g), upper);
    } else vols.push(extrudeRegion(band, 0, W), extrudeRegion(lip, 0, W));

    // Estabilidad: la parte de arriba del respaldo no debería pasar mucho por detrás de la curva
    const topX = J.x + d.x * L2;
    if (topX > B + Rc + 15) issues.push({ level: 'warning', msg: 'El respaldo sobresale mucho por detrás: con el celular puede volcar. Bajá la inclinación o el largo del respaldo.' });
    if (bottom.y < t + 2) issues.push({ level: 'warning', msg: 'El labio queda tocando la mesa: subí la curva o acortá la parte de abajo del respaldo.' });
    if (p.design !== 'liso') issues.push({ level: 'info', msg: `El diseño va grabado ${depth.toFixed(1)} mm en el respaldo. Se puede pintar o rellenar con otro color.` });
    issues.push({ level: 'info', msg: 'Imprimilo de costado como viene: la cinta queda con las capas a lo largo de la curva y aguanta el peso sin quebrarse.' });
    return {
      parts: [
        part('stand', 'Soporte', p.color, vols, { bridges: true }),
        // El grabado tiene menos de 1 mm de profundidad: sus techitos no necesitan soporte
        part('back', 'Respaldo', p.color, back, { focus: true, protrusion: 1 }),
      ],
      issues,
    };
  },
};
