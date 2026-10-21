'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import {AdminGuard} from '@/components/AdminGuard';
import {useAuth} from '@/components/AuthProvider';
import {api} from '@/lib/firebase-client';
import type {Order} from '@/lib/types';
import {money,statusName} from '@/lib/types';
export default function AdminOrders(){const {user}=useAuth();const [items,setItems]=useState<Order[]>([]),[error,setError]=useState('');useEffect(()=>{if(user)api<{items:Order[]}>('/api/admin/orders').then(r=>setItems(r.items)).catch(e=>setError(e.message))},[user]);return <AdminGuard><div className="admin-head"><span className="eyebrow">ЗАКАЗЫ / AURA</span><h1>Все заказы.</h1></div>{error&&<div className="error-box">{error}</div>}{items.length?<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Номер</th><th>Покупатель</th><th>Дата</th><th>Статус</th><th>Сумма</th><th></th></tr></thead><tbody>{items.map(o=><tr key={o.id}><td>{o.number}</td><td>{o.contact.name}</td><td>{new Date(o.createdAt).toLocaleDateString('ru-RU')}</td><td><span className="status-pill">{statusName[o.status]}</span></td><td>{money(o.totalRub)}</td><td><Link href={`/admin/orders/${o.id}`}>Открыть →</Link></td></tr>)}</tbody></table></div>:<div className="empty-state"><h2>Заказов пока нет.</h2><p>Новые заказы появятся здесь сразу после оформления.</p></div>}</AdminGuard>}
