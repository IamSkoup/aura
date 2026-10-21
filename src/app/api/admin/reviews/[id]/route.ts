import {NextRequest} from 'next/server';
import {z} from 'zod';
import {db,adminFromRequest} from '@/lib/firebase-admin';
import {fail,json} from '@/lib/server';
export const runtime='nodejs';
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await adminFromRequest(req);const {id}=await params;const {action}=z.object({action:z.enum(['publish','reject'])}).parse(await req.json());const ref=db().ref(`reviews/${id}`);const snap=await ref.get();if(!snap.exists())throw new Error('Отзыв не найден');await ref.update({published:action==='publish',rejected:action==='reject',moderatedAt:Date.now()});return json({ok:true})}catch(e){return fail(e)}}
