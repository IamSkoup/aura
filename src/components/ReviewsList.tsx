'use client';
import Image from 'next/image';
import {useEffect,useState} from 'react';
import {api} from '@/lib/firebase-client';

type Review={id:string;productId:string;rating:number;text:string;photoAssetIds:string[];createdAt:number;authorName:string};

export function ReviewsList({preview=false,photosOnly=false}:{preview?:boolean;photosOnly?:boolean}){
  const [items,setItems]=useState<Review[]>([]);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  useEffect(()=>{
    api<{items:Review[]}>('/api/reviews')
      .then(r=>setItems(r.items))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[]);
  if(loading)return <div className="skeleton stage-skeleton" aria-label="Загрузка отзывов"/>;
  if(error)return <p className="error-box">Отзывы пока недоступны.</p>;
  const visible=photosOnly?items.filter(r=>r.photoAssetIds?.length):items;
  if(!visible.length)return <p>{photosOnly?'Опубликованных фотографий покупателей пока нет.':'Опубликованных отзывов пока нет. Здесь появятся только отзывы после подтверждённой покупки и модерации.'}</p>;
  return <div className="reviews-grid">{visible.slice(0,preview?3:visible.length).map(r=><article className="review-card" key={r.id}>
    {!photosOnly&&<><div aria-label={`${r.rating} из 5`} className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</div><p>{r.text}</p></>}
    {r.photoAssetIds?.length>0&&<div className="review-photos">{r.photoAssetIds.map(id=><Image key={id} src={`/api/assets/${id}`} width={180} height={180} unoptimized alt="Фото товара от покупателя"/>)}</div>}
    <footer>{r.authorName} · {new Date(r.createdAt).toLocaleDateString('ru-RU')}</footer>
  </article>)}</div>;
}
