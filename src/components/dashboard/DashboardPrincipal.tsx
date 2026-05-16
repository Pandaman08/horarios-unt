"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DocenteList } from "@/components/docentes/DocenteList";
import { CursoList } from "@/components/cursos/CursoList";
import { AmbienteList } from "@/components/ambientes/AmbienteList";
import { PeriodoList } from "@/components/periodos/PeriodoList";
import { GrupoList } from "@/components/grupos/GrupoList";
import { ConfiguradorVentanas } from "@/components/ventanas/ConfiguradorVentanas";
import { VisorReportes } from "@/components/reportes/VisorReportes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { 
  BarChart3, 
  Settings, 
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
      setPeriodos(data);
      if (data.length > 0) {
        setSelectedPeriodo(data[0].id_periodo.toString());
      }
    } catch (error) {
      console.error("Error al cargar periodos");
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
            <TabsTrigger value="config" className="flex items-center">
              <Settings className="mr-2 h-4 w-4" /> Configuración
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

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Mantenimiento de Catálogos</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="docentes" className="w-full">
                <TabsList className="grid w-full grid-cols-6 mb-8">
                  <TabsTrigger value="docentes">Docentes</TabsTrigger>
                  <TabsTrigger value="cursos">Cursos</TabsTrigger>
                  <TabsTrigger value="ambientes">Ambientes</TabsTrigger>
                  <TabsTrigger value="periodos">Periodos</TabsTrigger>
                  <TabsTrigger value="grupos">Grupos</TabsTrigger>
                  <TabsTrigger value="ventanas">Ventanas</TabsTrigger>
                </TabsList>
                <TabsContent value="docentes">
                  <DocenteList />
                </TabsContent>
                <TabsContent value="cursos">
                  <CursoList />
                </TabsContent>
                <TabsContent value="ambientes">
                  <AmbienteList />
                </TabsContent>
                <TabsContent value="periodos">
                  <PeriodoList />
                </TabsContent>
                <TabsContent value="grupos">
                  <GrupoList />
                </TabsContent>
                <TabsContent value="ventanas">
                  <ConfiguradorVentanas />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <Toaster />
    </div>
  );
}
