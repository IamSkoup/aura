'use client';
import {auth} from './firebase-client';
export async function loadPrivateImage(url:string){const token=await auth.currentUser?.getIdToken();if(!token)throw new Error('Войдите для просмотра файла');const response=await fetch(url,{headers:{Authorization:`Bearer ${token}`}});if(!response.ok)throw new Error('Не удалось загрузить изображение');return URL.createObjectURL(await response.blob());}
