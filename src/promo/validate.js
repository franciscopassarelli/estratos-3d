// Validación y normalización de inscripciones. La usan el formulario (para avisar
// al instante) y el servidor (que es quien decide). Sin dependencias del navegador.

export const CONTACT_TYPES = {
  whatsapp: { label: 'WhatsApp', placeholder: '11 5466 1930', hint: 'Código de área sin 0 y número sin 15. Si no es de Argentina, empezá con +.', inputmode: 'tel', autocomplete: 'tel' },
  email: { label: 'Email', placeholder: 'nombre@correo.com', hint: 'Te escribimos solo si ganás.', inputmode: 'email', autocomplete: 'email' },
  instagram: { label: 'Instagram', placeholder: 'tu_usuario', hint: 'Tu usuario, con o sin @.', inputmode: 'text', autocomplete: 'off' },
};

export const NAME_MAX = 60;

export function normalizeName(raw) {
  return String(raw ?? '').replace(/[\u0000-\u001f\u007f<>]/g, '').replace(/\s+/g, ' ').trim();
}

/** Devuelve { ok, value?, error? } con el contacto normalizado. */
export function normalizeContact(type, raw) {
  const s = String(raw ?? '').trim();
  if (!s) return { ok: false, error: 'Completá este dato para que podamos avisarte si ganás.' };
  if (type === 'whatsapp') {
    const international = s.startsWith('+') || s.startsWith('00');
    let d = s.replace(/\D/g, '');
    if (s.startsWith('00')) d = d.slice(2);
    if (international && !d.startsWith('54')) {
      if (d.length < 8 || d.length > 15) return { ok: false, error: 'El número internacional no parece válido.' };
      return { ok: true, value: '+' + d };
    }
    // Argentina: +54 9 <área><número> (10 dígitos sin 0 ni 15)
    if (d.startsWith('54')) d = d.slice(2);
    if (d.startsWith('9') && d.length === 11) d = d.slice(1);
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length === 12 && /^\d{2,4}15/.test(d)) {
      return { ok: false, error: 'Sacá el 15 del número. Ej.: 11 5466 1930.' };
    }
    if (d.length !== 10) return { ok: false, error: 'Escribí el código de área sin 0 y el número sin 15 (10 dígitos). Ej.: 11 5466 1930.' };
    return { ok: true, value: '+549' + d };
  }
  if (type === 'email') {
    const e = s.toLowerCase();
    if (e.length > 120 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e)) return { ok: false, error: 'Revisá el email, parece incompleto.' };
    return { ok: true, value: e };
  }
  if (type === 'instagram') {
    let u = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '').toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(u)) return { ok: false, error: 'El usuario de Instagram solo puede tener letras, números, puntos y guiones bajos.' };
    return { ok: true, value: '@' + u };
  }
  return { ok: false, error: 'Elegí cómo querés que te contactemos.' };
}

/** Valida una inscripción completa. Devuelve { ok, data?, errors? }. */
export function validateEntry(input, allowedTypes = Object.keys(CONTACT_TYPES)) {
  const errors = {};
  const name = normalizeName(input.name);
  if (name.length < 2) errors.name = 'Escribí tu nombre.';
  else if (name.length > NAME_MAX) errors.name = `El nombre puede tener hasta ${NAME_MAX} caracteres.`;
  const type = String(input.contactType || '');
  let contact = null;
  if (!allowedTypes.includes(type)) errors.contact = 'Elegí cómo querés que te contactemos.';
  else {
    const c = normalizeContact(type, input.contact);
    if (c.ok) contact = c.value; else errors.contact = c.error;
  }
  if (input.consent !== true) errors.consent = 'Necesitamos que aceptes las bases para participar.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, contactType: type, contact } };
}

/** Nombre público del ganador: nombre + inicial del apellido. */
export function publicName(name) {
  const parts = normalizeName(name).split(' ');
  if (parts.length < 2) return parts[0] || '';
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export const firstName = (name) => normalizeName(name).split(' ')[0] || '';

/** Enlace para contactar a un participante desde el panel. */
export function contactLink(type, value, message = '') {
  if (type === 'whatsapp') return `https://wa.me/${value.replace(/\D/g, '')}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
  if (type === 'email') return `mailto:${value}?subject=${encodeURIComponent('Sorteo Estratos 3D')}${message ? `&body=${encodeURIComponent(message)}` : ''}`;
  if (type === 'instagram') return `https://ig.me/m/${value.replace(/^@/, '')}`;
  return '#';
}
