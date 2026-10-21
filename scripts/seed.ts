import { initializeApp,deleteApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

async function main(){
  if (!process.env.FIREBASE_DATABASE_EMULATOR_HOST) throw new Error('Seed разрешён только для Firebase emulator');
  delete process.env.HTTP_PROXY;
  delete process.env.HTTPS_PROXY;
  delete process.env.http_proxy;
  delete process.env.https_proxy;
  const databaseURL=process.env.FIREBASE_DATABASE_URL || 'http://127.0.0.1:9000?ns=aura-wear-local-default-rtdb';
  const app=initializeApp({databaseURL,projectId:'aura-wear-local'});
  const db=getDatabase(app);
  const now=Date.now();
  await db.ref('products/tee-01').set({id:'tee-01',name:'Футболка AURA / тестовый товар',slug:'tee-01',category:'Футболки',description:'Тестовая модель конструктора. Цена и наличие заданы только в локальном эмуляторе.',priceRub:1990,image:'/images/aura-tee.png',model:'/models/aura-tee.glb',colors:[{name:'Графит',hex:'#252525'},{name:'Молочный',hex:'#f5f1e9'},{name:'Лайм',hex:'#c9ff48'}],sizes:['XS','S','M','L','XL','XXL'],printAreas:[{id:'front',label:'Спереди',widthMm:280,heightMm:350,minDpi:150,extraPriceRub:0},{id:'back',label:'Сзади',widthMm:280,heightMm:350,minDpi:150,extraPriceRub:390}],stock:50,published:true,createdAt:now});
  console.log('Эмулятор: добавлена тестовая футболка.');
  await deleteApp(app);
}
main().catch(error=>{console.error(error);process.exitCode=1});
