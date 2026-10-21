import Link from 'next/link';
import Image from 'next/image';
import {notFound} from 'next/navigation';
import {LegalDocuments} from '@/components/LegalDocuments';
import {ReviewsList} from '@/components/ReviewsList';

const sizeTable=[
  ['XS','44–46','66','46'],['S','46–48','68','49'],['M','48–50','70','52'],
  ['L','50–52','73','55'],['XL','52–54','75','58'],['XXL','54–56','78','61']
];
const sizes=<>
  <p>Для футболок ориентируйся на размер любимой вещи, а не только на букву на бирке. Разложи её на столе и измерь ширину от подмышки до подмышки и длину от плеча до низа.</p>
  <h2>Ориентировочные размеры футболок</h2>
  <table className="size-table"><thead><tr><th>Размер</th><th>RU</th><th>Длина, см</th><th>Ширина, см</th></tr></thead><tbody>{sizeTable.map(row=><tr key={row[0]}>{row.map((cell,i)=><td key={i}>{cell}</td>)}</tr>)}</tbody></table>
  <p>Это справочная сетка, а не замеры конкретной партии. Oversize имеет более свободную посадку. Перед изготовлением уточним точные мерки выбранного изделия.</p>
  <div className="notice"><strong>Как выбрать</strong><p>Если хочешь посадку по фигуре — бери свой обычный размер. Для свободного силуэта сравни ширину с любимой футболкой oversize. Кружки выбираются по объёму, постеры — по формату.</p></div>
</>;
const materials=<>
  <Image className="info-photo" width={950} height={320} src="/images/editorial-flatlay.webp" alt="Одежда и материалы для нанесения принтов"/>
  <h2>Основа имеет значение</h2>
  <p>Для одежды доступны хлопковые и смесовые материалы. Хлопок приятен к телу и хорошо пропускает воздух. Смесовая ткань обычно лучше держит форму. Точный состав и плотность зависят от партии и выбранной модели.</p>
  <div className="faq-list">
    <details open><summary>Футболки</summary><p>Мягкая хлопковая основа. Уточни у магазина процент хлопка и плотность в г/м² для выбранной модели — они влияют на фактуру и посадку.</p></details>
    <details><summary>Худи и свитшоты</summary><p>Плотная ткань на хлопковой или смесовой основе. Отделка изнанки и точный состав зависят от конкретного изделия.</p></details>
    <details><summary>Кружки, чехлы и постеры</summary><p>Керамика для кружек, полимерная основа для чехлов, бумага для постеров. Перед заказом уточняется конкретная модель чехла и формат постера.</p></details>
    <details><summary>Уход</summary><p>Одежду с принтом обычно стирают вывернутой при деликатной температуре; не гладят непосредственно по принту. Всегда сверяйся с ярлыком готового изделия.</p></details>
  </div>
</>;
const pages:Record<string,{eyebrow:string;title:string;content:React.ReactNode}>={
  sizes:{eyebrow:'ПОМОЩЬ / РАЗМЕРЫ',title:'Размеры и посадка',content:sizes},
  materials:{eyebrow:'ПОМОЩЬ / МАТЕРИАЛЫ',title:'Материалы и уход',content:materials},
  delivery:{eyebrow:'ПОМОЩЬ / ДОСТАВКА',title:'Доставка и оплата',content:<><p>Мы работаем над удобной доставкой по России. Итоговая стоимость и срок зависят от города, способа получения и состава заказа.</p><p>При оформлении заказа используется защищённая онлайн-оплата. До подтверждения оплаты изготовление не начинается.</p><p>Возврат, обмен и обработка персональных данных регулируются документами магазина, доступными в разделе правовой информации.</p></>},
  about:{eyebrow:'AURA / О БРЕНДЕ',title:'Носи свою идею',content:<><p>AURA WEAR — одежда и предметы с дизайном, который выбираешь ты. Загрузи фотографию, придумай надпись, нарисуй что-нибудь своё или начни с нашей коллекции принтов.</p><p>В конструкторе можно изменить макет и оценить расположение изображения на 3D-модели изделия. Перед производством мы проверяем макет.</p><Image className="info-photo" width={950} height={320} src="/images/editorial-flatlay.webp" alt="Одежда и аксессуары AURA WEAR"/></>},
  contacts:{eyebrow:'AURA / КОНТАКТЫ',title:'На связи',content:<><p>Для связи с магазином используются контакты продавца, указанные в документах и подтверждении заказа.</p><p>Появились вопросы по размеру, принту или доставке? Сохрани свой проект — это поможет обсудить детали заказа.</p></>},
  faq:{eyebrow:'ПОМОЩЬ / ВОПРОСЫ',title:'Частые вопросы',content:<div className="faq-list">
    <details><summary>Как сохранить дизайн?</summary><p>Открой конструктор, добавь свой принт, войди в аккаунт и нажми «Сохранить проект».</p></details>
    <details><summary>Можно ли изменить проект?</summary><p>Да. Открой «Мои проекты» и продолжи работу в конструкторе.</p></details>
    <details><summary>Можно нарисовать принт от руки?</summary><p>Да. В конструкторе выбери «Рисовать», настрой кисть и добавь рисунок в макет.</p></details>
    <details><summary>Совпадут ли цвета в точности?</summary><p>Экран показывает визуализацию. Оттенок на ткани зависит от печати, материала и дисплея.</p></details>
    <details><summary>Когда начнётся изготовление?</summary><p>После оформления, подтверждения оплаты и проверки макета.</p></details>
  </div>},
  legal:{eyebrow:'ИНФОРМАЦИЯ / ДОКУМЕНТЫ',title:'Правовая информация',content:<LegalDocuments/>},
  reviews:{eyebrow:'СООБЩЕСТВО / ОТЗЫВЫ',title:'Отзывы покупателей',content:<ReviewsList/>},
  gallery:{eyebrow:'СООБЩЕСТВО / ГАЛЕРЕЯ',title:'Ваши фотографии',content:<><p>Здесь появляются реальные фотографии вещей, присланные покупателями после получения заказа.</p><ReviewsList photosOnly/></>}
};
export default async function InfoPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params,p=pages[slug];if(!p)notFound();
  return <div className="info-page"><div className="page-banner"><div className="container"><span className="eyebrow">{p.eyebrow}</span><h1>{p.title}</h1></div></div><div className="container info-content">{p.content}<Link href="/studio" className="button button-dark">Открыть конструктор</Link></div></div>;
}
