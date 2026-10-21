import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
const email=process.argv[2]; if (!email) throw new Error('Укажите email существующего пользователя');
initializeApp({...(process.env.FIREBASE_AUTH_EMULATOR_HOST?{}:{credential:applicationDefault()}),projectId:process.env.FIREBASE_PROJECT_ID});
const user=await getAuth().getUserByEmail(email);
await getAuth().setCustomUserClaims(user.uid,{...user.customClaims,admin:true});
console.log('Роль администратора назначена:',email,'; пользователю нужно войти заново.');
