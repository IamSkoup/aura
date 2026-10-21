import { NextRequest,NextResponse } from 'next/server';
import sharp from 'sharp';
import { db,adminFromRequest } from '@/lib/firebase-admin';
import { getAsset,putAsset } from '@/lib/storage';
import { fail } from '@/lib/server';
import { validLayerBounds } from '@/lib/validation';
import type { Order } from '@/lib/types';
export const runtime='nodejs';
const escape=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export async function GET(req:NextRequest,{params}:{params:Promise<{orderId:string}>}){try{
 await adminFromRequest(req);const {orderId}=await params;const order=(await db().ref(`orders/${orderId}`).get()).val() as Order|null;if(!order)throw new Error('Заказ не найден');
 const lineIndex=Number(req.nextUrl.searchParams.get('line')||0);const areaId=req.nextUrl.searchParams.get('area')||'front';const line=order.lines[lineIndex];if(!line)throw new Error('Позиция не найдена');
 const area=line.printAreas?.find(a=>a.id===areaId);if(!area)throw new Error('Область печати не найдена');
 const dpi=area.minDpi;const width=Math.round(area.widthMm/25.4*dpi),height=Math.round(area.heightMm/25.4*dpi);
 const layers=line.design.layers.filter(l=>l.areaId===areaId);if(!layers.length)throw new Error('В этой области нет слоёв');
 const elements:string[]=[];
 for(const layer of layers){if(!validLayerBounds(layer))throw new Error('Слой выходит за пределы печати');
  const pxWidth=layer.width*width,pxHeight=layer.height*height,cx=(layer.x+layer.width/2)*width,cy=(layer.y+layer.height/2)*height;
  const transform=`translate(${cx} ${cy}) rotate(${layer.rotation})`;
  if(layer.kind==='image'){
   const asset=(await db().ref(`assets/${layer.image?.assetId}`).get()).val();if(!asset)throw new Error('Исходник отсутствует');
   if(asset.width<Math.ceil(pxWidth)||asset.height<Math.ceil(pxHeight))throw new Error(`Недостаточное разрешение: ${asset.name}. Нужно не менее ${Math.ceil(pxWidth)} × ${Math.ceil(pxHeight)} px`);
   const input=await getAsset(asset.key);
   elements.push(`<g transform="${transform}" opacity="${layer.opacity}"><image href="data:image/png;base64,${input.toString('base64')}" x="${-pxWidth/2}" y="${-pxHeight/2}" width="${pxWidth}" height="${pxHeight}" preserveAspectRatio="xMidYMid meet"/></g>`);
  }else{
   const fontSize=Math.max(8,(layer.fontSize||32)*dpi/72),color=/^#[0-9a-fA-F]{6}$/.test(layer.color||'')?layer.color:'#151515';
   const lines=(layer.text||'').split('\n').slice(0,10);const anchor=layer.align==='left'?'start':layer.align==='right'?'end':'middle';const x=layer.align==='left'?-pxWidth/2:layer.align==='right'?pxWidth/2:0;
   const tspans=lines.map((text,i)=>`<tspan x="${x}" dy="${i?fontSize*1.2:0}">${escape(text)}</tspan>`).join('');
   elements.push(`<g transform="${transform}" opacity="${layer.opacity}"><text x="${x}" y="${-pxHeight/2+fontSize}" fill="${color}" font-family="DejaVu Sans" font-size="${fontSize}" font-weight="${layer.weight||600}" font-style="${layer.italic?'italic':'normal'}" letter-spacing="${layer.letterSpacing||0}" text-anchor="${anchor}">${tspans}</text></g>`);
  }
 }
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${elements.join('')}</svg>`);
 const png=await sharp(svg,{limitInputPixels:40_000_000}).png().toBuffer();const key=`production/${orderId}/${lineIndex}-${areaId}-${dpi}dpi.png`;await putAsset(key,png);await db().ref(`productionFiles/${orderId}/${lineIndex}/${areaId}`).set({key,widthMm:area.widthMm,heightMm:area.heightMm,dpi,createdAt:Date.now()});
 return new NextResponse(new Uint8Array(png),{headers:{'Content-Type':'image/png','Content-Disposition':`attachment; filename="${order.number}-${areaId}-${dpi}dpi.png"`,'X-Print-Width-Mm':String(area.widthMm),'X-Print-Height-Mm':String(area.heightMm),'X-Print-Dpi':String(dpi),'X-Content-Type-Options':'nosniff'}});
}catch(e){return fail(e)}}
