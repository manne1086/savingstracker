import React, { createContext, useContext, useState, useCallback } from "react";
import { mockUser, mockHistory, mockLeaderboard, mockBadges } from "@/mock/data";

const VaultContext = createContext(undefined);

export const VaultProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState(mockUser);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(null);
  const [depositHistory, setDepositHistory] = useState(mockHistory);

  // Connect wallet
  const connectWallet = useCallback(async () => {
    // Mock wallet connection
    return new Promise((resolve) => {
      setTimeout(() => {
        setWalletConnected(true);
        setWalletAddress(mockUser.address);
        resolve(mockUser.address);
      }, 500);
    });
  }, []);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletConnected(false);
    setWalletAddress(null);
  }, []);

  // Make a deposit
  const makeDeposit = useCallback(
    (amount) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Update user data
          const xpGained = Math.floor(amount * 10);
          const newXP = user.xp + xpGained;
          
          // Add to history
          const newEntry = {
            id: depositHistory.length + 1,
            date: new Date().toISOString().split("T")[0],
            amount,
            streakDay: user.streak + 1,
            xpGained,
            milestoneUnlocked: null,
            type: "deposit",
          };

          const newTotalSaved = user.totalSaved + amount;

          // Check for milestones
          const milestones = [10, 50, 100, 500, 1000];
          const previousTotal = user.totalSaved;
          for (const milestone of milestones) {
            if (previousTotal < milestone && newTotalSaved >= milestone) {
              newEntry.milestoneUnlocked = `${milestone} ALGO`;
              break;
            }
          }

          setUser((prev) => ({
            ...prev,
            totalSaved: newTotalSaved,
            xp: newXP,
            streak: prev.streak + 1,
            dailySavedToday: true,
          }));

          setDepositHistory((prev) => [newEntry, ...prev]);

          resolve({
            success: true,
            amount,
            xpGained,
            newTotal: newTotalSaved,
            newXP,
          });
        }, 800);
      });
    },
    [user, depositHistory]
  );

  // Reset daily flag (would happen at midnight in real app)
  const resetDailyFlag = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      dailySavedToday: false,
    }));
  }, []);

  // Break streak (if user misses a day)
  const breakStreak = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      streak: 0,
    }));
  }, []);

  const value = {
    // User
    user,
    walletConnected,
    walletAddress,

    // History & Leaderboard (static for now)
    depositHistory,
    leaderboard: mockLeaderboard,
    badges: mockBadges,

    // Actions
    connectWallet,
    disconnectWallet,
    makeDeposit,
    resetDailyFlag,
    breakStreak,
  };

  return (
    <VaultContext.Provider value={value}>{children}</VaultContext.Provider>
  );
};

export const useVault = () => {
  const context = useContext(VaultContext);
  if (context === undefined) {
    throw new Error("useVault must be used within a VaultProvider");
  }
  return context;
};
