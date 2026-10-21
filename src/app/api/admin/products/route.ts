import { NextRequest } from 'next/server';
import { db,adminFromRequest } from '@/lib/firebase-admin';
import { fail,json } from '@/lib/server';
import { z } from 'zod';
const area=z.object({id:z.string().regex(/^[a-z0-9_-]+$/),label:z.string().min(1),widthMm:z.number().min(10).max(1000),heightMm:z.number().min(10).max(1000),minDpi:z.number().int().min(72).max(600),extraPriceRub:z.number().int().nonnegative()});
const schema=z.object({id:z.string().regex(/^[a-z0-9_-]+$/).optional(),name:z.string().min(2),slug:z.string().regex(/^[a-z0-9-]+$/),category:z.string().min(2),description:z.string().min(5),priceRub:z.number().int().nonnegative(),image:z.string().regex(/^\/(images|api\/public-assets)\//),model:z.string().optional(),colors:z.array(z.object({name:z.string().min(1),hex:z.string().regex(/^#[0-9a-fA-F]{6}$/)})).min(1),sizes:z.array(z.string()).min(1),optionLabel:z.string().max(40).optional(),printAreas:z.array(area).min(1),stock:z.number().int().nonnegative(),published:z.boolean(),material:z.string().optional()});
export const runtime='nodejs';
export async function GET(req:NextRequest){try{await adminFromRequest(req);const snap=await db().ref('products').get();return json({items:Object.values(snap.val()||{})});}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{await adminFromRequest(req);const data=schema.parse(await req.json());const id=data.id||db().ref('products').push().key!;const old=(await db().ref(`products/${id}`).get()).val();const product={...data,id,createdAt:old?.createdAt||Date.now()};if(product.published&&(!product.priceRub||!product.image))throw new Error('Для публикации нужны цена и изображение');await db().ref(`products/${id}`).set(product);return json({product});}catch(e){return fail(e)}}
