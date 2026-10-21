import {NextRequest} from 'next/server';
import {randomUUID} from 'crypto';
import sharp from 'sharp';
import {adminFromRequest,db} from '@/lib/firebase-admin';
import {putAsset} from '@/lib/storage';
import {fail,json} from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{const admin=await adminFromRequest(req);const form=await req.formData();const file=form.get('file');if(!(file instanceof File)||file.size>8*1024*1024)throw new Error('Выберите изображение до 8 МБ');const buf=Buffer.from(await file.arrayBuffer());const png=buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const jpg=buf[0]===255&&buf[1]===216&&buf[2]===255;const webp=buf.toString('ascii',0,4)==='RIFF'&&buf.toString('ascii',8,12)==='WEBP';if(!png&&!jpg&&!webp)throw new Error('Поддерживаются PNG, JPG, WebP');const image=sharp(buf,{limitInputPixels:40_000_000,failOn:'error'});const data=await image.rotate().png().toBuffer();const meta=await sharp(data).metadata();const id=randomUUID(),key=`public-assets/${id}.png`;await putAsset(key,data);await db().ref(`publicAssets/${id}`).set({id,key,uploadedBy:admin.uid,name:file.name.slice(0,120),width:meta.width,height:meta.height,createdAt:Date.now()});return json({url:`/api/public-assets/${id}`,id});}catch(e){return fail(e)}}
