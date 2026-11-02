// Galletita de jengibre navideña: silueta propia con ojos, sonrisa, botones y moño en relieve.
// Se imprime plana; la cara se hace en blanco y los botones en otro color.
import { union, difference, intersection, offset, bbox, translate, stroke, area, circle, rect, islandCount, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

const poly = (pts) => {
  const a = pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0);
  return [(a < 0 ? [...pts].reverse() : pts).map(([x, y]) => ({ x, y }))];
};
const smooth = (region, r) => offset(offset(offset(offset(region, r), -r * 2), r), 0); // abre y suaviza puntas
const close = (region, r) => offset(offset(region, r), -r); // rellena huecos angostos (axilas, entrepierna)

/** Silueta de la galleta (mm). Origen en el centro del cuerpo, alto total = H. */
function silhouette(H) {
  const s = (v) => v * H;
  const head = circle(0, s(0.325), s(0.165), 72);
  const torso = stroke([[0, s(0.17)], [0, s(-0.08)]].map(([x, y]) => ({ x, y })), s(0.33));
  const arms = [-1, 1].map((k) => stroke([{ x: k * s(0.1), y: s(0.1) }, { x: k * s(0.3), y: s(0.2) }], s(0.125)));
  const legs = [-1, 1].map((k) => stroke([{ x: k * s(0.085), y: s(-0.1) }, { x: k * s(0.17), y: s(-0.375) }], s(0.145)));
  const all = union(head, torso, ...arms, ...legs);
  return close(all, s(0.03));
}

export default {
  id: 'galleta-jengibre',
  name: 'Galletita de jengibre',
  category: 'hogar',
  description: 'Muñequito de jengibre con carita, botones y moño en relieve, para colgar en el árbol o regalar. Podés escribirle un nombre en el pecho.',
  tags: ['navidad', 'galleta', 'jengibre', 'muñeco', 'adorno', 'árbol', 'regalo', 'gingerbread', 'nombre'],
  printTime: '30–50 min',
  defaults: {
    size: 80, text: '', font: 'titan', thickness: 3.6, iceHeight: 1.2, outline: true, bow: true, buttons: 2, hanger: true, hole: 4,
    colorBase: '#B87333', colorIcing: '#F1F1EC', colorAccent: '#C9302C',
  },
  sections: [
    { title: 'Forma', items: [
      { key: 'size', type: 'range', label: 'Alto de la galleta', min: 45, max: 160, step: 1, unit: 'mm' },
      { key: 'outline', type: 'toggle', label: 'Borde de glaseado' },
      { key: 'bow', type: 'toggle', label: 'Moño' },
      { key: 'buttons', type: 'stepper', label: 'Botones', min: 0, max: 3 },
      { key: 'hanger', type: 'toggle', label: 'Argolla para colgar' },
    ] },
    { title: 'Nombre (opcional)', items: [
      { key: 'text', type: 'text', label: 'Nombre en el pecho', maxLength: 8, placeholder: 'Ej: Juli' },
      { key: 'font', type: 'font', label: 'Tipografía', visibleIf: (p) => !!p.text },
    ] },
    { title: 'Medidas', items: [
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2.4, max: 7, step: 0.1, unit: 'mm' },
      { key: 'iceHeight', type: 'range', label: 'Altura del glaseado', min: 0.6, max: 2.4, step: 0.1, unit: 'mm' },
      { key: 'hole', type: 'range', label: 'Agujero de la argolla', min: 2.5, max: 6, step: 0.1, unit: 'mm', visibleIf: (p) => p.hanger },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Galleta' },
      { key: 'colorIcing', type: 'color', label: 'Glaseado' },
      { key: 'colorAccent', type: 'color', label: 'Botones y moño' },
    ] },
  ],
  photo: { zoom: 0.9 },
  orientations: [{ id: 'flat', label: 'Plana sobre la cama' }],

  build(p) {
    const issues = [];
    const H = p.size, s = (v) => v * H, T = p.thickness, IH = p.iceHeight;
    let cookie = silhouette(H);
    const topY = bbox(cookie).maxY;
    // Argolla sobre la cabeza
    let base = cookie;
    if (p.hanger) {
      const hr = p.hole / 2, R = hr + 2.4, cy = topY + R * 0.45;
      base = difference(union(cookie, circle(0, cy, R, 48), rect(0, topY - 0.5, R * 1.2, R * 1.4)), circle(0, cy, hr, 40));
    }
    if (islandCount(base) > 1) issues.push({ level: 'error', msg: 'La galleta quedó dividida en piezas sueltas. Probá con otro tamaño.' });

    // Glaseado: carita, borde y nombre
    const eyes = [-1, 1].map((k) => circle(k * s(0.055), s(0.35), Math.max(0.9, s(0.019)), 24));
    const smile = (() => {
      const pts = [];
      for (let i = 0; i <= 14; i++) { const a = (-150 + (i / 14) * 120) * Math.PI / 180; pts.push({ x: Math.cos(a) * s(0.075), y: s(0.345) + Math.sin(a) * s(0.075) }); }
      return stroke(pts, Math.max(PRINT.minFeature * 1.5, s(0.017)));
    })();
    let ice = union(...eyes, smile);
    if (p.outline) {
      const w = Math.max(1.2, s(0.026));
      ice = union(ice, difference(cookie, offset(cookie, -w)));
    }
    // Nombre en el pecho
    let name = [];
    const hasText = (p.text || '').trim().length > 0;
    const chestY = hasText ? s(0.065) : 0;
    if (hasText) {
      const box = { w: s(0.27), h: s(0.075) };
      const ref = textRegion(p.text, p.font, 10);
      if (ref.missing.length) issues.push({ level: 'warning', msg: `La tipografía no tiene estos caracteres y se omitieron: ${ref.missing.join(' ')}` });
      const rb = bbox(ref.region);
      if (rb.w > 0) {
        const fit = Math.min(box.w / rb.w, box.h / rb.h), capH = 10 * fit;
        name = translate(textRegion(p.text, p.font, capH).region, 0, chestY);
        if (capH < 4) issues.push({ level: 'warning', msg: `Las letras quedan de ${capH.toFixed(1)} mm: muy chicas. Agrandá la galleta o usá un nombre más corto.` });
        if (thinFraction(name, PRINT.minFeature) > 0.06) issues.push({ level: 'warning', msg: 'Parte del nombre tiene trazos muy finos. Agrandá la galleta o probá otra tipografía.' });
      }
    }
    ice = union(ice, name);

    // Botones y moño (color de acento)
    const nB = Math.round(p.buttons), bY = hasText ? [-0.02, -0.1, -0.18] : [0.07, -0.01, -0.09];
    const rBtn = Math.max(1.3, s(0.024));
    const btns = Array.from({ length: nB }, (_, i) => circle(0, s(bY[i]), rBtn, 28));
    let bow = [];
    if (p.bow) {
      const cy = s(0.19), w = s(0.075), h = s(0.035);
      bow = union(poly([[-w, cy + h], [-w, cy - h], [0, cy]]), poly([[w, cy + h], [w, cy - h], [0, cy]]), circle(0, cy, s(0.02), 24));
    }
    let accent = union(btns.length ? btns : [], bow.length ? bow : []);
    // Sin superposiciones: lo de acento manda sobre el glaseado
    if (accent.length) ice = difference(ice, offset(accent, 0.25));
    ice = intersection(ice, base);
    accent = intersection(accent, base);
    if (p.hanger && p.hole < 3) issues.push({ level: 'warning', msg: 'Con un agujero tan chico cuesta pasar la cinta.' });

    const parts = [
      part('base', 'Galleta', p.colorBase, extrudeRegion(base, 0, T)),
      ice.length ? part('icing', 'Glaseado', p.colorIcing, extrudeRegion(ice, T, T + IH), { focus: true }) : null,
      accent.length && area(accent) > 0.5 ? part('accent', 'Botones y moño', p.colorAccent, extrudeRegion(accent, T, T + IH)) : null,
    ].filter(Boolean);
    return { parts, issues };
  },
};
