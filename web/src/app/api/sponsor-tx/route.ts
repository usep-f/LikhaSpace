import { NextRequest, NextResponse } from 'next/server';
import { TransactionBuilder, Keypair, Transaction } from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from '@/lib/stellar';

let cachedSponsorKeypair: Keypair | null = null;

async function getOrCreateSponsorKeypair(): Promise<Keypair> {
  if (cachedSponsorKeypair) return cachedSponsorKeypair;

  if (process.env.SPONSOR_SECRET_KEY) {
    cachedSponsorKeypair = Keypair.fromSecret(process.env.SPONSOR_SECRET_KEY);
    return cachedSponsorKeypair;
  }

  // Generate a temporary one for development
  console.log('No SPONSOR_SECRET_KEY found. Generating a temporary keypair for fee sponsorship...');
  const keypair = Keypair.random();
  console.log(`Generated Sponsor Public Key: ${keypair.publicKey()}`);
  
  try {
    console.log('Funding temporary sponsor account via Friendbot...');
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(keypair.publicKey())}`);
    if (!response.ok) {
      throw new Error(`Friendbot returned ${response.statusText}`);
    }
    console.log('Sponsor account funded successfully.');
  } catch (error) {
    console.error('Failed to fund sponsor account:', error);
  }

  cachedSponsorKeypair = keypair;
  return keypair;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txXdr } = body;

    if (!txXdr) {
      return NextResponse.json({ error: 'Missing txXdr' }, { status: 400 });
    }

    const innerTx = TransactionBuilder.fromXDR(txXdr, NETWORK_PASSPHRASE) as Transaction;
    const sponsorKeypair = await getOrCreateSponsorKeypair();

    // The fee should be at least the inner transaction fee
    const feeBumpTx = TransactionBuilder.buildFeeBumpTransaction(
      sponsorKeypair.publicKey(),
      '100000', // max fee per operation for fee bump
      innerTx,
      NETWORK_PASSPHRASE
    );

    feeBumpTx.sign(sponsorKeypair);

    const submission = await server.sendTransaction(feeBumpTx);

    if (submission.status === 'ERROR') {
      const errXdr = submission.errorResult ? submission.errorResult.toXDR('base64') : 'Unknown error';
      console.error('Fee Bump Submission failed:', errXdr);
      return NextResponse.json({ error: `Fee Bump Submission failed: ${errXdr}` }, { status: 500 });
    }

    return NextResponse.json({ hash: submission.hash, status: submission.status });
  } catch (error: unknown) {
    console.error('Error in /api/sponsor-tx:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
