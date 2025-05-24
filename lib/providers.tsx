"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";
import { GeneralInfoProvider } from "./contexts/general-info";
import AmplifyProvider from "./providers/amplify";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      themes={[
        "light",
        "dark",
        "light-zinc",
        "dark-zinc",
        "light-red",
        "dark-red",
        "light-rose",
        "dark-rose",
        "light-orange",
        "dark-orange",
        "light-green",
        "dark-green",
        "light-blue",
        "dark-blue",
        "light-yellow",
        "dark-yellow",
        "light-violet",
        "dark-violet",
        "light-romance",
        "dark-romance",
      ]}
    >
      <AmplifyProvider>
        <GeneralInfoProvider>{children}</GeneralInfoProvider>
      </AmplifyProvider>
    </ThemeProvider>
  );
}
