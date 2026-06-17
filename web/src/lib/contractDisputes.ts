import {
  Address,
  Contract,
  nativeToScVal,
  TransactionBuilder,
  rpc,
  scValToNative,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';
import { submitTransaction } from './stellarUtils';

export interface DisputeProposal {
  proposer: string;
  freelancerPayout: bigint;
  clientRefund: bigint;
}

export async function requestMediation(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('request_mediation', new Address(callerAddress).toScVal()));
  return submitTransaction(txBuilder);
}

export async function escalateToMediator(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('escalate_to_mediator', new Address(callerAddress).toScVal()));
  return submitTransaction(txBuilder);
}

export async function proposeDisputeSplit(
  contractId: string,
  proposerAddress: string,
  freelancerPayoutStroops: string,
  clientRefundStroops: string
) {
  const account = await server.getAccount(proposerAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('propose_dispute_split',
        new Address(proposerAddress).toScVal(),
        nativeToScVal(BigInt(freelancerPayoutStroops), { type: 'i128' }),
        nativeToScVal(BigInt(clientRefundStroops), { type: 'i128' })
      )
    );
  return submitTransaction(txBuilder);
}

export async function acceptDisputeSplit(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('accept_dispute_split', new Address(callerAddress).toScVal()));
  return submitTransaction(txBuilder);
}

export async function rejectDisputeSplit(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('reject_dispute_split', new Address(callerAddress).toScVal()));
  return submitTransaction(txBuilder);
}

export async function claimDisputeTimeout(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('claim_dispute_timeout', new Address(callerAddress).toScVal()));
  return submitTransaction(txBuilder);
}

export async function getDisputeProposal(contractId: string, callerAddress: string): Promise<DisputeProposal | null> {
  try {
    const account = await server.getAccount(callerAddress);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(contractId).call('get_dispute_proposal'))
      .setTimeout(30).build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      const val = sim.result.retval;
      const native = scValToNative(val);
      
      if (Array.isArray(native) && native.length > 0) {
        const obj = native[0];
        if (obj && typeof obj === 'object') {
          return {
            proposer: typeof obj.proposer === 'string' ? obj.proposer : obj.proposer?.toString() || '',
            freelancerPayout: BigInt(obj.freelancer_payout || 0),
            clientRefund: BigInt(obj.client_refund || 0)
          };
        }
      } else if (native && typeof native === 'object' && !Array.isArray(native)) {
        return {
          proposer: typeof native.proposer === 'string' ? native.proposer : native.proposer?.toString() || '',
          freelancerPayout: BigInt(native.freelancer_payout || 0),
          clientRefund: BigInt(native.client_refund || 0)
        };
      }
    }
  } catch (e) {
    console.error('Failed to query getDisputeProposal:', e);
  }
  return null;
}

export async function resolveDispute(
  contractId: string,
  mediatorAddress: string,
  freelancerPayoutStroops: string,
  clientRefundStroops: string
) {
  const account = await server.getAccount(mediatorAddress);
  const contract = new Contract(contractId);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('resolve_dispute',
        new Address(mediatorAddress).toScVal(),
        nativeToScVal(BigInt(freelancerPayoutStroops), { type: 'i128' }),
        nativeToScVal(BigInt(clientRefundStroops), { type: 'i128' })
      )
    );
  return submitTransaction(txBuilder);
}
