import { union, difference, intersection, offset, bbox, translate, scale, area, roundedRect, ellipse, chamferRect, circle, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { symbolRegion } from '../core/symbols.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

function plateShape(shape, W, H) {
  if (shape === 'oval') return ellipse(0, 0, W / 2, H / 2, 120);
  if (shape === 'badge') return chamferRect(0, 0, W, H, Math.min(W, H) * 0.2);
  return roundedRect(0, 0, W, H, Math.min(8, H / 4), 12);
}

export default {
  id: 'placa',
  name: 'Placa decorativa',
  category: 'negocios',
  description: 'Cartel o placa con una o dos líneas de texto, marco y decoración. Para puertas, escritorios o locales.',
  tags: ['placa', 'cartel', 'nombre', 'puerta', 'negocio', 'señal'],
  printTime: '1–3 h',
  defaults: {
    shape: 'rect', width: 150, height: 60, thickness: 3.5,
    line1: 'Bienvenidos', line2: 'Familia García', font: 'pacifico', letterHeight: 12, line2Ratio: 0.55,
    mode: 'relief', textHeight: 1.4, border: 3, decoration: 'star', holes: 'two',
    colorBase: '#F1F1EC', colorBorder: '#2563C9', colorText: '#2563C9',
  },
  sections: [
    { title: 'Forma', items: [
      { key: 'shape', type: 'cards', label: 'Contorno', options: [
        { value: 'rect', label: 'Rectangular', hint: 'Esquinas redondeadas' },
        { value: 'oval', label: 'Ovalada', hint: 'Elipse' },
        { value: 'badge', label: 'Insignia', hint: 'Esquinas cortadas' },
      ] },
      { key: 'width', type: 'range', label: 'Ancho', min: 60, max: 210, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto', min: 30, max: 150, step: 1, unit: 'mm' },
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2, max: 8, step: 0.1, unit: 'mm' },
      { key: 'holes', type: 'segmented', label: 'Para colgar', options: [{ value: 'none', label: 'Sin agujeros' }, { value: 'two', label: 'Dos agujeros' }] },
    ] },
    { title: 'Texto', items: [
      { key: 'line1', type: 'text', label: 'Línea principal', maxLength: 24 },
      { key: 'line2', type: 'text', label: 'Segunda línea (opcional)', maxLength: 30 },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'letterHeight', type: 'range', label: 'Altura máxima de letra', min: 5, max: 40, step: 0.5, unit: 'mm', help: 'Si no entra, se reduce automáticamente' },
      { key: 'mode', type: 'segmented', label: 'Acabado', options: [{ value: 'relief', label: 'Relieve' }, { value: 'engraved', label: 'Grabado' }, { value: 'inlay', label: 'Incrustado' }] },
      { key: 'textHeight', type: 'range', label: (p) => (p.mode === 'relief' ? 'Altura del relieve' : 'Profundidad'), min: 0.6, max: 3, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Decoración', items: [
      { key: 'border', type: 'range', label: 'Marco elevado', min: 0, max: 8, step: 0.5, unit: 'mm', help: '0 = sin marco' },
      { key: 'decoration', type: 'symbol', label: 'Símbolos a los lados' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Fondo' },
      { key: 'colorBorder', type: 'color', label: 'Marco', visibleIf: (p) => p.border > 0 },
      { key: 'colorText', type: 'color', label: 'Texto y símbolos', visibleIf: (p) => p.mode !== 'engraved' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Acostada, texto hacia arriba' }],

  build(p) {
    const issues = [];
    const { width: W, height: H, thickness: T } = p;
    const plate = plateShape(p.shape, W, H);
    const text = [p.line1, p.line2].map((s) => (s || '').trim());
    // Línea 1 y 2 con tamaños distintos
    const l1 = text[0] ? textRegion(text[0], p.font, p.letterHeight) : { region: [], missing: [] };
    const l2 = text[1] ? textRegion(text[1], p.font, p.letterHeight * p.line2Ratio) : { region: [], missing: [] };
    const missing = [...new Set([...l1.missing, ...l2.missing])];
    if (missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres no disponibles en esta tipografía: ${missing.join(' ')}` });
    let r1 = l1.region;
    if (p.decoration !== 'none' && r1.length) {
      const b = bbox(r1), sh = p.letterHeight * 0.9, gap = p.letterHeight * 0.45;
      const s = symbolRegion(p.decoration, sh), sb = bbox(s);
      r1 = union(r1, translate(s, b.minX - gap - sb.maxX, b.cy), translate(s, b.maxX + gap - sb.minX, b.cy));
    }
    const b1 = bbox(r1), b2 = bbox(l2.region);
    const gapY = p.letterHeight * 0.45;
    const total = b1.h + b2.h + (b1.h && b2.h ? gapY : 0);
    let content = union(
      r1.length ? translate(r1, -b1.cx, total / 2 - b1.h / 2 - b1.cy) : [],
      l2.region.length ? translate(l2.region, -b2.cx, -total / 2 + b2.h / 2 - b2.cy) : [],
    );
    if (!content.length) return { parts: [], issues: [{ level: 'error', msg: 'Escribí al menos una línea de texto.' }] };
    let cb = bbox(content);
    content = translate(content, -cb.cx, -cb.cy);
    cb = bbox(content);

    // Espacio útil y ajuste automático
    const margin = p.border + 4;
    const holeR = 2.25, holeInset = p.border + 7;
    const holeCenters = p.holes === 'two' ? [[-(W / 2 - holeInset - (p.shape === 'oval' ? W * 0.12 : 0)), H / 2 - holeInset - (p.shape === 'oval' ? H * 0.12 : 0)], [W / 2 - holeInset - (p.shape === 'oval' ? W * 0.12 : 0), H / 2 - holeInset - (p.shape === 'oval' ? H * 0.12 : 0)]] : [];
    const holes = union(...holeCenters.map(([x, y]) => circle(x, y, holeR, 32)));
    const usable = difference(offset(plate, -margin), offset(holes, 3));
    let fit = 1;
    for (let i = 0; i < 18 && area(difference(scale(content, fit), usable)) > 0.05; i++) fit *= 0.93;
    if (fit < 1) {
      content = scale(content, fit);
      issues.push({ level: 'info', msg: `El texto se redujo al ${Math.round(fit * 100)} % para que entre en la placa (mayúsculas de ${(p.letterHeight * fit).toFixed(1)} mm).` });
    }
    if (area(difference(content, usable)) > 0.05) issues.push({ level: 'error', msg: 'El texto no entra en la placa. Agrandala o acortá el texto.' });
    if (p.letterHeight * fit < 5) issues.push({ level: 'warning', msg: 'Las letras quedan muy pequeñas para leerse bien impresas.' });
    const thin = thinFraction(content, PRINT.minFeature);
    if (thin > 0.06) issues.push({ level: 'warning', msg: `Hay trazos de menos de ${PRINT.minFeature} mm (${Math.round(thin * 100)} % del texto). Usá letras más grandes o una tipografía más gruesa.` });
    if (p.border > 0 && p.border < PRINT.minWall) issues.push({ level: 'warning', msg: 'El marco es muy fino para imprimirse con firmeza.' });

    const base = difference(plate, holes);
    const parts = [];
    const relief = p.mode === 'relief';
    const d = Math.min(p.textHeight, T - 1);
    if (!relief && d < p.textHeight) issues.push({ level: 'info', msg: `La profundidad se limitó a ${d.toFixed(1)} mm para dejar 1 mm de fondo.` });
    if (relief) parts.push(part('base', 'Fondo', p.colorBase, extrudeRegion(base, 0, T)));
    else parts.push(part('base', 'Fondo', p.colorBase, [extrudeRegion(base, 0, T - d), extrudeRegion(difference(base, content), T - d, T)]));
    if (p.border > 0) {
      const frame = difference(difference(plate, offset(plate, -p.border)), offset(holes, 1));
      parts.push(part('border', 'Marco', p.colorBorder, extrudeRegion(frame, T, T + Math.max(p.textHeight, 1))));
    }
    if (relief) parts.push(part('text', 'Texto', p.colorText, extrudeRegion(content, T, T + p.textHeight), { focus: true }));
    else if (p.mode === 'inlay') parts.push(part('text', 'Texto incrustado', p.colorText, extrudeRegion(content, T - d, T), { focus: true }));
    return { parts: parts.filter(Boolean), issues };
  },
};
