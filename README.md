# LikhaSpace

LikhaSpace is a decentralized, trustless freelance marketplace for Filipino creatives and global clients. It operates on a "Service Listing" (Fiverr-style) model, featuring automated smart contract escrows, zero platform extraction fees, and immutable on-chain reputation tracking.

## Problem
In the Philippines, the freelance and creative economy is a vital source of income. However, traditional freelance platforms extract heavy toll fees (ranging from 10% to 20% of hard-earned income), require slow, centralized payout procedures, and pose constant payment security risks for both clients and freelancers. Creatives face client payment defaults, while clients risk paying upfront for undelivered or substandard work.

## The Solution: A Service Marketplace
LikhaSpace flips the traditional bidding model. Instead of clients posting jobs and freelancers competing in a race to the bottom, **Freelancers post their services** (e.g., "I will design a 3D asset for $100"). Clients browse these services, review the freelancer's on-chain reliability, and book them directly.

## How It Works
1. **Service Listings:** Freelancers create listings defining their service, price (in USD), and required upfront payment percentage (0-50%). These are indexed in Firebase.
2. **Booking & Approval:** A Client finds a listing they like and sends a booking request. The Freelancer receives this request and can choose to **Accept** or **Deny** (with an optional denial message). Once accepted, that specific listing becomes temporarily *invisible/occupied* so the Freelancer can focus solely on that client.
3. **Escrow Funding:** Upon acceptance, the Client funds the escrow by submitting a Soroban contract transaction. The USD price is automatically converted to live XLM value using a Reflector testnet oracle. The upfront payment is instantly dispatched to the Freelancer, and the remaining balance is locked in the `likha-escrow` smart contract.
4. **Deliverables & Chat:** Clients and Freelancers can communicate via an off-chain chat (stored in Firebase). The Freelancer submits the final work deliverables through the dashboard.
5. **Release or Dispute:**
   - **Happy Path:** The Client reviews the deliverable and releases the remaining locked balance directly to the Freelancer via a smart contract call.
   - **Dispute Path:** If a conflict arises, either party can file a dispute, routing the escrow to a decentralized Mediator for a settlement split.
6. **Reputation Tracking:** Once a gig is completed, the Freelancer receives a Star Rating and Testimonial. This off-chain data is paired with their immutable on-chain stats (completed project count and total XLM earned) to prove absolute reliability.

## System Architecture

### Role of Firebase
While LikhaSpace uses Stellar for payments and escrow, **Firebase Firestore** acts as the high-speed backend for off-chain platform data:
- **Indexing Listings:** Stores the catalog of Freelancer services (Title, Description, Tags, Price) so the frontend can quickly filter and search.
- **User Metadata:** Stores off-chain profile information, Star Ratings, and Testimonials.
- **Messaging/Chat:** Stores the chat history and booking denial messages between Clients and Freelancers.
- **State Management:** Tracks the "Occupied/Invisible" status of listings so they are hidden from the marketplace while a gig is active.

### Role of the Smart Contracts
- **`likha-escrow`:** The core Soroban Rust contract. Locks the funds, handles the automatic upfront splits, and executes final release or Mediator dispute resolutions.
- **`reflector-mock` (Oracle):** Integrates with Reflector price feeds on the testnet. When a Client is ready to fund a $100 USD gig, the contract queries the Oracle to calculate the exact real-time equivalent in XLM to ensure accurate escrow lockups.

## Tech Stack
- **Framework:** Next.js 16 (React 19, TypeScript)
- **Stellar SDK:** `@stellar/stellar-sdk` v15.1.0, `@stellar/freighter-api` v6.0.1
- **Network:** Stellar Testnet
- **Database:** Firebase Firestore (v12.14.0)
- **Styling:** Tailwind CSS v4 and Lucide React Icons

## Setup & Run
### Prerequisites
- Node.js 20+ and npm
- Freighter Browser Extension (Test Net)
- Rust and Stellar CLI

### Installation
1. `git clone https://github.com/usep-f/LikhaSpace.git`
2. `cd LikhaSpace/web && npm install`
3. Set up `web/.env.local` (See repo for required variables)
4. Deploy contracts: `.\scripts\deploy.ps1`
5. Run frontend: `npm run dev`

## License
MIT License
