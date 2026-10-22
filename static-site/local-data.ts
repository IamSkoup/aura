import {get, getDatabase, ref, remove, set} from 'firebase/database';
import type {Design} from '@/lib/types';
import {firebaseApp, firebaseAuth} from './firebase';
import {clearLegacyData, legacyAsset, legacyDesigns} from './legacy-data';

const db = getDatabase(firebaseApp);
const MAX_IMAGE_CHARS = 700_000;
const MAX_PROJECT_BYTES = 3_500_000;

export class SignInRequiredError extends Error {
  constructor() {super('Чтобы сохранить или открыть дизайн, войдите в аккаунт.');}
}

async function currentUser() {
  await firebaseAuth.authStateReady();
  const user = firebaseAuth.currentUser;
  if (!user) throw new SignInRequiredError();
  return user;
}

function designRef(uid: string, id?: string) {
  return ref(db, `userDesigns/${uid}${id ? `/${id}` : ''}`);
}

async function compactImage(blob: Blob, name: string) {
  const bitmap = await createImageBitmap(blob).catch(() => {throw new Error('Файл изображения повреждён.');});
  try {
    if (bitmap.width < 100 || bitmap.height < 100 || bitmap.width * bitmap.height > 40_000_000) throw new Error('Размер изображения: от 100 × 100 px, до 40 млн пикселей.');
    for (const maxSide of [1800, 1500, 1200, 960]) {
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
      for (const quality of [.82, .7, .58]) {
        const url = canvas.toDataURL('image/webp', quality);
        if (url.startsWith('data:image/webp;base64,') && url.length <= MAX_IMAGE_CHARS) {
          return {assetId: crypto.randomUUID(), url, width, height, name: name.slice(0, 120)};
        }
      }
    }
    throw new Error('Не удалось подготовить фото для сохранения. Выберите изображение меньшего размера.');
  } finally {bitmap.close();}
}

export async function saveImage(file: File) {
  if (file.size > 8 * 1024 * 1024 || file.size === 0) throw new Error('Изображение должно быть не больше 8 МБ.');
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const png = header[0] === 137 && header[1] === 80 && header[2] === 78 && header[3] === 71;
  const jpg = header[0] === 255 && header[1] === 216 && header[2] === 255;
  const webp = String.fromCharCode(...header.slice(0, 4)) === 'RIFF' && String.fromCharCode(...header.slice(8, 12)) === 'WEBP';
  if (!png && !jpg && !webp) throw new Error('Поддерживаются только PNG, JPG и WebP.');
  return compactImage(file, file.name);
}

function cleanDesign(design: Design, uid: string): Design {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(design.id)) throw new Error('Некорректный ID дизайна.');
  if (design.layers.length > 16) throw new Error('В одном проекте можно сохранить до 16 слоёв.');
  const clean = JSON.parse(JSON.stringify({...design, ownerId: uid, isPublic: false})) as Design;
  if (clean.previewUrl && clean.previewUrl.length > 140_000) delete clean.previewUrl;
  for (const layer of clean.layers) {
    if (layer.image && !/^(data:image\/(webp|svg\+xml)[;,])/.test(layer.image.url)) throw new Error('Изображение слоя нужно загрузить заново.');
    if (layer.image && layer.image.url.length > MAX_IMAGE_CHARS) throw new Error('Один из рисунков слишком большой для сохранения.');
  }
  if (new Blob([JSON.stringify(clean)]).size > MAX_PROJECT_BYTES) throw new Error('Проект слишком большой для облачного сохранения. Удалите часть изображений.');
  return clean;
}

async function migrateLegacy(uid: string) {
  const old = await legacyDesigns();
  if (!old.length) return;
  for (const design of old) {
    if ((await get(designRef(uid, design.id))).exists()) continue;
    const layers = await Promise.all(design.layers.map(async layer => {
      if (!layer.image || layer.image.url.startsWith('data:image/svg+xml')) return layer;
      const file = await legacyAsset(layer.image.assetId);
      if (!file) throw new Error('Один из старых проектов содержит недоступное изображение. Данные в браузере сохранены.');
      return {...layer, image: await compactImage(file, layer.image.name)};
    }));
    await set(designRef(uid, design.id), cleanDesign({...design, layers}, uid));
  }
  await clearLegacyData();
}

let migration: {uid: string; promise: Promise<void>} | null = null;
function ensureMigration(uid: string) {
  if (migration?.uid === uid) return migration.promise;
  const promise = migrateLegacy(uid).catch(error => {migration = null; throw error;});
  migration = {uid, promise};
  return promise;
}

export async function saveDesign(design: Design): Promise<void> {
  const user = await currentUser();
  await set(designRef(user.uid, design.id), cleanDesign(design, user.uid));
}

export async function loadDesign(id: string): Promise<Design | null> {
  const user = await currentUser();
  await ensureMigration(user.uid);
  const snapshot = await get(designRef(user.uid, id));
  if (!snapshot.exists()) return null;
  const design = snapshot.val() as Design;
  if (design.ownerId !== user.uid) return null;
  return {...design, layers: Array.isArray(design.layers) ? design.layers : []};
}

export async function listDesigns(): Promise<Design[]> {
  const user = await currentUser();
  await ensureMigration(user.uid);
  const snapshot = await get(designRef(user.uid));
  if (!snapshot.exists()) return [];
  return Object.values(snapshot.val() as Record<string, Design>)
    .filter(item => item?.ownerId === user.uid)
    .map(item => ({...item, layers: Array.isArray(item.layers) ? item.layers : []}))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteDesign(id: string): Promise<void> {
  const user = await currentUser();
  await remove(designRef(user.uid, id));
}
