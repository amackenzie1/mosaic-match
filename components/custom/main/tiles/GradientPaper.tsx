"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface GradientPaperProps {
  children: React.ReactNode;
  className?: string;
}

export default function GradientPaper({
  children,
  className,
}: GradientPaperProps) {
  const { theme } = useTheme();

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-shadow hover:shadow-lg",
        "bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20",
        "bg-[length:200%_200%] animate-[gradient_3s_ease_infinite]",
        "pointer-events-auto",
        className
      )}
    >
      <div className="relative z-0 pointer-events-auto">{children}</div>
    </Card>
  );
}
