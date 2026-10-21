'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {Heart,LayoutDashboard,Package,Palette} from 'lucide-react';
export function AccountNav(){const path=usePathname();const items=[['Профиль','/account',LayoutDashboard],['Мои заказы','/account/orders',Package],['Мои дизайны','/account/designs',Palette],['Избранное','/account/favorites',Heart]] as const;return <nav className="account-nav" aria-label="Личный кабинет">{items.map(([label,url,Icon])=><Link key={url} href={url} className={path===url?'active':''}><Icon size={17}/>{label}</Link>)}</nav>}
