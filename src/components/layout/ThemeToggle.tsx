"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button
        type="button"
        className={cn(
          "h-8 w-8 rounded-lg border border-border bg-muted/50",
          className
        )}
        aria-hidden
      />
    );
  }

  const isDark = (resolvedTheme ?? theme) === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "h-8 w-8 flex items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className
      )}
      title={isDark ? t("themeLight") : t("themeDark")}
      aria-label={isDark ? t("themeLight") : t("themeDark")}
    >
      {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}
