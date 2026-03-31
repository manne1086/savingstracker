import React, { useState } from "react";
import { motion } from "framer-motion";
import { useVault } from "@/contexts/VaultContext";
import CircularProgress from "@/components/vault/CircularProgress";
import StreakCard from "@/components/vault/StreakCard";
import XPProgressBar from "@/components/vault/XPProgressBar";
import FutureSelfCard from "@/components/vault/FutureSelfCard";
import DepositModal from "@/components/vault/DepositModal";
import { levelNames } from "@/mock/data";

export default function VaultDashboard() {
  const { user } = useVault();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const percentage = (user.totalSaved / user.goal) * 100;
  const goalDaysLeft = 14;
  const isOnTrack = percentage >= (100 - (goalDaysLeft / 90) * 100);
  const levelName = levelNames[Math.min(user.level, levelNames.length - 1)];

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

  return (
    <div className="min-h-screen bg-transparent txt pb-24 md:pb-8">
      <motion.div
        className="max-w-4xl mx-auto px-4 py-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Savings Vault</h1>
          <p className="txt-dim">Welcome back! Keep your streak alive ðŸ”¥</p>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8"
        >
          <CircularProgress
            percentage={Math.round(percentage)}
            current={user.totalSaved}
            target={user.goal}
            size={220}
            strokeWidth={14}
          />
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="p-6 mb-6 rounded-lg bg-sec border border-[var(--border)]"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Goal Status</h3>
            <span
              className={`text-xs px-3 py-1 rounded-full font-medium ${
                isOnTrack
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                  : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
              }`}
            >
              {isOnTrack ? "âœ“ On Track" : "âš ï¸ Catch Up"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs txt-dim mb-1">Days Remaining</div>
              <div className="text-2xl font-bold txt">{goalDaysLeft}</div>
            </div>
            <div>
              <div className="text-xs txt-dim mb-1">Amount Needed</div>
              <div className="text-2xl font-bold txt">
                {Math.max(0, user.goal - user.totalSaved)} ALGO
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className={`p-6 mb-6 rounded-lg border-2 transition-all ${
            user.dailySavedToday
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              : "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border-orange-300 dark:border-orange-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">
                {user.dailySavedToday
                  ? "âœ… You saved today!"
                  : "ðŸ’° Daily Save"}
              </h3>
              <p className="text-sm txt-dim">
                {user.dailySavedToday
                  ? "Great job! Come back tomorrow to keep your streak."
                  : "You haven't saved today yet. Maintain your streak!"}
              </p>
            </div>
            {!user.dailySavedToday && (
              <motion.button
                onClick={() => setIsDepositModalOpen(true)}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold whitespace-nowrap ml-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Deposit Now
              </motion.button>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <motion.div variants={itemVariants}>
            <StreakCard
              streak={user.streak}
              isWarning={user.streak > 0 && user.streak <= 1}
              hoursUntilBreak={user.streak <= 1 ? 6 : null}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <XPProgressBar
              currentXP={user.xp}
              requiredXP={user.xpForNextLevel}
              level={user.level}
              levelName={levelName}
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <FutureSelfCard />
        </motion.div>
      </motion.div>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />
    </div>
  );
}
