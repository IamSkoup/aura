import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { fail, json } from '@/lib/server';
import {withTimeout} from '@/lib/timeout';
import type { Product } from '@/lib/types';
import { starterProducts } from '@/lib/catalog-data';
export const runtime='nodejs';
export async function GET(req:NextRequest){try{
 const dbUrl=process.env.FIREBASE_DATABASE_URL;
 const snap=dbUrl&&!dbUrl.includes('your-project')?await withTimeout(db().ref('products').get(),4000).catch(()=>null):null;
 let products=(snap ? Object.values(snap.val()||{}) : []) as Product[];
 if(!products.length)products=starterProducts;
 products=products.filter(p=>p.published);const facets={colors:[...new Set(products.flatMap(p=>p.colors.map(c=>c.name)))],sizes:[...new Set(products.flatMap(p=>p.sizes))],materials:[...new Set(products.map(p=>p.material).filter(Boolean))]};
 const id=req.nextUrl.searchParams.get('id');if(id)products=products.filter(p=>p.id===id);
 const category=req.nextUrl.searchParams.get('category');if(category)products=products.filter(p=>p.category===category);
 const q=req.nextUrl.searchParams.get('q')?.toLocaleLowerCase('ru');if(q)products=products.filter(p=>(p.name+' '+p.description).toLocaleLowerCase('ru').includes(q));
 const min=Number(req.nextUrl.searchParams.get('minPrice')||0),max=Number(req.nextUrl.searchParams.get('maxPrice')||0);if(min)products=products.filter(p=>p.priceRub>=min);if(max)products=products.filter(p=>p.priceRub<=max);const color=req.nextUrl.searchParams.get('color'),size=req.nextUrl.searchParams.get('size'),material=req.nextUrl.searchParams.get('material');if(color)products=products.filter(p=>p.colors.some(c=>c.name===color));if(size)products=products.filter(p=>p.sizes.includes(size));if(material)products=products.filter(p=>p.material===material);if(req.nextUrl.searchParams.get('available')==='true')products=products.filter(p=>p.stock>0);
 const sort=req.nextUrl.searchParams.get('sort');if(sort==='price-asc')products.sort((a,b)=>a.priceRub-b.priceRub);else if(sort==='price-desc')products.sort((a,b)=>b.priceRub-a.priceRub);else if(sort==='popular')products.sort((a,b)=>(b.salesCount||0)-(a.salesCount||0));else products.sort((a,b)=>b.createdAt-a.createdAt);
 const limit=Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit'))||12,1),48);const page=Math.max(Number(req.nextUrl.searchParams.get('page'))||1,1);
 return json({items:products.slice((page-1)*limit,page*limit),total:products.length,facets,page,pages:Math.ceil(products.length/limit)});
}catch(e){return fail(e,503)}}
