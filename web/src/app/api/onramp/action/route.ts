import { NextResponse } from 'next/server';
import { 
  Keypair, 
  TransactionBuilder, 
  Address, 
  Contract, 
  nativeToScVal, 
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from '@/lib/stellar';
import { submitTransactionWithKeypair } from '@/lib/stellarUtils';

export async function POST(req: Request) {
  try {
    const { action, contractId, totalXlmRequired } = await req.json();

    if (!action || !contractId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const treasurySecret = process.env.TREASURY_SECRET_KEY;
    if (!treasurySecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const keypair = Keypair.fromSecret(treasurySecret);
    const sponsorAddress = keypair.publicKey();
    const account = await server.getAccount(sponsorAddress);
    const contract = new Contract(contractId);

    let txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE });

    if (action === 'accept') {
      txBuilder = txBuilder.addOperation(
        contract.call('accept_deliverable', new Address(sponsorAddress).toScVal())
      );
    } else if (action === 'deny') {
      txBuilder = txBuilder.addOperation(
        contract.call('deny_deliverable', new Address(sponsorAddress).toScVal())
      );
    } else if (action === 'cancel') {
      txBuilder = txBuilder.addOperation(
        contract.call('client_cancel_with_kill_fee', new Address(sponsorAddress).toScVal())
      );
    } else if (action === 'pay_revision') {
      if (!totalXlmRequired) {
        return NextResponse.json({ error: 'Missing totalXlmRequired for pay_revision' }, { status: 400 });
      }
      txBuilder = txBuilder.addOperation(
        contract.call('pay_for_revision', 
          new Address(sponsorAddress).toScVal(),
          nativeToScVal(BigInt(totalXlmRequired), { type: 'i128' })
        )
      );
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await submitTransactionWithKeypair(txBuilder, keypair);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`On-Ramp Action API Error [${errorMessage}]:`, error);
    return NextResponse.json({ error: errorMessage || 'Internal Server Error' }, { status: 500 });
  }
}
