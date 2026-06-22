"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  horaFin?: string | null;
  className?: string;
  variant?: "inline" | "card";
}

function parseTimeToToday(hora: string): Date {
  const [h, m] = hora.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m ?? 0, 0, 0);
  return d;
}

export function CountdownTimer(props: Readonly<CountdownTimerProps>) {
  const { horaFin, className, variant = "inline" } = props;
  const [remaining, setRemaining] = useState("00:00:00");

  useEffect(() => {
    const tick = () => {
      const end = horaFin
        ? parseTimeToToday(horaFin)
        : new Date(Date.now() + 2 * 60 * 60 * 1000 + 45 * 60 * 1000);
      const diff = Math.max(0, end.getTime() - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      );
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [horaFin]);

  if (variant === "card") {
    return (
      <div className="flex flex-col items-center justify-center bg-rose-50 border border-rose-100 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-rose-600" />
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">
            Tiempo Restante
          </span>
        </div>
        <div className={cn("text-3xl font-black text-rose-700 tracking-tighter tabular-nums", className)}>
          {remaining}
        </div>
      </div>
    );
  }

  return (
    <span className={className ?? "text-sm font-bold text-rose-500 tabular-nums"}>
      {remaining}
    </span>
  );
}
