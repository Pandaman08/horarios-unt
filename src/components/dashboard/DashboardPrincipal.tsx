"use client";

import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Toaster } from "@/components/ui/sonner";
import { usePeriodo } from "@/contexts/PeriodoContext";

export default function DashboardPrincipal() {
  const { periodoSeleccionado, periodos } = usePeriodo();

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-6 w-full overflow-x-hidden">
      {periodoSeleccionado && (
        <DashboardStats
          id_periodo={periodoSeleccionado.id_periodo}
          periodos={periodos}
          selectedPeriodo={periodoSeleccionado.id_periodo.toString()}
        />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
