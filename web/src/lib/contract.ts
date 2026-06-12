import {
  Address,
  Contract,
  nativeToScVal,
  TransactionBuilder,
  Operation,
  rpc,
  xdr,
  scValToBigInt,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';
import {
  submitTransaction,
  getContractIdFromTxResult,
} from './stellarUtils';

export const ESCROW_WASM_ID = process.env.NEXT_PUBLIC_ESCROW_WASM_ID!;
export const ORACLE_ID = process.env.NEXT_PUBLIC_ORACLE_ID!;
export const TESTNET_XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // Standard testnet Native asset SAC

// Mock Mediator logic: In a real app this would come from Firebase
export const DEFAULT_MEDIATOR = process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS || 'GAFBCLO24QMPVXFZJHVLRG6CKAGBJEMCW57UG45SS7PQ2LGMZTGY7DGX';

export async function getOraclePrice(): Promise<number> {
  try {
    const dummyAccount = 'GAFBCLO24QMPVXFZJHVLRG6CKAGBJEMCW57UG45SS7PQ2LGMZTGY7DGX';
    const account = await server.getAccount(dummyAccount);

    let decimals = 14;
    const txDec = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(ORACLE_ID).call('decimals'))
      .setTimeout(30).build();
    const simDec = await server.simulateTransaction(txDec);
    if (rpc.Api.isSimulationSuccess(simDec) && simDec.result) {
      decimals = Number(scValToBigInt(simDec.result.retval));
    }

    const assetScVal = xdr.ScVal.scvVec([xdr.ScVal.scvSymbol('Other'), xdr.ScVal.scvSymbol('XLM')]);
    const txPrice = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(ORACLE_ID).call('lastprice', assetScVal))
      .setTimeout(30).build();
    const simPrice = await server.simulateTransaction(txPrice);
    
    if (rpc.Api.isSimulationSuccess(simPrice) && simPrice.result) {
      const val = simPrice.result.retval;
      if (val.switch() === xdr.ScValType.scvMap()) {
        const map = val.map();
        if (map) {
          for (const entry of map) {
            const key = entry.key();
            if (key.switch() === xdr.ScValType.scvSymbol()) {
              const symStr = key.sym().toString();
              if (symStr === 'price' || symStr.includes('price')) {
                const price = scValToBigInt(entry.val());
                if (price > BigInt(0)) {
                  const scale = BigInt(10) ** BigInt(decimals + 5);
                  return Number(scale / price);
                }
              }
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to fetch oracle price:', e);
  }
  return 10000;
}

export async function getRequiredXlmForGig(priceUSD: number): Promise<number> {
  const stroopsPerCent = await getOraclePrice();
  const totalCents = priceUSD * 100;
  const totalStroops = BigInt(totalCents) * BigInt(stroopsPerCent);
  return Number(totalStroops) / 10000000;
}

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
  upfrontAmountUsd: number,
  paidRevisionPriceUsd: number,
  milestones: { payout_amount_usd: number; max_revisions: number }[]
): Promise<void> {
  const initAccount = await server.getAccount(clientAddress);
  const initTxBuilder = new TransactionBuilder(initAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(
      'initialize',
      new Address(freelancerAddress).toScVal(),
      new Address(clientAddress).toScVal(),
      new Address(TESTNET_XLM).toScVal(),
      new Address(ORACLE_ID).toScVal(),
      new Address(DEFAULT_MEDIATOR).toScVal(),
      nativeToScVal(BigInt(upfrontAmountUsd), { type: 'i128' }),
      nativeToScVal(BigInt(paidRevisionPriceUsd), { type: 'i128' }),
      buildMilestonesScVal(milestones),
      nativeToScVal(BigInt(1209600), { type: 'u64' }),
      nativeToScVal(BigInt(2592000), { type: 'u64' })
    ));

  await submitTransaction(initTxBuilder);
}

export async function deployAndInitializeEscrow(
  clientAddress: string,
  freelancerAddress: string,
  upfrontAmountUsd: number, 
  paidRevisionPriceUsd: number, 
  milestones: { payout_amount_usd: number; max_revisions: number }[]
): Promise<string> {
  const salt = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  }
  const contractId = await deployEscrowContract(clientAddress, salt);
  if (!contractId) {
    throw new Error('Failed to parse contract ID from deployment metadata.');
  }
  await initializeEscrowContract(contractId, clientAddress, freelancerAddress, upfrontAmountUsd, paidRevisionPriceUsd, milestones);
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

export async function requestMediation(contractId: string, callerAddress: string) {
  const account = await server.getAccount(callerAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('request_mediation', new Address(callerAddress).toScVal()));

  return submitTransaction(txBuilder);
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

export async function releaseUpfront(contractId: string, clientAddress: string) {
  const account = await server.getAccount(clientAddress);
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('release_upfront', new Address(clientAddress).toScVal()));

  return submitTransaction(txBuilder);
}

export async function isUpfrontReleased(contractId: string, clientAddress: string): Promise<boolean> {
  try {
    const account = await server.getAccount(clientAddress);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(contractId).call('is_upfront_released'))
      .setTimeout(30).build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result) {
      const val = sim.result.retval;
      return val.switch() === xdr.ScValType.scvBool() && val.b();
    }
  } catch (e) {
    console.error('Failed to query isUpfrontReleased:', e);
  }
  return false;
}
