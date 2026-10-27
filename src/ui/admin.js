// Panel privado de sorteos: /admin
// Todo lo sensible se valida en el servidor (functions/api/admin). Esta página solo
// muestra lo que la API devuelve a una sesión válida.
import { PROMOS, STATUS_LABEL } from '../content/promos.js';
import { CONTACT_TYPES, contactLink, firstName } from '../promo/validate.js';
import { esc, icon, $, $$, toast, storage } from './dom.js';

export function adminPage() {
  return `<main class="wrap admin" id="admin-root"><div class="admin-loading"><span class="spinner"></span> Cargando panel…</div></main>`;
}

async function api(path, opts = {}) {
  const init = { method: opts.method || 'GET', headers: {}, credentials: 'same-origin' };
  if (opts.body !== undefined) { init.headers['Content-Type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
  let r;
  try { r = await fetch(path, init); } catch { throw Object.assign(new Error('No hay conexión con el servidor.'), { status: 0 }); }
  const d = await r.json().catch(() => ({}));
  if (!r.ok || d.ok === false) throw Object.assign(new Error(d.error || `Error ${r.status}`), { status: r.status });
  return d;
}

const fmt = (iso) => new Date(iso).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

export function mountAdmin(root) {
  const box = $('#admin-root', root);
  let current = storage.get('estratos:admin:promo', PROMOS[0]?.slug);
  let data = null, list = [], filter = '', onlyPending = false;
  let alive = true;

  const loginView = (msg = '') => {
    box.innerHTML = `
      <form class="admin-login" id="ad-login" novalidate>
        <span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <h1>Panel de sorteos</h1>
        <p class="note">Acceso privado de Estratos 3D.</p>
        <label class="ctl-label" for="ad-pass">Contraseña</label>
        <input id="ad-pass" type="password" autocomplete="current-password" required>
        <div class="form-error" id="ad-login-err" role="alert" ${msg ? '' : 'hidden'}>${esc(msg)}</div>
        <button class="btn btn-primary btn-lg" type="submit" id="ad-login-btn">Ingresar</button>
      </form>`;
    $('#ad-pass', box).focus();
    $('#ad-login', box).addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = $('#ad-login-btn', box), err = $('#ad-login-err', box);
      btn.disabled = true; err.hidden = true;
      try {
        await api('/api/admin/login', { method: 'POST', body: { password: $('#ad-pass', box).value } });
        await load();
      } catch (ex) {
        err.textContent = ex.message; err.hidden = false; btn.disabled = false;
      }
    });
  };

  const errorView = (msg) => {
    box.innerHTML = `<div class="admin-login"><h1>No se pudo abrir el panel</h1><p class="form-error">${esc(msg)}</p><button class="btn" type="button" id="ad-retry">Reintentar</button></div>`;
    $('#ad-retry', box).addEventListener('click', load);
  };

  async function load() {
    try {
      list = (await api('/api/admin/sorteos')).promos;
      if (!list.some((p) => p.slug === current)) current = list[0]?.slug;
      data = current ? await api(`/api/admin/sorteos/${encodeURIComponent(current)}`) : null;
      if (alive) render();
    } catch (ex) {
      if (!alive) return;
      if (ex.status === 401) loginView();
      else errorView(ex.message);
    }
  }

  const promoDef = () => PROMOS.find((p) => p.slug === current);

  function render() {
    const def = promoDef();
    const ps = data?.participants || [];
    const contacted = ps.filter((p) => p.contacted).length;
    const byType = Object.keys(CONTACT_TYPES).map((t) => [t, ps.filter((p) => p.contact_type === t).length]);
    const draws = data?.draws || [];
    const drawnIds = new Set(draws.map((d) => d.participant_id));
    const q = filter.trim().toLowerCase();
    const rows = ps.filter((p) => (!onlyPending || !p.contacted) && (!q || `${p.name} ${p.contact_value}`.toLowerCase().includes(q)));
    const status = data?.status || 'abierto';

    box.innerHTML = `
      <div class="admin-top">
        <div>
          <span class="eyebrow">Panel de sorteos</span>
          <div class="admin-title">
            <h1>${esc(def?.title || 'Sin sorteos')}</h1>
            ${list.length > 1 ? `<select id="ad-promo" aria-label="Elegir sorteo">${list.map((p) => `<option value="${esc(p.slug)}" ${p.slug === current ? 'selected' : ''}>${esc(p.title)} (${p.count})</option>`).join('')}</select>` : ''}
          </div>
        </div>
        <div class="admin-top-actions">
          <a class="btn btn-sm" href="/sorteos/${esc(current)}" target="_blank" rel="noopener">Ver página pública</a>
          <button class="btn btn-sm btn-ghost" type="button" id="ad-logout">Salir</button>
        </div>
      </div>

      <section class="admin-stats">
        <div><dt>Inscriptos</dt><dd>${ps.length}</dd></div>
        <div><dt>Contactados</dt><dd>${contacted} <small>/ ${ps.length}</small></dd></div>
        ${byType.map(([t, n]) => `<div><dt>${CONTACT_TYPES[t].label}</dt><dd>${n}</dd></div>`).join('')}
        <div><dt>Estado</dt><dd><span class="promo-status" data-status="${status}"><i></i><span>${STATUS_LABEL[status]}</span></span></dd></div>
      </section>

      <section class="admin-panel">
        <div class="admin-panel-head"><h2>Estado y sorteo</h2></div>
        <div class="admin-controls">
          <div class="ctl">
            <span class="ctl-label">Inscripción</span>
            <div class="seg" role="group">
              <button type="button" data-action="abrir" aria-pressed="${data?.override === 'abierto'}">Abierta</button>
              <button type="button" data-action="cerrar" aria-pressed="${data?.override === 'cerrado'}">Cerrada</button>
              <button type="button" data-action="automatico" aria-pressed="${!data?.override}">Según fechas</button>
            </div>
            <span class="field-hint">“Según fechas” usa las fechas de src/content/promos.js.</span>
          </div>
          <div class="ctl">
            <span class="ctl-label">Sorteo</span>
            ${draws.length ? `<ol class="draws">${draws.map((d) => `<li><b>${d.position === 1 ? 'Ganador' : `Suplente ${d.position - 1}`}</b> ${esc(d.name || '(eliminado)')} <span class="mono">${esc(d.contact_value || '')}</span> <small>entre ${d.pool_size} · ${fmt(d.drawn_at)}</small>${d.name ? ` <a class="btn btn-sm" href="${esc(contactLink(d.contact_type, d.contact_value, def?.contactMessage?.(firstName(d.name)) || ''))}" target="_blank" rel="noopener">Contactar</a>` : ''}</li>`).join('')}</ol>` : '<p class="note">Todavía no se sorteó.</p>'}
            <div class="row-actions">
              <button class="btn btn-primary" type="button" id="ad-draw" ${ps.length - drawnIds.size > 0 ? '' : 'disabled'}>${draws.length ? 'Sortear suplente' : 'Sortear ganador'}</button>
              ${draws.length ? '<button class="btn btn-ghost" type="button" id="ad-undo">Deshacer último</button>' : ''}
              ${draws.some((d) => d.position === 1) ? (data.winnerPublished
                ? '<button class="btn" type="button" data-action="ocultar-ganador">Ocultar ganador de la página</button>'
                : '<button class="btn" type="button" data-action="publicar">Publicar ganador en la página</button>') : ''}
            </div>
            <div class="confirm-inline" id="ad-confirm" hidden></div>
          </div>
        </div>
      </section>

      <section class="admin-panel">
        <div class="admin-panel-head">
          <h2>Participantes</h2>
          <div class="row-actions">
            <a class="btn btn-sm" download href="/api/admin/sorteos/${esc(current)}/exportar" ${ps.length ? '' : 'aria-disabled="true"'}>${icon.download} Exportar a Excel (CSV)</a>
            <button class="btn btn-sm btn-ghost" type="button" id="ad-refresh">${icon.reset} Actualizar</button>
          </div>
        </div>
        <div class="admin-filters">
          <label class="search"><span class="sr">Buscar</span>${icon.search}<input id="ad-search" type="search" placeholder="Buscar por nombre o contacto" value="${esc(filter)}"></label>
          <label class="check"><input type="checkbox" id="ad-pending" ${onlyPending ? 'checked' : ''}><span>Solo sin contactar</span></label>
        </div>
        ${rows.length ? `<div class="ptable" role="table" aria-label="Participantes">
          <div class="prow phead" role="row"><span role="columnheader">Nombre</span><span role="columnheader">Contacto</span><span role="columnheader">Fecha</span><span role="columnheader">Contactado</span><span role="columnheader"><span class="sr">Acciones</span></span></div>
          ${rows.map((p) => `
          <div class="prow" role="row" data-id="${p.id}">
            <span role="cell" class="pname">${esc(p.name)}${drawnIds.has(p.id) ? ' <span class="tag">Sorteado</span>' : ''}${p.source ? ` <small class="mono">${esc(p.source)}</small>` : ''}</span>
            <span role="cell" class="pcontact"><span class="ptype">${CONTACT_TYPES[p.contact_type]?.label || ''}</span> <span class="mono">${esc(p.contact_value)}</span></span>
            <span role="cell" class="pdate mono">${fmt(p.created_at)}</span>
            <span role="cell"><label class="switch"><span class="sr">Contactado</span><input type="checkbox" data-contacted ${p.contacted ? 'checked' : ''}></label></span>
            <span role="cell" class="pactions">
              <a class="btn btn-sm btn-primary" href="${esc(contactLink(p.contact_type, p.contact_value, def?.contactMessage?.(firstName(p.name)) || ''))}" target="_blank" rel="noopener">Contactar</a>
              <button class="icon-btn" type="button" data-delete title="Eliminar inscripción" aria-label="Eliminar inscripción de ${esc(p.name)}">${icon.x}</button>
            </span>
          </div>`).join('')}
        </div>` : `<div class="empty">${ps.length ? 'Ningún participante coincide con el filtro.' : 'Todavía no hay inscriptos. Compartí el enlace del sorteo para empezar.'}</div>`}
      </section>

      <section class="admin-panel admin-danger">
        <div class="admin-panel-head"><h2>Borrar datos</h2></div>
        <p class="note">Cuando termine el sorteo y entregues el premio, borrá los datos de los participantes. No se puede deshacer: exportá la lista antes si la necesitás.</p>
        <div class="row-actions"><input id="ad-wipe" type="text" placeholder="Escribí ${esc(current)} para confirmar" autocomplete="off"><button class="btn" type="button" id="ad-wipe-btn">Borrar todos los participantes</button></div>
      </section>`;
    bind();
  }

  async function act(fn, okMsg) {
    try { await fn(); if (okMsg) toast(okMsg); await load(); } catch (ex) {
      if (ex.status === 401) loginView('Tu sesión venció. Volvé a ingresar.'); else toast(ex.message, 'error');
    }
  }

  function askConfirm(text, label, onYes) {
    const c = $('#ad-confirm', box);
    c.innerHTML = `<span>${esc(text)}</span><div class="row-actions"><button class="btn btn-primary btn-sm" type="button" data-yes>${esc(label)}</button><button class="btn btn-ghost btn-sm" type="button" data-no>Cancelar</button></div>`;
    c.hidden = false;
    $('[data-yes]', c).addEventListener('click', () => { c.hidden = true; onYes(); });
    $('[data-no]', c).addEventListener('click', () => { c.hidden = true; });
  }

  function bind() {
    $('#ad-promo', box)?.addEventListener('change', (e) => { current = e.target.value; storage.set('estratos:admin:promo', current); load(); });
    $('#ad-logout', box).addEventListener('click', () => act(() => api('/api/admin/login', { method: 'DELETE' })).then(() => loginView()));
    $('#ad-refresh', box).addEventListener('click', () => act(async () => {}, 'Lista actualizada'));
    $('#ad-search', box).addEventListener('input', (e) => { filter = e.target.value; const pos = e.target.selectionStart; render(); const s = $('#ad-search', box); s.focus(); s.setSelectionRange(pos, pos); });
    $('#ad-pending', box).addEventListener('change', (e) => { onlyPending = e.target.checked; render(); });
    $$('[data-action]', box).forEach((b) => b.addEventListener('click', () => {
      const action = b.dataset.action;
      const msgs = { abrir: 'Inscripción abierta', cerrar: 'Inscripción cerrada', automatico: 'La inscripción sigue las fechas configuradas', publicar: 'Ganador publicado en la página', 'ocultar-ganador': 'Ganador oculto' };
      if (action === 'publicar') {
        askConfirm('Se cierra la inscripción y la página pública muestra el nombre del ganador (nombre e inicial del apellido).', 'Publicar', () => act(() => api(`/api/admin/sorteos/${current}`, { method: 'POST', body: { action } }), msgs[action]));
        return;
      }
      act(() => api(`/api/admin/sorteos/${current}`, { method: 'POST', body: { action } }), msgs[action]);
    }));
    $('#ad-draw', box).addEventListener('click', () => {
      const first = !(data.draws || []).length;
      askConfirm(first ? 'Se elige un ganador al azar entre todos los inscriptos. Queda registrado con fecha y hora.' : 'Se elige un suplente al azar entre quienes todavía no salieron.', first ? 'Sortear ahora' : 'Sortear suplente',
        () => act(() => api(`/api/admin/sorteos/${current}/sortear`, { method: 'POST' }), first ? '¡Ganador sorteado!' : 'Suplente sorteado'));
    });
    $('#ad-undo', box)?.addEventListener('click', () => askConfirm('Se borra el último resultado del sorteo.', 'Deshacer', () => act(() => api(`/api/admin/sorteos/${current}/sortear`, { method: 'DELETE' }), 'Último sorteo deshecho')));
    $$('[data-contacted]', box).forEach((c) => c.addEventListener('change', (e) => {
      const id = e.target.closest('[data-id]').dataset.id;
      const p = data.participants.find((x) => String(x.id) === id);
      if (p) p.contacted = e.target.checked ? 1 : 0;
      api(`/api/admin/participantes/${id}`, { method: 'PATCH', body: { contacted: e.target.checked } }).then(() => render()).catch((ex) => { toast(ex.message, 'error'); load(); });
    }));
    $$('[data-delete]', box).forEach((b) => b.addEventListener('click', (e) => {
      const row = e.currentTarget.closest('[data-id]');
      if (row.classList.contains('confirming')) {
        act(() => api(`/api/admin/participantes/${row.dataset.id}`, { method: 'DELETE' }), 'Inscripción eliminada');
        return;
      }
      row.classList.add('confirming');
      e.currentTarget.innerHTML = '¿Eliminar?';
      e.currentTarget.classList.replace('icon-btn', 'btn');
      e.currentTarget.classList.add('btn-sm', 'btn-danger');
      setTimeout(() => { if (alive && row.isConnected) render(); }, 4000);
    }));
    $('#ad-wipe-btn', box).addEventListener('click', () => {
      const confirm = $('#ad-wipe', box).value.trim();
      act(() => api(`/api/admin/sorteos/${current}`, { method: 'POST', body: { action: 'borrar-datos', confirm } }), 'Datos de participantes borrados');
    });
  }

  load();
  const timer = setInterval(() => { if (data && !document.hidden && !box.querySelector(':focus')) load(); }, 60000);
  return () => { alive = false; clearInterval(timer); };
}
