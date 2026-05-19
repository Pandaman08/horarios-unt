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
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
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
      const url = `/api/horarios/disponibilidad-matriz?id_periodo=${id_periodo}${id_ambiente && !isNaN(id_ambiente) ? `&id_ambiente=${id_ambiente}` : ''}${id_docente_actual ? `&id_docente=${id_docente_actual}` : ''}`;
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
        const url = celda.id_asignacion 
          ? `/api/horarios/seleccionar-celda?id_asignacion=${celda.id_asignacion}`
          : `/api/horarios/seleccionar-celda?id_seleccion=${celda.id_seleccion}`;
          
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
        const hora_fin = format(addMinutes(parse(hora, "HH:mm", new Date()), intervalo), "HH:mm");
        const res = await fetch("/api/horarios/seleccionar-celda", {
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
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white/50 backdrop-blur-sm rounded-[32px] border-2 border-dashed border-blue-100">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <LayoutGrid className="h-6 w-6 text-blue-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-blue-900/60 font-black uppercase tracking-widest text-xs">Cargando Matriz Académica...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Toolbar de la Matriz */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-[32px] shadow-xl shadow-blue-900/5 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0">
            <Clock className="h-6 w-6 text-[#003366]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em]">Visualización</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Intervalo:</span>
              <Select 
                value={intervalo.toString()} 
                onValueChange={(v) => setIntervalo(parseInt(v))}
              >
                <SelectTrigger className="w-[130px] h-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs focus:ring-4 focus:ring-blue-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
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
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Filtrar por:</span>
            <Select 
              value={filtroHorario} 
              onValueChange={(v: any) => setFiltroHorario(v)}
            >
              <SelectTrigger className="w-[140px] h-9 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-xs focus:ring-4 focus:ring-blue-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-100 shadow-2xl">
                <SelectItem value="todos" className="text-xs font-medium">Todos</SelectItem>
                <SelectItem value="libres" className="text-xs font-medium">Solo Libres</SelectItem>
                <SelectItem value="ocupados" className="text-xs font-medium">Solo Ocupados</SelectItem>
                <SelectItem value="mios" className="text-xs font-medium">Solo Mis Horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50/50 rounded-2xl border border-gray-100 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              <span className="text-[9px] font-black text-gray-500 uppercase">Libre</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
              <span className="text-[9px] font-black text-gray-500 uppercase">Ocupado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
              <span className="text-[9px] font-black text-gray-500 uppercase">Mío</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              <span className="text-[9px] font-black text-gray-500 uppercase">Bloqueo</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.4)]" />
              <span className="text-[9px] font-black text-red-600 uppercase">Conflicto</span>
            </div>
          </div>

          {conflictosActuales.length > 0 && (
            <div className="flex items-center gap-3 p-2 px-4 bg-red-50 border border-red-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <div className="flex flex-col">
                <p className="text-[10px] font-black text-red-800 uppercase tracking-tight">
                  Se detectaron {conflictosActuales.length} conflictos:
                </p>
                <div className="flex flex-wrap gap-x-4">
                  {conflictosActuales.map((c, i) => (
                    <span key={i} className="text-[9px] font-bold text-red-600/80 italic">
                      • {c.mensaje}
                    </span>
                  ))}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 rounded-full hover:bg-red-100 text-red-600"
                onClick={() => {
                  setConflictosActuales([]);
                  setErrorCell(null);
                }}
              >
                <XCircle className="h-3 w-3" />
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 px-3 bg-amber-50 border border-amber-100 rounded-xl animate-in fade-in duration-500">
            <Info className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-[9px] font-bold text-amber-800 uppercase tracking-tight leading-tight">
              Nota: El horario de 12:00 PM a 1:00 PM está reservado para receso institucional.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="inline-flex items-center bg-blue-50 text-blue-700 border-2 border-blue-200 font-black text-[9px] px-2.5 py-1 rounded-lg shrink-0 shadow-sm">TEORÍA</span>
            <span className="inline-flex items-center bg-purple-50 text-purple-700 border-2 border-purple-200 font-black text-[9px] px-2.5 py-1 rounded-lg shrink-0 shadow-sm">LAB</span>
            <span className="inline-flex items-center bg-orange-50 text-orange-700 border-2 border-orange-200 font-black text-[9px] px-2.5 py-1 rounded-lg shrink-0 shadow-sm">PRÁCTICA</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden bg-white rounded-[40px] shadow-2xl shadow-blue-900/10 border border-gray-100">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse min-w-[900px] table-fixed">
            <thead>
              <tr className="bg-[#003366] sticky top-0 z-30 shadow-md">
                <th className="w-24 p-4 text-center border-b border-r border-white/10">
                  <div className="flex flex-col items-center">
                    <Clock className="h-4 w-4 text-blue-200 mb-1" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Hora</span>
                  </div>
                </th>
                {DIAS.map(dia => (
                  <th key={dia.id} className="p-4 text-center border-b border-white/10 group">
                    <div className="flex flex-col items-center group-hover:scale-110 transition-transform">
                      <span className="text-xs font-black text-white uppercase tracking-[0.2em]">{dia.nombre}</span>
                      <div className="h-1 w-8 bg-yellow-400 rounded-full mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {timeSlots.map(hora => {
                const horaInicio = parse(hora, "HH:mm", new Date());
                const horaFin = format(addMinutes(horaInicio, intervalo), "HH:mm");
                
                return (
                  <tr key={hora} className="group hover:bg-blue-50/20 transition-colors">
                    <td className="p-3 text-center border-r border-gray-100 bg-gray-50/50 sticky left-0 z-20 backdrop-blur-sm shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[11px] font-black text-[#003366] tracking-tighter">{hora}</span>
                        <div className="h-2 w-[1px] bg-gray-300" />
                        <span className="text-[9px] font-bold text-gray-400 tracking-tighter">{horaFin}</span>
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
                        title={info ? `${info.curso_nombre} - Docente: ${info.docente_nombre} - Tipo: ${info.tipo_clase} - Horario: ${dia.nombre} ${hora}` : "Libre"}
                        className={cn(
                          "p-1.5 h-16 border-r border-gray-50 transition-all duration-300 cursor-pointer relative group/cell",
                          !info && "hover:bg-emerald-50/50 bg-transparent",
                          info?.estado === 'ocupado' && !esMia && "bg-red-50/40 cursor-not-allowed bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZTUyNTIiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgNDBoNDB2LTQwSDB2NDB6bTIwLTQwSDQwTDAgNDBoMjB6Ii8+PC9nPjwvZz48L3N2Zz4=')]",
                          esMia && "bg-yellow-50/60 z-10",
                          info?.estado === 'bloqueado' && "bg-gray-100/60 cursor-not-allowed grayscale",
                          isProcessing && "cursor-wait opacity-70",
                          hasError && "bg-red-100 ring-2 ring-red-500 z-20 animate-pulse",
                          // Aplicar filtros de opacidad
                          filtroHorario === 'libres' && info && "opacity-20 pointer-events-none grayscale",
                          filtroHorario === 'ocupados' && !info && "opacity-20 pointer-events-none grayscale",
                          filtroHorario === 'mios' && !esMia && "opacity-20 pointer-events-none grayscale"
                        )}
                      >
                        {isProcessing && (
                          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 backdrop-blur-[1px] rounded-xl">
                            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                          </div>
                        )}

                        {hasError && (
                          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-50/80 backdrop-blur-[1px] rounded-xl p-1 text-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mb-1" />
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
                            "absolute inset-1.5 rounded-xl flex flex-col items-center justify-center p-1.5 pl-3 text-[9px] leading-tight shadow-md border-l-4 transition-all duration-300 group-hover/cell:scale-[1.05] group-hover/cell:shadow-xl bg-white",
                            info.tipo_clase?.toLowerCase().includes('teoria') ? "border-l-blue-600 border-y-gray-100 border-r-gray-100" :
                            info.tipo_clase?.toLowerCase().includes('laboratorio') ? "border-l-purple-600 border-y-gray-100 border-r-gray-100" :
                            (info.tipo_clase?.toLowerCase().includes('practica') || info.tipo_clase?.toLowerCase().includes('práctica')) ? "border-l-orange-500 border-y-gray-100 border-r-gray-100" :
                            "border-l-gray-400 border-y-gray-100 border-r-gray-100",
                            esMia && "ring-2 ring-yellow-400/30 border-y-yellow-100 border-r-yellow-100"
                          )}>
                            {esMia && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white shadow-md flex items-center justify-center z-10">
                                <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                              </div>
                            )}
                            <span className="font-black truncate w-full text-left tracking-tighter uppercase text-[8px] sm:text-[9.5px] text-[#003366]">{info.curso_nombre}</span>
                            <span className="truncate w-full text-left opacity-70 font-bold text-[7.5px] sm:text-[8.5px] mt-0.5 text-gray-500 italic">{info.docente_nombre?.split(' ')[0]}</span>
                            
                            <div className="flex items-center justify-between w-full mt-1.5">
                              <div className={cn(
                                "px-1.5 py-0.5 rounded-md font-black text-[7px] tracking-tighter uppercase border",
                                info.tipo_clase?.toLowerCase().includes('teoria') ? "bg-blue-50 text-blue-700 border-blue-100" :
                                info.tipo_clase?.toLowerCase().includes('laboratorio') ? "bg-purple-50 text-purple-700 border-purple-100" :
                                (info.tipo_clase?.toLowerCase().includes('practica') || info.tipo_clase?.toLowerCase().includes('práctica')) ? "bg-orange-50 text-orange-700 border-orange-100" :
                                "bg-gray-50 text-gray-700 border-gray-100"
                              )}>
                                {info.tipo_clase?.toLowerCase().includes('teoria') ? 'TEO' : 
                                 info.tipo_clase?.toLowerCase().includes('laboratorio') ? 'LAB' : 
                                 (info.tipo_clase?.toLowerCase().includes('practica') || info.tipo_clase?.toLowerCase().includes('práctica')) ? 'PRÁ' :
                                 'DESC'}
                              </div>
                              {info.estado === 'ocupado' && !esMia && (
                                <Lock className="h-2.5 w-2.5 text-gray-300" />
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
