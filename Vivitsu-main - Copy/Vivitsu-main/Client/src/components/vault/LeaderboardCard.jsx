import React from "react";
import { motion } from "framer-motion";

const getRankColors = (rank) => {
  switch (rank) {
    case 1:
      return "from-yellow-400 to-yellow-600";
    case 2:
      return "from-gray-300 to-gray-500";
    case 3:
      return "from-orange-400 to-orange-600";
    default:
      return "from-gray-200 to-gray-400";
  }
};

const getRankBadge = (rank) => {
  switch (rank) {
    case 1:
      return "🥇";
    case 2:
      return "🥈";
    case 3:
      return "🥉";
    default:
      return null;
  }
};

export const LeaderboardCard = ({ 
  user = {}, 
  rank = null,
  isCurrentUser = false,
  compact = false,
}) => {
  const isTopThree = rank && rank <= 3;

  return (
    <motion.div
      className={`
        rounded-lg border transition-all
        ${
          isTopThree
            ? `bg-gradient-to-br ${getRankColors(rank)} border-2 border-current shadow-lg`
            : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
        }
        ${isCurrentUser ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900" : ""}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {isTopThree && !compact ? (
        // Top 3 card (expanded)
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl font-black text-white">{rank}</div>
            <div className="text-4xl">{getRankBadge(rank)}</div>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div className="text-4xl">{user.avatar}</div>
            <div>
              <div className="font-bold text-white">{user.displayName}</div>
              <div className="text-xs text-white/80 font-mono">
                {user.address?.slice(0, 10)}...
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm text-white">
            <div className="flex justify-between">
              <span>Level {user.level}</span>
              <span className="font-semibold">{user.levelName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>🔥 {user.streak} days</span>
            </div>
            <div className="text-lg font-bold pt-2 border-t border-white/30">
              {user.totalSaved?.toLocaleString()} ALGO
            </div>
          </div>
        </div>
      ) : (
        // Compact card (rank 4+)
        <div className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-sm txt">
              {rank}
            </div>
            <div className="text-xl">{user.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold txt text-sm truncate">
                {user.displayName}
              </div>
              <div className="text-xs txt-dim font-mono truncate">
                {user.address?.slice(0, 10)}...
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="font-bold txt text-sm">
                {user.totalSaved?.toLocaleString()}
              </div>
              <div className="text-xs txt-dim">ALGO</div>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3 text-xs txt-dim px-11">
            <span>Lvl {user.level}</span>
            <span>•</span>
            <span>🔥 {user.streak}d</span>
          </div>
        </div>
      )}

      {isCurrentUser && (
        <motion.div
          className="absolute -top-2 -right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          YOU
        </motion.div>
      )}
    </motion.div>
  );
};

export default LeaderboardCard;
