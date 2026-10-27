import { textRegion } from '../core/text.js';
import { contactPayload } from '../core/qr.js';
import { buildSign, signSizeItems, signBaseItems, signViews, signOrientations } from './shared/sign.js';

const TYPES = [
  { value: 'url', label: 'Enlace' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'text', label: 'Alias / texto' },
];
const DATA_LABEL = {
  url: 'Enlace (link de pago, menú, web)',
  whatsapp: 'Número de WhatsApp',
  instagram: 'Usuario de Instagram',
  text: 'Texto del QR (alias, CBU, CVU)',
};

export default {
  id: 'display-qr',
  name: 'Display QR para mostrador',
  category: 'negocios',
  description: 'Cartel de mostrador con código QR en relieve para cobrar con link de pago, mostrar un alias o llevar a tus redes. Placa a dos colores y base con ranura inclinada.',
  tags: ['qr', 'mercado pago', 'cobro', 'alias', 'mostrador', 'negocio', 'instagram', 'whatsapp', 'cartel'],
  printTime: '2–4 h',
  defaults: {
    qrType: 'url', qrData: 'link.mercadopago.com.ar/tunegocio', title: 'Pagá con QR', footer: 'Alias: tu.negocio.mp',
    font: 'archivo', titleHeight: 11, footerHeight: 6, qrSize: 70, ecc: 'M',
    width: 110, height: 160, thickness: 3, relief: 1, border: 2,
    lean: 15, baseDepth: 50, clearance: 0.3,
    colorBase: '#F1F1EC', colorArt: '#26272B', colorStand: '#26272B',
  },
  sections: [
    { title: 'Código QR', items: [
      { key: 'qrType', type: 'segmented', label: 'Qué abre el QR', options: TYPES },
      { key: 'qrData', type: 'text', label: (p) => DATA_LABEL[p.qrType], maxLength: 160, placeholder: 'link.mercadopago.com.ar/…', help: 'El QR se genera en tu navegador: lo que escribís no se envía a ningún servidor.' },
      { key: 'qrSize', type: 'range', label: 'Tamaño del QR', min: 30, max: 160, step: 1, unit: 'mm', help: 'Se achica solo si no entra' },
      { key: 'ecc', type: 'segmented', label: 'Corrección de errores', options: [{ value: 'L', label: 'Baja' }, { value: 'M', label: 'Media' }, { value: 'Q', label: 'Alta' }] },
    ] },
    { title: 'Textos', items: [
      { key: 'title', type: 'text', label: 'Texto de arriba', maxLength: 24, placeholder: 'Pagá con QR' },
      { key: 'footer', type: 'text', label: 'Texto de abajo (opcional)', maxLength: 32, placeholder: 'Alias o @usuario' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'titleHeight', type: 'range', label: 'Altura del texto de arriba', min: 5, max: 22, step: 0.5, unit: 'mm' },
      { key: 'footerHeight', type: 'range', label: 'Altura del texto de abajo', min: 4, max: 14, step: 0.5, unit: 'mm' },
    ] },
    { title: 'Cartel', items: signSizeItems },
    { title: 'Base', items: signBaseItems },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Placa (fondo del QR)' },
      { key: 'colorArt', type: 'color', label: 'QR y textos' },
      { key: 'colorStand', type: 'color', label: 'Base' },
    ] },
  ],
  orientations: signOrientations,
  views: signViews,
  useOrientation: 'assembled',

  build(p, orientationId) {
    const issues = [];
    const c = contactPayload(p.qrType, p.qrData);
    if (!c.ok) return { parts: [], issues: [{ level: 'error', msg: c.error }] };
    const t = textRegion((p.title || '').trim(), p.font, p.titleHeight);
    const f = textRegion((p.footer || '').trim(), p.font, p.footerHeight);
    const missing = [...new Set([...t.missing, ...f.missing])];
    if (missing.length) issues.push({ level: 'warning', msg: `Se omitieron caracteres que la tipografía no tiene: ${missing.join(' ')}` });
    if (p.qrType === 'text') issues.push({ level: 'info', msg: 'Un QR con texto muestra el alias en el celular para copiarlo. Para cobrar directo, usá el link de pago de tu billetera virtual.' });
    if (p.colorBase.toLowerCase() === p.colorArt.toLowerCase()) issues.push({ level: 'warning', msg: 'El QR y el fondo tienen el mismo color: el celular no va a poder leerlo.' });
    const blocks = [
      { kind: 'region', region: t.region, gap: 0, label: 'El texto de arriba' },
      { kind: 'qr', payload: c.payload, gap: p.titleHeight * 0.4 },
      { kind: 'region', region: f.region, gap: p.footerHeight * 0.5, label: 'El texto de abajo' },
    ];
    return buildSign(p, blocks, orientationId, issues);
  },
};
