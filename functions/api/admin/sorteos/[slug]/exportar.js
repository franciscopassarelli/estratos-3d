// GET /api/admin/sorteos/:slug/exportar — lista de participantes en CSV (abre en Excel).
import { handle } from '../../../../../server/http.js';
import { findPromo, getDraws } from '../../../../../server/promos.js';

const cell = (v) => {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita fórmulas al abrir en Excel
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
// Formato legible y seguro para Excel (sin signos iniciales que lo conviertan en fórmula o número).
const contactCell = (type, v) => {
  if (type === 'whatsapp') {
    const d = v.replace(/\D/g, '');
    return d.startsWith('549') ? `54 9 ${d.slice(3, 5)} ${d.slice(5)}` : `${d.slice(0, 3)} ${d.slice(3)}`;
  }
  if (type === 'instagram') return `instagram.com/${v.replace(/^@/, '')}`;
  return v;
};
const TYPE = { whatsapp: 'WhatsApp', email: 'Email', instagram: 'Instagram' };

export const onRequestGet = handle(async ({ params, env }) => {
  const promo = findPromo(params.slug, { includeHidden: true });
  const db = env.DB;
  const { results } = await db.prepare(
    'SELECT id, name, contact_type, contact_value, source, contacted, created_at FROM participants WHERE promo = ? ORDER BY created_at',
  ).bind(promo.slug).all();
  const draws = new Map((await getDraws(db, promo.slug)).map((d) => [d.participant_id, d.position]));
  const rows = [['N°', 'Nombre', 'Medio', 'Contacto', 'Origen', 'Contactado', 'Fecha de inscripción (UTC-3)', 'Sorteo']];
  (results || []).forEach((p, i) => {
    const date = new Date(p.created_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
    const pos = draws.get(p.id);
    rows.push([i + 1, p.name, TYPE[p.contact_type] || p.contact_type, contactCell(p.contact_type, p.contact_value), p.source || '', p.contacted ? 'Sí' : 'No', date, pos ? (pos === 1 ? 'Ganador' : `Suplente ${pos - 1}`) : '']);
  });
  const csv = '﻿' + rows.map((r) => r.map(cell).join(';')).join('\r\n');
  const name = `participantes-${promo.slug}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(csv, {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"`, 'Cache-Control': 'no-store' },
  });
});
