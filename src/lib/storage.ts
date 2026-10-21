import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getStorage } from 'firebase-admin/storage';
import { promises as fs } from 'fs';
import path from 'path';
import { adminApp } from './firebase-admin';
const localDir=path.join(process.cwd(),'.data','assets');
function s3() { return new S3Client({region:process.env.S3_REGION || 'us-east-1',endpoint:process.env.S3_ENDPOINT || undefined,forcePathStyle:!!process.env.S3_ENDPOINT,credentials:process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}:undefined}); }
function localPath(key:string){if(!/^[A-Za-z0-9/_\.-]+$/.test(key)||key.split('/').some(v=>v==='..'||!v))throw new Error('Неверный ключ файла');return path.join(localDir,key)}
function provider(){
  if(process.env.STORAGE_PROVIDER)return process.env.STORAGE_PROVIDER;
  if(process.env.S3_BUCKET)return 's3';
  if(process.env.FIREBASE_DATABASE_EMULATOR_HOST)return 'local';
  return 'unconfigured';
}
function firebaseBucket(){
  const name=process.env.FIREBASE_STORAGE_BUCKET;
  if(!name)throw new Error('FIREBASE_STORAGE_BUCKET не настроен');
  return getStorage(adminApp()).bucket(name);
}
export async function putAsset(key:string,body:Buffer,contentType='image/png') {
  if(provider()==='local'){
    if(!process.env.FIREBASE_DATABASE_EMULATOR_HOST)throw new Error('Локальное хранилище разрешено только с эмулятором');
    const dest=localPath(key);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,body);return;
  }
  if(provider()==='firebase'){await firebaseBucket().file(key).save(body,{contentType,resumable:false});return;}
  if(provider()!=='s3'||!process.env.S3_BUCKET)throw new Error('Хранилище файлов не настроено');
  await s3().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:body,ContentType:contentType}));
}
export async function getAsset(key:string):Promise<Buffer>{
  if(provider()==='local'){
    if(!process.env.FIREBASE_DATABASE_EMULATOR_HOST)throw new Error('Локальное хранилище разрешено только с эмулятором');
    return fs.readFile(localPath(key));
  }
  if(provider()==='firebase'){const [data]=await firebaseBucket().file(key).download();return data;}
  if(provider()!=='s3'||!process.env.S3_BUCKET)throw new Error('Хранилище файлов не настроено');
  const res=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));
  if(!res.Body)throw new Error('Файл не найден');
  return Buffer.from(await res.Body.transformToByteArray());
}
