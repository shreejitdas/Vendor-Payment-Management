<img width="2843" height="1550" alt="Screenshot 2026-06-21 213142" src="https://github.com/user-attachments/assets/06d69ba4-d8b1-4c6d-a4b5-87ae994380fd" />

<img width="2812" height="1540" alt="Screenshot 2026-06-21 213218" src="https://github.com/user-attachments/assets/28f2628e-ffef-4c40-9cc7-87143a12f140" />
<img width="2849" height="1524" alt="image" src="https://github.com/user-attachments/assets/f0d34cfa-02f0-4c3f-8870-d7e1965a3841" />

vercel deploy link:https://vendor-payment-management-red.vercel.app/
# StellarPay: Vendor Payment Management DApp

StellarPay is a decentralized application (DApp) built on the Stellar Network using Soroban Smart Contracts. It enables administrators to register vendors, vendors to draft invoices, and payers to settle payment requests using native wrapped XLM. The frontend tracking keeps logs of transactions and fetches contract events in real-time.

---

## Features
- **Wallet Integration**: Integrates `StellarWalletsKit` supporting Freighter and Albedo wallets with connections, error diagnostic handling, and balance tracking.
- **Soroban Smart Contract**: Implements custom vendor registration, invoice drafting, admin approvals, and secure payment processing.
- **Frontend Integration**: Full Next.js 15 App router frontend with query caching (TanStack Query) and global store (Zustand).
- **Transaction Tracker**: Real-time status tracker monitoring Pending -> Success/Failed status of active blockchain submissions.
- **Activity Events Feed**: Live contract event poller transforming base64 XDR events into readable transaction records.
- **Premium Dark Aesthetics**: Developer-focused UI using custom Tailwind CSS palettes, skeleton loaders, and clean error states.

---

## Tech Stack
- **Framework**: Next.js 16 (App Router) & React 19
- **Languages**: TypeScript & Rust (Soroban SDK)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Query Caching**: TanStack Query (React Query)
- **Wallet Connection**: `@creit.tech/stellar-wallets-kit`
- **Blockchain Core**: `@stellar/stellar-sdk`

---

## Project Structure
```text
/app               # Next.js 16 pages and routing
/components        # React components (Navbar, ToastProvider)
/contracts         # Soroban smart contract source code (Rust)
/hooks             # React hooks (useStellar, useEvents, useTransactions, useToast)
/lib               # Blockchain configuration and RPC helpers
/public            # Static assets
```

---

## Environment Variables
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_CONTRACT_ID=CCZ7V5MMCOAYACWPWW6QPCWSVMHQHUQWAQ4YMGC3MJEVIKLVOKPIOVYM
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
```

---

## Setup Instructions

### 1. Prerequisite Toolchains
Ensure you have the following installed:
- Node.js v24+ & npm
- Rust & Cargo (GNU Toolchain)
- Stellar CLI v27+

### 2. Install Node Dependencies
Install all package dependencies:
```bash
npm install
```

### 3. Deploy Contract to Testnet
If you wish to redeploy the contract:
```bash
# Set GNU toolchain
rustup default stable-x86_64-pc-windows-gnu

# Add WASM target
rustup target add wasm32v1-none

# Compile contract
cd contracts/vendor_payment
cargo build --target wasm32v1-none --release

# Generate and fund deployer account
stellar keys generate --network testnet --fund deployer

# Deploy contract WASM
stellar contract deploy --wasm target/wasm32v1-none/release/vendor_payment.wasm --source deployer --network testnet
```
Use the output Contract ID in your environment variables config (e.g., `CONTRACT_ADDRESS_HERE`).

Initialize contract admin:
```bash
# Get deployer address
stellar keys address deployer

# Invoke init
stellar contract invoke --id <CONTRACT_ID> --source deployer --network testnet -- init --admin <DEPLOYER_ADDRESS>
```

---

## Wallet Setup
1. Install [Freighter Wallet](https://www.freighter.app/) extension in your browser.
2. In the wallet settings, switch the Network to **Testnet**.
3. Fund your account with testnet XLM using Friendbot.
4. Click **Connect Wallet** in the StellarPay app header.

---

## Running Locally

### Development Server
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view it.

### Build and Validate
Compile the Next.js production build:
```bash
npm run build
```

---

## Production Deployment (Vercel)
Deploy your application to Vercel:
1. Push the code to a GitHub repository.
2. Connect the repository to Vercel.
3. Configure the environment variables (`NEXT_PUBLIC_CONTRACT_ID`, `NEXT_PUBLIC_RPC_URL`, etc.).
4. Deploy!

---

## Contract Addresses & Transactions Reference
- **Contract Address**: `https://stellar.expert/explorer/testnet/contract/CDG27EPYNJSMVAZODRO7EE4T7MODY4VHEYGREZDQY3N5LU5CSE5MNNBR`
- **WASM Upload Transaction Hash**: `8911d2247b955e7e750a7fe80a393df4b647ec1ad7fbada28cff2990314ad630`
- **Contract Deployment Transaction Hash**: `0d4724c0d81170ed39dfcd324c1e6b4c2b04280399bf6ad535192524dda422b4`
- **Contract Initialization Transaction Hash**: `80405840a9148898b6cdf7e6d4cde6a78626e8dcb01b44ca7af837576c1597c3`
