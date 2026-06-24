import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Server-side only — never import this in client components.
// Uses FIREBASE_ADMIN_* env vars which are NOT prefixed with NEXT_PUBLIC_.

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (privateKey?.startsWith('"') && privateKey?.endsWith('"')) {
    privateKey = privateKey.slice(1, -1);
  }

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  if (process.env.NODE_ENV === 'production') {
    return initializeApp();
  }

  throw new Error(
    'Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, ' +
    'FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in your .env.local file.'
  );
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
