"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { toast } from "sonner";
import { format, addMinutes, parse } from "date-fns";
import { 
  Clock, 
  Calendar, 
  Info, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  XCircle,
  ChevronDown,
  LayoutGrid,
  Zap,
  Loader2
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { UserCircle } from "lucide-react";

interface CeldaInfo {
  id_asignacion?: number;
  id_seleccion?: number;
  id_docente?: number;
  docente_nombre?: string;
  curso_nombre?: string;
  tipo_clase?: string;
  estado: 'disponible' | 'ocupado' | 'seleccionado_mio' | 'bloqueado' | 'error';
  mensaje_error?: string;
}

interface ConflictoVisual {
  tipo: string;
  mensaje: string;
  severidad: 'ERROR' | 'ADVERTENCIA';
}

interface Props {
  id_periodo: number;
  id_ambiente?: number;
  id_docente_actual?: number;
  id_curso_actual?: number;
  id_grupo_actual?: number;
  tipo_clase_actual?: string;
  onCellClick?: (dia: number, hora: string) => void;
  onSelectionChange?: () => void;
  soloLectura?: boolean;
}

const DIAS = [
  { id: 0, nombre: "Lunes" },
  { id: 1, nombre: "Martes" },
  { id: 2, nombre: "Miércoles" },
  { id: 3, nombre: "Jueves" },
  { id: 4, nombre: "Viernes" },
  { id: 5, nombre: "Sábado" },
];

export function MatrizDisponibilidad({
  id_periodo,
  id_ambiente,
  id_docente_actual,
  id_curso_actual,
  id_grupo_actual,
  tipo_clase_actual,
  onCellClick,
  onSelectionChange,
  soloLectura: propSoloLectura
}: Props) {
  const [disponibilidad, setDisponibilidad] = useState<Record<string, CeldaInfo>>({});
  const [loading, setLoading] = useState(true);
  const [intervalo, setIntervalo] = useState<number>(60); // Default 60 min
  const [internalSoloLectura, setSoloLectura] = useState(false);
  const [processingCell, setProcessingCell] = useState<string | null>(null);
  const [conflictosActuales, setConflictosActuales] = useState<ConflictoVisual[]>([]);
  const [errorCell, setErrorCell] = useState<string | null>(null);
  const [filtroHorario, setFiltroHorario] = useState<'todos' | 'libres' | 'ocupados' | 'mios'>('todos');

  const soloLectura = propSoloLectura ?? internalSoloLectura;

  // Generar slots de tiempo dinámicos según el intervalo
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = parse("07:00", "HH:mm", new Date());
    const end = parse("22:00", "HH:mm", new Date());
    
    while (current < end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, intervalo);
    }
    return slots;
  }, [intervalo]);

  useEffect(() => {
    fetchDisponibilidad();
    checkAccess();
    setupSocket();
  }, [id_periodo, id_ambiente]);

  const checkAccess = async () => {
    try {
      const res = await fetch("/api/auth/check-access");
      const data = await res.json();
      setSoloLectura(!!data.soloLectura);
    } catch (error) {
      console.error("Error checking access", error);
    }
  };

  const setupSocket = () => {
    const socket = getSocket();
    socket.on("horario-actualizado", () => {
      fetchDisponibilidad();
      if (onSelectionChange) onSelectionChange();
    });
    return () => {
      socket.off("horario-actualizado");
    };
  };

  const fetchDisponibilidad = async () => {
    if (!id_periodo || isNaN(id_periodo)) return;
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const url = `${apiUrl}/api/horarios/disponibilidad-matriz?id_periodo=${id_periodo}${id_ambiente && !isNaN(id_ambiente) ? `&id_ambiente=${id_ambiente}` : ''}${id_docente_actual ? `&id_docente=${id_docente_actual}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const map: Record<string, CeldaInfo> = {};

      const fillSlots = (dia: number, horaInicio: string, horaFin: string, info: Partial<CeldaInfo>) => {
        let current = parse(horaInicio, "HH:mm", new Date());
        const end = parse(horaFin, "HH:mm", new Date());
        
        while (current < end) {
          const slotHora = format(current, "HH:mm");
          const key = `${dia}-${slotHora}`;
          map[key] = {
            ...map[key],
            ...info,
            estado: info.estado || 'ocupado'
          } as CeldaInfo;
          current = addMinutes(current, 15);
        }
      };

      data.asignaciones.forEach((asig: any) => {
        fillSlots(asig.dia_semana, asig.hora_inicio, asig.hora_fin, {
          id_asignacion: asig.id_asignacion,
          id_docente: asig.id_docente,
          docente_nombre: `${asig.docente.nombres} ${asig.docente.apellidos}`,
          curso_nombre: asig.curso.nombre,
          tipo_clase: asig.tipo_clase,
          estado: 'ocupado'
        });
      });

      data.temporales.forEach((temp: any) => {
        const esMia = temp.id_docente === id_docente_actual;
        fillSlots(temp.dia_semana, temp.hora_inicio, temp.hora_fin, {
          id_seleccion: temp.id_seleccion,
          id_docente: temp.id_docente,
          docente_nombre: `${temp.docente.nombres} ${temp.docente.apellidos}`,
          curso_nombre: temp.curso.nombre,
          tipo_clase: temp.tipo_clase,
          estado: esMia ? 'seleccionado_mio' : 'ocupado'
        });
      });

      let curB = parse("12:00", "HH:mm", new Date());
      const endB = parse("13:00", "HH:mm", new Date());
      while (curB < endB) {
        const horaB = format(curB, "HH:mm");
        DIAS.forEach(dia => {
          const key = `${dia.id}-${horaB}`;
          if (!map[key]) {
            map[key] = { estado: 'bloqueado' };
          }
        });
        curB = addMinutes(curB, 15);
      }

      setDisponibilidad(map);
    } catch (error) {
      toast.error("Error al cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (dia: number, hora: string) => {
    if (soloLectura) {
      toast.info("El sistema está en modo solo lectura. Su ventana de atención ha finalizado.");
      return;
    }
    const key = `${dia}-${hora}`;
    const celda = disponibilidad[key];

    const esMia = celda?.id_docente === id_docente_actual;

    if (esMia && (celda?.id_seleccion || celda?.id_asignacion)) {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const url = celda.id_asignacion 
        ? `${apiUrl}/api/horarios/seleccionar-celda?id_asignacion=${celda.id_asignacion}`
        : `${apiUrl}/api/horarios/seleccionar-celda?id_seleccion=${celda.id_seleccion}`;
        
      try {
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          toast.success("Horario liberado correctamente");
          fetchDisponibilidad();
          if (onSelectionChange) onSelectionChange();
          getSocket().emit("horario-actualizado");
        }
      } catch (error) {
        toast.error("Error al eliminar");
      }
      return;
    }

    if (celda?.estado === 'bloqueado' || celda?.estado === 'ocupado') {
      if (celda?.estado === 'ocupado') {
        toast.info(`Ocupado por: ${celda.curso_nombre} (${celda.docente_nombre})`);
      }
      return;
    }

    if (onCellClick) {
      onCellClick(dia, hora);
    } else {
      if (!id_periodo || isNaN(id_periodo)) {
        toast.warning("Debe seleccionar un periodo académico");
        return;
      }
      if (!id_docente_actual || isNaN(id_docente_actual)) {
        toast.warning("Sesión de docente no válida o no iniciada");
        return;
      }
      if (!id_curso_actual || isNaN(id_curso_actual)) {
        toast.warning("Debe seleccionar un curso de 'Mis Cursos Asignados' primero");
        return;
      }
      if (!id_grupo_actual || isNaN(id_grupo_actual)) {
        toast.warning("Seleccione un Grupo en la configuración de bloque");
        return;
      }
      if (!id_ambiente || isNaN(id_ambiente)) {
        toast.warning("Seleccione un Ambiente en la configuración de bloque");
        return;
      }

      setProcessingCell(key);
      setConflictosActuales([]);
      setErrorCell(null);

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const hora_fin = format(addMinutes(parse(hora, "HH:mm", new Date()), intervalo), "HH:mm");
        const res = await fetch(`${apiUrl}/api/horarios/seleccionar-celda`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_docente: id_docente_actual,
            id_curso: id_curso_actual,
            id_grupo: id_grupo_actual,
            id_ambiente: id_ambiente,
            id_periodo: id_periodo,
            dia_semana: dia,
            hora_inicio: hora,
            hora_fin: hora_fin,
            tipo_clase: tipo_clase_actual || 'teoria',
            sesion_id: "sesion-temp-" + id_docente_actual
          })
        });

        const result = await res.json();
        if (res.ok && result.valido) {
          toast.success("Reserva temporal creada");
          await fetchDisponibilidad();
          if (onSelectionChange) onSelectionChange();
          getSocket().emit("horario-actualizado");
        } else {
          // Manejo detallado de conflictos
          if (result.conflictos) {
            setConflictosActuales(result.conflictos);
            setErrorCell(key);
            
            // Mostrar el primer error en toast pero dejar los demás en el panel
            const primerError = result.conflictos.find((c: any) => c.severidad === 'ERROR') || result.conflictos[0];
            toast.error(primerError.mensaje, {
              description: "Revise los detalles del conflicto en la matriz.",
              duration: 5000,
            });
          } else {
            toast.error(result.error || "Error al seleccionar");
          }
        }
      } catch (error) {
        toast.error("Error de conexión");
      } finally {
        setProcessingCell(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-card rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-muted border-t-primary rounded-full animate-spin" />
          <LayoutGrid className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">Cargando Matriz Académica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Toolbar de la Matriz Moderno */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Visualización</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-foreground whitespace-nowrap">Intervalo:</span>
              <Select 
                value={intervalo.toString()} 
                onValueChange={(v) => setIntervalo(parseInt(v))}
              >
                <SelectTrigger className="w-[130px] h-9 rounded-xl border-input bg-muted/50 font-bold text-xs focus:ring-2 focus:ring-primary/20 transition-all">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border shadow-2xl">
                  <SelectItem value="15" className="text-xs font-medium">15 min</SelectItem>
                  <SelectItem value="30" className="text-xs font-medium">30 min</SelectItem>
                  <SelectItem value="60" className="text-xs font-medium">1 hora</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground whitespace-nowrap">Filtrar por:</span>
            <Select 
              value={filtroHorario} 
              onValueChange={(v: any) => setFiltroHorario(v)}
            >
              <SelectTrigger className="w-[140px] h-9 rounded-xl border-input bg-muted/50 font-bold text-xs focus:ring-2 focus:ring-primary/20 transition-all">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-2xl">
                <SelectItem value="todos" className="text-xs font-medium">Todos</SelectItem>
                <SelectItem value="libres" className="text-xs font-medium">Solo Libres</SelectItem>
                <SelectItem value="ocupados" className="text-xs font-medium">Solo Ocupados</SelectItem>
                <SelectItem value="mios" className="text-xs font-medium">Solo Mis Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/50 rounded-2xl border border-border w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Libre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500 shadow-sm" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Ocupado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-sm" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Mío</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground shadow-sm" />
              <span className="text-[9px] font-bold text-muted-foreground uppercase">Bloqueo</span>
            </div>
          </div>

          {conflictosActuales.length > 0 && (
            <div className="flex items-center gap-3 p-2 px-4 bg-destructive/10 border border-destructive/20 rounded-xl animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-destructive uppercase tracking-tight">
                  Conflictos detectados ({conflictosActuales.length}):
                </p>
                <div className="flex flex-wrap gap-x-3">
                  {conflictosActuales.slice(0, 2).map((c, i) => (
                    <span key={i} className="text-[9px] font-bold text-destructive/80 italic">
                      • {c.mensaje}
                    </span>
                  ))}
                  {conflictosActuales.length > 2 && (
                    <span className="text-[9px] font-bold text-destructive/80 italic">+ {conflictosActuales.length - 2} más</span>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-destructive/10 text-destructive"
                onClick={() => {
                  setConflictosActuales([]);
                  setErrorCell(null);
                }}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 px-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Info className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <p className="text-[9px] font-bold text-amber-800 dark:text-amber-200 uppercase tracking-tight leading-tight">
              Receso Institucional: 12:00 PM - 1:00 PM
            </p>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-card rounded-2xl border border-border shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[1000px] table-fixed">
            <thead>
              <tr className="bg-primary sticky top-0 z-30 shadow-sm">
                <th className="w-24 p-4 text-center border-b border-r border-primary-foreground/10">
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-primary-foreground/60 mb-1" />
                    <span className="text-[10px] font-black text-primary-foreground uppercase tracking-widest">Hora</span>
                  </div>
                </th>
                {DIAS.map(dia => (
                  <th key={dia.id} className="p-4 text-center border-b border-primary-foreground/10">
                    <span className="text-xs font-bold text-primary-foreground uppercase tracking-widest">{dia.nombre}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeSlots.map(hora => {
                const horaInicio = parse(hora, "HH:mm", new Date());
                const horaFin = format(addMinutes(horaInicio, intervalo), "HH:mm");
                
                return (
                  <tr key={hora} className="group hover:bg-muted/30 transition-colors">
                    <td className="p-3 text-center border-r border-border bg-muted/20 sticky left-0 z-20 backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-bold text-primary tracking-tighter">{hora}</span>
                        <div className="h-2 w-[1px] bg-border" />
                        <span className="text-[9px] font-medium text-muted-foreground tracking-tighter">{horaFin}</span>
                      </div>
                    </td>
                  {DIAS.map(dia => {
                    const key = `${dia.id}-${hora}`;
                    const info = disponibilidad[key];
                    const esMia = id_docente_actual !== undefined && info?.id_docente === id_docente_actual;
                    const isProcessing = processingCell === key;
                    const hasError = errorCell === key;
                    
                    return (
                      <td
                        key={key}
                        onClick={() => !isProcessing && handleCellClick(dia.id, hora)}
                        className={cn(
                          "p-1.5 h-16 border-r border-border/50 transition-all duration-300 cursor-pointer relative group/cell",
                          !info && "hover:bg-emerald-500/10",
                          info?.estado === 'ocupado' && !esMia && "bg-rose-500/10 cursor-not-allowed",
                          esMia && "bg-amber-500/20 z-10",
                          info?.estado === 'bloqueado' && "bg-muted/50 cursor-not-allowed",
                          isProcessing && "cursor-wait opacity-70",
                          hasError && "bg-destructive/20 ring-2 ring-destructive z-20 animate-pulse",
                          filtroHorario === 'libres' && info && "opacity-20 pointer-events-none grayscale",
                          filtroHorario === 'ocupados' && !info && "opacity-20 pointer-events-none grayscale",
                          filtroHorario === 'mios' && !esMia && "opacity-20 pointer-events-none grayscale"
                        )}
                      >
                        {isProcessing && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-xl">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                          </div>
                        )}

                        {hasError && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-destructive/10 backdrop-blur-[1px] rounded-xl p-1 text-center">
                            <AlertCircle className="h-5 w-5 text-destructive mb-1" />
                            <span className="text-[8px] font-black text-red-700 uppercase leading-tight">Conflicto</span>
                          </div>
                        )}

                        {!info && !soloLectura && !isProcessing && !hasError && (
                          <div className="absolute inset-0 opacity-0 group-hover/cell:opacity-100 flex items-center justify-center pointer-events-none transition-opacity">
                            <Zap className="h-4 w-4 text-emerald-400 animate-pulse" />
                          </div>
                        )}

                        {info && (info.estado === 'ocupado' || esMia) && (
                          <div className={cn(
                            "absolute inset-1.5 rounded-xl flex flex-col items-center justify-center p-1.5 pl-3 text-[9px] leading-tight shadow-md border-l-4 transition-all duration-300 group-hover/cell:scale-[1.05] group-hover/cell:shadow-xl bg-card",
                            info.tipo_clase?.toLowerCase().includes('teoria') ? "border-l-blue-600 border-y-border border-r-border" :
                            info.tipo_clase?.toLowerCase().includes('laboratorio') ? "border-l-purple-600 border-y-border border-r-border" :
                            (info.tipo_clase?.toLowerCase().includes('practica') || info.tipo_clase?.toLowerCase().includes('práctica')) ? "border-l-sky-500 border-y-border border-r-border" :
                            "border-l-muted-foreground border-y-border border-r-border",
                            esMia && "ring-2 ring-primary/30 border-y-primary/10 border-r-primary/10"
                          )}>
                            {esMia && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-card shadow-md flex items-center justify-center z-10">
                                <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
                              </div>
                            )}
                            <span className="font-black truncate w-full text-left tracking-tighter uppercase text-[8px] sm:text-[9.5px] text-foreground">{info.curso_nombre}</span>
                            <span className="truncate w-full text-left opacity-70 font-bold text-[7.5px] sm:text-[8.5px] mt-0.5 text-muted-foreground italic">{info.docente_nombre?.split(' ')[0]}</span>
                            
                            <div className="flex items-center justify-between w-full mt-1.5">
                              <div className={cn(
                                "px-1.5 py-0.5 rounded-md font-black text-[7px] tracking-tighter uppercase border",
                                info.tipo_clase?.toLowerCase().includes('teoria') ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                                info.tipo_clase?.toLowerCase().includes('laboratorio') ? "bg-purple-500/10 text-purple-600 border-purple-500/20" :
                                (info.tipo_clase?.toLowerCase().includes('practica') || info.tipo_clase?.toLowerCase().includes('práctica')) ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                                "bg-muted text-muted-foreground border-border"
                              )}>
                                {info.tipo_clase?.toLowerCase().includes('teoria') ? 'TEO' : 
                                 info.tipo_clase?.toLowerCase().includes('laboratorio') ? 'LAB' : 
                                 (info.tipo_clase?.toLowerCase().includes('practica') || info.tipo_clase?.toLowerCase().includes('práctica')) ? 'PRÁ' :
                                 'DESC'}
                              </div>
                              {info.estado === 'ocupado' && !esMia && (
                                <Lock className="h-2.5 w-2.5 text-muted-foreground/40" />
                              )}
                            </div>
                          </div>
                        )}

                        {info?.estado === 'bloqueado' && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50/20 group-hover/cell:bg-gray-100/40 transition-colors">
                            <Lock className="h-4 w-4 text-gray-400 opacity-30 mb-1" />
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter opacity-0 group-hover/cell:opacity-100 transition-opacity">Receso</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
