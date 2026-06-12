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
 * Mocks fetching on-chain stats for a wallet address.
 * In production, this would query Horizon API or Stellar RPC.
 */
export async function fetchWalletStats(address: string): Promise<WalletStats> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // If the user's address is an empty string, fail
  if (!address) {
    throw new Error('No address provided');
  }

  // Mock returning valid stats for any address (to allow testing)
  // In a real app, if the address doesn't exist on-chain, it would return error.
  return {
    balanceXLM: 15.5,
    accountAgeDays: 14,
    totalTransactions: 3,
  };
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
