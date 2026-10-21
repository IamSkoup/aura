import { NextRequest } from 'next/server';
import { db,adminFromRequest } from '@/lib/firebase-admin';
import { fail,json } from '@/lib/server';
import type { Order } from '@/lib/types';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{await adminFromRequest(req);const snap=await db().ref('orders').get();return json({items:(Object.values(snap.val()||{}) as Order[]).sort((a,b)=>b.createdAt-a.createdAt)});}catch(e){return fail(e)}}
