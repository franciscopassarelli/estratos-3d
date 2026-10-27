// Acceso a la base de datos de sorteos.
import { PROMOS, getPromo, promoStatus } from '../src/content/promos.js';
import { HttpError } from './http.js';

export function findPromo(slug, { includeHidden = false } = {}) {
  const promo = includeHidden ? PROMOS.find((p) => p.slug === slug) : getPromo(slug);
  if (!promo) throw new HttpError(404, 'No encontramos este sorteo.');
  return promo;
}

export async function getState(db, slug) {
  return (await db.prepare('SELECT status, winner_published FROM promo_state WHERE promo = ?').bind(slug).first()) || null;
}

export async function statusOf(db, promo) {
  const state = await getState(db, promo.slug);
  return { state, status: promoStatus(promo, state) };
}

export async function countParticipants(db, slug) {
  const r = await db.prepare('SELECT COUNT(*) AS n FROM participants WHERE promo = ?').bind(slug).first();
  return r ? r.n : 0;
}

export async function getDraws(db, slug) {
  const { results } = await db.prepare(
    `SELECT d.position, d.drawn_at, d.pool_size, p.id AS participant_id, p.name, p.contact_type, p.contact_value
       FROM draws d LEFT JOIN participants p ON p.id = d.participant_id
      WHERE d.promo = ? ORDER BY d.position`,
  ).bind(slug).all();
  return results || [];
}

export async function setState(db, slug, fields) {
  const current = (await getState(db, slug)) || { status: null, winner_published: 0 };
  const next = { ...current, ...fields };
  await db.prepare(
    `INSERT INTO promo_state (promo, status, winner_published, updated_at) VALUES (?, ?, ?, strftime('%Y-%m-%dT%H:%M:%SZ','now'))
     ON CONFLICT(promo) DO UPDATE SET status = excluded.status, winner_published = excluded.winner_published, updated_at = excluded.updated_at`,
  ).bind(slug, next.status ?? null, next.winner_published ? 1 : 0).run();
  return next;
}
