import {NextRequest} from 'next/server';
import {z} from 'zod';
import {adminFromRequest,db} from '@/lib/firebase-admin';
import {fail,json} from '@/lib/server';
const schema=z.object({id:z.string().optional(),title:z.string().min(2),description:z.string().min(5),category:z.enum(['Мемы','Цитаты','Минимализм','Аниме','Абстракция','Типографика','Праздники','Авторские коллекции']),image:z.string().regex(/^\/api\/public-assets\/[a-f0-9-]+$/),assetId:z.string(),compatibleProductIds:z.array(z.string()).min(1),extraPriceRub:z.number().int().nonnegative(),published:z.boolean()});
export const runtime='nodejs';
export async function GET(req:NextRequest){try{await adminFromRequest(req);const snap=await db().ref('designTemplates').get();return json({items:Object.values(snap.val()||{})})}catch(e){return fail(e)}}
export async function POST(req:NextRequest){try{await adminFromRequest(req);const data=schema.parse(await req.json());const asset=(await db().ref(`publicAssets/${data.assetId}`).get()).val();if(!asset||data.image!==`/api/public-assets/${data.assetId}`)throw new Error('Сначала загрузите файл принта');for(const id of data.compatibleProductIds){if(!(await db().ref(`products/${id}`).get()).exists())throw new Error('Совместимый товар не найден')}const id=data.id||db().ref('designTemplates').push().key!;const old=(await db().ref(`designTemplates/${id}`).get()).val();const template={...data,id,createdAt:old?.createdAt||Date.now()};await db().ref(`designTemplates/${id}`).set(template);return json({template})}catch(e){return fail(e)}}
