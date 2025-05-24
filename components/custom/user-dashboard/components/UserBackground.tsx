"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface UserBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

// For individual content sections (MainContent)
export function ContentBackground({
  children,
  className,
}: UserBackgroundProps) {
  const { theme } = useTheme();

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-500",
        "bg-gradient-to-br from-[hsl(var(--chart-1)_/_0.02)] via-[hsl(var(--chart-2)_/_0.02)] to-background",
        "dark:from-background/50 dark:via-muted/5 dark:to-background/50",
        "border-none shadow-none",
        "after:absolute after:inset-0 after:z-10 after:bg-background/50 after:backdrop-blur-[2px]",
        "before:absolute before:inset-0 before:z-0",
        "before:bg-[radial-gradient(circle_at_0%_0%,_transparent_0%,_hsl(var(--chart-1))_90%)]",
        "before:opacity-[0.02] dark:before:opacity-[0.07]",
        className
      )}
    >
      <div className="relative z-20">{children}</div>
    </Card>
  );
}

// For the entire dashboard background
export function DashboardBackground({
  children,
  className,
}: UserBackgroundProps) {
  const { theme } = useTheme();
  const isDark = theme?.includes("dark");
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  return (
    <div
      className={cn("relative", isDark ? "dark" : "", className)}
      data-theme={currentScheme}
    >
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--chart-1)_/_0.08)] via-[hsl(var(--chart-2)_/_0.08)] to-[hsl(var(--chart-3)_/_0.08)] dark:from-[hsl(var(--chart-1)_/_0.2)] dark:via-[hsl(var(--chart-2)_/_0.2)] dark:to-[hsl(var(--chart-3)_/_0.2)] bg-[length:200%_200%] animate-[gradient_3s_ease_infinite]" />
      </div>
      {children}
    </div>
  );
}
