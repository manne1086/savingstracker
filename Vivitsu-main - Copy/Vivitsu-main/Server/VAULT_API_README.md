# SavingsVault Backend API

Caching + indexing layer for the SavingsVault smart contract. Runs on Express.js (Node.js) in the backend server.

## Architecture

```
Frontend (React)
    ↓ HTTP requests
Browser SDK (algosdk, Pera Wallet)
    ↓ transactions
Algorand TestNet (blockchain)

Frontend (React)
    ↓ HTTP requests
Backend API (Express.js + Node.js)
    ↓ cached queries
Algorand TestNet (indexer, algod)
```

## What It Does

- **Caches** responses for 30-300 seconds (configurable per endpoint)
- **Indexes** smart contract state without holding funds or private keys
- **Queries** Algorand TestNet via AlgoNode public endpoints
- **Rate limits** to 100 requests/minute per IP
- **Returns** consistent error format with error codes

## Files Created

```
Server/
  lib/
    cache.js              - Node-cache wrapper with TTL support
    algorandServer.js     - Server-side Algorand clients + helpers
  Routes/
    vaultRoutes.js        - All 6 API endpoints

Client/
  src/
    lib/
      vaultAPI.js         - Frontend API client library
  .env.local              - Added REACT_APP_API_BASE_URL
```

## API Endpoints

All endpoints are under `/api/vault/`

### 1. GET /api/vault/balance?address=xxx

Get vault savings balance for an address.

**Query Parameters:**
- `address` (required, string): Algorand address

**Response:**
```json
{
  "totalSaved": 42.5,           // ALGO
  "depositCount": 8,
  "streakDays": 3,
  "xpPoints": 1250,
  "level": 2,
  "highestMilestone": 2,
  "lastDepositRound": 34512345
}
```

**Cache:** 30 seconds per address

**Example:**
```bash
curl "http://localhost:3000/api/vault/balance?address=AAAAA...ZZZZZ"
```

---

### 2. GET /api/vault/history?address=xxx&limit=20&offset=0

Get deposit transaction history for an address.

**Query Parameters:**
- `address` (required, string): Algorand address
- `limit` (optional, number): Max results, 1-100, default 20
- `offset` (optional, number): Pagination offset, default 0

**Response:**
```json
{
  "transactions": [
    {
      "txnId": "TXID123...",
      "amountAlgo": 10,
      "timestamp": "2024-03-31T14:30:00.000Z",
      "round": 34512345,
      "milestoneUnlocked": null
    },
    // ...
  ],
  "total": 8
}
```

**Cache:** 60 seconds per (address, limit, offset)

**Example:**
```bash
curl "http://localhost:3000/api/vault/history?address=AAAAA...ZZZZZ&limit=10&offset=0"
```

---

### 3. GET /api/vault/milestones?address=xxx

Get milestone achievement data for an address.

**Query Parameters:**
- `address` (required, string): Algorand address

**Response:**
```json
{
  "milestones": [
    {
      "level": 1,
      "label": "Seedling",
      "threshold": 1,
      "xpReward": 100,
      "unlocked": true,
      "unlockedAt": "2024-03-15T10:00:00.000Z"
    },
    {
      "level": 2,
      "label": "Saver",
      "threshold": 10,
      "xpReward": 250,
      "unlocked": true,
      "unlockedAt": "2024-03-25T12:30:00.000Z"
    },
    {
      "level": 3,
      "label": "Vault Guard",
      "threshold": 50,
      "xpReward": 500,
      "unlocked": false,
      "unlockedAt": null
    },
    {
      "level": 4,
      "label": "Diamond Hands",
      "threshold": 100,
      "xpReward": 1000,
      "unlocked": false,
      "unlockedAt": null
    },
    {
      "level": 5,
      "label": "Whale",
      "threshold": 500,
      "xpReward": 2500,
      "unlocked": false,
      "unlockedAt": null
    }
  ]
}
```

**Cache:** 30 seconds per address

**Example:**
```bash
curl "http://localhost:3000/api/vault/milestones?address=AAAAA...ZZZZZ"
```

---

### 4. GET /api/vault/leaderboard?limit=20

Get top savers leaderboard.

**Query Parameters:**
- `limit` (optional, number): Max results, 1-100, default 20

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "address": "AAAAA...ZZZZZ",    // truncated
      "totalSaved": 542.5,
      "streakDays": 15,
      "level": 5,
      "badge": "Whale"
    },
    {
      "rank": 2,
      "address": "BBBBB...YYYYY",
      "totalSaved": 325,
      "streakDays": 8,
      "level": 3,
      "badge": "Vault Guard"
    },
    // ...
  ],
  "communityTotal": 12450.75
}
```

**Cache:** 5 minutes

**Example:**
```bash
curl "http://localhost:3000/api/vault/leaderboard?limit=10"
```

---

### 5. GET /api/vault/stats

Get community statistics.

**Response:**
```json
{
  "totalDeposited": 12450.75,    // Total ALGO deposited
  "totalUsers": 45,              // Total addresses opted in
  "communityGoal": 1000000,      // Target (1M ALGO)
  "communityProgress": 1         // Percentage (1%)
}
```

**Cache:** 60 seconds

**Example:**
```bash
curl "http://localhost:3000/api/vault/stats"
```

---

### 6. POST /api/vault/verify-txn

Verify a transaction was confirmed on-chain.

**Body:**
```json
{
  "txnId": "TXID123..."
}
```

**Response:**
```json
{
  "confirmed": true,
  "round": 34512345,
  "amount": 10               // ALGO
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/vault/verify-txn \
  -H "Content-Type: application/json" \
  -d '{"txnId": "TXID123..."}'
```

---

## Error Handling

All errors return consistent format:

```json
{
  "error": "Human-readable message",
  "code": "ERROR_CODE"
}
```

### Common Errors

**400 - Invalid Input**
```json
{
  "error": "Invalid Algorand address format",
  "code": "INVALID_ADDRESS"
}
```

**404 - Not Opted In**
```json
{
  "error": "Address not opted into the vault contract",
  "code": "NOT_OPTED_IN"
}
```

**429 - Rate Limited**
```json
{
  "error": "Too many requests",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**503 - Service Unavailable**
```json
{
  "error": "Algorand node temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE"
}
```
(Includes `Retry-After: 10` header)

---

## Environment Variables

### Server (.env)

```bash
# Server port
PORT=3000

# Node environment
NODE_ENV=development

# Smart contract App ID (same as client)
REACT_APP_SAVINGS_VAULT_APP_ID=12345
```

### Client (.env.local)

```bash
# Backend API
REACT_APP_API_BASE_URL=http://localhost:3000

# Smart contract
REACT_APP_SAVINGS_VAULT_APP_ID=12345
```

---

## Rate Limiting

- **100 requests per minute** per IP address
- Returns 429 status if exceeded
- Applies to all vault routes

To adjust, edit `Server/Routes/vaultRoutes.js`:
```js
const limiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max: 100,             // requests per window
  // ...
});
```

---

## Caching Strategy

| Endpoint | TTL | Key |
|----------|-----|-----|
| `/balance` | 30s | `vault:balance:{address}` |
| `/history` | 60s | `vault:history:{address}:{limit}:{offset}` |
| `/milestones` | 30s | `vault:milestones:{address}` |
| `/leaderboard` | 300s (5m) | `vault:leaderboard:{limit}` |
| `/stats` | 60s | `vault:stats` |
| `/verify-txn` | none | (real-time queries) |

Cache is cleared automatically when TTL expires. No manual invalidation needed for normal usage.

---

## Running the Backend

**Development:**
```bash
cd Server
npm run dev
```
Starts at `http://localhost:3000`

**Production:**
```bash
cd Server
npm start
```

---

## Frontend Integration

Use the `vaultAPI` client library:

```javascript
import { vaultAPI } from '@/lib/vaultAPI';

// Get balance
const balance = await vaultAPI.getVaultBalance(address);
console.log('ALGO saved:', balance.totalSaved);

// Get history
const history = await vaultAPI.getDepositHistory(address, 20, 0);

// Get stats
const stats = await vaultAPI.getVaultStats();
console.log('Community saved:', stats.totalDeposited, 'ALGO');
```

---

## Security Notes

✅ **Safe:**
- No funds stored on backend
- No private keys stored
- Read-only queries to blockchain
- Public endpoints (AlgoNode)
- Rate limiting enabled
- Address format validation

❌ **NOT Safe (don't do it):**
- Storing private keys
- Storing wallet mnemonics
- Signing transactions server-side
- Trusting unvalidated addresses

---

## Troubleshooting

**"App ID not configured"**
- Set `REACT_APP_SAVINGS_VAULT_APP_ID` in `/Server/.env`

**"Algorand node temporarily unavailable"**
- AlgoNode is down (rare)
- Try again in 10 seconds
- Can switch to local node by updating `TESTNET_ALGOD_URL`

**"Address not opted in"**
- Address hasn't called opt-in method yet
- User needs to call `optInToApp()` from frontend first

**High latency on first query**
- First query hits Algorand node (no cache)
- Subsequent queries use cache (fast)
- Normal behavior

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│    SavingsVault Frontend (React)    │
│  - Wallet connection (Pera)         │
│  - useWallet() context              │
│  - DepositModal, Dashboard, etc     │
└────────────┬────────────────────────┘
             │
             │ HTTP requests
             │ src/lib/vaultAPI.js
             ▼
┌─────────────────────────────────────┐
│    SavingsVault Backend (Express)   │
│  - Rate limiting (100/min)          │
│  - Routes: /api/vault/*             │
│  - Cache layer (node-cache)         │
└────────────┬────────────────────────┘
             │
             │ Query (cached)
             │ lib/algorandServer.js
             ▼
┌─────────────────────────────────────┐
│   Algorand TestNet (AlgoNode)       │
│  - Indexer (history, state)         │
│  - Algod (balance, transactions)    │
│  - Public, no auth required         │
└─────────────────────────────────────┘
```

---

## Files

- **Server/lib/cache.js** - Node-cache wrapper with TTL support
- **Server/lib/algorandServer.js** - Algorand clients + helper functions
- **Server/Routes/vaultRoutes.js** - All 6 API endpoints + error handling
- **Client/src/lib/vaultAPI.js** - Frontend HTTP client
- **Server/index.js** - Registers routes with Express

All files are production-ready with error handling, logging, and documentation.
