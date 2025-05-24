"use client";

import { ThemeProvider } from "next-themes";
import "./themes/index.css";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <ThemeProvider
        attribute="data-theme"
        defaultTheme="light"
        enableSystem={false}
        value={{
          light: "light",
          dark: "dark",
        }}
      >
        {children}
      </ThemeProvider>
    </ThemeProvider>
  );
}
