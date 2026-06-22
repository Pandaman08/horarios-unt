"use client";

import React from "react";
import { useDepartment } from "@/contexts/DepartmentContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DepartmentSelectorProps {
  className?: string;
  variant?: "default" | "compact";
}

export function DepartmentSelector({ className, variant = "default" }: DepartmentSelectorProps) {
  const {
    facultades,
    departamentos,
    facultadSeleccionada,
    departamentoSeleccionado,
    setFacultadSeleccionada,
    setDepartamentoSeleccionado,
    loading,
  } = useDepartment();

  if (loading) {
    return (
      <div className={cn("h-8 w-60 animate-pulse bg-muted rounded-lg", className)} />
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={facultadSeleccionada?.id || ""}
        onValueChange={async (value) => {
          const facultad = facultades.find((f) => f.id === value);
          if (facultad) {
            await setFacultadSeleccionada(facultad);
          }
        }}
      >
        <SelectTrigger 
          className={cn(
            "font-bold transition-all border-border shadow-sm",
            variant === "compact" ? "h-7 text-[10px] w-[140px] px-2" : "h-8 text-xs w-[160px]"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 className={cn(variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5", "shrink-0")} />
            <SelectValue placeholder="Facultad" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-xl">
          {facultades.map((f) => (
            <SelectItem 
              key={f.id} 
              value={f.id}
              className="text-[10px] font-bold"
            >
              <div className="flex items-center gap-2">
                <span>{f.codigo}</span>
                <span>{f.nombre}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={departamentoSeleccionado?.id || ""}
        onValueChange={(value) => {
          const departamento = departamentos.find((d) => d.id === value);
          if (departamento) {
            setDepartamentoSeleccionado(departamento);
          }
        }}
      >
        <SelectTrigger 
          className={cn(
            "font-bold transition-all border-border shadow-sm",
            variant === "compact" ? "h-7 text-[10px] w-[180px] px-2" : "h-8 text-xs w-[200px]"
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <Users className={cn(variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5", "shrink-0")} />
            <SelectValue placeholder="Departamento" />
          </div>
        </SelectTrigger>
        <SelectContent className="rounded-xl border-border shadow-xl">
          {departamentos.map((d) => (
            <SelectItem 
              key={d.id} 
              value={d.id}
              className="text-[10px] font-bold"
            >
              <span>{d.nombre}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
