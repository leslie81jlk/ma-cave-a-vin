// Synchronizacja z prywatnym repozytorium GitHub: główna baza to plik cave.json.
// Klucz i repozytorium są te same co dla zdjęć (Paramètres > Synchronisation).
import * as db from './db.js';
import * as SC from './scans.js';
import { COLUMNS, NUMERIC_FIELDS, CLAUDE_EDITABLE, lockedSet, num, nowIso } from './logic.js';

const FILE = 'cave.json';

export class SyncError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function configured() {
  return SC.enabled();
}

export function hasToken() {
  return SC.enabled();
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}

function decode(b64) {
  const bin = atob(b64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

function encode(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  const step = 0x8000;
  for (let i = 0; i < bytes.length; i += step) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + step));
  return btoa(bin);
}

// Jedno wino w stałej kolejności kolumn: czytelne różnice w historii repozytorium.
export function normalizeWine(w) {
  const out = {};
  COLUMNS.forEach((c) => {
    let v = w[c];
    if (v === undefined || v === null) v = '';
    if (NUMERIC_FIELDS.includes(c)) {
      const n = num(v);
      v = n === null ? '' : n;
    } else if (typeof v !== 'string') v = String(v);
    out[c] = v;
  });
  return out;
}

export function serialize(wines) {
  return JSON.stringify({ format: 'ma-cave-a-vin', version: 1, updated_at: nowIso(), wines: wines.map(normalizeWine) }, null, 2) + '\n';
}

async function readFile() {
  const { repo, token } = SC.config();
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${FILE}?t=${Date.now()}`, { headers: headers(token), cache: 'no-store' });
  if (r.status === 401) throw new SyncError('auth', 'Jeton GitHub refusé');
  if (r.status === 404) return { sha: null, wines: [] };
  if (!r.ok) throw new SyncError('http', 'Erreur GitHub ' + r.status);
  const info = await r.json();
  let text;
  if (info.content) text = decode(info.content);
  else {
    // Plik większy niż 1 MB: pobranie przez blob.
    const b = await fetch(`https://api.github.com/repos/${repo}/git/blobs/${info.sha}`, { headers: headers(token), cache: 'no-store' });
    if (!b.ok) throw new SyncError('http', 'Erreur GitHub ' + b.status);
    text = decode((await b.json()).content);
  }
  const data = JSON.parse(text);
  return { sha: info.sha, wines: (data.wines || []).map(normalizeWine) };
}

async function writeFile(wines, sha, count) {
  const { repo, token } = SC.config();
  const body = { message: `Ma cave : ${count} modification${count > 1 ? 's' : ''} depuis l'application`, content: encode(serialize(wines)) };
  if (sha) body.sha = sha;
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/${FILE}`, {
    method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  if (r.status === 401) throw new SyncError('auth', 'Jeton GitHub refusé');
  if (r.status === 409 || r.status === 422) return false; // ktoś zapisał w międzyczasie
  if (!r.ok) throw new SyncError('http', 'Erreur GitHub ' + r.status);
  return true;
}

// Nakłada kolejkę zmian z telefonu na stan z repozytorium.
export function applyQueue(wines, queue) {
  const map = new Map(wines.map((w) => [w.id, { ...w }]));
  const done = [];
  queue.forEach((op) => {
    if (op.op === 'create') {
      if (!map.has(op.id)) map.set(op.id, normalizeWine(op.wine));
      done.push(op.seq);
      return;
    }
    const w = map.get(op.id);
    if (!w) { done.push(op.seq); return; } // wino usunięte w repozytorium
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
      w.photo_file = `${op.id}.jpg`;
    }
    w.updated_at = nowIso();
    done.push(op.seq);
  });
  return { wines: [...map.values()].map(normalizeWine), done };
}

export function applyPending(wines, pending) {
  return applyQueue(wines, pending).wines;
}

let running = null;
export function syncNow() {
  if (!running) running = doSync().finally(() => { running = null; });
  return running;
}

async function doSync() {
  if (!configured()) throw new SyncError('config', 'Synchronisation non configurée');
  if (!navigator.onLine) throw new SyncError('offline', 'Pas de connexion');
  let wines;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const remote = await readFile();
    const queue = await db.getAll('queue');
    if (!remote.sha) {
      // Pierwsza synchronizacja: plik cave.json jeszcze nie istnieje. Kopia w telefonie
      // zawiera już wszystkie zaległe zmiany, więc staje się bazą, a kolejka jest zamykana.
      const photoIds = new Set(queue.filter((op) => op.op === 'photo').map((op) => op.id));
      const local = (await db.getAll('wines')).map((w) => (photoIds.has(w.id) ? { ...w, photo_file: `${w.id}.jpg` } : w));
      const seeded = local.map(normalizeWine).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
      if (await writeFile(seeded, null, Math.max(1, seeded.length))) {
        for (const op of queue) await db.del('queue', op.seq);
        wines = seeded;
        break;
      }
      continue;
    }
    if (!queue.length && remote.sha) { wines = remote.wines; break; }
    const merged = applyQueue(remote.wines, queue);
    const ok = await writeFile(merged.wines, remote.sha, Math.max(1, merged.done.length));
    if (ok) {
      for (const seq of merged.done) await db.del('queue', seq);
      wines = merged.wines;
      break;
    }
    await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
  }
  if (!wines) throw new SyncError('conflict', 'Base modifiée en même temps : réessayez');
  const pending = await db.getAll('queue');
  await db.replaceAll('wines', applyPending(wines, pending));
  await db.setMeta('lastSync', Date.now());
  return { total: wines.length };
}
