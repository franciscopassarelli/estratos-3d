// POST   /api/admin/sorteos/:slug/sortear — elige al azar el siguiente ganador (1 = ganador, 2+ = suplentes).
// DELETE /api/admin/sorteos/:slug/sortear — deshace el último sorteo (si el ganador no está publicado).
import { json, fail, handle, randomIndex } from '../../../../../server/http.js';
import { findPromo, getDraws, getState } from '../../../../../server/promos.js';

export const onRequestPost = handle(async ({ params, env }) => {
  const promo = findPromo(params.slug, { includeHidden: true });
  const db = env.DB;
  const { results } = await db.prepare(
    'SELECT id FROM participants WHERE promo = ? AND id NOT IN (SELECT participant_id FROM draws WHERE promo = ?) ORDER BY id',
  ).bind(promo.slug, promo.slug).all();
  const pool = results || [];
  if (!pool.length) return fail(409, 'No quedan participantes para sortear.');
  const position = (await getDraws(db, promo.slug)).length + 1;
  const chosen = pool[randomIndex(pool.length)];
  await db.prepare('INSERT INTO draws (promo, participant_id, position, pool_size) VALUES (?, ?, ?, ?)')
    .bind(promo.slug, chosen.id, position, pool.length).run();
  return json({ ok: true, position, participantId: chosen.id, poolSize: pool.length });
});

export const onRequestDelete = handle(async ({ params, env }) => {
  const promo = findPromo(params.slug, { includeHidden: true });
  const db = env.DB;
  const state = await getState(db, promo.slug);
  const draws = await getDraws(db, promo.slug);
  if (!draws.length) return fail(409, 'No hay sorteos para deshacer.');
  const last = draws[draws.length - 1];
  if (last.position === 1 && state?.winner_published) return fail(409, 'El ganador ya está publicado. Ocultalo antes de deshacer.');
  await db.prepare('DELETE FROM draws WHERE promo = ? AND position = ?').bind(promo.slug, last.position).run();
  return json({ ok: true });
});
