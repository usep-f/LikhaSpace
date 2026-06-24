import { NextRequest, NextResponse } from 'next/server';
import { Keypair, WebAuth, Networks, Horizon } from '@stellar/stellar-sdk';
import { STELLAR_NETWORK, HORIZON_URL } from '@/lib/stellar';
import { getAdminAuth } from '@/lib/firebaseAdmin';

function getServerKeypair(): Keypair {
  const secret = process.env.SEP10_SERVER_SECRET;
  if (!secret) {
    throw new Error('SEP10_SERVER_SECRET is required but not configured.');
  }
  return Keypair.fromSecret(secret);
}

function getHomeDomain(req: NextRequest): string {
  let domain = process.env.SEP10_HOME_DOMAIN || req.headers.get('x-forwarded-host') || req.headers.get('host') || new URL(req.url).host;
  if (domain.startsWith('http://') || domain.startsWith('https://')) {
    try {
      domain = new URL(domain).host;
    } catch {
      domain = domain.replace(/^https?:\/\//, '').split('/')[0];
    }
  } else {
    domain = domain.split('/')[0];
  }
  return domain;
}

async function fetchClientSigners(clientAccountID: string): Promise<string[]> {
  let signers = [clientAccountID];
  try {
    const horizon = new Horizon.Server(HORIZON_URL);
    const accountInfo = await horizon.loadAccount(clientAccountID);
    signers = accountInfo.signers.map((s) => s.key);
  } catch {
    // Ignore errors (e.g. account unfunded) and proceed with default signer
  }
  return signers;
}

async function verifyChallengeAndGetToken(challengeTx: string, homeDomain: string) {
  const serverKP = getServerKeypair();
  const serverAccountId = serverKP.publicKey();
  const networkPassphrase = STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;

  const { clientAccountID } = WebAuth.readChallengeTx(
    challengeTx,
    serverAccountId,
    networkPassphrase,
    homeDomain,
    homeDomain
  );

  const signers = await fetchClientSigners(clientAccountID);

  const signersFound = WebAuth.verifyChallengeTxSigners(
    challengeTx,
    serverAccountId,
    networkPassphrase,
    signers,
    homeDomain,
    homeDomain
  );

  if (!signersFound || signersFound.length === 0) {
    throw new Error('Signatures do not match client account');
  }

  const adminAuth = getAdminAuth();
  const customToken = await adminAuth.createCustomToken(clientAccountID, {
    stellarAddress: clientAccountID,
  });

  return { token: customToken, address: clientAccountID };
}

export async function POST(req: NextRequest) {
  try {
    const { challengeTx } = await req.json() as { challengeTx?: string };

    if (!challengeTx || typeof challengeTx !== 'string') {
      return NextResponse.json({ error: 'Missing challengeTx transaction envelope XDR' }, { status: 400 });
    }

    const homeDomain = getHomeDomain(req);
    const result = await verifyChallengeAndGetToken(challengeTx, homeDomain);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('[/api/auth/sep10/verify] Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
