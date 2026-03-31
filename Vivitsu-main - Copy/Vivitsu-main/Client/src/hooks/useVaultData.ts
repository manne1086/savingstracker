import { useEffect, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { VaultData } from "@/lib/algorand";

interface UseVaultDataReturn {
  vaultData: VaultData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook that provides vault data polling and refresh.
 * Uses WalletContext for connection state.
 * Auto-refreshes every 30 seconds when connected.
 */
export const useVaultData = (): UseVaultDataReturn => {
  const { vaultData, isLoadingVault, error, refreshVaultData, isConnected } =
    useWallet();

  const [isLoading, setIsLoading] = useState(false);

  // Expose manual refresh
  const refresh = async () => {
    if (!isConnected) {
      return;
    }
    setIsLoading(true);
    try {
      await refreshVaultData();
    } finally {
      setIsLoading(false);
    }
  };

  return {
    vaultData,
    isLoading: isLoading || isLoadingVault,
    error,
    refresh,
  };
};
