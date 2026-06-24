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
async function handleResponseError(res: Response, defaultMsg: string): Promise<never> {
  let errMsg = defaultMsg;
  try {
    const errBody = await res.json() as { error?: string };
    if (errBody.error) errMsg = errBody.error;
  } catch {
    try {
      const text = await res.text();
      errMsg = `Server error (${res.status}): ${text.slice(0, 200)}`;
    } catch {
      errMsg = `Server returned status code ${res.status}`;
    }
  }
  throw new Error(errMsg);
}

async function fetchChallenge(stellarAddress: string): Promise<string> {
  const url = `/api/auth/sep10/challenge?address=${encodeURIComponent(stellarAddress)}`;
  const challengeRes = await fetch(url);
  if (!challengeRes.ok) {
    await handleResponseError(challengeRes, 'Failed to fetch SEP-10 challenge from server.');
  }
  const { challenge } = await challengeRes.json() as { challenge: string };
  return challenge;
}

async function verifyChallenge(signedTxXdr: string): Promise<string> {
  const verifyRes = await fetch('/api/auth/sep10/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengeTx: signedTxXdr }),
  });
  if (!verifyRes.ok) {
    await handleResponseError(verifyRes, 'Server verification of SEP-10 signature failed.');
  }
  const { token } = await verifyRes.json() as { token: string };
  return token;
}

export async function loginWithStellar(stellarAddress: string): Promise<string> {
  const challenge = await fetchChallenge(stellarAddress);
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(challenge);
  
  if (!signedTxXdr) {
    throw new Error('No signed transaction returned from wallet.');
  }

  const token = await verifyChallenge(signedTxXdr);
  await signInWithCustomToken(auth, token);
  
  return stellarAddress;
}
