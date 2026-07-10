# Project Name
LikhaSpace

## One-Line Description
A Web3 Fiverr-style marketplace for Pinoy creatives featuring low flat platform fees (0% introductory), flexible milestone escrows, and on-chain reviews to stop freelancers from getting scammed.

## Track
Track 2 Financial Inclusion & Everyday Payments

## Problem It Solves
Here in the Philippines, many college students and young creatives do freelance work like logo design or video editing to earn extra cash. But traditional platforms like Fiverr or Upwork are a huge hassle because they take a big 20% cut from our hard-earned money, and withdrawing our funds takes forever. Also, there are many cases where clients run away without paying after the artist submits the work, or clients get scammed by unvetted freelancers who do not deliver. LikhaSpace solves this by offering a secure, milestone-based escrow system using Soroban smart contracts so that clients can lock the funds safely, and freelancers are 100% sure they will get paid once they deliver.

## How It Uses Stellar
- **Dynamic Escrow Contract (`likha-escrow`):** Every time a client books a gig, our system dynamically deploys a new escrow contract instance on the Stellar testnet. It locks the client's budget in XLM and releases it milestone-by-milestone when the client approves the work.
- **On-chain Reputation Registry (`likha-reputation`):** Instead of just saving reviews in a normal database, we built a Soroban contract that stores the freelancer's rating, testimonial text, completed project count, and total earnings on-chain. This makes their portfolio and reputation immutable and impossible to fake.
- **Blend Testnet Mock Oracle:** Since freelancer prices are set in USD (like $50) but paid in XLM, our escrow contract queries the Blend Mock Oracle (which uses Reflector's interface) during funding to get the real-time XLM/USD exchange rate so the client deposits the exact right amount of XLM.
- **Stellar Wallets Kit:** We integrated this so users can easily sign transactions using Freighter Wallet or other wallets.
- **XLM Payments & Gas:** XLM is used to fund the escrows and pay for the gas fees when interacting with the smart contracts. Freelancers pay 0% fees on their first 20 completed transactions, followed by a flat platform fee of just 1% (much lower than legacy platforms). The only other cost is the tiny Stellar network gas fee.

## GitHub Repository
https://github.com/usep-f/LikhaSpace

## Network & Deployment
- Network: Stellar Testnet
- Live app URL (if any): runs locally — see README
- Contract IDs / asset issuers (if any):
  - Escrow WASM ID: `NEXT_PUBLIC_ESCROW_WASM_ID` (installed on-chain, dynamically deployed per order)
  - Reputation Contract: `NEXT_PUBLIC_REPUTATION_CONTRACT_ID`
  - Mock Oracle: `CAZOKR2Y5E2OSWSIBRVZMJ47RUTQPIGVWSAQ2UISGAVC46XKPGDG5PKI` (Blend Testnet Mock Oracle)

## Team
- Joseph Umali — @usep-f

## Novelty Note (optional, for bonus points)
We checked our idea against `stellar-300-ideas.md` and `stellar_repos.txt`. While there are basic escrow templates out there, LikhaSpace is different because it is designed specifically as a service listing marketplace (Fiverr-style instead of bidding) with a fully customizable **Milestone Payment Schedule** created by the freelancer. Plus, we did not just store the reviews in Firebase; we actually wrote a second smart contract (`likha-reputation`) to keep ratings and earnings permanently on-chain.

## Anything Else
- **Known Limitations:** Currently, the system runs on Stellar Testnet and uses the Blend Mock Oracle for prices.
- **Future Plans:** We want to add support for PHP stablecoins (like PHPT) via Stellar Anchors so local clients and freelancers won't have to worry about XLM price fluctuations and can cash out directly to GCash or Maya. We also plan to support gas fee sponsorship (fee bump transactions) so new freelancers can start without buying XLM first.
- **Shout-out:** Big thanks to our PUP QC workshop mentors for helping us understand how to write and test Soroban contracts!
