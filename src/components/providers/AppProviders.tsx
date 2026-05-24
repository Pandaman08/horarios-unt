"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { LocaleProvider } from "@/contexts/LocaleContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SessionProvider>
        <LocaleProvider>{children}</LocaleProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
