import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface ThemeColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export function useThemeColors() {
  const { theme } = useTheme();
  const [colors, setColors] = useState<ThemeColors>({
    chart1: "",
    chart2: "",
    chart3: "",
    chart4: "",
    chart5: "",
  });

  useEffect(() => {
    const updateColors = () => {
      const [mode, color] = (theme || "").split("-");
      const root = document.documentElement;
      const prevTheme = root.getAttribute("data-theme");
      const prevMode = root.classList.contains("dark") ? "dark" : "light";

      // Prepare new theme before applying
      const style = document.createElement("style");
      if (color) {
        style.textContent = `
          :root[data-theme="${color}"] {
            color-scheme: ${mode};
          }
        `;
      }
      document.head.appendChild(style);

      // Apply new theme in a single paint
      requestAnimationFrame(() => {
        if (color) {
          root.setAttribute("data-theme", color);
          if (mode === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
          } else {
            root.classList.remove("dark");
            root.classList.add("light");
          }
        } else {
          if (prevTheme) root.removeAttribute("data-theme");
          if (mode === "dark") {
            root.classList.add("dark");
            root.classList.remove("light");
          } else {
            root.classList.remove("dark");
            root.classList.add("light");
          }
        }

        // Get computed colors after theme is applied
        const getHSLValue = (variable: string) => {
          const value = getComputedStyle(root)
            .getPropertyValue(variable)
            .trim();
          return value ? `hsl(${value})` : "";
        };

        setColors({
          chart1: getHSLValue("--chart-1"),
          chart2: getHSLValue("--chart-2"),
          chart3: getHSLValue("--chart-3"),
          chart4: getHSLValue("--chart-4"),
          chart5: getHSLValue("--chart-5"),
        });

        // Cleanup temporary style
        document.head.removeChild(style);
      });
    };

    updateColors();
  }, [theme]);

  return colors;
}
