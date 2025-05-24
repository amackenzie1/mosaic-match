"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Typewriter from "./Typewriter";

interface MatchIntroductionProps {
  onFindYourTile: () => void;
}

const MatchIntroduction: React.FC<MatchIntroductionProps> = ({
  onFindYourTile,
}) => {
  // Array of mosaic patterns for the grid
  const grid = Array.from({ length: 36 }).map((_, index) => ({
    id: index,
    delay: Math.random() * 0.5,
    highlight: Math.random() > 0.7,
  }));

  // For periodic highlight changes
  const [highlightCycle, setHighlightCycle] = useState(0);

  useEffect(() => {
    // Change pattern every 4 seconds
    const interval = setInterval(() => {
      setHighlightCycle((prev) => prev + 1);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 md:py-16">
      {/* Main Title - Above everything */}
      <motion.h1
        className="text-4xl sm:text-5xl md:text-6xl font-serif text-center mb-10 font-medium tracking-tight"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        <Typewriter text="Mosaic Match" delay={120} />
      </motion.h1>

      <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 lg:gap-12">
        {/* Left side: Mosaic grid */}
        <motion.div
          className="w-full max-w-sm lg:w-5/12 lg:max-w-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.5 }}
        >
          <div className="relative aspect-square bg-card dark:bg-card border border-border rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-6 gap-1 h-full pb-8">
              {grid.map((tile) => (
                <motion.div
                  key={tile.id}
                  className={`rounded-sm bg-background dark:bg-background border ${
                    (tile.highlight && highlightCycle % 2 === 0) ||
                    (!tile.highlight && highlightCycle % 2 === 1)
                      ? "border-primary/50 dark:border-primary/60"
                      : "border-border"
                  }`}
                  animate={{
                    backgroundColor:
                      (tile.highlight && highlightCycle % 2 === 0) ||
                      (!tile.highlight && highlightCycle % 2 === 1)
                        ? [
                            "hsl(var(--background))",
                            "hsl(var(--primary) / 0.12)",
                            "hsl(var(--background))",
                          ]
                        : "hsl(var(--background))",
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeInOut",
                    delay: tile.delay,
                  }}
                />
              ))}
            </div>

            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
              <div className="text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-3 py-1 rounded-full">
                <motion.span
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Matching compatible tiles...
                </motion.span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right side: Content */}
        <div className="w-full lg:w-7/12 space-y-6 text-center lg:text-left">
          <div className="space-y-4 text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 font-serif">
            <motion.p
              className="font-medium text-foreground text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 2.0 }}
            >
              <Typewriter
                text="Among billions of people in the world, there are countless connections waiting to happen—friendships and relationships that would flourish if only those people could meet."
                delay={15}
              />
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 3.5 }}
            >
              <Typewriter
                text="We built Mosaic Match to help these connections become reality. By analyzing how you naturally communicate, we can find people you'd genuinely connect with—people who 'get you' from the very first conversation."
                delay={10}
              />
            </motion.p>
          </div>

          {/* CTA Button */}
          <motion.div
            className="pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 5.0 }}
          >
            <Button
              onClick={onFindYourTile}
              className="text-base font-medium h-12 px-8 gap-2 group"
              size="lg"
            >
              <span>Find Your Match</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <p className="text-xs text-muted-foreground mt-3">
              By continuing, you agree to our{" "}
              <Link
                href="/terms-of-service"
                className="text-primary hover:underline"
              >
                Terms
              </Link>{" "}
              &{" "}
              <Link
                href="/privacy-policy"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default MatchIntroduction;
