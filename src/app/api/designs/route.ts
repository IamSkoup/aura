import { NextRequest } from 'next/server';
import { db, userFromRequest } from '@/lib/firebase-admin';
import { designSchema, validLayerBounds } from '@/lib/validation';
import { fail,json } from '@/lib/server';
import type { Design,DesignTemplate, Product } from '@/lib/types';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{const u=await userFromRequest(req);const snap=await db().ref(`userDesigns/${u.uid}`).get();return json({items:Object.values(snap.val()||{})});}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{
 const u=await userFromRequest(req);const input=designSchema.parse(await req.json());
 const product=(await db().ref(`products/${input.productId}`).get()).val() as Product|null;
 if(!product?.published)throw new Error('Товар недоступен');
 if(input.templateId){const template=(await db().ref(`designTemplates/${input.templateId}`).get()).val() as DesignTemplate|null;if(!template?.published||!template.compatibleProductIds.includes(product.id))throw new Error('Готовый принт недоступен')}
 if(!(product.colors.some(c=>c.name===input.color)||/^#[0-9a-fA-F]{6}$/.test(input.color))||!product.sizes.includes(input.size))throw new Error('Недоступный цвет или размер');
 for(const layer of input.layers){
  if(!product.printAreas.some(a=>a.id===layer.areaId))throw new Error('Недоступная область печати');
  if(!validLayerBounds(layer))throw new Error('Слой выходит за область печати');
  if(layer.kind==='image'){
   if(!layer.image?.assetId)throw new Error('Изображение не загружено');
   const asset=(await db().ref(`assets/${layer.image.assetId}`).get()).val();
   if(!asset||asset.ownerId!==u.uid)throw new Error('Нет доступа к изображению');
   layer.image={assetId:asset.id,url:`/api/assets/${asset.id}`,width:asset.width,height:asset.height,name:asset.name};
  }
 }
 let id=input.id;
 if(id){const old=(await db().ref(`userDesigns/${u.uid}/${id}`).get()).val();if(!old)throw new Error('Проект не найден');}
 else id=db().ref(`userDesigns/${u.uid}`).push().key!;
 const old=(await db().ref(`userDesigns/${u.uid}/${id}`).get()).val() as Design|null;
 const now=Date.now();const design:Design={...input,id,ownerId:u.uid,createdAt:old?.createdAt||now,updatedAt:now};
 await db().ref(`userDesigns/${u.uid}/${id}`).set(design);
 return json({design});
}catch(e){return fail(e)}}
