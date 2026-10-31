// Adorno navideño con nombre: bola, estrella, árbol, campana o etiqueta de regalo.
// El texto se ajusta solo al espacio disponible de cada forma.
import { union, difference, intersection, offset, bbox, translate, area, circle, ellipse, roundedRect, rect, islandCount, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

/** Polígono siempre antihorario: si no, al unirlo con otras formas las zonas superpuestas se cancelan. */
const poly = (pts) => {
  const a = pts.reduce((s, [x, y], i) => { const [x2, y2] = pts[(i + 1) % pts.length]; return s + x * y2 - x2 * y; }, 0);
  return [(a < 0 ? [...pts].reverse() : pts).map(([x, y]) => ({ x, y }))];
};
/** Redondea las puntas de una forma (apertura morfológica). */
const soften = (region, r) => (r > 0 ? offset(offset(region, -r), r) : region);

/**
 * Cada forma devuelve su silueta (mm, centrada) y la caja donde entra el texto.
 * H = alto total de la forma, sin contar la argolla.
 */
const SHAPES = {
  bola(H) {
    const R = H * 0.43, capW = R * 0.5, capH = H * 0.1;
    const cy = -H / 2 + R;
    const body = circle(0, cy, R, 128);
    const cap = roundedRect(0, cy + R + capH / 2 - 1, capW, capH + 2, 1.2);
    return { region: union(body, cap), text: { cx: 0, cy, w: R * 1.55, h: R * 0.62 } };
  },
  estrella(H) {
    const R = H * 0.53, r = R * 0.5, pts = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + (i * Math.PI) / 5, k = i % 2 ? r : R;
      pts.push([Math.cos(a) * k, Math.sin(a) * k]);
    }
    const star = soften(poly(pts), Math.max(0.8, H * 0.02));
    const b = bbox(star);
    return { region: translate(star, 0, -b.cy), text: { cx: 0, cy: -b.cy - R * 0.08, w: r * 1.5, h: r * 0.5 } };
  },
  arbol(H) {
    const tri = (yb, yt, w) => poly([[-w / 2, yb], [w / 2, yb], [0, yt]]);
    const tree = union(
      tri(-H * 0.3, H * 0.12, H * 0.86),
      tri(-H * 0.08, H * 0.3, H * 0.68),
      tri(H * 0.12, H * 0.5, H * 0.48),
      rect(0, -H * 0.37, H * 0.18, H * 0.16),
    );
    return { region: soften(tree, Math.max(0.8, H * 0.015)), text: { cx: 0, cy: -H * 0.2, w: H * 0.6, h: H * 0.13 } };
  },
  campana(H) {
    const top = H * 0.5, lipY = -H * 0.28;
    const bell = union(
      circle(0, top - H * 0.25, H * 0.25, 96),
      poly([[-H * 0.25, top - H * 0.25], [H * 0.25, top - H * 0.25], [H * 0.43, lipY], [-H * 0.43, lipY]]),
      ellipse(0, lipY, H * 0.47, H * 0.065, 96),
      circle(0, lipY - H * 0.12, H * 0.09, 48),
      rect(0, lipY - H * 0.06, H * 0.06, H * 0.08),
    );
    return { region: soften(bell, Math.max(0.6, H * 0.012)), text: { cx: 0, cy: -H * 0.07, w: H * 0.5, h: H * 0.15 } };
  },
  etiqueta(H, p) {
    // H es el largo de la etiqueta; el agujero queda adentro, en la punta.
    const w = H, h = H * 0.52, c = h * 0.36;
    const tag = soften(poly([[-w / 2, 0], [-w / 2 + c, h / 2], [w / 2, h / 2], [w / 2, -h / 2], [-w / 2 + c, -h / 2]]), Math.max(1, H * 0.02));
    const holeX = -w / 2 + c * 0.78;
    const tx0 = holeX + p.hole / 2 + p.ringWall + 2, tx1 = w / 2 - Math.max(3, p.rim + 2.5);
    return { region: tag, text: { cx: (tx0 + tx1) / 2, cy: 0, w: tx1 - tx0, h: h * 0.52 }, innerHole: { x: holeX, y: 0 } };
  },
};

export default {
  id: 'adorno-navidad',
  name: 'Adorno navideño con nombre',
  category: 'hogar',
  description: 'Bola, estrella, árbol, campana o etiqueta de regalo con un nombre en relieve a dos colores. El texto se ajusta solo a la forma. Para colgar en el árbol o en los regalos.',
  tags: ['navidad', 'adorno', 'árbol', 'bola', 'estrella', 'campana', 'etiqueta', 'regalo', 'nombre', 'fin de año'],
  printTime: '30–50 min',
  defaults: {
    shape: 'bola', text: 'Sofía', font: 'titan', size: 70, textSize: 100,
    thickness: 3, textHeight: 1.2, rim: 1.6, hole: 4, ringWall: 2.4,
    colorBase: '#C9302C', colorText: '#F1F1EC',
  },
  sections: [
    { title: 'Forma', items: [
      { key: 'shape', type: 'cards', label: 'Adorno', options: [
        { value: 'bola', label: 'Bola', hint: 'Clásica, con tapita' },
        { value: 'estrella', label: 'Estrella', hint: 'Cinco puntas suaves' },
        { value: 'arbol', label: 'Árbol', hint: 'Pino de tres niveles' },
        { value: 'campana', label: 'Campana', hint: 'Con badajo' },
        { value: 'etiqueta', label: 'Etiqueta', hint: 'Para atar a un regalo' },
      ] },
      { key: 'size', type: 'range', label: (p) => (p.shape === 'etiqueta' ? 'Largo' : 'Alto (sin la argolla)'), min: 40, max: 140, step: 1, unit: 'mm' },
      { key: 'rim', type: 'range', label: 'Borde en relieve', min: 0, max: 3, step: 0.1, unit: 'mm', help: '0 = sin borde' },
    ] },
    { title: 'Texto', items: [
      { key: 'text', type: 'text', label: 'Nombre o palabra', maxLength: 14, placeholder: 'Tu nombre' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'textSize', type: 'range', label: 'Tamaño del texto', min: 50, max: 100, step: 1, unit: '%', help: '100 % = lo más grande que entra en la forma' },
    ] },
    { title: 'Medidas', items: [
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2, max: 6, step: 0.1, unit: 'mm' },
      { key: 'textHeight', type: 'range', label: 'Altura del relieve', min: 0.6, max: 3, step: 0.1, unit: 'mm' },
      { key: 'hole', type: 'range', label: 'Agujero para la cinta', min: 2.5, max: 7, step: 0.1, unit: 'mm' },
      { key: 'ringWall', type: 'range', label: 'Pared de la argolla', min: 1.6, max: 4, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Adorno' },
      { key: 'colorText', type: 'color', label: 'Texto y borde' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const S = SHAPES[p.shape] || SHAPES.bola;
    const { region: shape, text: box, innerHole } = S(p.size, p);

    // Argolla arriba (o agujero adentro, en la etiqueta)
    const holeR = p.hole / 2, R = holeR + p.ringWall;
    let outline = shape, holeC;
    if (innerHole) {
      holeC = circle(innerHole.x, innerHole.y, holeR, 48);
    } else {
      const top = bbox(shape).maxY;
      const cy = top + R * 0.55;
      holeC = circle(0, cy, holeR, 48);
      outline = union(shape, circle(0, cy, R, 64), rect(0, top - 0.5, R * 1.1, R * 1.2));
    }
    const base = difference(outline, holeC);

    // Texto ajustado a la caja de la forma
    let text = [];
    if ((p.text || '').trim()) {
      const ref = textRegion(p.text, p.font, 10);
      if (ref.missing.length) issues.push({ level: 'warning', msg: `La tipografía no tiene estos caracteres y se omitieron: ${ref.missing.join(' ')}` });
      const rb = bbox(ref.region);
      if (rb.w > 0) {
        const fit = Math.min(box.w / rb.w, box.h / rb.h);
        const capH = 10 * fit * (p.textSize / 100);
        const t = textRegion(p.text, p.font, capH);
        text = translate(t.region, box.cx, box.cy);
        if (capH < 5) issues.push({ level: 'warning', msg: `Las letras quedan de ${capH.toFixed(1)} mm: muy chicas para leerse bien. Agrandá el adorno o acortá el texto.` });
        const thin = thinFraction(text, PRINT.minFeature);
        if (thin > 0.06) issues.push({ level: 'warning', msg: `Parte del texto tiene trazos de menos de ${PRINT.minFeature} mm (${Math.round(thin * 100)} % del área). Agrandá el adorno o probá otra tipografía.` });
      }
    }

    // Borde en relieve
    let rimR = [];
    if (p.rim > 0) {
      rimR = difference(base, offset(base, -p.rim));
      if (text.length && area(intersection(text, offset(rimR, 0.6))) > 0.05) issues.push({ level: 'warning', msg: 'El texto toca el borde. Bajá el tamaño del texto o el ancho del borde.' });
    }
    if (area(intersection(text, offset(holeC, 0.8))) > 0.01) issues.push({ level: 'error', msg: 'El texto toca el agujero. Bajá el tamaño del texto.' });
    if (islandCount(base) > 1) issues.push({ level: 'error', msg: 'El adorno quedó dividido en piezas sueltas. Probá con otro tamaño.' });
    if (p.ringWall < 2) issues.push({ level: 'warning', msg: 'La pared de la argolla es fina: puede romperse. Se recomiendan 2 mm o más.' });

    const T = p.thickness;
    const raised = union(intersection(text, base), rimR);
    const parts = [
      part('base', 'Adorno', p.colorBase, extrudeRegion(base, 0, T)),
      raised.length ? part('text', 'Texto y borde', p.colorText, extrudeRegion(raised, T, T + p.textHeight), { focus: true }) : null,
    ];
    if (!raised.length) issues.push({ level: 'info', msg: 'Sin texto ni borde: el adorno se imprime de un solo color.' });
    return { parts: parts.filter(Boolean), issues };
  },
};
