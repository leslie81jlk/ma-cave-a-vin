// Ma Cave à Vin - interfejs (styl E: aubergine et or rose).
import * as db from './db.js';
import * as L from './logic.js';
import * as S from './sync.js';
import * as SC from './scans.js';

const APP_VERSION = '1.0.4';
const app = document.getElementById('app');
const toastEl = document.getElementById('toast');

const state = {
  wines: [],
  queueCount: 0,
  lastSync: null,
  syncing: false,
  syncError: null,
  needsLogin: false,
  cave: { q: '', inStock: true, color: '', country: '', region: '', mat: '', sort: 'maturity' },
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

async function photoUrl(id) {
  if (state.photoCache.has(id)) return state.photoCache.get(id);
  const p = await db.get('photos', id);
  if (!p || !p.blob) return null;
  const url = URL.createObjectURL(p.blob);
  state.photoCache.set(id, url);
  return url;
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
    if (e.code === 'access') state.syncError = 'Accès à la base non accordé. Choisissez-la à nouveau dans Paramètres.';
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
  const soon = L.sortWines(inStock, 'maturity').filter((w) => L.maturity(w).rank >= 5).slice(0, 3);
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
        ${st.soon ? `<span class="small" style="color:var(--accent);font-weight:600">${st.soon} à ouvrir</span>` : ''}
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
      <a class="tile" href="#/retirer"><span style="color:var(--accent)">${ICON.minus}</span>Retirer du stock</a>
    </div>
    ${state.wines.length === 0 ? `
      <div class="empty"><p class="h2">Votre cave est vide</p><p class="small">Ajoutez votre premier vin, ou demandez à Claude d'importer vos notes.</p></div>` : ''}
    ${soon.length ? `
      <section class="list" aria-labelledby="soon-h">
        <h2 class="h2" id="soon-h">À ouvrir bientôt</h2>
        ${soon.map(wineRow).join('')}
      </section>` : ''}
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
      <span class="sub">${esc(L.subtitle(w) || L.sizeLabel(w))}</span>
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
    if (c.country && L.str(w.country) !== c.country) return false;
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

function selectChip(name, label, value, options) {
  return `<label class="sr-only" for="f-${name}">${label}</label>
    <select id="f-${name}" class="chip-select${value ? ' on' : ''}" data-filter="${name}">
      <option value="">${label}</option>
      ${options.map(([v, l]) => `<option value="${esc(v)}"${v === value ? ' selected' : ''}>${esc(l)}</option>`).join('')}
    </select>`;
}

function screenCave() {
  const c = state.cave;
  const sorts = [['region', 'Région'], ['score', 'Note'], ['maturity', 'Maturité'], ['vintage', 'Millésime']];
  const colors = Object.entries(L.COLORS).map(([k, v]) => [k, v.label]);
  const mats = [['beyond', 'Au-delà de la fenêtre'], ['5', '5/5 · Sans trop attendre'], ['4', '4/5 · À boire'], ['3', '3/5 · Approche'],
    ['2', '2/5 · À attendre'], ['1', '1/5 · Trop jeune'], ['0', 'À estimer']];
  return `
  <div class="screen">
    <div class="topbar"><a class="back" href="#/" aria-label="Retour à l'accueil">${ICON.back}</a><h1 class="title">Ma cave</h1><span class="small muted" data-slot="count"></span></div>
    <div class="search" role="search">${ICON.search}<label class="sr-only" for="cave-q">Rechercher dans la cave</label>
      <input id="cave-q" type="search" placeholder="Nom, producteur, appellation…" value="${esc(c.q)}" autocomplete="off"></div>
    <div class="wrap" role="group" aria-label="Filtres">
      <button type="button" class="chip" data-action="instock" aria-pressed="${c.inStock}">En stock</button>
      ${selectChip('color', 'Couleur', c.color, colors)}
      ${selectChip('country', 'Pays', c.country, uniqueSorted('country').map((x) => [x, x]))}
      ${selectChip('region', 'Région', c.region, uniqueSorted('region').map((x) => [x, x]))}
      ${selectChip('mat', 'Maturité', c.mat, mats)}
    </div>
    <div class="wrap" role="group" aria-labelledby="sort-l">
      <span class="sort-label" id="sort-l">Trier par</span>
      ${sorts.map(([k, l]) => `<button type="button" class="sort-btn" data-sort="${k}" aria-pressed="${c.sort === k}">${l}</button>`).join('')}
    </div>
    <div class="list" data-slot="list"></div>
  </div>`;
}

function renderCaveList() {
  const list = filteredWines();
  const slot = $('[data-slot="list"]');
  const count = $('[data-slot="count"]');
  if (count) count.textContent = plural(list.length, 'vin', 'vins');
  if (!slot) return;
  if (!state.wines.length) {
    slot.innerHTML = `<div class="empty"><p class="h2">Votre cave est vide</p><p class="small"><a href="#/ajouter">Ajouter un vin</a></p></div>`;
  } else if (!list.length) {
    slot.innerHTML = `<div class="empty"><p class="small">Aucun vin ne correspond à ces critères.</p></div>`;
  } else {
    slot.innerHTML = list.map((w) => wineRow(w)).join('');
  }
}

function bindCave() {
  renderCaveList();
  $('#cave-q').addEventListener('input', (e) => { state.cave.q = e.target.value; renderCaveList(); });
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
    ['Contenance', L.sizeLabel(w)]
  ].filter(([, v]) => L.str(v));
  const score = L.fmtScore(w.personal_score);
  return `
  <div class="screen">
    <div class="topbar" style="justify-content:space-between"><a class="back" href="#/cave" aria-label="Retour à la cave">${ICON.back}</a>
      <a class="btn-ghost" href="#/vin/${encodeURIComponent(w.id)}/modifier">Modifier</a></div>
    <div class="hero">
      <div class="photo" data-slot="photo">${bottle(tintOf(w), 34, 112, true)}</div>
      <div style="display:flex;flex-direction:column;gap:6px;min-width:0">
        <p class="kicker" style="margin:0">${esc([w.appellation, L.vintageLabel(w)].filter(Boolean).join(' ') || 'Millésime à préciser')}</p>
        <h1 class="title" style="font-size:28px">${esc(L.displayName(w))}</h1>
        ${L.str(w.name) && L.str(w.producer) && L.str(w.producer) !== L.str(w.name) ? `<p class="small" style="margin:0">${esc(w.producer)}</p>` : ''}
        <p class="small muted" style="margin:0">${esc([L.colorInfo(w) ? L.colorInfo(w).label : '', L.sizeLabel(w)].filter(Boolean).join(' · '))}</p>
      </div>
    </div>
    ${statusBadge(w) ? `<div class="banner warn">${ICON.info}<span><strong>${esc(w.status_fiche)}.</strong> ${esc(w.claude_note || 'Les informations seront complétées par Claude.')}</span></div>` : ''}
    <div class="card stock">
      <div style="flex:1"><span class="tiny muted">En cave</span><b>${plural(L.qty(w), 'bouteille', 'bouteilles')}</b></div>
      <button type="button" class="icon-btn" data-action="plus1" aria-label="Ajouter une bouteille" style="color:var(--accent)">${ICON.plus}</button>
      <a class="btn small-btn" href="#/retirer/${encodeURIComponent(w.id)}">Retirer</a>
    </div>
    <section class="card" aria-labelledby="mat-h">
      <div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px">
        <h2 class="h2" id="mat-h">Maturité</h2>
        <span class="pill${m.beyond ? ' warn' : m.score ? '' : ' dim'}">${m.score ? `${m.beyond ? '' : `${m.score}/5 · `}` : ''}${esc(m.label)}</span>
      </div>
      ${matBody}
    </section>
    <section class="card" aria-labelledby="avis-h">
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <h2 class="h2" id="avis-h">Mon avis</h2>
        ${score ? `<span style="font-family:var(--serif);font-size:24px;font-weight:600;color:var(--accent)">${score} <span class="small muted" style="font-family:var(--sans);font-weight:400">/ 5</span></span>` : ''}
      </div>
      ${L.str(w.personal_notes) ? `<p class="notes">${esc(w.personal_notes)}</p>` : `<p class="small muted" style="margin:0">Pas encore de note. <a href="#/vin/${encodeURIComponent(w.id)}/modifier">Ajouter mon avis</a></p>`}
    </section>
    <section class="card" aria-labelledby="info-h">
      <h2 class="h2" id="info-h">Informations</h2>
      ${info.length ? `<dl class="info">${info.map(([k, v]) => `<div><dt>${k}</dt><dd>${k === 'Prix d\'achat' ? v : esc(v)}</dd></div>`).join('')}
        ${L.str(w.grapes) ? `<div class="full"><dt>Cépages</dt><dd>${esc(w.grapes)}</dd></div>` : ''}</dl>` : ''}
      ${L.str(w.description_fr) ? `<p class="desc">${esc(w.description_fr)}</p>` : ''}
      ${L.str(w.status_fiche) === 'Complété' && L.str(w.claude_note) ? `<p class="small" style="margin:0;padding:10px 12px;background:var(--bg);border-radius:12px;color:var(--soft)">${esc(w.claude_note)}</p>` : ''}
      <p class="tiny muted" style="margin:0">${L.str(w.status_fiche) === 'Complété' ? 'Complété par Claude' : 'En attente de Claude'}${L.str(w.locked_fields) ? ` · corrigé à la main : ${esc([...L.lockedSet(w)].map((k) => FIELD_LABELS[k] || k).join(', '))}` : ''}</p>
    </section>
  </div>`;
}

async function bindFiche(id) {
  const w = byId(id);
  if (!w) return;
  const url = await photoUrl(id);
  const slot = $('[data-slot="photo"]');
  if (url && slot) slot.innerHTML = `<img src="${url}" alt="Étiquette de ${esc(L.displayName(w))}">`;
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

async function compressImage(file) {
  let source;
  try {
    source = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    source = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }
  const max = 1200;
  const sw = source.width;
  const sh = source.height;
  const k = Math.min(1, max / Math.max(sw, sh));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(sw * k);
  canvas.height = Math.round(sh * k);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.72));
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
    <p class="small muted" style="margin:0">${esc(L.displayName(w))} · ${esc(L.subtitle(w) || L.sizeLabel(w))}</p>
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
function bars(rows, colorFn) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  return rows.map((r) => `<div class="bar-row"><span>${esc(r.label)}</span>
    <span class="bar-track" aria-hidden="true"><span class="bar-fill" style="display:block;width:${Math.round((r.n / max) * 100)}%;background:${colorFn(r)}"></span></span><b>${r.n}</b></div>`).join('');
}

function screenStats() {
  const st = L.stats(state.wines);
  const body = !st.bottles ? `<div class="empty"><p class="h2">Pas encore de statistiques</p><p class="small">Elles apparaîtront dès le premier vin en cave.</p></div>` : `
    <section class="card" aria-labelledby="s-pays"><h2 class="h2" id="s-pays">Par pays</h2>${bars(st.countries, (r) => (r.unknown ? '#6E5878' : '#E4AE93'))}</section>
    <section class="card" aria-labelledby="s-reg"><h2 class="h2" id="s-reg">Par région</h2>${bars(st.regions, (r) => (r.unknown ? '#6E5878' : '#E4AE93'))}</section>
    <section class="card" aria-labelledby="s-col"><h2 class="h2" id="s-col">Par couleur</h2>
      <div class="bottles4">${st.colors.map((c) => `<div>${bottle(c.tint, 22, 60)}<b>${c.n}</b><span class="tiny muted">${esc(c.label)}</span></div>`).join('')}</div></section>
    <section class="card" aria-labelledby="s-mat"><h2 class="h2" id="s-mat">Par maturité</h2>${bars(st.maturity, (r) => r.c)}</section>
    <p class="tiny muted" style="margin:0">Nombre de bouteilles en cave.</p>`;
  return `
  <div class="screen">
    ${topbar('Statistiques', '#/')}
    <div class="grid3">
      <div class="kpi"><b>${st.bottles}</b><span>${st.bottles === 1 ? 'bouteille' : 'bouteilles'}</span></div>
      <div class="kpi"><b>${st.wines}</b><span>vins</span></div>
      <div class="kpi"><b style="color:var(--accent)">${st.soon}</b><span>à ouvrir bientôt</span></div>
    </div>
    ${body}
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
  let syncBody;
  if (!ok) {
    syncBody = `<div class="note-box">${ICON.info}<span>La synchronisation avec Google n'est pas encore configurée. Vos données restent sur ce téléphone ; pensez à exporter une copie.</span></div>`;
  } else {
    syncBody = `
      <div style="display:flex;align-items:center;gap:10px;font-size:14px">
        <span style="color:${state.queueCount || state.syncError ? 'var(--warn)' : 'var(--ok)'}">${state.queueCount || state.syncError ? ICON.cloudOff : ICON.check}</span>
        <span style="flex:1">${state.syncing ? 'Synchronisation…' : state.syncError ? esc(state.syncError) : state.queueCount ? `${plural(state.queueCount, 'modification', 'modifications')} en attente` : 'Tout est à jour'}</span>
      </div>
      <div class="kv"><span>Dernière synchronisation</span><span>${fmtDate(state.lastSync)}</span></div>
      <div class="kv"><span>Base</span><span>Ma Cave à Vin - base</span></div>
      <button type="button" class="btn-outline" data-action="sync-now"${state.syncing ? ' disabled' : ''}>Synchroniser maintenant</button>
      <button type="button" class="btn-ghost" data-action="connect" style="justify-content:center">Connecter Google et choisir la base</button>
      <button type="button" class="btn-ghost" data-action="disconnect" style="justify-content:center">Se déconnecter de Google</button>`;
  }
  return `
  <div class="screen">
    ${topbar('Paramètres', '#/')}
    <section class="card" aria-labelledby="p-sync"><h2 class="h2" id="p-sync">Synchronisation</h2>${syncBody}</section>
    <section class="card" aria-labelledby="p-scan"><h2 class="h2" id="p-scan">Photos pour Claude</h2>
      <p class="small muted" style="margin:0">Une copie de chaque étiquette est envoyée dans un dépôt GitHub privé, pour que Claude puisse la lire et compléter la fiche.</p>
      <div class="kv"><span>État</span><span data-slot="scan-status">…</span></div>
      <form data-form="scans" style="display:flex;flex-direction:column;gap:12px" autocomplete="off">
        <div class="field"><label for="s-repo">Dépôt privé</label>
          <input class="input" id="s-repo" name="repo" type="text" value="${esc(SC.config().repo)}" autocapitalize="off" spellcheck="false"></div>
        <div class="field"><label for="s-token">Jeton d'accès GitHub</label>
          <input class="input" id="s-token" name="token" type="password" placeholder="${SC.enabled() ? 'Jeton enregistré · laisser vide pour le garder' : 'github_pat_…'}" autocapitalize="off" spellcheck="false"></div>
        <button type="submit" class="btn-outline">${SC.enabled() ? 'Enregistrer et envoyer' : 'Activer'}</button>
        ${SC.enabled() ? '<button type="button" class="btn-ghost" data-action="scan-off" style="justify-content:center">Désactiver</button>' : ''}
      </form>
    </section>
    <section class="card" aria-labelledby="p-save"><h2 class="h2" id="p-save">Sauvegarde</h2>
      <p class="small muted" style="margin:0">Une copie hors de Google : un fichier .zip avec le tableau Excel et les photos des étiquettes.</p>
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
  on('[data-action="sync-now"]', () => runSync(true));
  on('[data-action="connect"]', async () => {
    try {
      await S.connect();
      await runSync(true);
    } catch (e) {
      state.syncError = 'Connexion Google annulée ou refusée.';
      render();
    }
  });
  on('[data-action="disconnect"]', async () => {
    await S.disconnect();
    state.needsLogin = true;
    toast('Déconnecté de Google. Les données restent sur ce téléphone.');
    render();
  });
  on('[data-action="export"]', exportAll);

  const scanSlot = $('[data-slot="scan-status"]');
  const n = await SC.pending();
  scanSlot.textContent = !SC.enabled() ? 'non activé'
    : state.scanError ? state.scanError
      : n ? `${plural(n, 'photo', 'photos')} en attente` : 'à jour';
  if (state.scanError) scanSlot.style.color = 'var(--warn)';
  $('[data-form="scans"]').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const repo = $('#s-repo').value.trim();
    const token = $('#s-token').value.trim() || SC.config().token;
    if (!repo || !token) { toast('Indiquez le dépôt et le jeton.'); return; }
    try {
      await SC.test(repo, token);
      SC.save(repo, token);
      state.scanError = null;
      toast('Photos pour Claude activées. Envoi en cours…');
      render();
      await runScans();
      if (!state.scanError) toast('Photos envoyées.');
    } catch (e) {
      toast(e.message);
    }
  });
  on('[data-action="scan-off"]', () => {
    SC.clear();
    toast('Envoi des photos désactivé.');
    render();
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
  if (a === 'retirer') return { name: 'retirer', id: b };
  if (a === 'stats') return { name: 'stats' };
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
  const scrollTop = key === lastRouteKey ? window.scrollY : 0;
  const screens = {
    home: [screenHome, bindHome],
    cave: [screenCave, bindCave],
    fiche: [() => screenFiche(r.id), () => bindFiche(r.id)],
    edit: [() => screenEdit(r.id), () => bindEdit(r.id)],
    ajouter: [screenAjouter, bindAjouter],
    lot: [screenLot, bindLot],
    retirer: [() => screenRetirer(r.id), bindRetirer],
    stats: [screenStats, () => {}],
    parametres: [() => screenParametres(), bindParametres]
  };
  const [view, bind] = screens[r.name];
  app.innerHTML = view();
  bind();
  window.scrollTo(0, scrollTop);
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
  if (S.configured() && S.hasToken() && navigator.onLine) runSync(false);
  else if (S.configured() && (await db.getMeta('consented'))) { state.needsLogin = true; refreshStatus(); }
}

start();
