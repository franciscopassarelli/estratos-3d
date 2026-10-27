import { union, difference, bbox, translate, scale, circle, roundedRect, thinFraction } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { qrRegion, contactPayload } from '../core/qr.js';
import { extrudeRegion, part } from '../core/mesh.js';
import { PRINT } from '../core/palette.js';

const TYPES = [
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'url', label: 'Enlace' },
];
const DATA_LABEL = { whatsapp: 'Número de WhatsApp', phone: 'Teléfono', instagram: 'Usuario de Instagram', url: 'Enlace (web, perfil, tarjeta digital)' };

export default {
  id: 'llavero-qr',
  name: 'Llavero QR de contacto',
  category: 'accesorios',
  description: 'Llavero compacto con un QR que abre tu WhatsApp, tu teléfono, tu Instagram o un enlace. Argolla reforzada y nombre grabado al dorso.',
  tags: ['llavero', 'qr', 'contacto', 'whatsapp', 'mascota', 'identificación', 'tarjeta', 'perdido'],
  printTime: '30–50 min',
  defaults: {
    qrType: 'whatsapp', qrData: '11 5466 1930', ecc: 'L', qrSize: 28,
    frontText: 'ESCANEAME', backText: 'Sofía', font: 'archivo', frontHeight: 3.2, backHeight: 6,
    thickness: 3.2, relief: 0.8, engrave: 0.6, hole: 5, ringWall: 3,
    colorBase: '#F1F1EC', colorArt: '#26272B',
  },
  sections: [
    { title: 'Código QR', items: [
      { key: 'qrType', type: 'segmented', label: 'Qué abre el QR', options: TYPES },
      { key: 'qrData', type: 'text', label: (p) => DATA_LABEL[p.qrType], maxLength: 120, placeholder: 'Ej.: 11 5466 1930', help: 'El QR se genera en tu navegador: el dato no se envía a ningún servidor.' },
      { key: 'qrSize', type: 'range', label: 'Tamaño del QR', min: 18, max: 45, step: 0.5, unit: 'mm' },
      { key: 'ecc', type: 'segmented', label: 'Corrección de errores', options: [{ value: 'L', label: 'Baja (QR más simple)' }, { value: 'M', label: 'Media' }] },
    ] },
    { title: 'Textos', items: [
      { key: 'frontText', type: 'text', label: 'Texto debajo del QR (opcional)', maxLength: 16, placeholder: 'ESCANEAME' },
      { key: 'backText', type: 'text', label: 'Nombre grabado al dorso (opcional)', maxLength: 14, placeholder: 'Tu nombre' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'frontHeight', type: 'range', label: 'Altura del texto de adelante', min: 2.5, max: 8, step: 0.1, unit: 'mm', visibleIf: (p) => !!p.frontText.trim() },
      { key: 'backHeight', type: 'range', label: 'Altura del nombre al dorso', min: 3, max: 12, step: 0.5, unit: 'mm', visibleIf: (p) => !!p.backText.trim() },
    ] },
    { title: 'Medidas', items: [
      { key: 'thickness', type: 'range', label: 'Grosor', min: 2.4, max: 5, step: 0.1, unit: 'mm' },
      { key: 'relief', type: 'range', label: 'Relieve del QR', min: 0.4, max: 1.5, step: 0.1, unit: 'mm' },
      { key: 'engrave', type: 'range', label: 'Profundidad del grabado al dorso', min: 0.4, max: 1.2, step: 0.1, unit: 'mm', visibleIf: (p) => !!p.backText.trim() },
      { key: 'hole', type: 'range', label: 'Diámetro del agujero', min: 3.5, max: 8, step: 0.1, unit: 'mm' },
      { key: 'ringWall', type: 'range', label: 'Refuerzo de la argolla', min: 2, max: 5, step: 0.1, unit: 'mm' },
    ] },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Cuerpo (fondo del QR)' },
      { key: 'colorArt', type: 'color', label: 'QR y texto' },
    ] },
  ],
  orientations: [{ id: 'flat', label: 'Plano, QR hacia arriba' }],

  build(p) {
    const issues = [];
    const c = contactPayload(p.qrType, p.qrData);
    if (!c.ok) return { parts: [], issues: [{ level: 'error', msg: c.error }] };
    let qr;
    try { qr = qrRegion(c.payload, p.qrSize, p.ecc); } catch {
      return { parts: [], issues: [{ level: 'error', msg: 'El contenido es demasiado largo para un QR de llavero. Acortá el enlace.' }] };
    }
    const quiet = Math.max(2 * qr.module, 2.2);
    const front = (p.frontText || '').trim() ? textRegion(p.frontText.trim(), p.font, p.frontHeight) : { region: [], missing: [] };
    const back = (p.backText || '').trim() ? textRegion(p.backText.trim(), p.font, p.backHeight) : { region: [], missing: [] };
    const missing = [...new Set([...front.missing, ...back.missing])];
    if (missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres que la tipografía no tiene: ${missing.join(' ')}` });

    const W = p.qrSize + 2 * quiet;
    let fr = front.region, fb = bbox(fr);
    const innerW = W - 2.4;
    if (fr.length && fb.w > innerW) { fr = scale(fr, innerW / fb.w); fb = bbox(fr); issues.push({ level: 'info', msg: 'El texto de adelante se achicó para entrar en el ancho del llavero.' }); }
    const frontBlock = fr.length ? fb.h + 2 : 0;
    const Hbody = W + frontBlock;
    // Cuerpo: rectángulo redondeado, el QR arriba y el texto abajo
    const body = roundedRect(0, 0, W, Hbody, Math.min(4, W / 6), 10);
    const qrCy = Hbody / 2 - quiet - p.qrSize / 2;
    const qrPlaced = translate(qr.region, 0, qrCy);
    const frontPlaced = fr.length ? translate(fr, -fb.cx, -Hbody / 2 + 1.2 + fb.h / 2 - fb.cy) : [];
    // Argolla reforzada arriba al centro
    const hr = p.hole / 2, ringR = hr + p.ringWall;
    const ringCy = Hbody / 2 + hr + 0.6;
    const outline = union(body, circle(0, ringCy, ringR, 64), roundedRect(0, Hbody / 2, ringR * 2, ringR * 1.2, 1, 6));
    const solid = difference(outline, circle(0, ringCy, hr, 48));

    // Dorso: el nombre se espeja para leerse bien al dar vuelta el llavero
    let backR = [];
    if (back.region.length) {
      let r = scale(back.region, -1, 1);
      let bb = bbox(r);
      const maxW = W - 4, maxH = Hbody - 4;
      if (bb.w > maxW || bb.h > maxH) { const s = Math.min(maxW / bb.w, maxH / bb.h); r = scale(r, s); bb = bbox(r); issues.push({ level: 'info', msg: `El nombre del dorso se achicó al ${Math.round(s * 100)} % para entrar.` }); }
      backR = translate(r, -bb.cx, -bb.cy);
      if (thinFraction(backR, PRINT.minFeature) > 0.08) issues.push({ level: 'warning', msg: 'El nombre del dorso tiene trazos muy finos para grabarse bien. Agrandalo o usá otra tipografía.' });
    }
    const T = p.thickness, d = backR.length ? Math.min(p.engrave, T - 1.2) : 0;
    const bodyGeos = d > 0
      ? [extrudeRegion(difference(solid, backR), 0, d), extrudeRegion(solid, d, T)]
      : [extrudeRegion(solid, 0, T)];
    const art = union(qrPlaced, frontPlaced);
    const parts = [
      part('body', 'Cuerpo', p.colorBase, bodyGeos),
      part('art', 'QR y texto', p.colorArt, extrudeRegion(art, T, T + p.relief), { focus: true }),
    ].filter(Boolean);

    if (qr.module < 0.9) issues.push({ level: 'warning', msg: `Cada módulo del QR mide ${qr.module.toFixed(2)} mm: con boquilla de 0,4 mm puede salir borroso. Agrandá el QR, usá corrección baja o un dato más corto.` });
    else issues.push({ level: 'ok', msg: `QR de ${qr.n}×${qr.n} módulos de ${qr.module.toFixed(2)} mm.` });
    if (fr.length && fb.h < 2.8) issues.push({ level: 'warning', msg: 'El texto de adelante es muy chico para imprimirse legible.' });
    if (p.ringWall < 2.5) issues.push({ level: 'info', msg: 'Con menos de 2,5 mm de refuerzo, la argolla puede romperse con el uso.' });
    if (p.colorBase.toLowerCase() === p.colorArt.toLowerCase()) issues.push({ level: 'warning', msg: 'El QR y el fondo tienen el mismo color: el celular no va a poder leerlo.' });
    issues.push({ level: 'info', msg: 'Imprimilo con la primera capa lenta: el grabado del dorso queda apoyado sobre la cama.' });
    return { parts, issues };
  },
};
