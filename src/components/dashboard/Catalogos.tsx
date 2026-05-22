"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DocenteList } from "@/components/docentes/DocenteList";
import { CursoList } from "@/components/cursos/CursoList";
import { CicloList } from "@/components/ciclos/CicloList";
import { AmbienteList } from "@/components/ambientes/AmbienteList";
import { PeriodoList } from "@/components/periodos/PeriodoList";
import { GrupoList } from "@/components/grupos/GrupoList";
import { ConfiguradorVentanas } from "@/components/ventanas/ConfiguradorVentanas";
import { Toaster } from "@/components/ui/sonner";
import { Database } from "lucide-react";
import { useSession } from "next-auth/react";
import { UsuarioList } from "@/components/usuarios/UsuarioList";

export default function CatalogosPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const isAdmin = session?.user?.rol === 'administrador_sistema';
  
  const [activeTab, setActiveTab] = useState("docentes");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500 pb-4">
      {/* Header Compacto */}
      <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
            <Database className="h-5 w-5 text-[#1a237e]" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-800 tracking-tight leading-none">Catálogos Académicos</h1>
            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Gestión de datos maestros UNT</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-4">
        {activeTab === "docentes" && <DocenteList />}
        {activeTab === "cursos" && <CursoList />}
        {activeTab === "ciclos" && <CicloList />}
        {activeTab === "ambientes" && <AmbienteList />}
        {activeTab === "periodos" && <PeriodoList />}
        {activeTab === "grupos" && <GrupoList />}
        {activeTab === "ventanas" && <ConfiguradorVentanas />}
        {isAdmin && activeTab === "usuarios" && <UsuarioList />}
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
