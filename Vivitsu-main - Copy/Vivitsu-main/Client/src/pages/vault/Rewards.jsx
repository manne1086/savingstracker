import React, { useState } from "react";
import { motion } from "framer-motion";
import { useVault } from "@/contexts/VaultContext";
import BadgeGrid from "@/components/vault/BadgeGrid";
import { levelNames, levelThresholds, mockBadges } from "@/mock/data";

export default function RewardsPage() {
  const { user } = useVault();
  const [showRewardPopup, setShowRewardPopup] = useState(false);

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

  const unlockedBadges = mockBadges.filter((b) => b.unlocked);

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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Rewards & Badges</h1>
          <p className="txt-dim">Unlock achievements as you save</p>
        </motion.div>

        {/* Level progression bar */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="font-semibold mb-4">Level Progression</h2>
          <div className="flex gap-1 md:gap-2 overflow-x-auto pb-2">
            {levelNames.slice(0, 10).map((name, idx) => {
              const levelNum = idx + 1;
              const isCurrentLevel = levelNum === user.level;
              const isUnlocked = levelNum < user.level;

              return (
                <motion.button
                  key={idx}
                  className={`
                    flex-shrink-0 w-12 h-12 md:w-16 md:h-16 rounded-lg font-bold text-sm
                    flex flex-col items-center justify-center relative
                    transition-all
                    ${
                      isCurrentLevel
                        ? "bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg"
                        : isUnlocked
                        ? "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                    }
                  `}
                  whileHover={!isCurrentLevel ? { scale: 1.05 } : {}}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span>&nbsp;{levelNum}</span>
                  {isCurrentLevel && (
                    <motion.div
                      className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs"
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ⭐
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Badges section */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Badges</h2>
            <span className="text-xs bg-sec px-3 py-1 rounded-full txt-dim">
              {unlockedBadges.length} / {mockBadges.length}
            </span>
          </div>
          <BadgeGrid badges={mockBadges} />
        </motion.div>

        {/* Rewards catalog */}
        <motion.div variants={itemVariants}>
          <h2 className="font-semibold mb-4">Reward Catalog</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                name: "Lucky Save",
                description: "20% chance on each deposit",
                xp: 50,
                icon: "🍀",
              },
              {
                name: "Streak Bonus",
                description: "7+ day streak unlocks",
                xp: 100,
                icon: "🔥",
              },
              {
                name: "Milestone Hitter",
                description: "Complete a milestone",
                xp: 150,
                icon: "🎯",
              },
              {
                name: "Level Up",
                description: "Reach a new level",
                xp: 200,
                icon: "⬆️",
              },
            ].map((reward, idx) => (
              <motion.div
                key={idx}
                className="p-4 rounded-lg bg-sec border border-[var(--border)] hover:bg-ter transition-colors group cursor-pointer"
                whileHover={{ scale: 1.02, y: -2 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex items-start gap-3 mb-2">
                  <span className="text-3xl">{reward.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold txt group-hover:txt-red transition-colors">
                      {reward.name}
                    </div>
                    <div className="text-xs txt-dim">{reward.description}</div>
                  </div>
                </div>
                <div className="text-sm font-bold text-yellow-600 dark:text-yellow-400">
                  +{reward.xp} XP
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Random reward popup (mock) */}
        {showRewardPopup && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center"
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
            >
              <motion.div
                className="text-6xl mb-4"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold mb-2 txt">
                You unlocked: Vault Guard Badge!
              </h2>
              <p className="txt-dim mb-6">
                Congratulations on saving 100 ALGO! 🛡️
              </p>
              <motion.button
                onClick={() => setShowRewardPopup(false)}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Claim Reward
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
