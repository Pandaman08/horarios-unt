"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Printer, User, Home } from "lucide-react";
import { toast } from "sonner";

export function VisorReportes({ id_periodo }: { id_periodo: number }) {
  const [docentes, setDocentes] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [selectedDocente, setSelectedDocente] = useState<string>("");
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>("");
  const [generatingDocente, setGeneratingDocente] = useState(false);
  const [generatingAula, setGeneratingAula] = useState(false);
  const [generatingConsolidado, setGeneratingConsolidado] = useState(false);
  const [generatingConflictos, setGeneratingConflictos] = useState(false);
  const [generatingEstadisticas, setGeneratingEstadisticas] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dRes, aRes] = await Promise.all([
        fetch("/api/docentes"),
        fetch("/api/ambientes")
      ]);
      setDocentes(await dRes.json());
      setAmbientes(await aRes.json());
    } catch (error) {
      toast.error("Error al cargar datos de reportes");
    }
  };

  const handleDownload = async (tipo: string, id?: string) => {
    if ((tipo === 'docente' || tipo === 'aula') && !id) {
      toast.warning("Seleccione un elemento de la lista");
      return;
    }

    let url = `/api/reportes?tipo=${tipo}&id_periodo=${id_periodo}`;
    if (id) url += `&id=${id}`;

    const setLoading = {
      docente: setGeneratingDocente,
      aula: setGeneratingAula,
      consolidado: setGeneratingConsolidado,
      conflictos: setGeneratingConflictos,
      estadisticas: setGeneratingEstadisticas,
    }[tipo as any];

    if (setLoading) setLoading(true);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || errorData.details || 'Error en la generación');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte-${tipo}${id ? `-${id}` : ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("PDF generado correctamente");

      if (tipo === 'docente') setSelectedDocente("");
      else if (tipo === 'aula') setSelectedAmbiente("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar PDF");
      toast.info("Abriendo vista de impresión manual...");
      window.open(`${url}&format=html`, '_blank');
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Reporte por Docente */}
        <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden group">
          <div className="h-2 bg-blue-600 w-full" />
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Reporte por Docente</CardTitle>
                <CardDescription className="font-medium">Genera el horario individual oficial</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Seleccionar Docente</Label>
              <Select value={selectedDocente} onValueChange={setSelectedDocente}>
                <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 font-bold focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all">
                  <SelectValue placeholder="Busca un docente..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                  {docentes.map(d => (
                    <SelectItem key={d.id_docente} value={d.id_docente.toString()} className="rounded-xl py-3 font-medium">
                      {d.nombres} {d.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-16 rounded-2xl bg-[#003366] hover:bg-[#002244] text-white font-black text-lg shadow-xl shadow-blue-900/10 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
              disabled={generatingDocente}
              onClick={() => handleDownload('docente', selectedDocente)}
            >
              {generatingDocente ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando...</span>
                </div>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Descargar PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reporte por Ambiente */}
        <Card className="rounded-[32px] border-none shadow-xl bg-white overflow-hidden group">
          <div className="h-2 bg-emerald-600 w-full" />
          <CardHeader className="p-8 pb-4">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Reporte por Ambiente</CardTitle>
                <CardDescription className="font-medium">Horario de uso de aulas y laboratorios</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Seleccionar Ambiente</Label>
              <Select value={selectedAmbiente} onValueChange={setSelectedAmbiente}>
                <SelectTrigger className="w-full h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 px-5 font-bold focus:ring-4 focus:ring-emerald-100 focus:border-emerald-600 transition-all">
                  <SelectValue placeholder="Busca un ambiente..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-gray-100 shadow-2xl">
                  {ambientes.map(a => (
                    <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()} className="rounded-xl py-3 font-medium">
                      {a.nombre} ({a.tipo.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg shadow-xl shadow-emerald-900/10 transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3"
              disabled={generatingAula}
              onClick={() => handleDownload('aula', selectedAmbiente)}
            >
              {generatingAula ? (
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando...</span>
                </div>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Descargar PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reportes de Gestión */}
      <Card className="rounded-[40px] border-none shadow-xl bg-white overflow-hidden">
        <div className="h-2 bg-indigo-600 w-full" />
        <CardHeader className="p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black text-gray-900 tracking-tight">Reportes de Gestión</CardTitle>
              <CardDescription className="font-medium">Resúmenes ejecutivos y estadísticas del periodo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button
              variant="outline"
              className="h-24 rounded-2xl border-2 border-gray-100 hover:border-indigo-600 hover:bg-indigo-50/50 flex flex-col gap-2 group transition-all"
              onClick={() => handleDownload('consolidado')}
              disabled={generatingConsolidado}
            >
              {generatingConsolidado ? (
                <div className="h-6 w-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <Download className="h-6 w-6 text-gray-400 group-hover:text-indigo-600 transition-colors" />
              )}
              <span className="font-black text-xs uppercase tracking-tighter text-gray-600 group-hover:text-indigo-900">Consolidado Carga</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 rounded-2xl border-2 border-gray-100 hover:border-amber-600 hover:bg-amber-50/50 flex flex-col gap-2 group transition-all"
              onClick={() => handleDownload('conflictos')}
              disabled={generatingConflictos}
            >
              {generatingConflictos ? (
                <div className="h-6 w-6 border-3 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <Download className="h-6 w-6 text-gray-400 group-hover:text-amber-600 transition-colors" />
              )}
              <span className="font-black text-xs uppercase tracking-tighter text-gray-600 group-hover:text-amber-900">Registro Conflictos</span>
            </Button>

            <Button
              variant="outline"
              className="h-24 rounded-2xl border-2 border-gray-100 hover:border-emerald-600 hover:bg-emerald-50/50 flex flex-col gap-2 group transition-all"
              onClick={() => handleDownload('estadisticas')}
              disabled={generatingEstadisticas}
            >
              {generatingEstadisticas ? (
                <div className="h-6 w-6 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <Download className="h-6 w-6 text-gray-400 group-hover:text-emerald-600 transition-colors" />
              )}
              <span className="font-black text-xs uppercase tracking-tighter text-gray-600 group-hover:text-emerald-900">Estadísticas Finales</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}