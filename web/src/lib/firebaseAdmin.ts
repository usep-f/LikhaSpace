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
  
  // Handle literal escaped newlines or real newlines
  parsed = parsed.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

  // If Vercel stripped newlines or replaced them with spaces, reconstruct the PEM format
  if (!parsed.includes('\n') && parsed.includes('-----BEGIN PRIVATE KEY-----') && parsed.includes('-----END PRIVATE KEY-----')) {
    const content = parsed
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s+/g, ''); // Remove any spaces that might have replaced newlines
    
    // Split the base64 content into chunks of 64 characters (standard PEM wrapping)
    const chunks = content.match(/.{1,64}/g) || [];
    parsed = ['-----BEGIN PRIVATE KEY-----', ...chunks, '-----END PRIVATE KEY-----'].join('\n');
  }

  return parsed.trim();
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
