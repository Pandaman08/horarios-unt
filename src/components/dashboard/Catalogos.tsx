"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

import { DocenteList } from "@/components/docentes/DocenteList";
import { CursoList } from "@/components/cursos/CursoList";
import { CicloList } from "@/components/ciclos/CicloList";
import { AmbienteList } from "@/components/ambientes/AmbienteList";
import { PeriodoList } from "@/components/periodos/PeriodoList";
import { GrupoList } from "@/components/grupos/GrupoList";
import { ConfiguradorVentanas } from "@/components/ventanas/ConfiguradorVentanas";
import { UsuarioList } from "@/components/usuarios/UsuarioList";

import { Toaster } from "@/components/ui/sonner";

import { Database } from "lucide-react";

export default function CatalogosPage() {
  const { data: session } = useSession();

  const searchParams = useSearchParams();

  const isAdmin =
    session?.user?.rol ===
    "administrador_sistema";

  const [activeTab, setActiveTab] =
    useState<string>("docentes");

  useEffect(() => {
    const tab =
      searchParams?.get("tab");

    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-4 animate-in fade-in duration-500 pb-4 px-3 sm:px-4 overflow-x-hidden">
      {/* HEADER */}

      {activeTab !== "ventanas" && (
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Database className="h-5 w-5 text-primary" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Catálogos
            </h1>

            <p className="text-sm text-muted-foreground">
              Gestión de datos maestros
              del sistema
            </p>
          </div>
        </div>
      )}

      {/* CONTENT */}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-3 md:p-4 w-full">
        {activeTab === "docentes" && (
          <DocenteList />
        )}

        {activeTab === "cursos" && (
          <CursoList />
        )}

        {activeTab === "ciclos" && (
          <CicloList />
        )}

        {activeTab === "ambientes" && (
          <AmbienteList />
        )}

        {activeTab === "periodos" && (
          <PeriodoList />
        )}

        {activeTab === "grupos" && (
          <GrupoList />
        )}

        {activeTab === "ventanas" && (
          <ConfiguradorVentanas />
        )}

        {isAdmin &&
          activeTab === "usuarios" && (
            <UsuarioList />
          )}
      </div>

      {/* TOASTER */}

      <Toaster
        position="top-right"
        richColors
      />
    </div>
  );
}