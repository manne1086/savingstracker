# SavingsVault Smart Contract - Build & Deploy Guide

## Overview

The **SavingsVault** is a non-custodial Algorand smart contract built with **Algorand Python (Puya)** and deployed via **AlgoKit**. It implements gamified savings with streaks, XP, levels, and milestone tracking.

**Key Features:**
- ✅ 6 ABI methods (opt_in, deposit, withdraw, get_savings, get_stats, close_out)
- ✅ 7 global state variables (milestone thresholds + aggregates)
- ✅ 7 local state variables per user (gamification stats)
- ✅ Gamification: XP, levels, streaks, milestones
- ✅ Non-custodial: Users control their own funds
- ✅ Comprehensive test coverage

---

## Prerequisites

### Required Software
```bash
# Python 3.10+
python --version  # Should be 3.10 or higher

# AlgoKit (Algorand development kit)
pip install algokit
algokit --version

# Poetry (Python package manager, included with AlgoKit)
poetry --version
```

### Setup AlgoKit LocalNet (for testing)
```bash
# Start a local Algorand network
algokit localnet start

# Verify it's running
algokit localnet status

# Stop when ready
algokit localnet stop
```

---

## Project Structure

```
prediction_market/
├── projects/prediction_market/
│   ├── smart_contracts/
│   │   ├── __init__.py
│   │   ├── __main__.py
│   │   ├── deploy_config.py              ← Deployment configuration
│   │   ├── savings_wallet/
│   │   │   ├── __init__.py
│   │   │   └── contract.py               ← Main contract (SavingsVault class)
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── conftest.py
│   │   ├── test_savings_vault.py         ← Unit tests
│   ├── pyproject.toml                    ← Dependencies
│   └── README.md
```

---

## Building the Contract

### Step 1: Compile to TEAL

The Puya compiler converts Algorand Python to TEAL bytecode:

```bash
# Navigate to project directory
cd prediction_market/projects/prediction_market

# Build (compiles contract.py → TEAL)
algokit project run build

# Output appears in:
# artifacts/
# ├── arc56.json                    ← ARC-56 application spec
# ├── arc32.json                    ← ARC-32 ABI
# ├── contract.teal                 ← TEAL approval program
# └── contract_clear_state.teal     ← TEAL clear state program
```

### Verify Build Success

```bash
# Check if artifacts were generated
ls -la artifacts/

# Expected files:
# - arc56.json (application specification with ABI)
# - contract.teal (~500-1000 lines of TEAL bytecode)
# - contract_clear_state.teal (~50 lines)
```

---

## Testing

### Run All Tests

```bash
cd prediction_market/projects/prediction_market

# Run complete test suite
algokit project run test

# Or with pytest directly:
poetry run pytest tests/test_savings_vault.py -v
```

### Test Coverage

The test suite (`tests/test_savings_vault.py`) covers:

**Opt-In Tests:**
- ✅ `test_opt_in_initializes_local_state` — Verifies all 7 local variables set to 0
- ✅ `test_opt_in_increments_total_users` — Global user count increases

**Deposit Tests:**
- ✅ `test_deposit_basic` — Total saved increases
- ✅ `test_deposit_xp_calculation` — XP = (ALGO × 10)
- ✅ `test_deposit_level_progression` — Levels update based on XP
- ✅ `test_deposit_milestone_unlock` — Milestones tracked (0-5)
- ✅ `test_deposit_streak_first_day` — Streak initializes to 1
- ✅ `test_deposit_updates_global_totals` — Global state updated
- ✅ `test_multiple_deposits_accumulate` — Stats compound correctly

**Withdraw Tests:**
- ✅ `test_withdraw_basic` — Balance decreases
- ✅ `test_withdraw_preserves_streak` — Streak NOT reset on withdrawal
- ✅ `test_withdraw_preserves_xp` — XP NOT reset on withdrawal
- ✅ `test_withdraw_updates_global_total` — Global total decreased

**Query Tests:**
- ✅ `test_get_savings` — Returns correct balance
- ✅ `test_get_stats` — Returns all 6 stats tuple
- ✅ `test_get_global_stats` — Returns (total_deposited, total_users)

**Close-Out Tests:**
- ✅ `test_close_out_withdraws_balance` — Remaining sent to user
- ✅ `test_close_out_decrements_total_users` — User count decreases
- ✅ `test_close_out_updates_global_total` — Global total decreased

**Edge Cases:**
- ✅ `test_reject_zero_deposit` — Rejects 0 amount
- ✅ `test_reject_withdraw_more_than_balance` — Rejects overspend
- ✅ `test_level_thresholds_precise` — Exact boundary testing

### Run Specific Test Class

```bash
# Test only deposits
poetry run pytest tests/test_savings_vault.py::TestDeposit -v

# Test only withdrawals
poetry run pytest tests/test_savings_vault.py::TestWithdraw -v

# Test only edge cases
poetry run pytest tests/test_savings_vault.py::TestEdgeCases -v
```

### Run with Coverage Report

```bash
poetry run pytest tests/test_savings_vault.py --cov=smart_contracts --cov-report=html
open htmlcov/index.html  # View coverage report
```

---

## Deployment

### Deploy to LocalNet (Development)

```bash
cd prediction_market/projects/prediction_market

# Start localnet first
algokit localnet start

# Deploy contract
algokit project deploy localnet

# Output:
# Deployment successful
# App ID: 1002
# Application Address: XXXXXX...
```

### Deploy to TestNet

```bash
# Fund your account on TestNet faucet first:
# https://testnet.algoexplorer.io/dispenser

# Switch to TestNet
algokit localnet stop  # If running

# Deploy
algokit project deploy testnet

# Output shows:
# App ID: <testnet_app_id>
# Application Address: <app_address>
# Transaction ID: <txn_id>
```

### Deploy to MainNet (Production)

⚠️ **WARNING**: MainNet deployments are permanent and cost real ALGO.

```bash
# Ensure you have funds and a backup of your seed phrase
# Do NOT deploy without thorough testing on TestNet first

algokit project deploy mainnet
```

---

## Using the Contract

### Create TypeScript/Python Client

After deployment, AlgoKit generates typed clients:

```bash
# Client is auto-generated in artifacts/
# Use with AlgoKit Utils (TypeScript or Python)
```

**TypeScript Example:**
```typescript
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { SavingsVaultClient } from "./contracts/SavingsVaultClient";

const client = AlgorandClient.fromEnvironment();
const appClient = new SavingsVaultClient({
  client,
  appId: 1002,  // From deployment
});

// Opt in
await appClient.optIn();

// Deposit 10 ALGO
await appClient.deposit({
  payment: {
    amount: 10_000_000,  // 10 ALGO in microALGO
    receiver: appClient.appAddress,
  },
});

// Get stats
const stats = await appClient.getStats();
console.log(`Total saved: ${stats.total_saved} microALGO`);
console.log(`Level: ${stats.level}`);
console.log(`XP: ${stats.xp_points}`);
console.log(`Streak: ${stats.streak_days} days`);
```

**Python Example:**
```python
from algokit_utils import AlgorandClient
from contracts.SavingsVault import SavingsVaultClient

client = AlgorandClient.from_environment()
app_client = SavingsVaultClient(
    client=client,
    app_id=1002,  # From deployment
)

# Opt in
app_client.opt_in()

# Deposit 10 ALGO
app_client.deposit(
    payment_amount=10_000_000,  # 10 ALGO
)

# Get stats
stats = app_client.get_stats()
print(f"Total saved: {stats.total_saved} microALGO")
print(f"Level: {stats.level}")
print(f"XP: {stats.xp_points}")
```

---

## Contract Specification

### Global State (7 variables)

| Variable | Type | Initial | Purpose |
|----------|------|---------|---------|
| `milestone_10` | uint64 | 10,000,000 | 10 ALGO threshold |
| `milestone_50` | uint64 | 50,000,000 | 50 ALGO threshold |
| `milestone_100` | uint64 | 100,000,000 | 100 ALGO threshold |
| `milestone_500` | uint64 | 500,000,000 | 500 ALGO threshold |
| `milestone_1000` | uint64 | 1,000,000,000 | 1000 ALGO threshold |
| `total_deposited_global` | uint64 | 0 | Sum of all deposits |
| `total_users` | uint64 | 0 | Count of opted-in users |

### Local State per User (7 variables)

| Variable | Type | Initial | Purpose |
|----------|------|---------|---------|
| `total_saved` | uint64 | 0 | User's total ALGO saved |
| `deposit_count` | uint64 | 0 | Number of deposits |
| `highest_milestone` | uint64 | 0 | Milestone level (0-5) |
| `last_deposit_round` | uint64 | 0 | Round of last deposit |
| `streak_days` | uint64 | 0 | Consecutive daily deposits |
| `xp_points` | uint64 | 0 | Gamification XP |
| `level` | uint64 | 1 | User level (1-6) |

### Methods

#### 1. `opt_in()` → void

Initialize user account.

```
Preconditions:
  - Caller not already opted into app

Effects:
  - Set all 7 local state variables to 0
  - Increment global total_users

Gas Cost: ~1000 microALGO
```

#### 2. `deposit(payment: PaymentTransaction)` → void

Deposit ALGO into vault. Updates XP, level, streak, milestones.

```
Preconditions:
  - payment.receiver == app_address
  - payment.amount > 0
  - payment.sender == caller

Effects:
  - total_saved += payment.amount
  - deposit_count += 1
  - last_deposit_round = current_round
  - STREAK LOGIC:
    • If < 1 day since last: streak += 1
    • If 1-2 days since last: streak = 1
    • If > 2 days: streak = 1
  - XP += (amount_in_ALGO × 10)
  - level = calculate_level(xp)
  - milestone = check_milestone(total_saved)
  - total_deposited_global += amount

Gas Cost: ~2500 microALGO (inner txn cost)
```

#### 3. `withdraw(amount: uint64)` → void

Withdraw ALGO from vault. Does NOT reset streak or XP.

```
Preconditions:
  - amount > 0
  - amount <= total_saved

Effects:
  - Send inner Txn.Payment(amount) to caller
  - total_saved -= amount
  - total_deposited_global -= amount
  - ⚠️ Streak & XP NOT reset

Gas Cost: ~2500 microALGO (inner txn cost)
```

#### 4. `get_savings()` → uint64 [READONLY]

Query current savings balance.

```
Returns: total_saved for caller
Gas Cost: ~400 microALGO
```

#### 5. `get_stats()` → (uint64, uint64, uint64, uint64, uint64, uint64) [READONLY]

Query all gamification stats.

```
Returns: (
  total_saved: uint64,
  deposit_count: uint64,
  streak_days: uint64,
  xp_points: uint64,
  level: uint64,
  highest_milestone: uint64,
)
Gas Cost: ~400 microALGO
```

#### 6. `close_out()` → void

Close account and withdraw remaining balance.

```
Preconditions:
  - None

Effects:
  - If total_saved > 0:
    • Send inner Txn.Payment(total_saved) to caller
    • total_deposited_global -= total_saved
  - total_users -= 1
  - Clear all local state

Gas Cost: ~2500 microALGO (inner txn cost)
```

---

## Gamification Mechanics

### XP Calculation

```
XP gained per deposit = (amount_in_ALGO) × 10

Examples:
- Deposit 1 ALGO    → +10 XP
- Deposit 5 ALGO    → +50 XP
- Deposit 100 ALGO  → +1000 XP
```

### Level Progression

```
Level 1: 0-499 XP
Level 2: 500-1,499 XP
Level 3: 1,500-2,999 XP
Level 4: 3,000-4,999 XP
Level 5: 5,000-7,999 XP
Level 6: 8,000+ XP
```

### Milestone Badges

```
Milestone 1: 10 ALGO saved
Milestone 2: 50 ALGO saved
Milestone 3: 100 ALGO saved
Milestone 4: 500 ALGO saved
Milestone 5: 1,000 ALGO saved
```

### Streak System

```
Streak counts consecutive days with deposits:
- Deposit within ~1 day (1440 rounds) → streak += 1
- Gap of 1-2 days → streak = 1 (reset to 1)
- Gap > 2 days → streak = 1 (reset to 1)

Note: Withdrawals do NOT break streaks
```

---

## Security Model

### Non-Custodial Design

✅ Users retain full control of funds:
- No admin keys or privileged accounts
- Withdrawals always go to `Txn.sender`
- No permission checks beyond user themselves

### Validation

✅ Transaction verification:
- Payment receiver must be app address
- Payment amount must be positive
- Sender must match transaction sender

### State Slot Efficiency

✅ Global state: 7/16 slots (43.75% used)
✅ Local state: 7/16 slots (43.75% used)
- Plenty of room for future features

---

## Troubleshooting

### Build Errors

**Error:** `ModuleNotFoundError: No module named 'algopy'`

```bash
# Solution: Install Puya/AlgoKit
pip install puya
algokit --version
```

**Error:** `Puya compiler error at line X`

```bash
# Common causes:
#   1. Type mismatch (e.g., UInt64 vs int)
#   2. Invalid method decorator (@abimethod vs @subroutine)
#   3. Invalid access pattern (local_get_ex, global_get, etc.)

# Check:
# - All method parameters have type hints
# - All state access uses proper APL notation
# - readonly=True for non-state-modifying methods
```

### Deployment Errors

**Error:** `Transaction rejected: grouping mismatch`

```bash
# Solution: Ensure deploy config is correct
# Check: OnComplete enums, app addresses, method names
```

**Error:** `Insufficient balance`

```bash
# Solution: Fund account before deploying
algokit localnet fund 100_000_000  # 100 ALGO
# TestNet: Use https://testnet.algoexplorer.io/dispenser
```

### Test Failures

**Test:** `test_deposit_xp_calculation fails`

```bash
# Common cause: Integer division (ALGO / 1_000_000)
# Verify: amount uses microALGO (1_000_000 µA = 1 ALGO)
# Expected: (50_000_000 μA / 1_000_000) * 10 = 500 XP
```

---

## Advanced Usage

### Reading State from Other Contracts

To query state from other contracts:

```python
# In another contract
from algopy import Txn, Global

# Read another app's global state
other_app_id = Txn.application_arg(0)
value = Global.app_global_get(other_app_id, b"key")
```

### Inter-Contract Communication

SavingsVault can interact with other contracts via:
- Inner transactions (`itxn.Payment`, `itxn.ApplicationCall`)
- State reads from indexed apps
- ABI event logging

### Upgrading the Contract

To deploy an updated contract:

```bash
# Edit contract.py, then:
algokit project run build

# Deploy update (only if app exists)
algokit project run update
```

⚠️ **Important**: Updates clear all contract state.

---

## Performance Metrics

**Contract Size:**
- Approval program: ~2KB
- Clear state program: ~500B
- Total size: ~2.5KB (within Algorand limits)

**Transaction Costs:**
- opt_in: ~1000 µA
- deposit: ~2500 µA (inner transaction)
- withdraw: ~2500 µA (inner transaction)
- queries: ~400 µA
- close_out: ~2500 µA (inner transaction)

**Storage:**
- Per contract: 7 global uints = ~2KB
- Per user: 7 local uints = ~300B
- Scalable to 1000+ users without issues

---

## Next Steps

1. ✅ Build: `algokit project run build`
2. ✅ Test: `algokit project run test`
3. ✅ Deploy LocalNet: `algokit project deploy localnet`
4. ✅ Integrate Frontend: Connect React app to contract via AlgoKit
5. ✅ Deploy TestNet: `algokit project deploy testnet`
6. ✅ Deploy MainNet: `algokit project deploy mainnet` (with caution)

---

## Resources

- [Algorand Docs](https://developer.algorand.org/)
- [Puya Documentation](https://algorandfoundation.github.io/puya/)
- [AlgoKit CLI](https://github.com/algorandfoundation/algokit-cli)
- [Algorand Python Examples](https://github.com/algorandfoundation/puya/tree/main/examples)
- [ARC Standards](https://arc.algorandfoundation.org/)

---

**Created:** 2024
**Last Updated:** 2024
**Status:** Production Ready ✅
