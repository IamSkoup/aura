import {get, getDatabase, orderByChild, equalTo, query, ref} from 'firebase/database';
import type {Product} from '@/lib/types';
import {firebaseApp} from './firebase';

export const assetUrl = (file: string) => `${import.meta.env.BASE_URL}${file.replace(/^\//, '')}`;

// Visual samples are never sold; the merchant must supply actual SKUs and specifications.
const apparelColors = [
  {name: 'Молочный', hex: '#f5f1e9'}, {name: 'Графит', hex: '#252525'},
  {name: 'Лайм', hex: '#c9ff48'}, {name: 'Серо-бежевый', hex: '#a7a399'},
  {name: 'Тёмно-синий', hex: '#25334c'}, {name: 'Бургунди', hex: '#75434a'},
  {name: 'Лаванда', hex: '#b6a9c6'}, {name: 'Хвоя', hex: '#446457'},
  {name: 'Терракота', hex: '#b66d55'}, {name: 'Белый', hex: '#ffffff'},
  {name: 'Чёрный', hex: '#111214'}, {name: 'Оливковый', hex: '#737963'},
  {name: 'Небесный', hex: '#9bbcd0'}, {name: 'Песочный', hex: '#d2b896'},
  {name: 'Кобальт', hex: '#364fa0'}, {name: 'Коралловый', hex: '#da8478'},
];
const clothingAreas = [
  {id: 'front', label: 'Спереди', widthMm: 280, heightMm: 350, minDpi: 150, extraPriceRub: 0},
  {id: 'back', label: 'Сзади', widthMm: 280, heightMm: 350, minDpi: 150, extraPriceRub: 0},
];
const visualSample = (id: string, name: string, category: string, image: string, sizes: string[], colors = apparelColors): Product => ({
  id, name, slug: id, category, image: assetUrl(`images/${image}`),
  description: 'Визуальный образец. Материал, размеры и стоимость будут указаны после подтверждения поставщиком.',
  priceRub: 0, colors, sizes, printAreas: id === 'demo-tee' ? clothingAreas : [], stock: 0, published: true, previewOnly: true, createdAt: 0,
});
export const demoTee: Product = {...visualSample('demo-tee', 'Футболка AURA', 'Футболки', 'tee-editorial.webp', ['XS', 'S', 'M', 'L', 'XL', 'XXL']), model: assetUrl('models/aura-tee.glb')};
export const demoProducts: Product[] = [
  demoTee,
  visualSample('demo-hoodie', 'Худи AURA', 'Худи', 'hoodie-editorial.webp', ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  visualSample('demo-sweatshirt', 'Свитшот AURA', 'Свитшоты', 'sweatshirt-editorial.webp', ['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  visualSample('demo-mug', 'Кружка AURA', 'Кружки', 'mug-editorial.webp', ['Объём уточняется'], [{name: 'Молочный', hex: '#f5f1e9'}]),
  visualSample('demo-case', 'Чехол AURA', 'Чехлы', 'case-editorial.webp', ['Модель уточняется'], [{name: 'Молочный', hex: '#f5f1e9'}]),
  visualSample('demo-poster', 'Постер AURA', 'Постеры', 'poster-editorial.webp', ['Формат уточняется'], [{name: 'Молочный', hex: '#f5f1e9'}]),
];

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
      products: [...products, ...demoProducts.filter(sample => !products.some(p => p.id === sample.id))],
      notice: usable.length === published.length ? '' : 'Часть товаров скрыта: их фотографии доступны только через серверное API.',
    };
  } catch {
    return {products: demoProducts, notice: 'Каталог продавца пока недоступен. Ниже показаны визуальные образцы.'};
  }
}
