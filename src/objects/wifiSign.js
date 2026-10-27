import { union, bbox, translate } from '../core/geometry2d.js';
import { textRegion } from '../core/text.js';
import { wifiPayload } from '../core/qr.js';
import { buildSign, signSizeItems, signBaseItems, signViews, signOrientations, wifiIcon } from './shared/sign.js';

export default {
  id: 'cartel-wifi',
  name: 'Cartel Wi-Fi para clientes',
  category: 'negocios',
  description: 'Placa de mesa con un QR que conecta el celular al Wi-Fi sin escribir la clave, el nombre de la red visible y el ícono de señal en relieve.',
  tags: ['wifi', 'wi-fi', 'qr', 'clave', 'red', 'bar', 'café', 'local', 'hogar', 'invitados'],
  printTime: '2–4 h',
  defaults: {
    ssid: 'MiNegocio_Clientes', password: '', security: 'WPA', hidden: false, showPassword: false,
    title: 'Wi-Fi gratis', font: 'archivo', titleHeight: 11, lineHeight: 5.5, qrSize: 65,
    width: 110, height: 160, thickness: 3, relief: 1, border: 2,
    lean: 15, baseDepth: 50, clearance: 0.3,
    colorBase: '#F1F1EC', colorArt: '#2563C9', colorStand: '#2563C9',
  },
  sections: [
    { title: 'Red Wi-Fi', items: [
      { key: 'ssid', type: 'text', label: 'Nombre de la red (SSID)', maxLength: 32, placeholder: 'Tal cual aparece en el celular' },
      { key: 'security', type: 'segmented', label: 'Seguridad', options: [{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'nopass', label: 'Abierta' }] },
      { key: 'password', type: 'text', label: 'Contraseña', maxLength: 63, private: true, visibleIf: (p) => p.security !== 'nopass', help: 'No se guarda ni se envía: el QR se genera en tu navegador. Si recargás la página, vas a tener que escribirla de nuevo.' },
      { key: 'hidden', type: 'toggle', label: 'La red está oculta' },
      { key: 'showPassword', type: 'toggle', label: 'Escribir también la clave en el cartel', visibleIf: (p) => p.security !== 'nopass' },
    ] },
    { title: 'Textos', items: [
      { key: 'title', type: 'text', label: 'Título', maxLength: 20, placeholder: 'Wi-Fi gratis' },
      { key: 'font', type: 'font', label: 'Tipografía' },
      { key: 'titleHeight', type: 'range', label: 'Altura del título', min: 5, max: 20, step: 0.5, unit: 'mm' },
      { key: 'lineHeight', type: 'range', label: 'Altura del nombre de la red', min: 4, max: 12, step: 0.5, unit: 'mm' },
      { key: 'qrSize', type: 'range', label: 'Tamaño del QR', min: 30, max: 160, step: 1, unit: 'mm', help: 'Se achica solo si no entra' },
    ] },
    { title: 'Cartel', items: signSizeItems },
    { title: 'Base', items: signBaseItems },
    { title: 'Colores', items: [
      { key: 'colorBase', type: 'color', label: 'Placa (fondo del QR)' },
      { key: 'colorArt', type: 'color', label: 'QR, ícono y textos' },
      { key: 'colorStand', type: 'color', label: 'Base' },
    ] },
  ],
  orientations: signOrientations,
  views: signViews,
  useOrientation: 'assembled',

  build(p, orientationId) {
    const issues = [];
    const ssid = (p.ssid || '').trim();
    if (!ssid) return { parts: [], issues: [{ level: 'error', msg: 'Escribí el nombre de la red Wi-Fi.' }] };
    const needsPass = p.security !== 'nopass';
    const pass = needsPass ? p.password || '' : '';
    if (needsPass && !pass) issues.push({ level: 'warning', msg: 'Falta la contraseña: sin ella el QR no puede conectar el celular. Escribila antes de descargar.' });
    if (p.security === 'WPA' && pass && pass.length < 8) issues.push({ level: 'warning', msg: 'Las claves WPA tienen al menos 8 caracteres. Revisá que esté completa.' });
    if (p.colorBase.toLowerCase() === p.colorArt.toLowerCase()) issues.push({ level: 'warning', msg: 'El QR y el fondo tienen el mismo color: el celular no va a poder leerlo.' });

    // Título con ícono a la izquierda
    const t = textRegion((p.title || '').trim(), p.font, p.titleHeight);
    let head = t.region;
    const icon = wifiIcon(p.titleHeight * 1.25);
    if (head.length) {
      const hb = bbox(head), ib = bbox(icon);
      head = union(head, translate(icon, hb.minX - p.titleHeight * 0.5 - ib.maxX, hb.minY - ib.minY));
    } else head = icon;

    const net = textRegion(`Red: ${ssid}`, p.font, p.lineHeight);
    const key = needsPass && p.showPassword && pass ? textRegion(`Clave: ${pass}`, p.font, p.lineHeight) : { region: [], missing: [] };
    const missing = [...new Set([...t.missing, ...net.missing, ...key.missing])];
    if (missing.length) issues.push({ level: 'warning', msg: `La tipografía no tiene estos caracteres y no se dibujan en el texto (el QR los incluye igual): ${missing.join(' ')}` });

    const blocks = [
      { kind: 'region', region: head, gap: 0, label: 'El título' },
      { kind: 'qr', payload: wifiPayload({ ssid, password: pass, security: p.security, hidden: p.hidden }), gap: p.titleHeight * 0.4 },
      { kind: 'region', region: net.region, gap: p.lineHeight * 0.5, label: 'El nombre de la red' },
      { kind: 'region', region: key.region, gap: p.lineHeight * 0.45, label: 'La clave' },
    ];
    return buildSign(p, blocks, orientationId, issues);
  },
};
