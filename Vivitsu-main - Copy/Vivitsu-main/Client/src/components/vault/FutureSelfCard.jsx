import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { futureSelfMessages } from "@/mock/data";

export const FutureSelfCard = () => {
  // Select message based on current date (so it changes daily)
  const message = useMemo(() => {
    const day = new Date().getDate();
    return futureSelfMessages[day % futureSelfMessages.length];
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700/50"
    >
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="text-2xl mb-3">💭</div>
        <p className="text-sm italic txt text-center leading-relaxed">
          {message}
        </p>
        <motion.div
          className="mt-3 flex justify-center gap-1"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs txt-dim">✨</span>
          <span className="text-xs txt-dim">Your future is bright</span>
          <span className="text-xs txt-dim">✨</span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default FutureSelfCard;
