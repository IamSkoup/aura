'use client';
import {Suspense,useEffect,useState} from 'react';
import {useSearchParams} from 'next/navigation';
import {DesignEditor} from '@/components/DesignEditor';
import {api} from '@/lib/firebase-client';
import type {Product} from '@/lib/types';
import Link from 'next/link';
function Studio(){const params=useSearchParams();const [product,setProduct]=useState<Product|null>(null),[error,setError]=useState('');useEffect(()=>{api<{items:Product[]}>('/api/products?limit=48').then(r=>{const p=r.items.find(x=>x.id===(params.get('product')||'tee-01'))||r.items.find(x=>x.model);if(!p)throw new Error('Для конструктора пока нет опубликованного товара');setProduct(p)}).catch(e=>setError(e.message))},[params]);if(error)return <div className="container section empty-state"><h1>Конструктор пока недоступен</h1><p>{error}</p><Link href="/catalog" className="button button-dark">Вернуться в каталог</Link></div>;if(!product)return <div className="skeleton stage-skeleton"/>;return <DesignEditor product={product} designId={params.get('design')||undefined} templateId={params.get('template')||undefined} starterPrint={params.get('starterPrint')||undefined}/>}
export default function StudioPage(){return <Suspense fallback={<div className="skeleton stage-skeleton"/>}><Studio/></Suspense>}
