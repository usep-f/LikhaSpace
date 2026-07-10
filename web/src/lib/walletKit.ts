import { StellarWalletsKit, Networks } from '@creit.tech/stellar-wallets-kit';
import { FreighterModule } from '@creit.tech/stellar-wallets-kit/modules/freighter';
import { LobstrModule } from '@creit.tech/stellar-wallets-kit/modules/lobstr';
import { xBullModule } from '@creit.tech/stellar-wallets-kit/modules/xbull';
import { STELLAR_NETWORK } from './stellar';

if (typeof window !== 'undefined') {
  const freighter = new FreighterModule();
  // Override isAvailable to bypass the aggressive 1-second timeout check in StellarWalletsKit
  // that frequently fails to detect Freighter even when it is installed.
  freighter.isAvailable = async () => true;

  StellarWalletsKit.init({
    network: STELLAR_NETWORK === 'public' ? Networks.PUBLIC : Networks.TESTNET,
    modules: [
      freighter,
      new LobstrModule(),
      new xBullModule(),
    ],
  });
}

export { StellarWalletsKit };
