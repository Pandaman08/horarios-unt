"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { toast } from "sonner";
import { format, addMinutes, parse, startOfDay } from "date-fns";

interface CeldaInfo {
  id_asignacion?: number;
  id_seleccion?: number;
  id_docente?: number;
  docente_nombre?: string;
  curso_nombre?: string;
  tipo_clase?: string;
  estado: 'disponible' | 'ocupado' | 'seleccionado_mio' | 'bloqueado';
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
        
        // Usar 15 min para el mapeo interno siempre, para que sea exacto
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

      // Mapear asignaciones definitivas
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

      // Mapear selecciones temporales
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

      // Bloqueo institucional (ej: almuerzo 12-13)
      // Generar slots de 15 min para el mapeo de bloqueos
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

    // Si es modo solo lectura, bloquear todo
    if (soloLectura) {
      toast.info("El sistema está en modo solo lectura. Su ventana de atención ha finalizado.");
      return;
    }

    // Permitir eliminar si la celda es del docente actual (independientemente del estado visual)
    const esMia = celda?.id_docente === id_docente_actual;

    if (esMia && (celda?.id_seleccion || celda?.id_asignacion)) {
      try {
        const url = celda.id_asignacion 
          ? `/api/horarios/seleccionar-celda?id_asignacion=${celda.id_asignacion}`
          : `/api/horarios/seleccionar-celda?id_seleccion=${celda.id_seleccion}`;
          
        const res = await fetch(url, {
          method: "DELETE"
        });
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

    // Si no es mía y está bloqueada/ocupada, no hacer nada
    if (celda?.estado === 'bloqueado' || celda?.estado === 'ocupado') {
      if (celda?.estado === 'ocupado') {
        toast.info(`Ocupado por: ${celda.curso_nombre} (${celda.docente_nombre})`);
      }
      return;
    }

    if (onCellClick) {
      onCellClick(dia, hora);
    } else {
      // Lógica por defecto para docente autónomo
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

      try {
        // Reservar según el intervalo visible actual
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
          fetchDisponibilidad();
          if (onSelectionChange) onSelectionChange();
          getSocket().emit("horario-actualizado");
        } else {
          const msg = result.error || (result.conflictos && result.conflictos[0]?.mensaje) || "Error al seleccionar";
          toast.error(msg);
        }
      } catch (error) {
        toast.error("Error de conexión");
      }
    }
  };

  if (loading) return <div>Cargando matriz...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg border">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Ver por:</span>
          <select 
            value={intervalo} 
            onChange={(e) => setIntervalo(parseInt(e.target.value))}
            className="text-sm border rounded p-1 outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={60}>1 hora</option>
          </select>
        </div>
        <div className="flex flex-col space-y-2">
          <div className="flex space-x-4 text-xs">
            <div className="flex items-center"><div className="w-3 h-3 bg-green-50 border mr-1"></div> Libre</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-red-100 border mr-1"></div> Ocupado</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-yellow-200 border mr-1"></div> Mi Horario</div>
            <div className="flex items-center"><div className="w-3 h-3 bg-gray-100 border mr-1"></div> Bloqueo</div>
          </div>
          <div className="flex space-x-3 text-[10px] font-bold">
            <div className="flex items-center"><div className="w-2 h-2 bg-blue-100 border border-blue-200 mr-1"></div> TEORÍA</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-purple-100 border border-purple-200 mr-1"></div> LABORATORIO</div>
            <div className="flex items-center"><div className="w-2 h-2 bg-orange-100 border border-orange-200 mr-1"></div> PRÁCTICA</div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg shadow-sm bg-white max-h-[600px] overflow-y-auto">
        <table className="w-full border-collapse min-w-[800px] table-fixed">
          <thead>
            <tr className="sticky top-0 z-20 bg-gray-100 shadow-sm">
              <th className="border p-1 w-20 text-xs">Hora</th>
              {DIAS.map(dia => (
                <th key={dia.id} className="border p-1 text-xs font-bold">{dia.nombre}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(hora => (
              <tr key={hora}>
                <td className="border p-1 text-center text-[10px] font-medium bg-gray-50 sticky left-0 z-10">
                  {hora}
                </td>
                {DIAS.map(dia => {
                  const key = `${dia.id}-${hora}`;
                  const info = disponibilidad[key];
                  
                  return (
                    <td
                      key={key}
                      onClick={() => handleCellClick(dia.id, hora)}
                      className={cn(
                        "border p-0 h-8 transition-colors cursor-pointer relative group",
                        !info && "hover:bg-green-100/50 bg-green-50/10",
                        info?.estado === 'ocupado' && "bg-red-100/80 cursor-not-allowed",
                        info?.id_docente === id_docente_actual && "bg-yellow-200",
                        info?.estado === 'bloqueado' && "bg-gray-100 cursor-not-allowed"
                      )}
                    >
                      {info && (info.estado === 'ocupado' || info.id_docente === id_docente_actual) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-0.5 text-[8px] leading-[1.1] overflow-hidden">
                          <span className="font-bold truncate w-full text-center">{info.curso_nombre}</span>
                          <span className="truncate w-full text-center opacity-90">{info.docente_nombre}</span>
                          <span className={cn(
                            "px-1 rounded-[2px] mt-0.5 font-bold uppercase text-[7px]",
                            info.tipo_clase?.toLowerCase().includes('teoria') ? "bg-blue-100 text-blue-700" :
                            info.tipo_clase?.toLowerCase().includes('laboratorio') ? "bg-purple-100 text-purple-700" :
                            "bg-orange-100 text-orange-700"
                          )}>
                            {info.tipo_clase?.toLowerCase().includes('teoria') ? 'TEÓRICO' : 
                             info.tipo_clase?.toLowerCase().includes('laboratorio') ? 'LABORATORIO' : 
                             'PRÁCTICO'}
                          </span>
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
