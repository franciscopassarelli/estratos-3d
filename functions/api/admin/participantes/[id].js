// PATCH  /api/admin/participantes/:id — { contacted: true|false }
// DELETE /api/admin/participantes/:id — elimina una inscripción (spam o repetida).
import { json, fail, handle, readJson } from '../../../../server/http.js';

const idOf = (params) => {
  const id = Number(params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const onRequestPatch = handle(async ({ request, params, env }) => {
  const id = idOf(params);
  if (!id) return fail(400, 'Participante inválido.');
  const { contacted } = await readJson(request);
  const r = await env.DB.prepare('UPDATE participants SET contacted = ? WHERE id = ?').bind(contacted ? 1 : 0, id).run();
  if (!r.meta || r.meta.changes === 0) return fail(404, 'No encontramos a ese participante.');
  return json({ ok: true });
});

export const onRequestDelete = handle(async ({ params, env }) => {
  const id = idOf(params);
  if (!id) return fail(400, 'Participante inválido.');
  const drawn = await env.DB.prepare('SELECT 1 FROM draws WHERE participant_id = ?').bind(id).first();
  if (drawn) return fail(409, 'No se puede eliminar a alguien que ya salió sorteado. Deshacé ese sorteo primero.');
  await env.DB.prepare('DELETE FROM participants WHERE id = ?').bind(id).run();
  return json({ ok: true });
});
