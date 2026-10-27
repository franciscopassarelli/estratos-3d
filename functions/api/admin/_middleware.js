// Protege todo /api/admin/*: exige una sesión válida (salvo para iniciar sesión)
// y que los pedidos que modifican datos vengan del propio sitio.
import { handle, fail, requireDb } from '../../../server/http.js';
import { authConfig, hasValidSession, checkSameOrigin } from '../../../server/auth.js';

export const onRequest = handle(async (context) => {
  const { request, env, next } = context;
  const { secret } = authConfig(env);
  requireDb(env);
  checkSameOrigin(request);
  const path = new URL(request.url).pathname;
  if (path === '/api/admin/login') return next();
  if (!(await hasValidSession(request, secret))) return fail(401, 'Tu sesión venció. Volvé a ingresar.');
  const res = await next();
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', 'no-store');
  return out;
});
