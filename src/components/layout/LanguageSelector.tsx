"use client";

import { useState, useRef, useEffect } from "react";
import { Languages, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";
import { LOCALES, type Locale } from "@/lib/i18n/translations";

export function LanguageSelector({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LOCALES.find((l) => l.code === locale);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="h-8 flex items-center gap-1.5 px-2 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-xs font-medium"
        title={t("language")}
        aria-label={t("language")}
      >
        <Languages className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">{current?.flag}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-40 py-1 bg-popover border border-border rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {t("language")}
          </p>
          {LOCALES.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => {
                setLocale(item.code as Locale);
                setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted transition-colors",
                locale === item.code && "bg-muted/80 font-semibold"
              )}
            >
              <span>{item.flag}</span>
              <span className="flex-1 text-left">{item.label}</span>
              {locale === item.code && (
                <Check className="h-3 w-3 text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
