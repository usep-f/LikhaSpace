import { NextRequest, NextResponse } from 'next/server';
import { Keypair, WebAuth, Networks } from '@stellar/stellar-sdk';
import { STELLAR_NETWORK } from '@/lib/stellar';

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

function createChallenge(clientAddress: string, homeDomain: string) {
  const serverKP = getServerKeypair();
  const networkPassphrase = STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET;
  const challengeTxXdr = WebAuth.buildChallengeTx(
    serverKP,
    clientAddress,
    homeDomain,
    300, // 5 minutes validity
    networkPassphrase,
    homeDomain // webAuthDomain (6th argument)
  );
  return { challengeTxXdr, networkPassphrase };
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

    const homeDomain = getHomeDomain(req);
    const { challengeTxXdr, networkPassphrase } = createChallenge(clientAddress, homeDomain);

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
