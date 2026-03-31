import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

const env = import.meta.env;

const algodClient = new algosdk.Algodv2(
  "",
  "https://testnet-api.algonode.cloud",
  443
);
const indexerClient = new algosdk.Indexer(
  "",
  "https://testnet-idx.algonode.cloud",
  443
);

const APP_ID = Number(
  env.VITE_SAVINGS_VAULT_APP_ID || env.REACT_APP_SAVINGS_VAULT_APP_ID || "0"
);

export const peraWallet = new PeraWalletConnect();

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

export interface VaultData {
  totalSaved: number;
  depositCount: number;
  streakDays: number;
  xpPoints: number;
  level: number;
  highestMilestone: number;
}

export interface DepositEntry {
  txnId: string;
  amountAlgo: number;
  timestamp: number;
  round: number;
}

export interface GlobalStats {
  totalDeposited: number;
  totalUsers: number;
}

// ════════════════════════════════════════════════════════════════════
// WALLET FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Connect to Pera Wallet
 */
export async function connectPeraWallet(): Promise<string> {
  try {
    const accounts = await peraWallet.connect();
    return accounts[0];
  } catch (error) {
    // Check if session exists
    const existingAccounts = await peraWallet.reconnectSession();
    if (existingAccounts.length > 0) {
      return existingAccounts[0];
    }
    throw error;
  }
}

/**
 * Disconnect Pera Wallet
 */
export function disconnectWallet(): void {
  peraWallet.disconnect();
}

// ════════════════════════════════════════════════════════════════════
// APP FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Opt user into the SavingsVault app
 */
export async function optInToApp(address: string): Promise<string> {
  try {
    // Check if already opted in
    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do()
      .catch(() => null);

    if (accountInfo) {
      console.log("Already opted into app");
      return "";
    }
  } catch (error) {
    // Ignore "not found" errors when checking
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  suggestedParams.fee = 1000;
  suggestedParams.flatFee = true;

  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    from: address,
    index: APP_ID,
    suggestedParams: suggestedParams,
  });

  const signedTxn = await peraWallet.signTransaction([
    [{ txn: optInTxn, signers: [address] }],
  ]);

  const { txId } = await algodClient
    .sendRawTransaction(signedTxn[0])
    .do();

  // Wait for confirmation
  await algosdk.waitForConfirmation(algodClient, txId, 1000);

  return txId;
}

/**
 * Deposit ALGO into the SavingsVault
 * Creates a grouped transaction: Payment + AppCall
 */
export async function depositALGO(
  address: string,
  amountAlgo: number
): Promise<string> {
  const amountMicroAlgo = amountAlgo * 1_000_000;

  // Get app escrow address
  const accountInfo = await algodClient.getApplicationByID(APP_ID).do();
  const appEscrowAddress = algosdk.getApplicationAddress(APP_ID);

  // Get suggested params
  const suggestedParams = await algodClient.getTransactionParams().do();

  // 1. Payment transaction (user → app)
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: address,
    to: appEscrowAddress,
    amount: amountMicroAlgo,
    suggestedParams: suggestedParams,
  });

  // 2. App call transaction (call deposit method)
  const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
    from: address,
    index: APP_ID,
    onComplete: algosdk.OnComplete.NoOpOC,
    appArgs: [new Uint8Array(Buffer.from("deposit"))],
    foreignAssets: [],
    foreignApps: [],
    accounts: [],
    suggestedParams: suggestedParams,
  });

  // Assign group ID
  const txns = [paymentTxn, appCallTxn];
  const groupID = algosdk.computeGroupID(txns);
  txns.forEach((txn) => {
    txn.group = groupID;
  });

  // Sign both transactions
  const signedTxns = await peraWallet.signTransaction([
    [{ txn: txns[0], signers: [address] }],
    [{ txn: txns[1], signers: [address] }],
  ]);

  // Submit grouped transaction
  const { txId } = await algodClient
    .sendRawTransaction(signedTxns[0])
    .do();

  // Wait for confirmation
  await algosdk.waitForConfirmation(algodClient, txId, 1000);

  return txId;
}

/**
 * Withdraw ALGO from the SavingsVault
 */
export async function withdrawALGO(
  address: string,
  amountAlgo: number
): Promise<string> {
  const amountMicroAlgo = amountAlgo * 1_000_000;

  const suggestedParams = await algodClient.getTransactionParams().do();

  // Build app call transaction for withdraw
  const withdrawTxn = algosdk.makeApplicationCallTxnFromObject({
    from: address,
    index: APP_ID,
    onComplete: algosdk.OnComplete.NoOpOC,
    appArgs: [
      new Uint8Array(Buffer.from("withdraw")),
      algosdk.encodeUint64(amountMicroAlgo),
    ],
    foreignAssets: [],
    foreignApps: [],
    accounts: [],
    suggestedParams: suggestedParams,
  });

  const signedTxn = await peraWallet.signTransaction([
    [{ txn: withdrawTxn, signers: [address] }],
  ]);

  const { txId } = await algodClient
    .sendRawTransaction(signedTxn[0])
    .do();

  // Wait for confirmation
  await algosdk.waitForConfirmation(algodClient, txId, 1000);

  return txId;
}

// ════════════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ════════════════════════════════════════════════════════════════════

/**
 * Parse local state key-value pairs from Algorand response
 */
function parseLocalState(
  keyValues: { key: string; value: { type: number; uint: number } }[]
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const kv of keyValues) {
    // Decode base64 key
    const decodedKey = Buffer.from(kv.key, "base64").toString("utf-8");

    // Get value (type 2 = uint64)
    if (kv.value.type === 2) {
      result[decodedKey] = kv.value.uint;
    }
  }

  return result;
}

/**
 * Get user's vault data (savings, XP, level, streaks, etc.)
 */
export async function getSavingsData(address: string): Promise<VaultData> {
  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do();

    const localState = accountInfo["app-local-state-uint64"] || [];
    const parsed = parseLocalState(localState);

    return {
      totalSaved: (parsed["total_saved"] || 0) / 1_000_000, // Convert to ALGO
      depositCount: parsed["deposit_count"] || 0,
      streakDays: parsed["streak_days"] || 0,
      xpPoints: parsed["xp_points"] || 0,
      level: parsed["level"] || 1,
      highestMilestone: parsed["highest_milestone"] || 0,
    };
  } catch (error) {
    console.error("Error fetching savings data:", error);
    // Return empty data if not opted in
    return {
      totalSaved: 0,
      depositCount: 0,
      streakDays: 0,
      xpPoints: 0,
      level: 1,
      highestMilestone: 0,
    };
  }
}

/**
 * Get user's deposit history
 */
export async function getDepositHistory(
  address: string
): Promise<DepositEntry[]> {
  try {
    const txns = await indexerClient
      .searchForTransactions()
      .address(address)
      .applicationID(APP_ID)
      .do();

    const deposits: DepositEntry[] = [];

    for (const txn of txns.transactions || []) {
      // Check if it's a deposit (app call to deposit method)
      if (
        txn["app-call"] &&
        txn["app-call"]["application-args"] &&
        Buffer.from(txn["app-call"]["application-args"][0], "base64").toString(
          "utf-8"
        ) === "deposit"
      ) {
        // Find associated payment in same group
        const paymentAmount =
          (txn["inner-txns"]?.find((t: any) => t.payment)?.[
            "amount"
          ] as number) || 0;

        deposits.push({
          txnId: txn.id,
          amountAlgo: paymentAmount / 1_000_000,
          timestamp: txn["round-time"]! * 1000,
          round: txn.round,
        });
      }
    }

    return deposits.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    return [];
  }
}

/**
 * Get global vault statistics
 */
export async function getGlobalStats(): Promise<GlobalStats> {
  try {
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();

    const globalState = appInfo["global-state"] || [];
    const parsed = parseLocalState(globalState);

    return {
      totalDeposited: (parsed["total_deposited_global"] || 0) / 1_000_000,
      totalUsers: parsed["total_users"] || 0,
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return {
      totalDeposited: 0,
      totalUsers: 0,
    };
  }
}

/**
 * Get current wallet balance
 */
export async function getWalletBalance(address: string): Promise<number> {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return accountInfo.amount / 1_000_000; // Convert to ALGO
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
}
