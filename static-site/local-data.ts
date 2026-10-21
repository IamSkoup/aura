import type {Design} from '@/lib/types';

const DB_NAME = 'aura-pages';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('designs')) db.createObjectStore('designs', {keyPath: 'id'});
      if (!db.objectStoreNames.contains('assets')) db.createObjectStore('assets');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transact<T>(storeName: 'designs'|'assets', mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = operation(tx.objectStore(storeName));
    tx.oncomplete = () => {resolve(request.result); db.close();};
    tx.onerror = () => {reject(tx.error); db.close();};
    tx.onabort = () => {reject(tx.error); db.close();};
  });
}

export async function saveImage(file: File) {
  if (file.size > 8 * 1024 * 1024 || file.size === 0) throw new Error('Изображение должно быть не больше 8 МБ.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71;
  const jpg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const webp = String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  if (!png && !jpg && !webp) throw new Error('Поддерживаются только PNG, JPG и WebP.');
  const bitmap = await createImageBitmap(file).catch(() => {throw new Error('Файл изображения повреждён.');});
  const {width, height} = bitmap;
  bitmap.close();
  if (width < 100 || height < 100 || width * height > 40_000_000) throw new Error('Размер изображения: от 100 × 100 px, до 40 млн пикселей.');
  const assetId = crypto.randomUUID();
  await transact('assets', 'readwrite', store => store.put(file, assetId));
  return {assetId, url: URL.createObjectURL(file), width, height, name: file.name.slice(0, 120)};
}

export async function saveDesign(design: Design): Promise<void> {
  const clean: Design = {...design, layers: design.layers.map(layer => layer.image && !layer.image.url.startsWith('data:image/svg+xml') ? {...layer, image: {...layer.image, url: ''}} : layer)};
  await transact('designs', 'readwrite', store => store.put(clean));
}

export async function loadDesign(id: string): Promise<Design | null> {
  const design = await transact<Design | undefined>('designs', 'readonly', store => store.get(id));
  if (!design) return null;
  const layers = await Promise.all(design.layers.map(async layer => {
    if (!layer.image) return layer;
    if (layer.image.url.startsWith('data:image/svg+xml')) return layer;
    const file = await transact<Blob | undefined>('assets', 'readonly', store => store.get(layer.image!.assetId));
    return file ? {...layer, image: {...layer.image, url: URL.createObjectURL(file)}} : layer;
  }));
  return {...design, layers};
}

export async function listDesigns(): Promise<Design[]> {
  const designs = await transact<Design[]>('designs', 'readonly', store => store.getAll());
  return designs.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDesign(id: string): Promise<void> {
  await transact('designs', 'readwrite', store => store.delete(id));
}
