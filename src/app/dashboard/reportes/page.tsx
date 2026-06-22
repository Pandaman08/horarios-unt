"use client";

import { VisorReportes } from "@/components/reportes/VisorReportes";
import { Toaster } from "@/components/ui/sonner";
import { FileText } from "lucide-react";

export default function ReportesPage() {
  return (
    <div className="p-4 md:p-6 max-w-[1800px] mx-auto space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Header Institucional de Reportes Estilo Moderno */}
      <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div>
            <span className="text-[10px] bg-primary/10 text-primary uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg">Centro de Documentación</span>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-2">Reportes Oficiales</h1>
            <p className="text-muted-foreground text-xs mt-1">Generación y visualización de reportes académicos por periodo</p>
          </div>
        </div>
      </div>

      <div className="animate-in fade-in duration-700 slide-in-from-bottom-4">
        <VisorReportes />
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
