// Utilidades del servidor (Cloudflare Pages Functions). No es una ruta: lo importan
// los archivos de functions/.

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...SECURITY_HEADERS, ...headers },
  });
}

export const fail = (status, error, extra = {}) => json({ ok: false, error, ...extra }, status);

/** Lee un JSON pequeño del cuerpo. Rechaza otros tipos de contenido y cuerpos grandes. */
export async function readJson(request, maxBytes = 4096) {
  const type = request.headers.get('Content-Type') || '';
  if (!type.includes('application/json')) throw new HttpError(415, 'Formato no admitido.');
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, 'Los datos enviados son demasiado grandes.');
  try { return JSON.parse(text || '{}'); } catch { throw new HttpError(400, 'Los datos enviados no son válidos.'); }
}

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Envuelve un handler: errores conocidos -> respuesta JSON; desconocidos -> 500 sin detalles. */
export const handle = (fn) => async (context) => {
  try {
    return await fn(context);
  } catch (err) {
    if (err instanceof HttpError) return fail(err.status, err.message);
    console.error(err);
    return fail(500, 'Ocurrió un error en el servidor. Probá de nuevo en un rato.');
  }
};

export function requireDb(env) {
  if (!env.DB) throw new HttpError(503, 'La base de datos todavía no está conectada. Revisá SORTEOS.md.');
  return env.DB;
}

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export async function sha256(text) {
  return b64url(await crypto.subtle.digest('SHA-256', enc.encode(text)));
}

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}
export async function hmac(secret, text) {
  return b64url(await crypto.subtle.sign('HMAC', await hmacKey(secret), enc.encode(text)));
}

/** Comparación en tiempo constante (sobre HMAC de ambos valores). */
export async function safeEqual(secret, a, b) {
  const [x, y] = await Promise.all([hmac(secret, String(a)), hmac(secret, String(b))]);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.min(x.length, y.length); i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}

/** Huella anónima de la IP (no se guarda la IP real). */
export async function ipHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'local';
  return sha256(`${ip}|${env.SESSION_SECRET || 'estratos'}`);
}

/** Entero aleatorio uniforme en [0, n). */
export function randomIndex(n) {
  const max = Math.floor(0x100000000 / n) * n;
  const buf = new Uint32Array(1);
  do crypto.getRandomValues(buf); while (buf[0] >= max);
  return buf[0] % n;
}
