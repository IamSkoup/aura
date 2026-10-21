'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowRight,Minus,Plus,Trash2} from 'lucide-react';
import {useCart} from '@/store/cart';
import {useAuth} from '@/components/AuthProvider';
import {api} from '@/lib/firebase-client';
import type {Design,DesignTemplate,Product} from '@/lib/types';
import {money} from '@/lib/types';

export default function CartPage(){
  const {lines,remove,quantity}=useCart(),{user}=useAuth();
  const [products,setProducts]=useState<Product[]>([]),[designs,setDesigns]=useState<Design[]>([]),[templates,setTemplates]=useState<DesignTemplate[]>([]),[error,setError]=useState('');
  useEffect(()=>{api<{items:Product[]}>('/api/products?limit=48').then(r=>setProducts(r.items)).catch(e=>setError((e as Error).message))},[]);
  useEffect(()=>{api<{items:DesignTemplate[]}>('/api/templates').then(r=>setTemplates(r.items)).catch(()=>{})},[]);
  useEffect(()=>{if(user)api<{items:Design[]}>('/api/designs').then(r=>setDesigns(r.items)).catch(e=>setError((e as Error).message))},[user]);
  const lineTotal=(line:typeof lines[number])=>{
    const p=products.find(p=>p.id===line.productId),d=designs.find(d=>d.id===line.designId);if(!p||!d)return null;
    const extras=[...new Set(d.layers.map(l=>l.areaId))].reduce((v,id)=>v+(p.printAreas.find(a=>a.id===id)?.extraPriceRub||0),0);
    return (p.priceRub+extras+(templates.find(t=>t.id===d.templateId)?.extraPriceRub||0))*line.quantity;
  };
  const total=lines.reduce((sum,line)=>sum+(lineTotal(line)||0),0);
  return <div className="container checkout-page"><div className="page-title"><span className="eyebrow">AURA / КОРЗИНА</span><h1>Твоя корзина<span>.</span></h1><p>{lines.length} проектов</p></div>
    {error&&<div className="error-box">{error}</div>}
    {!lines.length?<div className="empty-state"><h2>Пока здесь пусто.</h2><p>Создай свой первый дизайн — он появится в корзине.</p><Link className="button button-lime" href="/studio">Открыть конструктор <ArrowRight size={18}/></Link></div>:
      <div className="checkout-grid">
        <div className="cart-list">{lines.map(line=>{
          const p=products.find(p=>p.id===line.productId),d=designs.find(d=>d.id===line.designId),price=lineTotal(line);
          return <div className="cart-item" key={line.designId}>
            <div className="cart-image">{p?.image&&<Image src={p.image} alt={p.name} fill sizes="160px" style={{objectFit:'contain'}}/>}</div>
            <div className="cart-info"><span className="eyebrow">{p?.category||'ИЗДЕЛИЕ'}</span><h3>{p?.name||'Загрузка товара…'}</h3>
              <p>{d?`${d.color} / ${d.size} / ${d.title}`:'Загрузка дизайна…'}</p><Link href={`/studio?product=${line.productId}&design=${line.designId}`}>Редактировать макет</Link>
              <div className="quantity"><button aria-label="Уменьшить" onClick={()=>quantity(line.designId,line.quantity-1)}><Minus size={14}/></button><span>{line.quantity}</span><button aria-label="Увеличить" onClick={()=>quantity(line.designId,line.quantity+1)}><Plus size={14}/></button></div>
            </div>
            <div className="cart-end"><strong>{price===null?'—':money(price)}</strong><button onClick={()=>remove(line.designId)} aria-label="Удалить"><Trash2 size={18}/></button></div>
          </div>;
        })}</div>
        <aside className="order-summary"><span className="eyebrow">ВАШ ЗАКАЗ</span><h2>Итого</h2><div><span>Товары</span><strong>{money(total)}</strong></div><div><span>Доставка</span><strong>Уточняется</strong></div><div className="summary-total"><span>Предварительная сумма</span><strong>{money(total)}</strong></div><p>Доставка рассчитывается при оформлении. Макет будет проверен перед печатью.</p>
          {user?<Link className="button button-lime full" href="/checkout">Оформить заказ <ArrowRight size={18}/></Link>:<Link className="button button-lime full" href="/login?next=/checkout">Войти для оформления <ArrowRight size={18}/></Link>}
        </aside>
      </div>}
  </div>;
}
