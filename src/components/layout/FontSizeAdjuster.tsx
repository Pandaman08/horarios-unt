"use client";

import { useEffect, useState } from "react";
import { Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

const FONT_SIZES = [
  { label: "Pequeño", value: "12px", key: "sm" },
  { label: "Normal", value: "14px", key: "md" },
  { label: "Grande", value: "16px", key: "lg" },
  { label: "Extra", value: "18px", key: "xl" },
];

export function FontSizeAdjuster({ className }: { className?: string }) {
  const { t } = useLocale();
  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState("16px");

  useEffect(() => {
    const saved = localStorage.getItem("font-size") || "16px";
    setFontSize(saved);
    document.documentElement.style.setProperty("--font-size-base", saved);
    setMounted(true);
  }, []);

  const cycleFontSize = () => {
    const currentIndex = FONT_SIZES.findIndex((f) => f.value === fontSize);
    const nextIndex = (currentIndex + 1) % FONT_SIZES.length;
    const nextSize = FONT_SIZES[nextIndex].value;
    
    setFontSize(nextSize);
    localStorage.setItem("font-size", nextSize);
    document.documentElement.style.setProperty("--font-size-base", nextSize);
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={cycleFontSize}
      className={cn(
        "h-8 px-2 flex items-center gap-1.5 rounded-lg border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
        className
      )}
      title={t("fontSizeDesc")}
      aria-label={t("fontSizeDesc")}
    >
      <Type className="h-3.5 w-3.5" />
      <span className="text-xs font-bold uppercase w-4">
        {FONT_SIZES.find(f => f.value === fontSize)?.key}
      </span>
    </button>
  );
}
