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
export const PROFILE_REGISTRY_ID = process.env.NEXT_PUBLIC_PROFILE_REGISTRY_ID!;
export const TESTNET_XLM = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'; // Standard testnet Native asset SAC

// Mock Mediator logic: In a real app this would come from Firebase
export const DEFAULT_MEDIATOR = process.env.NEXT_PUBLIC_MEDIATOR_ADDRESS || 'GAFBCLO24QMPVXFZJHVLRG6CKAGBJEMCW57UG45SS7PQ2LGMZTGY7DGX';

function parsePriceFeedEntry(retval: xdr.ScVal): bigint | null {
  if (retval.switch() === xdr.ScValType.scvVoid()) return null;
  if (retval.switch() === xdr.ScValType.scvMap()) {
    const map = retval.map();
    if (!map) return null;
    for (const entry of map) {
      if (entry.key().switch() === xdr.ScValType.scvSymbol() && entry.key().sym().toString() === 'price') {
        return scValToBigInt(entry.val());
      }
    }
  }
  return null;
}

export async function getOraclePrice(): Promise<number> {
  try {
    const dummyAccount = 'GAFBCLO24QMPVXFZJHVLRG6CKAGBJEMCW57UG45SS7PQ2LGMZTGY7DGX';
    const account = await server.getAccount(dummyAccount);
    const assetScVal = xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol('Other'),
      xdr.ScVal.scvSymbol('XLM'),
    ]);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(ORACLE_ID).call('lastprice', assetScVal))
      .setTimeout(30)
      .build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result && sim.result.retval) {
      const priceVal = parsePriceFeedEntry(sim.result.retval);
      if (priceVal && priceVal > BigInt(0)) {
        return Number(BigInt("10000000000000") / priceVal);
      }
    }
  } catch (e) {
    console.error('Failed to fetch oracle price:', e);
  }
  return 1000000;
}

export async function getProfileCID(userAddress: string): Promise<string | null> {
  try {
    const dummyAccount = 'GAFBCLO24QMPVXFZJHVLRG6CKAGBJEMCW57UG45SS7PQ2LGMZTGY7DGX';
    const account = await server.getAccount(dummyAccount);
    const tx = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(PROFILE_REGISTRY_ID).call('get_profile', new Address(userAddress).toScVal()))
      .setTimeout(30)
      .build();
    const sim = await server.simulateTransaction(tx);
    if (rpc.Api.isSimulationSuccess(sim) && sim.result && sim.result.retval) {
      const retval = sim.result.retval;
      if (retval.switch() !== xdr.ScValType.scvVoid() && retval.str()) {
        return retval.str().toString();
      }
    }
  } catch (e) {
    console.error('Failed to get profile CID:', e);
  }
  return null;
}

export async function setProfileCID(userAddress: string, ipfsCid: string) {
  const account = await server.getAccount(userAddress);
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      new Contract(PROFILE_REGISTRY_ID).call(
        'set_profile',
        new Address(userAddress).toScVal(),
        xdr.ScVal.scvString(ipfsCid)
      )
    );
  return submitTransaction(txBuilder);
}

export async function getContractEvents(contractId: string, topics?: string[][]) {
  try {
    const latest = await server.getLatestLedger();
    const startLedger = Math.max(1, latest.sequence - 50000);
    const filters = [{
      type: 'contract' as const,
      contractIds: [contractId],
      ...(topics ? { topics } : {})
    }];
    const response = await server.getEvents({
      startLedger,
      filters,
      limit: 100
    });
    return response.events || [];
  } catch (e) {
    console.error('getContractEvents failed:', e);
    return [];
  }
}

export async function getRegisteredProfiles(): Promise<Map<string, string>> {
  const events = await getContractEvents(PROFILE_REGISTRY_ID);
  const profilesMap = new Map<string, string>();
  for (const ev of events) {
    try {
      const topic = ev.topic;
      if (topic && topic.length >= 2) {
        const eventName = topic[0].sym().toString();
        if (eventName === 'profile_set') {
          const userAddr = Address.fromScVal(topic[1]).toString();
          const ipfsCid = ev.value.str().toString();
          profilesMap.set(userAddr, ipfsCid);
        }
      }
    } catch (e) {
      console.warn('Failed to parse event:', e);
    }
  }
  return profilesMap;
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

function parseEscrowStatus(val: xdr.ScVal): number {
  if (val.switch() === xdr.ScValType.scvVoid()) return 0;
  if (val.switch() === xdr.ScValType.scvSymbol()) {
    const sym = val.sym().toString();
    if (sym === 'Unfunded') return 0;
    if (sym === 'Funded') return 1;
    if (sym === 'Completed') return 2;
    if (sym === 'Disputed') return 3;
    if (sym === 'Cancelled') return 4;
  }
  try { return val.u32(); } catch { return 0; }
}

function parseMilestoneState(val: xdr.ScVal): string {
  if (val.switch() === xdr.ScValType.scvVoid()) return 'locked';
  if (val.switch() === xdr.ScValType.scvSymbol()) {
    return val.sym().toString().toLowerCase();
  }
  try {
    const num = val.u32();
    return ['locked', 'active', 'submitted', 'approved', 'disputed'][num] || 'locked';
  } catch { return 'locked'; }
}

interface EscrowMilestone {
  payoutUSD: number;
  maxRevisions: number;
  revisionsUsed: number;
  state: string;
}

export async function getEscrowStateOnChain(contractId: string) {
  try {
    const dummyAccount = 'GAFBCLO24QMPVXFZJHVLRG6CKAGBJEMCW57UG45SS7PQ2LGMZTGY7DGX';
    const account = await server.getAccount(dummyAccount);
    const contract = new Contract(contractId);

    const txStatus = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call('get_status')).setTimeout(30).build();
    const simStatus = await server.simulateTransaction(txStatus);

    const txMilestones = new TransactionBuilder(account, { fee: '100', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call('get_milestones')).setTimeout(30).build();
    const simMilestones = await server.simulateTransaction(txMilestones);

    let status = 0;
    if (rpc.Api.isSimulationSuccess(simStatus) && simStatus.result && simStatus.result.retval) {
      status = parseEscrowStatus(simStatus.result.retval);
    }

    let milestones: EscrowMilestone[] = [];

    if (rpc.Api.isSimulationSuccess(simMilestones) && simMilestones.result && simMilestones.result.retval) {
      const retval = simMilestones.result.retval;
      if (retval.switch() === xdr.ScValType.scvVec()) {
        const vec = retval.vec() || [];
        milestones = vec.map((itemScVal) => {
          const map = itemScVal.map();
          let payout_amount_usd = 0;
          let max_revisions = 0;
          let revisions_used = 0;
          let state = 'locked';
          if (map) {
            for (const entry of map) {
              const key = entry.key().sym().toString();
              if (key === 'payout_amount_usd') {
                payout_amount_usd = Number(scValToBigInt(entry.val()));
              } else if (key === 'max_revisions') {
                max_revisions = entry.val().u32();
              } else if (key === 'revisions_used') {
                revisions_used = entry.val().u32();
              } else if (key === 'state') {
                state = parseMilestoneState(entry.val());
              }
            }
          }
          return {
            payoutUSD: payout_amount_usd,
            maxRevisions: max_revisions,
            revisionsUsed: revisions_used,
            state,
          };
        });
      }
    }
    return { status, milestones };
  } catch (e) {
    console.error(`Failed to get escrow state on-chain for ${contractId}:`, e);
    return null;
  }
}

