// Códigos QR como geometría 2D: cada módulo oscuro es un cuadrado, unido por filas.
// La codificación usa qrcode-generator (MIT) en modo byte con UTF-8.
import qrcode from 'qrcode-generator';
import { union, rect, translate } from './geometry2d.js';
import { normalizeContact } from '../promo/validate.js';

qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];

/** Matriz del QR. Lanza un error con `tooLong` si el contenido no entra. */
export function qrMatrix(text, ecc = 'M') {
  const q = qrcode(0, ecc);
  q.addData(text, 'Byte');
  try {
    q.make();
  } catch {
    const err = new Error('El contenido es demasiado largo para un código QR.');
    err.tooLong = true;
    throw err;
  }
  const n = q.getModuleCount();
  return { n, version: (n - 17) / 4, dark: (r, c) => q.isDark(r, c) };
}

/**
 * Región de los módulos oscuros, centrada en el origen, con el lado indicado (mm, sin zona de silencio).
 * La fila 0 queda arriba (y positiva), como se ve el código de frente.
 */
export function qrRegion(text, size, ecc = 'M') {
  const m = qrMatrix(text, ecc);
  const mod = size / m.n;
  const rows = [];
  for (let r = 0; r < m.n; r++) {
    let c = 0;
    while (c < m.n) {
      if (!m.dark(r, c)) { c++; continue; }
      const start = c;
      while (c < m.n && m.dark(r, c)) c++;
      const w = (c - start) * mod;
      // Se solapan 1 µm para que las filas vecinas se unan sin rendijas.
      rows.push(rect(start * mod + w / 2, -(r + 0.5) * mod, w + 0.002, mod + 0.002));
    }
  }
  const region = translate(union(...rows), -size / 2, size / 2);
  return { region, module: mod, n: m.n, version: m.version };
}

// ---------- Contenidos ----------
const wifiEscape = (s) => String(s).replace(/([\\;,:"])/g, '\\$1');

/** Texto estándar que los celulares reconocen para conectarse a una red Wi-Fi. */
export function wifiPayload({ ssid, password, security = 'WPA', hidden = false }) {
  const T = security === 'nopass' ? 'nopass' : security;
  let s = `WIFI:T:${T};S:${wifiEscape(ssid)};`;
  if (T !== 'nopass') s += `P:${wifiEscape(password)};`;
  if (hidden) s += 'H:true;';
  return s + ';';
}

export function normalizeUrl(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  return /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : `https://${s}`;
}

/**
 * Convierte el dato que escribe el usuario en el contenido del QR.
 * type: whatsapp | phone | url | instagram | alias | text
 * Devuelve { ok, payload, error }.
 */
export function contactPayload(type, raw, message = '') {
  const s = String(raw || '').trim();
  if (!s) return { ok: false, error: 'Completá el dato del código QR.' };
  if (type === 'whatsapp') {
    const n = normalizeContact('whatsapp', s);
    if (!n.ok) return { ok: false, error: n.error };
    const msg = message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
    return { ok: true, payload: `https://wa.me/${n.value.slice(1)}${msg}` };
  }
  if (type === 'phone') {
    const d = s.replace(/[^\d+]/g, '');
    if (d.replace(/\D/g, '').length < 6) return { ok: false, error: 'El teléfono parece incompleto.' };
    return { ok: true, payload: `tel:${d}` };
  }
  if (type === 'instagram') {
    const n = normalizeContact('instagram', s);
    if (!n.ok) return { ok: false, error: n.error };
    return { ok: true, payload: `https://instagram.com/${n.value.slice(1)}` };
  }
  if (type === 'url') {
    const u = normalizeUrl(s);
    if (!/^https?:\/\/[^\s/.]+\.[^\s]{2,}/i.test(u)) return { ok: false, error: 'El enlace no parece válido (ej.: link.mercadopago.com.ar/tunegocio).' };
    return { ok: true, payload: u };
  }
  return { ok: true, payload: s };
}
