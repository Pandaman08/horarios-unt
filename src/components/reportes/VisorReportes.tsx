"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Printer, User, Home, RefreshCw, ChevronDown, Calendar, School, BookOpen, TrendingUp, X, CheckCircle2, Layers, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import { SearchableSelect } from "@/components/ui/searchable-select";

export function VisorReportes() {
  const { data: session } = useSession();
  const { periodoSeleccionado, periodos } = usePeriodo();
  const { departamentoSeleccionado } = useDepartment();
  const isAdmin = session?.user?.rol === 'administrador_sistema';
  const isOperador = session?.user?.rol === 'operador_horarios';

  const [id_periodo, setIdPeriodo] = useState<number | null>(null);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [selectedDocente, setSelectedDocente] = useState<string>("");
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>("");
  const [selectedCiclo, setSelectedCiclo] = useState<string>("todos");
  const [selectedCicloReporte, setSelectedCicloReporte] = useState<string>("");
  const [selectedDia, setSelectedDia] = useState<string>("");
  const [selectedReporte, setSelectedReporte] = useState<string | null>(null);
  const [generatingDocente, setGeneratingDocente] = useState(false);
  const [generatingAula, setGeneratingAula] = useState(false);
  const [generatingTodasAulas, setGeneratingTodasAulas] = useState(false);
  const [generatingDia, setGeneratingDia] = useState(false);
  const [generatingCiclo, setGeneratingCiclo] = useState(false);
  const [generatingTodosCiclos, setGeneratingTodosCiclos] = useState(false);
  const [generatingExcel, setGeneratingExcel] = useState(false);
  const [generatingConsolidado, setGeneratingConsolidado] = useState(false);
  const [generatingConflictos, setGeneratingConflictos] = useState(false);
  const [generatingEstadisticas, setGeneratingEstadisticas] = useState(false);
  const [generatingReporteGeneral, setGeneratingReporteGeneral] = useState(false);

  // Sincronizar con el periodo global al inicio o cuando cambie
  useEffect(() => {
    if (periodoSeleccionado) {
      setIdPeriodo(periodoSeleccionado.id_periodo);
    }
  }, [periodoSeleccionado]);

  const handleDownloadExcel = async (tipo: string, id?: string) =>  {
    if (!id_periodo) return;
    if ((tipo === 'docente' || tipo === 'aula' || tipo === 'ciclo') && !id) {
      toast.warning("Seleccione un elemento de la lista");
      return;
    }

    type TipoExcel = 'docente' | 'aula' | 'ciclo' | 'reporte_general';
    const loadingMap: Record<TipoExcel, React.Dispatch<React.SetStateAction<boolean>>> = {
      docente: setGeneratingDocente,
      aula: setGeneratingAula,
      ciclo: setGeneratingCiclo,
      reporte_general: setGeneratingExcel,
    };
    const setLoading = loadingMap[tipo as TipoExcel];

    if (setLoading) setLoading(true);
    try {
      let url = `/api/reportes/excel?id_periodo=${id_periodo}`;
      if (id) {
        if (tipo === 'docente') url += `&id_docente=${id}`;
        else if (tipo === 'aula') url += `&id_ambiente=${id}`;
        else if (tipo === 'ciclo') url += `&id_ciclo=${id}`;
      }
      if (departamentoSeleccionado) url += `&departamentoId=${departamentoSeleccionado.id}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error ${response.status}`);

      const blob = await response.blob();
      const urlObj = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObj;
      a.download = `horario_institucional_${periodoSeleccionado?.codigo || 'general'}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlObj);
      toast.success("Excel generado correctamente");

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar Excel");
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [departamentoSeleccionado?.id]);

  const fetchData = async () => {
    try {
      let docentesUrl = "/api/docentes";
      let ambientesUrl = "/api/ambientes";
      if (departamentoSeleccionado) {
        docentesUrl += `?departamentoId=${departamentoSeleccionado.id}`;
        ambientesUrl += `?departamentoId=${departamentoSeleccionado.id}`;
      }
      const [dRes, aRes, cRes] = await Promise.all([
        fetch(docentesUrl),
        fetch(ambientesUrl),
        fetch("/api/ciclos")
      ]);
      setDocentes(await dRes.json());
      setAmbientes(await aRes.json());
      setCiclos(await cRes.json());
    } catch (error) {
      toast.error("Error al cargar datos de reportes");
    }
  };

  const handleDownload = async (tipo: string, id?: string, formato: 'pdf' | 'excel' = 'pdf') => {
    if (!id_periodo) return;
    if ((tipo === 'docente' || tipo === 'aula' || tipo === 'ciclo') && !id) {
      toast.warning("Seleccione un elemento de la lista");
      return;
    }

    let url = `/api/reportes/pdf?tipo=${tipo}&id_periodo=${id_periodo}`;
    if (id) url += `&id=${id}`;
    if (departamentoSeleccionado) url += `&departamentoId=${departamentoSeleccionado.id}`;

    type TipoReporte =
  | 'docente'
  | 'aula'
  | 'aulas_todas'
  | 'dia'
  | 'ciclo'
  | 'ciclos_todos'
  | 'consolidado'
  | 'conflictos'
  | 'estadisticas'
  | 'reporte_general';

  const loadingMap: Record<
    TipoReporte,
    React.Dispatch<React.SetStateAction<boolean>>
  > = {
    docente: setGeneratingDocente,
    aula: setGeneratingAula,
    aulas_todas: setGeneratingTodasAulas,
    dia: setGeneratingDia,
    ciclo: setGeneratingCiclo,
    ciclos_todos: setGeneratingTodosCiclos,
    consolidado: setGeneratingConsolidado,
    conflictos: setGeneratingConflictos,
    estadisticas: setGeneratingEstadisticas,
    reporte_general: setGeneratingReporteGeneral,
  };

  const setLoading = loadingMap[tipo as TipoReporte];
    

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
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';
      const fileName = tipo === 'reporte_general' ? `Horario_Institucional_Sistemas.${extension}` : `reporte-${tipo}${id ? `-${id}` : ''}.${extension}`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`${formato.toUpperCase()} generado correctamente`);

      if (tipo === 'docente') setSelectedDocente("");
      else if (tipo === 'aula') setSelectedAmbiente("");
      else if (tipo === 'ciclo') setSelectedCicloReporte("");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || `Error al generar ${formato.toUpperCase()}`);
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  const reportes = [
    { id: 'aula', icon: School, title: 'Horario por Aula', description: 'Consolidado de clases de teoría por ambiente', color: 'indigo' },
    { id: 'dia', icon: Calendar, title: 'Reporte por Día', description: 'Verificar clases, docentes y aulas por cada día de la semana', color: 'emerald' },
    { id: 'docente', icon: User, title: 'Horario por Docente', description: 'Planes de dictado por investigador', color: 'amber' },
    { id: 'ciclo', icon: Layers, title: 'Horario por Ciclo', description: 'Consolidado de clases programadas por ciclo académico', color: 'purple' },
    { id: 'reporte_general', icon: FileText, title: 'Horario Institucional', description: 'Consolidado oficial en formato horizontal por ciclo', color: 'indigo' },
    { id: 'gestion', icon: TrendingUp, title: 'Reporte de Gestión', description: 'KPIs globales y horas pendientes por asignar', color: 'slate' },
  ];

  const currentPeriodoObj = periodos.find(p => p.id_periodo === id_periodo);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 w-full overflow-x-hidden">
      {/* Encabezado como la imagen */}
      <div className="bg-card p-5 md:p-6 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">Centro de Reportes Académicos</h2>
            <p className="text-muted-foreground text-sm">
              Configure parámetros de aulas, laboratorios y docentes para exportar consolidados oficiales en formato PDF.
            </p>
          </div>
          {currentPeriodoObj && (
            <div className="flex flex-col gap-1.5 px-4 py-2 bg-primary/5 rounded-xl border border-primary/20">
              <span className="text-xs font-black uppercase tracking-widest text-primary/70 ml-1">Periodo Global</span>
              <p className="text-sm font-bold text-primary">
                {currentPeriodoObj.codigo}
              </p>
              <p className="text-xs text-muted-foreground italic font-medium">
                Reportes para {currentPeriodoObj.nombre}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tarjetas de Reportes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {reportes.map((reporte) => {
          const Icon = reporte.icon;
          const isActive = selectedReporte === reporte.id;
          
          const colors = {
            indigo: 'border-primary/20 bg-primary/5',
            emerald: 'border-emerald-500/20 bg-emerald-500/5',
            amber: 'border-amber-500/20 bg-amber-500/5',
            purple: 'border-purple-500/20 bg-purple-500/5',
            slate: 'border-muted-foreground/20 bg-muted-foreground/5',
          };

          const borderActive = {
            indigo: 'border-primary',
            emerald: 'border-emerald-600',
            amber: 'border-amber-600',
            purple: 'border-purple-600',
            slate: 'border-foreground',
          };

          return (
            <div
              key={reporte.id}
              onClick={() => setSelectedReporte(reporte.id)}
              className={cn(
                "bg-card p-5 md:p-6 rounded-2xl border transition-all cursor-pointer hover:shadow-md",
                isActive ? borderActive[reporte.color as keyof typeof borderActive] : "border-border",
                colors[reporte.color as keyof typeof colors]
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <Icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />
                <h3 className={cn("font-bold text-lg", isActive ? "text-primary" : "text-foreground")}>
                  {reporte.title}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{reporte.description}</p>
              <button className="text-sm font-bold text-primary flex items-center gap-1">
                Configurar →
              </button>
            </div>
          );
        })}
      </div>

      {/* Parámetros del Reporte */}
      {selectedReporte && (
        <div className="bg-card p-5 md:p-6 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              PARÁMETROS DEL REPORTE
            </h3>
            <button onClick={() => setSelectedReporte(null)}>
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
          
          {(selectedReporte === 'aula' || selectedReporte === 'laboratorio') ? (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Label className="text-sm font-semibold text-foreground mb-2 block">
                    {selectedReporte === 'aula' ? 'Seleccionar Aula de Teoría' : 'Seleccionar Laboratorio'}
                  </Label>
                  <SearchableSelect
                    options={ambientes.map(a => ({
                      value: a.id_ambiente.toString(),
                      label: `${a.nombre} (${a.tipo.replace('_', ' ')})`
                    }))}
                    value={selectedAmbiente}
                    onValueChange={setSelectedAmbiente}
                    placeholder="Buscar aula..."
                  />
                </div>
              <div className="flex gap-2">
                <Button
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-emerald-900/10"
                  onClick={() => handleDownload('aula', selectedAmbiente, 'pdf')}
                  disabled={generatingAula}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-xl px-6 font-bold text-sm"
                  onClick={() => handleDownloadExcel('aula', selectedAmbiente)}
                  disabled={generatingAula}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
              </div>
              
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10">
                  <div>
                    <h4 className="text-sm font-bold text-primary mb-1">Reporte Masivo de Ambientes</h4>
                    <p className="text-xs text-muted-foreground">Genera un solo PDF con los horarios de todos los ambientes registrados.</p>
                  </div>
                  <Button
                    variant="outline"
                    className="h-10 border-primary/20 hover:bg-primary/10 text-primary font-bold text-xs"
                    onClick={() => handleDownload('aulas_todas')}
                    disabled={generatingTodasAulas}
                  >
                    {generatingTodasAulas ? <RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Layers className="h-3.5 w-3.5 mr-2" />}
                    Generar todos los ambientes
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedReporte === 'dia' ? (
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-foreground mb-2 block">Seleccionar Día de la Semana</Label>
                <SearchableSelect
                  options={[
                    { value: "0", label: "Lunes" },
                    { value: "1", label: "Martes" },
                    { value: "2", label: "Miércoles" },
                    { value: "3", label: "Jueves" },
                    { value: "4", label: "Viernes" },
                    { value: "5", label: "Sábado" }
                  ]}
                  value={selectedDia}
                  onValueChange={setSelectedDia}
                  placeholder="Seleccione un día..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-emerald-900/10"
                  onClick={() => handleDownload('dia', selectedDia, 'pdf')}
                  disabled={generatingDia}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar PDF
                </Button>
              </div>
            </div>
          ) : selectedReporte === 'docente' ? (
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-foreground mb-2 block">Seleccionar Docente</Label>
                <SearchableSelect
                  options={docentes.map(d => ({
                    value: d.id_docente.toString(),
                    label: `${d.nombres} ${d.apellidos}`
                  }))}
                  value={selectedDocente}
                  onValueChange={setSelectedDocente}
                  placeholder="Buscar docente..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-emerald-900/10"
                  onClick={() => handleDownload('docente', selectedDocente, 'pdf')}
                  disabled={generatingDocente}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-xl px-6 font-bold text-sm"
                  onClick={() => handleDownloadExcel('docente', selectedDocente)}
                  disabled={generatingDocente}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          ) : selectedReporte === 'ciclo' ? (
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label className="text-sm font-semibold text-foreground mb-2 block">Seleccionar Ciclo Académico</Label>
                <SearchableSelect
                  options={ciclos
                    .filter(c => {
                      if (!currentPeriodoObj) return true;
                      const isPar = c.numero % 2 === 0;
                      return currentPeriodoObj.semestre === 1 ? !isPar : isPar;
                    })
                    .map(c => ({
                      value: c.id_ciclo.toString(),
                      label: c.nombre
                    }))
                  }
                  value={selectedCicloReporte}
                  onValueChange={setSelectedCicloReporte}
                  placeholder="Seleccione un ciclo..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-emerald-900/10"
                  onClick={() => handleDownload('ciclo', selectedCicloReporte, 'pdf')}
                  disabled={generatingCiclo}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  className="h-11 border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-xl px-6 font-bold text-sm"
                  onClick={() => handleDownloadExcel('ciclo', selectedCicloReporte)}
                  disabled={generatingCiclo}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          ) : selectedReporte === 'reporte_general' ? (
            <div className="flex flex-col gap-4">
              <div className="p-6 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 text-center">
                <FileText className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2 dark:text-white">Generar Horario Institucional</h3>
                <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
                  Este reporte utiliza el formato oficial para generar un consolidado de todos los ciclos y ambientes del semestre.
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-bold shadow-lg shadow-indigo-900/20"
                    onClick={() => handleDownload('reporte_general', undefined, 'pdf')}
                    disabled={generatingReporteGeneral}
                  >
                    {generatingReporteGeneral ? (
                      <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Procesando PDF...</>
                    ) : (
                      <><FileText className="h-5 w-5 mr-2" /> Descargar PDF</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 border-indigo-600 text-indigo-600 hover:bg-indigo-50 rounded-xl px-6 font-bold shadow-sm"
                    onClick={() => handleDownloadExcel('reporte_general')}
                    disabled={generatingExcel}
                  >
                    {generatingReporteGeneral ? (
                      <><RefreshCw className="h-5 w-5 mr-2 animate-spin" /> Procesando Excel...</>
                    ) : (
                      <><FileSpreadsheet className="h-5 w-5 mr-2" /> Descargar Excel</>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <Button
                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-emerald-900/10"
                onClick={() => handleDownload('estadisticas')}
                disabled={generatingEstadisticas}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Generar PDF Oficial
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
