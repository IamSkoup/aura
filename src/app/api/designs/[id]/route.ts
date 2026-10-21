import { NextRequest } from 'next/server';
import { db,userFromRequest } from '@/lib/firebase-admin';
import { fail,json } from '@/lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const u=await userFromRequest(req);const {id}=await params;const snap=await db().ref(`userDesigns/${u.uid}/${id}`).get();if(!snap.exists())throw new Error('Проект не найден');return json({design:snap.val()});}catch(e){return fail(e,404)}}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const u=await userFromRequest(req);const {id}=await params;await db().ref(`userDesigns/${u.uid}/${id}`).remove();return json({ok:true});}catch(e){return fail(e)}}
