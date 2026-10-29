import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import {
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  getFirestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
] as const;

const missing = requiredKeys.filter((key) => !firebaseConfig[key as keyof typeof firebaseConfig]);

export const firebaseConfigured = missing.length === 0;

if (!firebaseConfigured) {
  console.warn(`Firebase não configurado. Variáveis faltando: ${missing.join(", ")}`);
}

const app = firebaseConfigured
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export const auth: Auth | null = app ? getAuth(app) : null;

// Inicialização moderna do Firestore com persistência IndexedDB multi-abas
let firestoreInstance: Firestore | null = null;

if (app) {
  if (typeof window !== "undefined") {
    try {
      firestoreInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      });
    } catch {
      // Caso já tenha sido inicializado pelo runtime do Next.js / Fast Refresh
      firestoreInstance = getFirestore(app);
    }
  } else {
    firestoreInstance = getFirestore(app);
  }
}

export const db: Firestore | null = firestoreInstance;
