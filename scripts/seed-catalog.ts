import {getApps,initializeApp,applicationDefault,cert,deleteApp} from 'firebase-admin/app';
import {getDatabase} from 'firebase-admin/database';
import {starterProducts} from '../src/lib/catalog-data';

async function main(){
  if(!process.env.FIREBASE_DATABASE_URL)throw new Error('Сначала укажите FIREBASE_DATABASE_URL');
  const credentials=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const app=getApps()[0]||initializeApp({
    credential:credentials?cert(JSON.parse(credentials)):applicationDefault(),
    databaseURL:process.env.FIREBASE_DATABASE_URL,
    projectId:process.env.FIREBASE_PROJECT_ID
  });
  const db=getDatabase(app);
  let created=0;
  for(const product of starterProducts){
    const ref=db.ref(`products/${product.id}`);
    const snap=await ref.get();
    if(snap.exists())continue; // не перезаписывать товары, уже изменённые владельцем
    await ref.set(product);
    created++;
  }
  console.log(`Каталог: добавлено ${created} товаров. Проверьте цену, фото, материал и наличие перед открытием магазина.`);
  await deleteApp(app);
}
main().catch(error=>{console.error(error);process.exitCode=1});
