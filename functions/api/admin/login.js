// POST /api/admin/login — inicia sesión con la contraseña del panel.
// DELETE /api/admin/login — cierra la sesión.
import { json, fail, handle, readJson, ipHash, safeEqual } from '../../../server/http.js';
import { authConfig, createSession, clearSession } from '../../../server/auth.js';

const MAX_FAILURES = 5;
const WINDOW = '-15 minutes';

export const onRequestPost = handle(async ({ request, env }) => {
  const { password, secret } = authConfig(env);
  const db = env.DB;
  const ip = await ipHash(request, env);
  const r = await db.prepare(`SELECT COUNT(*) AS n FROM login_attempts WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ','now','${WINDOW}')`).bind(ip).first();
  if (r && r.n >= MAX_FAILURES) return fail(429, 'Demasiados intentos fallidos. Esperá 15 minutos.');

  const body = await readJson(request, 1024);
  if (!(await safeEqual(secret, body.password || '', password))) {
    await db.prepare('INSERT INTO login_attempts (ip_hash) VALUES (?)').bind(ip).run();
    await db.prepare("DELETE FROM login_attempts WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ','now','-1 day')").run();
    return fail(401, 'Contraseña incorrecta.');
  }
  await db.prepare('DELETE FROM login_attempts WHERE ip_hash = ?').bind(ip).run();
  return json({ ok: true }, 200, { 'Set-Cookie': await createSession(secret) });
});

export const onRequestDelete = handle(async () => json({ ok: true }, 200, { 'Set-Cookie': clearSession() }));
