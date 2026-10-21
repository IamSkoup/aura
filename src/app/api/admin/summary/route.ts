import { NextRequest } from 'next/server';
import { db,adminFromRequest } from '@/lib/firebase-admin';
import { fail,json } from '@/lib/server';
import type { Order } from '@/lib/types';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{await adminFromRequest(req);const snap=await db().ref('orders').get();const orders=Object.values(snap.val()||{}) as Order[];return json({orders:orders.length,pending:orders.filter(o=>o.status==='pending_payment'||o.status==='artwork_review').length,confirmedRevenueRub:orders.filter(o=>['paid','artwork_review','production','ready','shipped','delivered'].includes(o.status)&&!!o.payment?.confirmedAt&&!o.payment.test).reduce((s,o)=>s+o.totalRub,0),production:orders.filter(o=>o.status==='production').length});}catch(e){return fail(e)}}
