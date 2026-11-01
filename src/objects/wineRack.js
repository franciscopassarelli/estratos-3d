// Botellero ondulado: una cinta en serpentina con una cuna por botella.
// Se imprime acostado (el perfil de la S apoyado en la cama) y se usa parado.
import * as THREE from 'three';
import { stroke, bbox, islandCount } from '../core/geometry2d.js';
import { extrudeRegion, part } from '../core/mesh.js';

/**
 * Recorrido de la cinta: bandas casi horizontales unidas por medias vueltas que
 * alternan de lado (un rulo por botella). Cada banda tiene una loma en el medio:
 * la botella queda en la cuna, entre la vuelta y la loma, y no puede rodar.
 * Abajo y arriba la cinta termina en una cola levantada, como una ola.
 */
function layout(n, rb, t) {
  const c = 2;                       // juego alrededor de la botella
  const L = 2.3 * rb;                // distancia entre los centros de las vueltas
  const a = 0.42 * rb;                // altura de la loma
  const bump = (x) => (x <= 0 || x >= L ? 0 : (a * (1 - Math.cos((2 * Math.PI * x) / L))) / 2);
  // Altura a la que apoya la botella (sobre la banda, centrada en la vuelta)
  let lift = 0;
  for (let i = -40; i <= 40; i++) {
    const dx = (rb * i) / 40, h = bump(Math.abs(dx)) + Math.sqrt(Math.max(0, rb * rb - dx * dx)) - rb;
    lift = Math.max(lift, h);
  }
  // Radio de la vuelta (eje de la cinta): la botella apoya abajo y le sobra juego arriba
  const rp = rb + t / 2 + c + lift;
  return { L, a, bump, rp, lift };
}

function path(n, rb, t) {
  const { L, bump, rp } = layout(n, rb, t);
  const pts = [], seg = 40, side = (k) => (k % 2 ? L : 0); // centro de la vuelta k
  const tail = (x0, y0, dir, up) => {  // cola que sube suavemente hacia afuera
    const out = [];
    for (let i = 1; i <= 20; i++) {
      const v = i / 20;
      out.push({ x: x0 + dir * rb * 0.95 * v, y: y0 + up * rb * 0.45 * (1 - Math.cos(Math.PI * v)) / 2 + up * rb * 0.25 * v * v });
    }
    return out;
  };
  // Cola de abajo: sale del lado abierto del primer rulo
  pts.push(...tail(L, 0, 1, 1).reverse());
  for (let k = 0; k <= n; k++) {
    const y = 2 * rp * k;
    const x0 = k === 0 ? L : side(k - 1), x1 = k === n ? L - x0 : side(k);
    for (let i = 0; i <= seg; i++) {
      const x = x0 + ((x1 - x0) * i) / seg;
      pts.push({ x, y: y + bump(x) });
    }
    if (k < n) { // media vuelta hacia arriba, del lado del rulo k
      const cx = side(k), cy = y + rp, dir = cx === 0 ? -1 : 1;
      for (let i = 1; i < seg; i++) {
        const ang = -Math.PI / 2 + (Math.PI * i) / seg;
        pts.push({ x: cx + dir * Math.cos(ang) * rp, y: cy + Math.sin(ang) * rp });
      }
    } else {
      pts.push(...tail(x1, y, x1 === 0 ? -1 : 1, 1));
    }
  }
  return pts;
}

export default {
  id: 'botellero',
  name: 'Botellero ondulado',
  category: 'hogar',
  description: 'Cinta en forma de ola con una cuna para cada botella: la botella queda trabada entre la vuelta y la loma y no rueda. Elegí cuántas botellas y su diámetro. Se imprime acostado, sin soportes.',
  tags: ['botellero', 'vino', 'botellas', 'cocina', 'bar', 'ola', 'decoración', 'regalo'],
  printTime: '4–8 h',
  defaults: { bottles: 2, bottle: 76, width: 80, thickness: 4.5, color: '#26272B' },
  sections: [
    { title: 'Forma', items: [
      { key: 'bottles', type: 'stepper', label: 'Botellas', min: 1, max: 4 },
      { key: 'bottle', type: 'range', label: 'Diámetro de la botella', min: 55, max: 95, step: 1, unit: 'mm', help: 'Vino: 75–78 mm · Espumante: 88–90 mm' },
      { key: 'width', type: 'range', label: 'Ancho de la cinta', min: 40, max: 140, step: 1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor de la cinta', min: 3, max: 8, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Color', items: [{ key: 'color', type: 'color', label: 'Filamento', help: 'Usá PETG o PLA+ con 4 perímetros: tiene que aguantar el peso de las botellas.' }] },
  ],
  orientations: [{ id: 'flat', label: 'Acostado, con la ola sobre la cama' }],
  views: [{ id: 'standing', label: 'Parado', matrix: new THREE.Matrix4().makeRotationX(Math.PI / 2) }],
  useOrientation: 'standing',

  build(p, orientationId = 'flat') {
    const issues = [];
    const n = Math.round(p.bottles), t = p.thickness;
    const line = stroke(path(n, p.bottle / 2, t), t, 'round');
    let region = line;
    if (islandCount(region) > 1) issues.push({ level: 'error', msg: 'La cinta quedó cortada. Probá con otros valores.' });
    const b = bbox(region);
    // Acostado: si es muy alto para la cama, se gira 45° para que entre en diagonal
    const geo = extrudeRegion(region, 0, p.width);
    if (orientationId === 'flat' && b.h > 215 && (b.w + b.h) / Math.SQRT2 <= 215) {
      geo.applyMatrix4(new THREE.Matrix4().makeRotationZ(Math.PI / 4));
      issues.push({ level: 'info', msg: 'Es largo: va en diagonal para entrar en una cama de 22 cm.' });
    }
    if (b.h > 215 && (b.w + b.h) / Math.SQRT2 > 215) issues.push({ level: 'warning', msg: 'Así no entra en una cama de 22 cm, ni en diagonal. Usá menos botellas, botellas más finas o una impresora más grande.' });
    if (t < 4) issues.push({ level: 'warning', msg: 'Con menos de 4 mm de grosor la cinta puede doblarse con el peso de las botellas.' });
    issues.push({ level: 'info', msg: 'Imprimilo con 4 perímetros y 20 % de relleno. Al estar acostado, las capas siguen la curva de la ola y queda muy resistente.' });
    return { parts: [part('rack', 'Botellero', p.color, geo, { focus: true })], issues };
  },
};
