import type {MetadataRoute} from 'next';
export default function sitemap():MetadataRoute.Sitemap{const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';return ['/','/catalog','/studio','/prints','/info/about','/info/faq','/info/delivery','/info/sizes','/info/materials','/info/contacts'].map(path=>({url:base+path,lastModified:new Date()}))}
