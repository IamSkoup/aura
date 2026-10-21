import { getApps, initializeApp, applicationDefault,cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import type { NextRequest } from 'next/server';

function app() {
  if (getApps().length) return getApps()[0];
  if (!process.env.FIREBASE_DATABASE_URL) throw new Error('FIREBASE_DATABASE_URL не настроен');
  // The Realtime Database WebSocket client ignores NO_PROXY. Local emulator traffic
  // must bypass an inherited HTTP proxy or writes will hang indefinitely.
  if (process.env.FIREBASE_DATABASE_EMULATOR_HOST) {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.http_proxy;
    delete process.env.https_proxy;
  }
  const serviceAccount=process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credential=serviceAccount?cert(JSON.parse(serviceAccount)):applicationDefault();
  return initializeApp({ ...(process.env.FIREBASE_DATABASE_EMULATOR_HOST ? {} : {credential}), projectId: process.env.FIREBASE_PROJECT_ID, databaseURL: process.env.FIREBASE_DATABASE_URL });
}
export function db() { return getDatabase(app()); }
export function adminAuth() { return getAuth(app()); }
export function adminApp() { return app(); }
export async function userFromRequest(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer /,'');
  if (!token) throw new Error('Требуется вход в аккаунт');
  return adminAuth().verifyIdToken(token, true);
}
export async function adminFromRequest(req: NextRequest) {
  const user = await userFromRequest(req);
  if (user.admin !== true) throw new Error('Доступ только для администратора');
  return user;
}
