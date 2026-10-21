import { initializeApp, applicationDefault,cert,deleteApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

async function main(){
  const email=process.argv[2]; if (!email) throw new Error('Укажите email существующего пользователя');
  if(process.env.FIREBASE_AUTH_EMULATOR_HOST){delete process.env.HTTP_PROXY;delete process.env.HTTPS_PROXY;delete process.env.http_proxy;delete process.env.https_proxy;}
  const serviceAccount=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential=serviceAccount?cert(JSON.parse(serviceAccount)):applicationDefault();
  const app=initializeApp({...(process.env.FIREBASE_AUTH_EMULATOR_HOST?{}:{credential}),projectId:process.env.FIREBASE_PROJECT_ID});
  const auth=getAuth(app);
  const user=await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid,{...user.customClaims,admin:true});
  console.log('Роль администратора назначена:',email,'; пользователю нужно войти заново.');
  await deleteApp(app);
}
main().catch(error=>{console.error(error);process.exitCode=1});
