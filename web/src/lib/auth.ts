import { signInWithCustomToken } from 'firebase/auth';
import { auth } from './firebase';
import { StellarWalletsKit } from './walletKit';

/**
 * Initiates the SEP-10 Web Authentication flow:
 * 1. Fetch challenge transaction from server
 * 2. Sign transaction using Stellar Wallets Kit
 * 3. Send signed transaction to server to verify and obtain custom Firebase token
 * 4. Authenticate with Firebase
 */
export async function loginWithStellar(stellarAddress: string): Promise<string> {
  const challengeRes = await fetch(`/api/auth/sep10/challenge?address=${encodeURIComponent(stellarAddress)}`);
  if (!challengeRes.ok) {
    const errBody = await challengeRes.json() as { error?: string };
    throw new Error(errBody.error || 'Failed to fetch SEP-10 challenge from server.');
  }

  const { challenge } = await challengeRes.json() as { challenge: string };
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(challenge);
  
  if (!signedTxXdr) {
    throw new Error('No signed transaction returned from wallet.');
  }

  const verifyRes = await fetch('/api/auth/sep10/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeTx: signedTxXdr }),
  });

  if (!verifyRes.ok) {
    const errBody = await verifyRes.json() as { error?: string };
    throw new Error(errBody.error || 'Server verification of SEP-10 signature failed.');
  }

  const { token } = await verifyRes.json() as { token: string };
  await signInWithCustomToken(auth, token);
  
  return stellarAddress;
}
