'use client';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
const app = getApps().length ? getApp() : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});
export const auth = getAuth(app);
if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST && typeof window !== 'undefined') {
  connectAuthEmulator(auth, `http://${process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST}`, {disableWarnings:true});
}
export async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  const res = await fetch(url, { ...options, headers: { ...(options.body ? {'Content-Type':'application/json'} : {}), ...(token ? {Authorization:`Bearer ${token}`} : {}), ...options.headers } });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Ошибка сервера');
  return json as T;
}
