import {useEffect, useState} from 'react';
import {get, getDatabase, query, ref, orderByChild, equalTo} from 'firebase/database';
import {Heart, Ruler, Sparkles} from 'lucide-react';
import {firebaseApp} from './firebase';
import {assetUrl} from './catalog';
import {SampleReviews} from './SampleReviews';

type Review = {id:string; rating:number; text:string; productName?:string; displayName?:string; published?:boolean; verifiedPurchase?:boolean; photoConsent?:boolean; photos?:string[]};
type SizeRow = {size:string; widthCm?:number; lengthCm?:number; chestCm?:number; sleeveCm?:number};
type SizeChart = {productName:string; rows:SizeRow[]};
type Material = {name:string; composition?:string; densityGsm?:number; care?:string};
const imageUrl=(value:string)=>/^https:\/\//.test(value);
function usePublicSettings(){
  const [settings,setSettings]=useState<{sizeCharts?:SizeChart[];materials?:Material[]}>({});
  useEffect(()=>{let live=true;void get(ref(getDatabase(firebaseApp),'settings/public')).then(s=>{if(live&&s.exists())setSettings(s.val())}).catch(()=>{});return()=>{live=false}},[]);
  return settings;
}
export function SizeGuide(){
  const {sizeCharts}=usePublicSettings();
  return <div className="container aw-page aw-info-page"><div className="aw-page-head"><span className="eyebrow">AURA / РАЗМЕРЫ</span><h1>Найди свою <em>посадку.</em></h1><p>Сравни мерки любимой вещи с таблицей конкретного изделия. Данные появятся после подтверждения поставщиком.</p></div>
    <div className="aw-guide-grid"><article className="aw-guide-visual"><Ruler size={64}/><h2>Как измерить</h2><p>Положи одежду на ровную поверхность. Измерь ширину от подмышки до подмышки, длину от плеча до низа и рукав от плечевого шва. Обхват груди измеряй по самой широкой части тела.</p></article>
      <div>{Array.isArray(sizeCharts)&&sizeCharts.length?sizeCharts.map(chart=><section className="aw-chart" key={chart.productName}><h2>{chart.productName}</h2><div className="aw-table-scroll"><table><thead><tr><th>Размер</th><th>Ширина, см</th><th>Длина, см</th><th>Грудь, см</th><th>Рукав, см</th></tr></thead><tbody>{chart.rows.map(row=><tr key={row.size}><th>{row.size}</th><td>{row.widthCm??'—'}</td><td>{row.lengthCm??'—'}</td><td>{row.chestCm??'—'}</td><td>{row.sleeveCm??'—'}</td></tr>)}</tbody></table></div></section>):<div className="aw-empty aw-info-empty"><Ruler size={34}/><h2>Мерки уточняются</h2><p>Мы добавим таблицу XS–XXL отдельно для каждого изделия после получения фактических измерений поставщика.</p></div>}</div>
    </div></div>;
}
export function Materials(){
  const {materials}=usePublicSettings();
  return <div className="container aw-page aw-info-page"><div className="aw-page-head"><span className="eyebrow">AURA / МАТЕРИАЛЫ</span><h1>Фактура имеет <em>значение.</em></h1><p>Состав, плотность и уход указываются по документам поставщика для каждого изделия.</p></div>
    {Array.isArray(materials)&&materials.length?<div className="aw-material-grid">{materials.map(item=><article key={item.name}><Sparkles/><h2>{item.name}</h2><p>Состав: {item.composition||'уточняется'}</p><p>Плотность: {item.densityGsm?item.densityGsm+' г/м²':'уточняется'}</p><p>Уход: {item.care||'уточняется'}</p></article>)}</div>:<div className="aw-empty aw-info-empty"><Sparkles size={36}/><h2>Характеристики готовятся</h2><p>Не хотим обещать состав и плотность ткани, пока не получим данные от поставщика.</p></div>}
  </div>;
}
export function Reviews({gallery=false}:{gallery?:boolean}){
  const [reviews,setReviews]=useState<Review[]>([]),[loaded,setLoaded]=useState(false);
  useEffect(()=>{let live=true;void get(query(ref(getDatabase(firebaseApp),'reviews'),orderByChild('published'),equalTo(true))).then(snapshot=>{if(!live)return;setReviews(Object.entries(snapshot.val()||{}).map(([id,value])=>({id,...value as Omit<Review,'id'>})).filter(item=>item.published&&item.verifiedPurchase&&item.rating>=1&&item.rating<=5&&!!item.text));setLoaded(true)}).catch(()=>{if(live)setLoaded(true)});return()=>{live=false}},[]);
  const photographed=reviews.filter(item=>item.photoConsent&&Array.isArray(item.photos)&&item.photos.some(imageUrl));
  return <div className="container aw-page aw-info-page"><div className="aw-page-head"><span className="eyebrow">AURA / {gallery?'ГАЛЕРЕЯ':'ОТЗЫВЫ'}</span><h1>{gallery?'Ваши образы.':'Ваши слова.'} <em>AURA.</em></h1><p>{gallery?'Здесь появятся фотографии покупателей, давших разрешение на публикацию.':'Подтверждённые отзывы покупателей появятся здесь. Ниже показаны тексты, предоставленные для оформления сайта.'}</p></div>
    {!gallery && <SampleReviews/>}
    {gallery ? (!loaded?<p role="status">Загружаем фотографии…</p>:photographed.length?<div className="aw-review-grid">{photographed.flatMap(item=>(item.photos||[]).filter(imageUrl).map(photo=><figure key={item.id+photo}><img src={photo} alt={'Фото покупателя: '+(item.productName||'изделие Aura Wear')} loading="lazy"/><figcaption>{item.productName||'Aura Wear'}</figcaption></figure>))}</div>:<EmptyReviews gallery/>) : <section className="aw-verified-reviews"><h2>Отзывы покупателей</h2>{!loaded?<p role="status">Загружаем отзывы…</p>:reviews.length?<div className="aw-review-grid">{reviews.map(item=><article key={item.id} className="aw-review-card"><div className="aw-rating" aria-label={'Оценка '+item.rating+' из 5'}>{'★'.repeat(item.rating)}{'☆'.repeat(5-item.rating)}</div><p>«{item.text}»</p><small>{item.displayName||'Покупатель'}{item.productName?' · '+item.productName:''}</small></article>)}</div>:<p>Подтверждённых отзывов пока нет. Они появятся после первых покупок.</p>}</section>}
  </div>;
}
function EmptyReviews({gallery=false}:{gallery?:boolean}){return <div className="aw-review-empty"><figure><img src={assetUrl('images/editorial-model.webp')} alt="Редакционный образ Aura Wear, не фотография покупателя"/><figcaption>Редакционная съёмка / Aura Wear</figcaption></figure><div><span className="eyebrow">НАСТОЯЩИЕ ИСТОРИИ</span><Heart size={34}/><h2>{gallery?'Фотографии появятся здесь.':'Первые отзывы ещё впереди.'}</h2><p>Мы публикуем только отзывы после подтверждённой покупки. Фото добавляем с разрешения автора. Пока таких материалов нет.</p><a className="button button-lime" href="#/catalog">Посмотреть коллекцию</a></div></div>}
