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
  onCellClick
}: Props) {
  const [disponibilidad, setDisponibilidad] = useState<Record<string, CeldaInfo>>({});
  const [loading, setLoading] = useState(true);

  // Generar slots de tiempo (07:00 a 22:00 cada 15 min)
  const timeSlots = useMemo(() => {
    const slots = [];
    let current = parse("07:00", "HH:mm", new Date());
    const end = parse("22:00", "HH:mm", new Date());
    
    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, 15);
    }
    return slots;
  }, []);

  useEffect(() => {
    fetchDisponibilidad();
    setupSocket();
  }, [id_periodo, id_ambiente]);

  const setupSocket = () => {
    const socket = getSocket();
    socket.on("horario-actualizado", () => {
      fetchDisponibilidad();
    });
    return () => {
      socket.off("horario-actualizado");
    };
  };

  const fetchDisponibilidad = async () => {
    if (!id_periodo) return;
    setLoading(true);
    try {
      const url = `/api/horarios/disponibilidad-matriz?id_periodo=${id_periodo}${id_ambiente ? `&id_ambiente=${id_ambiente}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      
      const map: Record<string, CeldaInfo> = {};

      // Mapear asignaciones definitivas
      data.asignaciones.forEach((asig: any) => {
        const key = `${asig.dia_semana}-${asig.hora_inicio}`;
        map[key] = {
          id_asignacion: asig.id_asignacion,
          id_docente: asig.id_docente,
          docente_nombre: `${asig.docente.nombres} ${asig.docente.apellidos}`,
          curso_nombre: asig.curso.nombre,
          tipo_clase: asig.tipo_clase,
          estado: 'ocupado'
        };
      });

      // Mapear selecciones temporales
      data.temporales.forEach((temp: any) => {
        const key = `${temp.dia_semana}-${temp.hora_inicio}`;
        const esMia = temp.id_docente === id_docente_actual;
        map[key] = {
          id_seleccion: temp.id_seleccion,
          id_docente: temp.id_docente,
          docente_nombre: `${temp.docente.nombres} ${temp.docente.apellidos}`,
          curso_nombre: temp.curso.nombre,
          tipo_clase: temp.tipo_clase,
          estado: esMia ? 'seleccionado_mio' : 'ocupado'
        };
      });

      // Bloqueo institucional (ej: almuerzo 12-13)
      timeSlots.forEach(hora => {
        if (hora >= "12:00" && hora < "13:00") {
          DIAS.forEach(dia => {
            const key = `${dia.id}-${hora}`;
            if (!map[key]) {
              map[key] = { estado: 'bloqueado' };
            }
          });
        }
      });

      setDisponibilidad(map);
    } catch (error) {
      toast.error("Error al cargar disponibilidad");
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = async (dia: number, hora: string) => {
    const key = `${dia}-${hora}`;
    const celda = disponibilidad[key];

    if (celda?.estado === 'bloqueado' || celda?.estado === 'ocupado') return;

    if (onCellClick) {
      onCellClick(dia, hora);
    } else {
      // Lógica por defecto para docente autónomo
      if (!id_docente_actual || !id_curso_actual || !id_grupo_actual || !id_ambiente) {
        toast.warning("Debe seleccionar curso, grupo y ambiente primero");
        return;
      }

      try {
        const hora_fin = format(addMinutes(parse(hora, "HH:mm", new Date()), 60), "HH:mm");
        
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
            sesion_id: "sesion-temp-" + id_docente_actual // Simplificado
          })
        });

        const result = await res.json();
        if (result.valido) {
          toast.success("Reserva temporal creada");
          fetchDisponibilidad();
          getSocket().emit("actualizacion-horario");
        } else {
          toast.error(result.error || "Error al seleccionar");
        }
      } catch (error) {
        toast.error("Error de conexión");
      }
    }
  };

  if (loading) return <div>Cargando matriz...</div>;

  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm bg-white">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-50 w-24 sticky left-0 z-10">Hora</th>
            {DIAS.map(dia => (
              <th key={dia.id} className="border p-2 bg-gray-50">{dia.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {timeSlots.map(hora => (
            <tr key={hora}>
              <td className="border p-1 text-center text-xs font-medium bg-gray-50 sticky left-0 z-10">
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
                      "border p-0 h-10 transition-colors cursor-pointer relative group",
                      !info && "hover:bg-green-50 bg-green-50/20",
                      info?.estado === 'ocupado' && "bg-red-100 cursor-not-allowed",
                      info?.estado === 'seleccionado_mio' && "bg-yellow-200",
                      info?.estado === 'bloqueado' && "bg-gray-100 cursor-not-allowed"
                    )}
                  >
                    {info?.estado === 'ocupado' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-[10px] leading-tight overflow-hidden">
                        <span className="font-bold truncate w-full text-center">{info.curso_nombre}</span>
                        <span className="truncate w-full text-center">{info.docente_nombre}</span>
                      </div>
                    )}
                    {info?.estado === 'seleccionado_mio' && (
                      <div className="absolute inset-0 flex items-center justify-center p-1 text-[10px] font-bold text-yellow-800">
                        RESERVADO
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="p-4 border-t flex space-x-6 text-sm">
        <div className="flex items-center"><div className="w-4 h-4 bg-green-50 border mr-2"></div> Disponible</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-red-100 border mr-2"></div> Ocupado</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-yellow-200 border mr-2"></div> Mi Selección</div>
        <div className="flex items-center"><div className="w-4 h-4 bg-gray-100 border mr-2"></div> Bloqueado</div>
      </div>
    </div>
  );
}
