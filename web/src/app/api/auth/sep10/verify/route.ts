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

export async function POST(req: NextRequest) {
  try {
    const { challengeTx } = await req.json() as { challengeTx?: string };

    if (!challengeTx || typeof challengeTx !== 'string') {
      return NextResponse.json({ error: 'Missing challengeTx transaction envelope XDR' }, { status: 400 });
    }

    const serverKP = getServerKeypair();
    const serverAccountId = serverKP.publicKey();
    const networkPassphrase = STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;
    
    // homeDomain must match whatever was used to generate the challenge
    const url = new URL(req.url);
    const homeDomain = process.env.SEP10_HOME_DOMAIN || url.host;

    // 1. Read challenge & verify server signature, timebounds, and home domain
    const { clientAccountID } = WebAuth.readChallengeTx(
      challengeTx,
      serverAccountId,
      networkPassphrase,
      homeDomain,
      homeDomain // webAuthDomain
    );

    // 2. Fetch the client's signers from the network to support multisig accounts.
    // If the account is unfunded or the fetch fails, fallback to the account ID itself.
    let signers = [clientAccountID];
    try {
      const horizon = new Horizon.Server(HORIZON_URL);
      const accountInfo = await horizon.loadAccount(clientAccountID);
      signers = accountInfo.signers.map((s) => s.key);
    } catch {
      // Ignore errors (e.g. account unfunded) and proceed with default signer
    }

    // 3. Verify that the client signatures meet the threshold (or are valid signers)
    // verifyChallengeTxSigners returns the matching signers found on the transaction
    const signersFound = WebAuth.verifyChallengeTxSigners(
      challengeTx,
      serverAccountId,
      networkPassphrase,
      signers,
      homeDomain,
      homeDomain // webAuthDomain
    );

    if (!signersFound || signersFound.length === 0) {
      return NextResponse.json({ error: 'Signatures do not match client account' }, { status: 401 });
    }

    // 4. Issue Firebase Custom Token with uid = Stellar address
    const adminAuth = getAdminAuth();
    const customToken = await adminAuth.createCustomToken(clientAccountID, {
      stellarAddress: clientAccountID,
    });

    return NextResponse.json({ token: customToken, address: clientAccountID });
  } catch (error: unknown) {
    console.error('[/api/auth/sep10/verify] Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 401 });
  }
}
