import {NextRequest} from 'next/server';
import {db,adminFromRequest} from '@/lib/firebase-admin';
import {fail,json} from '@/lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{await adminFromRequest(req);const snap=await db().ref('reviews').get();return json({items:Object.values(snap.val()||{})})}catch(e){return fail(e)}}
