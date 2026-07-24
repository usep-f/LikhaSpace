import { NextResponse } from 'next/server';
import { 
  Keypair, 
  TransactionBuilder, 
  Operation, 
  Address, 
  Contract, 
  nativeToScVal, 
  Asset 
} from '@stellar/stellar-sdk';
import { server, NETWORK_PASSPHRASE } from '@/lib/stellar';
import { getContractIdFromTxResult, submitTransactionWithKeypair } from '@/lib/stellarUtils';
import { getOraclePrice } from '@/lib/contractOracle';
import { buildMilestonesScVal } from '@/lib/contractEscrow';
import {
  ESCROW_WASM_ID,
  ORACLE_ID,
  REPUTATION_CONTRACT_ID,
  TESTNET_XLM,
  TESTNET_USDC_CONTRACT_ID,
  TESTNET_USDC_ISSUER,
  DEFAULT_MEDIATOR,
  PLATFORM_TREASURY,
} from '@/lib/contractConstants';

export async function POST(req: Request) {
  try {
    const { orderId, freelancerAddress, priceUSD, currency, milestones } = await req.json();

    if (!orderId || !freelancerAddress || !priceUSD || !milestones) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const treasurySecret = process.env.TREASURY_SECRET_KEY;
    if (!treasurySecret) {
      return NextResponse.json({ error: 'Server configuration error: Missing TREASURY_SECRET_KEY' }, { status: 500 });
    }

    const keypair = Keypair.fromSecret(treasurySecret);
    const sponsorAddress = keypair.publicKey();

    // 1. Deploy the escrow contract
    const deployAccount = await server.getAccount(sponsorAddress);
    const salt = new Uint8Array(32);
    crypto.getRandomValues(salt);

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

    // 2. Initialize the escrow contract
    const initAccount = await server.getAccount(sponsorAddress);
    const tokenContractId = currency === 'USDC' ? TESTNET_USDC_CONTRACT_ID : TESTNET_XLM;
    const initTx = new TransactionBuilder(initAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(new Contract(contractId).call(
        'initialize',
        new Address(freelancerAddress).toScVal(),
        new Address(sponsorAddress).toScVal(), // Treasury acts as the client for this escrow
        new Address(tokenContractId).toScVal(),
        new Address(ORACLE_ID).toScVal(),
        new Address(DEFAULT_MEDIATOR).toScVal(),
        new Address(PLATFORM_TREASURY).toScVal(),
        new Address(REPUTATION_CONTRACT_ID).toScVal(),
        nativeToScVal(BigInt(1000), { type: 'i128' }), // default paid revision price: $10
        buildMilestonesScVal(milestones)
      ));

    await submitTransactionWithKeypair(initTx, keypair);

    // 3. Fund the escrow contract (and perform DEX swap if necessary)
    let totalTokenRequired = '';
    
    if (currency === 'USDC') {
      // 1 USDC = 1 USD. Multiply by 10^7 for stroops
      totalTokenRequired = (BigInt(Math.round(priceUSD * 100)) * BigInt(100000)).toString();
      
      const usdcAsset = new Asset('USDC', TESTNET_USDC_ISSUER);
      const swapAccount = await server.getAccount(sponsorAddress);
      
      const usdcAmount = priceUSD.toString();
      const sendMaxAmount = (priceUSD * 20).toString(); // overestimate max XLM to spend

      const swapTx = new TransactionBuilder(swapAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
        .addOperation(Operation.changeTrust({ asset: usdcAsset }))
        .addOperation(Operation.pathPaymentStrictReceive({
          sendAsset: Asset.native(),
          sendMax: sendMaxAmount,
          destAsset: usdcAsset,
          destAmount: usdcAmount,
          destination: sponsorAddress,
          path: []
        }));
      await submitTransactionWithKeypair(swapTx, keypair);
    } else {
      const stroopsPerCent = await getOraclePrice();
      totalTokenRequired = (BigInt(Math.round(priceUSD * 100)) * BigInt(stroopsPerCent)).toString();
    }

    const fundAccount = await server.getAccount(sponsorAddress);
    const contract = new Contract(contractId);
    const fundTx = new TransactionBuilder(fundAccount, { fee: '1000', networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(
        contract.call('fund',
          new Address(sponsorAddress).toScVal(),
          nativeToScVal(BigInt(totalTokenRequired), { type: 'i128' })
        )
      );

    await submitTransactionWithKeypair(fundTx, keypair);

    // Provide the contractId and the relay wallet public key 
    // (In production, the backend would update the DB itself and not send the secret back,
    // but for LikhaSpace architecture, the client manages state or we just return the contract ID)
    return NextResponse.json({ 
      success: true, 
      contractId,
      relayerAddress: sponsorAddress
    });

  } catch (error: unknown) {
    console.error('On-Ramp API Error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
