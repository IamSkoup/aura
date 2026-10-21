import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { promises as fs } from 'fs';
import path from 'path';
const localDir=path.join(process.cwd(),'.data','assets');
function s3() { return new S3Client({region:process.env.S3_REGION || 'us-east-1',endpoint:process.env.S3_ENDPOINT || undefined,forcePathStyle:!!process.env.S3_ENDPOINT,credentials:process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? {accessKeyId:process.env.S3_ACCESS_KEY_ID,secretAccessKey:process.env.S3_SECRET_ACCESS_KEY}:undefined}); }
function localPath(key:string){if(!/^[A-Za-z0-9/_\.-]+$/.test(key)||key.split('/').some(v=>v==='..'||!v))throw new Error('Неверный ключ файла');return path.join(localDir,key)}
function local() { return !!process.env.FIREBASE_DATABASE_EMULATOR_HOST && !process.env.S3_BUCKET; }
export async function putAsset(key:string,body:Buffer,contentType='image/png') {
  if(local()){const dest=localPath(key);await fs.mkdir(path.dirname(dest),{recursive:true});await fs.writeFile(dest,body);return;}
  if(!process.env.S3_BUCKET)throw new Error('Хранилище S3 не настроено');
  await s3().send(new PutObjectCommand({Bucket:process.env.S3_BUCKET,Key:key,Body:body,ContentType:contentType}));
}
export async function getAsset(key:string):Promise<Buffer>{
  if(local())return fs.readFile(localPath(key));
  if(!process.env.S3_BUCKET)throw new Error('Хранилище S3 не настроено');
  const res=await s3().send(new GetObjectCommand({Bucket:process.env.S3_BUCKET,Key:key}));
  if(!res.Body)throw new Error('Файл не найден');
  return Buffer.from(await res.Body.transformToByteArray());
}
