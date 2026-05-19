"use client";

import { useState, useEffect } from "react";
import { DashboardStats } from "@/components/dashboard/DashboardStats";


import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";
import { 
  BarChart3, 
  LayoutDashboard,
  ChevronDown
} from "lucide-react";

import { useSession } from "next-auth/react";

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
    <div className="p-4 sm:p-8 max-w-[1800px] mx-auto space-y-6 lg:space-y-10 pb-10 lg:pb-20">
      {/* Bienvenida Institucional */}
      <div className="relative overflow-hidden bg-[#003366] rounded-3xl lg:rounded-[40px] p-6 lg:p-10 text-white shadow-2xl shadow-blue-900/20">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-3 lg:space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <span className="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-blue-100">Sistema Operativo</span>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight">
              ¡Buen día, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                {session?.user?.name?.split(' ')[0]}!
              </span>
            </h1>
            <p className="text-blue-100/70 font-medium text-sm lg:text-lg max-w-xl">
              Bienvenido al portal de gestión académica. Aquí podrás coordinar los horarios y ambientes para el periodo lectivo actual.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-xl p-6 lg:p-8 rounded-2xl lg:rounded-[32px] border border-white/10 shadow-2xl w-full xl:min-w-[300px] xl:w-auto">
            <p className="text-xs font-black text-blue-300 uppercase tracking-widest mb-3 lg:mb-4">Periodo Académico</p>
            <div className="relative">
              <select 
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                className="w-full bg-[#002244] border-2 border-white/10 rounded-xl lg:rounded-2xl px-5 py-3 lg:py-4 text-white font-bold outline-none focus:border-yellow-400 transition-all appearance-none cursor-pointer"
              >
                {periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-blue-300">
                <ChevronDown className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6 lg:space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2 relative z-20">
          <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
            <TabsList className="bg-white p-1.5 rounded-xl lg:rounded-2xl border border-gray-100 shadow-sm h-auto flex flex-row min-w-max sm:min-w-0">
              <TabsTrigger 
                value="overview" 
                className="px-4 lg:px-6 py-2.5 lg:py-3 rounded-lg lg:rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-xs lg:text-sm flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <BarChart3 className="h-4 w-4" /> Resumen General
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="overview" className="animate-in fade-in slide-in-from-bottom-4 duration-700 outline-none">
          {selectedPeriodo && (
            <DashboardStats id_periodo={parseInt(selectedPeriodo)} />
          )}
        </TabsContent>
      </Tabs>
      <Toaster position="top-right" richColors />
    </div>
  );
}
