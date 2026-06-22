"use client";

import React from "react";
import { usePeriodo } from "@/contexts/PeriodoContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PeriodoSelectorProps {
  className?: string;
  variant?: "default" | "compact";
}

export function PeriodoSelector({ className, variant = "default" }: PeriodoSelectorProps) {
  const { periodos, periodoSeleccionado, setPeriodoSeleccionado, loading } = usePeriodo();

  if (loading) {
    return (
      <div className={cn("h-8 w-40 animate-pulse bg-muted rounded-lg", className)} />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={periodoSeleccionado?.id_periodo.toString()}
        onValueChange={(value) => {
          const periodo = periodos.find((p) => p.id_periodo.toString() === value);
          if (periodo) setPeriodoSeleccionado(periodo);
        }}
      >
        <SelectTrigger 
          className={cn(
            "font-bold transition-all border-border shadow-sm",
            variant === "compact" ? "h-7 text-[10px] w-[140px] px-2" : "h-8 text-xs w-[180px]",
            periodoSeleccionado?.activo 
              ? "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" 
              : "bg-muted/50 text-muted-foreground hover:bg-muted"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Calendar className={cn(variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5", "shrink-0")} />
            <SelectValue placeholder="Periodo" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-xl">
          {periodos.map((p) => (
            <SelectItem 
              key={p.id_periodo} 
              value={p.id_periodo.toString()}
              className="text-[10px] font-bold"
            >
              <div className="flex items-center gap-2">
                <span>{p.codigo}</span>
                {p.activo && (
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-600 px-1 rounded uppercase tracking-tighter">
                    Activo
                  </span>
                )}
                {p.estado === 'finalizado' && (
                  <span className="text-[8px] bg-muted text-muted-foreground px-1 rounded uppercase tracking-tighter">
                    Finalizado
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {periodoSeleccionado && !periodoSeleccionado.activo && variant === "default" && (
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-600 rounded-md border border-amber-500/20 text-[9px] font-black uppercase tracking-wider animate-in fade-in zoom-in duration-300">
          <AlertCircle className="h-3 w-3" />
          <span>Modo Lectura</span>
        </div>
      )}
    </div>
  );
}
