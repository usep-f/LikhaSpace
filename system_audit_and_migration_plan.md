# LikhaSpace: Comprehensive System Audit & Feature Migration Plan

This document provides an exhaustive technical audit of the entire **LikhaSpace** repository. It details all features that are currently simulated, mocked, or incomplete, outlining the exact technical migrations required to transition the codebase into a fully functioning, production-ready Web3 application on the Stellar Testnet.

---

## 1. Smart Contract & Blockchain Layer (Rust / Soroban)

### 1.1 On-Chain Oracle Integration (`likha-escrow`)
*   **Current Implementation:** Price conversions are calculated off-chain in JavaScript (`contractOracle.ts`) using a hardcoded testnet `dummyAccount`. The Rust smart contract accepts raw XLM stroops without validating against a price feed.
*   **Target Migration:** Integrate the **Reflector Oracle interface** directly inside the `likha-escrow` Rust contract. This allows the contract to query live exchange rates on-chain and dynamically lock USD-denominated values ($50, $100) in XLM stroops during the `fund()` execution.

### 1.2 Escrow Contract Factory Pattern
*   **Current Implementation:** New escrow instances are deployed by uploading and initializing raw WASM bytecode directly from client-side wallet calls or backend relayer transactions.
*   **Target Migration:** Implement a dedicated **Soroban Escrow Factory Contract**. The factory will programmatically deploy, initialize, and keep an index of user escrow instances in a single atomic transaction.

### 1.3 Gasless Fee Sponsorship (`Operation.feeBump()`)
*   **Current Implementation:** Users must hold XLM in their non-custodial browser wallets to pay gas fees for every milestone progress action, revision request, or deliverable approval.
*   **Target Migration:** Wrap user-signed transaction payloads in Stellar **Fee Bump Transactions** (`Operation.feeBump()`) on the backend. This enables gasless transactions for freelancers and clients, eliminating the friction of purchasing XLM prior to platform usage.

### 1.4 Reputation-Gated Multi-Sig Peer-Jury & Mediator Stipend Protocol 🆕
*   **Current Implementation:** Dispute resolution relies on a single platform-managed mediator key (`NEXT_PUBLIC_MEDIATOR_ADDRESS`), creating a centralized trust boundary.
*   **Target Migration:** Upgrade `likha-escrow` and `likha-reputation` to implement a **Decentralized 2-of-3 Peer Jury Engine**:
    *   **Qualification Gate:** Only users with a verified history in `likha-reputation` (e.g., 5+ completed projects or $500+ volume as a freelancer/client) are eligible to serve as jurors (Sybil resistance).
    *   **2-of-3 Multi-Sig Consensus:** Upon dispute escalation, 3 eligible community jurors are assigned to the case. A 2-of-3 majority on-chain vote executes `resolve_dispute()`.
    *   **Mediator Stipend:** A small fee (3-5% of the escrow amount) is automatically allocated from the escrow as a stipend to compensate participating jurors upon case resolution.

---

## 2. Fiat On-Ramp & Payment API Layer

### 2.1 Production-Ready Payment Confirmation Webhook
*   **Current Implementation:** Fiat on-ramping relies on a simulated endpoint (`/api/onramp/simulate`) triggered by a mock button in `QRPhPaymentModal.tsx`.
*   **Target Migration:** Build a real `/api/onramp/webhook` endpoint. This route will receive real-time payment confirmation callbacks (via SEP-24 anchor webhooks or local PH payment gateway APIs like GCash/Maya) and trigger automated smart contract initialization and funding.

### 2.2 Secure Relayed Transaction & Session Signing
*   **Current Implementation:** `onramp.ts` handles client interactions on relayed/custodial escrows by passing raw secret key strings (`secretKey: string`) in client memory.
*   **Target Migration:** Establish **SEP-10 JWT authenticated sessions** paired with server-side Key Management Service (KMS) signing, ensuring private keys never touch raw client-side code.

---

## 3. Frontend Dashboard & State Synchronization Layer (`OverviewView.tsx` Audit)

### 3.1 Hardcoded Profile Fallbacks (`OverviewView.tsx`)
*   **Current Implementation:** If a user hasn't completed an off-chain profile, `OverviewView.tsx` renders static fallback template strings:
    *   `name`: `'Anonymous Client'` / `'Anonymous Freelancer'`
    *   `email`: `'contact@example.com'`
    *   `phone`: `'+1 (555) 123-4567'`
    *   `socials`: `'github.com/client'`, `'linkedin.com/in/client'`, `'@client'`
*   **Target Migration:** Replace static fallbacks with authenticated user profile hooks powered by verified Stellar account address labels and on-chain identity records.

### 3.2 Mocked Milestone Progress Bar ([OverviewView.tsx:L190-L196](file:///c:/Users/venre/Documents/LikhaSpace/web/src/app/dashboard/client/OverviewView.tsx#L190-L196))
*   **Current Implementation:** Active project cards explicitly contain code comment `/* Mock representation of milestones */` using static fallback width:
    ```tsx
    style={{ width: `${proj.progressPercentage || 10}%` }}
    ```
*   **Target Migration:** Replace the static `10%` fallback bar with a dynamic milestone stepper component that queries the `likha-escrow` contract storage on Testnet for the exact array of completed vs. remaining milestone structs (`Vec<Milestone>`).

### 3.3 Database vs. Smart Contract State Disconnect
*   **Current Implementation:** Orders are subscribed to exclusively through Firebase Firestore (`subscribeToClientOrders` / `subscribeToFreelancerOrders`). The dashboard displays order status from a Web2 database without verifying live `EscrowStatus` directly from the Stellar Testnet RPC.
*   **Target Migration:** Build a real-time Soroban RPC reader hook that queries contract instances on Stellar Testnet directly (`get_status()`, `get_locked_balance()`), ensuring the UI displays verified on-chain truth.

### 3.4 Inactivity Timeout Countdowns & Execution Controls
*   **Current Implementation:** The `likha-escrow` Rust contract contains functions for `claim_timeout` (14-day client auto-release) and `claim_refund_timeout` (30-day freelancer auto-refund), but no controls exist in the UI.
*   **Target Migration:** Add live countdown clocks to active project cards that calculate remaining time against ledger timestamps and enable a "Claim Auto-Payout / Refund" button once the threshold passes.

### 3.5 75% Labor Kill Fee Cancellation Workflow
*   **Current Implementation:** The smart contract logic for `client_cancel_with_kill_fee` (compensating freelancers with 75% of the active milestone upon client cancellation) exists in Rust, but lacks a frontend trigger.
*   **Target Migration:** Build a dedicated client project cancellation modal that explains the 75% kill fee protection, executing the transaction to route funds automatically.

### 3.6 Interactive Game-Theoretic Dispute Split Modal
*   **Current Implementation:** Dispute split voting functions (`propose_dispute_split`, `accept_dispute_split`, `reject_dispute_split`) are present in `likha-escrow/src/lib.rs`, but have no UI representation.
*   **Target Migration:** Build a two-sided negotiation modal where clients and freelancers can propose, review, accept, or reject percentage split proposals before escalating to a mediator.

### 3.7 Community Jury & Mediation Portal (`/dashboard/jury`) 🆕
*   **Current Implementation:** No UI interface exists for dispute resolution or mediator interaction.
*   **Target Migration:** Build a dedicated Community Jury Portal (`/dashboard/jury`) where eligible high-reputation users can view pending escalated disputes, inspect submitted deliverable evidence, cast their on-chain votes, and claim their earned mediator stipends.

---

## 4. Reputation Registry & Verified Badging Layer

### 4.1 On-Chain Reputation & Ratings Chart Fallbacks (`OverviewView.tsx` Artist View)
*   **Current Implementation:** The artist overview rating chart relies entirely on off-chain Firebase document reviews (`o.review?.rating || 0`), completely bypassing the on-chain Soroban reputation contract (`likha-reputation`).
*   **Target Migration:** Connect the artist dashboard rating chart directly to `likha-reputation` on Testnet (`get_freelancer_profile()`). Render an un-erasable on-chain rating badge with direct verification links to Stellar Expert.

---

## 5. Frontend UI Discrepancies & Guideline Compliance Audit

### 5.1 Forbidden Emoji Icon Cleanup (`AGENTS.md` Rule 10 Compliance)
*   **Location:** `web/src/components/SaaSXlmExplainer.tsx` (Line 84)
*   **Issue:** Uses raw emoji character `💡` in text instead of an SVG icon from Lucide React.
*   **Fix:** Replace with `<Lightbulb className="w-4 h-4 text-neoncyan inline-block mr-1" />`.

### 5.2 Dynamic Payment Status Polling (`QRPhPaymentModal.tsx`)
*   **Location:** `web/src/components/QRPhPaymentModal.tsx` (Line 131)
*   **Issue:** Displays static mock text: *"Scan this QR Ph... to simulate on-chain contract funding"* and a `"Simulate Scan"` button.
*   **Fix:** Replace with dynamic payment polling status spinners and real QR code rendering linked to `/api/onramp/webhook`.

### 5.3 Server-Side Role Routing & Authorization Guards
*   **Location:** `web/src/components/layout/Navbar.tsx` & `web/src/app/dashboard/`
*   **Issue:** Role navigation (Client vs. Freelancer vs. Mediator) is stored in client-side state/localStorage (`useWallet`), lacking server-side route protection.
*   **Fix:** Enforce Next.js middleware and SEP-10 session token authorization guards for `/dashboard/mediator` and `/dashboard/jury`.

### 5.4 Dedicated 75% Labor Kill Fee Modal (`CancelModal.tsx`)
*   **Location:** `web/src/components/CancelModal.tsx`
*   **Issue:** Standard cancellation modal lacks explicit UI options to execute the contract's `client_cancel_with_kill_fee` function.
*   **Fix:** Add an explicit cancellation workflow detailing the 75% active-milestone kill fee payout to the freelancer.

### 5.5 Two-Sided Dispute Split Negotiation Controls (`DisputeModal.tsx`)
*   **Location:** `web/src/components/DisputeModal.tsx`
*   **Issue:** Parties can propose a split (`proposeDisputeSplit`), but the recipient side lacks interactive buttons inside the modal to click "Accept Split" (`accept_dispute_split`) or "Reject Split" (`reject_dispute_split`).
*   **Fix:** Build two-sided proposal review states directly inside the dispute modal interface.

### 5.6 Inactivity Timeout Countdown Clocks (`ActiveProjectsView.tsx` & `OrdersView.tsx`)
*   **Location:** `web/src/app/dashboard/client/ActiveProjectsView.tsx` & `web/src/app/dashboard/artist/OrdersView.tsx`
*   **Issue:** Lacks visual countdown clocks for the 14-day client auto-release and 30-day freelancer refund timers.
*   **Fix:** Add active countdown timers and an interactive "Claim Timeout Payout" button that unlocks when the ledger timestamp threshold is met.

---

## 6. Scope of Work (SOW) Deliverable Mapping

This audit maps directly into Section 6 (Scope of Work) of your Instawards SOP application:

| Deliverable | Included System Audit Items | Total Sprint Impact |
| :--- | :--- | :--- |
| **Deliverable 1 (D1)** | Items **2.1**, **2.2**, **5.2**, **5.3** | Real-world fiat on-ramp webhooks, payment polling, SEP-10 sessions, & role route protection. |
| **Deliverable 2 (D2)** | Items **1.1**, **1.2**, **1.3**, **1.4** | On-chain Reflector oracle, escrow contract factory, fee bumping, & **Reputation-Gated Multi-Sig Jury Protocol**. |
| **Deliverable 3 (D3)** | Items **3.1**–**3.7**, **4.1**, **5.1**, **5.4**–**5.6** | Live Soroban ledger UI reader, milestone stepper, timeouts, kill fee modal, dispute split negotiation, **Community Jury Portal**, profile & ratings fallbacks fix, & on-chain reputation sync. |
| **Deliverable 4 (D4)** | Validation Package | Technical demo video, copyable integration guide, & Testnet Tx hashes. |
