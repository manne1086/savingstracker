import React, { createContext, useContext, useMemo, useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import {
  levelThresholds,
  mockBadges,
  mockHistory,
  mockLeaderboard,
  mockUser,
} from "@/mock/data";

const VaultContext = createContext(undefined);

function getXpForNextLevel(level) {
  return levelThresholds[Math.min(level, levelThresholds.length - 1)] ?? 30000;
}

function getHistoryDateKey(entry) {
  if (typeof entry?.date === "string" && entry.date.length > 0) {
    return entry.date;
  }

  if (typeof entry?.timestamp === "number") {
    return new Date(entry.timestamp).toISOString().split("T")[0];
  }

  return null;
}

function deriveBadges(highestMilestone) {
  return mockBadges.map((badge) => {
    const milestoneAmount = Number.parseInt(
      badge.requirement.split(" ")[1],
      10
    );

    return {
      ...badge,
      unlocked: highestMilestone >= milestoneAmount,
    };
  });
}

function buildUser({ address, isConnected, vaultData, depositHistory, badges }) {
  const totalSaved = vaultData?.totalSaved ?? 0;
  const xp = vaultData?.xpPoints ?? 0;
  const level = vaultData?.level ?? 1;
  const streak = vaultData?.streakDays ?? 0;
  const activeDays = new Set(
    depositHistory
      .map((entry) => getHistoryDateKey(entry))
      .filter(Boolean)
  ).size;
  const depositCount = vaultData?.depositCount ?? depositHistory.length;
  const dailySavedToday = depositHistory.some(
    (entry) => getHistoryDateKey(entry) === new Date().toISOString().split("T")[0]
  );

  return {
    ...mockUser,
    address: address || mockUser.address,
    displayName: isConnected
      ? `Saver ${address?.slice(0, 6) ?? "Guest"}`
      : mockUser.displayName,
    level,
    xp,
    xpForNextLevel: getXpForNextLevel(level),
    streak,
    totalSaved,
    dailySavedToday,
    highestStreak: streak,
    totalDeposits: depositCount,
    daysActive: activeDays || (depositCount > 0 || streak > 0 ? 1 : 0),
    badgesEarned: badges.filter((badge) => badge.unlocked).length,
  };
}

export const VaultProvider = ({ children }) => {
  const {
    address,
    isConnected,
    isLoadingVault,
    vaultData,
    connect,
    disconnect,
    depositALGO,
    refreshVaultData,
  } = useWallet();
  const [recentDeposits, setRecentDeposits] = useState([]);

  const badges = useMemo(
    () => deriveBadges(vaultData?.highestMilestone ?? 0),
    [vaultData?.highestMilestone]
  );
  const depositHistory = useMemo(
    () => (isConnected ? recentDeposits : mockHistory),
    [isConnected, recentDeposits]
  );
  const user = useMemo(
    () =>
      buildUser({
        address,
        isConnected,
        vaultData,
        depositHistory,
        badges,
      }),
    [address, badges, depositHistory, isConnected, vaultData]
  );
  const leaderboard = useMemo(() => {
    const fallbackEntry = mockLeaderboard.find(
      (entry) => entry.displayName === mockUser.displayName
    ) || {
      id: mockLeaderboard.length + 1,
      rank: mockLeaderboard.length + 1,
      address: mockUser.address,
      displayName: mockUser.displayName,
      level: mockUser.level,
      streak: mockUser.streak,
      totalSaved: mockUser.totalSaved,
      avatar: "VB",
    };
    const currentUserEntry = {
      ...fallbackEntry,
      address: user.address,
      displayName: user.displayName,
      level: user.level,
      streak: user.streak,
      totalSaved: user.totalSaved,
    };

    return [...mockLeaderboard.filter((entry) => entry.id !== fallbackEntry.id), currentUserEntry]
      .sort((left, right) => right.totalSaved - left.totalSaved)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));
  }, [user.address, user.displayName, user.level, user.streak, user.totalSaved]);

  const connectWallet = async () => {
    await connect();
  };

  const disconnectWallet = async () => {
    disconnect();
  };

  const makeDeposit = async (amount) => {
    const txId = await depositALGO(amount);
    const milestones = [10, 50, 100, 500, 1000];
    const totalAfterDeposit = (vaultData?.totalSaved ?? 0) + amount;
    const unlockedMilestone = milestones.find(
      (milestone) =>
        (vaultData?.highestMilestone ?? 0) < milestone &&
        totalAfterDeposit >= milestone
    );

    setRecentDeposits((prev) => [
      {
        id: `${txId}-${prev.length}`,
        date: new Date().toISOString().split("T")[0],
        amount,
        streakDay: Math.max(1, user.streak + 1),
        xpGained: amount * 10,
        milestoneUnlocked: unlockedMilestone ? `${unlockedMilestone} ALGO` : null,
        type: "deposit",
      },
      ...prev,
    ]);

    await refreshVaultData();

    return {
      success: true,
      txId,
      amount,
    };
  };

  const value = {
    user,
    walletConnected: isConnected,
    walletAddress: address,
    isLoadingVault,
    depositHistory,
    leaderboard,
    badges,
    connectWallet,
    disconnectWallet,
    makeDeposit,
    resetDailyFlag: () => {},
    breakStreak: () => {},
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
