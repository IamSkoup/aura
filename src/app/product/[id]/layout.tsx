import type {Metadata} from 'next';
import {db} from '@/lib/firebase-admin';
import type {Product} from '@/lib/types';
export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{try{const {id}=await params;const product=(await db().ref(`products/${id}`).get()).val() as Product|null;if(product?.published)return {title:product.name,description:product.description,openGraph:{title:product.name,description:product.description,images:[product.image]}}}catch{}return {title:'Товар',robots:{index:false}}}
export default function ProductLayout({children}:{children:React.ReactNode}){return children}
