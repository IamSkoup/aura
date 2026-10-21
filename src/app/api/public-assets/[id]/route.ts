import {NextRequest,NextResponse} from 'next/server';
import {db} from '@/lib/firebase-admin';
import {getAsset} from '@/lib/storage';
import {fail} from '@/lib/server';
import type {Product,DesignTemplate} from '@/lib/types';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const asset=(await db().ref(`publicAssets/${id}`).get()).val();if(!asset)throw new Error('Изображение не найдено');const products=Object.values((await db().ref('products').get()).val()||{}) as Product[];const templates=Object.values((await db().ref('designTemplates').get()).val()||{}) as DesignTemplate[];const publicUse=products.some(p=>p.published&&p.image===`/api/public-assets/${id}`)||templates.some(t=>t.published&&t.image===`/api/public-assets/${id}`);if(!publicUse)throw new Error('Изображение не опубликовано');const data=await getAsset(asset.key);return new NextResponse(new Uint8Array(data),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}});}catch(e){return fail(e,404)}}
