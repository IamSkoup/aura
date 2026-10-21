'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useAuth} from '@/components/AuthProvider';
import {useCart} from '@/store/cart';
import {api} from '@/lib/firebase-client';
import type {Order} from '@/lib/types';

export default function CheckoutPage(){
  const {user,loading}=useAuth(),cart=useCart(),router=useRouter();
  const [paymentProvider,setPaymentProvider]=useState('none'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[consent,setConsent]=useState(false);
  const [form,setForm]=useState({name:'',email:'',phone:'',city:'',address:'',comment:'',deliveryMethod:'courier'});
  useEffect(()=>{api<{provider:string}>('/api/payment-settings').then(r=>setPaymentProvider(r.provider)).catch(()=>{})},[]);
  useEffect(()=>{if(!loading&&!user)router.push('/login?next=/checkout');if(user)setForm(f=>({...f,name:user.displayName||f.name,email:user.email||f.email}))},[user,loading,router]);
  const update=(key:string,value:string)=>setForm(f=>({...f,[key]:value}));
  const submit=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');
    if(!consent){setError('Подтверди согласие с документами магазина');return}
    if(paymentProvider!=='yookassa'){setError('Онлайн-оплата пока не подключена. Оформить и оплатить заказ сейчас нельзя.');return}
    setBusy(true);
    try{
      const r=await api<{order:Order}>('/api/orders',{method:'POST',body:JSON.stringify({lines:cart.lines,contact:{name:form.name,email:form.email,phone:form.phone,city:form.city,address:form.address,comment:form.comment},deliveryMethod:form.deliveryMethod,paymentMethod:'yookassa'})});
      const payment=await api<{url:string}>('/api/payments/create',{method:'POST',body:JSON.stringify({orderId:r.order.id})});
      cart.clear();window.location.assign(payment.url);
    }catch(e){setError((e as Error).message)}finally{setBusy(false)}
  };
  if(!cart.lines.length)return <div className="container section empty-state"><h1>Корзина пуста</h1><Link href="/catalog" className="button button-lime">В каталог</Link></div>;
  return <div className="container checkout-page"><div className="page-title"><span className="eyebrow">AURA / ОФОРМЛЕНИЕ</span><h1>Твой заказ<span>.</span></h1><p>Проверь данные доставки. Финальная сумма будет показана до подтверждения оплаты.</p></div>
    <form className="checkout-form" onSubmit={e=>void submit(e)}>
      <div className="form-section"><span className="eyebrow">01 / КОНТАКТЫ</span><div className="form-grid">
        <label>Имя<input required minLength={2} value={form.name} onChange={e=>update('name',e.target.value)}/></label>
        <label>Email<input required type="email" value={form.email} onChange={e=>update('email',e.target.value)}/></label>
        <label>Телефон<input required type="tel" minLength={7} value={form.phone} onChange={e=>update('phone',e.target.value)}/></label>
        <label>Город<input required minLength={2} value={form.city} onChange={e=>update('city',e.target.value)}/></label>
      </div></div>
      <div className="form-section"><span className="eyebrow">02 / ДОСТАВКА</span><div className="segmented">
        <button type="button" className={form.deliveryMethod==='courier'?'active':''} onClick={()=>update('deliveryMethod','courier')}>Курьер</button>
        <button type="button" className={form.deliveryMethod==='pickup'?'active':''} onClick={()=>update('deliveryMethod','pickup')}>Пункт выдачи</button>
      </div><label>{form.deliveryMethod==='courier'?'Адрес доставки':'Адрес пункта выдачи'}<input required minLength={5} value={form.address} onChange={e=>update('address',e.target.value)}/></label>
        <label>Комментарий к заказу<textarea value={form.comment} onChange={e=>update('comment',e.target.value)}/></label></div>
      <div className="form-section"><span className="eyebrow">03 / ОПЛАТА</span><p>Оплата банковской картой на защищённой странице после подтверждения заказа.</p></div>
      <label className="check-label"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> Согласен с <Link href="/info/legal">условиями покупки и обработкой персональных данных</Link></label>
      {error&&<p role="alert" className="error-box">{error}</p>}
      <button className="button button-lime" disabled={busy||!user} onClick={()=>{if(paymentProvider!=='yookassa')setError('Онлайн-оплата пока не подключена. Оформить заказ сейчас нельзя.')}}>{busy?'Переходим к оплате…':'Оформить заказ'}</button>
    </form>
  </div>;
}
