"use client";

import { useState } from "react";
import { DocenteList } from "@/components/docentes/DocenteList";
import { CursoList } from "@/components/cursos/CursoList";
import { AmbienteList } from "@/components/ambientes/AmbienteList";
import { PeriodoList } from "@/components/periodos/PeriodoList";
import { GrupoList } from "@/components/grupos/GrupoList";
import { ConfiguradorVentanas } from "@/components/ventanas/ConfiguradorVentanas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Users, 
  BookOpen, 
  MapPin, 
  Calendar, 
  Layers, 
  Layout, 
  Database,
  Search,
  ShieldCheck
} from "lucide-react";
import { useSession } from "next-auth/react";
import { UsuarioList } from "@/components/usuarios/UsuarioList";

export default function CatalogosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.rol === 'administrador_sistema';

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-700 pb-8">
      {/* Header Institucional del Módulo Balanceado */}
      <div className="relative overflow-hidden bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50/50 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-[#003366] rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#003366]/40 uppercase tracking-widest mb-1">Mantenimiento Global</p>
              <h1 className="text-[24px] font-black text-gray-900 tracking-tight">Catálogos Académicos</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <Tabs defaultValue="docentes" className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-gray-50/50 p-2 rounded-xl border border-gray-100 w-full sm:w-auto">
              <TabsTrigger value="docentes" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                <Users className="h-5 w-5" /> Docentes
              </TabsTrigger>
              <TabsTrigger value="cursos" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                <BookOpen className="h-5 w-5" /> Cursos
              </TabsTrigger>
              <TabsTrigger value="ambientes" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                <MapPin className="h-5 w-5" /> Ambientes
              </TabsTrigger>
              <TabsTrigger value="periodos" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                <Calendar className="h-5 w-5" /> Periodos
              </TabsTrigger>
              <TabsTrigger value="grupos" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                <Layers className="h-5 w-5" /> Grupos
              </TabsTrigger>
              <TabsTrigger value="ventanas" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                <Layout className="h-5 w-5" /> Ventanas
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="usuarios" className="flex items-center gap-2 px-6 py-2.5 rounded-lg data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-sm transition-all font-bold text-[14px]">
                  <ShieldCheck className="h-5 w-5" /> Usuarios
                </TabsTrigger>
              )}
            </TabsList>
          </div>

          <div className="p-6">
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
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
