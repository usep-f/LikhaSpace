import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { STELLAR_NETWORK } from './stellar';

if (typeof window !== 'undefined') {
  StellarWalletsKit.init({
    network: STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET,
    modules: [
      new FreighterModule(),
      new LobstrModule(),
      new xBullModule(),
    ],
  });
}

export { StellarWalletsKit };
