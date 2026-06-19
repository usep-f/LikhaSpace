import {
  Address,
  Contract,
  TransactionBuilder,
  rpc,
  xdr,
  scValToNative,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';

import { REPUTATION_CONTRACT_ID } from './contractConstants';

export interface ReputationData {
  projectsCompleted: number;
  totalEarnedStroops: bigint;
  ratingSum: number;
  ratingCount: number;
  reviews: Array<{
    client: string;
    rating: number;
    text: string;
    timestamp: number;
  }>;
}

export async function submitReviewTransaction(
  clientAddress: string,
  freelancerAddress: string,
  rating: number,
  reviewText: string
) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(REPUTATION_CONTRACT_ID);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('add_review',
        new Address(clientAddress).toScVal(),
        new Address(freelancerAddress).toScVal(),
        xdr.ScVal.scvU32(rating),
        xdr.ScVal.scvString(reviewText)
      )
    );

  const { submitTransaction } = await import('./stellarUtils');
  return submitTransaction(txBuilder);
}

export async function getFreelancerReputation(freelancerAddress: string): Promise<ReputationData | null> {
  try {
    const account = await server.getAccount(freelancerAddress);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(REPUTATION_CONTRACT_ID).call('get_reputation', new Address(freelancerAddress).toScVal()))
      .setTimeout(30).build();
      
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      const native = scValToNative(sim.result.retval);
      if (native && typeof native === 'object') {
        const nativeObj = native as Record<string, unknown>;
        const reviewsList = nativeObj.reviews;
        const reviews = Array.isArray(reviewsList) ? (reviewsList as Array<Record<string, unknown>>).map((r) => ({
          client: typeof r.client === 'string' ? r.client : (typeof r.client === 'object' && r.client ? r.client.toString() : ''),
          rating: Number(r.rating || 0),
          text: typeof r.text === 'string' ? r.text : '',
          timestamp: Number(r.timestamp || 0)
        })) : [];
        
        return {
          projectsCompleted: Number(nativeObj.projects_completed || 0),
          totalEarnedStroops: BigInt((nativeObj.total_earned_stroops as number | bigint | string) || 0),
          ratingSum: Number(nativeObj.rating_sum || 0),
          ratingCount: Number(nativeObj.rating_count || 0),
          reviews
        };
      }
    }
  } catch (e) {
    console.error('Failed to query getFreelancerReputation:', e);
  }
  return null;
}
