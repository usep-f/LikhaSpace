# LikhaSpace

LikhaSpace is a decentralized, trustless freelance marketplace for Filipino creatives and global clients, featuring automated smart contract escrows, zero platform extraction fees, and immutable on-chain reputation tracking.

## Problem
In the Philippines, the freelance and creative economy is a vital source of income. However, traditional freelance platforms extract heavy toll fees (ranging from 10% to 20% of hard-earned income), require slow, centralized payout procedures, and pose constant payment security risks for both clients and freelancers. Creatives face client payment defaults, while clients risk paying upfront for undelivered or substandard work. There is a critical need for a localized, trustless payment gateway that secures agreements without middleman extraction fees or geographic payment processing delays.

## How It Works
1. **Onboarding:** Users connect their Freighter wallet on the Stellar Testnet and choose their role as either a **Client**, an **Artist**, or a **Mediator**.
2. **Posting a Gig:** A Client posts a freelance project by specifying the project details, budget in USD (automatically converted to XLM using an on-chain Reflector oracle), the selected freelancer's address, and an upfront payment percentage (0% to 50%).
3. **Escrow Funding:** The Client funds and initializes the escrow by submitting a Soroban contract transaction. Up to 50% of the budget is dispatched instantly as an upfront payment to the Artist, while the remaining balance is locked in the `likha-escrow` smart contract.
4. **Deliverable Submission:** The Artist completes the work and submits the proof of delivery (e.g., a link to the project deliverables), logging the work link directly into the contract state.
5. **Release or Dispute:**
   - **Happy Path:** The Client reviews the deliverable and releases the remaining locked balance directly to the Artist's wallet via a smart contract call.
   - **Dispute Path:** If a conflict arises, either party can file a dispute, routing the escrow to a decentralized Mediator. The Mediator uses a slider interface to configure a settlement split (Artist % vs. Client %) and executes the resolution transaction (with a 2.5% platform fee routed to the protocol).
6. **Reputation Tracking:** Once a gig is completed, the contract updates the Artist's on-chain stats (completed project count and total XLM earned), providing an immutable rating score.

## How It Uses Stellar
Stellar is the core engine of LikhaSpace:
- **Soroban Smart Contracts:** The `likha-escrow` Rust contract secures the freelance agreements. It locks the funds in escrow, releases upfront payments, logs deliverables, and handles dispute resolution splits on-chain.
- **XLM Payments:** Used for paying freelancers, funding escrows, and paying low, predictable network transaction fees (less than $0.0001 per transaction).
- **Price Oracles (Reflector):** The `reflector-mock` contract mocks/interacts with Reflector price feeds to convert Client-inputted USD budgets into the exact amount of XLM required for escrow lockups.
- **On-Chain Identity & Freighter Wallet:** Users sign transactions securely using the Freighter wallet, and their public keys double as their unique identifiers on the platform.
- **Horizon & RPC API:** Used to query account balances, transaction histories, and listen to on-chain events and contract states.

## Track
Financial Inclusion / Remittance

## Tech Stack
- **Framework:** Next.js 16 (React 19, TypeScript)
- **Stellar SDK:** `@stellar/stellar-sdk` v15.1.0
- **Wallet Integration:** `@stellar/freighter-api` v6.0.1
- **Network:** Stellar Testnet
- **Database:** Firebase Firestore (v12.14.0) for indexing and caching active listings and user metadata
- **Styling:** Tailwind CSS v4 and Lucide React Icons

## Setup & Run
### Prerequisites
- **Node.js 20+** and **npm**
- **Freighter Browser Extension** configured to the **Test Net**
- **Rust** and **Stellar CLI** (required for building and deploying smart contracts)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/usep-f/LikhaSpace.git
   cd LikhaSpace
   ```

2. Install the web frontend dependencies:
   ```bash
   cd web
   npm install
   ```

3. Set up the environment variables:
   Create a `web/.env.local` file (or update the existing `web/.env` file) with the following environment variables:
   ```env
   NEXT_PUBLIC_STELLAR_NETWORK=testnet
   NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
   NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   NEXT_PUBLIC_CONTRACT_ID=
   
   # Firebase Web Config (Paste yours here)
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=likhaspace-dfd01
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=1:your_firebase_messaging_sender_id:web:642b85a357eb8787b1a2bc
   ```

4. Build and deploy the smart contracts to Testnet (Windows):
   ```powershell
   # From the root directory, run the deploy script:
   .\scripts\deploy.ps1
   ```
   *Note: This compiles the contracts, generates/funds a testnet key, deploys them, runs the initialization, and automatically updates the `NEXT_PUBLIC_CONTRACT_ID` in your `web/.env.local` file.*

5. Run the Next.js development server:
   ```bash
   cd web
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the web application.

## Network Details
- **Network:** Stellar Testnet (`stellar:testnet`)
- **RPC URL:** `https://soroban-testnet.stellar.org`
- **Horizon URL:** `https://horizon-testnet.stellar.org`
- **Network Passphrase:** `Test SDF Network ; September 2015`
- **USDC Issuer Address (Stellar Testnet):** `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`
- **Contract IDs:**
  - `likha-escrow`: [Auto-generated and written to `.env.local` upon deployment]
  - `reflector-mock`: [Auto-generated and written to `.env.local` upon deployment]

## Team
- Venrei Joseph — @usep-f

## License
MIT License
