import algosdk from "algosdk";
import { PeraWalletConnect } from "@perawallet/connect";

const env = import.meta.env;
const textDecoder = new TextDecoder();

const DEFAULT_NETWORK = String(
  env.VITE_NETWORK || env.REACT_APP_NETWORK || "testnet"
).toLowerCase();
const LOCALNET_ALGOD_TOKEN =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const NETWORK_DEFAULTS = {
  localnet: {
    algodUrl: "http://localhost:4001",
    indexerUrl: "http://localhost:8980",
    algodToken: LOCALNET_ALGOD_TOKEN,
    peraChainId: 4160,
    label: "LocalNet",
  },
  testnet: {
    algodUrl: "https://testnet-api.algonode.cloud",
    indexerUrl: "https://testnet-idx.algonode.cloud",
    algodToken: "",
    peraChainId: 416002,
    label: "TestNet",
  },
  mainnet: {
    algodUrl: "https://mainnet-api.algonode.cloud",
    indexerUrl: "https://mainnet-idx.algonode.cloud",
    algodToken: "",
    peraChainId: 416001,
    label: "MainNet",
  },
} as const;
const DEFAULT_CONFIRMATION_WAIT_ROUNDS = Number(
  env.VITE_CONFIRMATION_WAIT_ROUNDS ||
    env.REACT_APP_CONFIRMATION_WAIT_ROUNDS ||
    "8"
);
const DEFAULT_CONFIRMATION_TIMEOUT_MS = Number(
  env.VITE_CONFIRMATION_TIMEOUT_MS ||
    env.REACT_APP_CONFIRMATION_TIMEOUT_MS ||
    "20000"
);
const CONFIRMATION_POLL_INTERVAL_MS = 750;

const activeNetwork =
  NETWORK_DEFAULTS[DEFAULT_NETWORK as keyof typeof NETWORK_DEFAULTS] ??
  NETWORK_DEFAULTS.testnet;
const algodUrl =
  env.VITE_ALGOD_URL || env.REACT_APP_ALGOD_URL || activeNetwork.algodUrl;
const indexerUrl =
  env.VITE_INDEXER_URL || env.REACT_APP_INDEXER_URL || activeNetwork.indexerUrl;

export interface VaultData {
  isOptedIn: boolean;
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

type ParsedEndpoint = {
  server: string;
  port: number;
  isLocalNet: boolean;
};

type TealStateEntry = {
  key: Uint8Array;
  value: {
    type: number;
    uint?: bigint | number | null;
  };
};

function isLocalEndpoint(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return url.includes("localhost") || url.includes("127.0.0.1");
  }
}

function parseEndpoint(url: string, defaultPort: number): ParsedEndpoint {
  try {
    const parsed = new URL(url);
    return {
      server: `${parsed.protocol}//${parsed.hostname}`,
      port:
        parsed.port === "" ? defaultPort : Number.parseInt(parsed.port, 10),
      isLocalNet: isLocalEndpoint(url),
    };
  } catch {
    return {
      server: "http://localhost",
      port: defaultPort,
      isLocalNet: true,
    };
  }
}

function toSafeNumber(value?: bigint | number | null) {
  if (typeof value === "bigint") {
    return Number(
      value > BigInt(Number.MAX_SAFE_INTEGER)
        ? BigInt(Number.MAX_SAFE_INTEGER)
        : value
    );
  }

  return typeof value === "number" ? value : 0;
}

function parseState(keyValues?: TealStateEntry[]) {
  const parsed: Record<string, number> = {};

  for (const entry of keyValues ?? []) {
    if (entry.value.type !== 2) {
      continue;
    }

    parsed[textDecoder.decode(entry.key)] = toSafeNumber(entry.value.uint);
  }

  return parsed;
}

const algodEndpoint = parseEndpoint(algodUrl, 4001);
const indexerEndpoint = parseEndpoint(indexerUrl, 8980);
const algodToken =
  env.VITE_ALGOD_TOKEN ||
  env.REACT_APP_ALGOD_TOKEN ||
  (algodEndpoint.isLocalNet ? LOCALNET_ALGOD_TOKEN : activeNetwork.algodToken);
const indexerToken =
  env.VITE_INDEXER_TOKEN || env.REACT_APP_INDEXER_TOKEN || "";
const APP_ID = Number(
  env.VITE_SAVINGS_VAULT_APP_ID || env.REACT_APP_SAVINGS_VAULT_APP_ID || "0"
);
const PERA_CHAIN_ID = Number(
  env.VITE_PERA_CHAIN_ID ||
    env.REACT_APP_PERA_CHAIN_ID ||
    activeNetwork.peraChainId
) as 4160 | 416001 | 416002 | 416003;

console.log("Connecting to Algorand:", {
  network: activeNetwork.label,
  algodUrl,
  indexerUrl,
  appId: APP_ID,
  isLocalNet: algodEndpoint.isLocalNet,
  peraChainId: PERA_CHAIN_ID,
});

const algodClient = new algosdk.Algodv2(
  algodToken,
  algodEndpoint.server,
  algodEndpoint.port
);
const indexerClient = new algosdk.Indexer(
  indexerToken,
  indexerEndpoint.server,
  indexerEndpoint.port
);

export const peraWallet = new PeraWalletConnect({ chainId: PERA_CHAIN_ID });

const DEPOSIT_METHOD_SELECTOR = algosdk.ABIMethod.fromSignature(
  "deposit(pay)void"
).getSelector();
const WITHDRAW_METHOD_SELECTOR = algosdk.ABIMethod.fromSignature(
  "withdraw(uint64)void"
).getSelector();

function ensureAppConfigured() {
  if (!APP_ID || APP_ID <= 0) {
    throw new Error(
      `Savings Vault app ID is missing for ${activeNetwork.label}. Set VITE_SAVINGS_VAULT_APP_ID to your deployed ${activeNetwork.label} app ID and restart the frontend.`
    );
  }
}

export function isVaultAppConfigured() {
  return APP_ID > 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForTxnConfirmation(txId: string) {
  if (!algodEndpoint.isLocalNet) {
    return algosdk.waitForConfirmation(
      algodClient,
      txId,
      DEFAULT_CONFIRMATION_WAIT_ROUNDS
    );
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < DEFAULT_CONFIRMATION_TIMEOUT_MS) {
    try {
      const pendingTxn = await algodClient.pendingTransactionInformation(txId).do();
      const confirmedRound = toSafeNumber(
        pendingTxn.confirmedRound ?? pendingTxn["confirmed-round"] ?? 0
      );

      if (confirmedRound > 0) {
        return pendingTxn;
      }

      const poolError = pendingTxn.poolError ?? pendingTxn["pool-error"];
      if (typeof poolError === "string" && poolError.length > 0) {
        throw new Error(poolError);
      }
    } catch (error) {
      if (
        !(error instanceof Error) ||
        (!error.message.includes("Not Found") &&
          !error.message.includes("pending transaction"))
      ) {
        throw error;
      }
    }

    await sleep(CONFIRMATION_POLL_INTERVAL_MS);
  }

  throw new Error(
    `Transaction confirmation timed out after ${Math.round(
      DEFAULT_CONFIRMATION_TIMEOUT_MS / 1000
    )} seconds. If this keeps happening, restart LocalNet with \`algokit localnet reset\` and try again.`
  );
}

function emptyVaultData(): VaultData {
  return {
    isOptedIn: false,
    totalSaved: 0,
    depositCount: 0,
    streakDays: 0,
    xpPoints: 0,
    level: 1,
    highestMilestone: 0,
  };
}

function emptyGlobalStats(): GlobalStats {
  return {
    totalDeposited: 0,
    totalUsers: 0,
  };
}

export async function connectPeraWallet(): Promise<string> {
  try {
    const accounts = await peraWallet.connect();
    return accounts[0];
  } catch (error) {
    const existingAccounts = await peraWallet.reconnectSession();
    if (existingAccounts.length > 0) {
      return existingAccounts[0];
    }
    throw error;
  }
}

export function disconnectWallet(): void {
  peraWallet.disconnect();
}

export async function optInToApp(address: string): Promise<string> {
  ensureAppConfigured();

  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do()
      .catch(() => null);

    if (accountInfo) {
      return "";
    }
  } catch {
    // Ignore the lookup failure here; the transaction will be attempted below.
  }

  const suggestedParams = await algodClient.getTransactionParams().do();
  suggestedParams.fee = 1000n;
  suggestedParams.flatFee = true;

  const optInTxn = algosdk.makeApplicationOptInTxnFromObject({
    sender: address,
    appIndex: APP_ID,
    suggestedParams,
  });

  const signedTxn = await peraWallet.signTransaction([
    [{ txn: optInTxn, signers: [address] }],
  ]);

  const { txId } = await algodClient.sendRawTransaction(signedTxn[0]).do();
  await waitForTxnConfirmation(txId);

  return txId;
}

export async function depositALGO(
  address: string,
  amountAlgo: number
): Promise<string> {
  try {
    ensureAppConfigured();
    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do()
      .catch(() => null);

    if (!accountInfo) {
      throw new Error(
        "Activate your vault in Pera before making your first deposit."
      );
    }

    const amountMicroAlgo = BigInt(Math.round(amountAlgo * 1_000_000));
    const appEscrowAddress = algosdk.getApplicationAddress(APP_ID);
    const suggestedParams = await algodClient.getTransactionParams().do();

    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      sender: address,
      receiver: appEscrowAddress,
      amount: amountMicroAlgo,
      suggestedParams,
    });

    const appCallTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: address,
      appIndex: APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [DEPOSIT_METHOD_SELECTOR],
      suggestedParams,
    });

    const txns = [paymentTxn, appCallTxn];
    const groupID = algosdk.computeGroupID(txns);
    txns.forEach((txn) => {
      txn.group = groupID;
    });

    const signedTxns = await peraWallet.signTransaction([
      [
        { txn: txns[0], signers: [address] },
        { txn: txns[1], signers: [address] },
      ],
    ]);

    const combined = new Uint8Array(
      signedTxns[0].length + signedTxns[1].length
    );
    combined.set(signedTxns[0], 0);
    combined.set(signedTxns[1], signedTxns[0].length);

    const { txId } = await algodClient.sendRawTransaction(combined).do();
    await waitForTxnConfirmation(txId);

    return txId;
  } catch (error) {
    console.error("Deposit error:", error);
    if (error instanceof Error) {
      throw new Error(`Deposit failed: ${error.message}`);
    }
    throw error;
  }
}

export async function withdrawALGO(
  address: string,
  amountAlgo: number
): Promise<string> {
  try {
    ensureAppConfigured();
    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do()
      .catch(() => null);

    if (!accountInfo) {
      throw new Error("Activate your vault in Pera before withdrawing.");
    }

    const amountMicroAlgo = BigInt(Math.round(amountAlgo * 1_000_000));
    const suggestedParams = await algodClient.getTransactionParams().do();
    const abiCodec = new algosdk.ABIUintType(64);
    const encodedAmount = abiCodec.encode(amountMicroAlgo);

    const withdrawTxn = algosdk.makeApplicationCallTxnFromObject({
      sender: address,
      appIndex: APP_ID,
      onComplete: algosdk.OnApplicationComplete.NoOpOC,
      appArgs: [WITHDRAW_METHOD_SELECTOR, encodedAmount],
      suggestedParams,
    });

    const signedTxn = await peraWallet.signTransaction([
      [{ txn: withdrawTxn, signers: [address] }],
    ]);

    const { txId } = await algodClient.sendRawTransaction(signedTxn[0]).do();
    await waitForTxnConfirmation(txId);

    return txId;
  } catch (error) {
    console.error("Withdrawal error:", error);
    if (error instanceof Error) {
      throw new Error(`Withdrawal failed: ${error.message}`);
    }
    throw error;
  }
}

export async function getSavingsData(address: string): Promise<VaultData> {
  if (!APP_ID || APP_ID <= 0) {
    return emptyVaultData();
  }

  try {
    const accountInfo = await algodClient
      .accountApplicationInformation(address, APP_ID)
      .do();
    const parsed = parseState(accountInfo.appLocalState?.keyValue);

    return {
      isOptedIn: true,
      totalSaved: (parsed.total_saved || 0) / 1_000_000,
      depositCount: parsed.deposit_count || 0,
      streakDays: parsed.streak_days || 0,
      xpPoints: parsed.xp_points || 0,
      level: parsed.level || 1,
      highestMilestone: parsed.highest_milestone || 0,
    };
  } catch (error) {
    console.error("Error fetching savings data:", error);
    return emptyVaultData();
  }
}

export async function getDepositHistory(
  address: string
): Promise<DepositEntry[]> {
  if (!APP_ID || APP_ID <= 0) {
    return [];
  }

  try {
    const response = await indexerClient
      .searchForTransactions()
      .address(address)
      .applicationID(APP_ID)
      .do();

    const depositSelectorHex = Buffer.from(DEPOSIT_METHOD_SELECTOR).toString(
      "hex"
    );

    return (response.transactions || [])
      .map((txn: any) => {
        const applicationArgs =
          txn.applicationTransaction?.applicationArgs ||
          txn["app-call"]?.["application-args"] ||
          [];
        const firstArg = applicationArgs[0]
          ? Buffer.from(applicationArgs[0], "base64").toString("hex")
          : "";

        if (firstArg !== depositSelectorHex) {
          return null;
        }

        const amount =
          toSafeNumber(
            txn.paymentTransaction?.amount ?? txn.payment?.amount ?? 0
          ) / 1_000_000;
        const roundTime = toSafeNumber(
          txn.roundTime ?? txn["round-time"] ?? 0
        );

        return {
          txnId: txn.id,
          amountAlgo: amount,
          timestamp: roundTime * 1000,
          round: toSafeNumber(txn.confirmedRound ?? txn.round ?? 0),
        };
      })
      .filter(Boolean)
      .sort((left: DepositEntry, right: DepositEntry) => right.timestamp - left.timestamp);
  } catch (error) {
    console.error("Error fetching deposit history:", error);
    return [];
  }
}

export async function getGlobalStats(): Promise<GlobalStats> {
  if (!APP_ID || APP_ID <= 0) {
    return emptyGlobalStats();
  }

  try {
    const appInfo = await algodClient.getApplicationByID(APP_ID).do();
    const parsed = parseState(appInfo.params.globalState as TealStateEntry[]);

    return {
      totalDeposited: (parsed.total_deposited_global || 0) / 1_000_000,
      totalUsers: parsed.total_users || 0,
    };
  } catch (error) {
    console.error("Error fetching global stats:", error);
    return emptyGlobalStats();
  }
}

export async function getWalletBalance(address: string): Promise<number> {
  try {
    const accountInfo = await algodClient.accountInformation(address).do();
    return toSafeNumber(accountInfo.amount) / 1_000_000;
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    return 0;
  }
}
