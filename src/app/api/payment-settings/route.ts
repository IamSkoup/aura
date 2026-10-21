import {json} from '@/lib/server';
export async function GET(){return json({provider:process.env.PAYMENT_PROVIDER==='yookassa'&&!!process.env.YOOKASSA_SHOP_ID&&!!process.env.YOOKASSA_SECRET_KEY?'yookassa':'none'})}
