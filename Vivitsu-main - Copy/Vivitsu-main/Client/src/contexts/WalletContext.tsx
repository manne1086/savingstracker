import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  connectPeraWallet,
  disconnectWallet,
  peraWallet,
  optInToApp,
  getSavingsData,
  depositALGO as depositALGOLib,
  withdrawALGO as withdrawALGOLib,
  VaultData,
  getGlobalStats,
  GlobalStats,
} from "@/lib/algorand";

// ════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════

export interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  vaultData: VaultData | null;
  globalStats: GlobalStats | null;
  isLoadingVault: boolean;

  // Methods
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshVaultData: () => Promise<void>;
  depositALGO: (amount: number) => Promise<string>;
  withdrawALGO: (amount: number) => Promise<string>;
}

// ════════════════════════════════════════════════════════════════════
// CONTEXT
// ════════════════════════════════════════════════════════════════════

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

// ════════════════════════════════════════════════════════════════════
// PROVIDER
// ════════════════════════════════════════════════════════════════════

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoadingVault, setIsLoadingVault] = useState(false);

  // Poll interval reference
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // ────────────────────────────────────────────────────────────────
  // EFFECTS
  // ────────────────────────────────────────────────────────────────

  // On mount: Try to reconnect to existing session
  useEffect(() => {
    const reconnect = async () => {
      try {
        // Use a timeout to avoid hanging if Pera is not available
        const reconnectPromise = peraWallet.reconnectSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Reconnect timeout")), 3000)
        );

        const accounts = await Promise.race([
          reconnectPromise,
          timeoutPromise,
        ]);

        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);

          // Fetch initial vault data
          await fetchVaultData(accounts[0]);

          // Start polling
          startPolling(accounts[0]);
        }
      } catch (error) {
        // Silently fail - no existing session or Pera not available
        console.log("No existing Pera session to reconnect to");
      }
    };

    reconnect();

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  // ────────────────────────────────────────────────────────────────
  // INTERNAL HELPERS
  // ────────────────────────────────────────────────────────────────

  const fetchVaultData = async (addr: string) => {
    try {
      setIsLoadingVault(true);
      const data = await getSavingsData(addr);
      setVaultData(data);

      // Also fetch global stats
      const stats = await getGlobalStats();
      setGlobalStats(stats);

      setError(null);
    } catch (err) {
      console.error("Error fetching vault data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vault data");
    } finally {
      setIsLoadingVault(false);
    }
  };

  const startPolling = (addr: string) => {
    // Clear existing poll
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Poll every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      fetchVaultData(addr);
    }, 30000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // ────────────────────────────────────────────────────────────────
  // PUBLIC METHODS
  // ────────────────────────────────────────────────────────────────

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const connectedAddress = await connectPeraWallet();
      setAddress(connectedAddress);
      setIsConnected(true);

      // Opt into app if not already opted in
      try {
        await optInToApp(connectedAddress);
      } catch (err) {
        console.log("Already opted in or opt-in skipped:", err);
      }

      // Fetch vault data
      await fetchVaultData(connectedAddress);

      // Start polling
      startPolling(connectedAddress);
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(errorMsg);
      setIsConnected(false);
      setAddress(null);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    stopPolling();
    disconnectWallet();
    setAddress(null);
    setIsConnected(false);
    setVaultData(null);
    setGlobalStats(null);
    setError(null);
  };

  const refreshVaultData = async () => {
    if (!address) {
      setError("Not connected");
      return;
    }
    await fetchVaultData(address);
  };

  const depositALGO = async (amount: number): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      const txnId = await depositALGOLib(address, amount);

      // Refresh vault data after deposit
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s for indexing
      await fetchVaultData(address);

      return txnId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Deposit failed";
      setError(errorMsg);
      throw err;
    }
  };

  const withdrawALGO = async (amount: number): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      const txnId = await withdrawALGOLib(address, amount);

      // Refresh vault data after withdrawal
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s for indexing
      await fetchVaultData(address);

      return txnId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Withdrawal failed";
      setError(errorMsg);
      throw err;
    }
  };

  // ────────────────────────────────────────────────────────────────
  // CONTEXT VALUE
  // ────────────────────────────────────────────────────────────────

  const value: WalletContextType = {
    address,
    isConnected,
    isConnecting,
    error,
    vaultData,
    globalStats,
    isLoadingVault,
    connect,
    disconnect,
    refreshVaultData,
    depositALGO,
    withdrawALGO,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
