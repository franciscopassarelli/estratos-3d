// Llavero inicial: una letra grande con el nombre en relieve adentro.
// El nombre se acomoda solo: prueba acostado y parado, y elige donde entra más grande.
import { union, difference, intersection, offset, bbox, translate, scale, circle, rect, area, islandCount } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';

const rot90 = (region) => region.map((r) => r.map((p) => ({ x: -p.y, y: p.x }))); // se lee de abajo hacia arriba

/** Busca el lugar y el tamaño más grande en que un rectángulo w×h (girado o no) entra en la región. */
function bestSpot(inner, w, h) {
  const ib = bbox(inner);
  let best = null;
  for (const turned of [false, true]) {
    const W = turned ? h : w, Hh = turned ? w : h;
    const sMax = Math.min(ib.w / W, ib.h / Hh);
    for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
      const cx = ib.minX + (ib.w * (i + 0.5)) / 11, cy = ib.minY + (ib.h * (j + 0.5)) / 11;
      const fits = (s) => area(difference(rect(cx, cy, W * s, Hh * s), inner)) < 1e-3;
      if (!fits(sMax * 0.08)) continue;
      if (best && !fits(best.s * 1.001)) continue; // no puede mejorar
      let lo = sMax * 0.08, hi = sMax;
      for (let k = 0; k < 9; k++) { const m = (lo + hi) / 2; if (fits(m)) lo = m; else hi = m; }
      if (!best || lo > best.s) best = { s: lo, cx, cy, turned };
    }
  }
  return best;
}

export default {
  id: 'llavero-inicial',
  name: 'Llavero inicial con nombre',
  category: 'accesorios',
  description: 'La inicial bien grande con el nombre completo en relieve adentro. El nombre se acomoda solo donde entra mejor. A dos colores.',
  tags: ['llavero', 'inicial', 'letra', 'nombre', 'niños', 'regalo', 'dos colores', 'mochila'],
  printTime: '30–60 min',
  defaults: { letter: 'E', name: 'Emilia', letterFont: 'titan', nameFont: 'archivo', height: 45, thickness: 4, relief: 1, margin: 1.8, colorBase: '#F4A7C3', colorText: '#F1F1EC' },
  sections: [
    { title: 'Letra y nombre', items: [
      { key: 'letter', type: 'text', label: 'Inicial', maxLength: 1, placeholder: 'E' },
      { key: 'name', type: 'text', label: 'Nombre', maxLength: 14, placeholder: 'Emilia' },
      { key: 'letterFont', type: 'font', label: 'Tipografía de la inicial' },
      { key: 'nameFont', type: 'font', label: 'Tipografía del nombre' },
    ] },
    { title: 'Medidas', items: [
      { key: 'height', type: 'range', label: 'Alto de la inicial', min: 30, max: 70, step: 1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2.4, max: 6, step: 0.1, unit: 'mm' },
      { key: 'relief', type: 'range', label: 'Altura del nombre', min: 0.6, max: 2, step: 0.1, unit: 'mm' },
      { key: 'margin', type: 'range', label: 'Margen alrededor del nombre', min: 1, max: 4, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Inicial' },
      { key: 'colorText', type: 'color', label: 'Nombre' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const ch = [...String(p.letter || '').trim()][0]?.toUpperCase() || '';
    const L = ch ? textRegion(ch, p.letterFont, p.height) : { region: [], missing: [] };
    if (!L.region.length) return { parts: [], issues: [{ level: 'error', msg: 'Escribí una inicial que tenga la tipografía elegida.' }] };
    let letter = L.region;
    const lb = bbox(letter);

    // Argolla arriba, sobre el borde izquierdo de la parte de arriba de la letra
    const holeR = 2.6, R = holeR + 2.6;
    const topBand = intersection(letter, rect(lb.cx, lb.maxY - lb.h * 0.12, lb.w + 2, lb.h * 0.24));
    const tb = bbox(topBand);
    const hx = Math.min(tb.minX + R, tb.cx), hy = lb.maxY + holeR * 0.5;
    let base = difference(union(letter, circle(hx, hy, R, 56)), circle(hx, hy, holeR, 40));

    // Nombre
    const parts = [];
    const name = String(p.name || '').trim();
    if (name) {
      const N = textRegion(name, p.nameFont, 1);
      if (N.missing.length) issues.push({ level: 'warning', msg: `La tipografía del nombre no tiene estos caracteres y se omitieron: ${N.missing.join(' ')}` });
      const nb = bbox(N.region);
      const inner = offset(difference(letter, offset(circle(hx, hy, R, 40), p.margin)), -p.margin);
      const spot = inner.length ? bestSpot(inner, nb.w, nb.h) : null;
      if (!spot) issues.push({ level: 'warning', msg: 'El nombre no entra en esta letra. Probá con una inicial más grande o un margen menor.' });
      else {
        let n = scale(translate(N.region, -nb.cx, -nb.cy), spot.s);
        if (spot.turned) n = rot90(n);
        n = intersection(translate(n, spot.cx, spot.cy), inner);
        const cap = spot.s;
        if (cap < 3.5) issues.push({ level: 'warning', msg: `El nombre queda con letras de ${cap.toFixed(1)} mm: puede no leerse bien. Usá una inicial más grande o un nombre más corto.` });
        parts.push(part('name', 'Nombre', p.colorText, extrudeRegion(n, p.thickness, p.thickness + p.relief), { focus: true }));
      }
    }
    if (islandCount(base) > 1) issues.push({ level: 'error', msg: 'La argolla quedó separada de la letra.' });
    parts.unshift(part('base', 'Inicial', p.colorBase, extrudeRegion(base, 0, p.thickness), { focus: !name }));
    issues.push({ level: 'info', msg: `Para los dos colores, cambiá el filamento en la capa de ${p.thickness.toFixed(1)} mm.` });
    return { parts: parts.filter(Boolean), issues, ring: { x: hx, y: hy, z: p.thickness / 2, dx: -0.3, dy: 1 } };
  },
};
