import {useEffect, useState} from 'react';
import type {User} from 'firebase/auth';
import {ArrowLeft, LockKeyhole} from 'lucide-react';
import type {Design, Product} from '@/lib/types';
import {money} from '@/lib/types';
import {useCart} from '@/store/cart';
import {demoTee} from './catalog';
import {loadDesign} from './local-data';
import {estimateUnitPrice} from './pricing';

export function Checkout({products, user, authReady}: {products: Product[]; user: User | null; authReady: boolean}) {
  const allLines = useCart(state => state.lines);
  const lines = allLines.filter(line => !!user && line.ownerId === user.uid);
  const [error, setError] = useState(false);
  const [designs, setDesigns] = useState<Record<string, Design | null>>({});
  useEffect(() => {if (!user) return; let active=true; void Promise.all(lines.map(async line => [line.designId, await loadDesign(line.designId)] as const)).then(pairs=>{if(active)setDesigns(Object.fromEntries(pairs));}).catch(()=>{}); return()=>{active=false};},[allLines, user]);
  const total = lines.reduce((sum, line) => sum + line.quantity * estimateUnitPrice(products.find(product => product.id === line.productId) || demoTee, designs[line.designId]), 0);
  const example = lines.some(line => (products.find(product => product.id === line.productId) || demoTee).previewOnly);
  if (!authReady) return <div className="container aw-page aw-empty" role="status">Загружаем оформление…</div>;
  if (!user) return <div className="container aw-page aw-empty"><h1>Войдите, чтобы продолжить</h1><a className="button button-lime" href="#/login">Войти</a></div>;
  if (!lines.length) return <div className="container aw-page aw-empty"><h1>Корзина пуста</h1><a className="button button-lime" href="#/catalog">Выбрать товар</a></div>;
  return <div className="container aw-page aw-checkout"><div className="aw-page-head"><span className="eyebrow">AURA / ОФОРМЛЕНИЕ</span><h1>Последний <em>шаг.</em></h1><p>Проверьте состав корзины и заполните данные для доставки. Онлайн-оплата пока не подключена; введённые данные никуда не отправятся.</p></div>
    <div className="aw-checkout-grid"><form onSubmit={event => {event.preventDefault(); setError(true);}}><h2>Получатель</h2><div className="aw-checkout-fields"><label>Имя<input autoComplete="name" required placeholder="Ваше имя"/></label><label>Телефон<input autoComplete="tel" type="tel" required placeholder="+7 900 000-00-00"/></label><label>Email<input autoComplete="email" type="email" required placeholder="name@example.com"/></label><label>Город<input autoComplete="address-level2" required placeholder="Ваш город"/></label><label className="wide">Адрес или пункт выдачи<input autoComplete="street-address" required placeholder="Улица, дом или адрес пункта выдачи"/></label><label className="wide">Комментарий<textarea rows={3} placeholder="Пожелания к заказу"/></label></div><h2>Доставка и оплата</h2><p>Способ и стоимость доставки подтвердит продавец после подключения оформления. Онлайн-оплата пока не принимается.</p><button className="button button-lime full" type="submit"><LockKeyhole size={17}/> Перейти к оплате</button><a className="aw-checkout-back" href="#/cart"><ArrowLeft size={15}/> Вернуться в корзину</a>
      {error && <div className="aw-payment-error" role="alert"><strong>Оплата пока не подключена</strong><p>Заказ не создан и деньги не списаны. Онлайн-покупки станут доступны после подключения платёжного сервиса.</p><a href="https://github.com/IamSkoup/aura#как-подключить-юkassa-и-настоящие-заказы" target="_blank" rel="noreferrer">Инструкция по подключению оплаты ↗</a></div>}</form>
    <aside className="aw-cart-summary"><span className="eyebrow">ВАШ ЗАКАЗ</span><h2>{lines.reduce((n, line) => n + line.quantity, 0)} {lines.length === 1 ? 'позиция' : 'товара'}</h2>{lines.map(line => {const product = products.find(item => item.id === line.productId) || demoTee; return <div className="aw-checkout-line" key={line.designId}><span>{product.name} × {line.quantity}</span><strong>{money(estimateUnitPrice(product, designs[line.designId]) * line.quantity)}</strong></div>;})}<div className="aw-checkout-total"><span>Итого{example ? ' · пример' : ''}</span><strong>{money(total)}</strong></div><p>Точная цена, доставка и наличие подтверждаются до оплаты.</p></aside></div>
  </div>;
}
