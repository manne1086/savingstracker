import algosdk from "algosdk";

/**
 * Server-side Algorand clients (Node.js, not browser)
 * Configured for TestNet with AlgoNode endpoints
 */

const TESTNET_ALGOD_URL = "https://testnet-api.algonode.cloud";
const TESTNET_INDEXER_URL = "https://testnet-idx.algonode.cloud";

// Algod client for transaction signing, sending, and account queries
export const algodClient = new algosdk.Algodv2(
  "", // empty token for public node
  TESTNET_ALGOD_URL,
  443
);

// Indexer client for transaction history and state queries
export const indexerClient = new algosdk.Indexer(
  "", // empty token for public node
  TESTNET_INDEXER_URL,
  443
);

/**
 * Validate Algorand address format
 */
export const isValidAlgorandAddress = (address) => {
  if (!address || typeof address !== "string") {
    return false;
  }
  try {
    algosdk.decodeAddress(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Get account info including local state for contract
 */
export const getAccountAppInfo = async (address, appId) => {
  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(address, appId)
      .do();
    return accountInfo;
  } catch (error) {
    if (error.status === 404) {
      throw new Error("Not opted in");
    }
    throw error;
  }
};

/**
 * Parse local state from Algorand response
 * Converts base64 keys to UTF-8 and extracts uint64 values
 */
export const parseLocalState = (keyValues) => {
  const parsed = {};

  if (!keyValues || !Array.isArray(keyValues)) {
    return parsed;
  }

  keyValues.forEach((kv) => {
    try {
      // Decode base64 key to UTF-8
      const key = Buffer.from(kv.key, "base64").toString("utf-8");

      // Extract uint64 value (type 2)
      if (kv.value && kv.value.type === 2) {
        parsed[key] = kv.value.uint;
      }
    } catch (error) {
      console.error("Error parsing state entry:", error);
    }
  });

  return parsed;
};

/**
 * Get global state from app
 */
export const getAppGlobalState = async (appId) => {
  try {
    const appInfo = await algodClient.getApplicationByID(appId).do();
    return appInfo["params"]["global-state"] || [];
  } catch (error) {
    console.error("Error fetching global state:", error);
    throw error;
  }
};

/**
 * Get transactions for an app call (deposits)
 */
export const getAppTransactions = async (
  appId,
  address,
  limit = 100,
  nextToken
) => {
  try {
    let query = indexerClient
      .searchForTransactions()
      .applicationID(appId)
      .txType("appl"); // app call transactions

    if (address) {
      query = query.address(address);
    }

    query = query.limit(limit);

    if (nextToken) {
      query = query.nextToken(nextToken);
    }

    // Sort by round descending (newest first)
    query = query.sort("desc");

    const result = await query.do();
    return result;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    throw error;
  }
};

/**
 * Get transaction by ID
 */
export const getTransaction = async (txnId) => {
  try {
    const result = await indexerClient
      .searchForTransactions()
      .txID(txnId)
      .do();

    if (result.transactions && result.transactions.length > 0) {
      return result.transactions[0];
    }

    throw new Error("Transaction not found");
  } catch (error) {
    console.error("Error fetching transaction:", error);
    throw error;
  }
};

/**
 * Parse inner transactions from app call
 * Returns payment amounts from inner transactions
 */
export const parseInnerTransactions = (txn) => {
  const amounts = [];

  if (txn["inner-txns"] && Array.isArray(txn["inner-txns"])) {
    txn["inner-txns"].forEach((innerTxn) => {
      // Look for payment transactions
      if (innerTxn["tx-type"] === "pay" && innerTxn.amount) {
        // Convert microALGO to ALGO
        amounts.push(innerTxn.amount / 1_000_000);
      }
    });
  }

  return amounts;
};

/**
 * Convert microALGO to ALGO
 */
export const microAlgoToAlgo = (microAlgo) => {
  return microAlgo / 1_000_000;
};

/**
 * Convert ALGO to microALGO
 */
export const algoToMicroAlgo = (algo) => {
  return Math.round(algo * 1_000_000);
};

/**
 * Get account balance in ALGO
 */
export const getAccountBalance = async (address) => {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return microAlgoToAlgo(accountInfo.amount);
  } catch (error) {
    console.error("Error fetching account balance:", error);
    throw error;
  }
};
