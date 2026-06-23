"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Wand2, 
  Trash2, 
  Clock, 
  Loader2,
  Settings2,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePeriodo } from "@/contexts/PeriodoContext";

interface Ventana {
  id_ventana: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
  categoria: string;
  cantidad_docentes: number;
  completado: boolean;
}

export function ConfiguradorVentanas() {
  const { periodoSeleccionado, periodos } = usePeriodo();
  const [ventanas, setVentanas] = useState<Ventana[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    docentes_con_cursos?: number;
    ventanas_activas?: number;
  } | null>(null);

  // Sincronizar con el periodo global
  useEffect(() => {
    if (periodoSeleccionado) {
      setSelectedPeriodo(periodoSeleccionado.id_periodo.toString());
    }
  }, [periodoSeleccionado]);

  const [fechaInicio, setFechaInicio] = useState(format(new Date(), "yyyy-MM-dd"));
  const [horaFinJornada, setHoraFinJornada] = useState("18:00");

  // Configuración de ventanas / generación
  const [isGeneratingHorarios, setIsGeneratingHorarios] = useState(false);
  const [isResettingHorarios, setIsResettingHorarios] = useState(false);
  const [modoGeneracion, setModoGeneracion] = useState<string>("intervalo");
  const [horaInicioGeneracion, setHoraInicioGeneracion] = useState<string>("08:00");
  const [intervaloMinutos, setIntervaloMinutos] = useState<string>("15");
  const [progresoGeneracion, setProgresoGeneracion] = useState<number>(0);
  const [logsGeneracion, setLogsGeneracion] = useState<string[]>([]);
  const [intervaloActivo, setIntervaloActivo] = useState<{
    fecha_inicio: string;
    fecha_fin_intervalo: string;
    intervalo_minutos: number;
    modo: string;
  } | null>(null);
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  
  // Estado para ventanas de docentes creadas
  const [ventanasDocentes, setVentanasDocentes] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedPeriodo && selectedPeriodo !== "undefined" && selectedPeriodo !== "") {
      fetchVentanas();
      fetchStats();
    }
  }, [selectedPeriodo]);

  // Timer para actualizar el tiempo restante del intervalo de horarios
  useEffect(() => {
    if (intervaloActivo && modoGeneracion === "intervalo") {
      const interval = setInterval(() => {
        const fin = new Date(intervaloActivo.fecha_fin_intervalo);
        const ahora = new Date();
        const restante = Math.max(0, Math.floor((fin.getTime() - ahora.getTime()) / 1000));
        setTiempoRestante(restante);
        
        if (restante <= 0) {
          clearInterval(interval);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [intervaloActivo, modoGeneracion]);

  const fetchStats = async () => {
    if (!selectedPeriodo) return;
    try {
      // Usamos el mismo endpoint pero con un parámetro que indique que queremos estadísticas del nuevo flujo
      const statsRes = await fetch(`/api/ventanas?stats=true&id_periodo=${selectedPeriodo}&flujo=nuevo`);
      const statsData = await statsRes.json();
      setStats({
        docentes_con_cursos: statsData.docentes_con_cursos ?? 0,
        ventanas_activas: statsData.ventanas_activas ?? 0,
      });
    } catch (error) {
      console.error("Error al cargar stats:", error);
      // Fallback a estadísticas de la vista anterior (por si el backend no está actualizado)
      try {
        const fallbackRes = await fetch(`/api/ventanas?stats=true&id_periodo=${selectedPeriodo}`);
        const fallbackData = await fallbackRes.json();
        setStats({
          docentes_con_cursos: fallbackData.docentes_aprobados ?? 0,
          ventanas_activas: fallbackData.ventanas_activas ?? 0,
        });
      } catch (e) {
        console.error("Error al cargar stats de fallback:", e);
      }
    }
  };

  const fetchVentanas = async () => {
    try {
      const res = await fetch(`/api/ventanas?id_periodo=${selectedPeriodo}&flujo=nuevo`);
      const data = await res.json();
      
      const ventanasData = data.ventanas || data;
      
      if (Array.isArray(ventanasData)) {
        setVentanas(ventanasData);
        setVentanasDocentes(ventanasData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error al cargar ventanas:", error);
      toast.error("Error al cargar ventanas");
      setLoading(false);
    }
  };

  const handleGenerar = async () => {
    if (!selectedPeriodo) {
      toast.error("Por favor selecciona un período");
      return;
    }

    setIsGeneratingHorarios(true);
    setProgresoGeneracion(0);
    setLogsGeneracion([]);
    setIntervaloActivo(null);
    setTiempoRestante(null);
    
    try {
      if (modoGeneracion === "intervalo") {
        setLogsGeneracion(["📋 Generando ventanas de atención para docentes con cursos asignados..."]);

        const res = await fetch("/api/ventanas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_periodo: selectedPeriodo,
            fecha_inicio: fechaInicio,
            hora_inicio_jornada: horaInicioGeneracion,
            hora_fin_jornada: horaFinJornada,
            intervalo_por_docente: intervaloMinutos,
            modo: "incremental",
            flujo: "nuevo", // Indicamos que use el nuevo flujo
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Error al generar ventanas");
        }

        setLogsGeneracion(prev => [
          ...prev,
          `✅ ${data.message}`,
          `📋 Docentes con cursos asignados: ${data.docentes_procesados ?? stats?.docentes_con_cursos ?? 0}`,
          `⏰ Ventanas creadas en esta ejecución: ${data.ventanas_creadas ?? 0}`,
        ]);
        setProgresoGeneracion(100);
        toast.success(data.message || "Ventanas generadas correctamente");
        fetchVentanas();
        fetchStats();
        return;
      }

      // Modo automático: asigna horarios y crea ventanas para docentes con cursos asignados
      setLogsGeneracion(prev => [...prev, "📋 Ejecutando asignación automática de horarios y ventanas..."]);
      
      const res = await fetch("/api/horarios/asignacion-automatica", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_periodo: parseInt(selectedPeriodo),
          hora_inicio: horaInicioGeneracion,
          intervalo_minutos: parseInt(intervaloMinutos),
          modo: "automatico",
          regenerar_ventanas: false,
          flujo: "nuevo",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al generar horarios");
      }

      const data = await res.json();
      
      if (data.ventanas_creadas?.length > 0) {
        setVentanasDocentes(data.ventanas_creadas);
      }
      
      setLogsGeneracion(prev => [
        ...prev,
        `✅ ${data.message}`,
        `📋 Docentes procesados: ${data.docentes_count}`,
        `⏰ Horarios creados: ${data.horarios_creados || 0}`,
        data.ventanas_creadas?.length > 0
          ? `📋 Ventanas creadas: ${data.ventanas_creadas.length}`
          : "",
      ]);

      const totalDocentes = data.docentes_count || 0;
      for (let i = 0; i < totalDocentes; i++) {
        const progreso = Math.round(((i + 1) / Math.max(totalDocentes, 1)) * 100);
        await new Promise(resolve => setTimeout(resolve, 200));
        setProgresoGeneracion(progreso);
      }
      
      setLogsGeneracion(prev => [
        ...prev,
        "🎉 Proceso completado. Los docentes ya pueden ver sus horarios.",
      ]);
      setProgresoGeneracion(100);
      toast.success("Horarios y ventanas generados correctamente");
      fetchVentanas();
      fetchStats();
      
    } catch (error: any) {
      toast.error(error.message || "Error de conexión");
      setLogsGeneracion(prev => [...prev, `❌ Error: ${error.message || "Error de conexión"}`]);
    } finally {
      setIsGeneratingHorarios(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta ventana?")) return;
    try {
      const res = await fetch(`/api/ventanas/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ventana eliminada");
        fetchVentanas();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  const handleResetearHorarios = async () => {
    if (!selectedPeriodo) {
      toast.error("Por favor selecciona un período");
      return;
    }

    if (!confirm("¿Está seguro de resetear los horarios generados? Esto borrará todas las asignaciones actuales y los docentes podrán volver a confirmar.")) {
      return;
    }

    setIsResettingHorarios(true);
    
    try {
      const res = await fetch("/api/horarios/resetear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_periodo: parseInt(selectedPeriodo)
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Error al resetear horarios");
      }

      const data = await res.json();
      
      toast.success(data.message || "Horarios reseteados exitosamente!");
      setIntervaloActivo(null);
      setTiempoRestante(null);
      setVentanasDocentes([]);
      
    } catch (error: any) {
      console.error("Error al resetear horarios:", error);
      toast.error(error.message || "Error de conexión");
    } finally {
      setIsResettingHorarios(false);
    }
  };

  const periodoActualObj = periodos.find(p => p.id_periodo.toString() === selectedPeriodo);
  const esLectura = !periodoActualObj?.activo || periodoActualObj?.estado === 'finalizado';

  return (
    <div className="space-y-4 animate-in fade-in duration-500 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <CalendarIcon className="h-4.5 w-4.5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground tracking-tight">Configuración de Ventanas</h2>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              {esLectura 
                ? "Consulta de ventanas históricas. Modo lectura activado."
                : "Los docentes con cursos asignados pueden elegir sus horarios lectivos."
              }
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border transition-colors",
            esLectura ? "bg-amber-500/10 border-amber-500/20" : "bg-muted/50"
          )}>
            <span className={cn(
              "text-[10px] font-medium",
              esLectura ? "text-amber-700" : "text-muted-foreground"
            )}>Período:</span>
            <div className="w-auto border-none bg-transparent font-bold text-primary p-0 text-xs flex items-center">
              <span>{periodoActualObj?.codigo || "Seleccione un periodo"}</span>
              {periodoActualObj?.activo && <span className="text-muted-foreground ml-1 text-[9px]">(Activo)</span>}
              {periodoActualObj?.estado === 'finalizado' && <span className="text-muted-foreground ml-1 text-[9px]">(Finalizado)</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3 space-y-3">
          {/* Programación de ventanas */}
          <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-3 animate-in fade-in duration-700">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
                <Settings2 className="h-4.5 w-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Programación de Ventanas</h3>
                    <p className="text-[9px] font-medium text-muted-foreground mt-0.5">
                      {modoGeneracion === "intervalo"
                        ? "Crea turnos de atención para docentes con cursos asignados. Cada docente elige su horario en su ventana."
                        : "Asigna horarios automáticamente y crea las ventanas de atención correspondientes."}
                    </p>
                  </div>
                  {intervaloActivo && tiempoRestante !== null && (
                    <div className={`px-2.5 py-1.5 rounded-lg border text-center ${tiempoRestante > 0 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                      <div className="text-[9px] font-black uppercase tracking-widest mb-0.5">
                        {tiempoRestante > 0 ? 'Tiempo Restante' : 'Intervalo Terminado'}
                      </div>
                      <div className="text-sm font-black">
                        {tiempoRestante > 0 ? `${Math.floor(tiempoRestante / 60)}:${(tiempoRestante % 60).toString().padStart(2, '0')}` : '0:00'}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Modo</Label>
                <Select value={modoGeneracion} onValueChange={setModoGeneracion} disabled={isGeneratingHorarios || esLectura}>
                  <SelectTrigger className="h-8 rounded-lg bg-muted/50 border-border font-bold text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-border">
                    <SelectItem value="intervalo" className="font-bold text-[10px]">Por ventanas (docente elige horario)</SelectItem>
                    <SelectItem value="automatico" className="font-bold text-[10px]">Automático (sistema asigna todo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Fecha de inicio</Label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  disabled={isGeneratingHorarios || esLectura}
                  className="h-8 rounded-lg bg-muted/50 border-border font-bold text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Hora inicio jornada</Label>
                <Input 
                  type="time" 
                  value={horaInicioGeneracion} 
                  onChange={(e) => setHoraInicioGeneracion(e.target.value)} 
                  disabled={isGeneratingHorarios || esLectura}
                  className="h-8 rounded-lg bg-muted/50 border-border font-bold text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Hora fin jornada</Label>
                <Input
                  type="time"
                  value={horaFinJornada}
                  onChange={(e) => setHoraFinJornada(e.target.value)}
                  disabled={isGeneratingHorarios || esLectura}
                  className="h-8 rounded-lg bg-muted/50 border-border font-bold text-[10px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Intervalo por docente</Label>
                <Select value={intervaloMinutos} onValueChange={setIntervaloMinutos} disabled={isGeneratingHorarios || esLectura}>
                  <SelectTrigger className="h-8 rounded-lg bg-muted/50 border-border font-bold text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-border">
                    <SelectItem value="15" className="font-bold text-[10px]">15 minutos</SelectItem>
                    <SelectItem value="20" className="font-bold text-[10px]">20 minutos</SelectItem>
                    <SelectItem value="30" className="font-bold text-[10px]">30 minutos</SelectItem>
                    <SelectItem value="60" className="font-bold text-[10px]">60 minutos</SelectItem>
                    <SelectItem value="90" className="font-bold text-[10px]">90 minutos</SelectItem>
                    <SelectItem value="120" className="font-bold text-[10px]">120 minutos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-0.5">Período Académico</Label>
                <div className="h-8 rounded-lg bg-muted/50 border border-border flex items-center px-3 font-bold text-[10px] text-muted-foreground">
                  {periodoActualObj?.codigo || "Seleccionar período"}
                </div>
              </div>
            </div>

            {isGeneratingHorarios && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[9px] font-bold">
                  <span className="text-muted-foreground">Progreso</span>
                  <span className="text-primary">{progresoGeneracion}%</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${progresoGeneracion}%` }}
                  />
                </div>
                <div className="bg-muted/50 rounded-lg p-2 max-h-20 overflow-y-auto custom-scrollbar">
                  {logsGeneracion.map((log, i) => (
                    <div key={i} className="text-[8px] font-medium text-muted-foreground">
                      • {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!esLectura && (
              <div className="pt-1.5 border-t border-border/50 space-y-2">
                <p className="text-[9px] text-muted-foreground">
                  Solo se generan ventanas para docentes con cursos asignados que aún no han elegido sus horarios.
                  {stats?.docentes_con_cursos !== undefined && (
                    <> Hay <strong>{stats.docentes_con_cursos}</strong> docente(s) con cursos asignados.</>
                  )}
                </p>
                <Button 
                  onClick={handleGenerar}
                  disabled={isGeneratingHorarios || !selectedPeriodo}
                  className="w-full h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isGeneratingHorarios ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generando...
                    </>
                  ) : modoGeneracion === "intervalo" ? (
                    <>
                      <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Generar Ventanas
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Generar Horarios y Ventanas
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleResetearHorarios}
                  disabled={isResettingHorarios || isGeneratingHorarios || !selectedPeriodo}
                  variant="outline"
                  className="w-full h-9 rounded-lg border-destructive/50 text-destructive hover:bg-destructive/5 font-black text-[10px] transition-all hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isResettingHorarios ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Reseteando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Resetear Horarios
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {esLectura && (
              <div className="pt-3 border-t border-border/50 text-center">
                <p className="text-[10px] font-bold text-amber-600 bg-amber-500/10 py-2 rounded-lg border border-amber-500/20">
                  Las funciones de generación y reseteo están deshabilitadas para periodos finalizados o inactivos.
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
              <div className="flex flex-col items-center gap-2.5">
                <div className="h-9 w-9 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Sincronizando...</p>
              </div>
            </div>
          ) : ventanasDocentes.length > 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-3 border-b border-border flex items-center gap-2.5 bg-emerald-50">
                <CalendarIcon className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-emerald-800 text-sm">Ventanas de Tiempo para Docentes</h3>
              </div>
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Prioridad</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Docente</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Modalidad</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Categoría</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Hora Inicio</TableHead>
                      <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Hora Fin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventanasDocentes.map((ventana, idx) => (
                      <TableRow key={ventana.id_ventana || idx} className="group border-b border-border hover:bg-muted/50 transition-all">
                        <TableCell className="px-4 py-3">
                          <span className="font-bold text-primary text-[11px]">#{ventana.orden_prioridad}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-bold text-foreground text-[11px]">
                            {ventana.docente?.nombres} {ventana.docente?.apellidos}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            {ventana.modalidad}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="text-[10px] font-medium px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                            {ventana.categoria}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-mono text-[11px] font-bold text-emerald-600">
                            {ventana.hora_inicio}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="font-mono text-[11px] font-bold text-red-600">
                            {ventana.hora_fin}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : ventanas.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
              <div className="flex flex-col items-center gap-2 opacity-30">
                <CalendarIcon className="h-10 w-10 text-muted-foreground" />
                <p className="text-[12px] font-bold text-muted-foreground">No hay ventanas programadas</p>
              </div>
            </div>
          ) : (
            <>
              {[...new Set(ventanas.map((v) => v.fecha))].map((fecha, idx) => (
                <div key={idx} className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                  <div className="p-3 border-b border-border flex items-center gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-foreground text-sm">
                      Día: {format(new Date(fecha), "dd/MM/yyyy", { locale: es })}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader className="bg-muted/50">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Orden</TableHead>
                          <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Categoría</TableHead>
                          <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Modalidad</TableHead>
                          <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Desde</TableHead>
                          <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Hasta</TableHead>
                          <TableHead className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Estado</TableHead>
                          <TableHead className="w-[80px] text-right text-[9px] font-black text-muted-foreground uppercase tracking-widest px-4 py-3">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ventanas.filter((v) => v.fecha === fecha).map((v, vIdx) => (
                          <TableRow key={v.id_ventana} className="group border-b border-border hover:bg-muted/50 transition-all">
                            <TableCell className="px-4 py-3">
                              <span className="font-bold text-muted-foreground text-[11px]">#{vIdx + 1}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                <span className="font-bold text-foreground text-[11px]">
                                  {v.categoria}
                                </span>
                                {v.cantidad_docentes > 0 && (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[8px] font-black uppercase border border-amber-500/20 w-fit">
                                    {v.cantidad_docentes} docentes
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className="text-muted-foreground text-[11px]">{v.modalidad}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className="text-primary font-bold font-mono text-[11px]">{v.hora_inicio}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className="text-primary font-bold font-mono text-[11px]">{v.hora_fin}</span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                                v.completado 
                                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                                  : "bg-muted text-muted-foreground border-border"
                              )}>
                                {v.completado ? "Completado" : "Pendiente"}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex justify-end">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDelete(v.id_ventana)} 
                                  title="Eliminar Turno" 
                                  className="h-7 w-7 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="space-y-3">
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Estado de Carga Horaria</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2.5">
              {[
                { label: "Docentes con cursos asignados", cantidad: stats?.docentes_con_cursos ?? 0, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
                { label: "Ventanas activas", cantidad: stats?.ventanas_activas ?? 0, color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-muted-foreground text-[11px] font-medium">{item.label}</span>
                  <span className={cn("px-2 py-1 rounded-full text-[10px] font-bold border", item.color)}>
                    {item.cantidad}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-200 flex items-center gap-2">
                <span className="text-yellow-400">💡</span> TIP
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Las horas desde/hasta pueden ser modificadas haciendo doble clic. El sistema propagará los cambios automáticamente.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}