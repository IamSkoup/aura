import type { Product } from './types';

const baseColors = [
  { name: 'Графит', hex: '#262829' },
  { name: 'Молочный', hex: '#f0ebe2' },
  { name: 'Белый', hex: '#fafafa' },
  { name: 'Чёрный', hex: '#111214' },
  { name: 'Лайм', hex: '#c9ff48' },
  { name: 'Пыльная роза', hex: '#bf8d8f' },
  { name: 'Синий', hex: '#46658b' },
];
const front = { id: 'front', label: 'Спереди', widthMm: 280, heightMm: 350, minDpi: 150, extraPriceRub: 0 };
const back = { id: 'back', label: 'Сзади', widthMm: 280, heightMm: 350, minDpi: 150, extraPriceRub: 390 };
const colors = (names: string[]) => baseColors.filter(c => names.includes(c.name));
const clothSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const make = (id: string, name: string, category: string, priceRub: number, image: string, description: string, extras: Partial<Product> = {}): Product => ({
  id, slug: id, name, category, priceRub, image, description, colors: colors(['Графит','Молочный','Белый','Чёрный','Лайм']), sizes: clothSizes,
  printAreas: [front,back], material: 'Хлопок', stock: 50, published: true, createdAt: 1792500000000,
  ...extras,
});

// Начальное наполнение. Перед публикацией владелец проверяет цены, ассортимент и наличие.
export const starterProducts: Product[] = [
  make('tee-01','Футболка Oversize','Футболки',1990,'/images/aura-tee.png','Плотная футболка свободного кроя для твоего принта.',{model:'/models/aura-tee.glb',material:'Хлопок'}),
  make('tee-02','Футболка Regular','Футболки',1690,'/images/aura-tee.png','Лаконичная посадка на каждый день.',{model:'/models/aura-tee.glb',material:'Хлопок',colors:colors(['Графит','Молочный','Белый','Чёрный'])}),
  make('hoodie-01','Худи Heavy','Худи',3590,'/images/catalog-hoodie.svg','Тёплое худи с объёмным капюшоном и мягкой изнанкой.',{model:'hoodie',material:'Смесовый хлопок'}),
  make('hoodie-02','Худи Essential','Худи',3290,'/images/catalog-hoodie.svg','Мягкое базовое худи под авторский принт.',{model:'hoodie',material:'Смесовый хлопок'}),
  make('sweat-01','Свитшот Core','Свитшоты',2990,'/images/catalog-sweatshirt.svg','Универсальный свитшот с плотной посадкой.',{model:'sweatshirt',material:'Смесовый хлопок'}),
  make('sweat-02','Свитшот Daily','Свитшоты',2790,'/images/catalog-sweatshirt.svg','Минималистичная база на прохладную погоду.',{model:'sweatshirt',material:'Смесовый хлопок'}),
  make('mug-01','Кружка Classic','Кружки',790,'/images/catalog-mug.svg','Керамическая кружка под фотографию, рисунок или надпись.',{model:'mug',material:'Керамика',sizes:['330 мл'],optionLabel:'Объём',colors:colors(['Белый','Чёрный']),printAreas:[{...front,widthMm:190,heightMm:90}]}),
  make('mug-02','Кружка Contrast','Кружки',990,'/images/catalog-mug.svg','Акцентная кружка с контрастной отделкой.',{model:'mug',material:'Керамика',sizes:['330 мл'],optionLabel:'Объём',colors:colors(['Белый','Чёрный']),printAreas:[{...front,widthMm:190,heightMm:90}]}),
  make('case-01','Чехол Clear','Чехлы',890,'/images/catalog-case.svg','Лёгкий чехол с собственным изображением.',{model:'case',material:'Полимер',sizes:['Универсальный макет'],optionLabel:'Модель устройства (уточняется при заказе)',colors:colors(['Белый','Чёрный']),printAreas:[{...front,widthMm:70,heightMm:145}]}),
  make('case-02','Чехол Matte','Чехлы',1090,'/images/catalog-case.svg','Матовая поверхность для контрастных принтов.',{model:'case',material:'Полимер',sizes:['Универсальный макет'],optionLabel:'Модель устройства (уточняется при заказе)',colors:colors(['Белый','Чёрный']),printAreas:[{...front,widthMm:70,heightMm:145}]}),
  make('poster-01','Постер Gallery','Постеры',690,'/images/catalog-poster.svg','Плакат для твоего интерьера или подарка.',{model:'poster',material:'Бумага',sizes:['A4','A3','A2'],optionLabel:'Формат',colors:colors(['Белый']),printAreas:[{...front,widthMm:210,heightMm:297}]}),
  make('poster-02','Постер Statement','Постеры',990,'/images/catalog-poster.svg','Крупный постер под фотографию или типографику.',{model:'poster',material:'Бумага',sizes:['A4','A3','A2'],optionLabel:'Формат',colors:colors(['Белый']),printAreas:[{...front,widthMm:210,heightMm:297}]}),
];

export const starterPrints = [
  {id:'punch', title:'BOLD MOVE', category:'Типографика',description:'Крупная типографика для смелого образа.'},
  {id:'minimal', title:'ЛИНИЯ', category:'Минимализм',description:'Чистая графика и ничего лишнего.'},
  {id:'meme', title:'НЕ СЕГОДНЯ', category:'Мемы',description:'Настроение, которое всё объясняет.'},
  {id:'quote', title:'NO RULES', category:'Цитаты',description:'Коротко о свободе быть собой.'},
  {id:'anime', title:'NEON SKY', category:'Аниме',description:'Эстетика яркой ночи.'},
  {id:'holiday', title:'ЗИМНИЙ СВЕТ', category:'Праздники',description:'Зимняя графика для подарка.'},
  {id:'abstract', title:'FREQUENCY', category:'Абстракция',description:'Абстрактные формы и движение.'},
  {id:'aura', title:'AURA SIGNATURE', category:'Авторские коллекции',description:'Фирменный знак коллекции.'},
];
