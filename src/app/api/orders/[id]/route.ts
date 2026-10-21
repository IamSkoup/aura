import { NextRequest } from 'next/server';
import { db,userFromRequest } from '@/lib/firebase-admin';
import { fail,json } from '@/lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const u=await userFromRequest(req);const {id}=await params;const snap=await db().ref(`orders/${id}`).get();const order=snap.val();if(!order||order.userId!==u.uid)throw new Error('Заказ не найден');return json({order});}catch(e){return fail(e,404)}}
