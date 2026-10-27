import { union, difference, intersection, offset, bbox, translate, area, circle, roundedRect, rect, islandCount, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { symbolRegion } from '../core/symbols.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

export default {
  id: 'llavero',
  name: 'Llavero con nombre',
  category: 'accesorios',
  description: 'Un nombre o palabra corta con argolla, en relieve, grabado o incrustado a dos colores.',
  tags: ['llavero', 'nombre', 'regalo', 'texto'],
  printTime: '20–40 min',
  defaults: {
    variant: 'contour', text: 'Sofía', font: 'archivo', letterHeight: 11, symbol: 'none',
    mode: 'relief', thickness: 3, textHeight: 1.2, padding: 3, rim: 0,
    holeSide: 'left', hole: 4.5, ringWall: 2.6,
    colorBase: '#2563C9', colorText: '#F1F1EC',
  },
  sections: [
    { title: 'Forma', items: [
      { key: 'variant', type: 'cards', label: 'Estilo', options: [
        { value: 'contour', label: 'Contorno', hint: 'La base sigue la forma de las letras' },
        { value: 'capsule', label: 'Cápsula', hint: 'Extremos redondeados' },
        { value: 'rect', label: 'Placa', hint: 'Rectángulo con esquinas suaves' },
      ] },
      { key: 'holeSide', type: 'segmented', label: 'Argolla', options: [{ value: 'left', label: 'Izquierda' }, { value: 'top', label: 'Arriba' }] },
      { key: 'hole', type: 'range', label: 'Diámetro del agujero', min: 3, max: 8, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Texto', items: [
      { key: 'text', type: 'text', label: 'Texto', maxLength: 14, placeholder: 'Tu nombre' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'letterHeight', type: 'range', label: 'Altura de las mayúsculas', min: 6, max: 22, step: 0.5, unit: 'mm' },
      { key: 'symbol', type: 'symbol', label: 'Símbolo a la izquierda' },
      { key: 'mode', type: 'segmented', label: 'Acabado', options: [
        { value: 'relief', label: 'Relieve' }, { value: 'engraved', label: 'Grabado' }, { value: 'inlay', label: 'Incrustado' },
      ], visibleIf: (p) => p.variant !== 'contour' },
      { key: 'textHeight', type: 'range', label: (p) => (p.mode === 'relief' || p.variant === 'contour' ? 'Altura del relieve' : 'Profundidad del grabado'), min: 0.6, max: 3, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Medidas', items: [
      { key: 'thickness', type: 'range', label: 'Grosor de la base', min: 2, max: 6, step: 0.1, unit: 'mm' },
      { key: 'padding', type: 'range', label: 'Margen alrededor del texto', min: 1.5, max: 8, step: 0.5, unit: 'mm' },
      { key: 'rim', type: 'range', label: 'Borde elevado', min: 0, max: 3, step: 0.1, unit: 'mm', help: '0 = sin borde', visibleIf: (p) => p.variant !== 'contour' && p.mode === 'relief' },
      { key: 'ringWall', type: 'range', label: 'Pared de la argolla', min: 1.6, max: 5, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Base' },
      { key: 'colorText', type: 'color', label: 'Texto', visibleIf: (p) => p.variant === 'contour' || p.mode !== 'engraved' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Plano sobre la cama' }],

  build(p) {
    const issues = [];
    const mode = p.variant === 'contour' ? 'relief' : p.mode;
    const t = textRegion(p.text || '', p.font, p.letterHeight);
    if (t.missing.length) issues.push({ level: 'warning', msg: `La tipografía no tiene estos caracteres y se omitieron: ${t.missing.join(' ')}` });
    let content = t.region;
    if (p.symbol !== 'none') {
      const sym = symbolRegion(p.symbol, p.letterHeight * 1.15);
      const sb = bbox(sym), tb = bbox(content);
      const gap = content.length ? p.letterHeight * 0.3 : 0;
      content = union(translate(sym, (content.length ? tb.minX : 0) - gap - sb.maxX, 0), content);
      const cb = bbox(content);
      content = translate(content, -cb.cx, -cb.cy);
    }
    if (!content.length) return { parts: [], issues: [{ level: 'error', msg: 'Escribí al menos una letra o elegí un símbolo.' }] };

    const cb = bbox(content);
    let plate;
    if (p.variant === 'contour') plate = offset(content, p.padding);
    else {
      const w = cb.w + p.padding * 2, h = cb.h + p.padding * 2;
      plate = roundedRect(0, 0, w, h, p.variant === 'capsule' ? h / 2 : Math.min(3, h / 4));
    }
    const pb = bbox(plate);
    const holeR = p.hole / 2, R = holeR + p.ringWall;
    let cx, cy, bridge = [];
    if (p.holeSide === 'left') {
      cx = pb.minX - R * 0.45; cy = 0;
      bridge = rect((cx + cb.minX + p.letterHeight * 0.3) / 2, cy, cb.minX + p.letterHeight * 0.3 - cx, R * 1.3);
    } else {
      cx = p.variant === 'contour' ? cb.minX + Math.min(cb.w / 2, p.letterHeight * 0.5) : 0;
      cy = pb.maxY + R * 0.45;
      bridge = rect(cx, (cy + cb.maxY - p.letterHeight * 0.3) / 2, R * 1.3, cy - cb.maxY + p.letterHeight * 0.3);
    }
    const ring = circle(cx, cy, R, 64), holeC = circle(cx, cy, holeR, 48);
    const outline = union(plate, ring, p.variant === 'contour' ? intersection(bridge, offset(content, p.padding + R)) : []);
    const base = difference(outline, holeC);

    const islands = islandCount(base);
    if (islands > 1) issues.push({ level: 'error', msg: `La base quedó dividida en ${islands} piezas sueltas. Aumentá el margen alrededor del texto para unir las letras.` });
    if (area(intersection(content, offset(holeC, 1))) > 0.01) issues.push({ level: 'error', msg: 'El agujero de la argolla toca el texto. Aumentá el margen o achicá el agujero.' });
    if (p.ringWall < 2) issues.push({ level: 'warning', msg: 'La pared de la argolla es fina: puede romperse con el uso. Se recomiendan 2 mm o más.' });
    const thin = thinFraction(content, PRINT.minFeature);
    if (thin > 0.06) issues.push({ level: 'warning', msg: `Parte del texto tiene trazos de menos de ${PRINT.minFeature} mm (${Math.round(thin * 100)} % del área). Aumentá la altura de las letras.` });

    const T = p.thickness, parts = [];
    if (mode === 'relief') {
      let raised = content;
      if (p.rim > 0 && p.variant !== 'contour') raised = union(content, difference(difference(plate, offset(plate, -p.rim)), offset(holeC, 0.6)));
      parts.push(part('base', 'Base', p.colorBase, extrudeRegion(base, 0, T)));
      parts.push(part('text', 'Texto', p.colorText, extrudeRegion(raised, T, T + p.textHeight), { focus: true }));
    } else {
      const d = Math.min(p.textHeight, T - 1);
      if (d < p.textHeight) issues.push({ level: 'info', msg: `La profundidad del grabado se limitó a ${d.toFixed(1)} mm para dejar 1 mm de base.` });
      parts.push(part('base', 'Base', p.colorBase, [extrudeRegion(base, 0, T - d), extrudeRegion(difference(base, content), T - d, T)]));
      if (mode === 'inlay') parts.push(part('text', 'Texto incrustado', p.colorText, extrudeRegion(intersection(content, base), T - d, T), { focus: true }));
    }
    return { parts: parts.filter(Boolean), issues };
  },
};
