const base='https://api.yookassa.ru/v3';
import type {Order} from './types';
function authHeader(){const shop=process.env.YOOKASSA_SHOP_ID,secret=process.env.YOOKASSA_SECRET_KEY;if(!shop||!secret)throw new Error('ЮKassa не настроена');return 'Basic '+Buffer.from(`${shop}:${secret}`).toString('base64')}
export type YooPayment={id:string;status:string;paid:boolean;amount:{value:string;currency:string};confirmation?:{confirmation_url?:string};metadata?:{orderId?:string};test?:boolean};
export async function createYooPayment(order:Order,returnUrl:string):Promise<YooPayment>{
 const vat=process.env.YOOKASSA_VAT_CODE;
 const receipt=vat?{customer:{email:order.contact.email},items:order.lines.map(line=>({
  description:line.name.slice(0,128),quantity:String(line.quantity),amount:{value:line.unitPriceRub.toFixed(2),currency:'RUB'},
  vat_code:Number(vat),payment_mode:'full_payment',payment_subject:'commodity'
 }))}:undefined;
 if(vat&&!Number.isInteger(Number(vat)))throw new Error('Неверная настройка НДС для чека');
 const payload={amount:{value:order.totalRub.toFixed(2),currency:'RUB'},capture:true,confirmation:{type:'redirect',return_url:returnUrl},
  description:`Aura Wear ${order.number}`,metadata:{orderId:order.id},...(receipt?{receipt}:{})};
 const res=await fetch(`${base}/payments`,{method:'POST',headers:{Authorization:authHeader(),'Content-Type':'application/json','Idempotence-Key':order.id},body:JSON.stringify(payload),cache:'no-store'});
 const data=await res.json();if(!res.ok)throw new Error(`Ошибка ЮKassa: ${data.description||res.status}`);return data;
}
export async function getYooPayment(id:string):Promise<YooPayment>{const res=await fetch(`${base}/payments/${encodeURIComponent(id)}`,{headers:{Authorization:authHeader()},cache:'no-store'});if(!res.ok)throw new Error(`Не удалось проверить платёж: ${res.status}`);return res.json()}
