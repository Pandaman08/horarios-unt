"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";

import { VisorReportes } from "@/components/reportes/VisorReportes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { 
  BarChart3, 
  LayoutDashboard,
  FileText
} from "lucide-react";

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
          // Si no hay seleccionado uno, o el seleccionado no existe en la data nueva, elegir el primero
          setSelectedPeriodo(prev => {
            const exists = data.find(p => p.id_periodo.toString() === prev);
            return exists ? prev : data[0].id_periodo.toString();
          });
        }
      } else {
        console.error("Data de periodos no es un array:", data);
        setPeriodos([]);
      }
    } catch (error) {
      console.error("Error al cargar periodos:", error);
      toast.error("Error al cargar periodos");
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" /> Resumen
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <FileText className="mr-2 h-4 w-4" /> Reportes
            </TabsTrigger>

          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {selectedPeriodo && (
            <DashboardStats id_periodo={parseInt(selectedPeriodo)} />
          )}
        </TabsContent>

        <TabsContent value="reports">
          {selectedPeriodo && (
            <VisorReportes id_periodo={parseInt(selectedPeriodo)} />
          )}
        </TabsContent>


      </Tabs>
      <Toaster />
    </div>
  );
}
