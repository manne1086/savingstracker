import * as algosdk from "algosdk";

/**
 * Server-side Algorand clients for SavingsVault API
 * These run on Node.js (not browser) - no Pera Wallet needed
 */

const TESTNET_ALGOD_URL = "https://testnet-api.algonode.cloud";
const TESTNET_INDEXER_URL = "https://testnet-idx.algonode.cloud";

/**
 * Algod client (Node) for account info, state reads
 */
export const algodClient = new algosdk.Algodv2("", TESTNET_ALGOD_URL, 443);

/**
 * Indexer client (Node) for transaction history queries
 */
export const indexerClient = new algosdk.Indexer(
  "",
  TESTNET_INDEXER_URL,
  443
);

// Get App ID from environment
export const APP_ID = Number(process.env.REACT_APP_SAVINGS_VAULT_APP_ID || "0");

/**
 * Validate Algorand address format
 */
export function isValidAddress(address: string): boolean {
  try {
    // Algorand addresses are 58 characters, base32 encoded
    if (address.length !== 58) return false;
    // Try to decode - will throw if invalid
    algosdk.decodeAddress(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse local state values from account info response
 * Decodes base64 keys and extracts uint64 values
 */
export function parseLocalState(
  keyValues?: Record<string, unknown>[]
): Record<string, number> {
  if (!keyValues) return {};

  const result: Record<string, number> = {};

  keyValues.forEach((item: any) => {
    let key: string;
    try {
      // Decode base64 key to UTF-8
      if (typeof item.key === "string") {
        key = Buffer.from(item.key, "base64").toString("utf-8");
      } else {
        return;
      }
    } catch {
      return;
    }

    // Extract value if it's a uint (type 2)
    if (item.value && item.value.type === 2) {
      result[key] = item.value.uint;
    }
  });

  return result;
}

/**
 * Convert microALGO to ALGO
 */
export function microAlgoToAlgo(microAlgo: number): number {
  return microAlgo / 1_000_000;
}

/**
 * Convert ALGO to microALGO
 */
export function algoToMicroAlgo(algo: number): number {
  return Math.floor(algo * 1_000_000);
}

/**
 * Get account local state for an app
 * Returns parsed key-value pairs from local state
 */
export async function getAccountLocalState(
  address: string
): Promise<Record<string, number>> {
  try {
    if (!isValidAddress(address)) {
      throw new Error("Invalid Algorand address format");
    }

    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do();

    if (!accountInfo["app-local-state"]) {
      throw new Error("Not opted in");
    }

    // Extract key-value pairs
    const kvPairs = accountInfo["app-local-state"][0].["key-value"] || [];
    return parseLocalState(kvPairs);
  } catch (error: any) {
    if (error.message === "Not opted in") {
      throw error;
    }

    // Handle indexer not found errors
    if (error.status === 404) {
      throw new Error("Account not found or not opted in");
    }

    throw error;
  }
}

/**
 * Get account global state from contract
 */
export async function getGlobalState(): Promise<Record<string, number>> {
  try {
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();

    if (!appInfo.params["global-state"]) {
      return {};
    }

    const kvPairs = appInfo.params["global-state"] || [];
    return parseLocalState(kvPairs);
  } catch (error) {
    console.error("Error fetching global state:", error);
    throw error;
  }
}

/**
 * Get account balance in ALGO
 */
export async function getAccountBalance(address: string): Promise<number> {
  try {
    if (!isValidAddress(address)) {
      throw new Error("Invalid Algorand address format");
    }

    const accountInfo = await algodClient.accountInformation(address).do();
    return microAlgoToAlgo(accountInfo.amount);
  } catch (error) {
    console.error("Error fetching account balance:", error);
    throw error;
  }
}

/**
 * Verify a transaction was confirmed on-chain
 */
export async function verifyTransaction(
  txnId: string
): Promise<{ confirmed: boolean; round: number; amount: number }> {
  try {
    const txn = await indexerClient.transactionLookup(txnId).do();

    if (!txn.transaction) {
      return { confirmed: false, round: 0, amount: 0 };
    }

    const paymentTxn = txn.transaction as any;
    const amount = paymentTxn.payment?.amount
      ? microAlgoToAlgo(paymentTxn.payment.amount)
      : 0;

    return {
      confirmed: true,
      round: txn.transaction["confirmed-round"] || 0,
      amount,
    };
  } catch (error) {
    console.error("Error verifying transaction:", error);
    return { confirmed: false, round: 0, amount: 0 };
  }
}

/**
 * Search for all transactions involving the app
 * Used for leaderboard, history queries
 */
export async function queryAppTransactions(
  limit: number = 100,
  nextToken?: string
) {
  try {
    let query = indexerClient
      .searchForTransactions()
      .applicationID(APP_ID)
      .limit(limit)
      .txType("appl");

    if (nextToken) {
      query = query.nextToken(nextToken);
    }

    return await query.do();
  } catch (error) {
    console.error("Error querying app transactions:", error);
    throw error;
  }
}
