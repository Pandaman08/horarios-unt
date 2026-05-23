"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardPrincipal() {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    try {
      const res = await fetch("/api/periodos");
      const data = await res.json();

      if (Array.isArray(data)) {
        setPeriodos(data);
        if (data.length > 0) {
          setSelectedPeriodo((prev) => {
            const exists = data.find((p) => p.id_periodo.toString() === prev);
            return exists ? prev : data[0].id_periodo.toString();
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar periodos:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-6 w-full overflow-x-hidden">
      {selectedPeriodo && (
        <DashboardStats
          id_periodo={parseInt(selectedPeriodo)}
          periodos={periodos}
          onPeriodoChange={setSelectedPeriodo}
          selectedPeriodo={selectedPeriodo}
        />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
