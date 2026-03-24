"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Do NOT use 'mounted' state logic here.
  // next-themes handles the script injection internally.
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
