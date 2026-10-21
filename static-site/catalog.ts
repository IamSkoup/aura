import {get, getDatabase, orderByChild, equalTo, query, ref} from 'firebase/database';
import type {Product} from '@/lib/types';
import {firebaseApp} from './firebase';

export const assetUrl = (file: string) => `${import.meta.env.BASE_URL}${file.replace(/^\//, '')}`;

// This is a labelled, local-only demonstration item, not merchant inventory.
export const demoTee: Product = {
  id: 'demo-tee', name: 'Футболка AURA / демонстрация', slug: 'demo-tee', category: 'Футболки',
  description: 'Демонстрационный образец конструктора. Цена, наличие, размеры печати и цвета условные; товар нельзя заказать на GitHub Pages.',
  priceRub: 1990, image: assetUrl('images/aura-tee.png'), model: assetUrl('models/aura-tee.glb'),
  colors: [{name: 'Графит', hex: '#252525'}, {name: 'Молочный', hex: '#f5f1e9'}, {name: 'Лайм', hex: '#c9ff48'}],
  sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  printAreas: [
    {id: 'front', label: 'Спереди', widthMm: 280, heightMm: 350, minDpi: 150, extraPriceRub: 0},
    {id: 'back', label: 'Сзади', widthMm: 280, heightMm: 350, minDpi: 150, extraPriceRub: 390},
  ],
  stock: 0, published: true, createdAt: 0,
};

export function staticImage(url: string): string | null {
  if (/^https:\/\//.test(url)) return url;
  if (/^\/images\//.test(url) || /^\/models\//.test(url)) return assetUrl(url);
  if (url.startsWith(import.meta.env.BASE_URL)) return url;
  return null; // Server-only /api/assets URLs cannot work on GitHub Pages.
}

export async function loadCatalog(): Promise<{products: Product[]; notice: string}> {
  try {
    const snapshot = await get(query(ref(getDatabase(firebaseApp), 'products'), orderByChild('published'), equalTo(true)));
    const published = Object.values(snapshot.val() || {}) as Product[];
    const usable = published.filter(p => p?.published && staticImage(p.image));
    const products = usable.map(p => ({...p, image: staticImage(p.image)!, model: p.model ? staticImage(p.model) || undefined : undefined}));
    return {
      products: products.some(p => p.model?.endsWith('/models/aura-tee.glb')) ? products : [...products, demoTee],
      notice: usable.length === published.length ? '' : 'Часть товаров скрыта: их фотографии доступны только через серверное API.',
    };
  } catch {
    return {products: [demoTee], notice: 'Каталог Firebase недоступен. Показан демонстрационный образец.'};
  }
}
