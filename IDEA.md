## Project Name
LikhaSpace

## One-Line Description
A "Fiverr-style" decentralized service marketplace for Filipino creatives, featuring zero platform fees, secure upfront payouts, on-chain escrow, and Reflector oracle price conversions.

## Track
Track 2 Financial Inclusion & Everyday Payments

## Problem It Solves
Filipino creatives and freelancers are heavily impacted by traditional freelance platforms extracting 10% to 20% in middleman fees and imposing slow, centralized payout procedures. Clients also face delivery default risks when hiring unvetted artists. LikhaSpace flips the traditional bidding model into a Service Marketplace where Freelancers post their offerings. It provides a localized, trustless escrow agreement using Soroban smart contracts, allowing secure upfront payments and protecting the remaining balance until deliverables are verified.

## How It Uses Stellar
- **Soroban Escrow Smart Contract (`likha-escrow`):** Locks client funds in escrow, auto-releases upfront payments (0% to 50%) to the artist, and releases remaining funds upon client approval. It also facilitates mediator-led dispute resolution splits.
- **XLM Payments:** Used as the medium of exchange for project budgets and contract gas fees.
- **Reflector Price Oracles:** Integrates a Reflector testnet price feed oracle to calculate real-time XLM equivalent budgets from the USD prices set on Freelancer listings.
- **Freighter Wallet:** Integrates as the secure on-chain authentication and transaction signing provider.

## Platform Flow
1. **Listings (Firebase):** Freelancers post their services (e.g. Logo Design, $50).
2. **Booking:** Client requests to book. Freelancer Accepts or Denies. If accepted, the listing becomes "Occupied" and is hidden from the marketplace.
3. **Escrow (Stellar):** Client funds the contract. Oracle calculates XLM amount. Upfront % is released.
4. **Delivery:** Freelancer delivers work via the platform dashboard.
5. **Settlement:** Client approves the work, releasing the remaining funds from escrow to the Freelancer. Both parties leave Star Ratings and Testimonials (stored in Firebase).

## Team
- Venrei Joseph — @usep-f

## Novelty Note (optional, for bonus points)
We verified the project idea against typical freelance systems. LikhaSpace stands out by providing customizable, automated upfront payouts (up to 50%) directly built into the smart contract logic, eliminating the risk of freelancers working for free. It utilizes Firebase for a snappy off-chain Service Marketplace experience, while relying on the immutability of Stellar Soroban for financial settlement and reputation tracking.
