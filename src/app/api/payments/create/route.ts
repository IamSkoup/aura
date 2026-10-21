import {NextRequest} from 'next/server';
import {z} from 'zod';
import {db,userFromRequest} from '@/lib/firebase-admin';
import {createYooPayment} from '@/lib/yookassa';
import {rateLimit} from '@/lib/rate-limit';
import {fail,json} from '@/lib/server';
import type {Order} from '@/lib/types';
export const runtime='nodejs';
export async function POST(req:NextRequest){try{const u=await userFromRequest(req);await rateLimit(u.uid,'payment',8,60_000);if(process.env.PAYMENT_PROVIDER!=='yookassa')throw new Error('Онлайн-оплата не подключена');const {orderId}=z.object({orderId:z.string()}).parse(await req.json());const order=(await db().ref(`orders/${orderId}`).get()).val() as Order|null;if(!order||order.userId!==u.uid)throw new Error('Заказ не найден');if(order.status!=='pending_payment'||order.paymentMethod!=='yookassa'||order.payment?.confirmedAt)throw new Error('Этот заказ нельзя оплатить');const origin=req.headers.get('origin');const site=process.env.NEXT_PUBLIC_SITE_URL;if(!origin||!site||new URL(origin).origin!==new URL(site).origin)throw new Error('Неверный адрес сайта');const payment=await createYooPayment(order.id,order.number,order.totalRub,`${site}/account/orders`);if(!payment.confirmation?.confirmation_url)throw new Error('Платёжная ссылка не получена');await db().ref(`orders/${order.id}/payment`).set({provider:'yookassa',id:payment.id,test:payment.test===true});return json({url:payment.confirmation.confirmation_url});}catch(e){return fail(e)}}
