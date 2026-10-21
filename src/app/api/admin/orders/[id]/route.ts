import { NextRequest } from 'next/server';
import { db,adminFromRequest } from '@/lib/firebase-admin';
import { fail,json } from '@/lib/server';
import { z } from 'zod';
import type { Order } from '@/lib/types';
import {adminTransitions} from '@/lib/pricing';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await adminFromRequest(req);const {id}=await params;const order=(await db().ref(`orders/${id}`).get()).val();if(!order)throw new Error('Заказ не найден');return json({order});}catch(e){return fail(e,404)}}
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const admin=await adminFromRequest(req);const {id}=await params;const input=z.object({status:z.enum(['pending_payment','payment_failed','paid','artwork_review','production','ready','shipped','delivered','cancelled','refunded']).optional(),tracking:z.string().max(100).optional()}).parse(await req.json());let updated:Order|null=null;
 const result=await db().ref(`orders/${id}`).transaction((order:Order|null)=>{if(!order)return;if(input.status){if(!adminTransitions[order.status].includes(input.status))return;order.status=input.status;order.history.push({status:input.status,at:Date.now(),by:admin.uid});}if(input.tracking!==undefined)order.tracking=input.tracking;return order;});
 if(!result.committed)throw new Error('Переход статуса недоступен');updated=result.snapshot.val();return json({order:updated});
}catch(e){return fail(e)}}
