import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';
import { db,userFromRequest } from '@/lib/firebase-admin';
import { checkoutSchema } from '@/lib/validation';
import { quoteLine } from '@/lib/pricing';
import {rateLimit} from '@/lib/rate-limit';
import { fail,json } from '@/lib/server';
import type { Design,DesignTemplate,Order,OrderLine,Product } from '@/lib/types';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{const u=await userFromRequest(req);const snap=await db().ref(`ordersByUser/${u.uid}`).get();const ids=Object.keys(snap.val()||{});const items=await Promise.all(ids.map(async id=>(await db().ref(`orders/${id}`).get()).val()));return json({items:items.filter(Boolean).sort((a:Order,b:Order)=>b.createdAt-a.createdAt)});}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{
 const u=await userFromRequest(req);await rateLimit(u.uid,'checkout',5,60_000);if(!process.env.FIREBASE_DATABASE_EMULATOR_HOST){const settings=(await db().ref('settings/public').get()).val();if(settings?.legalReady!==true||settings?.merchantReady!==true||!settings?.merchantName||!settings?.privacyPolicy||!settings?.offer||!settings?.returnPolicy||!settings?.contactEmail)throw new Error('Приём реальных заказов ещё не открыт: нужны реквизиты и утверждённые документы')}if(!u.email_verified&&!process.env.FIREBASE_AUTH_EMULATOR_HOST)throw new Error('Подтвердите email перед заказом');
 const input=checkoutSchema.parse(await req.json());if(input.paymentMethod!=='yookassa'||process.env.PAYMENT_PROVIDER!=='yookassa')throw new Error('Онлайн-оплата пока не подключена');const lines:OrderLine[]=[];let subtotalRub=0;
 for(const line of input.lines){
  const product=(await db().ref(`products/${line.productId}`).get()).val() as Product|null;
  const design=(await db().ref(`userDesigns/${u.uid}/${line.designId}`).get()).val() as Design|null;
  if(!product?.published||!design||design.productId!==product.id)throw new Error('Товар или дизайн не найден');
  let templateExtraRub=0;if(design.templateId){const template=(await db().ref(`designTemplates/${design.templateId}`).get()).val() as DesignTemplate|null;if(!template?.published||!template.compatibleProductIds.includes(product.id))throw new Error('Готовый дизайн недоступен');templateExtraRub=template.extraPriceRub;}
  const quote=quoteLine(product,design,line.quantity,templateExtraRub);
  for(const layer of design.layers){if(layer.kind==='image'){
    const asset=(await db().ref(`assets/${layer.image?.assetId}`).get()).val();if(!asset||asset.ownerId!==u.uid)throw new Error('Файл дизайна недоступен');
  }}
  const {unitPriceRub,totalRub}=quote;subtotalRub+=totalRub;
  lines.push({productId:product.id,name:product.name,image:product.image,color:design.color,size:design.size,quantity:line.quantity,unitPriceRub,printAreas:product.printAreas,design});
 }
 // Delivery tariff is not supplied by the merchant; pickup estimate is zero pending manual confirmation.
 const deliveryRub=0;const id=db().ref('orders').push().key!;const now=Date.now();
 const number='AW-'+new Date(now).toISOString().slice(0,10).replaceAll('-','')+'-'+randomBytes(6).toString('hex').toUpperCase();
 const order:Order={id,number,userId:u.uid,lines,subtotalRub,deliveryRub,totalRub:subtotalRub+deliveryRub,status:'pending_payment',history:[{status:'pending_payment',at:now,by:'system'}],contact:input.contact,deliveryMethod:input.deliveryMethod,paymentMethod:input.paymentMethod,createdAt:now};
 await db().ref().update({[`orders/${id}`]:order,[`ordersByUser/${u.uid}/${id}`]:true});
 return json({order},201);
}catch(e){return fail(e)}}
