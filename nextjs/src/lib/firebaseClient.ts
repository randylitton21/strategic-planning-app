import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: {
      apiKey: string;
      authDomain: string;
      projectId: string;
      storageBucket: string;
      messagingSenderId: string;
      appId: string;
    };
  }
}

function getEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  return value;
}

export type FirebasePublicConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

export function getFirebasePublicConfig(): FirebasePublicConfig | null {
  // 1) Try process.env (inlined at build time; can be undefined with Turbopack/Webpack)
  const apiKey = getEnv("NEXT_PUBLIC_FIREBASE_API_KEY");
  const authDomain = getEnv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  const projectId = getEnv("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  const storageBucket = getEnv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  const messagingSenderId = getEnv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");
  const appId = getEnv("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (apiKey && authDomain && projectId && storageBucket && messagingSenderId && appId) {
    return {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
    };
  }

  // 2) Fallback: config injected by server in layout (works when client env inlining fails)
  if (typeof window !== "undefined" && window.__FIREBASE_CONFIG__) {
    const c = window.__FIREBASE_CONFIG__;
    if (
      c.apiKey &&
      c.authDomain &&
      c.projectId &&
      c.storageBucket &&
      c.messagingSenderId &&
      c.appId
    ) {
      return c;
    }
  }

  return null;
}

const cfg = getFirebasePublicConfig();

export const firebaseApp = cfg
  ? getApps().length > 0
    ? getApps()[0]!
    : initializeApp(cfg)
  : null;

export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firestore = firebaseApp ? getFirestore(firebaseApp) : null;
export const isFirebaseConfigured = !!firebaseApp;

