import { NextRequest,NextResponse } from 'next/server';
import { db,userFromRequest } from '@/lib/firebase-admin';
import { getAsset } from '@/lib/storage';
import { fail } from '@/lib/server';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{
 const {id}=await params;let u:Awaited<ReturnType<typeof userFromRequest>>|null=null;try{u=await userFromRequest(req)}catch{}const asset=(await db().ref(`assets/${id}`).get()).val();
 if(!asset)throw new Error('Файл не найден');let permitted=asset.ownerId===u?.uid||u?.admin===true;if(!permitted){const reviews=Object.values((await db().ref('reviews').get()).val()||{}) as {published:boolean;consentPhotos:boolean;photoAssetIds?:string[]}[];permitted=reviews.some(r=>r.published&&r.consentPhotos&&r.photoAssetIds?.includes(id))}if(!permitted)throw new Error('Файл не найден');
 const data=await getAsset(asset.key);
 return new NextResponse(new Uint8Array(data),{headers:{'Content-Type':'image/png','Cache-Control':u?'private, max-age=600':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});
}catch(e){return fail(e,404)}}
