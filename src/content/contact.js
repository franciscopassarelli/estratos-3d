// Contacto para pedidos de piezas impresas (WhatsApp en formato internacional, sin + ni espacios).
export const WHATSAPP = '5491154661930';

/** Enlace de WhatsApp con el diseño y sus ajustes, para pedirlo impreso. */
export function orderLink(def, params) {
  const q = new URLSearchParams();
  for (const it of def.sections.flatMap((s) => s.items)) {
    if (it.private) continue;
    const v = params[it.key], d = def.defaults[it.key];
    if (v === undefined || v === d) continue;
    q.set(it.key, typeof v === 'boolean' ? (v ? '1' : '0') : String(v));
  }
  const url = `${location.origin}/crear/${def.id}${q.toString() ? `?${q}` : ''}`;
  const msg = `¡Hola! Quiero pedir impreso este diseño de Estratos 3D: *${def.name}*\n${url}`;
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
}
