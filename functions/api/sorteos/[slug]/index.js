// GET /api/sorteos/:slug — estado público del sorteo (abierto, cantidad, ganador publicado).
import { json, handle, requireDb } from '../../../../server/http.js';
import { findPromo, statusOf, countParticipants, getDraws } from '../../../../server/promos.js';
import { publicName } from '../../../../src/promo/validate.js';

export const onRequestGet = handle(async ({ params, env }) => {
  const promo = findPromo(params.slug);
  const db = requireDb(env);
  const { status } = await statusOf(db, promo);
  const out = { ok: true, status };
  if (promo.showCount) out.count = await countParticipants(db, promo.slug);
  if (status === 'finalizado') {
    const winner = (await getDraws(db, promo.slug)).find((d) => d.position === 1);
    if (winner && winner.name) out.winner = publicName(winner.name);
  }
  return json(out);
});
