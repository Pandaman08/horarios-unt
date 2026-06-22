"use client";

import { ThemeProvider } from "next-themes";
import { SessionProvider } from "@/components/auth/SessionProvider";
import { LocaleProvider } from "@/contexts/LocaleContext";
import { PeriodoProvider } from "@/contexts/PeriodoContext";
import { DepartmentProvider } from "@/contexts/DepartmentContext";
import { Toaster } from "@/components/ui/sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <SessionProvider>
        <LocaleProvider>
          <DepartmentProvider>
            <PeriodoProvider>
              {children}
              <Toaster position="top-right" richColors closeButton />
            </PeriodoProvider>
          </DepartmentProvider>
        </LocaleProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
