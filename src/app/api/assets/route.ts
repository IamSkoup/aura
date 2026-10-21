import { NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import { db,userFromRequest } from '@/lib/firebase-admin';
import { putAsset } from '@/lib/storage';
import {rateLimit} from '@/lib/rate-limit';
import { fail,json } from '@/lib/server';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{
 const u=await userFromRequest(req);await rateLimit(u.uid,'upload',15,60_000);const form=await req.formData();const file=form.get('file');if(!(file instanceof File))throw new Error('Выберите файл');
 if(file.size>8*1024*1024)throw new Error('Максимум 8 МБ');
 const bytes=Buffer.from(await file.arrayBuffer());
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const jpg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 const webp=bytes.toString('ascii',0,4)==='RIFF'&&bytes.toString('ascii',8,12)==='WEBP';
 if(!png&&!jpg&&!webp)throw new Error('Поддерживаются PNG, JPG и WebP');
 const image=sharp(bytes,{limitInputPixels:40_000_000,failOn:'error'});const meta=await image.metadata();
 if(!meta.width||!meta.height||meta.width<100||meta.height<100)throw new Error('Изображение слишком маленькое');
 const normalized=await image.rotate().png({compressionLevel:9}).toBuffer();const normalizedMeta=await sharp(normalized).metadata();
 const id=randomUUID();const key=`assets/${u.uid}/${id}.png`;await putAsset(key,normalized);
 await db().ref(`assets/${id}`).set({id,key,ownerId:u.uid,width:normalizedMeta.width,height:normalizedMeta.height,name:file.name.slice(0,120),createdAt:Date.now()});
 return json({asset:{assetId:id,url:`/api/assets/${id}`,width:normalizedMeta.width,height:normalizedMeta.height,name:file.name.slice(0,120)}});
}catch(e){return fail(e)}}
