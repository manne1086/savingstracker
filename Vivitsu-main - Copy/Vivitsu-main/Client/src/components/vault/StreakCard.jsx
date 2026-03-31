import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

const keyframes = `
  @keyframes flicker {
    0%, 18%, 22%, 25%, 54%, 56%, 100% {
      text-shadow: 0 0 6px rgba(255, 87, 34, 0.7),
                   0 0 10px rgba(255, 87, 34, 0.5);
      transform: scale(1) rotate(0deg);
    }
    20%, 24%, 55% {
      text-shadow: 0 0 10px rgba(255, 143, 87, 0.8),
                   0 0 20px rgba(255, 87, 34, 0.6),
                   0 0 30px rgba(255, 200, 100, 0.4);
      transform: scale(1.05) rotate(-1deg);
    }
  }

  @keyframes pulseGlow {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
    }
    50% {
      box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
    }
  }

  .streak-flame {
    animation: flicker 2s infinite;
    display: inline-block;
  }

  .streak-card-warning {
    animation: pulseGlow 2s infinite;
  }
`;

export const StreakCard = ({ 
  streak = 12, 
  isWarning = false,
  hoursUntilBreak = null 
}) => {
  const [styleTag, setStyleTag] = useState(null);

  useEffect(() => {
    // Inject animation styles
    const style = document.createElement("style");
    style.textContent = keyframes;
    document.head.appendChild(style);
    setStyleTag(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const streakLevel = streak >= 7 ? "gold" : streak >= 1 ? "orange" : "gray";
  const flameSize = streak >= 7 ? "text-5xl" : "text-4xl";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className={`
        p-6 rounded-lg border-2 transition-all
        ${isWarning 
          ? "border-red-500 bg-red-50 dark:bg-red-950/20 streak-card-warning" 
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold txt">Your Streak</h3>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
          streakLevel === "gold"
            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            : streakLevel === "orange"
            ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
        }`}>
          {streakLevel === "gold" ? "🔥 On Fire!" : streakLevel === "orange" ? "🔥 Hot!" : "⏳ Getting Started"}
        </span>
      </div>

      <div className="flex items-end gap-4">
        <div className={`${flameSize} streak-flame`}>🔥</div>
        <div>
          <div className="text-4xl font-bold txt">{streak}</div>
          <div className="text-sm txt-dim">Days</div>
        </div>
      </div>

      <div className="mt-4 text-sm txt-dim">
        {streak > 0 ? "Keep it going!" : "Start your journey today!"}
      </div>

      {isWarning && hoursUntilBreak && (
        <motion.div
          className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded flex items-center gap-2"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <span>⚠️</span>
          <span>Streak breaks in {hoursUntilBreak} hours! Deposit today to save it.</span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default StreakCard;
