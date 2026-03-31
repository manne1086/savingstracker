import React from "react";
import { motion } from "framer-motion";
import { useVault } from "@/contexts/VaultContext";
import MilestoneTracker from "@/components/vault/MilestoneTracker";
import { mockMilestones } from "@/mock/data";
import { ChevronRight } from "lucide-react";

export default function GoalsPage() {
  const { user, depositHistory } = useVault();

  const percentage = (user.totalSaved / user.goal) * 100;
  const goalCompletion = Math.round(percentage);
  const needToSave = Math.max(0, user.goal - user.totalSaved);
  const daysLeft = 14;
  const dailyRate = daysLeft > 0 ? needToSave / daysLeft : 0;

  const needsWarning = percentage < 60 && daysLeft < 14;

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

  const getProgressColor = (pct) => {
    if (pct >= 80) return "from-green-400 to-green-600";
    if (pct >= 50) return "from-yellow-400 to-yellow-600";
    return "from-red-400 to-red-600";
  };

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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Goal</h1>
          <p className="txt-dim">{user.goal?.toLocaleString()} ALGO Target</p>
        </motion.div>

        {/* Main progress bar */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Progress</h2>
            <span className="text-sm font-bold txt">{goalCompletion}%</span>
          </div>

          <div className="relative h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
            <motion.div
              className={`h-full bg-gradient-to-r ${getProgressColor(
                goalCompletion
              )} rounded-full transition-all`}
              initial={{ width: 0 }}
              animate={{ width: `${goalCompletion}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            />
          </div>

          <div className="flex justify-between text-sm txt-dim">
            <span>{user.totalSaved?.toLocaleString()} ALGO saved</span>
            <span>{user.goal?.toLocaleString()} ALGO goal</span>
          </div>
        </motion.div>

        {/* Reality insight warning */}
        {needsWarning && (
          <motion.div
            variants={itemVariants}
            className="p-4 mb-6 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 flex gap-3"
            animate={{ borderColor: ["#ef4444", "#fca5a5", "#ef4444"] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold txt-red mb-1">Reality Check</h3>
              <p className="text-sm txt-dim">
                You need to save {dailyRate.toFixed(1)} ALGO daily to reach your goal in
                {" "}{daysLeft} days. You're currently on track to save {(user.totalSaved * 90 / Math.max(1, 45)).toFixed(0)} ALGO.
              </p>
              <p className="text-xs txt-red mt-2">
                💪 Your future self is counting on you.
              </p>
            </div>
          </motion.div>
        )}

        {/* Goal summary */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"
        >
          <div className="p-4 rounded-lg bg-sec border border-[var(--border)]">
            <div className="text-xs txt-dim mb-1">Days Remaining</div>
            <div className="text-2xl font-bold txt">{daysLeft}</div>
          </div>
          <div className="p-4 rounded-lg bg-sec border border-[var(--border)]">
            <div className="text-xs txt-dim mb-1">Still Need</div>
            <div className="text-2xl font-bold txt-red">
              {needToSave.toLocaleString()}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-sec border border-[var(--border)]">
            <div className="text-xs txt-dim mb-1">Daily Rate</div>
            <div className="text-2xl font-bold txt">
              {dailyRate.toFixed(1)}
            </div>
          </div>
        </motion.div>

        {/* Milestones section */}
        <motion.div variants={itemVariants} className="mb-8">
          <h2 className="text-xl font-bold mb-6">Milestones</h2>
          <MilestoneTracker milestones={mockMilestones} />
        </motion.div>

        {/* Savings history */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold mb-4">Recent Deposits</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {depositHistory.slice(0, 10).map((entry, idx) => (
              <motion.div
                key={entry.id}
                className="p-4 rounded-lg bg-sec border border-[var(--border)] flex items-center justify-between hover:bg-ter transition-colors"
                whileHover={{ x: 4 }}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="font-semibold">
                        +{entry.amount} ALGO
                      </div>
                      <div className="text-xs txt-dim">
                        {new Date(entry.date).toLocaleDateString()} • Streak Day{" "}
                        {entry.streakDay}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold txt-dim">
                    +{entry.xpGained} XP
                  </div>
                  {entry.milestoneUnlocked && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      🎉 {entry.milestoneUnlocked}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
