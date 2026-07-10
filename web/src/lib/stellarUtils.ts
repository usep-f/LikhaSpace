import {
  TransactionBuilder,
  rpc,
  xdr,
  Address,
  Keypair,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';
import { StellarWalletsKit } from './walletKit';

async function validateActiveWallet(expectedAddr: string): Promise<void> {
  const { address } = await StellarWalletsKit.getAddress();
  if (address && address !== expectedAddr) {
    throw new Error(
      `Wallet account mismatch: Active wallet account is ${address}, but this action requires ${expectedAddr}. Please switch accounts in your wallet.`
    );
  }
}

export async function submitTransaction(txBuilder: TransactionBuilder) {
  const tx = txBuilder.setTimeout(100).build();
  await validateActiveWallet(tx.source);
  const simResponse = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResponse)) {
    throw new Error(`Simulation failed: ${simResponse.error}`);
  }
  const assembledTx = rpc.assembleTransaction(tx, simResponse);

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(assembledTx.build().toXDR());
  if (!signedTxXdr) {
    throw new Error('No signed transaction returned from wallet.');
  }
  
  const signedTx = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  const submission = await server.sendTransaction(signedTx);
  if (submission.status === 'ERROR') {
    const errXdr = submission.errorResult ? submission.errorResult.toXDR('base64') : 'Unknown error';
    throw new Error(`Submission failed: ${errXdr}`);
  }
  return pollTransaction(submission.hash);
}

export async function submitTransactionWithKeypair(txBuilder: TransactionBuilder, keypair: Keypair) {
  const tx = txBuilder.setTimeout(100).build();
  const simResponse = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResponse)) {
    throw new Error(`Simulation failed: ${simResponse.error}`);
  }
  const assembledTx = rpc.assembleTransaction(tx, simResponse).build();
  assembledTx.sign(keypair);
  
  const submission = await server.sendTransaction(assembledTx);
  if (submission.status === 'ERROR') {
    const errXdr = submission.errorResult ? submission.errorResult.toXDR('base64') : 'Unknown error';
    throw new Error(`Submission failed: ${errXdr}`);
  }
  return pollTransaction(submission.hash);
}

export async function pollTransaction(hash: string, maxAttempts = 60) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    const txResponse = await server.getTransaction(hash);
    if (txResponse.status === 'SUCCESS') {
      return txResponse;
    } else if (txResponse.status === 'FAILED') {
      throw new Error(`Transaction failed on-chain: ${txResponse.resultXdr}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  throw new Error('Transaction timed out waiting for confirmation.');
}

export function getContractIdFromTxResult(resultMetaXdr: xdr.TransactionMeta | string): string {
  try {
    const meta = typeof resultMetaXdr === 'string'
      ? xdr.TransactionMeta.fromXDR(resultMetaXdr, 'base64')
      : resultMetaXdr;
    let returnValue: xdr.ScVal | undefined;
    const sw = meta.switch();
    if (sw === 3) {
      returnValue = meta.v3().sorobanMeta()?.returnValue();
    } else if (sw === 4) {
      const metaV4 = meta as unknown as {
        v4?: () => {
          sorobanMeta?: () => { returnValue?: () => xdr.ScVal };
        };
      };
      returnValue = metaV4.v4?.()?.sorobanMeta?.()?.returnValue?.();
    }
    if (returnValue) {
      return Address.fromScVal(returnValue).toString();
    }
  } catch (err) {
    console.error('Failed to parse contract ID:', err);
  }
  return '';
}
