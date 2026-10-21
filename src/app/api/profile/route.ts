import {NextRequest} from 'next/server';
import {db,userFromRequest} from '@/lib/firebase-admin';
import {fail,json} from '@/lib/server';
import {z} from 'zod';
const schema=z.object({name:z.string().max(100),phone:z.string().max(25),addresses:z.array(z.object({city:z.string().max(100),address:z.string().max(300)})).max(5)});
export const runtime='nodejs';
export async function GET(req:NextRequest){try{const u=await userFromRequest(req);const snap=await db().ref(`users/${u.uid}`).get();return json({profile:snap.val()||{name:u.name||'',email:u.email||'',phone:'',addresses:[]}})}catch(e){return fail(e)}}
export async function PATCH(req:NextRequest){try{const u=await userFromRequest(req);const data=schema.parse(await req.json());const profile={...data,email:u.email,updatedAt:Date.now()};await db().ref(`users/${u.uid}`).set(profile);return json({profile})}catch(e){return fail(e)}}
