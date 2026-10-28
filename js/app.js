// Ma Cave à Vin - interfejs (styl E: aubergine et or rose).
import * as db from './db.js';
import * as L from './logic.js';
import * as S from './sync.js';
import * as SC from './scans.js';

const APP_VERSION = '1.6.0';
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

const state = {
  wines: [],
  queueCount: 0,
  lastSync: null,
  syncing: false,
  syncError: null,
  needsLogin: false,
  cave: { q: '', inStock: true, color: '', tab: 'France', region: '', mat: '', sort: 'maturity', jump: '' },
  caveScroll: 0,
  add: null,
  retirer: { q: '', sel: null, n: 1 },
  edit: null,
  photoCache: new Map()
};

// ---------------------------------------------------------------- pomocnicze
const esc = (s) => String(s === null || s === undefined ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const $ = (sel) => app.querySelector(sel);
const $$ = (sel) => [...app.querySelectorAll(sel)];
const year = () => new Date().getFullYear();
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

const ICON = {
  back: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  gear: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/></svg>',
  search: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  bottle: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2h4v4l1.5 3A4 4 0 0 1 16 11v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9a4 4 0 0 1 .5-2L10 6z"/></svg>',
  chart: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7"/></svg>',
  plus: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  camera: '<svg aria-hidden="true" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#E4AE93" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  cameraSmall: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  gallery: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>',
  info: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E4AE93" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  check: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></svg>',
  cloudOff: '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 1l22 22M16.7 16.7A7 7 0 0 1 5 12M8.5 3.6A8 8 0 0 1 19 12M5 12a7 7 0 0 1 .9-3.4"/></svg>',
  clock: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  chevron: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>'
};

const BOTTLE_PATH = 'M7 0h4v14c0 3 6 6 6 13v38a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V27c0-7 6-10 6-13z';
function bottle(tint, w = 18, h = 48, withLabel = false) {
  const fill = tint || 'none';
  const stroke = tint ? '' : ' stroke="#4A3555" stroke-width="1.5"';
  const label = withLabel ? '<rect x="3" y="34" width="12" height="16" rx="1.5" fill="#F3EAF0" opacity="0.85"/>' : '';
  return `<svg aria-hidden="true" width="${w}" height="${h}" viewBox="0 0 18 68" style="flex:none"><path d="${BOTTLE_PATH}" fill="${fill}"${stroke}/>${label}</svg>`;
}
const FIELD_LABELS = {
  country: 'pays', region: 'région', subregion: 'sous-région', appellation: 'appellation', color: 'couleur',
  grapes: 'cépages', description_fr: 'description', drinking_window_start: 'début de fenêtre', drinking_window_end: 'fin de fenêtre'
};
const tintOf = (w) => (L.colorInfo(w) ? L.colorInfo(w).tint : L.UNKNOWN_TINT);

function topbar(title, backHref) {
  return `<div class="topbar"><a class="back" href="${backHref}" aria-label="Retour">${ICON.back}</a><h1 class="title">${esc(title)}</h1></div>`;
}

function statusBadge(w) {
  const s = L.str(w.status_fiche);
  if (s === 'À compléter' || s === 'À vérifier') return `<span class="badge">${esc(s)}</span>`;
  return '';
}

// ---------------------------------------------------------------- toast
let toastTimer = null;
function toast(message, actionLabel, action, ms = 6000) {
  clearTimeout(toastTimer);
  toastEl.innerHTML = `<span>${esc(message)}</span>${actionLabel ? `<button type="button">${esc(actionLabel)}</button>` : ''}`;
  toastEl.hidden = false;
  if (actionLabel) {
    toastEl.querySelector('button').onclick = () => {
      toastEl.hidden = true;
      action();
    };
  }
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

// ---------------------------------------------------------------- dane
async function load() {
  state.wines = await db.getAll('wines');
  state.queueCount = await db.count('queue');
  state.lastSync = await db.getMeta('lastSync');
}

const byId = (id) => state.wines.find((w) => w.id === id);

function emptyWine() {
  const w = {};
  L.COLUMNS.forEach((c) => { w[c] = ''; });
  return w;
}

async function createWine(fields, count, photoBlob) {
  const now = L.nowIso();
  const w = {
    ...emptyWine(),
    ...fields,
    id: crypto.randomUUID(),
    status_fiche: 'À compléter',
    created_at: now,
    updated_at: now,
    current_quantity: count,
    purchase_currency: fields.purchase_currency || 'EUR'
  };
  await db.put('wines', w);
  await db.enqueue({ op: 'create', id: w.id, wine: w });
  if (photoBlob) {
    await db.put('photos', { id: w.id, blob: photoBlob, uploaded: false });
    state.photoCache.delete(w.id);
    await db.enqueue({ op: 'photo', id: w.id });
  }
  await afterChange();
  return w;
}

async function updateWine(id, fields) {
  const w = byId(id);
  if (!w) return;
  const locks = L.lockedSet(w);
  Object.keys(fields).forEach((k) => { if (L.CLAUDE_EDITABLE.includes(k)) locks.add(k); });
  Object.assign(w, fields, { locked_fields: [...locks].join(', '), updated_at: L.nowIso() });
  await db.put('wines', w);
  await db.enqueue({ op: 'update', id, fields });
  await afterChange();
}

async function changeQty(id, delta) {
  const w = byId(id);
  if (!w || !delta) return null;
  const before = L.qty(w);
  const after = Math.max(0, before + delta);
  const real = after - before;
  if (!real) return null;
  w.current_quantity = after;
  await db.put('wines', w);
  const seq = await db.enqueue({ op: 'delta', id, delta: real });
  await afterChange();
  return { seq, real };
}

async function undoQty(id, change) {
  const w = byId(id);
  if (!w || !change) return;
  const last = await db.lastQueued();
  if (last && last.seq === change.seq) await db.del('queue', change.seq);
  else await db.enqueue({ op: 'delta', id, delta: -change.real });
  w.current_quantity = Math.max(0, L.qty(w) - change.real);
  await db.put('wines', w);
  await afterChange();
}

async function setPhoto(id, blob) {
  await db.put('photos', { id, blob, uploaded: false });
  const old = state.photoCache.get(id);
  if (old) URL.revokeObjectURL(old);
  state.photoCache.delete(id);
  await db.enqueue({ op: 'photo', id });
  await afterChange();
}

const missingPhotos = new Set();
// Zdjęcie z telefonu, a gdy go brak: pobrane raz z repozytorium (scans/) i zapisane w telefonie.
async function photoUrl(id, file) {
  if (state.photoCache.has(id)) return state.photoCache.get(id);
  let p = await db.get('photos', id);
  // Nowsze zdjęcie w repozytorium (inna nazwa pliku niż kopia w telefonie): pobierz je.
  const stale = p && p.blob && file && (p.file || `${id}.jpg`) !== file;
  if ((!p || !p.blob || stale) && file && !missingPhotos.has(file) && navigator.onLine) {
    const blob = await SC.fetchPhoto(file).catch(() => null);
    if (blob) {
      p = { id, blob, uploaded: true, scanned: true, file };
      await db.put('photos', p);
    } else if (navigator.onLine) missingPhotos.add(file);
  }
  if (!p || !p.blob) return null;
  const url = URL.createObjectURL(p.blob);
  state.photoCache.set(id, url);
  return url;
}

// Powiększenie etykiety: dotknięcie zamyka, przytrzymanie powiększa (i wraca), szczypanie, przesuwanie.
function openViewer(pages) {
  const ov = document.createElement('div');
  ov.className = 'viewer';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-label', 'Étiquette agrandie');
  ov.innerHTML = `<div class="viewer-bar">
      <div class="viewer-tabs">${pages.length > 1 ? pages.map((pg, i) => `<button type="button" class="tab" data-vpage="${i}" aria-selected="${i === 0}">${pg.label}</button>`).join('') : ''}</div>
      <button type="button" class="icon-btn" data-vclose aria-label="Fermer">×</button></div>
    <div class="viewer-stage"><img alt=""></div>`;
  document.body.appendChild(ov);
  const img = ov.querySelector('img');
  let z = 1, x = 0, y = 0;
  const pts = new Map();
  let start = null, press = null, gesture = null;
  const apply = () => { img.style.transform = `translate(${x}px, ${y}px) scale(${z})`; };
  const show = (i) => {
    img.src = pages[i].url; img.alt = pages[i].label; z = 1; x = 0; y = 0; apply();
    ov.querySelectorAll('[data-vpage]').forEach((b) => b.setAttribute('aria-selected', String(Number(b.dataset.vpage) === i)));
  };
  show(0);
  const stage = ov.querySelector('.viewer-stage');
  const snapshot = () => {
    const a = [...pts.values()];
    const c = a.length > 1 ? { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 } : a[0];
    const d = a.length > 1 ? Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) : 0;
    start = { c, d, z, x, y };
  };
  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    snapshot();
    if (pts.size === 1) {
      gesture = { x: e.clientX, y: e.clientY, moved: false, multi: false, long: false };
      clearTimeout(press);
      press = setTimeout(() => {
        if (!gesture || gesture.moved || gesture.multi) return;
        gesture.long = true;
        const r = stage.getBoundingClientRect();
        const cx = gesture.x - r.left - r.width / 2, cy = gesture.y - r.top - r.height / 2;
        if (z > 1) { z = 1; x = 0; y = 0; } else { z = 2.5; x = -cx * 1.5; y = -cy * 1.5; }
        img.style.transition = 'transform .2s';
        apply();
        setTimeout(() => { img.style.transition = ''; }, 220);
        if (navigator.vibrate) navigator.vibrate(10);
        snapshot();
      }, 450);
    } else if (gesture) { gesture.multi = true; clearTimeout(press); }
  });
  stage.addEventListener('contextmenu', (e) => e.preventDefault());
  stage.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (gesture && Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 10) { gesture.moved = true; clearTimeout(press); }
    const a = [...pts.values()];
    if (a.length > 1 && start.d) {
      const c = { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2 };
      const d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y);
      const r = stage.getBoundingClientRect();
      const nz = Math.min(6, Math.max(1, start.z * d / start.d));
      const ox = start.c.x - r.left - r.width / 2, oy = start.c.y - r.top - r.height / 2;
      x = ox - (ox - start.x) * nz / start.z + (c.x - start.c.x);
      y = oy - (oy - start.y) * nz / start.z + (c.y - start.c.y);
      z = nz;
    } else if (z > 1) {
      x = start.x + a[0].x - start.c.x; y = start.y + a[0].y - start.c.y;
    }
    apply();
  });
  const up = (e) => {
    pts.delete(e.pointerId);
    if (z <= 1.01) { z = 1; x = 0; y = 0; apply(); }
    if (pts.size) { snapshot(); return; }
    clearTimeout(press);
    const g = gesture;
    gesture = null;
    // Zwykłe dotknięcie (bez ruchu, szczypania i przytrzymania): zamknięcie podglądu.
    if (e.type === 'pointerup' && g && !g.moved && !g.multi && !g.long) history.back();
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  ov.querySelectorAll('[data-vpage]').forEach((b) => b.addEventListener('click', () => show(Number(b.dataset.vpage))));
  const close = () => { window.removeEventListener('popstate', onPop); ov.remove(); };
  const onPop = () => close();
  history.pushState({ viewer: true }, '');
  window.addEventListener('popstate', onPop);
  ov.querySelector('[data-vclose]').addEventListener('click', () => history.back());
  ov.querySelector('[data-vclose]').focus();
}

async function afterChange() {
  state.queueCount = await db.count('queue');
  scheduleSync();
  scheduleScans();
}

// Kopie etykiet dla Claude (prywatne repozytorium GitHub).
let scanTimer = null;
function scheduleScans() {
  clearTimeout(scanTimer);
  if (!SC.enabled() || !navigator.onLine) return;
  scanTimer = setTimeout(runScans, 1500);
}

async function runScans() {
  try {
    await SC.push();
    state.scanError = null;
  } catch (e) {
    state.scanError = e.message;
  }
  if (currentRoute().name === 'parametres') softRender();
}

// ---------------------------------------------------------------- synchronizacja
let syncTimer = null;
function scheduleSync() {
  clearTimeout(syncTimer);
  if (!S.configured() || !S.hasToken() || !navigator.onLine) return;
  syncTimer = setTimeout(() => runSync(false), 2500);
}

async function runSync(interactive) {
  if (!S.configured()) {
    location.hash = '#/parametres';
    return;
  }
  state.syncing = true;
  state.syncError = null;
  refreshStatus();
  try {
    await S.syncNow({ interactive });
    state.needsLogin = false;
    await load();
  } catch (e) {
    state.syncError = e.message || 'Erreur de synchronisation';
    if (e.code === 'auth') state.needsLogin = true;
    if (e.code === 'auth') state.syncError = 'Jeton GitHub refusé : vérifiez-le dans Paramètres.';
    state.queueCount = await db.count('queue');
  } finally {
    state.syncing = false;
    softRender();
  }
}

function syncPill() {
  if (!S.configured()) {
    return `<a class="sync-pill local" href="#/parametres">Mode local · synchronisation non configurée</a>`;
  }
  if (state.syncing) return `<span class="sync-pill local">Synchronisation…</span>`;
  if (state.queueCount > 0 || state.needsLogin || state.syncError) {
    const label = state.queueCount > 0
      ? `Non synchronisé · ${plural(state.queueCount, 'modification', 'modifications')}`
      : (state.needsLogin ? 'Touchez pour synchroniser' : 'Échec de la synchronisation');
    return `<button type="button" class="sync-pill" data-action="sync">${ICON.cloudOff}${esc(label)}</button>`;
  }
  if (state.lastSync) return `<span class="sync-pill ok">${ICON.check}Synchronisé</span>`;
  return `<button type="button" class="sync-pill" data-action="sync">Touchez pour synchroniser</button>`;
}

function refreshStatus() {
  const el = $('[data-slot="sync"]');
  if (el) el.innerHTML = syncPill();
}

// Ponowny rendering bez psucia pola, w którym użytkownik pisze.
function softRender() {
  const a = document.activeElement;
  if (a && app.contains(a) && ['INPUT', 'TEXTAREA', 'SELECT'].includes(a.tagName)) {
    refreshStatus();
    return;
  }
  render();
}

// ---------------------------------------------------------------- Accueil
function screenHome() {
  const st = L.stats(state.wines);
  const shelf = L.shelf(state.wines);
  const inStock = state.wines.filter((w) => L.qty(w) > 0);
  const todo = state.wines.filter((w) => ['À compléter', 'À vérifier'].includes(L.str(w.status_fiche))).length;
  const greet = new Date().getHours() < 18 ? 'Bonjour' : 'Bonsoir';
  return `
  <div class="screen">
    <header class="home-head">
      <div><p class="kicker">Ma Cave à Vin</p><h1 class="title-xl">${greet}</h1></div>
      <a class="icon-btn" href="#/parametres" aria-label="Paramètres">${ICON.gear}</a>
    </header>
    <div data-slot="sync">${syncPill()}</div>
    <section class="card" aria-label="Résumé de la cave">
      <div class="shelf" role="img" aria-label="Répartition des bouteilles par couleur">${shelf.map((b) => bottle(b.tint, 18, 68)).join('')}</div>
      <div class="shelf-total">
        <span><b>${st.bottles}</b> <span class="muted small">${st.bottles === 1 ? 'bouteille' : 'bouteilles'} · ${plural(st.wines, 'vin', 'vins')}</span></span>
        ${st.soon ? `<a class="small" href="#/bientot" style="color:var(--accent);font-weight:600;text-decoration:none">${st.soon} à ouvrir</a>` : ''}
      </div>
    </section>
    <form class="search" data-form="home-search" role="search">
      ${ICON.search}<label class="sr-only" for="home-q">Rechercher un vin</label>
      <input id="home-q" type="search" placeholder="Rechercher un vin, un producteur…" autocomplete="off">
    </form>
    <div class="grid2">
      <a class="tile" href="#/cave"><span style="color:var(--accent)">${ICON.bottle}</span>Ma cave</a>
      <a class="tile" href="#/stats"><span style="color:var(--accent)">${ICON.chart}</span>Statistiques</a>
      <a class="tile primary" href="#/ajouter">${ICON.plus}Ajouter un vin</a>
      <a class="tile" href="#/bientot"><span style="color:var(--accent);display:flex;justify-content:space-between;align-items:center">${ICON.clock}${st.soon ? `<b style="font-family:var(--serif);font-size:22px">${st.soon}</b>` : ''}</span>À ouvrir bientôt</a>
    </div>
    ${state.wines.length === 0 ? `
      <div class="empty"><p class="h2">Votre cave est vide</p><p class="small">Ajoutez votre premier vin, ou demandez à Claude d'importer vos notes.</p></div>` : ''}
    ${todo ? `<a class="banner" href="#/cave">${ICON.info}<span><strong>${plural(todo, 'fiche', 'fiches')} à compléter.</strong> Demandez à Claude : 'Mets à jour ma cave'.</span></a>` : ''}
  </div>`;
}

function bindHome() {
  const f = $('[data-form="home-search"]');
  f.addEventListener('submit', (e) => {
    e.preventDefault();
    state.cave.q = $('#home-q').value;
    location.hash = '#/cave';
  });
}

// ---------------------------------------------------------------- Ma cave
function wineRow(w, opts = {}) {
  const m = L.maturity(w);
  const score = L.fmtScore(w.personal_score);
  const tag = opts.button ? 'button type="button"' : `a href="#/vin/${encodeURIComponent(w.id)}"`;
  const close = opts.button ? 'button' : 'a';
  const extra = opts.button ? ` data-pick="${esc(w.id)}" aria-pressed="${opts.selected ? 'true' : 'false'}"` : '';
  return `<${tag} class="wrow${L.qty(w) === 0 ? ' zero' : ''}${opts.selected ? ' selected' : ''}"${extra}>
    ${bottle(tintOf(w))}
    <span class="body">
      <span class="name">${esc(L.displayName(w))}</span>
      <span class="sub">${esc([L.subtitle(w), L.sizeNote(w)].filter(Boolean).join(' · '))}</span>
      <span class="mat" ${m.score ? '' : 'style="color:var(--warn)"'}>${m.score ? `${m.score}/5 · ` : ''}${esc(m.label)}</span>
    </span>
    <span class="side">
      <span class="qty">${L.qty(w)}</span>
      ${statusBadge(w)}
      ${score && !statusBadge(w) ? `<span class="tiny muted">★ ${score}</span>` : ''}
    </span>
  </${close}>`;
}

function uniqueSorted(key) {
  return [...new Set(state.wines.map((w) => L.str(w[key])).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'fr'));
}

function filteredWines() {
  const c = state.cave;
  const list = state.wines.filter((w) => {
    if (c.inStock && L.qty(w) === 0) return false;
    if (c.color && L.str(w.color).toLowerCase() !== c.color) return false;
    if (c.region && L.str(w.region) !== c.region) return false;
    if (c.mat) {
      const m = L.maturity(w);
      const k = m.beyond ? 'beyond' : String(m.score);
      if (k !== c.mat) return false;
    }
    return L.matchesQuery(w, c.q);
  });
  return L.sortWines(list, c.sort);
}

const NO_COUNTRY = 'Pays à préciser';
const NO_REGION = 'Région à préciser';
const countryOf = (w) => L.str(w.country) || NO_COUNTRY;

// Zakładki krajów: Francja pierwsza, potem alfabetycznie, wina bez kraju na końcu.
function countryTabs(list) {
  const counts = new Map();
  list.forEach((w) => counts.set(countryOf(w), (counts.get(countryOf(w)) || 0) + L.qty(w)));
  const rank = (k) => (k === 'France' ? 0 : k === NO_COUNTRY ? 2 : 1);
  return [...counts.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0], 'fr'));
}

function selectChip(name, label, value, options) {
  return `<label class="sr-only" for="f-${name}">${label}</label>
    <select id="f-${name}" class="chip-select${value ? ' on' : ''}" data-filter="${name}">
      <option value="">${label}</option>
      ${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}
    </select>`;
}

function screenCave() {
  const c = state.cave;
  const sorts = [['maturity', 'Maturité'], ['vintage', 'Millésime'], ['score', 'Note'], ['appellation', 'Appellation'], ['producer', 'Producteur']];
  if (!sorts.some(([k]) => k === c.sort)) c.sort = 'maturity';
  const colors = Object.entries(L.COLORS).map(([k, v]) => [k, v.label]);
  const mats = [['beyond', 'Au-delà de la fenêtre'], ['5', '5/5 · Sans trop attendre'], ['4', '4/5 · À boire'], ['3', '3/5 · Approche'],
    ['2', '2/5 · À attendre'], ['1', '1/5 · Trop jeune'], ['0', 'À estimer']];
  return `
  <div class="screen">
    <div class="topbar"><a class="back" href="#/" aria-label="Retour à l'accueil">${ICON.back}</a><h1 class="title">Ma cave</h1></div>
    <div class="search" role="search">${ICON.search}<label class="sr-only" for="cave-q">Rechercher dans la cave</label>
      <input id="cave-q" type="search" placeholder="Nom, producteur, appellation…" value="${esc(c.q)}" autocomplete="off"></div>
    <div class="wrap" role="group" aria-label="Filtres">
      <button type="button" class="chip" data-action="instock" aria-pressed="${c.inStock}">En stock</button>
      ${selectChip('color', 'Couleur', c.color, colors)}
      ${selectChip('region', 'Région', c.region, uniqueSorted('region').map((x) => [x, x]))}
      ${selectChip('mat', 'Maturité', c.mat, mats)}
    </div>
    <div class="wrap" role="group" aria-labelledby="sort-l">
      <span class="sort-label" id="sort-l">Trier par</span>
      ${sorts.map(([k, l]) => `<button type="button" class="sort-btn" data-sort="${k}" aria-pressed="${c.sort === k}">${l}</button>`).join('')}
    </div>
    <div class="tabs" role="tablist" aria-label="Pays" data-slot="tabs"></div>
    <div class="list" data-slot="list"></div>
  </div>`;
}

function renderCaveList() {
  const list = filteredWines();
  const slot = $('[data-slot="list"]');
  if (!slot) return;
  if (!state.wines.length) {
    slot.innerHTML = `<div class="empty"><p class="h2">Votre cave est vide</p><p class="small"><a href="#/ajouter">Ajouter un vin</a></p></div>`;
  } else if (!list.length) {
    slot.innerHTML = `<div class="empty"><p class="small">Aucun vin ne correspond à ces critères.</p></div>`;
  } else {
    const tabs = countryTabs(list);
    if (!tabs.some(([k]) => k === state.cave.tab)) state.cave.tab = tabs[0][0];
    const tab = state.cave.tab;
    const tabSlot = $('[data-slot="tabs"]');
    if (tabSlot) {
      tabSlot.innerHTML = tabs.map(([k, n]) => `<button type="button" class="tab" role="tab" data-tab="${esc(k)}" aria-selected="${k === tab}">${esc(k)} <span class="n">${n}</span></button>`).join('');
    }
    const rows = list.filter((w) => countryOf(w) === tab);
    // Regroupement permanent par région ; le tri choisi s'applique dans chaque région.
    {
      const groups = new Map();
      rows.forEach((w) => {
        const r = L.str(w.region) || NO_REGION;
        if (!groups.has(r)) groups.set(r, []);
        groups.get(r).push(w);
      });
      const keys = [...groups.keys()].sort((a, b) => (a === NO_REGION) - (b === NO_REGION) || a.localeCompare(b, 'fr'));
      const bt = (ws) => ws.reduce((s, w) => s + L.qty(w), 0);
      slot.innerHTML = keys.map((k) => `<h2 class="group-h" data-region="${esc(k)}"><span>${esc(k)}</span><span class="n" aria-label="${plural(bt(groups.get(k)), 'bouteille', 'bouteilles')}">${bt(groups.get(k))}</span></h2>${groups.get(k).map((w) => wineRow(w)).join('')}`).join('');
    }
  }
  if (!list.length) { const t = $('[data-slot="tabs"]'); if (t) t.innerHTML = ''; }
}

function bindCave() {
  renderCaveList();
  $('#cave-q').addEventListener('input', (e) => { state.cave.q = e.target.value; renderCaveList(); });
  $('[data-slot="tabs"]').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    state.cave.tab = b.dataset.tab;
    renderCaveList();
    const t = $('[data-slot="tabs"]');
    if (t && t.getBoundingClientRect().top < 0) t.scrollIntoView();
  });
  $('[data-action="instock"]').addEventListener('click', () => { state.cave.inStock = !state.cave.inStock; render(); });
  $$('[data-filter]').forEach((s) => s.addEventListener('change', () => { state.cave[s.dataset.filter] = s.value; render(); }));
  $$('[data-sort]').forEach((b) => b.addEventListener('click', () => { state.cave.sort = b.dataset.sort; render(); }));
}

// ---------------------------------------------------------------- Fiche du vin
function screenFiche(id) {
  const w = byId(id);
  if (!w) return notFound();
  const m = L.maturity(w);
  const S0 = L.num(w.drinking_window_start);
  const E0 = L.num(w.drinking_window_end);
  let matBody = '<p class="small muted" style="margin:0">Fenêtre de dégustation pas encore estimée. Claude la complétera à la prochaine mise à jour.</p>';
  if (m.score) {
    const n = E0 - S0 + 1;
    const t = n <= 2 ? 0 : Math.round(n / 3);
    const w1 = n <= 2 ? 0 : (t / n) * 100;
    const w2 = n <= 2 ? (n === 2 ? 50 : 0) : (t / n) * 100;
    const y = Math.min(Math.max(year(), S0), E0 + 1);
    const pos = Math.min(100, ((y - S0 + 0.5) / (n + (year() > E0 ? 0.5 : 0))) * 100);
    matBody = `
      <div>
        <div class="matbar" aria-hidden="true">
          ${w1 ? `<span style="width:${w1}%;border-radius:5px 0 0 5px;background:#5A3F63"></span>` : ''}
          ${w2 ? `<span style="width:${w2}%;${w1 ? '' : 'border-radius:5px 0 0 5px;'}background:#A9768A"></span>` : ''}
          <span style="flex:1;border-radius:${w1 || w2 ? '0 5px 5px 0' : '5px'};background:#E4AE93"></span>
          <i class="marker" style="left:${pos}%"></i>
        </div>
        <div class="years" style="margin-top:6px"><span>${S0}</span><span style="color:var(--text);font-weight:600">${year()}</span><span>${E0}</span></div>
      </div>
      <p style="margin:0;font-size:14px">Fenêtre de dégustation : <strong>${S0}-${E0}</strong></p>
      ${w.maturity_confidence || w.maturity_basis ? `<p class="small muted" style="margin:0">${w.maturity_confidence ? `Fiabilité : ${esc(w.maturity_confidence)}` : ''}${w.maturity_confidence && w.maturity_basis ? ' · ' : ''}${w.maturity_basis ? `base : ${esc(w.maturity_basis)}` : ''}${w.maturity_reviewed_at ? ` · révisé le ${esc(String(w.maturity_reviewed_at).slice(0, 10))}` : ''}</p>` : ''}`;
  }
  const info = [
    ['Pays', w.country], ['Région', w.region], ['Sous-région', w.subregion], ['Appellation', w.appellation],
    ['Prix d\'achat', L.fmtPrice(w.purchase_price) ? `${L.fmtPrice(w.purchase_price)} ${esc(w.purchase_currency || 'EUR')} / bt` : ''],
    ['Prix du marché', L.num(w.market_price) ? `~${Math.round(L.num(w.market_price))} EUR / bt` : ''],
    ['Contenance', L.sizeNote(w)]
  ].filter(([, v]) => L.str(v));
  const producer = L.str(w.producer);
  const title = L.str(w.name) || producer || 'Vin à identifier';
  const showProducer = producer && producer !== title;
  const line3 = [L.colorInfo(w) ? L.colorInfo(w).label : '', L.str(w.grapes)].filter(Boolean).join(' · ');
  const score = L.fmtScore(w.personal_score);
  return `
  <div class="screen">
    <div class="topbar"><a class="back" href="${state.ficheBack || '#/cave'}" aria-label="Retour">${ICON.back}</a></div>
    <div class="hero">
      <div class="photo" data-slot="photo">${bottle(tintOf(w), 34, 112, true)}</div>
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        ${showProducer ? `<p class="producer">${esc(producer)}</p>` : ''}
        <h1 class="title" style="font-size:28px">${esc(title)}${L.vintageLabel(w) ? ` <span class="vint">${esc(L.vintageLabel(w))}</span>` : ''}</h1>
        ${line3 ? `<p style="margin:0;font-size:15px;color:var(--soft)">${esc(line3)}</p>` : ''}
      </div>
    </div>
    ${statusBadge(w) ? `<div class="banner warn">${ICON.info}<span><strong>${esc(w.status_fiche)}.</strong> ${esc(w.claude_note || 'Les informations seront complétées par Claude.')}</span></div>` : ''}
    <div class="card stock">
      <div style="flex:1"><span class="tiny muted">En cave</span><b>${plural(L.qty(w), 'bouteille', 'bouteilles')}</b></div>
      <button type="button" class="icon-btn" data-action="plus1" aria-label="Ajouter une bouteille" style="color:var(--accent)">${ICON.plus}</button>
      <a class="btn small-btn" href="#/retirer/${encodeURIComponent(w.id)}">Retirer</a>
    </div>
    <section class="card" aria-labelledby="info-h">
      <h2 class="h2" id="info-h">Informations</h2>
      ${info.length ? `<dl class="info">${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${k === 'Prix d\'achat' ? v : esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${L.num(w.market_price) && L.str(w.market_price_sources) ? `<p class="tiny muted" style="margin:-4px 0 0">Prix du marché : moyenne de ${esc(w.market_price_sources)}${L.str(w.market_price_date) ? `, ${esc(L.str(w.market_price_date).slice(0, 7))}` : ''}.</p>` : ''}
      ${L.str(w.description_fr) ? `<p class="desc">${esc(w.description_fr)}</p>` : ''}
    </section>
    <section class="card" aria-labelledby="avis-h">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h2 class="h2" id="avis-h">Mon avis</h2>
        ${score ? `<span style="font-family:var(--serif);font-size:24px;font-weight:600;color:var(--accent)">${score} <span class="small muted" style="font-family:var(--sans);font-weight:400">/ 5</span></span>` : ''}
      </div>
      ${L.str(w.personal_notes) ? `<p class="notes">${esc(w.personal_notes)}</p>` : `<p class="small muted" style="margin:0">Pas encore de note. <a href="#/vin/${encodeURIComponent(w.id)}/modifier">Ajouter mon avis</a></p>`}
    </section>
    <section class="card" aria-labelledby="mat-h">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <h2 class="h2" id="mat-h">Maturité</h2>
        <span class="pill${m.beyond ? ' warn' : m.score ? '' : ' dim'}">${m.score ? `${m.beyond ? '' : `${m.score}/5 · `}` : ''}${esc(m.label)}</span>
      </div>
      ${matBody}
    </section>
    <a class="btn-outline" href="#/vin/${encodeURIComponent(w.id)}/modifier">Modifier la fiche</a>
  </div>`;
}

async function bindFiche(id) {
  const w = byId(id);
  if (!w) return;
  const url = await photoUrl(id, L.str(w.photo_file));
  const slot = $('[data-slot="photo"]');
  if (url && slot) {
    slot.innerHTML = `<button type="button" class="photo-zoom" aria-label="Agrandir l'étiquette"><img src="${url}" alt="Étiquette de ${esc(L.displayName(w))}"></button>`;
    slot.querySelector('button').addEventListener('click', async () => {
      const pages = [{ label: 'Avant', url }];
      const back = await photoUrl(`${id}-dos`, `${id}-dos.jpg`);
      if (back) pages.push({ label: 'Arrière', url: back });
      openViewer(pages);
    });
  }
  $('[data-action="plus1"]').addEventListener('click', async () => {
    const ch = await changeQty(id, 1);
    render();
    if (ch) toast('1 bouteille ajoutée', 'Annuler', async () => { await undoQty(id, ch); render(); });
  });
}

// ---------------------------------------------------------------- formularz (Ajouter + Modifier)
function sizeOptions(value) {
  const v = L.num(value) || 750;
  return L.SIZES.map((s) => `<option value="${s.ml}"${s.ml === v ? ' selected' : ''}>${s.label}</option>`).join('');
}

function readForm(form) {
  const d = Object.fromEntries(new FormData(form).entries());
  d.is_nv = form.querySelector('[name="is_nv"]') && form.querySelector('[name="is_nv"]').checked ? 'oui' : '';
  return d;
}

function validate(d, hasPhoto = false) {
  const errs = [];
  if (!L.str(d.name) && !L.str(d.producer) && !hasPhoto) errs.push('Prenez une photo de l\'étiquette ou indiquez le nom du vin.');
  const v = L.num(d.vintage);
  if (L.str(d.vintage) && (v === null || v < 1800 || v > year() + 1)) errs.push('Millésime invalide.');
  const p = L.num(d.purchase_price);
  if (L.str(d.purchase_price) && (p === null || p < 0)) errs.push('Prix d\'achat invalide.');
  if ('personal_score' in d && L.str(d.personal_score)) {
    const s = L.num(d.personal_score);
    if (s === null || s < 1 || s > 5) errs.push('La note doit être entre 1,0 et 5,0.');
  }
  ['drinking_window_start', 'drinking_window_end'].forEach((k) => {
    if (k in d && L.str(d[k])) {
      const y = L.num(d[k]);
      if (y === null || y < 1800 || y > 2200) errs.push('Année de fenêtre invalide.');
    }
  });
  if (L.str(d.drinking_window_start) && L.str(d.drinking_window_end) && L.num(d.drinking_window_end) < L.num(d.drinking_window_start)) {
    errs.push('La fin de la fenêtre précède son début.');
  }
  return errs;
}

function cleanFields(d, keys) {
  const out = {};
  keys.forEach((k) => {
    if (!(k in d)) return;
    let v = L.str(d[k]);
    if (L.NUMERIC_FIELDS.includes(k)) {
      const n = L.num(v);
      v = n === null ? '' : (k === 'personal_score' ? Math.round(n * 10) / 10 : n);
    }
    if (k === 'is_nv') v = d.is_nv === 'oui' ? 'oui' : '';
    out[k] = v;
  });
  if (out.is_nv === 'oui') out.vintage = '';
  return out;
}

// Zdjęcie etykiety: aparat albo galeria telefonu.
function photoPicker(previewHtml, hasPhoto, multiple = false) {
  return `<div class="camera">
    ${previewHtml}
    <div class="photo-actions">
      <label class="btn-outline small-btn">
        <input type="file" accept="image/*" capture="environment" data-photo="camera" class="sr-only">
        ${ICON.cameraSmall}${hasPhoto ? 'Reprendre' : 'Appareil photo'}
      </label>
      <label class="btn-outline small-btn">
        <input type="file" accept="image/*" data-photo="gallery" class="sr-only"${multiple ? ' multiple' : ''}>
        ${ICON.gallery}Galerie
      </label>
    </div>
  </div>`;
}

function bindPhotoPicker(form, onFile, onMany) {
  form.querySelectorAll('[data-photo]').forEach((input) => input.addEventListener('change', (e) => {
    const files = e.target.files ? [...e.target.files] : [];
    if (files.length > 1 && onMany) onMany(files);
    else if (files[0]) onFile(files[0]);
    e.target.value = '';
  }));
}

async function compressImage(file, max = 1200, quality = 0.72) {
  let source;
  try {
    // Duże zdjęcia (50-200 MP): zmniejszenie już przy dekodowaniu, żeby nie zabrakło pamięci.
    source = max > 1200
      ? await createImageBitmap(file, { imageOrientation: 'from-image', resizeWidth: max, resizeQuality: 'high' })
      : await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    source = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  const sw = source.width;
  const sh = source.height;
  const k = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * k);
  canvas.height = Math.round(sh * k);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', quality));
}

// ---------------------------------------------------------------- Inventaire par photos (import/)
function importName(file) {
  const base = String(file.name || 'photo').replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]+/g, '_') || 'photo';
  return `${base}.jpg`;
}

function screenImport() {
  const im = state.imp;
  const ready = SC.enabled();
  const progress = im ? `<div class="card" role="status">
      <p style="margin:0"><strong>${im.done + im.skipped} / ${im.total}</strong> ${im.running ? 'envoi en cours…' : 'terminé'}</p>
      <div class="bar"><span style="width:${im.total ? Math.round(100 * (im.done + im.skipped) / im.total) : 0}%"></span></div>
      ${im.skipped ? `<p class="small muted" style="margin:0">${plural(im.skipped, 'photo déjà envoyée, ignorée', 'photos déjà envoyées, ignorées')}.</p>` : ''}
      ${im.failed.length ? `<p class="small" style="margin:0;color:var(--warn)">${plural(im.failed.length, 'échec', 'échecs')} : ${esc(im.failed.slice(0, 5).join(', '))}${im.failed.length > 5 ? '…' : ''}. Choisissez-les à nouveau.</p>` : ''}
      ${!im.running && !im.failed.length ? `<p class="small" style="margin:0">Demandez maintenant à Claude : 'Importe les photos'.</p>` : ''}
      ${im.running ? `<p class="tiny muted" style="margin:0">Gardez l'application ouverte jusqu'à la fin.</p>` : ''}
    </div>` : '';
  return `
  <div class="screen">
    ${topbar('Inventaire par photos', '#/ajouter')}
    <p class="small muted" style="margin:0">Pour Claude : photos de 3 à 5 bouteilles, d'abord l'avant puis l'arrière du même groupe. Les photos sont réduites puis envoyées dans le dossier import du dépôt. Claude crée les fiches.</p>
    ${ready ? `<label class="btn" style="cursor:pointer"${im && im.running ? ' aria-disabled="true"' : ''}>
        <input type="file" accept="image/*" multiple data-import class="sr-only"${im && im.running ? ' disabled' : ''}>${ICON.gallery}&nbsp;Choisir les photos</label>`
      : `<div class="banner">${ICON.info}<span>Configurez d'abord la synchronisation GitHub dans <a href="#/parametres">Paramètres</a>.</span></div>`}
    ${progress}
  </div>`;
}

function bindImport() {
  const input = $('[data-import]');
  if (!input) return;
  input.addEventListener('change', async (e) => {
    const files = [...e.target.files].sort((a, b) => importName(a).localeCompare(importName(b)));
    if (!files.length) return;
    state.imp = { total: files.length, done: 0, skipped: 0, failed: [], running: true };
    render();
    for (const f of files) {
      const name = importName(f);
      try {
        // Zwykłe zdjęcia JPEG (kilka MB) idą w oryginale; tylko bardzo duże są zmniejszane.
        const blob = /jpe?g/i.test(f.type) && f.size < 15e6 ? f : await compressImage(f, 3000, 0.86);
        const r = await SC.uploadImport(name, blob);
        if (r === 'exists') state.imp.skipped += 1; else state.imp.done += 1;
      } catch (err) {
        state.imp.failed.push(name);
        if (err && err.code === 'auth') { toast('Jeton GitHub refusé'); break; }
      }
      if (currentRoute().name === 'import') render();
    }
    state.imp.running = false;
    if (currentRoute().name === 'import') render();
    else toast(`Inventaire : ${plural(state.imp.done, 'photo envoyée', 'photos envoyées')}`);
  });
}

// ---------------------------------------------------------------- Ajouter un vin
function newDraft() {
  return { d: { name: '', producer: '', vintage: '', is_nv: '', bottle_size_ml: '750', purchase_price: '' }, count: 1, photo: null, photoUrl: null, dup: null, errors: [] };
}

function screenAjouter() {
  if (!state.add) state.add = newDraft();
  const a = state.add;
  const d = a.d;
  return `
  <div class="screen">
    ${topbar('Ajouter un vin', '#/')}
    <a class="banner" href="#/lot">${ICON.gallery}<span style="flex:1"><strong>Plusieurs vins à la fois</strong><br><span class="small">Choisir plusieurs photos ou photographier en série</span></span>${ICON.chevron}</a>
    <a class="banner" href="#/import">${ICON.gallery}<span style="flex:1"><strong>Inventaire par photos</strong><br><span class="small">Groupes de bouteilles, avant et arrière, pour Claude</span></span>${ICON.chevron}</a>
    <form data-form="add" novalidate style="display:flex;flex-direction:column;gap:16px">
      ${photoPicker(a.photoUrl ? `<img src="${a.photoUrl}" alt="Aperçu de l'étiquette">` : `${ICON.camera}
          <span style="font-size:16px;font-weight:600">Photo de l'étiquette</span>
          <span style="font-family:var(--serif);font-style:italic;font-size:14px;color:var(--muted)">face avant uniquement</span>`, Boolean(a.photoUrl), true)}
      <div class="field"><label for="a-name">Nom du vin</label>
        <input class="input" id="a-name" name="name" type="text" placeholder="Ex. Château La Pierre" value="${esc(d.name)}" autocomplete="off"></div>
      <div class="field"><label for="a-prod">Producteur</label>
        <input class="input" id="a-prod" name="producer" type="text" placeholder="Domaine, château, maison" value="${esc(d.producer)}" autocomplete="off"></div>
      <div class="grid2" style="gap:12px">
        <div class="field"><label for="a-vint">Millésime</label>
          <input class="input" id="a-vint" name="vintage" type="text" inputmode="numeric" placeholder="2019" value="${esc(d.vintage)}"${d.is_nv === 'oui' ? ' disabled' : ''}></div>
        <div class="field"><label for="a-size">Contenance</label>
          <select id="a-size" name="bottle_size_ml">${sizeOptions(d.bottle_size_ml)}</select></div>
      </div>
      <label class="check"><input type="checkbox" name="is_nv"${d.is_nv === 'oui' ? ' checked' : ''}> Non millésimé (NV)</label>
      <div class="grid2" style="gap:12px;align-items:end">
        <div class="field"><span class="label" id="a-nb">Bouteilles</span>
          <div class="stepper" role="group" aria-labelledby="a-nb">
            <button type="button" data-step="-1" aria-label="Une bouteille de moins"${a.count <= 1 ? ' disabled' : ''}>−</button>
            <output aria-live="polite">${a.count}</output>
            <button type="button" data-step="1" aria-label="Une bouteille de plus">+</button>
          </div></div>
        <div class="field"><label for="a-price">Prix d'achat (facultatif)</label>
          <input class="input" id="a-price" name="purchase_price" type="text" inputmode="decimal" placeholder="€ / bouteille" value="${esc(d.purchase_price)}"></div>
      </div>
      ${a.errors.length ? `<p class="form-error" role="alert">${a.errors.map(esc).join(' ')}</p>` : ''}
      ${a.dup ? dupCard(a.dup) : `
      <div class="note-box">${ICON.info}<span>Une photo de l'étiquette suffit : Claude lira le nom, le producteur et le millésime, puis complétera la fiche. Dans la galerie, vous pouvez choisir plusieurs photos : une fiche par photo.</span></div>
      <button type="submit" class="btn">Enregistrer</button>`}
    </form>
  </div>`;
}

function dupCard(w) {
  return `<div class="card" role="alert" style="box-shadow:inset 0 0 0 2px var(--accent)">
    <p style="margin:0"><strong>Ce vin existe déjà</strong> dans votre cave (${plural(L.qty(w), 'bouteille', 'bouteilles')}).</p>
    <p class="small muted" style="margin:0">${esc([L.displayName(w), L.subtitle(w), L.sizeNote(w)].filter(Boolean).join(' · '))}</p>
    <button type="button" class="btn" data-action="dup-add">Ajouter ${plural(state.add.count, 'bouteille', 'bouteilles')} au stock</button>
    <button type="button" class="btn-outline" data-action="dup-new">Créer une nouvelle fiche</button>
  </div>`;
}

function bindAjouter() {
  const form = $('[data-form="add"]');
  const keep = () => { state.add.d = { ...state.add.d, ...readForm(form) }; };
  bindPhotoPicker(form, async (file) => {
    keep();
    const blob = await compressImage(file);
    if (state.add.photoUrl) URL.revokeObjectURL(state.add.photoUrl);
    state.add.photo = blob;
    state.add.photoUrl = URL.createObjectURL(blob);
    render();
  }, async (files) => {
    // Plusieurs photos : une fiche par photo, via l'écran d'ajout par lot.
    await lotLoad();
    const a = state.add;
    if (a && a.photo) lot.items.push({ key: crypto.randomUUID(), blob: a.photo, count: a.count || 1 });
    if (a && a.photoUrl) URL.revokeObjectURL(a.photoUrl);
    state.add = null;
    await lotSave();
    location.hash = '#/lot';
    addLotFiles(files);
  });
  form.querySelector('[name="is_nv"]').addEventListener('change', () => { keep(); render(); });
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
    keep();
    state.add.count = Math.max(1, state.add.count + Number(b.dataset.step));
    render();
  }));
  form.addEventListener('input', () => { if (state.add.dup) { keep(); state.add.dup = null; render(); } });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    keep();
    await saveNew(false);
  });
  const dupAdd = $('[data-action="dup-add"]');
  if (dupAdd) {
    dupAdd.addEventListener('click', async () => {
      const w = state.add.dup;
      const n = state.add.count;
      const photo = state.add.photo;
      await changeQty(w.id, n);
      if (photo) await setPhoto(w.id, photo);
      state.add = null;
      toast(`${plural(n, 'bouteille ajoutée', 'bouteilles ajoutées')} au stock`);
      location.hash = '#/';
    });
    $('[data-action="dup-new"]').addEventListener('click', () => saveNew(true));
  }
}

// ---------------------------------------------------------------- Ajout par lot
// Lista zdjęć jest zapisywana w bazie telefonu: przetrwa zamknięcie aplikacji przez system podczas robienia zdjęć.
const lot = { items: null, urls: new Map(), busy: 0 };

async function lotLoad() {
  if (!lot.items) lot.items = (await db.getMeta('lot')) || [];
}

async function lotSave() {
  await db.setMeta('lot', lot.items);
}

function lotUrl(item) {
  if (!lot.urls.has(item.key)) lot.urls.set(item.key, URL.createObjectURL(item.blob));
  return lot.urls.get(item.key);
}

function lotClearUrls() {
  lot.urls.forEach((u) => URL.revokeObjectURL(u));
  lot.urls.clear();
}

function screenLot() {
  return `
  <div class="screen">
    ${topbar('Plusieurs vins', '#/ajouter')}
    <p class="small muted" style="margin:0">Une photo par vin. Claude lira les étiquettes et complétera les fiches. Si deux photos montrent le même vin, il les fusionnera.</p>
    <div class="grid2">
      <label class="btn-outline" style="cursor:pointer;white-space:nowrap;padding:0 12px">
        <input type="file" accept="image/*" multiple data-lot="gallery" class="sr-only">${ICON.gallery}Galerie
      </label>
      <label class="btn-outline" style="cursor:pointer;white-space:nowrap;padding:0 12px">
        <input type="file" accept="image/*" capture="environment" data-lot="camera" class="sr-only">${ICON.cameraSmall}<span data-slot="cam-label">Appareil photo</span>
      </label>
    </div>
    <div data-slot="lot-busy"></div>
    <div class="list" data-slot="lot-list"></div>
    <div data-slot="lot-save"></div>
  </div>`;
}

function renderLotParts() {
  const items = lot.items || [];
  const busy = $('[data-slot="lot-busy"]');
  if (busy) busy.innerHTML = lot.busy ? `<p class="small muted" style="margin:0" role="status">Préparation de ${plural(lot.busy, 'photo', 'photos')}…</p>` : '';
  const cam = $('[data-slot="cam-label"]');
  if (cam) cam.textContent = items.length ? 'Photo suivante' : 'Appareil photo';
  const list = $('[data-slot="lot-list"]');
  if (!list) return;
  list.innerHTML = items.length ? items.map((it, i) => `
    <div class="wrow" style="align-items:center">
      <img src="${lotUrl(it)}" alt="Étiquette ${i + 1}" style="width:52px;height:68px;object-fit:cover;border-radius:10px;flex:none">
      <span class="body"><span class="name">Vin ${i + 1}</span></span>
      <span class="stepper round" role="group" aria-label="Bouteilles, vin ${i + 1}" style="flex:none">
        <button type="button" data-lstep="-1" data-i="${i}" aria-label="Une de moins"${it.count <= 1 ? ' disabled' : ''}>−</button>
        <output>${it.count}</output>
        <button type="button" data-lstep="1" data-i="${i}" aria-label="Une de plus">+</button>
      </span>
      <button type="button" class="icon-btn" data-ldel="${i}" aria-label="Retirer la photo ${i + 1}" style="width:36px;height:36px">×</button>
    </div>`).join('')
    : `<div class="empty"><p class="small">Aucune photo pour l'instant.</p></div>`;
  const total = items.reduce((s, it) => s + it.count, 0);
  $('[data-slot="lot-save"]').innerHTML = items.length ? `
    <button type="button" class="btn" data-action="lot-save" style="width:100%"${lot.busy ? ' disabled' : ''}>Enregistrer ${plural(items.length, 'vin', 'vins')} · ${plural(total, 'bouteille', 'bouteilles')}</button>
    <button type="button" class="btn-ghost" data-action="lot-clear" style="width:100%;justify-content:center;margin-top:10px">Tout effacer</button>` : '';
  $$('[data-lstep]').forEach((b) => b.addEventListener('click', async () => {
    const it = lot.items[Number(b.dataset.i)];
    it.count = Math.max(1, it.count + Number(b.dataset.lstep));
    await lotSave();
    renderLotParts();
  }));
  $$('[data-ldel]').forEach((b) => b.addEventListener('click', async () => {
    const [it] = lot.items.splice(Number(b.dataset.ldel), 1);
    if (lot.urls.has(it.key)) { URL.revokeObjectURL(lot.urls.get(it.key)); lot.urls.delete(it.key); }
    await lotSave();
    renderLotParts();
  }));
  const save = $('[data-action="lot-save"]');
  if (save) save.addEventListener('click', saveLot);
  const clear = $('[data-action="lot-clear"]');
  if (clear) clear.addEventListener('click', async () => {
    lot.items = [];
    lotClearUrls();
    await lotSave();
    renderLotParts();
  });
}

async function addLotFiles(files) {
  const list = [...files];
  lot.busy += list.length;
  renderLotParts();
  for (const f of list) {
    try {
      const blob = await compressImage(f);
      lot.items.push({ key: crypto.randomUUID(), blob, count: 1 });
      await lotSave();
    } catch (e) {
      toast('Une photo n\'a pas pu être lue.');
    }
    lot.busy -= 1;
    if (currentRoute().name === 'lot') renderLotParts();
  }
}

async function bindLot() {
  await lotLoad();
  if (currentRoute().name !== 'lot') return;
  renderLotParts();
  $$('[data-lot]').forEach((input) => input.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files && files.length) addLotFiles(files);
    e.target.value = '';
  }));
}

async function saveLot() {
  const items = lot.items.slice();
  if (!items.length || lot.busy) return;
  const btn = $('[data-action="lot-save"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Enregistrement…'; }
  for (const it of items) {
    await createWine(cleanFields({ bottle_size_ml: '750' }, ['bottle_size_ml']), it.count, it.blob);
  }
  state.wines = await db.getAll('wines');
  lot.items = [];
  lotClearUrls();
  await lotSave();
  toast(`${plural(items.length, 'vin ajouté', 'vins ajoutés')}. Demandez à Claude : 'Mets à jour ma cave'.`, null, null, 8000);
  location.hash = '#/';
}

async function saveNew(force) {
  const a = state.add;
  const fields = cleanFields(a.d, ['name', 'producer', 'vintage', 'is_nv', 'bottle_size_ml', 'purchase_price']);
  a.errors = validate(a.d, Boolean(a.photo));
  if (a.errors.length) { render(); return; }
  if (!force && (L.str(fields.name) || L.str(fields.producer))) {
    const key = L.duplicateKey(fields);
    const dup = state.wines.find((w) => L.duplicateKey(w) === key);
    if (dup) { a.dup = dup; render(); return; }
  }
  const w = await createWine(fields, a.count, a.photo);
  state.wines = await db.getAll('wines');
  if (a.photoUrl) URL.revokeObjectURL(a.photoUrl);
  state.add = null;
  toast(`${L.displayName(w)} ajouté. Claude complétera la fiche.`);
  location.hash = '#/';
}

// ---------------------------------------------------------------- Modifier
function screenEdit(id) {
  const w = byId(id);
  if (!w) return notFound();
  if (!state.edit || state.edit.id !== id) state.edit = { id, d: { ...w }, qty: L.qty(w), photo: null, photoUrl: null, errors: [] };
  const e = state.edit;
  const d = e.d;
  const field = (name, label, opts = {}) => `<div class="field${opts.full ? '' : ''}"><label for="e-${name}">${label}</label>
    <input class="input" id="e-${name}" name="${name}" type="text"${opts.mode ? ` inputmode="${opts.mode}"` : ''} value="${esc(d[name])}"${opts.ph ? ` placeholder="${esc(opts.ph)}"` : ''} autocomplete="off"></div>`;
  return `
  <div class="screen">
    ${topbar('Modifier', `#/vin/${encodeURIComponent(id)}`)}
    <form data-form="edit" novalidate style="display:flex;flex-direction:column;gap:14px">
      ${photoPicker(e.photoUrl ? `<img src="${e.photoUrl}" alt="Nouvelle photo">` : `${ICON.camera}<span class="small">Changer la photo de l'étiquette</span>`, Boolean(e.photoUrl))}
      ${field('name', 'Nom du vin')}
      ${field('producer', 'Producteur')}
      <div class="grid2" style="gap:12px">
        ${field('vintage', 'Millésime', { mode: 'numeric' })}
        <div class="field"><label for="e-size">Contenance</label><select id="e-size" name="bottle_size_ml">${sizeOptions(d.bottle_size_ml)}</select></div>
      </div>
      <label class="check"><input type="checkbox" name="is_nv"${L.isNV(d) ? ' checked' : ''}> Non millésimé (NV)</label>
      <div class="field"><span class="label" id="e-nb">Bouteilles en cave</span>
        <div class="stepper" role="group" aria-labelledby="e-nb">
          <button type="button" data-step="-1" aria-label="Une de moins"${e.qty <= 0 ? ' disabled' : ''}>−</button>
          <output aria-live="polite">${e.qty}</output>
          <button type="button" data-step="1" aria-label="Une de plus">+</button>
        </div></div>
      <div class="grid2" style="gap:12px">
        ${field('purchase_price', 'Prix d\'achat / bt', { mode: 'decimal' })}
        ${field('purchase_currency', 'Devise')}
      </div>
      ${field('personal_score', 'Ma note (1,0 à 5,0)', { mode: 'decimal', ph: '4,2' })}
      <div class="field"><label for="e-notes">Mes notes</label><textarea id="e-notes" name="personal_notes">${esc(d.personal_notes)}</textarea></div>
      <p class="section-label">Complété par Claude</p>
      <p class="tiny muted" style="margin:-8px 0 0">Un champ modifié ici est verrouillé : Claude ne le changera plus.</p>
      <div class="grid2" style="gap:12px">${field('country', 'Pays')}${field('region', 'Région')}</div>
      <div class="grid2" style="gap:12px">${field('subregion', 'Sous-région')}${field('appellation', 'Appellation')}</div>
      <div class="field"><label for="e-color">Couleur</label><select id="e-color" name="color">
        <option value="">Non renseignée</option>
        ${Object.entries(L.COLORS).map(([k, v]) => `<option value="${k}"${L.str(d.color).toLowerCase() === k ? ' selected' : ''}>${v.label}</option>`).join('')}
      </select></div>
      ${field('grapes', 'Cépages')}
      <div class="grid2" style="gap:12px">${field('drinking_window_start', 'Fenêtre : début', { mode: 'numeric' })}${field('drinking_window_end', 'Fenêtre : fin', { mode: 'numeric' })}</div>
      <div class="field"><label for="e-desc">Description</label><textarea id="e-desc" name="description_fr">${esc(d.description_fr)}</textarea></div>
      ${e.errors.length ? `<p class="form-error" role="alert">${e.errors.map(esc).join(' ')}</p>` : ''}
      <button type="submit" class="btn">Enregistrer</button>
    </form>
  </div>`;
}

function bindEdit(id) {
  const form = $('[data-form="edit"]');
  const keep = () => { state.edit.d = { ...state.edit.d, ...readForm(form) }; };
  bindPhotoPicker(form, async (file) => {
    keep();
    state.edit.photo = await compressImage(file);
    state.edit.photoUrl = URL.createObjectURL(state.edit.photo);
    render();
  });
  $$('[data-step]').forEach((b) => b.addEventListener('click', () => {
    keep();
    state.edit.qty = Math.max(0, state.edit.qty + Number(b.dataset.step));
    render();
  }));
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    keep();
    const e = state.edit;
    e.errors = validate(e.d, true);
    if (e.errors.length) { render(); return; }
    const w = byId(id);
    const keys = [...L.USER_FIELDS, ...L.CLAUDE_EDITABLE];
    const clean = cleanFields(e.d, keys);
    const changed = {};
    keys.forEach((k) => {
      if (!(k in clean)) return;
      if (String(clean[k]) !== String(L.NUMERIC_FIELDS.includes(k) ? (L.num(w[k]) === null ? '' : L.num(w[k])) : L.str(w[k]))) changed[k] = clean[k];
    });
    if (Object.keys(changed).length) await updateWine(id, changed);
    const diff = e.qty - L.qty(w);
    if (diff) await changeQty(id, diff);
    if (e.photo) await setPhoto(id, e.photo);
    state.edit = null;
    toast('Fiche enregistrée');
    location.hash = `#/vin/${encodeURIComponent(id)}`;
  });
}

// ---------------------------------------------------------------- Retirer du stock
function screenRetirer(preId) {
  const r = state.retirer;
  if (preId && byId(preId) && r.sel !== preId) { r.sel = preId; r.n = 1; }
  return `
  <div class="screen">
    ${topbar('Retirer du stock', '#/')}
    <div data-slot="sync">${state.queueCount ? syncPill() : ''}</div>
    <div class="search" role="search">${ICON.search}<label class="sr-only" for="r-q">Chercher le vin à retirer</label>
      <input id="r-q" type="search" placeholder="Nom, producteur, millésime…" value="${esc(r.q)}" autocomplete="off"></div>
    <div class="list" data-slot="results"></div>
    <div data-slot="panel"></div>
  </div>`;
}

function renderRetirerParts() {
  const r = state.retirer;
  const inStock = state.wines.filter((w) => L.qty(w) > 0);
  let results = L.sortWines(inStock.filter((w) => L.matchesQuery(w, r.q)), 'maturity');
  if (r.sel && !results.find((w) => w.id === r.sel) && byId(r.sel)) results = [byId(r.sel), ...results];
  results = results.slice(0, r.q ? 8 : 4);
  const rs = $('[data-slot="results"]');
  if (!inStock.length && !r.sel) {
    rs.innerHTML = `<div class="empty"><p class="small">Aucune bouteille en stock.</p></div>`;
  } else {
    rs.innerHTML = results.map((w) => wineRow(w, { button: true, selected: w.id === r.sel })).join('')
      || `<div class="empty"><p class="small">Aucun vin trouvé.</p></div>`;
    $$('[data-pick]').forEach((b) => b.addEventListener('click', () => {
      r.sel = b.dataset.pick;
      r.n = 1;
      renderRetirerParts();
    }));
  }
  const panel = $('[data-slot="panel"]');
  const w = r.sel ? byId(r.sel) : null;
  if (!w) { panel.innerHTML = ''; return; }
  const stock = L.qty(w);
  r.n = Math.min(Math.max(1, r.n), Math.max(1, stock));
  panel.innerHTML = `
    <div class="card" style="gap:14px">
      <div class="kv"><span>En cave</span><span style="font-weight:600">${plural(stock, 'bouteille', 'bouteilles')}</span></div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <span id="r-nb" style="font-family:var(--serif);font-size:18px;font-weight:600">À retirer</span>
        <div class="stepper round" role="group" aria-labelledby="r-nb">
          <button type="button" data-rstep="-1" aria-label="Une de moins"${r.n <= 1 ? ' disabled' : ''}>−</button>
          <output aria-live="polite">${stock ? r.n : 0}</output>
          <button type="button" data-rstep="1" aria-label="Une de plus"${r.n >= stock ? ' disabled' : ''}>+</button>
        </div>
      </div>
      <div class="kv" style="padding-top:12px;border-top:1px solid var(--line)"><span>Restera</span><span style="font-weight:600">${plural(Math.max(0, stock - r.n), 'bouteille', 'bouteilles')}</span></div>
    </div>
    <button type="button" class="btn" data-action="confirm" style="width:100%;margin-top:16px"${stock ? '' : ' disabled'}>${stock ? `Retirer ${plural(r.n, 'bouteille', 'bouteilles')}` : 'Plus de bouteilles en stock'}</button>`;
  $$('[data-rstep]').forEach((b) => b.addEventListener('click', () => { r.n += Number(b.dataset.rstep); renderRetirerParts(); }));
  $('[data-action="confirm"]').addEventListener('click', async () => {
    const id = w.id;
    const ch = await changeQty(id, -r.n);
    r.n = 1;
    renderRetirerParts();
    refreshStatus();
    if (ch) {
      const left = L.qty(byId(id));
      toast(`${plural(-ch.real, 'bouteille retirée', 'bouteilles retirées')} · ${left} en cave`, 'Annuler', async () => {
        await undoQty(id, ch);
        if (currentRoute().name === 'retirer') { renderRetirerParts(); refreshStatus(); }
      });
    }
  });
}

function bindRetirer() {
  renderRetirerParts();
  $('#r-q').addEventListener('input', (e) => { state.retirer.q = e.target.value; renderRetirerParts(); });
}

// ---------------------------------------------------------------- Statistiques
function bars(rows, colorFn, linkFn) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows.map((r, i) => {
    const link = linkFn ? linkFn(r) : null;
    const open = link ? `a class="bar-row" href="#/cave" data-jump-country="${esc(link.country)}" data-jump-region="${esc(link.region || '')}"` : 'div class="bar-row"';
    return `<${open}><span>${esc(r.label)}</span>
    <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="display:block;width:${Math.round((r.n / max) * 100)}%;background:${colorFn(r)}"></span></span><b>${r.n}</b></${link ? 'a' : 'div'}>`;
  }).join('');
}

// Procenty sumujące się do 100 (metoda największej reszty).
function percents(values) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const raw = values.map((v) => (v / total) * 100);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((v, i) => [v - out[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i] += 1; left -= 1; } });
  return out;
}

function donut(rows) {
  const pct = percents(rows.map((r) => r.n));
  const total = rows.reduce((a, r) => a + r.n, 0) || 1;
  const R = 15.915; // obwód 100
  let off = 25;
  const gap = rows.length > 1 ? 0.8 : 0;
  const arcs = rows.map((r) => {
    const len = (r.n / total) * 100;
    const seg = `<circle cx="21" cy="21" r="${R}" fill="none" stroke="${r.tint}" stroke-width="6" stroke-dasharray="${Math.max(0, len - gap)} ${100 - Math.max(0, len - gap)}" stroke-dashoffset="${off}"/>`;
    off -= len;
    return seg;
  }).join('');
  return `<div class="donut-wrap">
    <svg class="donut" viewBox="0 0 42 42" role="img" aria-label="${esc(rows.map((r, i) => `${r.label} ${pct[i]} %`).join(', '))}">${arcs}</svg>
    <ul class="legend">${rows.map((r, i) => `<li><i style="background:${r.tint}"></i><span>${esc(r.label)}</span><b>${pct[i] || r.n === 0 ? pct[i] : '<1'} %</b></li>`).join('')}</ul>
  </div>`;
}

function screenStats() {
  const st = L.stats(state.wines);
  const body = !st.bottles ? `<div class="empty"><p class="h2">Pas encore de statistiques</p><p class="small">Elles apparaîtront dès le premier vin en cave.</p></div>` : `
    <section class="card" aria-labelledby="s-pays"><h2 class="h2" id="s-pays">Par pays</h2>${bars(st.countries, (r) => (r.unknown ? '#6E5878' : '#E4AE93'), (r) => ({ country: r.unknown ? NO_COUNTRY : r.label }))}</section>
    <section class="card" aria-labelledby="s-reg"><h2 class="h2" id="s-reg">Par région</h2>${bars(st.regions, (r) => (r.unknown ? '#6E5878' : '#E4AE93'), (r) => (r.unknown ? null : { country: r.country || NO_COUNTRY, region: r.label }))}</section>
    <section class="card" aria-labelledby="s-col"><h2 class="h2" id="s-col">Par couleur</h2>${donut(st.colors)}</section>
    <section class="card" aria-labelledby="s-mat"><h2 class="h2" id="s-mat">Par maturité</h2>${bars(st.maturity, (r) => r.c)}</section>
    <p class="tiny muted" style="margin:0">Nombre de bouteilles en cave. Touchez un pays ou une région pour l'ouvrir dans la cave.</p>`;
  return `
  <div class="screen">
    ${topbar('Statistiques', '#/')}
    <div class="grid3">
      <div class="kpi"><b>${st.bottles}</b><span>${st.bottles === 1 ? 'bouteille' : 'bouteilles'}</span></div>
      <div class="kpi"><b>${st.wines}</b><span>vins</span></div>
      <a class="kpi link" href="#/bientot"><b style="color:var(--accent)">${st.soon}</b><span>à ouvrir bientôt</span></a>
    </div>
    ${st.value ? `<div class="kpi"><b>${st.value.toLocaleString('fr-FR')} €</b><span>valeur estimée de la cave${st.valued < st.bottles ? ` (${st.valued} bouteilles sur ${st.bottles})` : ''}</span></div>` : ''}
    ${body}
  </div>`;
}

function bindStats() {
  $$('[data-jump-country]').forEach((a) => a.addEventListener('click', () => {
    // Pełna cave (bez filtrów), właściwa zakładka kraju i przewinięcie do regionu.
    Object.assign(state.cave, { q: '', inStock: true, color: '', region: '', mat: '', tab: a.dataset.jumpCountry, jump: a.dataset.jumpRegion || 'top' });
  }));
}

// ---------------------------------------------------------------- À ouvrir bientôt
function soonWines() {
  return L.sortWines(state.wines.filter((w) => L.qty(w) > 0 && L.maturity(w).rank >= 5), 'maturity');
}

function screenBientot() {
  const list = soonWines();
  const beyond = list.filter((w) => L.maturity(w).beyond);
  const ready = list.filter((w) => !L.maturity(w).beyond);
  const n = (ws) => ws.reduce((s, w) => s + L.qty(w), 0);
  const group = (title, ws) => (ws.length ? `<h2 class="group-h"><span>${title}</span><span class="n">${n(ws)}</span></h2>${ws.map((w) => wineRow(w)).join('')}` : '');
  return `
  <div class="screen">
    ${topbar('À ouvrir bientôt', '#/')}
    ${list.length ? `<p class="small muted" style="margin:0">Vins à 5/5 de maturité ou déjà au-delà de leur fenêtre de dégustation.</p>
    <div class="list">${group('Au-delà de la fenêtre', beyond)}${group('À boire sans trop attendre', ready)}</div>`
    : `<div class="empty"><p class="h2">Rien ne presse</p><p class="small">Aucun vin n'est à ouvrir rapidement.</p></div>`}
  </div>`;
}

// ---------------------------------------------------------------- Paramètres
function fmtDate(ts) {
  if (!ts) return 'jamais';
  const d = new Date(ts);
  const today = new Date();
  const hm = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  if (d.toDateString() === today.toDateString()) return `aujourd'hui, ${hm}`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function screenParametres(extra) {
  const ok = S.configured();
  const reviews = state.wines.map((w) => L.str(w.maturity_reviewed_at).slice(0, 10)).filter(Boolean).sort();
  const lastReview = reviews.length ? reviews[reviews.length - 1] : null;
  const bottles = state.wines.reduce((s, w) => s + L.qty(w), 0);
  const status = state.syncing ? 'Synchronisation…' : state.syncError ? esc(state.syncError)
    : state.queueCount ? `${plural(state.queueCount, 'modification', 'modifications')} en attente` : 'Tout est à jour';
  return `
  <div class="screen">
    ${topbar('Paramètres', '#/')}
    <section class="card" aria-labelledby="p-sync"><h2 class="h2" id="p-sync">Synchronisation</h2>
      <p class="small muted" style="margin:0">La cave et les photos des étiquettes sont enregistrées dans votre dépôt GitHub privé. Claude y lit les étiquettes et complète les fiches.</p>
      ${ok ? `
      <div style="display:flex;align-items:center;gap:10px;font-size:14px">
        <span style="color:${state.queueCount || state.syncError ? 'var(--warn)' : 'var(--ok)'}">${state.queueCount || state.syncError ? ICON.cloudOff : ICON.check}</span>
        <span style="flex:1">${status}</span>
      </div>
      <div class="kv"><span>Dernière synchronisation</span><span>${fmtDate(state.lastSync)}</span></div>
      <div class="kv"><span>Photos</span><span data-slot="scan-status">…</span></div>
      <button type="button" class="btn-outline" data-action="sync-now"${state.syncing ? ' disabled' : ''}>Synchroniser maintenant</button>` : `
      <div class="note-box">${ICON.info}<span>Synchronisation non configurée : vos données restent sur ce téléphone.</span></div>`}
      <form data-form="scans" style="display:flex;flex-direction:column;gap:12px" autocomplete="off">
        <div class="field"><label for="s-repo">Dépôt privé</label>
          <input class="input" id="s-repo" name="repo" type="text" value="${esc(SC.config().repo)}" autocapitalize="off" spellcheck="false"></div>
        <div class="field"><label for="s-token">Jeton d'accès GitHub</label>
          <input class="input" id="s-token" name="token" type="password" placeholder="${ok ? 'Jeton enregistré · laisser vide pour le garder' : 'github_pat_…'}" autocapitalize="off" spellcheck="false"></div>
        <button type="submit" class="btn-ghost" style="justify-content:center">${ok ? 'Modifier le dépôt ou le jeton' : 'Activer la synchronisation'}</button>
      </form>
    </section>
    <section class="card" aria-labelledby="p-save"><h2 class="h2" id="p-save">Sauvegarde</h2>
      <p class="small muted" style="margin:0">Une copie à garder ailleurs : un fichier .zip avec le tableau Excel et les photos des étiquettes.</p>
      <div class="kv"><span>Dernier export</span><span data-slot="last-export">…</span></div>
      <button type="button" class="btn-outline" data-action="export">Exporter (.xlsx + photos)</button>
    </section>
    <section class="card" aria-labelledby="p-mat"><h2 class="h2" id="p-mat">Maturité</h2>
      <div class="kv"><span>Dernière révision annuelle</span><span>${lastReview ? esc(lastReview) : 'jamais'}</span></div>
      <p class="small" style="margin:0;padding:12px 14px;background:var(--bg);border-radius:14px;color:var(--soft)">Pour la lancer, écrivez à Claude : 'Révision annuelle'. Les nouvelles fenêtres apparaissent ici après la synchronisation.</p>
    </section>
    <section class="card" aria-labelledby="p-dev"><h2 class="h2" id="p-dev">Ce téléphone</h2>
      <div class="kv"><span>Données</span><span>${plural(state.wines.length, 'vin', 'vins')} · ${plural(bottles, 'bouteille', 'bouteilles')}</span></div>
      <div class="kv"><span>Stockage protégé</span><span data-slot="persist">…</span></div>
    </section>
    ${extra || ''}
    <p class="footer-note">Ma Cave à Vin · version ${APP_VERSION}</p>
  </div>`;
}

async function bindParametres() {
  const le = await db.getMeta('lastExport');
  $('[data-slot="last-export"]').textContent = fmtDate(le);
  let persisted = false;
  try { persisted = navigator.storage && navigator.storage.persisted ? await navigator.storage.persisted() : false; } catch (e) { /* brak */ }
  $('[data-slot="persist"]').textContent = persisted ? 'oui' : 'non garanti';
  const on = (sel, fn) => { const el = $(sel); if (el) el.addEventListener('click', fn); };
  on('[data-action="sync-now"]', () => { runSync(true); runScans(); });
  on('[data-action="export"]', exportAll);

  const scanSlot = $('[data-slot="scan-status"]');
  if (scanSlot) {
    const n = await SC.pending();
    scanSlot.textContent = state.scanError ? state.scanError : n ? `${plural(n, 'photo', 'photos')} en attente` : 'à jour';
    if (state.scanError) scanSlot.style.color = 'var(--warn)';
  }
  $('[data-form="scans"]').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const repo = $('#s-repo').value.trim();
    const token = $('#s-token').value.trim() || SC.config().token;
    if (!repo || !token) { toast('Indiquez le dépôt et le jeton.'); return; }
    try {
      await SC.test(repo, token);
      SC.save(repo, token);
      state.scanError = null;
      state.syncError = null;
      toast('Synchronisation activée.');
      render();
      await runScans();
      await runSync(true);
    } catch (e) {
      toast(e.message);
    }
  });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(src));
    document.head.appendChild(s);
  });
}

async function exportAll() {
  try {
    await loadScript('vendor/xlsx.full.min.js');
    await loadScript('vendor/jszip.min.js');
    const wines = await db.getAll('wines');
    const photos = await db.getAll('photos');
    const sheet = window.XLSX.utils.aoa_to_sheet([L.COLUMNS, ...wines.map(L.wineToRow)]);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, sheet, 'Vins');
    const xlsx = window.XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const stamp = L.nowIso().slice(0, 10);
    const zip = new window.JSZip();
    zip.file(`ma-cave-${stamp}.xlsx`, xlsx);
    const folder = zip.folder('photos');
    photos.forEach((p) => { if (p.blob) folder.file(`${p.id}.jpg`, p.blob); });
    const blob = await zip.generateAsync({ type: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ma-cave-${stamp}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    await db.setMeta('lastExport', Date.now());
    toast(`Export prêt : ${plural(wines.length, 'vin', 'vins')}, ${plural(photos.length, 'photo', 'photos')}`);
    if (currentRoute().name === 'parametres') render();
  } catch (e) {
    toast('Export impossible : ' + e.message);
  }
}

// ---------------------------------------------------------------- routing
function notFound() {
  return `<div class="screen">${topbar('Vin introuvable', '#/cave')}<div class="empty"><p class="small">Cette fiche n'existe plus sur ce téléphone.</p></div></div>`;
}

function currentRoute() {
  const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').map(decodeURIComponent);
  const [a, b, c] = parts;
  if (!a) return { name: 'home' };
  if (a === 'cave') return { name: 'cave' };
  if (a === 'vin' && b && c === 'modifier') return { name: 'edit', id: b };
  if (a === 'vin' && b) return { name: 'fiche', id: b };
  if (a === 'ajouter') return { name: 'ajouter' };
  if (a === 'lot') return { name: 'lot' };
  if (a === 'import') return { name: 'import' };
  if (a === 'retirer') return { name: 'retirer', id: b };
  if (a === 'stats') return { name: 'stats' };
  if (a === 'bientot') return { name: 'bientot' };
  if (a === 'parametres') return { name: 'parametres' };
  return { name: 'home' };
}

let lastRouteKey = '';
function render() {
  const r = currentRoute();
  const key = r.name + (r.id || '');
  if (key !== lastRouteKey) {
    if (r.name !== 'edit') state.edit = null;
    if (r.name !== 'retirer') state.retirer = { q: '', sel: null, n: 1 };
  }
  if (lastRouteKey === 'cave' && key !== 'cave') state.caveScroll = window.scrollY;
  if (lastRouteKey === 'bientot' && key !== 'bientot') state.soonScroll = window.scrollY;
  const prev = lastRouteKey.replace(/^(fiche|edit|retirer).*/, '$1');
  // Karta wina wraca tam, skąd przyszła (cave albo À ouvrir bientôt).
  if (r.name === 'fiche' && ['cave', 'bientot'].includes(prev)) state.ficheBack = `#/${prev}`;
  let scrollTop = key === lastRouteKey ? window.scrollY : 0;
  // Powrót z karty wina: lista w tym samym miejscu.
  if (key === 'cave' && key !== lastRouteKey && ['fiche', 'edit', 'retirer'].includes(prev)) {
    scrollTop = state.caveScroll;
    // Wino otwarte z wyszukiwania: po powrocie czyste pole i pełna lista od góry.
    if (state.cave.q) { state.cave.q = ''; scrollTop = 0; }
  }
  if (key === 'bientot' && key !== lastRouteKey && ['fiche', 'edit', 'retirer'].includes(prev)) scrollTop = state.soonScroll || 0;
  const screens = {
    home: [screenHome, bindHome],
    cave: [screenCave, bindCave],
    fiche: [() => screenFiche(r.id), () => bindFiche(r.id)],
    edit: [() => screenEdit(r.id), () => bindEdit(r.id)],
    ajouter: [screenAjouter, bindAjouter],
    lot: [screenLot, bindLot],
    import: [screenImport, bindImport],
    retirer: [() => screenRetirer(r.id), bindRetirer],
    stats: [screenStats, bindStats],
    bientot: [screenBientot, () => {}],
    parametres: [() => screenParametres(), bindParametres]
  };
  const [view, bind] = screens[r.name];
  app.innerHTML = view();
  bind();
  window.scrollTo(0, scrollTop);
  if (r.name === 'cave' && state.cave.jump) {
    const target = state.cave.jump === 'top' ? null : $$('[data-region]').find((h) => h.dataset.region === state.cave.jump);
    if (target) target.scrollIntoView();
    state.cave.jump = '';
  }
  if (key !== lastRouteKey) {
    const h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  lastRouteKey = key;
}

// Przycisk statusu bywa podmieniany przez refreshStatus(): obsługa przez delegację.
function delegatedSync(e) {
  if (e.target.closest('[data-action="sync"]')) runSync(true);
}

// ---------------------------------------------------------------- start
async function start() {
  if ('serviceWorker' in navigator) {
    try { await navigator.serviceWorker.register('sw.js'); } catch (e) { /* tryb deweloperski */ }
  }
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) { /* brak */ }
  await load();
  window.addEventListener('hashchange', render);
  app.addEventListener('click', delegatedSync);
  window.addEventListener('online', () => { scheduleSync(); refreshStatus(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') scheduleSync(); });
  render();
  scheduleScans();
  if (S.configured() && navigator.onLine) runSync(false);
}

start();
