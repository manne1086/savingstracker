import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export const CircularProgress = ({ 
  percentage = 67, 
  current = 6700, 
  target = 10000,
  size = 200,
  strokeWidth = 12,
  primaryColor = "#ef4444",
}) => {
  const svgRef = useRef(null);
  const circumference = 2 * Math.PI * ((size - strokeWidth) / 2);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const circle = svg.querySelector("circle.progress-circle");
    if (circle) {
      const offset = circumference - (percentage / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }
  }, [percentage, circumference]);

  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.svg
        ref={svgRef}
        width={size}
        height={size}
        className="transform -rotate-90"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />

        {/* Progress circle (animated) */}
        <circle
          className="progress-circle transition-all duration-1500 ease-out"
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          strokeLinecap="round"
        />
      </motion.svg>

      {/* Text content */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className="text-3xl font-bold txt">{percentage}%</div>
        <div className="text-sm txt-dim">
          {current.toLocaleString()} / {target.toLocaleString()} ALGO
        </div>
      </motion.div>
    </div>
  );
};

export default CircularProgress;
