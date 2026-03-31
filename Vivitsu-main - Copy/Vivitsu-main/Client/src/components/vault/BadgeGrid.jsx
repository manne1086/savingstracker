import React from "react";
import { motion } from "framer-motion";

export const BadgeGrid = ({ badges = [] }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const badgeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const pulseVariants = {
    animate: {
      scale: [1, 1.05, 1],
      transition: { duration: 2, repeat: Infinity },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {badges.map((badge) => (
        <motion.div
          key={badge.id}
          variants={badgeVariants}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className={`
            relative p-4 rounded-lg border-2 text-center cursor-pointer
            transition-all group
            ${
              badge.unlocked
                ? `${badge.color} border-current shadow-lg`
                : "bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50"
            }
          `}
        >
          {/* Badge content */}
          <motion.div
            className={badge.unlocked ? "filter-none" : "filter blur-sm"}
            animate={badge.unlocked ? "animate" : {}}
            variants={badge.unlocked ? pulseVariants : {}}
          >
            <div className="text-4xl mb-2">{badge.icon}</div>
            <div className="text-xs font-semibold txt">{badge.name}</div>
            {!badge.unlocked && (
              <div className="text-xs txt-dim mt-1">
                🔒 {badge.requirement}
              </div>
            )}
          </motion.div>

          {/* Unlocked badge */}
          {badge.unlocked && (
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            >
              ✓
            </motion.div>
          )}

          {/* Tooltip on hover */}
          <motion.div
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-10"
            initial={{ scale: 0 }}
          >
            {badge.requirement}
            {badge.unlocked && (
              <>
                <br />
                <span className="text-yellow-300">+{badge.xpReward} XP</span>
              </>
            )}
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BadgeGrid;
