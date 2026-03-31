import React, { useState } from "react";
import { motion } from "framer-motion";
import { useVault } from "@/contexts/VaultContext";
import LeaderboardCard from "@/components/vault/LeaderboardCard";
import { communityGoal } from "@/mock/data";

export default function SocialPage() {
  const { user, leaderboard } = useVault();
  const [view, setView] = useState("global"); // "global" or "friends"

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const currentUserRank = leaderboard.find((u) => u.address === user.address);
  const topThree = leaderboard.slice(0, 3);
  const restOfLeaderboard = leaderboard.slice(3);

  const communityPercentage = (communityGoal.current / communityGoal.target) * 100;
  const userPercentageRank = currentUserRank
    ? Math.round((currentUserRank.rank / leaderboard.length) * 100)
    : 100;

  return (
    <div className="min-h-screen bg-primary txt pb-24 md:pb-8">
      <motion.div
        className="max-w-4xl mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Top Savers This Month
          </h1>

          {/* View toggle */}
          <div className="flex gap-2">
            <motion.button
              onClick={() => setView("global")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                view === "global"
                  ? "bg-red-500 text-white"
                  : "bg-sec border border-[var(--border)] txt hover:bg-ter"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Global
            </motion.button>
            <motion.button
              onClick={() => setView("friends")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                view === "friends"
                  ? "bg-red-500 text-white"
                  : "bg-sec border border-[var(--border)] txt hover:bg-ter"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Friends
            </motion.button>
          </div>
        </motion.div>

        {/* Top 3 cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 relative"
        >
          {topThree.map((user, idx) => (
            <div key={user.id} className="relative">
              <LeaderboardCard
                user={user}
                rank={user.rank}
                isCurrentUser={user.address === user.address}
                compact={false}
              />
              {idx === 0 && (
                <motion.div
                  className="absolute -top-3 right-4 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold"
                  animate={{ y: [-2, 2, -2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  👑
                </motion.div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Community vault */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 mb-8"
        >
          <h2 className="font-semibold mb-3">Community Vault</h2>
          <div className="flex items-center justify-between mb-3 text-sm">
            <span className="txt-dim">Collective Goal</span>
            <span className="font-bold txt">1,000,000 ALGO</span>
          </div>

          <div className="relative h-4 bg-white dark:bg-gray-800 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${communityPercentage}%` }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          <div className="flex items-center justify-between text-xs txt-dim">
            <span>{communityGoal.current.toLocaleString()} saved</span>
            <span>{Math.round(communityPercentage)}%</span>
          </div>

          <motion.div
            className="mt-3 text-xs text-purple-700 dark:text-purple-300"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🌟 {communityGoal.contributors} savers working together
          </motion.div>
        </motion.div>

        {/* Rest of leaderboard */}
        <motion.div variants={itemVariants}>
          <h2 className="font-semibold mb-4">Rankings</h2>
          <div className="space-y-3">
            {restOfLeaderboard.map((u, idx) => (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <LeaderboardCard
                  user={u}
                  rank={u.rank}
                  isCurrentUser={u.address === user.address}
                  compact={true}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Current user highlight (sticky) */}
        {currentUserRank && (
          <motion.div
            className="fixed bottom-24 md:bottom-8 left-4 right-4 md:left-auto md:right-4 md:w-80 p-4 rounded-lg bg-white dark:bg-gray-800 border-2 border-blue-500 shadow-lg z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold txt-dim uppercase">
                You
              </span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                Top {userPercentageRank}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{currentUserRank.avatar}</div>
              <div>
                <div className="font-bold text-sm">{currentUserRank.displayName}</div>
                <div className="text-xs txt-dim">
                  Rank #{currentUserRank.rank} • {currentUserRank.totalSaved.toLocaleString()} ALGO
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
