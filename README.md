# 🌌 LikhaSpace

> **Empowering Pinoy Creatives through Trustless Web3 Collaboration**

A Web3 Fiverr-style marketplace for Pinoy creatives featuring zero platform fees, flexible milestone escrows, and on-chain reviews to stop freelancers from getting scammed.

---

## 📌 Problem

Here in the Philippines, many college students, self-taught designers, and young creatives do freelance work (like logo design, video editing, and copywriting) to help pay for school or buy their own gear. 

However, traditional platforms like Fiverr or Upwork pose major barriers:
* **High Fees:** They extract a painful 20% commission cut from hard-earned money.
* **Slow Withdrawals:** Payouts take weeks to clear.
* **Payment Risks:** Clients can run away without paying after receiving deliverables, or freelancers can disappear after receiving deposits.

---

## 🎨 How It Works

1. 📝 **Service Listings:** Freelancers post their service listing (e.g. Logo Design, $50) and can specify their own custom milestone payout schedule (e.g. Milestone 1: Sketch - $20, Milestone 2: Final Vector - $30).
2. 🤝 **Booking & Accepting:** A client finds the service they need, connects their Freighter wallet, and sends a booking request. The freelancer can either accept or deny the request.
3. 🔒 **Escrow Funding:** Once accepted, the client deposits the funds. The frontend queries our price oracle to convert the USD price to XLM, and deposits the exact XLM into a dynamically deployed milestone escrow contract. The first milestone is now active.
4. 📤 **Milestone Submissions:** Freelancers upload their active milestone deliverables (saved in Firebase) and submit on-chain.
5. 🔓 **Releasing & Revisions:** The client reviews the deliverable. If they like it, they approve on-chain, releasing that milestone's XLM directly to the freelancer's wallet. If revisions are needed, they request it. Freelancers get a set amount of free revisions, and clients can purchase extra revisions if needed.
6. 🌟 **On-chain Reputation & Reviews:** When the project finishes, the client submits a review. This rating, review text, and timestamp are committed directly to the `likha-reputation` smart contract on-chain, updating the freelancer's profile stats (completed projects, total XLM earned, and reviews registry).

---

## ⚙️ System Features & Core Logic

LikhaSpace organizes its business rules and workflows across 8 key features. For the full technical breakdown, see the [workflow.md](file:///c:/Users/venre/Documents/stellarp2/workflow.md) guide.

1. 🔐 **Login & Wallet Verification:** Password-free login via SEP-10 Web Auth (challenge-signature-verify loop returning a Firebase Custom Token) paired with live Horizon API checks ensuring wallets have $\ge 1\text{ XLM}$ balance and active history.
2. 📁 **Creating a Gig:** Freelancers publish services with details and custom, phased milestone payout schedules (USD budget & revision caps) stored in Firestore.
3. 📨 **Booking a Gig:** Clients book services to create a `pending_acceptance` order, which freelancers can approve/deny to transition it to `awaiting_funding`.
4. ⛓️ **Escrow & Milestones:** Deploying a dynamic on-chain `likha-escrow` contract per project. USD totals are converted to XLM stroops via a Reflector Mock Oracle, funds are locked, and sequential deliverables are uploaded off-chain and submitted/approved on-chain.
5. ⏳ **Cancellation & Timeouts:** Enforces freelancer-backed refunds, client cancellations with a 75% active-milestone kill fee, 14-day client unresponsiveness release timeouts, and 30-day freelancer MIA refund timeouts.
6. ⚖️ **Mediation & Game-Theoretic Disputes:** Supports mutual split proposals requiring bilateral consent. Rejections penalize both by burning locked funds to the platform treasury. If stalemate persists, the dispute is escalated to the Mediator Dashboard for manual resolution.
7. 👤 **User Profiles:** Fast Firestore metadata coupled with immutable, on-chain verified completion counts and earnings.
8. ✍️ **On-Chain Reviews:** Immutable rating and review entries committed directly to the `likha-reputation` ledger to verify freelancer trustworthiness.

---

## ⚡ How It Uses Stellar

We chose to build on Stellar because transaction speeds are super fast and network fees are extremely cheap, which is perfect for micro-payments:
* **Dynamic Soroban Escrow (`likha-escrow`):** Instead of a single monolithic contract, we dynamically deploy a separate escrow contract instance on-chain for each project booking using its WASM ID. It manages locked funds, paid revision pricing, and milestones.
* **On-chain Reputation Ledger (`likha-reputation`):** An immutable review and ranking registry where completed project counts, lifetime earnings, and star ratings/testimonials are kept secure and public on-chain to prove freelancer reliability.
* **Blend Testnet Mock Oracle (Reflector Interface):** Used to convert USD listings to real-time XLM stroops during the funding step.
* **Stellar Wallets Kit:** Connects Freighter wallet or other wallets for secure, password-free transaction signing.
* **USDC & XLM Payments:** XLM is used for both project budgets and smart contract gas fees. Since platform fees are 0%, the only cost is the tiny Stellar gas fee.

---

## 🛣️ Track

**Track 2:** Financial Inclusion & Everyday Payments

---

## 🛠️ Tech Stack

* **Framework:** Next.js 16 (React 19, TypeScript)
* **Stellar Integration:** `@stellar/stellar-sdk` v15.1.0, `@stellar/freighter-api` v6.0.1, `@creit.tech/stellar-wallets-kit` v2.3.0
* **Database & Storage:** Firebase Firestore (v12.14.0) & Firebase Storage
* **Styling:** Tailwind CSS v4 & Lucide React Icons

---

## 🚀 Setup & Run

Here are the step-by-step instructions so you can easily run this project on your own machine.

### 1. Clone the repository
```bash
git clone https://github.com/usep-f/LikhaSpace.git
cd LikhaSpace
```

### 2. Install dependencies
Go to the `web` folder and install:
```bash
cd web
npm install
```

### 3. Setup your Environment Variables
Create a file named `.env.local` inside the `web/` directory and configure the variables. Here is the template with the default values for our Testnet deploy:

```env
# Network
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Default Addresses
NEXT_PUBLIC_MEDIATOR_ADDRESS=GDUUKJ4LZUPP3ZIREJX27FG2KQCSIHBB4QLVOCXSK632Q2Z2P2HNWRTQ
NEXT_PUBLIC_ORACLE_ID=CAZOKR2Y5E2OSWSIBRVZMJ47RUTQPIGVWSAQ2UISGAVC46XKPGDG5PKI
NEXT_PUBLIC_ESCROW_WASM_ID=f6290fa6fefa395fced97dada694eda742bb336038ea829273a1047479815eab
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=CCO3XB52IVULNJKT535HA6BPZDCVWDLRNH2FAY2YTNX4GGEIJKT3HSLO

# Firebase Config (for off-chain listings, chat, and cache)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Firebase Admin SDK (Server-side)
FIREBASE_ADMIN_PROJECT_ID=your_firebase_admin_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_firebase_admin_client_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_firebase_admin_private_key\n-----END PRIVATE KEY-----\n"

# SEP-10 challenge signing key (server seed)
# Replace with a generated Stellar private key (starts with 'S')
SEP10_SERVER_SECRET=your_stellar_server_secret
```

#### 🔑 How to get these credentials for localhost:
* **Stellar SEP-10 & Mediator Address**:
  1. Go to the [Stellar Laboratory Account Creator](https://laboratory.stellar.org/#account-creator?network=testnet).
  2. Click **Generate Keypair**.
  3. Set `SEP10_SERVER_SECRET` to the generated **Secret Key** (starts with `S`).
  4. Set `NEXT_PUBLIC_MEDIATOR_ADDRESS` to the generated **Public Key** (starts with `G`).
* **Firebase Config & Admin SDK**:
  1. Create a free project in the [Firebase Console](https://console.firebase.google.com/).
  2. Register a new **Web App** in the project settings. Copy the web config fields and paste them under the `# Firebase Config` section.
  3. Go to **Project Settings** > **Service Accounts**, select **Node.js**, and click **Generate new private key**.
  4. Open the downloaded JSON file and populate `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, and `FIREBASE_ADMIN_PRIVATE_KEY` with the corresponding values from the JSON.

### 4. How to Deploy the Soroban Contracts (Optional)
If you want to compile and deploy your own contracts to the Stellar Testnet instead of using our pre-deployed ones:
1. Make sure you have the [Stellar CLI](https://developers.stellar.org/docs/build/smart-contracts/getting-started/setup#install-stellar-cli) and Rust installed.
2. Run the deployment script from the project root:
   ```powershell
   # On Windows (PowerShell)
   .\scripts\deploy_escrow.ps1
   ```
   This will build the contracts, install the escrow WASM, deploy & initialize the reputation contract, and automatically write the new IDs to `web/.env.local`.

### 5. Run the web app locally
In the `web/` directory, run the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. Make sure your Freighter extension is set to **Test Net** and you have funded your test account using Friendbot!

---

## 🌐 Network Details

* **Network:** Stellar Testnet
* **RPC URL:** `https://soroban-testnet.stellar.org`
* **Horizon URL:** `https://horizon-testnet.stellar.org`
* **Passphrase:** `Test SDF Network ; September 2015`
* **Pre-deployed Contract IDs:**
  * **Reputation Contract:** `CCO3XB52IVULNJKT535HA6BPZDCVWDLRNH2FAY2YTNX4GGEIJKT3HSLO`
  * **Escrow WASM ID:** `f6290fa6fefa395fced97dada694eda742bb336038ea829273a1047479815eab`
  * **Mock Oracle ID:** `CAZOKR2Y5E2OSWSIBRVZMJ47RUTQPIGVWSAQ2UISGAVC46XKPGDG5PKI`

---

## 👥 Team

* Joseph Umali — [@usep-f](https://github.com/usep-f)

---

## 📄 License

MIT License
