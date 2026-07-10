import {
  Address,
  Contract,
  nativeToScVal,
  TransactionBuilder,
  Operation,
  rpc,
  xdr,
  scValToBigInt,
  scValToNative,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';
import {
  submitTransaction,
  getContractIdFromTxResult,
} from './stellarUtils';

import {
  ESCROW_WASM_ID,
  ORACLE_ID,
  REPUTATION_CONTRACT_ID,
  TESTNET_XLM,
  TESTNET_USDC_CONTRACT_ID,
  DEFAULT_MEDIATOR,
  PLATFORM_TREASURY,
} from './contractConstants';

function buildMilestonesScVal(
  milestones: { payout_amount_usd: number; max_revisions: number }[]
): xdr.ScVal {
  const scvMilestones = milestones.map(m => {
    const entries = [
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('max_revisions'),
        val: xdr.ScVal.scvU32(m.max_revisions)
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('payout_amount_usd'),
        val: nativeToScVal(BigInt(m.payout_amount_usd), { type: 'i128' })
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('revisions_used'),
        val: xdr.ScVal.scvU32(0)
      }),
      new xdr.ScMapEntry({
        key: xdr.ScVal.scvSymbol('state'),
        val: xdr.ScVal.scvU32(0)
      })
    ];
    return xdr.ScVal.scvMap(entries);
  });
  return xdr.ScVal.scvVec(scvMilestones);
}

async function deployEscrowContract(clientAddress: string, salt: Uint8Array): Promise<string> {
  const account = await server.getAccount(clientAddress);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.createCustomContract({
      address: new Address(clientAddress),
      wasmHash: Buffer.from(ESCROW_WASM_ID, 'hex'),
      salt,
    }));

  const txResult = await submitTransaction(txBuilder);
  return getContractIdFromTxResult(txResult.resultMetaXdr);
}

async function initializeEscrowContract(
  contractId: string,
  clientAddress: string,
  freelancerAddress: string,
  paidRevisionPriceUsd: number,
  milestones: { payout_amount_usd: number; max_revisions: number }[],
  tokenContractId: string
): Promise<void> {
  const initAccount = await server.getAccount(clientAddress);
  const initTxBuilder = new TransactionBuilder(initAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(
      'initialize',
      new Address(freelancerAddress).toScVal(),
      new Address(clientAddress).toScVal(),
      new Address(tokenContractId).toScVal(),
      new Address(ORACLE_ID).toScVal(),
      new Address(DEFAULT_MEDIATOR).toScVal(),
      new Address(PLATFORM_TREASURY).toScVal(),
      new Address(REPUTATION_CONTRACT_ID).toScVal(),
      nativeToScVal(BigInt(paidRevisionPriceUsd), { type: 'i128' }),
      buildMilestonesScVal(milestones)
    ));

  await submitTransaction(initTxBuilder);
}

export async function deployAndInitializeEscrow(
  clientAddress: string,
  freelancerAddress: string,
  paidRevisionPriceUsd: number, 
  milestones: { payout_amount_usd: number; max_revisions: number }[],
  currency: 'XLM' | 'USDC' = 'XLM'
): Promise<string> {
  const salt = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  }
  const contractId = await deployEscrowContract(clientAddress, salt);
  if (!contractId) {
    throw new Error('Failed to parse contract ID from deployment metadata.');
  }
  
  const tokenContractId = currency === 'USDC' ? TESTNET_USDC_CONTRACT_ID : TESTNET_XLM;
  await initializeEscrowContract(contractId, clientAddress, freelancerAddress, paidRevisionPriceUsd, milestones, tokenContractId);
  return contractId;
}

export async function fundEscrow(contractId: string, clientAddress: string, maxAmountXlmStroops: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('fund',
        new Address(clientAddress).toScVal(),
        nativeToScVal(BigInt(maxAmountXlmStroops), { type: 'i128' })
      )
    );

  return submitTransaction(txBuilder);
}

export async function submitDeliverable(contractId: string, freelancerAddress: string) {
  const account = await server.getAccount(freelancerAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('submit_deliverable', new Address(freelancerAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function acceptDeliverable(contractId: string, clientAddress: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('accept_deliverable', new Address(clientAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function denyDeliverable(contractId: string, clientAddress: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('deny_deliverable', new Address(clientAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function payForRevision(contractId: string, clientAddress: string, maxAmountXlmStroops: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('pay_for_revision',
        new Address(clientAddress).toScVal(),
        nativeToScVal(BigInt(maxAmountXlmStroops), { type: 'i128' })
      )
    );

  return submitTransaction(txBuilder);
}

export async function refundRemaining(contractId: string, freelancerAddress: string) {
  const account = await server.getAccount(freelancerAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('refund_remaining', new Address(freelancerAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function cancelUnfunded(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('cancel_unfunded', new Address(callerAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function clientCancelWithKillFee(contractId: string, clientAddress: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('client_cancel_with_kill_fee', new Address(clientAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function claimRefundTimeout(contractId: string, clientAddress: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('claim_refund_timeout', new Address(clientAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function freelancerCancel(contractId: string, freelancerAddress: string) {
  const account = await server.getAccount(freelancerAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('freelancer_cancel', new Address(freelancerAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function getLockedBalance(contractId: string, callerAddress: string): Promise<bigint> {
  try {
    const account = await server.getAccount(callerAddress);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(contractId).call('get_locked_balance'))
      .setTimeout(30).build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      return scValToBigInt(sim.result.retval);
    }
  } catch (e) {
    console.error('Failed to query getLockedBalance:', e);
  }
  return BigInt(0);
}

export async function getHasSubmittedOnce(contractId: string, callerAddress: string): Promise<boolean> {
  try {
    const account = await server.getAccount(callerAddress);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(contractId).call('get_has_submitted_once'))
      .setTimeout(30).build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      return scValToNative(sim.result.retval) as boolean;
    }
  } catch (e) {
    console.error('Failed to query getHasSubmittedOnce:', e);
  }
  return false;
}
