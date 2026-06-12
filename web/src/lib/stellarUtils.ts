import {
  TransactionBuilder,
  rpc,
  xdr,
  Address,
} from '@stellar/stellar-sdk';
import * as Freighter from '@stellar/freighter-api';
import { server, NETWORK_PASSPHRASE } from './stellar';

export type TxStatusListener = (status: { isProcessing: boolean; message: string }) => void;
const listeners = new Set<TxStatusListener>();

export function subscribeToTxStatus(listener: TxStatusListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyTxStatus(isProcessing: boolean, message: string = '') {
  listeners.forEach(l => l({ isProcessing, message }));
}

async function validateActiveWallet(expectedAddr: string): Promise<void> {
  const freighterInfo = await Freighter.getAddress();
  const activeAddr = freighterInfo?.address;
  if (activeAddr && activeAddr !== expectedAddr) {
    throw new Error(
      `Wallet account mismatch: Active Freighter account is ${activeAddr}, but this action requires ${expectedAddr}. Please switch accounts in Freighter.`
    );
  }
}

export async function submitTransaction(txBuilder: TransactionBuilder) {
  notifyTxStatus(true, 'Preparing transaction...');
  try {
    const tx = txBuilder.setTimeout(100).build();
    await validateActiveWallet(tx.source);
    
    notifyTxStatus(true, 'Simulating transaction...');
    const simResponse = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationError(simResponse)) {
      throw new Error(`Simulation failed: ${simResponse.error}`);
    }
    const assembledTx = rpc.assembleTransaction(tx, simResponse);
    (assembledTx as unknown as { baseFee: string }).baseFee = '0';
    
    notifyTxStatus(true, 'Awaiting Freighter approval...');
    const signedResponse = await Freighter.signTransaction(assembledTx.build().toXDR(), {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    if (signedResponse.error) {
      throw new Error(`Signing failed: ${signedResponse.error}`);
    }
    const signedResponseObj = signedResponse as unknown as { signedTxXdr?: string, signedTransaction?: string };
    const signedTxXdr = signedResponseObj.signedTxXdr || signedResponseObj.signedTransaction;
    if (!signedTxXdr) {
      throw new Error('No signed transaction returned from Freighter.');
    }

    // Save to localStorage for recovery
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('likha_pending_tx', signedTxXdr);
    }

    notifyTxStatus(true, 'Sponsoring gas fees...');
    const sponsorRes = await fetch('/api/sponsor-tx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ txXdr: signedTxXdr }),
    });
    
    if (!sponsorRes.ok) {
      const errorText = await sponsorRes.text();
      throw new Error(`Sponsorship API failed: ${errorText}`);
    }
    
    const { hash } = await sponsorRes.json();
    
    notifyTxStatus(true, 'Confirming on-chain...');
    const result = await pollTransaction(hash);

    // Clear localStorage on success
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('likha_pending_tx');
    }

    return result;
  } finally {
    notifyTxStatus(false);
  }
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
