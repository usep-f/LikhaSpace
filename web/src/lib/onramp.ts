import {
  Address,
  Contract,
  nativeToScVal,
  TransactionBuilder,
  Operation,
  rpc,
  xdr,
  Keypair,
  Asset,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE, fundWithFriendbot } from './stellar';
import { pollTransaction, getContractIdFromTxResult } from './stellarUtils';
import {
  ESCROW_WASM_ID,
  ORACLE_ID,
  REPUTATION_CONTRACT_ID,
  TESTNET_XLM,
  TESTNET_USDC_ISSUER,
  TESTNET_USDC_CONTRACT_ID,
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

// Removed onRampFundEscrow (Moved to backend API route)

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
