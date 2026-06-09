## Project Name
LikhaSpace

## One-Line Description
Decentralized freelance marketplace and automated escrow system for Filipino creatives and global clients, featuring zero platform fees, secure upfront payouts, and on-chain reputation tracking.

## Track
Track 2 Financial Inclusion & Everyday Payments

## Problem It Solves
Filipino creatives and freelancers are heavily impacted by traditional freelance platforms extracting 10% to 20% in middleman fees and imposing slow, centralized payout procedures. Freelancers also face constant payment default risks, while clients face delivery default risks when hiring unvetted artists. LikhaSpace provides a localized, trustless escrow agreement using Soroban smart contracts, allowing secure upfront payments and protecting the remaining balance until deliverables are verified.

## How It Uses Stellar
- **Soroban Escrow Smart Contract (`likha-escrow`):** Locks client funds in escrow, auto-releases upfront payments (0% to 50%) to the artist, stores proof-of-work link hashes on-chain, and releases remaining funds upon client approval. It also facilitates mediator-led dispute resolution splits.
- **XLM Payments:** Used as the medium of exchange for project budgets, fee settlement, and contract gas fees (averaging less than $0.0001 per transaction).
- **Price Oracles (`reflector-mock`):** Integrates/mocks a Reflector price feed oracle to calculate real-time XLM equivalent budgets from USD client inputs.
- **Freighter Wallet:** Integrates as the secure on-chain authentication and transaction signing provider for clients, artists, and mediators.
- **Horizon & RPC API:** Used to query account balances and monitor smart contract states and transaction status.

## GitHub Repository
https://github.com/usep-f/LikhaSpace

## Network & Deployment
- Network: testnet
- Live app URL (if any): runs locally — see README
- Contract IDs / asset issuers (if any):
  - `likha-escrow`: [Auto-written to web/.env.local upon deployment]
  - `reflector-mock`: [Auto-written to web/.env.local upon deployment]

## Team
- Venrei Joseph — @usep-f

## Novelty Note (optional, for bonus points)
We verified the project idea against typical freelance systems. Traditional platforms are highly extractive and centralized. LikhaSpace stands out by providing customizable, automated upfront payouts (up to 50%) directly built into the smart contract logic. Additionally, it integrates a mock Reflector oracle feed for instant USD-to-XLM conversions and creates an on-chain, immutable reputation ledger for artists based on verified project completions.

## Anything Else
- **Known limitations:** Currently in Testnet sandbox with mockups/skeleton templates for the smart contracts. 
- **What we'd build next:** Implement full Firestore database synchronization with contract event streams, integrate SEP-24/31 anchors for local fiat on/off-ramps (e.g., PHP stablecoin, GCash, or Maya via USDC), and expand the dispute system to support multi-signature mediator pools.
