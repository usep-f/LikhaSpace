import { NextRequest, NextResponse } from 'next/server';
import { Keypair, WebAuth, Networks } from '@stellar/stellar-sdk';
import { STELLAR_NETWORK } from '@/lib/stellar';

// For local development fallback to prevent crashes if env is not configured yet.
const DEV_FALLBACK_SECRET = 'SBA2CJCTPQCXJBIQ6CZWKNXEQKY3VDR5W37TOSOE5CCNEICPNSBXK7MJ';

function getServerKeypair(): Keypair {
  const secret = process.env.SEP10_SERVER_SECRET || DEV_FALLBACK_SECRET;
  if (!process.env.SEP10_SERVER_SECRET && process.env.NODE_ENV === 'production') {
    throw new Error('SEP10_SERVER_SECRET must be set in production environment.');
  }
  return Keypair.fromSecret(secret);
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientAddress = url.searchParams.get('address');
    
    if (!clientAddress || typeof clientAddress !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid client address' }, { status: 400 });
    }

    if (!/^G[A-Z2-7]{55}$/.test(clientAddress)) {
      return NextResponse.json({ error: 'Invalid Stellar address format' }, { status: 400 });
    }

    const serverKP = getServerKeypair();
    const networkPassphrase = STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;
    const homeDomain = process.env.SEP10_HOME_DOMAIN || url.host;

    const challengeTxXdr = WebAuth.buildChallengeTx(
      serverKP,
      clientAddress,
      homeDomain,
      300, // 5 minutes validity
      networkPassphrase,
      homeDomain // webAuthDomain (6th argument)
    );

    return NextResponse.json({ 
      challenge: challengeTxXdr, 
      networkPassphrase,
      homeDomain
    });
  } catch (error: unknown) {
    console.error('[/api/auth/sep10/challenge] Error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
