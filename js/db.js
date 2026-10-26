// Lokalna baza w IndexedDB: kopia robocza arkusza, zdjęcia i kolejka zmian offline.
const DB_NAME = 'ma-cave-a-vin';
const DB_VERSION = 1;
let dbPromise = null;

function open() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const r = indexedDB.open(DB_NAME, DB_VERSION);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains('wines')) d.createObjectStore('wines', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('photos')) d.createObjectStore('photos', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('queue')) d.createObjectStore('queue', { keyPath: 'seq', autoIncrement: true });
        if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta', { keyPath: 'key' });
      };
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  }
  return dbPromise;
}

const req = (r) => new Promise((resolve, reject) => {
  r.onsuccess = () => resolve(r.result);
  r.onerror = () => reject(r.error);
});

export async function getAll(store) {
  const d = await open();
  return req(d.transaction(store).objectStore(store).getAll());
}

export async function get(store, key) {
  const d = await open();
  return req(d.transaction(store).objectStore(store).get(key));
}

export async function put(store, value) {
  const d = await open();
  return req(d.transaction(store, 'readwrite').objectStore(store).put(value));
}

export async function del(store, key) {
  const d = await open();
  return req(d.transaction(store, 'readwrite').objectStore(store).delete(key));
}

export async function count(store) {
  const d = await open();
  return req(d.transaction(store).objectStore(store).count());
}

export async function replaceAll(store, values) {
  const d = await open();
  return new Promise((resolve, reject) => {
    const t = d.transaction(store, 'readwrite');
    const s = t.objectStore(store);
    s.clear();
    values.forEach((v) => s.put(v));
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getMeta(key) {
  const r = await get('meta', key);
  return r ? r.value : undefined;
}

export async function setMeta(key, value) {
  return put('meta', { key, value });
}

// Dodaje operację do kolejki synchronizacji; zwraca jej numer.
export async function enqueue(op) {
  return put('queue', { ...op, at: Date.now() });
}

export async function lastQueued() {
  const all = await getAll('queue');
  return all.length ? all[all.length - 1] : null;
}
