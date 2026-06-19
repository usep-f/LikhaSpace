import {
  Address,
  Contract,
  TransactionBuilder,
  rpc,
  xdr,
  scValToBigInt,
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from './stellar';

import { ORACLE_ID, TESTNET_XLM } from './contractConstants';

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

    const assetScVal = xdr.ScVal.scvVec([
      xdr.ScVal.scvSymbol('Stellar'),
      new Address(TESTNET_XLM).toScVal()
    ]);
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
    throw new Error('Simulation failed to retrieve price from oracle');
  } catch (e) {
    console.error('Failed to fetch oracle price:', e);
    throw e;
  }
}

export async function getRequiredXlmForGig(priceUSD: number): Promise<number> {
  const stroopsPerCent = await getOraclePrice();
  const totalCents = priceUSD * 100;
  const totalStroops = BigInt(totalCents) * BigInt(stroopsPerCent);
  return Number(totalStroops) / 10000000;
}
