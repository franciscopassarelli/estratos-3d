// GET /api/admin/sesion — responde 200 si la sesión es válida (el middleware ya lo verificó).
import { json, handle } from '../../../server/http.js';
export const onRequestGet = handle(async () => json({ ok: true }));
