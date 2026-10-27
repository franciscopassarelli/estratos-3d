// POST /api/sorteos/:slug/inscripcion — registra una participación.
import { json, fail, handle, readJson, requireDb, ipHash } from '../../../../server/http.js';
import { findPromo, statusOf } from '../../../../server/promos.js';
import { validateEntry, firstName } from '../../../../src/promo/validate.js';
import { CONTACT_TYPES } from '../../../../src/promo/validate.js';

const MAX_PER_IP_PER_HOUR = 6;

async function verifyTurnstile(token, request, secret) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token || '');
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.append('remoteip', ip);
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  const data = await r.json().catch(() => ({}));
  return data.success === true;
}

async function notify(env, promo, entry) {
  // Aviso opcional por correo (requiere el binding EMAIL y NOTIFY_TO; ver SORTEOS.md).
  if (!env.EMAIL || typeof env.EMAIL.send !== 'function' || !env.NOTIFY_TO) return;
  const label = CONTACT_TYPES[entry.contactType]?.label || entry.contactType;
  const text = `Nuevo inscripto en "${promo.title}":\n\n${entry.name}\n${label}: ${entry.contact}\n\nPanel: ${env.SITE_URL || 'https://estratos3d.com'}/admin`;
  try {
    await env.EMAIL.send({ to: env.NOTIFY_TO, from: env.NOTIFY_FROM || 'sorteos@estratos3d.com', subject: `Nuevo inscripto: ${entry.name}`, text });
  } catch (err) {
    console.error('No se pudo enviar el aviso por correo', err);
  }
}

export const onRequestPost = handle(async ({ request, params, env, waitUntil }) => {
  const promo = findPromo(params.slug);
  const db = requireDb(env);
  const body = await readJson(request);

  // Trampa para bots: campo invisible que una persona no completa.
  if (body.website) return json({ ok: true, firstName: '' });

  const { status } = await statusOf(db, promo);
  if (status !== 'abierto') {
    return fail(409, status === 'proximamente' ? 'La inscripción todavía no está abierta.' : 'La inscripción a este sorteo ya cerró.', { status });
  }

  const v = validateEntry(body, promo.contactTypes);
  if (!v.ok) return fail(422, 'Revisá los datos marcados.', { errors: v.errors });

  if (env.TURNSTILE_SECRET && !(await verifyTurnstile(body.turnstileToken, request, env.TURNSTILE_SECRET))) {
    return fail(403, 'No pudimos verificar que no sos un robot. Recargá la página y probá de nuevo.');
  }

  const ip = await ipHash(request, env);
  const recent = await db.prepare(
    "SELECT COUNT(*) AS n FROM participants WHERE ip_hash = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%SZ', 'now', '-1 hour')",
  ).bind(ip).first();
  if (recent && recent.n >= MAX_PER_IP_PER_HOUR) {
    return fail(429, 'Se registraron muchas inscripciones desde esta conexión. Probá de nuevo en una hora.');
  }

  const source = String(body.source || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30) || null;
  try {
    await db.prepare('INSERT INTO participants (promo, name, contact_type, contact_value, source, ip_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(promo.slug, v.data.name, v.data.contactType, v.data.contact, source, ip).run();
  } catch (err) {
    if (String(err && err.message).includes('UNIQUE')) {
      return json({ ok: true, duplicate: true, firstName: firstName(v.data.name) });
    }
    throw err;
  }
  waitUntil(notify(env, promo, v.data));
  return json({ ok: true, firstName: firstName(v.data.name) }, 201);
});
