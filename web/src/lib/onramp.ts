import {
  Address,
  Contract,
  nativeToScVal,
  TransactionBuilder,
  Operation,
  rpc,
  xdr,
  Keypair,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, fundWithFriendbot } from './stellar';
import { pollTransaction, getContractIdFromTxResult } from './stellarUtils';
import {
  ESCROW_WASM_ID,
  ORACLE_ID,
  REPUTATION_CONTRACT_ID,
  TESTNET_XLM,
  DEFAULT_MEDIATOR,
  PLATFORM_TREASURY,
} from './contractConstants';
import { getOraclePrice } from './contractOracle';

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

async function submitTransactionWithKeypair(txBuilder: TransactionBuilder, keypair: Keypair) {
  const tx = txBuilder.setTimeout(100).build();
  const simResponse = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResponse)) {
    throw new Error(`Simulation failed: ${simResponse.error}`);
  }
  const assembledTx = rpc.assembleTransaction(tx, simResponse).build();
  assembledTx.sign(keypair);
  
  const submission = await server.sendTransaction(assembledTx);
  if (submission.status === 'ERROR') {
    const errXdr = submission.errorResult ? submission.errorResult.toXDR('base64') : 'Unknown error';
    throw new Error(`Submission failed: ${errXdr}`);
  }
  return pollTransaction(submission.hash);
}

export async function onRampFundEscrow(
  freelancerAddress: string,
  priceUSD: number,
  milestones: { payout_amount_usd: number; max_revisions: number }[]
): Promise<{ contractId: string; secret: string }> {
  // 1. Generate a random sponsor keypair representing the on-ramp relayer
  const keypair = Keypair.random();
  const sponsorAddress = keypair.publicKey();
  
  // 2. Fund the sponsor account via Friendbot
  const funded = await fundWithFriendbot(sponsorAddress);
  if (!funded) {
    throw new Error('Failed to fund on-ramp sponsor account using Friendbot.');
  }

  // 3. Wait a moment to ensure ledger gets updated
  await new Promise(r => setTimeout(r, 2000));

  // 4. Deploy the escrow contract
  const deployAccount = await server.getAccount(sponsorAddress);
  const salt = new Uint8Array(32);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  }

  const deployTx = new TransactionBuilder(deployAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(Operation.createCustomContract({
      address: new Address(sponsorAddress),
      wasmHash: Buffer.from(ESCROW_WASM_ID, 'hex'),
      salt,
    }));

  const deployResult = await submitTransactionWithKeypair(deployTx, keypair);
  const contractId = getContractIdFromTxResult(deployResult.resultMetaXdr);
  if (!contractId) {
    throw new Error('Failed to parse contract ID from deployment metadata.');
  }

  // 5. Initialize the escrow contract
  const initAccount = await server.getAccount(sponsorAddress);
  const initTx = new TransactionBuilder(initAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(new Contract(contractId).call(
      'initialize',
      new Address(freelancerAddress).toScVal(),
      new Address(sponsorAddress).toScVal(),
      new Address(TESTNET_XLM).toScVal(),
      new Address(ORACLE_ID).toScVal(),
      new Address(DEFAULT_MEDIATOR).toScVal(),
      new Address(PLATFORM_TREASURY).toScVal(),
      new Address(REPUTATION_CONTRACT_ID).toScVal(),
      nativeToScVal(BigInt(1000), { type: 'i128' }), // default paid revision price: $10
      buildMilestonesScVal(milestones)
    ));

  await submitTransactionWithKeypair(initTx, keypair);

  // 6. Fund the escrow contract
  const stroopsPerCent = await getOraclePrice();
  const totalXlmRequired = (BigInt(priceUSD * 100) * BigInt(stroopsPerCent)).toString();

  const fundAccount = await server.getAccount(sponsorAddress);
  const contract = new Contract(contractId);
  const fundTx = new TransactionBuilder(fundAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('fund',
        new Address(sponsorAddress).toScVal(),
        nativeToScVal(BigInt(totalXlmRequired), { type: 'i128' })
      )
    );

  await submitTransactionWithKeypair(fundTx, keypair);

  return {
    contractId,
    secret: keypair.secret(),
  };
}

/**
 * Keypair-signed wrappers for client actions on an on-ramp funded project
 */
export async function acceptDeliverableWithKeypair(contractId: string, secretKey: string) {
  const keypair = Keypair.fromSecret(secretKey);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('accept_deliverable', new Address(keypair.publicKey()).toScVal()));

  return submitTransactionWithKeypair(txBuilder, keypair);
}

export async function denyDeliverableWithKeypair(contractId: string, secretKey: string) {
  const keypair = Keypair.fromSecret(secretKey);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('deny_deliverable', new Address(keypair.publicKey()).toScVal()));

  return submitTransactionWithKeypair(txBuilder, keypair);
}

export async function payForRevisionWithKeypair(contractId: string, secretKey: string, maxAmountXlmStroops: string) {
  const keypair = Keypair.fromSecret(secretKey);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(
      contract.call('pay_for_revision',
        new Address(keypair.publicKey()).toScVal(),
        nativeToScVal(BigInt(maxAmountXlmStroops), { type: 'i128' })
      )
    );

  return submitTransactionWithKeypair(txBuilder, keypair);
}

export async function clientCancelWithKillFeeWithKeypair(contractId: string, secretKey: string) {
  const keypair = Keypair.fromSecret(secretKey);
  const account = await server.getAccount(keypair.publicKey());
  const contract = new Contract(contractId);
  
  const txBuilder = new TransactionBuilder(account, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(contract.call('client_cancel_with_kill_fee', new Address(keypair.publicKey()).toScVal()));

  return submitTransactionWithKeypair(txBuilder, keypair);
}
