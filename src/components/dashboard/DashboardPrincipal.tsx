"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { 
  BarChart3, 
  LayoutDashboard,
  ChevronDown,
  Database,
  Users,
  BookOpen,
  MapPin,
  Calendar,
  Layers,
  Layout
} from "lucide-react";

import { useSession } from "next-auth/react";
import { DocenteList } from "@/components/docentes/DocenteList";
import { CursoList } from "@/components/cursos/CursoList";
import { AmbienteList } from "@/components/ambientes/AmbienteList";
import { PeriodoList } from "@/components/periodos/PeriodoList";
import { GrupoList } from "@/components/grupos/GrupoList";
import { ConfiguradorVentanas } from "@/components/ventanas/ConfiguradorVentanas";
import { UsuarioList } from "@/components/usuarios/UsuarioList";

function CatalogosTabContent() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.rol === 'administrador_sistema';

  return (
    <Tabs defaultValue="docentes" className="w-full">
      <div className="px-4 pt-4">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-gray-50/50 p-1 rounded-lg border border-gray-100 w-full sm:w-auto">
          <TabsTrigger value="docentes" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
            <Users className="h-3.5 w-3.5" /> Docentes
          </TabsTrigger>
          <TabsTrigger value="cursos" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
            <BookOpen className="h-3.5 w-3.5" /> Cursos
          </TabsTrigger>
          <TabsTrigger value="ambientes" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
            <MapPin className="h-3.5 w-3.5" /> Ambientes
          </TabsTrigger>
          <TabsTrigger value="periodos" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
            <Calendar className="h-3.5 w-3.5" /> Periodos
          </TabsTrigger>
          <TabsTrigger value="grupos" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
            <Layers className="h-3.5 w-3.5" /> Grupos
          </TabsTrigger>
          <TabsTrigger value="ventanas" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
            <Layout className="h-3.5 w-3.5" /> Ventanas
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="usuarios" className="flex items-center gap-1.5 px-4 py-1.5 rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-md transition-all font-bold text-xs">
              <ShieldCheck className="h-3.5 w-3.5" /> Usuarios
            </TabsTrigger>
          )}
        </TabsList>
      </div>

      <div className="p-4">
        <TabsContent value="docentes" className="mt-0 focus-visible:outline-none outline-none">
          <DocenteList />
        </TabsContent>
        <TabsContent value="cursos" className="mt-0 focus-visible:outline-none outline-none">
          <CursoList />
        </TabsContent>
        <TabsContent value="ambientes" className="mt-0 focus-visible:outline-none outline-none">
          <AmbienteList />
        </TabsContent>
        <TabsContent value="periodos" className="mt-0 focus-visible:outline-none outline-none">
          <PeriodoList />
        </TabsContent>
        <TabsContent value="grupos" className="mt-0 focus-visible:outline-none outline-none">
          <GrupoList />
        </TabsContent>
        <TabsContent value="ventanas" className="mt-0 focus-visible:outline-none outline-none">
          <ConfiguradorVentanas />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="usuarios" className="mt-0 focus-visible:outline-none outline-none">
            <UsuarioList />
          </TabsContent>
        )}
      </div>
    </Tabs>
  );
}

export default function DashboardPrincipal() {
  const { data: session } = useSession();
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
          setSelectedPeriodo(prev => {
            const exists = data.find(p => p.id_periodo.toString() === prev);
            return exists ? prev : data[0].id_periodo.toString();
          });
        }
      }
    } catch (error) {
      console.error("Error al cargar periodos:", error);
    }
  };

  return (
    <div className="p-4 max-w-[1800px] mx-auto space-y-4 pb-8">
      {/* Bienvenida Institucional Balanceada */}
      <div className="relative overflow-hidden bg-[#003366] rounded-xl p-6 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex h-14 w-14 bg-white/10 rounded-xl items-center justify-center border border-white/10">
              <LayoutDashboard className="h-7 w-7 text-blue-200" />
            </div>
            <div>
              <h1 className="text-[24px] font-black tracking-tight leading-none">
                ¡Hola, <span className="text-blue-200">{session?.user?.name?.split(' ')[0]}</span>!
              </h1>
              <p className="text-blue-100/60 font-medium text-[14px] mt-2">
                Portal de Gestión Académica - Universidad Nacional de Trujillo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md p-3 rounded-xl border border-white/10">
            <span className="text-[12px] font-black text-blue-300 uppercase tracking-widest ml-1">Periodo Académico:</span>
            <div className="relative min-w-[200px]">
              <select 
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                className="w-full bg-[#002244] border border-white/10 rounded-xl px-4 py-2.5 text-[14px] text-white font-bold outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer"
              >
                {periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-300 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        {selectedPeriodo && (
          <DashboardStats id_periodo={parseInt(selectedPeriodo)} />
        )}
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
