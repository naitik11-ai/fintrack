import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { Auth, getAuth, GoogleAuthProvider } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// Read config from env vars, then from localStorage (set via in-app wizard)
function readStoredConfig() {
  try {
    const raw = localStorage.getItem('fintrack_firebase_config');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function buildConfig() {
  const stored = readStoredConfig();
  return {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             || stored?.apiKey            || '',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         || stored?.authDomain        || '',
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          || stored?.projectId         || '',
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      || stored?.storageBucket     || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || stored?.messagingSenderId || '',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID              || stored?.appId             || '',
  };
}

const firebaseConfig = buildConfig();

// Only consider configured if we have a non-empty, non-placeholder API key
export const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  firebaseConfig.apiKey.length > 10 &&
  !firebaseConfig.apiKey.startsWith('YOUR_') &&
  !!firebaseConfig.projectId &&
  !firebaseConfig.projectId.startsWith('YOUR_');

// Lazily-initialised singletons — only created when credentials are valid
let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  }
  return _app;
}

// These throw at call-time (after config check), not at module load time
export function getFirebaseAuth(): Auth {
  if (!_auth) _auth = getAuth(getApp());
  return _auth;
}

export function getFirebaseDb(): Firestore {
  if (!_db) _db = getFirestore(getApp());
  return _db;
}

// Convenience re-exports used in the rest of the codebase
// Safe: only called from AuthContext / firestore.ts which check isFirebaseConfigured first
export const googleProvider = (() => {
  if (!isFirebaseConfigured) return null as unknown as GoogleAuthProvider;
  const p = new GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return p;
})();

// Named exports expected by existing imports — lazy wrappers
export const auth = isFirebaseConfigured ? getFirebaseAuth() : null as unknown as Auth;
export const db   = isFirebaseConfigured ? getFirebaseDb()   : null as unknown as Firestore;

export default isFirebaseConfigured ? getApp() : null as unknown as FirebaseApp;
