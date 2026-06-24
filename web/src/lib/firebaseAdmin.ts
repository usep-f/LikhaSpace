import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// Server-side only — never import this in client components.
// Uses FIREBASE_ADMIN_* env vars which are NOT prefixed with NEXT_PUBLIC_.

function parsePrivateKey(key?: string): string | undefined {
  if (!key) return undefined;
  let parsed = key.trim();
  if (parsed.startsWith('"') && parsed.endsWith('"')) {
    parsed = parsed.slice(1, -1);
  } else if (parsed.startsWith("'") && parsed.endsWith("'")) {
    parsed = parsed.slice(1, -1);
  }
  parsed = parsed.replace(/\\n/g, '\n').trim();
  return parsed;
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = parsePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

  if (projectId && clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  }

  throw new Error(
    `Missing Firebase Admin credentials in environment. ` +
    `projectId configured: ${!!projectId}, clientEmail configured: ${!!clientEmail}, privateKey configured: ${!!privateKey}. ` +
    `Please ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY are set correctly in Vercel.`
  );
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
