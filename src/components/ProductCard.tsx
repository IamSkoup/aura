'use client';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight,Heart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { money } from '@/lib/types';
import { useFavorites } from '@/store/favorites';
export function ProductCard({product}:{product:Product}){const isFavorite=useFavorites(s=>s.ids.includes(product.id));const toggle=useFavorites(s=>s.toggle);return <article className="product-card"><div className="product-visual"><Link href={`/product/${product.id}`} aria-label={`Открыть ${product.name}`}><Image src={product.image} alt={product.name} fill sizes="(max-width:700px) 100vw, 33vw" style={{objectFit:'contain'}}/></Link><span className="product-chip">CUSTOM READY</span><button className={'favorite-button'+(isFavorite?' selected':'')} aria-label={isFavorite?'Удалить из избранного':'Добавить в избранное'} onClick={()=>toggle(product.id)}><Heart size={18} fill={isFavorite?'currentColor':'none'}/></button></div><div className="product-meta"><div><span className="eyebrow">{product.category}</span><h3><Link href={`/product/${product.id}`}>{product.name}</Link></h3></div><strong>{money(product.priceRub)}</strong></div><div className="product-bottom"><div className="swatches">{product.colors.map(c=><span key={c.name} title={c.name} style={{background:c.hex}}/>)}</div><Link href={`/studio?product=${product.id}`} className="product-action">Создать дизайн <ArrowUpRight size={16}/></Link></div></article>}
