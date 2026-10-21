import {getApp, getApps, initializeApp} from 'firebase/app';
import {getAuth} from 'firebase/auth';

// Firebase web configuration is public. No Admin SDK or payment credentials ship in this bundle.
export const firebaseApp = getApps().length ? getApp() : initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAOp-KIdwjS2iDPrWZrMlbwqgK3p1E3fX8',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'aurawear-4be25.firebaseapp.com',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || 'https://aurawear-4be25-default-rtdb.europe-west1.firebasedatabase.app',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'aurawear-4be25',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:318217753716:web:37bd05522aca881615ad21',
});

export const firebaseAuth = getAuth(firebaseApp);
