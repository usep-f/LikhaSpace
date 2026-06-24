import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Server-side only — never import this in client components.
// Uses FIREBASE_ADMIN_* env vars which are NOT prefixed with NEXT_PUBLIC_.

/**
 * Parse the PEM private key from the environment variable.
 * Handles Vercel's escaping (literal `\n` strings) and
 * quote-wrapping variations.
 */
function parsePrivateKey(key: string): string {
  let parsed = key.trim();

  // Strip outer quotes if present
  if (parsed.startsWith('"') && parsed.endsWith('"')) {
    parsed = parsed.slice(1, -1);
  } else if (parsed.startsWith("'") && parsed.endsWith("'")) {
    parsed = parsed.slice(1, -1);
  }

  // Convert literal escaped newlines to real newlines
  parsed = parsed.replace(/\\n/g, '\n').replace(/\\r/g, '\r');

  // Reconstruct PEM if newlines were completely stripped
  if (
    !parsed.includes('\n') &&
    parsed.includes('-----BEGIN PRIVATE KEY-----') &&
    parsed.includes('-----END PRIVATE KEY-----')
  ) {
    const content = parsed
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s+/g, '');

    const chunks = content.match(/.{1,64}/g) || [];
    parsed = [
      '-----BEGIN PRIVATE KEY-----',
      ...chunks,
      '-----END PRIVATE KEY-----',
    ].join('\n');
  }

  return parsed.trim();
}

/**
 * Write a temporary service-account JSON file and set
 * GOOGLE_APPLICATION_CREDENTIALS so that firebase-admin
 * uses `ApplicationDefaultCredential` instead of
 * `ServiceAccountCredential`.
 *
 * This bypasses the `crypto.createPrivateKey()` validation
 * that fails on Vercel due to the bundler polyfilling
 * `node:crypto`.
 */
function ensureCredentialFile(
  projectId: string,
  clientEmail: string,
  privateKey: string,
): void {
  // Skip if already set and the file exists
  const existing = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (existing && fs.existsSync(existing)) {
    return;
  }

  const serviceAccount = {
    type: 'service_account',
    project_id: projectId,
    private_key: privateKey,
    client_email: clientEmail,
    token_uri: 'https://oauth2.googleapis.com/token',
  };

  const tmpDir = os.tmpdir();
  const filePath = path.join(tmpDir, 'firebase-sa.json');
  fs.writeFileSync(filePath, JSON.stringify(serviceAccount), {
    mode: 0o600,
  });

  process.env.GOOGLE_APPLICATION_CREDENTIALS = filePath;
}

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      `Missing Firebase Admin credentials. ` +
        `projectId: ${!!projectId}, clientEmail: ${!!clientEmail}, ` +
        `privateKey: ${!!rawKey}. ` +
        `Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, ` +
        `and FIREBASE_ADMIN_PRIVATE_KEY in your environment.`
    );
  }

  const privateKey = parsePrivateKey(rawKey);
  ensureCredentialFile(projectId, clientEmail, privateKey);

  // initializeApp() with no arguments uses
  // GOOGLE_APPLICATION_CREDENTIALS → ApplicationDefaultCredential,
  // which does NOT call crypto.createPrivateKey().
  return initializeApp({ projectId });
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}
