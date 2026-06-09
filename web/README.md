# LikhaSpace (Frontend App)

LikhaSpace is the frontend interface for the decentralized, trustless freelance marketplace, enabling clients, artists, and mediators to interact seamlessly with Soroban smart contracts on the Stellar Testnet.

## Problem
Traditional freelance platforms extract 10% to 20% of creative earnings, delay payouts, and lack transparent, decentralized arbitration. For Filipino freelancers, these issues are magnified by high payout fees and local payment gatekeeper delays. LikhaSpace's user interface connects global clients with local talent, providing visual management of smart escrows and on-chain arbitration splits without fee extraction.

## How It Works
1. **Wallet Connection:** The user connects their Freighter wallet (running on Stellar Testnet) and selects their role (Client or Artist).
2. **Onboarding & Profiling:** The web app captures the connected public key and syncs user roles and metadata to Firebase Firestore.
3. **Gig Board / Feed:** Browse active gig postings synced from Firestore. The app fetches real-time XLM conversion rates via CoinGecko API to display accurate XLM estimates alongside USD budgets.
4. **Client Console:** Clients can fill out a form to initialize and fund escrows on-chain, release escrow balances to freelancers, or file disputes.
5. **Artist Profile Portal:** Artists can track active engagements, view their on-chain reputation stats (completed project counts, earnings), and submit deliverable links to the smart contract.
6. **Mediator Arbitration Console:** Mediators can view disputed cases, slide to set settlement split percentages, and submit resolution transactions to the contract.

## How It Uses Stellar
- **Freighter API:** Integrates Freighter wallet for user sign-in and transaction signing, implementing dynamic imports to prevent Server-Side Rendering (SSR) page crashes.
- **Stellar SDK:** Uses `@stellar/stellar-sdk` v15 (specifically the `rpc` namespace) to simulate transactions, assemble fees/resources, submit to Soroban RPC, and poll transaction finality.
- **On-Chain Queries:** Queries user balances directly from Horizon endpoints and interacts with the smart contract state via Soroban RPC.

## Track
Financial Inclusion / Remittance

## Tech Stack
- **Framework:** Next.js 16 (React 19, TypeScript)
- **Stellar SDK:** `@stellar/stellar-sdk` v15.1.0 and `@stellar/freighter-api` v6.0.1
- **Network:** Stellar Testnet
- **Database:** Firebase Firestore (v12.14.0) for listing indexing and caching
- **Icons & UI:** Lucide React, Tailwind CSS v4, and Orbit/Outfit fonts

## Setup & Run
### Prerequisites
- **Node.js 20+** and **npm**
- **Freighter Browser Extension** configured to the **Test Net**

### Installation & Execution
1. Navigate to the `web` folder:
   ```bash
   cd web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables by creating `.env.local`:
   ```env
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_CONTRACT_ID=your-deployed-contract-id
   
   # Firebase configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBNicL0JJlvlrW0bggL-_-1QuXF6Jx-oCE
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=likhaspace-dfd01.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=likhaspace-dfd01
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=likhaspace-dfd01.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=164171081717
   NEXT_PUBLIC_FIREBASE_APP_ID=1:164171081717:web:642b85a357eb8787b1a2bc
   ```

4. Run the local development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the client-side app.

## Network Details
- **Network:** Stellar Testnet (`stellar:testnet`)
- **RPC URL:** `https://soroban-testnet.stellar.org`
- **Horizon URL:** `https://horizon-testnet.stellar.org`
- **USDC Issuer Address (Stellar Testnet):** `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- **Contract IDs:**
  - `likha-escrow`: [Read from `NEXT_PUBLIC_CONTRACT_ID`]

## Team
- Venrei Joseph — @usep-f

## License
MIT License
