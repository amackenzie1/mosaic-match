"use client";

import { createTheme } from "@mui/material/styles";
import {
  Comfortaa,
  Dancing_Script,
  Inter,
  JetBrains_Mono,
  Playfair_Display,
  Poppins,
} from "next/font/google";

// Initialize fonts
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const comfortaa = Comfortaa({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-comfortaa",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dancing-script",
});

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

export const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-poppins",
});

// Define theme
export const theme = createTheme({
  palette: {
    primary: {
      main: "#3B82F6",
    },
    secondary: {
      main: "#10B981",
    },
  },
  typography: {
    fontFamily: inter.style.fontFamily,
    h1: {
      fontFamily: comfortaa.style.fontFamily,
      fontWeight: 700,
    },
    h2: {
      fontFamily: comfortaa.style.fontFamily,
      fontWeight: 600,
    },
    h3: {
      fontFamily: comfortaa.style.fontFamily,
      fontWeight: 500,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
    subtitle2: {
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.43,
    },
    button: {
      textTransform: "none",
      fontWeight: 500,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.66,
    },
    overline: {
      fontSize: "0.75rem",
      textTransform: "uppercase",
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});
