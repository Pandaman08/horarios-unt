"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";

interface KpiConflictosPendientesProps {
  periodoId: number;
}

export function KpiConflictosPendientes({ periodoId }: KpiConflictosPendientesProps) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const fetchPendientes = async () => {
    try {
      const res = await fetch(`/api/conflictos/pendientes?periodoId=${periodoId}`);
      const data = await res.json();
      setCount(data.count || 0);
    } catch (error) {
      console.error("Error al cargar KPI de conflictos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (periodoId) {
      fetchPendientes();
    }
  }, [periodoId]);

  // Escuchar nuevos conflictos para actualizar el contador
  useWebSocket("nuevo_conflicto", (data) => {
    if (data.id_periodo === periodoId) {
      setCount(prev => prev + 1);
    }
  });

  // Escuchar cuando un conflicto se resuelve (asumiendo que existirá este evento)
  useWebSocket("conflicto_resuelto", (data) => {
    if (data.id_periodo === periodoId) {
      setCount(prev => Math.max(0, prev - 1));
    }
  });

  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Conflictos Pendientes</p>
          <h3 className="text-2xl font-bold">{loading ? "..." : count}</h3>
        </div>
        <div className="bg-red-100 p-3 rounded-lg">
          <AlertTriangle className="h-6 w-6 text-red-600" />
        </div>
      </CardContent>
    </Card>
  );
}
