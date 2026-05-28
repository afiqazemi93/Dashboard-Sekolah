import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import firebaseConfigJson from '../firebase-applet-config.json';

// Build-time / runtime configuration resolving
const getFirebaseConfig = () => {
  // Check process.env (injected at build time by Vite or runtime if available)
  const envApiKey = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_API_KEY : undefined;
  const envAuthDomain = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN : undefined;
  const envProjectId = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID : undefined;
  const envStorageBucket = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET : undefined;
  const envMessagingSenderId = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID : undefined;
  const envAppId = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_APP_ID : undefined;
  const envDatabaseId = typeof process !== 'undefined' && process.env ? process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID : undefined;

  // Check Vite's import.meta.env just in case
  const viteMetaEnv = (import.meta as any).env;
  const viteApiKey = viteMetaEnv?.VITE_FIREBASE_API_KEY || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_API_KEY;
  const viteAuthDomain = viteMetaEnv?.VITE_FIREBASE_AUTH_DOMAIN || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const viteProjectId = viteMetaEnv?.VITE_FIREBASE_PROJECT_ID || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const viteStorageBucket = viteMetaEnv?.VITE_FIREBASE_STORAGE_BUCKET || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const viteMessagingSenderId = viteMetaEnv?.VITE_FIREBASE_MESSAGING_SENDER_ID || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const viteAppId = viteMetaEnv?.VITE_FIREBASE_APP_ID || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_APP_ID;
  const viteDatabaseId = viteMetaEnv?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || viteMetaEnv?.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID;

  const apiKey = envApiKey || viteApiKey || firebaseConfigJson.apiKey;
  const authDomain = envAuthDomain || viteAuthDomain || firebaseConfigJson.authDomain;
  const projectId = envProjectId || viteProjectId || firebaseConfigJson.projectId;
  const storageBucket = envStorageBucket || viteStorageBucket || firebaseConfigJson.storageBucket;
  const messagingSenderId = envMessagingSenderId || viteMessagingSenderId || firebaseConfigJson.messagingSenderId;
  const appId = envAppId || viteAppId || firebaseConfigJson.appId;
  const firestoreDatabaseId = envDatabaseId || viteDatabaseId || firebaseConfigJson.firestoreDatabaseId || (firebaseConfigJson as any).firestoreDatabaseId;

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    firestoreDatabaseId
  };
};

const config = getFirebaseConfig();

// Validate config
if (!config.apiKey || !config.projectId) {
  console.error("Firebase config is incomplete! Please check your environment variables or firebase-applet-config.json");
}

const app = initializeApp({
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId
});

// Enable persistent local cache for offline support and faster subsequent loads
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  ignoreUndefinedProperties: true
}, config.firestoreDatabaseId);

export const auth = getAuth();
export const storage = getStorage(app);

export const uploadBase64ToStorage = async (path: string, base64String: string): Promise<string> => {
  try {
    const storageRef = ref(storage, path);
    await uploadString(storageRef, base64String, 'data_url');
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error(`Error uploading to storage path ${path}:`, error);
    throw error;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isOffline = errorMessage.toLowerCase().includes('offline') || 
                    errorMessage.toLowerCase().includes('failed to get document') ||
                    (typeof navigator !== 'undefined' && !navigator.onLine);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };

  if (isOffline) {
    console.warn(`Firestore Offline (${operationType} ${path}): ${errorMessage}`);
    return; // Don't throw for offline errors, allow graceful fallback
  }

  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Boot connection check
async function testFirebaseConnection() {
  try {
    // Attempt to test connectivity directly with the Firestore instances
    await getDocFromServer(doc(db, 'school', 'connection-test'));
    console.log("Firebase Firestore connection established successfully.");
  } catch (error: any) {
    console.warn("Firestore test connection was unable to query. Checking exact cause:", error?.message || error);
  }
}
testFirebaseConnection();

