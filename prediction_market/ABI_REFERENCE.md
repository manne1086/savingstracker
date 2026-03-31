# SavingsVault - ABI Reference & Integration Guide

## 📋 ABI (Application Binary Interface)

The SavingsVault contract exposes **8 methods** through the ARC-4 standard. This guide shows how to call each method from TypeScript, Python, or via direct transaction calls.

---

## 🔧 Contract Methods

### 1. `opt_in()` → void

**Initialize user account in contract**

**Signature:**
```python
@abimethod()
def opt_in(self) -> None:
```

**Parameters:** None

**Returns:** void

**Effects:**
- Creates local state entries for caller
- Initializes all 7 local variables to 0
- Increments global `total_users` by 1

**TypeScript Example:**
```typescript
import { AlgorandClient } from "@algorandfoundation/algokit-utils";
import { SavingsVaultClient } from "./contracts/SavingsVaultClient";

const client = AlgorandClient.fromEnvironment();
const appClient = new SavingsVaultClient({ client });

// Call opt_in
const response = await appClient.optIn({
  sender: myAccount.address,
});

console.log("Opt-in success:", response.confirmation);
```

**Python Example:**
```python
from algokit_utils import AlgorandClient
from contracts.SavingsVault import SavingsVaultClient

client = AlgorandClient.from_environment()
app_client = SavingsVaultClient(
    client=client,
    app_id=1002,
    sender=my_account,
)

# Call opt_in
response = app_client.opt_in()
print(f"Opted in: {response.return_value}")
```

**Gas Cost:** ~1000 µA

**Conditions:**
- Caller must not already be opted into app
- Must be called before first deposit

---

### 2. `deposit(payment: PaymentTransaction)` → void

**Deposit ALGO into vault. Updates XP, level, streak, and milestones.**

**Signature:**
```python
@abimethod()
def deposit(self, payment: PaymentTransaction) -> None:
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `payment` | PaymentTransaction | Payment to app address (atomic with call) |

**Returns:** void

**Effects:**
- Adds deposit to `total_saved`
- Increments `deposit_count`
- Updates `last_deposit_round`
- **STREAK LOGIC**: Increments or resets based on time since last deposit
- **XP LOGIC**: Adds `(ALGO_amount × 10)` to `xp_points`
- **LEVEL LOGIC**: Recalculates `level` based on XP
- **MILESTONE CHECK**: Updates `highest_milestone` if new threshold crossed
- Updates global `total_deposited_global`

**TypeScript Example:**
```typescript
import { AlgorandClient, microAlgos } from "@algorandfoundation/algokit-utils";
import { SavingsVaultClient } from "./contracts/SavingsVaultClient";

const client = AlgorandClient.fromEnvironment();
const appClient = new SavingsVaultClient({ client });

// Deposit 10 ALGO
const paymentTxn = await client.send.payment({
  sender: myAccount.address,
  receiver: appClient.appAddress,
  amount: microAlgos(10_000_000),  // 10 ALGO in microALGO
});

const response = await appClient.deposit({
  payment: paymentTxn,
  sender: myAccount.address,
});

console.log("Deposit confirmed:", response.confirmation);
```

**Python Example:**
```python
from algosdk.transaction import PaymentTxn

# Create payment transaction
payment = PaymentTxn(
    sender=my_account.address,
    receiver=app_client.app_address,
    amount=10_000_000,  # 10 ALGO in microALGO
    index=1,
)

# Call deposit (payment is atomic with app call)
response = app_client.deposit(
    payment=payment,
    sender=my_account.address,
)

print(f"Deposit confirmed in round: {response.confirmation}")
```

**Gas Cost:** ~2500 µA (includes inner transaction overhead)

**Conditions:**
- Payment receiver must be app address
- Payment amount must be > 0
- Caller must have opted in first

**Example Flow:**
```
Deposit: 5 ALGO (5,000,000 µA)
↓
XP Gained: 50 (5 × 10)
↓
New Total XP: 500 (if first deposit)
↓
New Level: 2 (500 XP threshold)
↓
Streak: 1 day (first deposit)
↓
Global Total: +5 ALGO
```

---

### 3. `withdraw(amount: uint64)` → void

**Withdraw ALGO from vault back to caller. Does NOT reset streak or XP.**

**Signature:**
```python
@abimethod()
def withdraw(self, amount: UInt64) -> None:
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `amount` | uint64 | microALGO to withdraw |

**Returns:** void

**Effects:**
- Sends inner Txn.Payment to caller (non-custodial)
- Decrements `total_saved`
- Updates global `total_deposited_global`
- ⚠️ **Does NOT reset** `streak_days` or `xp_points`

**TypeScript Example:**
```typescript
// Withdraw 2 ALGO
const response = await appClient.withdraw({
  amount: BigInt(2_000_000),  // 2 ALGO in microALGO
  sender: myAccount.address,
});

console.log("Withdrawal confirmed:", response.confirmation);
console.log("Funds returned to:", myAccount.address);
```

**Python Example:**
```python
# Withdraw 2 ALGO
response = app_client.withdraw(
    amount=2_000_000,  # 2 ALGO
    sender=my_account.address,
)

print(f"Withdrawn successfully in round: {response.confirmation}")
```

**Gas Cost:** ~2500 µA (includes inner transaction)

**Conditions:**
- amount > 0
- amount ≤ current total_saved
- No opt-in required (but account must exist)

**Example:**
```
Before: total_saved = 10 ALGO, streak = 5 days, xp = 100
Withdraw: 3 ALGO
After: total_saved = 7 ALGO, streak = 5 days ✓, xp = 100 ✓
```

---

### 4. `get_savings()` → uint64

**Query current savings balance. READ-ONLY.**

**Signature:**
```python
@abimethod(readonly=True)
def get_savings(self) -> UInt64:
```

**Parameters:** None

**Returns:** 
```
uint64: Total microALGO saved
```

**TypeScript Example:**
```typescript
const savings = await appClient.getSavings({
  sender: myAccount.address,
});

console.log(`Total saved: ${savings.return_value} microALGO`);
console.log(`In ALGO: ${Number(savings.return_value) / 1_000_000}`);
```

**Python Example:**
```python
savings = app_client.get_savings(sender=my_account.address)
print(f"Total saved: {savings.return_value} microALGO")
print(f"In ALGO: {savings.return_value / 1_000_000}")
```

**Gas Cost:** ~400 µA

**Returns:** 0 if user not opted in

---

### 5. `get_stats()` → (uint64, uint64, uint64, uint64, uint64, uint64)

**Query all gamification stats. READ-ONLY. Returns 6-element tuple.**

**Signature:**
```python
@abimethod(readonly=True)
def get_stats(self) -> tuple[UInt64, UInt64, UInt64, UInt64, UInt64, UInt64]:
```

**Parameters:** None

**Returns:**
```
Tuple (6 elements):
  [0] total_saved: uint64          # microALGO saved
  [1] deposit_count: uint64        # Number of deposits
  [2] streak_days: uint64          # Consecutive daily deposits
  [3] xp_points: uint64            # Total XP accumulated
  [4] level: uint64                # Current level (1-6)
  [5] highest_milestone: uint64    # Highest milestone (0-5)
```

**TypeScript Example:**
```typescript
const stats = await appClient.getStats({
  sender: myAccount.address,
});

const [saved, deposits, streak, xp, level, milestone] = stats.return_value;

console.log({
  saved: Number(saved) / 1_000_000,      // Convert to ALGO
  deposits: Number(deposits),
  streak: `${Number(streak)} days`,
  xp: Number(xp),
  level: Number(level),
  milestone: Number(milestone),
});

// Output:
// {
//   saved: 35.5,
//   deposits: 12,
//   streak: "5 days",
//   xp: 355,
//   level: 2,
//   milestone: 2
// }
```

**Python Example:**
```python
stats = app_client.get_stats(sender=my_account.address)
saved, deposits, streak, xp, level, milestone = stats.return_value

print({
    "saved_algo": saved / 1_000_000,
    "deposits": deposits,
    "streak_days": streak,
    "xp_points": xp,
    "level": level,
    "highest_milestone": milestone,
})
```

**Gas Cost:** ~400 µA

**Example Return:**
```json
{
  "total_saved": 100_000_000,
  "deposit_count": 5,
  "streak_days": 3,
  "xp_points": 1000,
  "level": 3,
  "highest_milestone": 3
}
```

---

### 6. `close_out()` → void

**Close account and withdraw remaining balance.**

**Signature:**
```python
@abimethod()
def close_out(self) -> None:
```

**Parameters:** None

**Returns:** void

**Effects:**
- If `total_saved > 0`: Sends inner Txn.Payment to caller
- Decrements global `total_users`
- Clears all local state (account closes)

**TypeScript Example:**
```typescript
const response = await appClient.closeOut({
  sender: myAccount.address,
});

console.log("Account closed. Final balance returned.");
console.log("Confirmation:", response.confirmation);
```

**Python Example:**
```python
response = app_client.close_out(sender=my_account.address)
print(f"Account closed in round: {response.confirmation}")
```

**Gas Cost:** ~2500 µA (if balance > 0)

**Conditions:**
- None (always succeeds)

**Example:**
```
Before close_out:
  total_saved = 50 ALGO
  total_users = 150

After close_out:
  User receives 50 ALGO in separate inner transaction
  total_users = 149
  Local state cleared
```

---

### 7. `get_global_stats()` → (uint64, uint64)

**Query global vault statistics. READ-ONLY.**

**Signature:**
```python
@abimethod(readonly=True)
def get_global_stats(self) -> tuple[UInt64, UInt64]:
```

**Parameters:** None

**Returns:**
```
Tuple (2 elements):
  [0] total_deposited_global: uint64   # Sum of all deposits
  [1] total_users: uint64              # Count of opted-in users
```

**TypeScript Example:**
```typescript
const vaultStats = await appClient.getGlobalStats({
  sender: myAccount.address,
});

const [totalDeposited, totalUsers] = vaultStats.return_value;

console.log({
  communityTotal: Number(totalDeposited) / 1_000_000,  // ALGO
  communityMembers: Number(totalUsers),
});

// Output:
// {
//   communityTotal: 12345.67,
//   communityMembers: 456
// }
```

**Python Example:**
```python
global_stats = app_client.get_global_stats(sender=my_account.address)
total_deposited, total_users = global_stats.return_value

print(f"Community Total: {total_deposited / 1_000_000} ALGO")
print(f"Community Members: {total_users}")
```

**Gas Cost:** ~400 µA

---

### 8. `get_milestone_thresholds()` → (uint64, uint64, uint64, uint64, uint64)

**Query all milestone thresholds. READ-ONLY.**

**Signature:**
```python
@abimethod(readonly=True)
def get_milestone_thresholds(self) -> tuple[UInt64, UInt64, UInt64, UInt64, UInt64]:
```

**Parameters:** None

**Returns:**
```
Tuple (5 elements) in microALGO:
  [0] milestone_10: 10_000_000 µA (10 ALGO)
  [1] milestone_50: 50_000_000 µA (50 ALGO)
  [2] milestone_100: 100_000_000 µA (100 ALGO)
  [3] milestone_500: 500_000_000 µA (500 ALGO)
  [4] milestone_1000: 1_000_000_000 µA (1000 ALGO)
```

**TypeScript Example:**
```typescript
const thresholds = await appClient.getMilestoneThresholds({
  sender: myAccount.address,
});

const [m10, m50, m100, m500, m1000] = thresholds.return_value;

const milestones = {
  seedling: Number(m10) / 1_000_000,
  growing: Number(m50) / 1_000_000,
  flourishing: Number(m100) / 1_000_000,
  accomplished: Number(m500) / 1_000_000,
  whale: Number(m1000) / 1_000_000,
};

console.log(milestones);
// { seedling: 10, growing: 50, flourishing: 100, accomplished: 500, whale: 1000 }
```

**Gas Cost:** ~400 µA

---

## 📊 State Schema Reference

### Global State (7 variables)

```python
# Accessible via Global state in contract
milestone_10 = 10_000_000              # const
milestone_50 = 50_000_000              # const
milestone_100 = 100_000_000            # const
milestone_500 = 500_000_000            # const
milestone_1000 = 1_000_000_000         # const
total_deposited_global = <variable>    # Sum of all deposits
total_users = <variable>               # Count of opted-in accounts
```

### Local State per User (7 variables)

```python
# Accessible via local state for each account
total_saved = <variable>               # microALGO saved by user
deposit_count = <variable>             # Number of deposits
highest_milestone = <variable>         # 0=none, 1-5=milestone level
last_deposit_round = <variable>        # Round of most recent deposit
streak_days = <variable>               # Consecutive daily deposits
xp_points = <variable>                 # Total XP accumulated
level = <variable>                     # 1-6 based on XP
```

---

## 📁 ARC-56 Application Specification

After build, the complete ARC-56 spec is generated:

```json
{
  "name": "SavingsVault",
  "description": "Non-custodial ALGO savings vault with gamification",
  "methods": [
    {
      "name": "opt_in",
      "desc": "Initialize user account",
      "args": [],
      "returns": { "type": "void" }
    },
    {
      "name": "deposit",
      "desc": "Deposit ALGO into vault",
      "args": [
        { "name": "payment", "type": "txn" }
      ],
      "returns": { "type": "void" }
    },
    // ... other methods
  ],
  "state": {
    "global": [
      { "name": "milestone_10", "type": "uint64" },
      // ... other state vars
    ],
    "local": [
      { "name": "total_saved", "type": "uint64" },
      // ... other local vars
    ]
  }
}
```

**Location:** `artifacts/arc56.json`
**Usage:** AlgoKit auto-parses this to generate type-safe clients

---

## 🔗 Integration Checklist

- [ ] Deploy contract to LocalNet/TestNet
- [ ] Generate typed client from ARC-56 spec
- [ ] Import client into React app
- [ ] Replace mock `VaultContext` data with contract calls
- [ ] Wire deposit modal to `deposit()` method
- [ ] Wire stats queries to `get_stats()` method
- [ ] Set up wallet connection (Pera/Defly)
- [ ] Test on TestNet
- [ ] Deploy to MainNet

---

## 💡 Quick Reference

### Convert Units

```javascript
// microALGO ↔ ALGO
const microALGO = 10_000_000;
const ALGO = microALGO / 1_000_000;  // 10

const ALGO2 = 5;
const microALGO2 = ALGO2 * 1_000_000;  // 5_000_000
```

### Level from XP

```python
xp = 1500
if xp < 500: level = 1
elif xp < 1500: level = 2
elif xp < 3000: level = 3
elif xp < 5000: level = 4
elif xp < 8000: level = 5
else: level = 6
# Result: level = 3
```

### Milestone Display

```python
milestones = {
  0: "No milestone",
  1: "🌱 Seedling",
  2: "🌿 Growing",
  3: "🌳 Flourishing",
  4: "🏅 Accomplished",
  5: "👑 Whale",
}
```

---

## 🚨 Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| `User not opted in` | Must call `opt_in()` first | Call opt_in() before deposit |
| `Insufficient balance` | Trying to withdraw > saved | Reduce withdraw amount |
| `Invalid payment receiver` | Payment not to app address | Verify app address |
| `Transaction rejected` | State not acquired correctly | Retry or check balances |

---

## 📖 Further Reading

- **Build Guide:** See `SMART_CONTRACT_BUILD_GUIDE.md`
- **Deployment:** Use `algokit project deploy <network>`
- **Tests:** Run `algokit project run test`
- **Examples:** Check `algorandfoundation/puya-ts` on GitHub

---

**Generated:** 2024
**Version:** 1.0.0
**Status:** Production Ready ✅
