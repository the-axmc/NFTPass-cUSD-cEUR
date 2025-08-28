# AXMC Entrepreneur Membership DApp

Claim your **AXMC Entrepreneur Membership Pass** on-chain using **Mento** stable assets (**cUSD** / **cEUR**) on **Celo**. The pass mints as an NFT and unlocks the entrepreneur role, which grants access to AXMC’s governance, perks, and phygital experiences.

> **Contract (Entrepreneur Membership):** `0x35050de3D73e58019890150f59124A57998892A3`  
> **Network:** Celo Mainnet (EVM-compatible)  
> **Stable assets (Mento):**
>
> - **cUSD:** `0x765DE816845861e75A25fCA122bb6898B8B1282a`
> - **cEUR:** `0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73`

---

## 1) What this DApp does

- **Simple onboarding to AXMC:** Users join as **Entrepreneurs** by paying a stable, predictable fee: **55 cUSD** or **50 cEUR** (Mento assets on Celo).
- **Verifiable membership:** Minting produces a **non-fungible token** (NFT) representing your membership pass.
- **Compliance-friendly UX:** Users must **accept Terms & Privacy** before minting; payments rely on transparent, on-chain approvals.
- **Trusted rails:** Built on **Celo** with **Mento** stable assets so pricing doesn’t swing with crypto volatility.
- **Part of AXMC:** This pass integrates with AXMC’s modular marketplace, governance flows, and reputation systems.

---

## 2) Features

- 🔗 **Connect wallet** (Injected EVM wallet / MetaMask w/ Celo)
- 💳 **Select currency**: cUSD (55) or cEUR (50)
- ✅ **Accept legal terms** (required)
- 🔒 **Approve allowance** (ERC-20 `approve`)
- 🧾 **Accept terms on-chain** (`contract.acceptTerms()`)
- 🪙 **Mint pass** (`contract.mint(...)`)
- 🔎 **Event parsing** for `MembershipMinted(address,uint256,uint256)`
- 🖼️ **NFT dashboard**: fetch `tokenURI`, render name/description/image
- 📦 **IPFS (Pinata)** for NFT media

---

## 3) Stack

- **Frontend:** React + Vite
- **Web3:** `ethers` v6 (BrowserProvider, Contracts)
- **Chain:** Celo Mainnet
- **Stablecoins:** Mento **cUSD**, **cEUR**
- **Storage:** IPFS via Pinata

---

## 4) Quickstart

### Prereqs

- Node.js ≥ 18
- Yarn or npm
- Browser wallet (MetaMask) configured for **Celo Mainnet**

**Add Celo Mainnet to MetaMask** (if needed):

- RPC URL: `https://forno.celo.org`
- Chain ID: `42220`
- Currency symbol: `CELO`
- Block explorer: `https://celoscan.io/`

### Install & Run

```bash
# clone your repo
git clone <your-repo-url>
cd <your-repo>

# install deps
npm install
# or
yarn

# start dev server
npm run dev
# or
yarn dev

---

```
