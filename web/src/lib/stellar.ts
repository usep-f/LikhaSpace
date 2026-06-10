import { rpc, Networks, Horizon } from '@stellar/stellar-sdk';
import * as Freighter from '@stellar/freighter-api';

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK || 'testnet';
export const RPC_URL = process.env.NEXT_PUBLIC_STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org';
export const HORIZON_URL = process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

export async function getXlmBalance(address: string): Promise<number> {
  try {
    const horizon = new Horizon.Server(HORIZON_URL);
    const accountInfo = await horizon.loadAccount(address);
    const native = accountInfo.balances.find((b) => b.asset_type === 'native');
    return native ? parseFloat(native.balance) : 0;
  } catch (error) {
    console.error('Failed to fetch XLM balance:', error);
    return 0;
  }
}

// Always use the correct network passphrase
export const NETWORK_PASSPHRASE = Networks.TESTNET;

// The main RPC server instance for Soroban
export const server = new rpc.Server(RPC_URL, { allowHttp: true });

/**
 * Funds an account on the testnet using Friendbot.
 */
export async function fundWithFriendbot(address: string): Promise<boolean> {
  try {
    const response = await fetch(`https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`);
    return response.ok;
  } catch (error) {
    console.error('Friendbot funding failed:', error);
    return false;
  }
}

/**
 * Helper to get the current connected wallet address via Freighter.
 */
export async function getConnectedAddress(): Promise<string | null> {
  if (await Freighter.isConnected()) {
    const pubKey = await Freighter.getAddress();
    if (pubKey.address) {
      return pubKey.address;
    }
  }
  return null;
}
