// Kopie zdjęć etykiet dla Claude: prywatne repozytorium GitHub (folder scans/).
// Zdjęcia na Google Drive widzi tylko ta aplikacja, więc Claude czyta etykiety stąd.
import * as db from './db.js';

const KEY = 'cave.scans';
const DEFAULT_REPO = 'leslie81jlk/ma-cave-photos';

export function config() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    return { repo: (c && c.repo) || DEFAULT_REPO, token: (c && c.token) || '' };
  } catch (e) {
    return { repo: DEFAULT_REPO, token: '' };
  }
}

export function enabled() {
  return Boolean(config().token);
}

export function save(repo, token) {
  localStorage.setItem(KEY, JSON.stringify({ repo: repo.trim(), token: token.trim() }));
}

export function clear() {
  localStorage.removeItem(KEY);
}

export async function pending() {
  const photos = await db.getAll('photos');
  return photos.filter((p) => p.blob && !p.scanned).length;
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
}

export class ScanError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Sprawdza, czy jeton ma dostęp do repozytorium.
export async function test(repo, token) {
  const r = await fetch(`https://api.github.com/repos/${repo}`, { headers: headers(token) });
  if (r.status === 401) throw new ScanError('auth', 'Jeton GitHub refusé');
  if (r.status === 404) throw new ScanError('repo', 'Dépôt introuvable ou inaccessible avec ce jeton');
  if (!r.ok) throw new ScanError('http', 'Erreur GitHub ' + r.status);
  const info = await r.json();
  if (!info.private) throw new ScanError('public', 'Ce dépôt est public : choisissez un dépôt privé');
  return info;
}

function toBase64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

let running = null;
export function push() {
  if (!running) running = doPush().finally(() => { running = null; });
  return running;
}

async function doPush() {
  const { repo, token } = config();
  if (!token || !navigator.onLine) return 0;
  const photos = (await db.getAll('photos')).filter((p) => p.blob && !p.scanned);
  let sent = 0;
  for (const p of photos) {
    const url = `https://api.github.com/repos/${repo}/contents/scans/${encodeURIComponent(p.id)}.jpg`;
    const head = await fetch(url, { headers: headers(token) });
    if (head.status === 401) throw new ScanError('auth', 'Jeton GitHub refusé');
    let sha;
    if (head.ok) sha = (await head.json()).sha;
    else if (head.status !== 404) throw new ScanError('http', 'Erreur GitHub ' + head.status);
    const body = { message: `Étiquette ${p.id}`, content: await toBase64(p.blob) };
    if (sha) body.sha = sha;
    const put = await fetch(url, { method: 'PUT', headers: { ...headers(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!put.ok) throw new ScanError('http', 'Envoi impossible (GitHub ' + put.status + ')');
    const fresh = await db.get('photos', p.id);
    if (fresh && fresh.blob === p.blob) await db.put('photos', { ...fresh, scanned: true });
    else if (fresh) await db.put('photos', { ...fresh, scanned: true });
    sent += 1;
  }
  return sent;
}

// Pobiera zdjęcie z folderu scans/ (np. etykiety wycięte przez Claude). null, gdy brak.
export async function fetchPhoto(name) {
  const { repo, token } = config();
  if (!token || !navigator.onLine) return null;
  const r = await fetch(`https://api.github.com/repos/${repo}/contents/scans/${encodeURIComponent(name)}`,
    { headers: { ...headers(token), Accept: 'application/vnd.github.raw' }, cache: 'no-store' });
  if (!r.ok) return null;
  const blob = await r.blob();
  return blob.size ? new Blob([blob], { type: 'image/jpeg' }) : null;
}
