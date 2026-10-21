'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {Copy,Trash2} from 'lucide-react';
import {AccountGuard} from '@/components/AccountGuard';
import {useAuth} from '@/components/AuthProvider';
import {api} from '@/lib/firebase-client';
import type {Design} from '@/lib/types';

export default function DesignsPage(){
  const {user}=useAuth(),[items,setItems]=useState<Design[]>([]),[error,setError]=useState('');
  const refresh=()=>api<{items:Design[]}>('/api/designs').then(r=>setItems(r.items)).catch(e=>setError((e as Error).message));
  useEffect(()=>{if(user)void refresh()},[user]);
  const duplicate=async(design:Design)=>{try{await api('/api/designs',{method:'POST',body:JSON.stringify({...design,id:undefined,title:design.title+' — копия'})});await refresh()}catch(e){setError((e as Error).message)}};
  const remove=async(id:string)=>{if(!confirm('Удалить проект?'))return;try{await api(`/api/designs/${id}`,{method:'DELETE'});await refresh()}catch(e){setError((e as Error).message)}};
  return <AccountGuard title="Мои проекты.">
    {error&&<p role="alert" className="error-box">{error}</p>}
    {items.length?<div className="design-list">{items.map(d=><article key={d.id} className="design-card">
      <div className="design-thumb" style={{background:/^#[0-9a-fA-F]{6}$/.test(d.color)?d.color:d.color==='Графит'?'#262829':'#dedfd9'}}>
        <Image src="/images/aura-tee.png" alt="Предпросмотр изделия" fill sizes="130px" />
        <span>{d.layers.length} слоёв</span>
      </div>
      <div><span className="eyebrow">{new Date(d.updatedAt).toLocaleDateString('ru-RU')}</span><h3>{d.title}</h3><p>{d.color} / {d.size}</p><Link href={`/studio?product=${d.productId}&design=${d.id}`}>Продолжить редактирование</Link></div>
      <div className="design-actions"><button aria-label="Дублировать" onClick={()=>void duplicate(d)}><Copy size={17}/></button><button aria-label="Удалить" onClick={()=>void remove(d.id)}><Trash2 size={17}/></button></div>
    </article>)}</div>:<div className="empty-state"><h2>Здесь появятся твои идеи.</h2><p>Сохрани первый макет в конструкторе.</p><Link className="button button-dark" href="/studio">Открыть конструктор</Link></div>}
  </AccountGuard>;
}
