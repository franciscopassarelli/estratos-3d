// Llavero placa: cuadrado redondeado con tres líneas de texto dentro de un círculo y un detalle.
// Base de un color y todo el relieve de otro (cambio de filamento en una capa).
import { union, difference, intersection, offset, stroke, bbox, translate, circle, roundedRect, rect, islandCount } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { symbolRegion } from '../core/symbols.js';
import { extrudeRegion, part } from '../core/mesh.js';

/** Arco de circunferencia (grados, sentido antihorario) como trazo. */
function arc(r, a0, a1, w) {
  const pts = [];
  const n = Math.max(8, Math.round(Math.abs(a1 - a0) / 3));
  for (let i = 0; i <= n; i++) { const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180; pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r }); }
  return stroke(pts, w, 'round');
}

function fitLine(str, font, cap, maxW) {
  if (!str.trim()) return { region: [], missing: [] };
  let t = textRegion(str, font, cap);
  const w = bbox(t.region).w;
  if (w > maxW) t = textRegion(str, font, (cap * maxW) / w);
  return t;
}

export default {
  id: 'llavero-placa',
  name: 'Llavero placa con frase',
  category: 'accesorios',
  description: 'Placa cuadrada con tres líneas de texto enmarcadas en un círculo y un detalle abajo: ideal para marcas, emprendimientos o souvenirs. A dos colores.',
  tags: ['llavero', 'placa', 'logo', 'marca', 'emprendimiento', 'souvenir', 'texto', 'dos colores'],
  printTime: '30–50 min',
  defaults: {
    line1: 'TU', line2: 'MARCA', line3: 'AQUÍ', font: 'archivo', size: 42, icon: 'heart', border: true, dashes: true,
    thickness: 3.2, relief: 0.9, colorBase: '#B9A7E0', colorText: '#F1F1EC',
  },
  sections: [
    { title: 'Texto', items: [
      { key: 'line1', type: 'text', label: 'Línea de arriba', maxLength: 12, placeholder: 'TU' },
      { key: 'line2', type: 'text', label: 'Línea principal', maxLength: 10, placeholder: 'MARCA' },
      { key: 'line3', type: 'text', label: 'Línea de abajo', maxLength: 12, placeholder: 'AQUÍ' },
      { key: 'font', type: 'font', label: 'Tipografía' },
    ] },
    { title: 'Detalles', items: [
      { key: 'icon', type: 'cards', label: 'Detalle', options: [
        { value: 'heart', label: 'Corazón', hint: 'Abajo, cortando el círculo' },
        { value: 'star', label: 'Estrella', hint: 'Abajo, cortando el círculo' },
        { value: 'waves', label: 'Olas', hint: 'Dos ondas abajo' },
        { value: 'sparkle', label: 'Destellos', hint: 'En dos esquinas' },
        { value: 'none', label: 'Nada', hint: 'Círculo completo' },
      ] },
      { key: 'dashes', type: 'toggle', label: 'Rayitas a los costados de la línea principal' },
      { key: 'border', type: 'toggle', label: 'Borde en relieve' },
    ] },
    { title: 'Medidas', items: [
      { key: 'size', type: 'range', label: 'Tamaño', min: 32, max: 60, step: 1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2.4, max: 5, step: 0.1, unit: 'mm' },
      { key: 'relief', type: 'range', label: 'Altura del relieve', min: 0.6, max: 2, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Placa' },
      { key: 'colorText', type: 'color', label: 'Relieve' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const S = p.size, rc = S * 0.36, w = Math.max(1, S * 0.026);
    const l1 = fitLine(p.line1 || '', p.font, S * 0.1, rc * 1.2);
    const l2 = fitLine(p.line2 || '', p.font, S * 0.17, rc * 1.75);
    const l3 = fitLine(p.line3 || '', p.font, S * 0.09, rc * 1.2);
    for (const t of [l1, l2, l3]) if (t.missing.length) issues.push({ level: 'warning', msg: `La tipografía no tiene estos caracteres y se omitieron: ${t.missing.join(' ')}` });

    // Ubicación de las líneas
    const h2 = bbox(l2.region).h || S * 0.17;
    const relief = [];
    if (l2.region.length) relief.push(l2.region);
    if (l1.region.length) relief.push(translate(l1.region, 0, h2 / 2 + S * 0.05 + bbox(l1.region).h / 2));
    if (l3.region.length) relief.push(translate(l3.region, 0, -h2 / 2 - S * 0.05 - bbox(l3.region).h / 2));
    if (!relief.length) return { parts: [], issues: [{ level: 'error', msg: 'Escribí al menos una línea.' }] };

    // Círculo con cortes: a los costados si la línea principal se sale, abajo para el detalle
    const w2 = bbox(l2.region).w;
    const gaps = [];
    if (w2 / 2 + 1.5 > rc * 0.92 || p.dashes) {
      const half = (Math.asin(Math.min(0.95, (h2 / 2 + 1.6) / rc)) * 180) / Math.PI;
      gaps.push([-half, half], [180 - half, 180 + half]);
    }
    const iconSize = S * 0.13;
    if (p.icon === 'heart' || p.icon === 'star') gaps.push([270 - 13, 270 + 13]);
    gaps.sort((a, b) => a[0] - b[0]);
    const arcs = [];
    if (!gaps.length) arcs.push(arc(rc, 0, 360, w));
    else {
      for (let i = 0; i < gaps.length; i++) {
        const a0 = gaps[i][1], a1 = i + 1 < gaps.length ? gaps[i + 1][0] : gaps[0][0] + 360;
        if (a1 - a0 > 4) arcs.push(arc(rc, a0, a1, w));
      }
    }
    relief.push(...arcs);
    if (p.dashes && l2.region.length) {
      const x0 = Math.max(w2 / 2 + 2, rc - S * 0.05), len = S * 0.065;
      for (const sx of [-1, 1]) {
        relief.push(stroke([{ x: sx * x0, y: 0 }, { x: sx * (x0 + len), y: 0 }], w, 'round'));
      }
    }
    if (p.icon === 'heart' || p.icon === 'star') {
      const ic = symbolRegion(p.icon, iconSize), ib = bbox(ic);
      relief.push(translate(ic, -ib.cx, -rc - ib.cy));
    } else if (p.icon === 'waves') {
      for (const k of [0, 1]) {
        const pts = [];
        for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push({ x: (t - 0.5) * S * 0.26, y: -rc - S * 0.015 - k * S * 0.045 + Math.sin(t * Math.PI * 3) * S * 0.012 }); }
        relief.push(stroke(pts, w * 0.9, 'round'));
      }
    } else if (p.icon === 'sparkle') {
      const sp = symbolRegion('sparkle', S * 0.12), sb = bbox(sp);
      relief.push(translate(sp, rc * 0.95 - sb.cx, rc * 0.95 - sb.cy), translate(sp, -rc * 0.95 - sb.cx, -rc * 0.95 - sb.cy));
    }

    // Placa con argolla arriba
    const plate = roundedRect(0, 0, S, S, S * 0.17);
    const holeR = 2.4, ringR = holeR + 2.4, cy = S / 2 + holeR * 0.6;
    const base = difference(union(plate, circle(0, cy, ringR, 48), rect(0, S / 2 - 1, ringR * 1.6, 4)), circle(0, cy, holeR, 40));
    if (p.border) relief.push(difference(offset(plate, -S * 0.045), offset(plate, -S * 0.045 - w)));

    let raised = intersection(union(...relief), offset(plate, -1));
    if (islandCount(base) > 1) issues.push({ level: 'error', msg: 'La placa quedó partida.' });
    const T = p.thickness;
    issues.push({ level: 'info', msg: `Para los dos colores, cambiá el filamento en la capa de ${T.toFixed(1)} mm (donde empieza el relieve).` });
    if (S < 36) issues.push({ level: 'info', msg: 'En placas chicas, la línea de arriba y la de abajo quedan con letras finas: usá una tipografía gruesa.' });
    return {
      parts: [
        part('base', 'Placa', p.colorBase, extrudeRegion(base, 0, T)),
        part('relief', 'Relieve', p.colorText, extrudeRegion(raised, T, T + p.relief), { focus: true }),
      ],
      issues,
      ring: { x: 0, y: cy, z: T / 2, dx: 0, dy: 1 },
    };
  },
};
