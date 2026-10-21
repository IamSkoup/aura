'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AccountGuard} from '@/components/AccountGuard';
import {ProductCard} from '@/components/ProductCard';
import {useFavorites} from '@/store/favorites';
import {api} from '@/lib/firebase-client';
import type {Product} from '@/lib/types';
export default function Favorites(){const ids=useFavorites(s=>s.ids);const [products,setProducts]=useState<Product[]>([]);useEffect(()=>{api<{items:Product[]}>('/api/products?limit=48').then(r=>setProducts(r.items)).catch(()=>{})},[]);const shown=products.filter(p=>ids.includes(p.id));return <AccountGuard title="Избранное.">{shown.length?<div className="product-grid">{shown.map(p=><ProductCard key={p.id} product={p}/>)}</div>:<div className="empty-state"><h2>Пока нет избранного.</h2><p>Отмечай изделия сердцем в каталоге.</p><Link className="button button-dark" href="/catalog">Смотреть каталог</Link></div>}</AccountGuard>}
