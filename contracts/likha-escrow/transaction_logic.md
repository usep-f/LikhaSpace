# LikhaSpace Escrow: Transaction Logic & Frontend Integration Guide

This document explains the step-by-step transaction logic for the `likha-escrow` Soroban smart contract, designed to guide frontend developers (or AI assistants) when integrating the smart contract with the Next.js React frontend.

## Overview of the Flow

The system uses a sequential milestone model. All funds for the project (upfront + all milestones) are locked up by the client in a **single funding transaction**. 

### 1. Initialization (Deployment)

**When:** After the Freelancer accepts a booking request off-chain (in Firebase).
**Who:** The Client deploys the contract via the frontend.

The frontend must call the `initialize` method on the newly deployed contract:
```rust
initialize(
    env: Env,
    freelancer: Address,
    client: Address,
    token: Address,           // Use the Native XLM SAC address for Testnet
    oracle: Address,          // The Reflector Mock contract ID
    mediator: Address,        // Fetch the user with 'mediator' role from Firestore
    upfront_amount_usd: i128, // Amount in USD cents (e.g., $50 = 5000)
    paid_revision_price_usd: i128,
    milestones: Vec<Milestone>,
    client_timeout: u64,      // 1209600 (14 days in seconds)
    freelancer_timeout: u64,  // 2592000 (30 days in seconds)
)
```
*Frontend Note:* Since deployment and initialization cost gas, bundle them if possible or guide the client through the process. Ensure the USD amounts are represented as `i128` cents to avoid floating-point issues.

### 2. Funding the Escrow

**When:** Immediately after initialization (or in the same transaction sequence).
**Who:** The Client.

```rust
fund(env: Env, client: Address, max_xlm_to_spend: i128)
```
**Logic:**
1. The contract queries the Reflector Oracle (`get_price()`) to determine the exact exchange rate (how many XLM stroops = 1 USD cent).
2. It calculates the total required XLM (upfront + all milestones).
3. If the required XLM is greater than `max_xlm_to_spend`, the transaction reverts (Slippage protection).
4. The contract pulls the total XLM from the client's wallet.
5. The `upfront_amount` is immediately transferred to the Freelancer.
6. The remainder is locked in the contract, and the first milestone's state becomes `Active`.

*Frontend Note:* Use Freighter to request the client's signature. Make sure the client has sufficient XLM balance, plus gas.

### 3. Deliverable Submissions & Approvals

#### Submit Deliverable
**When:** Freelancer finishes the work for the current milestone.
**Who:** The Freelancer.
```rust
submit_deliverable(env: Env, freelancer: Address)
```
*Frontend Note:* Off-chain files (images, zips) are uploaded to Firebase or IPFS. The on-chain transaction just sets the state to `Submitted` and resets the 14-day client timeout timer.

#### Accept Deliverable
**When:** Client is satisfied with the deliverable.
**Who:** The Client.
```rust
accept_deliverable(env: Env, client: Address)
```
*Frontend Note:* This releases the locked XLM for the current milestone to the Freelancer. It automatically sets the next milestone to `Active`. If it's the last milestone, the contract status becomes `Completed`.

#### Deny Deliverable (Request Revision)
**When:** Client wants changes.
**Who:** The Client.
```rust
deny_deliverable(env: Env, client: Address)
```
*Frontend Note:* This increments `revisions_used`. If `revisions_used == max_revisions`, the frontend should disable the standard "Deny" button and show a "Pay for Extra Revision" or "Dispute" button instead.

### 4. Paid Revisions

**When:** Client wants an extra revision but has exhausted the free ones.
**Who:** The Client.
```rust
pay_for_revision(env: Env, client: Address, max_xlm_to_spend: i128)
```
*Frontend Note:* The required XLM is pulled from the client's wallet and sent **directly to the freelancer** immediately. It increments `max_revisions` by 1.

### 5. Cancellations & Edge Cases

#### Freelancer Backs Out
**Who:** Freelancer
```rust
refund_remaining(env: Env, freelancer: Address)
```
*Logic:* Refunds all remaining locked XLM back to the Client. The contract becomes `Cancelled`.

#### Client Timeout (Freelancer claims funds)
**Who:** Freelancer
```rust
claim_timeout(env: Env, freelancer: Address)
```
*Logic:* Can be called if the client hasn't responded to a submitted deliverable in 14 days. Acts exactly like `accept_deliverable`.

#### Freelancer MIA Timeout (Client claims refund)
**Who:** Client
```rust
claim_refund_timeout(env: Env, client: Address)
```
*Logic:* Can be called if the freelancer hasn't submitted a deliverable for 30 days after funding or a revision request. Acts exactly like `refund_remaining`.

### 6. Dispute Resolution

**When:** Revisions are exhausted, and the parties cannot agree.
**Who:** Client or Freelancer calls `request_mediation(env, caller)`.
**Who resolves:** The Mediator calls `resolve_dispute(...)`.

```rust
resolve_dispute(
    env: Env, 
    mediator: Address, 
    freelancer_payout: i128, 
    client_refund: i128
)
```
*Frontend Note:* The mediator must distribute **exactly** the remaining locked balance. `freelancer_payout + client_refund` must equal `get_locked_balance()`.

---
## Next Steps for the Frontend

1. **Stellar SDK & Freighter Integration:** Use `@stellar/freighter-api` v6. Ensure you use the `rpc` namespace (v15 SDK) to simulate and assemble Soroban transactions.
2. **Contract Bindings:** Once deployed to the Testnet, generate TypeScript bindings using the Stellar CLI:
   `stellar contract bindings typescript --id <CONTRACT_ID> --network testnet --output-dir ./packages/likha-escrow`
3. **Firebase State Sync:** When transactions succeed (e.g., funding, accepting), update the Firestore document for that gig so the UI reflects the real-time state without polling the RPC constantly.
