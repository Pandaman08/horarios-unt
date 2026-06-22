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
import { FacultadList } from "@/components/facultades/FacultadList";
import { DepartamentoList } from "@/components/departamentos/DepartamentoList";
import { EscuelaList } from "@/components/escuelas/EscuelaList";
import { PersonalApoyoList } from "@/components/personal-apoyo/PersonalApoyoList";
import { CargoAcademicoAdministrativoList } from "@/components/cargos-academicos-administrativos/CargoAcademicoAdministrativoList";

import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Database, Building2, Users, GraduationCap, UserPlus, Briefcase } from "lucide-react";

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
      {/* TABS */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full h-auto p-1 bg-transparent border-b border-border flex-wrap gap-1 justify-start">
            <TabsTrigger value="docentes" className="text-xs font-bold">Docentes</TabsTrigger>
            <TabsTrigger value="cursos" className="text-xs font-bold">Cursos</TabsTrigger>
            <TabsTrigger value="ciclos" className="text-xs font-bold">Ciclos</TabsTrigger>
            <TabsTrigger value="ambientes" className="text-xs font-bold">Ambientes</TabsTrigger>
            <TabsTrigger value="periodos" className="text-xs font-bold">Periodos</TabsTrigger>
            <TabsTrigger value="grupos" className="text-xs font-bold">Grupos</TabsTrigger>
            <TabsTrigger value="ventanas" className="text-xs font-bold">Ventanas</TabsTrigger>
            <TabsTrigger value="facultades" className="text-xs font-bold">
              <Building2 className="h-3 w-3 mr-1" />
              Facultades
            </TabsTrigger>
            <TabsTrigger value="departamentos" className="text-xs font-bold">
              <Users className="h-3 w-3 mr-1" />
              Departamentos
            </TabsTrigger>
            <TabsTrigger value="escuelas" className="text-xs font-bold">
              <GraduationCap className="h-3 w-3 mr-1" />
              Escuelas
            </TabsTrigger>
            <TabsTrigger value="personal-apoyo" className="text-xs font-bold">
              <UserPlus className="h-3 w-3 mr-1" />
              Personal de Apoyo
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="cargos-academicos-administrativos" className="text-xs font-bold">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Cargos Académicos
                </TabsTrigger>
                <TabsTrigger value="usuarios" className="text-xs font-bold">Usuarios</TabsTrigger>
              </>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* CONTENT */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden p-3 md:p-4 w-full">
        {activeTab === "docentes" && <DocenteList />}
        {activeTab === "cursos" && <CursoList />}
        {activeTab === "ciclos" && <CicloList />}
        {activeTab === "ambientes" && <AmbienteList />}
        {activeTab === "periodos" && <PeriodoList />}
        {activeTab === "grupos" && <GrupoList />}
        {activeTab === "ventanas" && <ConfiguradorVentanas />}
        {activeTab === "facultades" && <FacultadList />}
        {activeTab === "departamentos" && <DepartamentoList />}
        {activeTab === "escuelas" && <EscuelaList />}
        {activeTab === "personal-apoyo" && <PersonalApoyoList />}
        {isAdmin && activeTab === "cargos-academicos-administrativos" && <CargoAcademicoAdministrativoList />}
        {isAdmin && activeTab === "usuarios" && <UsuarioList />}
      </div>

      {/* TOASTER */}
      <Toaster position="top-right" richColors />
    </div>
  );
}