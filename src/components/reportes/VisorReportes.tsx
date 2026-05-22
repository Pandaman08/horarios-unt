"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Printer, User, Home, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

export function VisorReportes({ id_periodo }: { id_periodo: number }) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.rol === 'administrador_sistema';
  const isOperador = session?.user?.rol === 'operador_horarios';

  const [docentes, setDocentes] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [selectedDocente, setSelectedDocente] = useState<string>("");
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>("");
  const [selectedCiclo, setSelectedCiclo] = useState<string>("todos");
  const [generatingDocente, setGeneratingDocente] = useState(false);
  const [generatingAula, setGeneratingAula] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [generatingConsolidado, setGeneratingConsolidado] = useState(false);
  const [generatingConflictos, setGeneratingConflictos] = useState(false);
  const [generatingEstadisticas, setGeneratingEstadisticas] = useState(false);

  const ciclos = [
    { value: "todos", label: "Todos los Ciclos" },
    { value: "1", label: "Ciclo I" },
    { value: "2", label: "Ciclo II" },
    { value: "3", label: "Ciclo III" },
    { value: "4", label: "Ciclo IV" },
    { value: "5", label: "Ciclo V" },
    { value: "6", label: "Ciclo VI" },
    { value: "7", label: "Ciclo VII" },
    { value: "8", label: "Ciclo VIII" },
    { value: "9", label: "Ciclo IX" },
    { value: "10", label: "Ciclo X" },
  ];

  const handleDownloadExcel = async () => {
    setGeneratingExcel(true);
    try {
      const url = `/api/reportes/excel?id_periodo=${id_periodo}&ciclo=${selectedCiclo}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al generar Excel");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Horarios_${selectedCiclo === 'todos' ? 'Todos' : `Ciclo_${selectedCiclo}`}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Excel generado correctamente");
    } catch (error) {
      toast.error("Error al descargar el Excel");
    } finally {
      setGeneratingExcel(false);
    }
  };

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
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Nueva Sección: Horarios Académicos (Excel) Estilo Moderno */}
      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group">
        <div className="h-1.5 bg-[#1a237e] w-full" />
        <CardHeader className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="p-3.5 rounded-xl bg-indigo-50 text-[#1a237e] border border-indigo-100 shadow-sm transition-transform duration-500 group-hover:scale-105">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">Horarios Académicos</CardTitle>
                <CardDescription className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mt-1">Generación de Reportes en Excel</CardDescription>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <div className="space-y-1.5 px-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seleccionar Ciclo</Label>
                <Select value={selectedCiclo} onValueChange={setSelectedCiclo}>
                  <SelectTrigger className="w-[180px] h-10 rounded-xl border border-slate-200 bg-white px-4 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all">
                    <SelectValue placeholder="Todos los ciclos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {ciclos.map(c => (
                      <SelectItem key={c.value} value={c.value} className="font-bold py-2 text-xs">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button
              className="h-16 rounded-xl bg-white border border-slate-200 hover:border-[#1a237e] text-[#1a237e] hover:bg-indigo-50 font-bold text-xs uppercase tracking-widest transition-all shadow-sm hover:shadow-md active:scale-95"
              onClick={() => handleDownloadExcel()}
              disabled={generatingExcel}
            >
              <div className="flex items-center gap-3">
                <Download className="h-4 w-4" />
                <span>Descargar Excel</span>
              </div>
            </Button>

            <Button
              className={cn(
                "h-16 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-sm active:scale-95",
                isAdmin 
                  ? "bg-[#1a237e] hover:bg-[#121858] text-white shadow-indigo-900/10 hover:shadow-indigo-900/20" 
                  : "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none"
              )}
              onClick={() => isAdmin && handleDownloadExcel()}
              disabled={generatingExcel || !isAdmin}
              title={!isAdmin ? "Solo el administrador puede regenerar horarios" : ""}
            >
              <div className="flex items-center gap-3">
                <RefreshCw className={cn("h-4 w-4", generatingExcel && "animate-spin")} />
                <span>{generatingExcel ? "Generando..." : "Regenerar Excel"}</span>
              </div>
            </Button>

            <Button
              variant="outline"
              className="h-16 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-500 hover:text-slate-700 hover:bg-slate-50 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
              onClick={() => toast.info("Vista previa no disponible")}
            >
              <div className="flex items-center gap-3">
                <Printer className="h-4 w-4" />
                <span>Vista Previa</span>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Reporte por Docente Moderno */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group">
          <div className="h-1 bg-indigo-500 w-full" />
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 transition-transform duration-300 group-hover:scale-105">
                <User className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Reporte por Docente</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Horario individual oficial</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seleccionar Docente</Label>
              <Select value={selectedDocente} onValueChange={setSelectedDocente}>
                <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all">
                  <SelectValue placeholder="Busca un docente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {docentes.map(d => (
                    <SelectItem key={d.id_docente} value={d.id_docente.toString()} className="py-2 text-xs font-medium">
                      {d.nombres} {d.apellidos}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-12 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/10 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={generatingDocente}
              onClick={() => handleDownload('docente', selectedDocente)}
            >
              {generatingDocente ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando...</span>
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Reporte por Ambiente Moderno */}
        <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden group">
          <div className="h-1 bg-emerald-500 w-full" />
          <CardHeader className="p-6 pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 transition-transform duration-300 group-hover:scale-105">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Reporte por Ambiente</CardTitle>
                <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Uso de aulas y laboratorios</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Seleccionar Ambiente</Label>
              <Select value={selectedAmbiente} onValueChange={setSelectedAmbiente}>
                <SelectTrigger className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-4 font-bold text-xs focus:ring-2 focus:ring-emerald-100 transition-all">
                  <SelectValue placeholder="Busca un ambiente..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {ambientes.map(a => (
                    <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()} className="py-2 text-xs font-medium">
                      {a.nombre} ({a.tipo.replace('_', ' ')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-900/10 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2"
              disabled={generatingAula}
              onClick={() => handleDownload('aula', selectedAmbiente)}
            >
              {generatingAula ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generando...</span>
                </div>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Reportes de Gestión Moderno */}
      <Card className="rounded-2xl border border-slate-100 shadow-sm bg-white overflow-hidden">
        <div className="h-1.5 bg-indigo-600 w-full" />
        <CardHeader className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-slate-800 tracking-tight">Reportes de Gestión</CardTitle>
              <CardDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Resúmenes ejecutivos del periodo</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-20 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 flex flex-col gap-2 group transition-all"
              onClick={() => handleDownload('consolidado')}
              disabled={generatingConsolidado}
            >
              {generatingConsolidado ? (
                <div className="h-5 w-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
              ) : (
                <Download className="h-5 w-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              )}
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600 group-hover:text-indigo-900">Consolidado Carga</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 rounded-xl border border-slate-200 hover:border-amber-600 hover:bg-amber-50/50 flex flex-col gap-2 group transition-all"
              onClick={() => handleDownload('conflictos')}
              disabled={generatingConflictos}
            >
              {generatingConflictos ? (
                <div className="h-5 w-5 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
              ) : (
                <Download className="h-5 w-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
              )}
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600 group-hover:text-amber-900">Registro Conflictos</span>
            </Button>

            <Button
              variant="outline"
              className="h-20 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/50 flex flex-col gap-2 group transition-all"
              onClick={() => handleDownload('estadisticas')}
              disabled={generatingEstadisticas}
            >
              {generatingEstadisticas ? (
                <div className="h-5 w-5 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
              ) : (
                <Download className="h-5 w-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              )}
              <span className="font-bold text-[10px] uppercase tracking-wider text-slate-600 group-hover:text-emerald-900">Estadísticas Finales</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}