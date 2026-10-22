import type {Design} from '@/lib/types';

// Read projects created before cloud saving was introduced, then remove the old cache.
const DB_NAME = 'aura-pages';

async function legacyDatabase(): Promise<IDBDatabase | null> {
  if (typeof indexedDB.databases === 'function') {
    const exists = (await indexedDB.databases()).some(item => item.name === DB_NAME);
    if (!exists) return null;
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function legacyDesigns(): Promise<Design[]> {
  const db = await legacyDatabase();
  if (!db) return [];
  try {
    if (!db.objectStoreNames.contains('designs')) return [];
    return await new Promise<Design[]>((resolve, reject) => {
      const request = db.transaction('designs', 'readonly').objectStore('designs').getAll();
      request.onsuccess = () => resolve(request.result as Design[]);
      request.onerror = () => reject(request.error);
    });
  } finally {db.close();}
}

export async function legacyAsset(assetId: string): Promise<Blob | null> {
  const db = await legacyDatabase();
  if (!db) return null;
  try {
    if (!db.objectStoreNames.contains('assets')) return null;
    return await new Promise<Blob | null>((resolve, reject) => {
      const request = db.transaction('assets', 'readonly').objectStore('assets').get(assetId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } finally {db.close();}
}

export async function clearLegacyData(): Promise<void> {
  const db = await legacyDatabase();
  if (!db) return;
  try {
    await new Promise<void>((resolve, reject) => {
      const names = ['designs', 'assets'].filter(name => db.objectStoreNames.contains(name));
      if (!names.length) {resolve(); return;}
      const tx = db.transaction(names, 'readwrite');
      for (const name of names) tx.objectStore(name).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {db.close();}
}
