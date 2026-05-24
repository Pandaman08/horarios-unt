"use client";

import { useState, useEffect } from "react";
import { VisorReportes } from "@/components/reportes/VisorReportes";
import { Toaster } from "@/components/ui/sonner";
import { ChevronDown, FileText } from "lucide-react";

export default function ReportesPage() {
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
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Header Institucional de Reportes Estilo Moderno */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <FileText className="h-7 w-7 text-[#1a237e]" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-50 text-[#1a237e] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg">Centro de Documentación</span>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mt-2">Reportes Oficiales</h1>
            <p className="text-slate-500 text-xs mt-1">Generación y visualización de reportes académicos por periodo</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full md:w-auto">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Periodo Académico</span>
            <div className="relative min-w-[200px] mt-1">
              <select 
                value={selectedPeriodo}
                onChange={(e) => setSelectedPeriodo(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-700 font-bold outline-none focus:ring-2 focus:ring-[#1a237e] transition-all appearance-none cursor-pointer"
              >
                {periodos.map(p => (
                  <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
        {selectedPeriodo && (
          <VisorReportes id_periodo={parseInt(selectedPeriodo)} />
        )}
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
