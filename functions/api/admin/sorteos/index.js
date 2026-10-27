// GET /api/admin/sorteos — lista de promociones con estado y cantidad de inscriptos.
import { json, handle } from '../../../../server/http.js';
import { PROMOS } from '../../../../src/content/promos.js';
import { statusOf, countParticipants } from '../../../../server/promos.js';

export const onRequestGet = handle(async ({ env }) => {
  const db = env.DB;
  const promos = [];
  for (const p of PROMOS) {
    const { status } = await statusOf(db, p);
    promos.push({ slug: p.slug, title: p.title, visible: p.visible, status, count: await countParticipants(db, p.slug) });
  }
  return json({ ok: true, promos });
});
