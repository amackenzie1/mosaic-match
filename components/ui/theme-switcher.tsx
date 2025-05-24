"use client";

import { getUserTheme, updateUserTheme } from "@/lib/utils/cognitoUpdater";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect } from "react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

const COLOR_SCHEMES = [
  { name: "Calligraphic", value: "calligraphic", color: "bg-zinc-400" },
  { name: "Royal", value: "royal", color: "bg-purple-500" },
  { name: "Pensive", value: "pensive", color: "bg-blue-500" },
  { name: "Cyberpunk", value: "cyberpunk", color: "bg-pink-500" },
  { name: "Gaia", value: "gaia", color: "bg-amber-700" },
  { name: "Emerald", value: "emerald", color: "bg-emerald-600" },
  { name: "Romance", value: "romance", color: "bg-rose-500" },
] as const;

const THEME_KEY = "mosaic-theme-preference";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isDark = theme?.includes("dark") ?? false;
  const currentScheme =
    theme?.replace("dark-", "").replace("light-", "") || "default";

  // Load user's theme preference on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        // Try to get theme from Cognito first
        const cognitoTheme = await getUserTheme();
        if (cognitoTheme) {
          setTheme(cognitoTheme);
          localStorage.setItem(THEME_KEY, cognitoTheme);
          return;
        }
      } catch (error) {
        // Cognito error likely means user is not authenticated
        console.log("Not authenticated or Cognito error:", error);
      }

      // Fall back to localStorage if Cognito fails or has no theme
      const localTheme = localStorage.getItem(THEME_KEY);
      if (localTheme) {
        setTheme(localTheme);
      } else {
        // Set default theme if none exists
        const defaultTheme = "dark-cyberpunk";
        setTheme(defaultTheme);
        localStorage.setItem(THEME_KEY, defaultTheme);
      }
    };
    loadTheme();
  }, [setTheme]);

  const setThemeWithMode = async (colorScheme: string, isDark: boolean) => {
    const newTheme =
      colorScheme === "default"
        ? isDark
          ? "dark"
          : "light"
        : `${isDark ? "dark" : "light"}-${colorScheme}`;

    setTheme(newTheme);

    // Always save to localStorage first
    localStorage.setItem(THEME_KEY, newTheme);

    // Try to save to Cognito, but don't block on it
    try {
      await updateUserTheme(newTheme);
    } catch (error) {
      // If Cognito fails, we still have the theme in localStorage
      console.log("Theme saved locally only:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-background text-foreground hover:bg-muted border border-border w-full h-10 justify-start gap-3 font-medium"
        >
          <div className="w-5 h-5 relative flex items-center justify-center">
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all absolute dark:-rotate-90 dark:scale-0" />
            <Moon className="h-5 w-5 rotate-90 scale-0 transition-all absolute dark:rotate-0 dark:scale-100" />
          </div>
          <span>Customize</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] p-0 bg-popover border-border"
        align="end"
      >
        <div className="px-4 py-3 bg-muted/50">
          <h3 className="text-lg font-semibold text-foreground">
            Theme Customizer
          </h3>
          <p className="text-sm text-muted-foreground">
            Customize your components colors.
          </p>
        </div>
        <DropdownMenuSeparator className="bg-border" />
        <div className="p-4 bg-popover">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 text-foreground">
                Color
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_SCHEMES.map((scheme) => (
                  <Button
                    key={scheme.value}
                    variant="outline"
                    className={`h-8 justify-start gap-2 truncate hover:bg-muted ${
                      currentScheme === scheme.value
                        ? "border-2 border-primary bg-primary/10"
                        : "border-border"
                    }`}
                    onClick={() => setThemeWithMode(scheme.value, isDark)}
                  >
                    <div
                      className={`h-4 w-4 shrink-0 rounded-full ${scheme.color} ring-1 ring-border`}
                    />
                    <span className="text-xs truncate text-foreground">
                      {scheme.name}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-3 text-foreground">Mode</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={!isDark ? "default" : "outline"}
                  className={`h-8 gap-2 ${
                    !isDark
                      ? "text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setThemeWithMode(currentScheme, false)}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={isDark ? "default" : "outline"}
                  className={`h-8 gap-2 ${
                    isDark
                      ? "text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setThemeWithMode(currentScheme, true)}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
