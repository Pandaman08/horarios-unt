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
    <div className="space-y-6 lg:space-y-8 pb-10">
      <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <FileText className="h-6 w-6" />
            </div>
            Reportes Oficiales
          </h1>
          <p className="text-gray-500 mt-2 font-medium">
            Generación y visualización de reportes académicos por periodo.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 w-full md:min-w-[250px] md:w-auto">
          <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Periodo Académico</p>
          <div className="relative">
            <select 
              value={selectedPeriodo}
              onChange={(e) => setSelectedPeriodo(e.target.value)}
              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-2.5 text-gray-900 font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
            >
              {periodos.map(p => (
                <option key={p.id_periodo} value={p.id_periodo}>{p.nombre}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {selectedPeriodo && (
        <VisorReportes id_periodo={parseInt(selectedPeriodo)} />
      )}
      <Toaster position="top-right" richColors />
    </div>
  );
}
