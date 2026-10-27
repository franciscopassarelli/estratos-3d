// Sesión del panel: cookie firmada con HMAC, HttpOnly, Secure y SameSite=Strict.
import { hmac, safeEqual, HttpError } from './http.js';

export const COOKIE = '__Host-estratos_admin';
const SESSION_HOURS = 12;

export function authConfig(env) {
  const password = env.ADMIN_PASSWORD || '';
  const secret = env.SESSION_SECRET || '';
  if (password.length < 12 || secret.length < 32) {
    throw new HttpError(503, 'El panel no está configurado: faltan ADMIN_PASSWORD (12+ caracteres) o SESSION_SECRET (32+ caracteres). Revisá SORTEOS.md.');
  }
  return { password, secret };
}

export async function createSession(secret) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const nonce = crypto.randomUUID();
  const payload = `v1.${exp}.${nonce}`;
  const value = `${payload}.${await hmac(secret, payload)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export const clearSession = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

function readCookie(request, name) {
  const header = request.headers.get('Cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export async function hasValidSession(request, secret) {
  const value = readCookie(request, COOKIE);
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return false;
  const payload = parts.slice(0, 3).join('.');
  if (!(await safeEqual(secret, parts[3], await hmac(secret, payload)))) return false;
  return Number(parts[1]) > Date.now();
}

/** Para pedidos que modifican datos: el origen tiene que ser el propio sitio. */
export function checkSameOrigin(request) {
  if (request.method === 'GET' || request.method === 'HEAD') return;
  const origin = request.headers.get('Origin');
  const host = new URL(request.url).origin;
  if (!origin || origin !== host) throw new HttpError(403, 'Pedido rechazado por seguridad.');
}
