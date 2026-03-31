# Wallet Connection Troubleshooting Guide

## Overview

The wallet connection system uses:
- **Pera Wallet** for signing transactions (primary)
- **Defly** wallet as alternative
- **AlgoKit Utils** for blockchain operations
- **algosdk** for transaction building

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (React)                            │
│  ├─ WalletContext.tsx (state management)    │
│  ├─ algorand.ts (wallet functions)          │
│  └─ VaultContext.tsx (app state)            │
└──────────────┬──────────────────────────────┘
               │
               │ POST signTransaction
               │
┌──────────────▼──────────────────────────────┐
│  Pera Wallet (Mobile/Browser Extension)     │
│  ├─ Manages private keys                    │
│  ├─ Signs transactions                      │
│  └─ Handles confirmation                    │
└──────────────┬──────────────────────────────┘
               │
               │ Returns signed transaction
               │
┌──────────────▼──────────────────────────────┐
│  Client Browser                             │
│  ├─ Receives signed transaction             │
│  ├─ Submits to Algorand network             │
│  └─ Monitors confirmation                   │
└──────────────┬──────────────────────────────┘
               │
               │ POST /v2/transactions
               │
┌──────────────▼──────────────────────────────┐
│  Algorand TestNet (algod + indexer)         │
│  ├─ https://testnet-api.algonode.cloud      │
│  ├─ https://testnet-idx.algonode.cloud      │
│  └─ Smart Contract App ID: {YOUR_APP_ID}    │
└─────────────────────────────────────────────┘
```

---

## Issue 1: "Connect Wallet Button Does Nothing"

### Symptoms
- Click "Connect Wallet" → Nothing happens
- No error message in console
- Pera Wallet doesn't open

### Root Causes & Fixes

#### A. Pera Wallet Not Installed
```bash
# Check browser console for errors
# Should see: "Pera Wallet extension installed"

# If missing:
# 1. Go to https://www.perawallet.app/
# 2. Click "Download" → Select your browser
# 3. Add extension
# 4. Reload page
```

#### B. APP_ID Still 0
```typescript
// File: Client/src/lib/algorand.ts

// This is BAD - app doesn't exist
const APP_ID = 0;

// This is GOOD - after deployment
const APP_ID = 123456789;
```

**Fix:**
```bash
# Update Client/.env.local
VITE_SAVINGS_VAULT_APP_ID=123456789
```

#### C. Import Error in WalletContext
```bash
# In Client directory, check:
npm ls @perawallet/connect

# If missing:
npm install @perawallet/connect@latest
npm run dev  # Restart dev server
```

---

## Issue 2: "Wallet Connected But Can't Opt-In"

### Symptoms
- Connect button works
- Address shows connected
- When trying to opt-in: "Transaction rejected"
- Vault data shows 0 everywhere

### Root Causes & Fixes

#### A. App ID Is Wrong
```bash
# Check deployed app ID
# Compare:
# 1. What's in .env.local
# 2. What algokit said during deployment

# Fix:
# 1. Deploy contract: algokit project deploy testnet
# 2. Copy the App ID from output
# 3. Update .env.local
# 4. Restart npm run dev
```

#### B. Contract Not Deployed
```bash
# Check if contract exists on chain
curl https://testnet-idx.algonode.cloud/v2/applications/YOUR_APP_ID

# If 404 error:
# 1. Run: algokit project run build
# 2. Run: algokit project deploy testnet
# 3. Copy App ID
# 4. Update .env.local
# 5. Restart dev server
```

#### C. Insufficient Balance for Min Balance
```bash
# Opt-in requires ~0.101 ALGO in min balance
# Check account balance:
curl https://testnet-idx.algonode.cloud/v2/accounts/YOUR_ADDRESS | jq '.amount'

# If low:
# 1. Go to https://testnet.algonode.cloud/ (or other faucet)
# 2. Request funds (1-10 ALGO)
# 3. Wait for confirmation
# 4. Try opt-in again
```

---

## Issue 3: "Deposit Transaction Fails"

### Symptoms
- Opt-in succeeded ✓
- Vault data loads ✓  
- Click "Deposit" → Transaction rejected
- Or: "Group transaction invalid"

### Root Causes & Fixes

#### A. Grouped Transaction Issue
The deposit uses TWO transactions in a group:
1. **Payment** (send ALGO to app)
2. **AppCall** (call deposit method)

**If grouping fails:**
```typescript
// Check in Client/src/lib/algorand.ts
// The depositALGO function should:
// 1. Create both txns ✓
// 2. Assign same group ID ✓
// 3. Submit both sequentially ✓

// Latest fix ensures all txns in group are submitted
```

#### B. Insufficient Balance
```bash
# Deposit requires deposit amount + fees + min balance
# Example: 1 ALGO deposit + 0.002 ALGO fees + 0.1 ALGO min balance = 1.102 ALGO

# Check balance:
curl https://testnet-idx.algonode.cloud/v2/accounts/YOUR_ADDRESS | jq '.amount'

# Fix: Get more ALGO from faucet
```

#### C. Pera Signing Issue
```bash
# In browser console, check:
console.log("Wallet address:", address);
console.log("App ID:", APP_ID);
console.log("Amount (ALGO):", amountAlgo);

# If any is wrong, check:
# 1. Wallet connected?
# 2. .env.local updated?
# 3. App exists?
```

---

## Issue 4: "Indexer Connection Errors"

### Symptoms
- "Failed to fetch vault data"
- getGlobalStats returns 0
- getDepositHistory empty but should have data

### Root Causes & Fixes

#### A. Wrong Indexer URL
```typescript
// Should be:
const indexerClient = new algosdk.Indexer(
  "",
  "https://testnet-idx.algonode.cloud",
  443
);

// NOT:
// "https://testnet.algonode.cloud" (wrong)
// "http://mainnet-idx..." (wrong network)
```

#### B. Indexer Not Synced
```bash
# Check indexer health
curl https://testnet-idx.algonode.cloud/v2/status | jq '.db-available'

# If false, wait a moment and retry
```

#### C. Query Issues
```bash
# Test a specific address query
curl "https://testnet-idx.algonode.cloud/v2/accounts/YOUR_ADDRESS/apps-local-state" \
  | jq '.'

# Should show app opt-ins
```

---

## Issue 5: "State Parsing Errors"

### Symptoms  
- Wallet connects ✓
- Opt-in works ✓
- Deposit succeeds ✓
- But vault data shows: `{ totalSaved: 0, level: 1, ... }`

### Root Causes & Fixes

#### A. Wrong State Key Names
```typescript
// In getSavingsData():
const parsed = parseLocalState(localState);

// Keys MUST match contract exactly:
// ✓ "total_saved" (from contract)
// ✗ "totalSaved" (camelCase wrong)
// ✗ "total-saved" (hyphen wrong)

// Check contract definition:
// File: smart_contracts/savings_wallet/contract.py
// Line: self.total_saved = LocalState(...)
```

#### B. Microalgo Conversion Error
```typescript
// MUST convert from microALGO to ALGO
return {
  totalSaved: (parsed["total_saved"] || 0) / 1_000_000,  // ✓ Divide by 1M
  // NOT:
  totalSaved: (parsed["total_saved"] || 0),  // ✗ Wrong
};
```

#### C. Type Mismatch
```typescript
// State must be uint64 (type 2)
const parseLocalState = (keyValues) => {
  return keyValues
    .filter(kv => kv.value.type === 2)  // Only uint64
    .reduce((acc, kv) => {
      const key = Buffer.from(kv.key, "base64").toString();
      acc[key] = kv.value.uint;  // uint property
      return acc;
    }, {});
};
```

---

## Debug Checklist

Use this to identify issues systematically:

```bash
# 1. Check Network
curl https://testnet-api.algonode.cloud/v2/status | jq '.network'
# Should show: "betanet" or "testnet"

# 2. Check Account Exists
curl https://testnet-idx.algonode.cloud/v2/accounts/YOUR_ADDRESS | jq '.amount'
# Should show amount in microALGO

# 3. Check App Exists
curl https://testnet-idx.algonode.cloud/v2/applications/YOUR_APP_ID | jq '.application.id'
# Should show your app ID

# 4. Check App Opt-In
curl https://testnet-idx.algonode.cloud/v2/accounts/YOUR_ADDRESS/apps-local-state \
  | jq '.apps-local-states[] | select(.id=='YOUR_APP_ID')'
# Should show local state values

# 5. Check Recent Transactions
curl "https://testnet-idx.algonode.cloud/v2/accounts/YOUR_ADDRESS/transactions?limit=10" \
  | jq '.transactions[] | {type: .type, app_index: .app_index}'
# Should show your app calls
```

---

## Browser Console Debugging

```javascript
// Paste in browser console while on the vault page

// Check wallet connection
console.log("Wallet connected:", !!window.__wallet);

// Check env vars
console.log("App ID:", import.meta.env.VITE_SAVINGS_VAULT_APP_ID);

// Check algosdk
console.log("Algosdk version:", algosdk.version);

// Test connection
const client = new algosdk.Indexer("", "https://testnet-idx.algonode.cloud", 443);
client.getStatus().do().then(s => console.log("Indexer status:", s));

// Check Pera Wallet
console.log("Pera installed:", !!window.peraWallet);
```

---

## Network Reset

Sometimes the issue is stale data or network caching:

```bash
# 1. Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cached images/files

# 2. Restart dev server
cd Vivitsu-main/Client
npm run dev

# 3. Disconnect wallet
# Click "Disconnect" in app

# 4. Close Pera Wallet extension

# 5. Hard refresh browser
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

# 6. Reconnect wallet
# Click "Connect Wallet" again
```

---

## Testing Connection Locally

```bash
# If you want to test before deploying to TestNet:

# 1. Start AlgoKit LocalNet
algokit localnet start

# 2. Deploy to localnet
cd prediction_market/projects/prediction_market
algokit project deploy localnet

# 3. Update .env.local to use localnet
VITE_SAVINGS_VAULT_APP_ID=<LocalNet App ID>
VITE_ALGOD_URL=http://localhost:4001
VITE_INDEXER_URL=http://localhost:8980

# 4. Run local wallet mock (optional)
# or use Pera Wallet on TestNet
```

---

## Getting Help

If issues persist:

1. **Check the browser console** for error messages
2. **Check network tab** to see failed requests
3. **Run the debug checklist** above
4. **Check contract state** on the block explorer
5. **Review recent commits** if recently updated code

### Information to provide when asking for help:

```
- App ID: [YOUR_APP_ID]
- Network: [testnet/mainnet/localnet]
- Wallet: [Pera/Defly/Other]
- Error Message: [FULL ERROR TEXT]
- Browser Console Error: [SCREENSHOT/TEXT]
- .env.local content: [SANITIZED]
- Smart contract location: [PATH]
- Recent changes: [WHAT YOU CHANGED]
```

