import {NextRequest} from 'next/server';
import {randomUUID} from 'crypto';
import {db,userFromRequest} from '@/lib/firebase-admin';
import {getAsset,putAsset} from '@/lib/storage';
import {fail,json} from '@/lib/server';
import type {DesignTemplate} from '@/lib/types';
export const runtime='nodejs';
export async function POST(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{const u=await userFromRequest(req);const {id}=await params;const template=(await db().ref(`designTemplates/${id}`).get()).val() as DesignTemplate|null;if(!template?.published)throw new Error('Принт не найден');const asset=(await db().ref(`publicAssets/${template.assetId}`).get()).val();if(!asset)throw new Error('Исходник принта отсутствует');const newId=randomUUID(),key=`assets/${u.uid}/${newId}.png`;await putAsset(key,await getAsset(asset.key));await db().ref(`assets/${newId}`).set({id:newId,key,ownerId:u.uid,width:asset.width,height:asset.height,name:template.title,createdAt:Date.now()});return json({asset:{assetId:newId,url:`/api/assets/${newId}`,width:asset.width,height:asset.height,name:template.title},template})}catch(e){return fail(e)}}
