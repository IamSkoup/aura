'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, Heart, Menu, ShoppingBag, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { useCart } from '@/store/cart';
const nav=[['Коллекция','/catalog'],['Конструктор','/studio'],['Готовые дизайны','/prints'],['О бренде','/info/about']];
export function Shell({children}:{children:React.ReactNode}){const [open,setOpen]=useState(false);const {user}=useAuth();const count=useCart(s=>s.lines.reduce((n,l)=>n+l.quantity,0));const pathname=usePathname();return <>
 <div className="topline"><span>СОЗДАВАЙ. НОСИ. ПОВТОРЯЙ.</span><span>Индивидуальный стиль начинается здесь <ArrowUpRight size={13}/></span></div>
 <header className="site-header"><div className="header-inner"><Link href="/" className="brand" aria-label="Aura Wear — главная">AURA<span className="brand-dot">.</span><small>WEAR</small></Link><nav className={open?'nav-links open':'nav-links'} aria-label="Главная навигация">{nav.map(([label,href])=><Link key={href} href={href} className={pathname===href?'active':''} onClick={()=>setOpen(false)}>{label}</Link>)}</nav><div className="header-actions"><Link aria-label="Избранное" href="/account/favorites"><Heart size={20}/></Link><Link aria-label="Личный кабинет" href={user?'/account':'/login'}><UserRound size={20}/></Link><Link aria-label={`Корзина, товаров: ${count}`} href="/cart" className="bag-link"><ShoppingBag size={20}/>{count>0&&<b>{count}</b>}</Link><button className="icon-button mobile-menu" aria-label={open?'Закрыть меню':'Открыть меню'} onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}</button></div></div></header>
 <main id="main">{children}</main>
 <footer className="footer"><div className="container footer-top"><div><Link href="/" className="brand footer-brand">AURA<span className="brand-dot">.</span><small>WEAR</small></Link><p>Создавай вещи, которые говорят за тебя.</p></div><div><strong>Магазин</strong><Link href="/catalog">Каталог</Link><Link href="/studio">Конструктор</Link><Link href="/prints">Готовые дизайны</Link><Link href="/cart">Корзина</Link></div><div><strong>Помощь</strong><Link href="/info/sizes">Размеры</Link><Link href="/info/materials">Материалы и уход</Link><Link href="/info/delivery">Доставка и оплата</Link><Link href="/info/faq">FAQ</Link></div><div><strong>О нас</strong><Link href="/info/about">Бренд</Link><Link href="/info/contacts">Контакты</Link><Link href="/info/legal">Правовая информация</Link><Link href="/info/reviews">Отзывы</Link></div></div><div className="container footer-bottom"><span>© {new Date().getFullYear()} Aura Wear</span><span>Сделано для твоих идей</span></div></footer>
 </>}
