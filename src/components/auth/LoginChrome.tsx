"use client";

import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSelector } from "@/components/layout/LanguageSelector";

export function LoginChrome() {
  return (
    <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
      <ThemeToggle />
      <LanguageSelector />
    </div>
  );
}
