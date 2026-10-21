'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AdminGuard} from '@/components/AdminGuard';
import {useAuth} from '@/components/AuthProvider';
import {api} from '@/lib/firebase-client';
import {money} from '@/lib/types';
export default function Admin(){const {user}=useAuth();const [stats,setStats]=useState({orders:0,pending:0,confirmedRevenueRub:0,production:0}),[error,setError]=useState('');useEffect(()=>{if(user)api<typeof stats>('/api/admin/summary').then(setStats).catch(e=>setError(e.message))},[user]);return <AdminGuard><div className="admin-head"><span className="eyebrow">AURA / ADMIN</span><h1>Панель управления.</h1><p>Здесь отображаются данные только подтверждённых заказов и сохранённых товаров.</p></div>{error&&<div className="error-box">{error}</div>}<div className="stat-grid"><div><span>Всего заказов</span><strong>{stats.orders}</strong></div><div><span>Ожидают обработки</span><strong>{stats.pending}</strong></div><div><span>Подтверждённая выручка</span><strong>{money(stats.confirmedRevenueRub)}</strong></div><div><span>В производстве</span><strong>{stats.production}</strong></div></div><div className="admin-links"><Link href="/admin/orders">Управлять заказами →</Link><Link href="/admin/products">Управлять каталогом →</Link></div></AdminGuard>}
