import React, { useState } from "react";
import { motion } from "framer-motion";
import { useVault } from "@/contexts/VaultContext";
import { Copy, LogOut } from "lucide-react";

export default function ProfilePage() {
  const { user, walletConnected, walletAddress, disconnectWallet } = useVault();
  const [copiedAddress, setCopiedAddress] = useState(false);

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

  const handleCopyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
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
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Profile</h1>
          <p className="txt-dim">Manage your vault account</p>
        </motion.div>

        {/* Wallet section */}
        <motion.div
          variants={itemVariants}
          className={`p-6 rounded-lg border-2 mb-8 transition-all ${
            walletConnected
              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
              : "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700"
          }`}
        >
          <h2 className="font-semibold mb-4">Wallet</h2>

          {walletConnected ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs txt-dim mb-2 uppercase font-semibold">
                  Connected Address
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 rounded-lg bg-white dark:bg-gray-800 txt font-mono text-sm break-all">
                    {walletAddress}
                  </code>
                  <motion.button
                    onClick={handleCopyAddress}
                    className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                </div>
                {copiedAddress && (
                  <motion.p
                    className="text-xs text-green-600 dark:text-green-400 mt-2"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2 }}
                  >
                    ✓ Copied to clipboard
                  </motion.p>
                )}
              </div>

              <motion.button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <LogOut className="w-4 h-4" />
                Disconnect Wallet
              </motion.button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="txt-dim mb-4">
                No wallet connected. Connect your Pera Wallet to start saving.
              </p>
              <motion.button
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Stats grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="p-4 rounded-lg bg-sec border border-[var(--border)] text-center">
            <div className="text-xs txt-dim mb-2 uppercase font-semibold">
              Total Saved
            </div>
            <div className="text-2xl font-bold txt">
              {user.totalSaved?.toLocaleString()}
            </div>
            <div className="text-xs txt-dim">ALGO</div>
          </div>

          <div className="p-4 rounded-lg bg-sec border border-[var(--border)] text-center">
            <div className="text-xs txt-dim mb-2 uppercase font-semibold">
              Days Active
            </div>
            <div className="text-2xl font-bold txt">{user.daysActive}</div>
            <div className="text-xs txt-dim">days</div>
          </div>

          <div className="p-4 rounded-lg bg-sec border border-[var(--border)] text-center">
            <div className="text-xs txt-dim mb-2 uppercase font-semibold">
              Highest Streak
            </div>
            <div className="text-2xl font-bold txt">🔥 {user.highestStreak}</div>
            <div className="text-xs txt-dim">days</div>
          </div>

          <div className="p-4 rounded-lg bg-sec border border-[var(--border)] text-center">
            <div className="text-xs txt-dim mb-2 uppercase font-semibold">
              Deposits
            </div>
            <div className="text-2xl font-bold txt">{user.totalDeposits}</div>
            <div className="text-xs txt-dim">times</div>
          </div>
        </motion.div>

        {/* Account info */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg bg-sec border border-[var(--border)] mb-8"
        >
          <h2 className="font-semibold mb-4">Account Info</h2>
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="txt-dim">User Level</span>
              <span className="font-semibold txt">Level {user.level} • {user.displayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="txt-dim">Total XP</span>
              <span className="font-semibold txt">{user.xp?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="txt-dim">Current Streak</span>
              <span className="font-semibold txt">
                🔥 {user.streak} days
              </span>
            </div>
            <div className="flex justify-between">
              <span className="txt-dim">Savings Goal</span>
              <span className="font-semibold txt">
                {user.totalSaved?.toLocaleString()} / {user.goal?.toLocaleString()} ALGO
              </span>
            </div>
            <div className="flex justify-between">
              <span className="txt-dim">Badges Earned</span>
              <span className="font-semibold txt">{user.badgesEarned} / 5</span>
            </div>
            <div className="flex justify-between">
              <span className="txt-dim">Member Since</span>
              <span className="font-semibold txt">
                {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Account actions */}
        <motion.div
          variants={itemVariants}
          className="p-6 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
        >
          <h2 className="font-semibold mb-4 txt-red">Danger Zone</h2>
          <p className="text-sm txt-dim mb-4">
            Be careful with these actions. They cannot be undone.
          </p>
          <motion.button
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Delete Account
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}
