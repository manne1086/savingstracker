import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

const shimmerKeyframes = `
  @keyframes shimmer {
    0%, 100% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .xp-progress-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0) 0%,
      rgba(255, 255, 255, 0.2) 50%,
      rgba(255, 255, 255, 0) 100%
    );
    background-size: 1000px 100%;
    animation: shimmer 3s infinite;
  }
`;

export const XPProgressBar = ({
  currentXP = 2400,
  requiredXP = 3000,
  level = 4,
  levelName = "Vault Builder",
}) => {
  const percentage = (currentXP / requiredXP) * 100;
  const styleTagRef = useRef(null);

  useEffect(() => {
    // Inject shimmer animation
    if (!styleTagRef.current) {
      const style = document.createElement("style");
      style.textContent = shimmerKeyframes;
      document.head.appendChild(style);
      styleTagRef.current = style;
    }

    return () => {
      if (styleTagRef.current?.parentNode) {
        styleTagRef.current.parentNode.removeChild(styleTagRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="p-6 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700/50"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold txt">Level {level}</h3>
          <p className="text-xs txt-dim">{levelName}</p>
        </div>
        <motion.div
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {level}
        </motion.div>
      </div>

      <div className="relative h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
        {/* Background bar */}
        <div className="absolute inset-0 bg-gray-300 dark:bg-gray-600" />

        {/* Progress bar with shimmer */}
        <motion.div
          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full xp-progress-shimmer relative"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
        />
      </div>

      <div className="text-xs txt-dim text-center">
        {currentXP.toLocaleString()} / {requiredXP.toLocaleString()} XP to Level {level + 1}
      </div>
    </motion.div>
  );
};

export default XPProgressBar;
