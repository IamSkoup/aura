import type {Design,OrderStatus,Product} from './types';
import {validLayerBounds} from './validation';
export function quoteLine(product:Product,design:Design,quantity:number,templateExtraRub=0){
 if(!product.published||!Number.isInteger(product.priceRub)||product.priceRub<=0||product.stock<quantity)throw new Error('Товар недоступен для заказа');
 if(!Number.isInteger(quantity)||quantity<1||quantity>10)throw new Error('Неверное количество');
 if(design.productId!==product.id||!product.sizes.includes(design.size)||!(product.colors.some(c=>c.name===design.color)||/^#[0-9a-fA-F]{6}$/.test(design.color)))throw new Error('Вариант товара недоступен');
 for(const layer of design.layers){if(!validLayerBounds(layer))throw new Error('Слой вне печатной зоны');if(!product.printAreas.some(a=>a.id===layer.areaId))throw new Error('Недоступная печатная зона')}
 const areas=new Set(design.layers.map(l=>l.areaId));const extra=[...areas].reduce((sum,id)=>sum+product.printAreas.find(a=>a.id===id)!.extraPriceRub,0);
 const unitPriceRub=product.priceRub+extra+templateExtraRub;return {unitPriceRub,totalRub:unitPriceRub*quantity};
}
export const adminTransitions:Record<OrderStatus,OrderStatus[]>={pending_payment:['cancelled'],payment_failed:['cancelled'],paid:['artwork_review'],artwork_review:['production','cancelled'],production:['ready'],ready:['shipped'],shipped:['delivered'],delivered:[],cancelled:[],refunded:[]};
