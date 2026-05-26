"use client";

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Toaster } from "@/components/ui/sonner";
import { usePeriodo } from "@/contexts/PeriodoContext";

export default function DashboardPrincipal() {
  const { periodoSeleccionado, periodos, loading } = usePeriodo();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-6 w-full overflow-x-hidden">
      {periodoSeleccionado ? (
        <DashboardStats
          id_periodo={periodoSeleccionado.id_periodo}
          periodos={periodos}
          selectedPeriodo={periodoSeleccionado.id_periodo.toString()}
        />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground bg-muted/20 rounded-3xl border-2 border-dashed border-border">
          <p className="font-bold">No hay un período académico seleccionado o activo.</p>
          <p className="text-xs">Por favor, seleccione uno en la barra superior.</p>
        </div>
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
