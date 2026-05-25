"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { PeriodoProvider } from "@/contexts/PeriodoContext";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SessionProvider>
        <LocaleProvider>
          <PeriodoProvider>{children}</PeriodoProvider>
        </LocaleProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
