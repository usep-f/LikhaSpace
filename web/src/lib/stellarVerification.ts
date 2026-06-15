import { Horizon } from '@stellar/stellar-sdk';
import { HORIZON_URL } from './stellar';

export interface WalletStats {
  balanceXLM: number;
  accountAgeDays: number;
  totalTransactions: number;
}

export interface VerificationRules {
  minBalanceXLM: number;
  minAccountAgeDays: number;
  minTransactions: number;
}

// Sandbox defaults (can be manually adjusted in UI or here)
export const DEFAULT_RULES: VerificationRules = {
  minBalanceXLM: 1, // Stellar protocol minimum reserve
  minAccountAgeDays: 0,
  minTransactions: 0,
};

/**
 * Fetches live on-chain stats for a wallet address using Stellar Horizon.
 */
export async function fetchWalletStats(address: string): Promise<WalletStats> {
  if (!address) {
    throw new Error('No address provided');
  }

  try {
    const horizon = new Horizon.Server(HORIZON_URL);
    
    // 1. Fetch account balance
    const accountInfo = await horizon.loadAccount(address);
    const native = accountInfo.balances.find((b) => b.asset_type === 'native');
    const balanceXLM = native ? parseFloat(native.balance) : 0;

    // 2. Fetch the very first transaction to determine account age
    const oldestTxs = await horizon.transactions().forAccount(address).order('asc').limit(1).call();
    let accountAgeDays = 0;
    if (oldestTxs.records && oldestTxs.records.length > 0) {
      const createdAt = new Date(oldestTxs.records[0].created_at);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - createdAt.getTime());
      accountAgeDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    // 3. Fetch recent transactions to get a transaction count (up to 200)
    const recentTxs = await horizon.transactions().forAccount(address).order('desc').limit(200).call();
    const totalTransactions = recentTxs.records ? recentTxs.records.length : 0;

    return {
      balanceXLM,
      accountAgeDays,
      totalTransactions,
    };
  } catch (error: unknown) {
    // If the account does not exist on the network (e.g. 404 Not Found), it's completely unfunded.
    const errObj = error as Record<string, unknown>;
    const is404 = errObj?.response && (errObj.response as Record<string, unknown>).status === 404;
    if (is404) {
      return {
        balanceXLM: 0,
        accountAgeDays: 0,
        totalTransactions: 0,
      };
    }
    console.error('Error fetching wallet stats:', error);
    throw new Error('Failed to fetch wallet stats from the Stellar network.');
  }
}

/**
 * Checks if a wallet meets the required rules.
 */
export function verifyWallet(stats: WalletStats, rules: VerificationRules = DEFAULT_RULES): {
  isVerified: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let isVerified = true;

  if (stats.balanceXLM < rules.minBalanceXLM) {
    isVerified = false;
    reasons.push(`Minimum balance requirement not met (${stats.balanceXLM.toFixed(1)} XLM / ${rules.minBalanceXLM} XLM). You must fund your Stellar wallet with at least ${rules.minBalanceXLM} XLM to cover network base reserves.`);
  }

  if (stats.accountAgeDays < rules.minAccountAgeDays) {
    isVerified = false;
    reasons.push(`Account age requirement not met (${stats.accountAgeDays} days / ${rules.minAccountAgeDays} days).`);
  }

  if (stats.totalTransactions < rules.minTransactions) {
    isVerified = false;
    reasons.push(`Transaction history requirement not met (${stats.totalTransactions} txs / ${rules.minTransactions} txs).`);
  }

  return { isVerified, reasons };
}
