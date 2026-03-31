import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import {
  connectPeraWallet,
  disconnectWallet,
  peraWallet,
  optInToApp,
  isVaultAppConfigured,
  getSavingsData,
  depositALGO as depositALGOLib,
  withdrawALGO as withdrawALGOLib,
  VaultData,
  getGlobalStats,
  GlobalStats,
} from "@/lib/algorand";

export interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  vaultData: VaultData | null;
  globalStats: GlobalStats | null;
  isLoadingVault: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshVaultData: () => Promise<void>;
  optInVault: () => Promise<string>;
  depositALGO: (amount: number) => Promise<string>;
  withdrawALGO: (amount: number) => Promise<string>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);
let hasAttemptedInitialReconnect = false;

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};

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

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const reconnect = async () => {
      if (hasAttemptedInitialReconnect) {
        return;
      }

      hasAttemptedInitialReconnect = true;

      try {
        const reconnectPromise = peraWallet.reconnectSession();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Reconnect timeout")), 3000)
        );

        const accounts = await Promise.race([
          reconnectPromise,
          timeoutPromise,
        ]);

        if (!isMountedRef.current || !accounts || accounts.length === 0) {
          return;
        }

        setAddress(accounts[0]);
        setIsConnected(true);
        await fetchVaultData(accounts[0]);
        startPolling(accounts[0]);
      } catch {
        console.log("No existing Pera session to reconnect to");
      }
    };

    reconnect();

    return () => {
      isMountedRef.current = false;

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchVaultData = async (addr: string) => {
    try {
      if (isMountedRef.current) {
        setIsLoadingVault(true);
      }

      const [data, stats] = await Promise.all([
        getSavingsData(addr),
        getGlobalStats(),
      ]);

      if (!isMountedRef.current) {
        return;
      }

      setVaultData(data);
      setGlobalStats(stats);
      setError(null);
    } catch (err) {
      if (!isMountedRef.current) {
        return;
      }

      console.error("Error fetching vault data:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch vault data");
    } finally {
      if (isMountedRef.current) {
        setIsLoadingVault(false);
      }
    }
  };

  const startPolling = (addr: string) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

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

  const connect = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const connectedAddress = await connectPeraWallet();
      setAddress(connectedAddress);
      setIsConnected(true);

      const postConnectError = isVaultAppConfigured()
        ? null
        : 
          "Wallet connected on TestNet, but the vault is not deployed yet. Set VITE_SAVINGS_VAULT_APP_ID to your TestNet app ID to enable deposits and withdrawals.";

      await fetchVaultData(connectedAddress);
      if (postConnectError && isMountedRef.current) {
        setError(postConnectError);
      }
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

  const optInVault = async (): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      const txnId = await optInToApp(address);
      await fetchVaultData(address);
      return txnId;
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Vault activation failed";
      setError(errorMsg);
      throw err;
    }
  };

  const depositALGO = async (amount: number): Promise<string> => {
    if (!address) {
      throw new Error("Wallet not connected");
    }

    try {
      setError(null);
      const txnId = await depositALGOLib(address, amount);
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
      await fetchVaultData(address);
      return txnId;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Withdrawal failed";
      setError(errorMsg);
      throw err;
    }
  };

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
    optInVault,
    depositALGO,
    withdrawALGO,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
};
