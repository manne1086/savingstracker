# Quick Start: Build & Deploy Smart Contract

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] Python 3.10+ installed: `python --version`
- [ ] AlgoKit installed: `algokit --version`  
- [ ] Poetry installed: `poetry --version`
- [ ] TestNet ALGO for fees (get from https://testnet.algonode.cloud/)
- [ ] VS Code with Python extension
- [ ] Git (for version control)

```bash
# Install missing tools
# Windows:
choco install python algokit poetry

# macOS:
brew install python algokit poetry

# Linux:
# Use your package manager or pip install algokit poetry
```

---

## 🚀 Build & Deploy Steps

### Step 1: Navigate to Smart Contract Directory

```bash
cd d:\hackathons\studia\prediction_market\projects\prediction_market
```

### Step 2: Install Dependencies

```bash
# Install poetry dependencies
poetry install

# This installs:
# - algokit-utils (blockchain interaction)
# - algorand-python (contract language)
# - pytest (testing framework)
# - puyapy (compiler: Python → TEAL)
```

### Step 3: Build Contract (Python → TEAL)

```bash
algokit project run build

# Expected output:
# Compiling...
# ✓ Compilation successful
# Generated artifacts:
# - artifacts/arc56.json (Application specification)
# - artifacts/contract.teal (Approval program)
# - artifacts/contract_clear_state.teal (Clear state program)
```

**Troubleshooting Build Issues:**

| Error | Solution |
|-------|----------|
| `ModuleNotFoundError: algopy` | Run `poetry install` |
| `Command 'puyapy' not found` | Run `poetry install` |
| `FileNotFoundError: contract.py` | Check file exists in `smart_contracts/savings_wallet/` |
| TEAL compilation error | Check contract syntax in `contract.py` |

### Step 4: Verify Build Artifacts

```bash
# Check if artifacts were created
ls -la smart_contracts/savings_wallet/artifacts/

# Expected files:
# - arc56.json (2-3 KB)
# - contract.teal (20-50 KB)
# - contract_clear_state.teal (1-2 KB)

# View the generated ABI
cat smart_contracts/savings_wallet/artifacts/arc56.json | jq '.methods[]'
```

### Step 5: Run Tests (Optional but Recommended)

```bash
algokit project run test

# This verifies the contract works correctly before deployment
# Tests cover:
# ✓ Opt-in functionality
# ✓ Deposits with XP/level calculations
# ✓ Withdrawals with sufficient balance
# ✓ Streak tracking
# ✓ Milestone detection
```

### Step 6: Deploy to TestNet

```bash
# Deploy the contract
algokit project deploy testnet

# Output will show:
# App created with ID: 123456789
# Creator: CREATOR_ADDRESS...
# Creator balance: X.XXX ALGO
```

**Copy the App ID from the output** - you'll need this in the next step.

### Step 7: Update Client Configuration

Open `Client/.env.local`:

```bash
# Change from:
VITE_SAVINGS_VAULT_APP_ID=0

# To (replace with your actual App ID):
VITE_SAVINGS_VAULT_APP_ID=123456789
```

### Step 8: Restart Client Development Server

```bash
cd ../../Vivitsu-main/Client
npm run dev

# The app will restart and connect to your deployed contract
# You should now see the wallet connect button available
```

---

## 🧪 Testing the Deployment

### Test 1: Check Contract on Chain

```bash
# View contract details
curl -s https://testnet-idx.algonode.cloud/v2/applications/123456789 | jq '.application.params'

# Should show:
# {
#   "approval-program": "...",
#   "clear-state-program": "...",
#   "creator": "YOUR_ADDRESS",
#   "global-state": [...]
# }
```

### Test 2: Test Wallet Connection

1. Open http://localhost:5173 in browser
2. Click "Connect Wallet" button
3. Select "Pera Wallet" or "Defly"  
4. Approve connection
5. **Expected**: Address should appear on screen ✓

### Test 3: Test Deposit

1. Ensure wallet is connected
2. Enter deposit amount (e.g., "1.0")
3. Click "Deposit"
4. Approve transaction in wallet
5. **Expected**: 
   - Success message appears
   - Balance updates
   - XP/level increment shown

### Test 4: Test Withdraw

1. Click "Withdraw" tab
2. Enter withdrawal amount
3. Approve transaction
4. **Expected**:
   - ALGO transferred back to wallet
   - Vault balance decremented

---

## 📊 Contract Details

| Aspect | Details |
|--------|---------|
| **Language** | Algorand Python (PuyaPy) |
| **Network** | Algorand TestNet |
| **Methods** | opt_in, deposit, withdraw, get_savings, get_stats, close_out |
| **Storage** | GlobalState (7 vars) + LocalState (7 vars per user) |
| **Compiled Size** | ~2-3 KB (TEAL bytecode) |
| **Deployment Cost** | 0.101 ALGO (base) |
| **Min Balance** | 0.1 ALGO + 0.1 ALGO per opt-in |

---

## 🔧 Common Commands

```bash
# Build only
algokit project run build

# Build + Test
algokit project run build && algokit project run test

# Deploy with custom name
algokit project deploy testnet --name "My SavingsVault"

# View app state
curl https://testnet-idx.algonode.cloud/v2/applications/{APP_ID}

# List all contracts deployed
algokit project list
```

---

## 📁 Generated Files

After building, these files are created:

```
artifacts/
├── arc56.json                    # Full application spec (ABI + metadata)
├── arc32.json                    # ABI only (for compatibility)
├── contract.teal                 # Compiled approval program
├── contract_clear_state.teal     # Clear state program
└── .generated/                   # Generated client code (if using algokit)
    └── client_SavingsVault.ts    # TypeScript client class
```

---

## ⚠️ Important Notes

1. **App ID = 0 means not deployed**: If VITE_SAVINGS_VAULT_APP_ID is still 0, wallet connections will fail

2. **TestNet vs MainNet**: This deployment is on TestNet. For MainNet:
   ```bash
   algokit project deploy mainnet
   ```

3. **State Management**: Each user who opts into the contract has:
   - 7 global state entries (contract-wide)
   - 7 local state entries (per-user savings, XP, etc.)

4. **Minimum Balance**: Each opt-in costs ~0.101 ALGO in min balance

5. **Gas Fees**: Deposits/withdrawals cost ~1,000 microALGO (0.001 ALGO) each

---

## 🆘 Troubleshooting

### "Application not found" error during deploy
```bash
# Your localnet might not be running
algokit localnet start

# Deploy to localnet for testing
algokit project deploy localnet
```

### "Account does not have the minimum balance"
```bash
# Fund your account from the faucet
curl -X POST https://testnet.algonode.cloud/dispenser/fund \
  -H "Content-Type: application/json" \
  -d '{"address": "YOUR_ADDRESS", "amount": 10000000}'
```

### Contract fails to compile
```bash
# Check Python syntax
python smart_contracts/savings_wallet/contract.py --check

# Run linter
poetry run black --check smart_contracts/
poetry run mypy smart_contracts/
```

### Transaction keeps failing
```bash
# Check transaction logs
curl https://testnet-idx.algonode.cloud/v2/applications/{APP_ID}/logs

# Check account state
curl https://testnet-idx.algonode.cloud/v2/accounts/{YOUR_ADDRESS}/apps-opt-in
```

---

## ✨ Next Steps After Deployment

1. ✅ Wallet connection should work
2. ✅ Test deposits/withdrawals
3. ⬜ Set up backend API for state queries
4. ⬜ Deploy React frontend to production
5. ⬜ Deploy to MainNet when ready

