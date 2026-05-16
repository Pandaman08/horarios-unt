"use client";

import { useState } from "react";
import { DocenteList } from "@/components/docentes/DocenteList";
import { CursoList } from "@/components/cursos/CursoList";
import { AmbienteList } from "@/components/ambientes/AmbienteList";
import { PeriodoList } from "@/components/periodos/PeriodoList";
import { GrupoList } from "@/components/grupos/GrupoList";
import { ConfiguradorVentanas } from "@/components/ventanas/ConfiguradorVentanas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/sonner";

export default function CatalogosPage() {
  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Mantenimiento de Catálogos</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="docentes" className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-8">
              <TabsTrigger value="docentes">Docentes</TabsTrigger>
              <TabsTrigger value="cursos">Cursos</TabsTrigger>
              <TabsTrigger value="ambientes">Ambientes</TabsTrigger>
              <TabsTrigger value="periodos">Periodos</TabsTrigger>
              <TabsTrigger value="grupos">Grupos</TabsTrigger>
              <TabsTrigger value="ventanas">Ventanas</TabsTrigger>
            </TabsList>
            <TabsContent value="docentes">
              <DocenteList />
            </TabsContent>
            <TabsContent value="cursos">
              <CursoList />
            </TabsContent>
            <TabsContent value="ambientes">
              <AmbienteList />
            </TabsContent>
            <TabsContent value="periodos">
              <PeriodoList />
            </TabsContent>
            <TabsContent value="grupos">
              <GrupoList />
            </TabsContent>
            <TabsContent value="ventanas">
              <ConfiguradorVentanas />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
