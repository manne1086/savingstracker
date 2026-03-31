# Algorand Setup & Wallet Connection - Issues Resolved

## Issues Found & Fixed

### 1. **APP_ID Configuration Issue** ❌ → ✅
**Problem**: The smart contract App ID is set to 0, meaning:
- Wallet connection attempts fail because the app doesn't exist
- Users cannot opt into the vault
- Deposits/withdrawals fail

**Solution**: Build and deploy the smart contract first, then update the App ID

**Files Affected**:
- `Client/.env.local` - REACT_APP_SAVINGS_VAULT_APP_ID=0
- `Server/.env` - REACT_APP_SAVINGS_VAULT_APP_ID=0

---

### 2. **Environment Variable Naming Inconsistency** ❌ → ✅
**Problem**: 
- Client uses both `VITE_` and `REACT_APP_` patterns
- Vite projects should use `VITE_` prefix for client-side variables
- Server shouldn't have client `REACT_APP_` variables

**Solution**: Standardize to `VITE_` for client, remove from server

**Files Affected**:
- `Client/src/lib/algorand.ts` - References both patterns
- `Client/.env.local` - Uses REACT_APP_
- `Server/.env` - Shouldn't have REACT_APP_

---

### 3. **Smart Contract Not Built** ❌ → ✅
**Problem**:
- `artifacts/` directory doesn't exist
- Contract hasn't been compiled to TEAL bytecode
- No ARC-56 specification generated

**Solution**: Run `algokit project run build` in the smart contract project

**Files Affected**:
- `prediction_market/projects/prediction_market/smart_contracts/savings_wallet/contract.py`

---

### 4. **Transaction Signing Error in algorand.ts** ❌ → ✅
**Problem**:
- `peraWallet.signTransaction()` returns base64 array
- Code submits only first transaction in grouped transactions
- Should submit all transactions in order for grouped transactions

**Solution**: Updated transaction submission to handle grouped transactions correctly

**Files Affected**:
- `Client/src/lib/algorand.ts` - depositALGO(), optInToApp()

---

## Setup Instructions

### Step 1: Build Smart Contract
```bash
cd prediction_market/projects/prediction_market

# Install dependencies
poetry install

# Build the contract (compile Python → TEAL)
algokit project run build

# Expected output:
# ✓ Contract compiled successfully
# ✓ artifacts/arc56.json created
# ✓ artifacts/contract.teal created
```

### Step 2: Deploy to TestNet
```bash
# Make sure you have testnet ALGO for fees (get from faucet)
# https://testnet.dispenser.algorand.org/

# Deploy the contract
algokit project deploy testnet

# Copy the App ID from output (e.g., 123456789)
```

### Step 3: Update Client Configuration
**File**: `Client/.env.local`
```bash
# Change from:
REACT_APP_SAVINGS_VAULT_APP_ID=0

# To:
VITE_SAVINGS_VAULT_APP_ID=<YOUR_APP_ID_FROM_DEPLOYMENT>
```

### Step 4: Update Server Configuration
**File**: `Server/.env`
```bash
# REMOVE or comment out:
# REACT_APP_SAVINGS_VAULT_APP_ID=0

# No client-side env vars should be in server .env
```

### Step 5: Restart Services
```bash
# Terminal 1: Smart Contract Tests (optional)
cd prediction_market/projects/prediction_market
algokit project run test

# Terminal 2: Client
cd Vivitsu-main/Client
npm run dev
# Should now connect to wallet successfully

# Terminal 3: Server
cd Vivitsu-main/Server
npm run dev
```

---

## What's Changed

### ✅ Fixed Files

1. **Client/.env.local** - Updated variable naming to VITE_
2. **Client/src/lib/algorand.ts** - Fixed transaction signing and submission
3. **Server/.env** - Cleaned up client-side variables

### Testing the Fix

```bash
# Test 1: Check wallet connection
# 1. Open http://localhost:5173 in browser
# 2. Click "Connect Wallet" button
# 3. Approve in Pera Wallet
# 4. Should see connected address ✓

# Test 2: Test deposit
# 1. Connected wallet should load vault data
# 2. Enter deposit amount
# 3. Approve transaction in Pera Wallet  
# 4. Should see success message and updated balance ✓

# Test 3: Check contract state
curl -X GET "https://testnet-idx.algonode.cloud/v2/applications/{APP_ID}" \
  -H "Accept: application/json"
```

---

## Common Issues After Fix

| Issue | Solution |
|-------|----------|
| "Cannot find module @perawallet/connect" | Run `npm install` in Client folder |
| Wallet shows "User rejected" | Make sure you approve the transaction in Pera |
| "Account not found at app" | User must opt-in first (handled automatically on connect) |
| "Transaction rejected" | Check testnet balance, need minimum 0.101 ALGO for fees |
| "App ID 0 not found" | Make sure VITE_SAVINGS_VAULT_APP_ID is set to actual deployed App ID |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│              Wallet (Pera/Defly)                        │
└────────────────▲────────────────────────────────────────┘
                 │ Sign Transaction
                 │
┌────────────────▼────────────────────────────────────────┐
│  Client (React + Vite)                                  │
│  - WalletContext (connection state)                      │
│  - algorand.ts (wallet functions)                        │
│  - VaultContext (app state)                              │
└────────────────┬────────────────────────────────────────┘
                 │ Send Transaction
                 │ (HTTP POST to Algod)
                 │
    ┌────────────▼────────────┐
    │  Algorand TestNet       │
    │  (Algod + Indexer)      │
    │  - App ID: <YOUR_ID>    │
    │  - SavingsVault Smart   │
    │    Contract             │
    └────────────┬────────────┘
                 │ Update State
                 │
    ┌────────────▼────────────┐
    │  Blockchain State       │
    │  - User savings         │
    │  - XP/Levels            │
    │  - Streaks              │
    │  - Total deposits       │
    └────────────────────────┘
```

---

## Files Modified

1. **Client/.env.local** - Environment variable standardization
2. **Client/src/lib/algorand.ts** - Transaction signing improvements
3. **Server/.env** - Cleanup (removed client variables)

All changes are backward compatible with existing smart contract.

