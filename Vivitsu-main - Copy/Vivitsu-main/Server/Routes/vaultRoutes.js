import express from "express";
import rateLimit from "express-rate-limit";
import {
  isValidAlgorandAddress,
  getAccountAppInfo,
  parseLocalState,
  getAppGlobalState,
  getAppTransactions,
  getTransaction,
  parseInnerTransactions,
  microAlgoToAlgo,
} from "../lib/algorandServer.js";
import {
  getCached,
  getCacheKeyVaultBalance,
  getCacheKeyVaultHistory,
  getCacheKeyMilestones,
  getCacheKeyLeaderboard,
  getCacheKeyStats,
} from "../lib/cache.js";

const router = express.Router();

// ════════════════════════════════════════════════════════════════
// RATE LIMITING
// ════════════════════════════════════════════════════════════════

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: { error: "Too many requests", code: "RATE_LIMIT_EXCEEDED" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all vault routes
router.use(limiter);

// ════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Validate address parameter
 */
const validateAddressParam = (req, res, next) => {
  const { address } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({
      error: "Address parameter is required",
      code: "MISSING_ADDRESS",
    });
  }

  if (!isValidAlgorandAddress(address)) {
    return res.status(400).json({
      error: "Invalid Algorand address format",
      code: "INVALID_ADDRESS",
    });
  }

  next();
};

/**
 * Error handler wrapper for async routes
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ════════════════════════════════════════════════════════════════
// 1. GET /api/vault/balance?address=xxx
// ════════════════════════════════════════════════════════════════

router.get(
  "/balance",
  validateAddressParam,
  asyncHandler(async (req, res) => {
    const { address } = req.query;
    const appId = Number(process.env.REACT_APP_SAVINGS_VAULT_APP_ID || "0");

    if (appId === 0) {
      return res.status(503).json({
        error: "App ID not configured",
        code: "APP_NOT_CONFIGURED",
      });
    }

    try {
      const cacheKey = getCacheKeyVaultBalance(address);

      const data = await getCached(
        cacheKey,
        async () => {
          const accountInfo = await getAccountAppInfo(address, appId);
          const localState = parseLocalState(
            accountInfo["app-local-state-uint64"] || []
          );

          return {
            totalSaved: microAlgoToAlgo(localState["total_saved"] || 0),
            depositCount: localState["deposit_count"] || 0,
            streakDays: localState["streak_days"] || 0,
            xpPoints: localState["xp_points"] || 0,
            level: localState["level"] || 1,
            highestMilestone: localState["highest_milestone"] || 0,
            lastDepositRound: localState["last_deposit_round"] || 0,
          };
        },
        30 // Cache for 30 seconds
      );

      res.status(200).json(data);
    } catch (error) {
      if (error.message === "Not opted in") {
        return res.status(404).json({
          error: "Address not opted into the vault contract",
          code: "NOT_OPTED_IN",
        });
      }

      if (error.status === 503 || error.message?.includes("timeout")) {
        res.setHeader("Retry-After", "10");
        return res.status(503).json({
          error: "Algorand node temporarily unavailable",
          code: "SERVICE_UNAVAILABLE",
        });
      }

      console.error("Error fetching vault balance:", error);
      res.status(500).json({
        error: "Failed to fetch vault balance",
        code: "FETCH_ERROR",
      });
    }
  })
);

// ════════════════════════════════════════════════════════════════
// 2. GET /api/vault/history?address=xxx&limit=20&offset=0
// ════════════════════════════════════════════════════════════════

router.get(
  "/history",
  validateAddressParam,
  asyncHandler(async (req, res) => {
    const { address, limit = "20", offset = "0" } = req.query;
    const appId = Number(process.env.REACT_APP_SAVINGS_VAULT_APP_ID || "0");

    const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100);
    const offsetNum = Math.max(0, parseInt(offset) || 0);

    if (appId === 0) {
      return res.status(503).json({
        error: "App ID not configured",
        code: "APP_NOT_CONFIGURED",
      });
    }

    try {
      const cacheKey = getCacheKeyVaultHistory(address, limitNum, offsetNum);

      const data = await getCached(
        cacheKey,
        async () => {
          const result = await getAppTransactions(
            appId,
            address,
            limitNum + offsetNum
          );

          const transactions = (result.transactions || []).slice(offsetNum);

          const parsedTxns = transactions
            .filter((txn) => {
              // Only include app calls to "deposit" method
              return (
                txn["app-call-transaction"] &&
                txn["app-call-transaction"]["on-completion"] === "NoOp"
              );
            })
            .map((txn) => {
              const innerAmounts = parseInnerTransactions(txn);
              const amount = innerAmounts.length > 0 ? innerAmounts[0] : 0;

              return {
                txnId: txn.id,
                amountAlgo: amount,
                timestamp: txn["confirmed-round"]
                  ? new Date(
                      txn["confirmed-round"] * 4.5 * 1000 + 1609459200000
                    ).toISOString()
                  : new Date().toISOString(),
                round: txn["confirmed-round"],
                milestoneUnlocked: null, // Would need parse app logs to determine
              };
            })
            .slice(0, limitNum);

          return {
            transactions: parsedTxns,
            total: result.transactions ? result.transactions.length : 0,
          };
        },
        60 // Cache for 60 seconds
      );

      res.status(200).json(data);
    } catch (error) {
      if (error.status === 503 || error.message?.includes("timeout")) {
        res.setHeader("Retry-After", "10");
        return res.status(503).json({
          error: "Algorand node temporarily unavailable",
          code: "SERVICE_UNAVAILABLE",
        });
      }

      console.error("Error fetching transaction history:", error);
      res.status(500).json({
        error: "Failed to fetch transaction history",
        code: "FETCH_ERROR",
      });
    }
  })
);

// ════════════════════════════════════════════════════════════════
// 3. GET /api/vault/milestones?address=xxx
// ════════════════════════════════════════════════════════════════

router.get(
  "/milestones",
  validateAddressParam,
  asyncHandler(async (req, res) => {
    const { address } = req.query;
    const appId = Number(process.env.REACT_APP_SAVINGS_VAULT_APP_ID || "0");

    if (appId === 0) {
      return res.status(503).json({
        error: "App ID not configured",
        code: "APP_NOT_CONFIGURED",
      });
    }

    try {
      const cacheKey = getCacheKeyMilestones(address);

      const data = await getCached(
        cacheKey,
        async () => {
          const accountInfo = await getAccountAppInfo(address, appId);
          const localState = parseLocalState(
            accountInfo["app-local-state-uint64"] || []
          );
          const totalSaved = microAlgoToAlgo(localState["total_saved"] || 0);
          const highestMilestone = localState["highest_milestone"] || 0;

          const milestones = [
            {
              level: 1,
              label: "Seedling",
              threshold: 1,
              xpReward: 100,
              unlocked: totalSaved >= 1,
              unlockedAt: highestMilestone >= 1 ? new Date().toISOString() : null,
            },
            {
              level: 2,
              label: "Saver",
              threshold: 10,
              xpReward: 250,
              unlocked: totalSaved >= 10,
              unlockedAt: highestMilestone >= 2 ? new Date().toISOString() : null,
            },
            {
              level: 3,
              label: "Vault Guard",
              threshold: 50,
              xpReward: 500,
              unlocked: totalSaved >= 50,
              unlockedAt: highestMilestone >= 3 ? new Date().toISOString() : null,
            },
            {
              level: 4,
              label: "Diamond Hands",
              threshold: 100,
              xpReward: 1000,
              unlocked: totalSaved >= 100,
              unlockedAt: highestMilestone >= 4 ? new Date().toISOString() : null,
            },
            {
              level: 5,
              label: "Whale",
              threshold: 500,
              xpReward: 2500,
              unlocked: totalSaved >= 500,
              unlockedAt: highestMilestone >= 5 ? new Date().toISOString() : null,
            },
          ];

          return { milestones };
        },
        30 // Cache for 30 seconds
      );

      res.status(200).json(data);
    } catch (error) {
      if (error.message === "Not opted in") {
        return res.status(404).json({
          error: "Address not opted into the vault contract",
          code: "NOT_OPTED_IN",
        });
      }

      if (error.status === 503 || error.message?.includes("timeout")) {
        res.setHeader("Retry-After", "10");
        return res.status(503).json({
          error: "Algorand node temporarily unavailable",
          code: "SERVICE_UNAVAILABLE",
        });
      }

      console.error("Error fetching milestones:", error);
      res.status(500).json({
        error: "Failed to fetch milestones",
        code: "FETCH_ERROR",
      });
    }
  })
);

// ════════════════════════════════════════════════════════════════
// 4. GET /api/vault/leaderboard?limit=20
// ════════════════════════════════════════════════════════════════

router.get(
  "/leaderboard",
  asyncHandler(async (req, res) => {
    const { limit = "20" } = req.query;
    const appId = Number(process.env.REACT_APP_SAVINGS_VAULT_APP_ID || "0");

    const limitNum = Math.min(Math.max(1, parseInt(limit) || 20), 100);

    if (appId === 0) {
      return res.status(503).json({
        error: "App ID not configured",
        code: "APP_NOT_CONFIGURED",
      });
    }

    try {
      const cacheKey = getCacheKeyLeaderboard(limitNum);

      const data = await getCached(
        cacheKey,
        async () => {
          // Query all transactions for the app
          const result = await getAppTransactions(appId, undefined, 1000);

          // Build user map of total saved
          const userMap = new Map();

          let rank = 1;

          // This is a simplified approach - in production, would query app global state
          // or maintain a leaderboard table in MongoDB
          for (const txn of result.transactions || []) {
            const sender = txn.sender;
            if (!sender || userMap.size >= limitNum) {
              continue;
            }

            if (!userMap.has(sender)) {
              const innerAmounts = parseInnerTransactions(txn);
              const amount = innerAmounts.length > 0 ? innerAmounts[0] : 0;

              userMap.set(sender, {
                rank: rank++,
                address: `${sender.slice(0, 6)}...${sender.slice(-6)}`,
                totalSaved: amount,
                streakDays: 0,
                level: 1,
                badge: "Seedling",
              });
            }
          }

          const rankings = Array.from(userMap.values()).slice(0, limitNum);

          // Calculate community total
          const communityTotal = rankings.reduce(
            (acc, user) => acc + user.totalSaved,
            0
          );

          return {
            rankings,
            communityTotal,
          };
        },
        300 // Cache for 5 minutes
      );

      res.status(200).json(data);
    } catch (error) {
      if (error.status === 503 || error.message?.includes("timeout")) {
        res.setHeader("Retry-After", "10");
        return res.status(503).json({
          error: "Algorand node temporarily unavailable",
          code: "SERVICE_UNAVAILABLE",
        });
      }

      console.error("Error fetching leaderboard:", error);
      res.status(500).json({
        error: "Failed to fetch leaderboard",
        code: "FETCH_ERROR",
      });
    }
  })
);

// ════════════════════════════════════════════════════════════════
// 5. GET /api/vault/stats
// ════════════════════════════════════════════════════════════════

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const appId = Number(process.env.REACT_APP_SAVINGS_VAULT_APP_ID || "0");

    if (appId === 0) {
      return res.status(503).json({
        error: "App ID not configured",
        code: "APP_NOT_CONFIGURED",
      });
    }

    try {
      const cacheKey = getCacheKeyStats();

      const data = await getCached(
        cacheKey,
        async () => {
          // Get global state
          const globalState = await getAppGlobalState(appId);
          const parsed = parseLocalState(globalState);

          const totalDeposited = microAlgoToAlgo(
            parsed["total_deposited"] || 0
          );
          const totalUsers = parsed["total_users"] || 0;

          const communityGoal = 1_000_000; // 1M ALGO mock goal
          const communityProgress = Math.round(
            (totalDeposited / communityGoal) * 100
          );

          return {
            totalDeposited,
            totalUsers,
            communityGoal,
            communityProgress,
          };
        },
        60 // Cache for 60 seconds
      );

      res.status(200).json(data);
    } catch (error) {
      if (error.status === 503 || error.message?.includes("timeout")) {
        res.setHeader("Retry-After", "10");
        return res.status(503).json({
          error: "Algorand node temporarily unavailable",
          code: "SERVICE_UNAVAILABLE",
        });
      }

      console.error("Error fetching stats:", error);
      res.status(500).json({
        error: "Failed to fetch statistics",
        code: "FETCH_ERROR",
      });
    }
  })
);

// ════════════════════════════════════════════════════════════════
// 6. POST /api/vault/verify-txn
// ════════════════════════════════════════════════════════════════

router.post(
  "/verify-txn",
  asyncHandler(async (req, res) => {
    const { txnId } = req.body;

    if (!txnId || typeof txnId !== "string") {
      return res.status(400).json({
        error: "Transaction ID (txnId) is required",
        code: "MISSING_TXN_ID",
      });
    }

    try {
      const txn = await getTransaction(txnId);

      const innerAmounts = parseInnerTransactions(txn);
      const amount = innerAmounts.length > 0 ? innerAmounts[0] : 0;

      res.status(200).json({
        confirmed: true,
        round: txn["confirmed-round"],
        amount,
      });
    } catch (error) {
      if (error.message === "Transaction not found") {
        return res.status(404).json({
          error: "Transaction not found or not yet confirmed",
          code: "TXN_NOT_FOUND",
        });
      }

      if (error.status === 503 || error.message?.includes("timeout")) {
        res.setHeader("Retry-After", "10");
        return res.status(503).json({
          error: "Algorand node temporarily unavailable",
          code: "SERVICE_UNAVAILABLE",
        });
      }

      console.error("Error verifying transaction:", error);
      res.status(500).json({
        error: "Failed to verify transaction",
        code: "FETCH_ERROR",
      });
    }
  })
);

// ════════════════════════════════════════════════════════════════
// ERROR HANDLER
// ════════════════════════════════════════════════════════════════

router.use((error, req, res, next) => {
  console.error("Vault API error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
});

export default router;
