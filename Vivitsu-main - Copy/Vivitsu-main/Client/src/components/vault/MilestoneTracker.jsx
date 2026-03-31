import React from "react";
import { motion } from "framer-motion";

export const MilestoneTracker = ({ milestones = [] }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  const pulseVariants = {
    initial: { scale: 1 },
    animate: { scale: [1, 1.1, 1] },
  };

  return (
    <motion.div
      className="relative py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Vertical line */}
      <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent transform md:-translate-x-1/2" />

      <div className="space-y-8">
        {milestones.map((milestone, index) => (
          <motion.div
            key={milestone.id}
            variants={itemVariants}
            className={`flex items-start gap-6 ${index % 2 === 1 ? "md:flex-row-reverse" : ""}`}
          >
            {/* Timeline dot */}
            <motion.div
              className={`
                relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                ${
                  milestone.unlocked
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/50"
                    : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400"
                }
              `}
              variants={milestone.unlocked ? pulseVariants : { initial: { scale: 1 } }}
              animate={milestone.unlocked ? "animate" : "initial"}
              transition={milestone.unlocked ? { duration: 2, repeat: Infinity } : {}}
            >
              {milestone.unlocked ? "✓" : "🔒"}
            </motion.div>

            {/* Content card */}
            <motion.div
              className={`
                flex-1 p-4 rounded-lg transition-all
                ${
                  milestone.unlocked
                    ? "bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700"
                    : "bg-gray-50 dark:bg-gray-800/50 border-2 border-gray-200 dark:border-gray-700 opacity-60"
                }
              `}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-sm font-semibold txt">{milestone.title}</div>
                  <div className="text-xs txt-dim">{milestone.label}</div>
                </div>
                <span className="text-2xl">{milestone.icon}</span>
              </div>

              {milestone.unlocked && milestone.unlockedAt && (
                <motion.div
                  className="text-xs text-green-600 dark:text-green-400 mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  ✨ Unlocked on {new Date(milestone.unlockedAt).toLocaleDateString()}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default MilestoneTracker;
