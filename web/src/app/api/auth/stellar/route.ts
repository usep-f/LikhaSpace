import { NextRequest, NextResponse } from 'next/server';
import { Keypair, hash } from '@stellar/stellar-sdk';
import { getAdminAuth } from '@/lib/firebaseAdmin';

// POST /api/auth/stellar
// Body: { address: string, signedMessage: string, nonce: string }
//
// Flow:
//   1. Verify the nonce was recently issued (not replayed)
//   2. Verify the Stellar signature using the public key
//   3. Issue a Firebase Custom Token with uid = Stellar address
//   4. Client calls signInWithCustomToken(auth, token) to become authenticated

// In-memory nonce store (replace with Redis/KV in production for multi-instance deployments)
const issuedNonces = new Map<string, number>(); // nonce -> issued timestamp (ms)
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Clean up expired nonces periodically
function pruneNonces() {
  const now = Date.now();
  for (const [nonce, ts] of issuedNonces.entries()) {
    if (now - ts > NONCE_TTL_MS) {
      issuedNonces.delete(nonce);
    }
  }
}

// GET /api/auth/stellar — issue a nonce for signing
export async function GET() {
  pruneNonces();
  const nonce = crypto.randomUUID();
  issuedNonces.set(nonce, Date.now());
  return NextResponse.json({ nonce });
}

// POST /api/auth/stellar — verify signature and return Firebase custom token
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { address, signedMessage, nonce } = body as {
      address?: string;
      signedMessage?: string;
      nonce?: string;
    };

    // --- Input validation ---
    if (!address || typeof address !== 'string') {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 });
    }
    if (!signedMessage || typeof signedMessage !== 'string') {
      return NextResponse.json({ error: 'Missing signedMessage' }, { status: 400 });
    }
    if (!nonce || typeof nonce !== 'string') {
      return NextResponse.json({ error: 'Missing nonce' }, { status: 400 });
    }

    // Validate Stellar address format (G... 56 chars)
    if (!/^G[A-Z2-7]{55}$/.test(address)) {
      return NextResponse.json({ error: 'Invalid Stellar address format' }, { status: 400 });
    }

    // --- Nonce validation (replay protection) ---
    pruneNonces();
    const nonceTs = issuedNonces.get(nonce);
    if (!nonceTs) {
      return NextResponse.json({ error: 'Invalid or expired nonce' }, { status: 401 });
    }
    if (Date.now() - nonceTs > NONCE_TTL_MS) {
      issuedNonces.delete(nonce);
      return NextResponse.json({ error: 'Nonce expired' }, { status: 401 });
    }
    // Consume the nonce — prevents replay attacks
    issuedNonces.delete(nonce);

    // --- Signature verification ---
    // The client signs the plaintext message using Freighter: "LikhaSpace Auth:\n" + nonce
    const rawMessage = `LikhaSpace Auth:\n${nonce}`;
    // Freighter actually prepends this specific prefix before signing!
    let signatureBytes: Buffer;
    try {
      signatureBytes = Buffer.from(signedMessage, 'base64');
    } catch {
      return NextResponse.json({ error: 'Invalid signature encoding' }, { status: 400 });
    }

    let isValid = false;
    try {
      // Freighter actually prepends this specific prefix AND then hashes the result with SHA256 before signing it!
      const prefixedMessage = `Stellar Signed Message:\n${rawMessage}`;
      const messageHash = hash(new TextEncoder().encode(prefixedMessage));

      const keypair = Keypair.fromPublicKey(address);
      
      // Verify signature against the SHA256 hash of the prefixed message
      isValid = keypair.verify(messageHash, signatureBytes);
    } catch (e) {
      console.error('Error during keypair.verify:', e);
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // --- Issue Firebase Custom Token ---
    // uid = the Stellar public key. This becomes request.auth.uid in Firestore rules.
    const adminAuth = getAdminAuth();
    const customToken = await adminAuth.createCustomToken(address, {
      stellarAddress: address, // Extra claim — accessible in rules as request.auth.token.stellarAddress
    });

    return NextResponse.json({ token: customToken });
  } catch (err: unknown) {
    console.error('[/api/auth/stellar] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
