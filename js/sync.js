// Synchronizacja z Google Sheets (główna baza) i Google Drive (zdjęcia).
// Zakres OAuth: drive.file - aplikacja widzi tylko pliki wskazane przez użytkownika w selektorze Google.
import * as db from './db.js';
import { COLUMNS, rowToWine, wineToRow, lockedSet, num, nowIso, CLAUDE_EDITABLE } from './logic.js';

const SCOPE = 'https://www.googleapis.com/auth/drive.file';
const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets';
const LAST_COL = 'AC';
const cfg = () => window.CAVE_CONFIG || {};

export function configured() {
  const c = cfg();
  return Boolean(c.googleClientId && c.googleApiKey && c.googleAppId && c.spreadsheetId);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Impossible de charger ' + src));
    document.head.appendChild(s);
  });
}

// --- Jeton dostępu ---------------------------------------------------------
function storedToken() {
  try {
    const t = JSON.parse(localStorage.getItem('cave.gtoken') || 'null');
    if (t && t.exp > Date.now() + 60000) return t.token;
  } catch (e) { /* brak */ }
  return null;
}

export function hasToken() {
  return Boolean(storedToken());
}

function requestToken(prompt) {
  return new Promise(async (resolve, reject) => {
    try {
      await loadScript('https://accounts.google.com/gsi/client');
      const client = google.accounts.oauth2.initTokenClient({
        client_id: cfg().googleClientId,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.error) return reject(new Error(resp.error));
          try {
            localStorage.setItem('cave.gtoken', JSON.stringify({ token: resp.access_token, exp: Date.now() + (resp.expires_in || 3500) * 1000 }));
          } catch (e) { /* tryb prywatny */ }
          resolve(resp.access_token);
        },
        error_callback: (err) => reject(new Error(err && err.type ? err.type : 'auth'))
      });
      client.requestAccessToken({ prompt });
    } catch (e) {
      reject(e);
    }
  });
}

async function token(interactive) {
  const t = storedToken();
  if (t) return t;
  if (!interactive) throw new SyncError('auth', 'Connexion Google requise');
  const consented = await db.getMeta('consented');
  return requestToken(consented ? '' : 'consent');
}

export class SyncError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

async function api(url, opts = {}, interactive = false) {
  const t = await token(interactive);
  const res = await fetch(url, { ...opts, headers: { ...(opts.headers || {}), Authorization: 'Bearer ' + t } });
  if (res.status === 401) {
    localStorage.removeItem('cave.gtoken');
    throw new SyncError('auth', 'Session Google expirée');
  }
  if (res.status === 403 || res.status === 404) {
    throw new SyncError('access', 'Accès au fichier non accordé');
  }
  if (!res.ok) throw new SyncError('http', 'Erreur Google ' + res.status);
  return res.status === 204 ? null : res.json();
}

// --- Pierwsze połączenie: zgoda + wskazanie arkusza i folderu ----------------
export async function connect() {
  const t = await requestToken('consent');
  await db.setMeta('consented', true);
  await openPicker(t);
}

export async function openPicker(existingToken) {
  const t = existingToken || await token(true);
  await loadScript('https://apis.google.com/js/api.js');
  await new Promise((resolve) => gapi.load('picker', resolve));
  const c = cfg();
  const ids = [c.spreadsheetId, c.photosFolderId].filter(Boolean).join(',');
  return new Promise((resolve) => {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMode(google.picker.DocsViewMode.LIST);
    if (ids) view.setFileIds(ids);
    const picker = new google.picker.PickerBuilder()
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(c.googleAppId)
      .setOAuthToken(t)
      .setDeveloperKey(c.googleApiKey)
      .addView(view)
      .setTitle('Sélectionnez la base et le dossier Photos')
      .setCallback(async (data) => {
        if (data.action === google.picker.Action.PICKED) {
          const picked = data.docs.map((d) => d.id);
          await db.setMeta('picked', picked);
          resolve(picked);
        } else if (data.action === google.picker.Action.CANCEL) {
          resolve([]);
        }
      })
      .build();
    picker.setVisible(true);
  });
}

// --- Odczyt i zapis arkusza -------------------------------------------------
async function readSheet(interactive) {
  const id = cfg().spreadsheetId;
  const range = encodeURIComponent(`Vins!A2:${LAST_COL}`);
  const data = await api(`${SHEETS}/${id}/values/${range}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`, {}, interactive);
  const rows = data.values || [];
  return rows.map((r, i) => ({ rowNumber: i + 2, wine: rowToWine(r) })).filter((x) => x.wine.id);
}

async function readFolderId() {
  try {
    const id = cfg().spreadsheetId;
    const data = await api(`${SHEETS}/${id}/values/${encodeURIComponent('Info!B5')}?valueRenderOption=UNFORMATTED_VALUE`);
    const v = data.values && data.values[0] && data.values[0][0];
    return v ? String(v).replace(/^'/, '') : cfg().photosFolderId;
  } catch (e) {
    return cfg().photosFolderId;
  }
}

async function writeRows(updates) {
  if (!updates.length) return;
  const id = cfg().spreadsheetId;
  await api(`${SHEETS}/${id}/values:batchUpdate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: updates.map((u) => ({ range: `Vins!A${u.rowNumber}:${LAST_COL}${u.rowNumber}`, values: [wineToRow(u.wine)] }))
    })
  });
}

async function appendRows(wines) {
  if (!wines.length) return;
  const id = cfg().spreadsheetId;
  const range = encodeURIComponent(`Vins!A1:${LAST_COL}1`);
  await api(`${SHEETS}/${id}/values/${range}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: wines.map(wineToRow) })
  });
}

async function uploadPhoto(photo, folderId) {
  const name = `${photo.id}.jpg`;
  const meta = { name, parents: folderId ? [folderId] : undefined, mimeType: 'image/jpeg' };
  const body = new FormData();
  body.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
  body.append('file', photo.blob, name);
  await api('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name', { method: 'POST', body });
  return name;
}

// --- Synchronizacja ---------------------------------------------------------
let running = null;

export function syncNow(opts = {}) {
  if (!running) running = doSync(opts).finally(() => { running = null; });
  return running;
}

async function doSync({ interactive = false } = {}) {
  if (!configured()) throw new SyncError('config', 'Configuration Google manquante');
  if (!navigator.onLine) throw new SyncError('offline', 'Pas de connexion');

  const sheetRows = await readSheet(interactive);
  const byId = new Map(sheetRows.map((x) => [x.wine.id, x]));
  const queue = await db.getAll('queue');
  const created = new Map();
  const touched = new Set();
  let folderId = null;
  const done = [];
  let photoError = null;

  const target = (id) => created.get(id) || (byId.get(id) && byId.get(id).wine);

  for (const op of queue) {
    if (op.op === 'create') {
      if (byId.has(op.id) || created.has(op.id)) { done.push(op.seq); continue; }
      created.set(op.id, { ...op.wine });
      done.push(op.seq);
      continue;
    }
    const w = target(op.id);
    if (!w) { done.push(op.seq); continue; } // wino usunięte z arkusza: zmiana odpada
    if (op.op === 'update') {
      const locks = lockedSet(w);
      Object.entries(op.fields).forEach(([k, v]) => {
        if (!COLUMNS.includes(k)) return;
        w[k] = v;
        if (CLAUDE_EDITABLE.includes(k)) locks.add(k);
      });
      w.locked_fields = [...locks].join(', ');
    } else if (op.op === 'delta') {
      w.current_quantity = Math.max(0, (num(w.current_quantity) || 0) + op.delta);
    } else if (op.op === 'photo') {
      const photo = await db.get('photos', op.id);
      if (photo && photo.blob) {
        try {
          if (folderId === null) folderId = await readFolderId();
          w.photo_file = await uploadPhoto(photo, folderId);
          await db.put('photos', { ...photo, uploaded: true });
        } catch (e) {
          photoError = e;
          continue; // zdjęcie zostaje w kolejce
        }
      }
    }
    w.updated_at = nowIso();
    if (!created.has(op.id)) touched.add(op.id);
    done.push(op.seq);
  }

  await writeRows([...touched].map((id) => byId.get(id)));
  await appendRows([...created.values()]);
  for (const seq of done) await db.del('queue', seq);

  // Pobranie pełnego stanu: arkusz jest źródłem prawdy.
  const fresh = await readSheet(false);
  const pending = await db.getAll('queue');
  let wines = fresh.map((x) => x.wine);
  // Zmiany, które nie przeszły (np. zdjęcia), nadal widoczne lokalnie.
  wines = applyPending(wines, pending);
  await db.replaceAll('wines', wines);
  await db.setMeta('lastSync', Date.now());
  if (photoError) throw new SyncError('photo', 'Certaines photos n\'ont pas pu être envoyées');
  return { pushed: done.length, total: wines.length };
}

export function applyPending(wines, pending) {
  const map = new Map(wines.map((w) => [w.id, { ...w }]));
  pending.forEach((op) => {
    if (op.op === 'create' && !map.has(op.id)) map.set(op.id, { ...op.wine });
    const w = map.get(op.id);
    if (!w) return;
    if (op.op === 'update') Object.assign(w, op.fields);
    if (op.op === 'delta') w.current_quantity = Math.max(0, (num(w.current_quantity) || 0) + op.delta);
  });
  return [...map.values()];
}

export function disconnect() {
  try {
    const t = storedToken();
    localStorage.removeItem('cave.gtoken');
    if (t && window.google && google.accounts && google.accounts.oauth2) google.accounts.oauth2.revoke(t, () => {});
  } catch (e) { /* nic */ }
  return db.setMeta('consented', false);
}
