import { union, difference, offset, bbox, translate, scale, rect, roundedRect, circle, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

const fit = (region, maxW, maxH) => {
  if (!region.length) return { r: region, s: 1 };
  const b = bbox(region);
  const s = Math.min(1, maxW / b.w, maxH / b.h);
  const r = scale(region, s), nb = bbox(r);
  return { r: translate(r, -nb.cx, -nb.cy), s };
};

export default {
  id: 'cartel-deslizante',
  name: 'Cartel indicador deslizante',
  category: 'negocios',
  description: 'Placa para puertas con una ventana y una corredera que muestra una de dos palabras: Libre / Ocupado, Abierto / Cerrado o las que quieras. Dos piezas que se imprimen planas.',
  tags: ['cartel', 'libre', 'ocupado', 'baño', 'puerta', 'oficina', 'consultorio', 'abierto', 'cerrado', 'señal'],
  printTime: '2–3 h',
  defaults: {
    word1: 'LIBRE', word2: 'OCUPADO', title: 'SALA DE REUNIONES', font: 'bungee', titleHeight: 7,
    width: 170, height: 75, windowWidth: 54, sliderHeight: 24, holes: true,
    relief: 0.8, clearance: 0.4, border: 2,
    colorBase: '#F1F1EC', colorArt: '#26272B', colorWord1: '#2E9E58', colorWord2: '#C9302C',
  },
  sections: [
    { title: 'Textos', items: [
      { key: 'word1', type: 'text', label: 'Primera palabra', maxLength: 12, placeholder: 'LIBRE / ABIERTO / BAÑO' },
      { key: 'word2', type: 'text', label: 'Segunda palabra', maxLength: 12, placeholder: 'OCUPADO / CERRADO / PRIVADO' },
      { key: 'title', type: 'text', label: 'Título arriba de la ventana (opcional)', maxLength: 24, placeholder: 'Ej.: BAÑO, SALA 2' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'titleHeight', type: 'range', label: 'Altura del título', min: 4, max: 18, step: 0.5, unit: 'mm', visibleIf: (p) => !!p.title.trim() },
    ] },
    { title: 'Medidas', items: [
      { key: 'width', type: 'range', label: 'Ancho de la placa', min: 90, max: 210, step: 1, unit: 'mm' },
      { key: 'height', type: 'range', label: 'Alto de la placa', min: 40, max: 140, step: 1, unit: 'mm' },
      { key: 'windowWidth', type: 'range', label: 'Ancho de la ventana', min: 30, max: 100, step: 1, unit: 'mm', help: 'La placa tiene que ser unas 3 veces más ancha que la ventana' },
      { key: 'sliderHeight', type: 'range', label: 'Alto de la corredera', min: 16, max: 50, step: 0.5, unit: 'mm' },
      { key: 'holes', type: 'toggle', label: 'Agujeros para atornillar' },
    ] },
    { title: 'Ajustes de impresión', items: [
      { key: 'relief', type: 'range', label: 'Relieve de los textos', min: 0.4, max: 1.4, step: 0.1, unit: 'mm' },
      { key: 'clearance', type: 'range', label: 'Holgura de la corredera', min: 0.2, max: 1, step: 0.05, unit: 'mm', help: 'Si queda dura, subila; si se cae sola, bajala' },
      { key: 'border', type: 'range', label: 'Marco', min: 0, max: 5, step: 0.5, unit: 'mm', help: '0 = sin marco' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Placa y corredera' },
      { key: 'colorArt', type: 'color', label: 'Título y marco' },
      { key: 'colorWord1', type: 'color', label: 'Primera palabra' },
      { key: 'colorWord2', type: 'color', label: 'Segunda palabra' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Las dos piezas planas', hint: 'La placa con la ventana hacia arriba' }],
  views: [{ id: 'assembled', label: 'Armado' }],
  useOrientation: 'assembled',

  build(p, orientationId) {
    const issues = [];
    const W = p.width, H = p.height, R = p.relief, clr = p.clearance;
    const w1 = (p.word1 || '').trim(), w2 = (p.word2 || '').trim();
    if (!w1 || !w2) return { parts: [], issues: [{ level: 'error', msg: 'Escribí las dos palabras de la corredera.' }] };

    // Capas de la placa: fondo, túnel para la corredera y tapa con ventana
    const back = 1.6, top = 1.6, st = 2; // st = grosor de la corredera
    const tunnelT = st + R + clr;
    const T = back + tunnelT + top;
    const sh = p.sliderHeight; // alto (en y) de la corredera
    const tunnelH = sh + 2 * clr;
    const winH = sh - 5, winW = Math.min(p.windowWidth, W - 2 * (p.border + 6));
    if (winW < p.windowWidth) issues.push({ level: 'info', msg: `La ventana se limitó a ${winW.toFixed(0)} mm para dejar marco a los costados.` });

    // Título y ubicación vertical de la ventana
    const tt = (p.title || '').trim() ? textRegion(p.title.trim(), p.font, p.titleHeight) : { region: [], missing: [] };
    const margin = p.border + 4;
    let title = fit(tt.region, W - 2 * margin, p.titleHeight * 1.6);
    if (title.s < 1) issues.push({ level: 'info', msg: `El título se achicó al ${Math.round(title.s * 100)} % para entrar.` });
    const th = title.r.length ? bbox(title.r).h : 0;
    const gap = th ? 4 : 0;
    const stack = th + gap + tunnelH;
    if (stack > H - 2 * margin) return { parts: [], issues: [{ level: 'error', msg: 'La corredera y el título no entran a lo alto. Agrandá la placa o achicá la corredera.' }] };
    const yWin = -stack / 2 + tunnelH / 2;
    const yTitle = stack / 2 - th / 2;

    const plate = roundedRect(0, 0, W, H, Math.min(8, H / 6), 10);
    const band = rect(0, yWin, W + 4, tunnelH);
    const win = roundedRect(0, yWin, winW, winH, 2.5, 6);

    // Agujeros: en la zona más alta libre de la banda
    let holes = [];
    if (p.holes) {
      const free = H / 2 - (yWin + tunnelH / 2);
      const freeBelow = (yWin - tunnelH / 2) + H / 2;
      const hy = free >= freeBelow ? (yWin + tunnelH / 2 + H / 2) / 2 : (yWin - tunnelH / 2 - H / 2) / 2;
      if (Math.max(free, freeBelow) >= 11) {
        const hx = W / 2 - margin - 4;
        holes = union(circle(-hx, hy, 2, 32), circle(hx, hy, 2, 32));
        if (title.r.length && union(offset(holes, 2)).length && bbox(title.r).w / 2 > hx - 6 && Math.abs(hy - yTitle) < th) issues.push({ level: 'warning', msg: 'Los agujeros quedan muy cerca del título: acortalo o desactivá los agujeros.' });
      } else issues.push({ level: 'info', msg: 'No hay lugar para agujeros fuera de la corredera: pegalo con cinta doble faz.' });
    }

    const plateGeos = [
      extrudeRegion(difference(plate, holes), 0, back),
      extrudeRegion(difference(difference(plate, band), holes), back, back + tunnelT),
      extrudeRegion(difference(difference(plate, win), holes), back + tunnelT, T),
    ];
    const frame = p.border > 0 ? difference(plate, offset(plate, -p.border)) : [];
    const winFrame = difference(offset(win, 1.6), win);
    const art = union(frame, winFrame, title.r.length ? translate(title.r, 0, yTitle) : []);
    const artGeo = extrudeRegion(difference(art, holes), T, T + R);

    // Corredera: la palabra que no se muestra queda escondida bajo la placa, al costado de la ventana
    const tH = winH - 4;
    const a1 = fit(textRegion(w1, p.font, tH).region, winW - 6, tH);
    const a2 = fit(textRegion(w2, p.font, tH).region, winW - 6, tH);
    const wwMax = Math.max(bbox(a1.r).w, bbox(a2.r).w);
    const d = winW / 2 + wwMax / 2 + 3;
    const need = 2 * (d + wwMax / 2 + p.border + 2);
    if (need > W + 0.01) return { parts: [], issues: [{ level: 'error', msg: `Para que la palabra oculta no se vea, la placa tiene que medir al menos ${Math.ceil(need)} mm de ancho (o achicá la ventana).` }] };
    const Ls = W - d; // en cada posición, un extremo queda al ras del borde de la placa
    const slider = roundedRect(0, 0, Ls, sh, 2, 6);
    const word1 = translate(a1.r, -d / 2, 0), word2 = translate(a2.r, d / 2, 0);
    const ridges = union(...[-1, 1].flatMap((sx) => [0, 1, 2].map((k) => rect(sx * (Ls / 2 - 2.5 - k * 2.4), 0, 1.2, sh - 6))));
    for (const w of [a1, a2]) if (thinFraction(w.r, PRINT.minFeature) > 0.08) issues.push({ level: 'warning', msg: 'Alguna palabra tiene trazos muy finos: probá una tipografía más gruesa o una corredera más alta.' });

    const sliderGeo = extrudeRegion(slider, 0, st);
    const g1 = extrudeRegion(word1, st, st + R), g2 = extrudeRegion(word2, st, st + R), gr = extrudeRegion(ridges, st, st + R);
    const sliderGeos = [sliderGeo, gr];
    if (orientationId === 'assembled') {
      // Corredera dentro del túnel, mostrando la primera palabra
      for (const g of [sliderGeo, g1, g2, gr]) g?.translate(d / 2, yWin, back + clr / 2);
    } else {
      const dy = H / 2 + sh / 2 + 10;
      for (const g of [...plateGeos, artGeo]) g?.translate(0, dy / 2, 0);
      for (const g of [sliderGeo, g1, g2, gr]) g?.translate(0, -dy / 2, 0);
    }

    issues.push({ level: 'info', msg: `El túnel de la corredera tiene un techo de ${tunnelH.toFixed(0)} mm que se imprime como puente, sin soportes. Para cambiar de palabra, deslizá la corredera empujando la palabra con el dedo.` });
    issues.push({ level: 'info', msg: `Para dos colores con un solo extrusor, cambiá el filamento a ${T.toFixed(1)} mm (placa) y a ${st.toFixed(1)} mm (corredera).` });
    return {
      parts: [
        part('plate', 'Placa', p.colorBase, plateGeos, { bridges: true }),
        part('art', 'Título y marco', p.colorArt, artGeo),
        part('slider', 'Corredera', p.colorBase, sliderGeos),
        part('word1', `Palabra "${w1}"`, p.colorWord1, g1, { focus: true }),
        part('word2', `Palabra "${w2}"`, p.colorWord2, g2),
      ].filter(Boolean),
      issues,
    };
  },
};
