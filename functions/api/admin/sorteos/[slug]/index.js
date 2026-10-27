// GET  /api/admin/sorteos/:slug — participantes, estado y sorteos realizados.
// POST /api/admin/sorteos/:slug — cambia el estado: { action: 'abrir'|'cerrar'|'automatico'|'publicar'|'ocultar-ganador'|'borrar-datos' }
import { json, fail, handle, readJson } from '../../../../../server/http.js';
import { findPromo, statusOf, getDraws, setState } from '../../../../../server/promos.js';

export const onRequestGet = handle(async ({ params, env }) => {
  const promo = findPromo(params.slug, { includeHidden: true });
  const db = env.DB;
  const { state, status } = await statusOf(db, promo);
  const { results } = await db.prepare(
    'SELECT id, name, contact_type, contact_value, source, contacted, created_at FROM participants WHERE promo = ? ORDER BY created_at DESC',
  ).bind(promo.slug).all();
  return json({ ok: true, status, override: state?.status || null, winnerPublished: !!state?.winner_published, participants: results || [], draws: await getDraws(db, promo.slug) });
});

export const onRequestPost = handle(async ({ request, params, env }) => {
  const promo = findPromo(params.slug, { includeHidden: true });
  const db = env.DB;
  const { action, confirm } = await readJson(request);
  if (action === 'abrir') await setState(db, promo.slug, { status: 'abierto' });
  else if (action === 'cerrar') await setState(db, promo.slug, { status: 'cerrado' });
  else if (action === 'automatico') await setState(db, promo.slug, { status: null });
  else if (action === 'publicar') {
    const draws = await getDraws(db, promo.slug);
    if (!draws.some((d) => d.position === 1)) return fail(409, 'Primero sorteá un ganador.');
    await setState(db, promo.slug, { winner_published: 1, status: 'cerrado' });
  } else if (action === 'ocultar-ganador') await setState(db, promo.slug, { winner_published: 0 });
  else if (action === 'borrar-datos') {
    if (confirm !== promo.slug) return fail(400, `Para borrar, escribí exactamente: ${promo.slug}`);
    await db.batch([
      db.prepare('DELETE FROM draws WHERE promo = ?').bind(promo.slug),
      db.prepare('DELETE FROM participants WHERE promo = ?').bind(promo.slug),
    ]);
    await setState(db, promo.slug, { winner_published: 0 });
  } else return fail(400, 'Acción desconocida.');
  return json({ ok: true });
});
