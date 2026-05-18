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
import { 
  Users, 
  BookOpen, 
  MapPin, 
  Calendar, 
  Layers, 
  Layout, 
  Database,
  Search
} from "lucide-react";

export default function CatalogosPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Institucional del Módulo */}
      <div className="relative overflow-hidden bg-white rounded-[32px] p-8 border border-gray-100 shadow-xl shadow-blue-900/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-16 w-16 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Database className="h-8 w-8 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-[0.2em] mb-1">Mantenimiento Global</p>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">Catálogos Académicos</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-gray-600">Base de Datos Conectada</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl shadow-blue-900/10 border border-gray-100 overflow-hidden">
        <Tabs defaultValue="docentes" className="w-full">
          <div className="px-8 pt-8">
            <TabsList className="flex flex-wrap h-auto gap-2 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 w-full sm:w-auto">
              <TabsTrigger value="docentes" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm">
                <Users className="h-4 w-4" /> Docentes
              </TabsTrigger>
              <TabsTrigger value="cursos" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm">
                <BookOpen className="h-4 w-4" /> Cursos
              </TabsTrigger>
              <TabsTrigger value="ambientes" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm">
                <MapPin className="h-4 w-4" /> Ambientes
              </TabsTrigger>
              <TabsTrigger value="periodos" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm">
                <Calendar className="h-4 w-4" /> Periodos
              </TabsTrigger>
              <TabsTrigger value="grupos" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm">
                <Layers className="h-4 w-4" /> Grupos
              </TabsTrigger>
              <TabsTrigger value="ventanas" className="flex items-center gap-2 px-6 py-3 rounded-xl data-[state=active]:bg-[#003366] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all font-bold text-sm">
                <Layout className="h-4 w-4" /> Ventanas
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-8">
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
          </div>
        </Tabs>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
