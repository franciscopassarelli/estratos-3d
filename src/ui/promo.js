// Página pública de un sorteo: /sorteos/<slug>
import { SITE } from '../config.js';
import { getPromo, promoRules, formatPromoDate, STATUS_LABEL } from '../content/promos.js';
import { CONTACT_TYPES, validateEntry, normalizeContact } from '../promo/validate.js';
import { thumbnail, onThumbnail } from './thumbnails.js';
import { getObject } from '../objects/index.js';
import { esc, icon, $, $$, storage } from './dom.js';

const joinedKey = (slug) => `estratos:sorteo:${slug}`;
const promoUrl = (slug) => `${SITE.url}/sorteos/${slug}`;

const prizeIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12v9H4v-9M2 7h20v5H2zM12 21V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z"/></svg>`;
const calIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>`;
const pinIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>`;
const userIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/></svg>`;
const TYPE_ICON = {
  whatsapp: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5l1.3-4.2A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2z"/></svg>`,
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/></svg>`,
  instagram: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6" fill="currentColor"/></svg>`,
};

function prizeCard(p, i) {
  let media = `<span class="prize-ph">${prizeIcon}</span>`;
  if (p.image) media = `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">`;
  else if (p.objectId && getObject(p.objectId)) {
    const t = thumbnail(p.objectId);
    media = t ? `<img src="${t}" alt="${esc(p.title)}">` : `<span class="prize-ph" data-thumb="${p.objectId}">${prizeIcon}</span>`;
  }
  return `<article class="prize"><div class="prize-media">${media}<span class="prize-n">${i + 1}° premio</span></div><div class="prize-body"><h3>${esc(p.title)}</h3>${p.description ? `<p>${esc(p.description)}</p>` : ''}</div></article>`;
}

function contactField(type) {
  const t = CONTACT_TYPES[type];
  const input = type === 'instagram'
    ? `<div class="input-prefix"><span>@</span><input id="pr-contact" name="contact" type="text" inputmode="${t.inputmode}" autocomplete="${t.autocomplete}" autocapitalize="off" spellcheck="false" placeholder="${esc(t.placeholder)}" maxlength="80" required></div>`
    : `<input id="pr-contact" name="contact" type="${type === 'email' ? 'email' : 'tel'}" inputmode="${t.inputmode}" autocomplete="${t.autocomplete}" placeholder="${esc(t.placeholder)}" maxlength="80" required>`;
  return `<label class="ctl-label" for="pr-contact">${t.label}</label>${input}<span class="field-hint" id="pr-contact-hint">${esc(t.hint)}</span><span class="field-error" id="pr-contact-err" role="alert"></span>`;
}

export function promoPage(slug) {
  const promo = getPromo(slug);
  if (!promo) {
    return `<main class="wrap"><div class="page-head"><span class="eyebrow">Sorteos</span><h1>Este sorteo no está disponible</h1><p class="lead">Puede que haya terminado o que el enlace esté mal escrito.</p><div class="hero-actions"><a class="btn btn-primary" href="/">Ir al inicio</a></div></div></main>`;
  }
  const draw = formatPromoDate(promo.drawAt);
  const closes = formatPromoDate(promo.closesAt);
  const types = promo.contactTypes;
  const facts = [
    draw ? `<li>${calIcon}<span><b>Sorteo</b>${esc(draw)}</span></li>` : `<li>${calIcon}<span><b>Sorteo</b>Fecha a confirmar</span></li>`,
    promo.event?.place ? `<li>${pinIcon}<span><b>Lugar</b>${esc(promo.event.place)}</span></li>` : '',
    closes ? `<li>${calIcon}<span><b>Inscripción hasta</b>${esc(closes)}</span></li>` : '',
    promo.showCount ? `<li>${userIcon}<span><b>Participantes</b><span id="pr-count">—</span></span></li>` : '',
  ].filter(Boolean).join('');

  return `
  <main class="promo">
    <section class="promo-hero">
      <div class="wrap promo-grid">
        <div class="promo-copy">
          <span class="promo-status" id="pr-status" data-status="abierto"><i></i><span>${STATUS_LABEL.abierto}</span></span>
          <span class="eyebrow">${esc(promo.eyebrow)}${promo.event?.name ? ` · ${esc(promo.event.name)}` : ''}</span>
          <h1>${esc(promo.title)}</h1>
          <p class="lead">${esc(promo.intro)}</p>
          <ul class="promo-facts">${facts}</ul>
        </div>

        <div class="promo-card" id="pr-card">
          <form id="pr-form" novalidate>
            <h2>Anotate gratis</h2>
            <div class="field">
              <label class="ctl-label" for="pr-name">Nombre y apellido</label>
              <input id="pr-name" name="name" type="text" autocomplete="name" maxlength="60" placeholder="Ej.: Sofía Pérez" required>
              <span class="field-error" id="pr-name-err" role="alert"></span>
            </div>
            <div class="field">
              <span class="ctl-label" id="pr-type-label">¿Cómo te avisamos si ganás?</span>
              <div class="seg contact-seg" role="radiogroup" aria-labelledby="pr-type-label">
                ${types.map((t, i) => `<button type="button" role="radio" data-type="${t}" aria-checked="${i === 0}">${TYPE_ICON[t]}<span>${CONTACT_TYPES[t].label}</span></button>`).join('')}
              </div>
            </div>
            <div class="field" id="pr-contact-field">${contactField(types[0])}</div>
            <label class="check" for="pr-consent">
              <input id="pr-consent" type="checkbox">
              <span>Acepto las <a href="#bases">bases del sorteo</a> y que usen este dato solo para contactarme por el sorteo.</span>
            </label>
            <span class="field-error" id="pr-consent-err" role="alert"></span>
            <div class="hp" aria-hidden="true"><label for="pr-website">No completar</label><input id="pr-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
            ${SITE.turnstileSiteKey ? `<div class="cf-turnstile" data-sitekey="${esc(SITE.turnstileSiteKey)}" data-language="es" data-theme="auto"></div>` : ''}
            <div class="form-error" id="pr-error" role="alert" hidden></div>
            <button class="btn btn-primary btn-lg pr-submit" id="pr-submit" type="submit">Participar del sorteo</button>
            <p class="note">Sin costo y sin compras. Te tarda menos de un minuto.</p>
          </form>
          <div id="pr-done" hidden></div>
          <div id="pr-closed" hidden></div>
        </div>
      </div>
    </section>

    <section class="wrap section promo-section" aria-labelledby="prizes-title">
      <div class="section-head"><div><span class="eyebrow">Premios</span><h2 id="prizes-title">Qué se sortea</h2></div></div>
      ${promo.prizes.length
        ? `<div class="prizes">${promo.prizes.map(prizeCard).join('')}</div>`
        : `<div class="prize-tbd">${prizeIcon}<div><h3>Premios a confirmar</h3><p>Muy pronto publicamos acá los premios, impresos en 3D por Estratos 3D. Anotate ahora y ya quedás participando.</p></div></div>`}
    </section>

    <section class="wrap section promo-section promo-about">
      <div><span class="eyebrow">Estratos 3D</span><h2>Mientras tanto, diseñá algo con tu nombre</h2>
      <p>Estratos 3D es una herramienta gratuita para crear llaveros, placas, macetas y otros objetos personalizados, y descargarlos listos para imprimir en 3D.</p></div>
      <div class="hero-actions"><a class="btn btn-primary" href="/crear/llavero">Crear un llavero</a><a class="btn" href="/catalogo">Ver todos los diseños</a></div>
    </section>

    <section class="wrap section promo-section" id="bases" aria-labelledby="bases-title">
      <div class="section-head"><div><span class="eyebrow">Bases y condiciones</span><h2 id="bases-title">Reglas del sorteo</h2></div></div>
      <ol class="rules">${promoRules(promo, SITE.name).map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
      <p class="note">Organiza ${esc(SITE.owner || SITE.name)}. Consultas: <span class="mono">${esc(SITE.email)}</span>. <a href="/privacidad">Política de privacidad</a>.</p>
    </section>
  </main>`;
}

function doneView(promo, firstName, duplicate) {
  const url = promoUrl(promo.slug);
  const share = `${promo.shareText} ${url}`;
  return `
    <div class="done">
      <span class="done-check">${icon.check}</span>
      <h2>${duplicate ? `${esc(firstName || 'Hola')}, ya estabas anotado` : `¡Listo${firstName ? `, ${esc(firstName)}` : ''}! Ya estás participando`}</h2>
      <p>${duplicate ? 'Ese contacto ya figura en el sorteo, no hace falta que te anotes de nuevo.' : 'Si ganás, te contactamos por el medio que nos dejaste. ¡Suerte!'}</p>
      <div class="done-actions">
        <a class="btn btn-primary btn-lg" href="/crear/llavero" id="pr-keychain">Diseñá tu llavero${firstName ? ` “${esc(firstName)}”` : ''}</a>
        <a class="btn btn-lg" href="https://wa.me/?text=${encodeURIComponent(share)}" target="_blank" rel="noopener" id="pr-share">${TYPE_ICON.whatsapp}Compartir por WhatsApp</a>
        <button class="btn btn-ghost" type="button" id="pr-copy">Copiar enlace del sorteo</button>
      </div>
    </div>`;
}

function closedView(status, winner) {
  if (status === 'proximamente') return `<div class="done"><h2>La inscripción abre pronto</h2><p>Volvé a esta página en unos días para anotarte.</p></div>`;
  if (status === 'finalizado') return `<div class="done"><span class="done-check">${prizeIcon}</span><h2>¡Ya tenemos ganador!</h2>${winner ? `<p class="winner">${esc(winner)}</p>` : ''}<p>Gracias a todas las personas que participaron. Seguí a Estratos 3D para las próximas promociones.</p><div class="done-actions"><a class="btn btn-primary" href="/crear/llavero">Diseñá tu llavero</a></div></div>`;
  return `<div class="done"><h2>La inscripción está cerrada</h2><p>Ya no se reciben nuevas participaciones. Pronto anunciamos el resultado en esta página.</p></div>`;
}

export function mountPromo(root, slug, query) {
  const promo = getPromo(slug);
  if (!promo) return () => {};
  const form = $('#pr-form', root), done = $('#pr-done', root), closed = $('#pr-closed', root);
  const statusEl = $('#pr-status', root);
  let type = promo.contactTypes[0];
  let turnstileWidget = null;
  const source = (query && query.get('origen')) || '';

  const setStatus = (s) => {
    statusEl.dataset.status = s;
    statusEl.querySelector('span').textContent = STATUS_LABEL[s] || '';
  };
  const showDone = (firstName, duplicate) => {
    form.hidden = true; closed.hidden = true;
    done.innerHTML = doneView(promo, firstName, duplicate);
    done.hidden = false;
    $('#pr-keychain', done).addEventListener('click', () => {
      const saved = storage.get('estratos:params:llavero', {});
      if (firstName) storage.set('estratos:params:llavero', { ...saved, text: firstName.slice(0, 14) });
    });
    $('#pr-copy', done).addEventListener('click', async (e) => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(promoUrl(promo.slug)); b.textContent = 'Enlace copiado'; } catch { b.textContent = promoUrl(promo.slug); }
    });
  };

  // Estado guardado en este dispositivo (solo para no volver a mostrar el formulario).
  const joined = storage.get(joinedKey(slug));
  if (joined) showDone(joined.firstName, false);

  // Estado real desde el servidor.
  fetch(`/api/sorteos/${encodeURIComponent(slug)}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
    if (!d) return;
    setStatus(d.status);
    const c = $('#pr-count', root);
    if (c && typeof d.count === 'number') c.textContent = d.count === 0 ? 'Sé la primera persona' : `${d.count} ${d.count === 1 ? 'persona' : 'personas'}`;
    if (d.status !== 'abierto' && !joined) {
      form.hidden = true;
      closed.innerHTML = closedView(d.status, d.winner);
      closed.hidden = false;
    } else if (d.status === 'finalizado') {
      done.hidden = true;
      closed.innerHTML = closedView(d.status, d.winner);
      closed.hidden = false;
    }
  }).catch(() => { /* sin conexión con la API: el formulario avisará al enviar */ });

  // Turnstile (opcional)
  if (SITE.turnstileSiteKey && !document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]')) {
    const s = document.createElement('script');
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
    s.async = true; s.defer = true;
    document.head.appendChild(s);
  }

  const field = $('#pr-contact-field', root);
  root.querySelector('.contact-seg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-type]');
    if (!b || b.dataset.type === type) return;
    type = b.dataset.type;
    $$('.contact-seg [data-type]', root).forEach((x) => x.setAttribute('aria-checked', String(x === b)));
    field.innerHTML = contactField(type);
    $('#pr-contact', root).focus();
  });

  const setErr = (id, msg) => {
    const el = $(`#${id}-err`, root);
    if (el) el.textContent = msg || '';
    const input = id === 'pr-consent' ? $('#pr-consent', root) : $(`#${id}`, root);
    input?.setAttribute('aria-invalid', msg ? 'true' : 'false');
  };
  root.addEventListener('focusout', (e) => {
    if (e.target.id === 'pr-contact' && e.target.value.trim()) {
      const c = normalizeContact(type, e.target.value);
      setErr('pr-contact', c.ok ? '' : c.error);
    }
  });

  const submit = $('#pr-submit', root), errBox = $('#pr-error', root);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errBox.hidden = true;
    const entry = {
      name: $('#pr-name', root).value,
      contactType: type,
      contact: $('#pr-contact', root).value,
      consent: $('#pr-consent', root).checked,
      website: $('#pr-website', root).value,
      source,
    };
    const v = validateEntry(entry, promo.contactTypes);
    setErr('pr-name', v.errors?.name); setErr('pr-contact', v.errors?.contact); setErr('pr-consent', v.errors?.consent);
    if (!v.ok) {
      const first = v.errors.name ? '#pr-name' : v.errors.contact ? '#pr-contact' : '#pr-consent';
      $(first, root)?.focus();
      return;
    }
    if (SITE.turnstileSiteKey) {
      const tokenInput = form.querySelector('[name="cf-turnstile-response"]');
      entry.turnstileToken = tokenInput ? tokenInput.value : '';
    }
    submit.disabled = true;
    submit.innerHTML = '<span class="spinner"></span> Anotándote…';
    try {
      const r = await fetch(`/api/sorteos/${encodeURIComponent(slug)}/inscripcion`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(entry),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.ok) {
        storage.set(joinedKey(slug), { firstName: d.firstName, at: Date.now() });
        showDone(d.firstName, !!d.duplicate);
        done.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        const c = $('#pr-count', root);
        if (c && !d.duplicate) fetch(`/api/sorteos/${encodeURIComponent(slug)}`).then((x) => x.json()).then((x) => { if (typeof x.count === 'number') c.textContent = `${x.count} ${x.count === 1 ? 'persona' : 'personas'}`; }).catch(() => {});
        return;
      }
      if (d.errors) { setErr('pr-name', d.errors.name); setErr('pr-contact', d.errors.contact); setErr('pr-consent', d.errors.consent); }
      if (d.status && d.status !== 'abierto') {
        form.hidden = true; closed.innerHTML = closedView(d.status); closed.hidden = false; setStatus(d.status);
        return;
      }
      errBox.textContent = d.error || 'No pudimos registrar tu participación. Probá de nuevo en unos minutos.';
      errBox.hidden = false;
    } catch {
      errBox.textContent = 'No hay conexión con el servidor. Revisá tu internet y probá de nuevo.';
      errBox.hidden = false;
    } finally {
      submit.disabled = false;
      submit.textContent = 'Participar del sorteo';
      if (window.turnstile && SITE.turnstileSiteKey) try { window.turnstile.reset(); } catch { /* */ }
    }
  });

  const off = onThumbnail((id, url) => {
    $$(`[data-thumb="${id}"]`, root).forEach((el) => { el.outerHTML = `<img src="${url}" alt="">`; });
  });
  return () => { off(); void turnstileWidget; };
}
