'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {ArrowUpRight} from 'lucide-react';
import {api} from '@/lib/firebase-client';
import {useAuth} from '@/components/AuthProvider';
import {starterPrints} from '@/lib/catalog-data';
import type {DesignTemplate,Product} from '@/lib/types';
import {money} from '@/lib/types';
const categories=['Все','Мемы','Цитаты','Минимализм','Аниме','Абстракция','Типографика','Праздники','Авторские коллекции'];

export default function PrintsPage(){
  const {user}=useAuth(),[items,setItems]=useState<DesignTemplate[]>([]),[products,setProducts]=useState<Product[]>([]);
  const [category,setCategory]=useState('Все'),[choices,setChoices]=useState<Record<string,string>>({});
  useEffect(()=>{
    api<{items:DesignTemplate[]}>('/api/templates').then(r=>setItems(r.items)).catch(()=>{});
    api<{items:Product[]}>('/api/products?limit=48').then(r=>setProducts(r.items)).catch(()=>{});
  },[]);
  const starter=starterPrints.filter(p=>category==='Все'||p.category===category);
  const dynamic=items.filter(p=>category==='Все'||p.category===category);
  return <div><div className="page-banner"><div className="container"><span className="eyebrow">AURA / КОЛЛЕКЦИЯ ПРИНТОВ</span><h1>Готовые идеи.<br/><em>Твой почерк.</em></h1><p>Выбери принт и настрой его под себя — цвет, размер и надпись можно изменить в конструкторе.</p></div></div>
    <div className="container section"><div className="print-categories">{categories.map(c=><button key={c} className={category===c?'active':''} onClick={()=>setCategory(c)}>{c}</button>)}</div>
      {starter.length+dynamic.length>0?<div className="product-grid">
        {starter.map(p=><article className="starter-print-card" key={p.id}><div className="starter-print-art"><strong>{p.title}</strong></div><div className="starter-print-info"><span className="eyebrow">{p.category}</span><h3>{p.title}</h3><p>{p.description}</p><Link className="button button-dark" href={`/studio?starterPrint=${encodeURIComponent(p.id)}`}>Настроить принт <ArrowUpRight size={16}/></Link></div></article>)}
        {dynamic.map(t=>{const compatible=products.filter(p=>t.compatibleProductIds.includes(p.id)),selected=choices[t.id]||compatible[0]?.id;const target=`/studio?product=${encodeURIComponent(selected||'')}&template=${encodeURIComponent(t.id)}`;return <article className="template-card" key={t.id}><div className="template-image"><Image src={t.image} alt={t.title} fill sizes="(max-width:700px) 100vw, 33vw" style={{objectFit:'contain'}}/></div><span className="eyebrow">{t.category}</span><h3>{t.title}</h3><p>{t.description}</p><strong>+{money(t.extraPriceRub)}</strong><label>Изделие<select value={selected||''} onChange={e=>setChoices({...choices,[t.id]:e.target.value})}>{compatible.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>{selected&&(user?<Link className="button button-dark full" href={target}>Открыть в конструкторе <ArrowUpRight size={16}/></Link>:<Link className="button button-dark full" href={`/login?next=${encodeURIComponent(target)}`}>Войти и создать <ArrowUpRight size={16}/></Link>)}</article>})}
      </div>:<div className="empty-state"><h2>Здесь пока пусто.</h2><p>Попробуй другую категорию.</p><Link className="button button-lime" href="/studio">Создать собственный принт</Link></div>}
    </div></div>;
}
