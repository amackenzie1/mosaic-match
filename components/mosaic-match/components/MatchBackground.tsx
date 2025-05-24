"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import React from "react";

interface MatchBackgroundProps {
  children: React.ReactNode;
  isDark?: boolean;
  currentScheme: string;
}

/**
 * A reusable, themed background component for MosaicMatch feature
 * Provides consistent styling with animated gradients that respect the current theme
 */
export const MatchBackground: React.FC<MatchBackgroundProps> = ({
  children,
  isDark,
  currentScheme,
}) => {
  return (
    <div
      className={cn("relative min-h-screen", isDark ? "dark" : "")}
      data-theme={currentScheme}
    >
      {/* Base background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />

        {/* Gradient overlay with theme variables */}
        <div className="absolute inset-0 bg-gradient-radial from-[hsl(var(--chart-1)_/_0.15)] via-[hsl(var(--chart-2)_/_0.08)] to-background dark:from-[hsl(var(--chart-1)_/_0.25)] dark:via-[hsl(var(--chart-2)_/_0.15)] dark:to-background bg-[length:200%_200%] animate-[gradient_15s_ease_infinite]" />

        {/* Subtle animated patterns */}
        <motion.div
          className="absolute inset-0 opacity-30 dark:opacity-40 mix-blend-soft-light"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--chart-3)) 0%, transparent 50%), 
                             radial-gradient(circle at 75% 75%, hsl(var(--chart-1)) 0%, transparent 50%)`,
          }}
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      {children}
    </div>
  );
};

export default MatchBackground;