"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { toast } from "sonner";
import { format, addMinutes, parse } from "date-fns";
import { obtenerMensajeErrorValidacion } from "@/lib/horarios/mensajesValidacion";

import {
  Clock,
  Info,
  Lock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  LayoutGrid,
  Zap,
  Loader2,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";

interface CeldaInfo {
  id_asignacion?: number;
  id_seleccion?: number;
  id_carga_no_lectiva?: number;
  id_docente?: number;
  docente_nombre?: string;
  curso_nombre?: string;
  ambiente_nombre?: string;
  tipo_clase?: string;

  estado:
    | "disponible"
    | "ocupado"
    | "seleccionado_mio"
    | "bloqueado"
    | "bloqueado_lectivo"
    | "error";

  mensaje_error?: string;
}

const DIAS_CODIGO = ["LU", "MA", "MI", "JU", "VI", "SA"];

const TIPO_NO_LECTIVA_LABELS: Record<string, string> = {
  PREPARACION_EVALUACION: 'Prep. y Evaluación',
  TUTORIA: 'Tutoría',
  INVESTIGACION: 'Investigación',
  CAPACITACION: 'Capacitación',
  GOBIERNO: 'Gobierno',
  ADMINISTRACION: 'Admin.',
  ASESORIA: 'Asesoría',
  RESPONSABILIDAD_SOCIAL: 'RSU',
  COMITES_TECNICOS: 'Comités',
  AUTOEVALUACION_ACREDITACION: 'Autoeval.',
};

const aplicarActividadesNoLectivas = (
  map: Record<string, CeldaInfo>,
  actividades: Array<any> | undefined,
  actividadSeleccionadaId: number | undefined,
  idDocente?: number
): Record<string, CeldaInfo> => {
  const next = { ...map };

  for (const key of Object.keys(next)) {
    const celda = next[key];
    if (!celda?.id_carga_no_lectiva) continue;

    if (celda.id_asignacion || celda.id_seleccion) {
      const { id_carga_no_lectiva: _id, curso_nombre: _curso, estado: _estado, id_docente: _doc, ...rest } = celda;
      next[key] = rest as CeldaInfo;
    } else {
      delete next[key];
    }
  }

  (actividades ?? []).forEach((carga: any) => {
    const esSeleccionada = actividadSeleccionadaId === carga.id_carga_no_lectiva;

    (carga.horarios || []).forEach((h: any) => {
      let current = parse(h.horaInicio, "HH:mm", new Date());
      const end = parse(h.horaFin, "HH:mm", new Date());

      while (current < end) {
        const slotHora = format(current, "HH:mm");
        const diaIndex = DIAS_CODIGO.indexOf(h.dia);
        const key = `${diaIndex}-${slotHora}`;

        if (next[key] && (next[key].id_asignacion || next[key].id_seleccion || next[key].estado === "bloqueado_lectivo")) {
          // keep lective assignment / guide blocks
        } else {
          next[key] = {
            ...next[key],
            id_carga_no_lectiva: carga.id_carga_no_lectiva,
            curso_nombre: TIPO_NO_LECTIVA_LABELS[carga.tipo] || carga.tipo || "No lectiva",
            docente_nombre: carga.descripcion || '',
            ambiente_nombre: carga.ambiente || '',
            id_docente: esSeleccionada ? idDocente : undefined,
            estado: esSeleccionada ? "seleccionado_mio" : "ocupado",
          } as CeldaInfo;
        }

        current = addMinutes(current, 15);
      }
    });
  });

  return next;
};

/** Pinta horarios lectivos del docente como guía bloqueada (fuente: /api/docentes/horarios). */
const aplicarHorariosLectivosDocente = (
  map: Record<string, CeldaInfo>,
  horarios: Array<any> | undefined,
  tipoVista?: string,
  idDocente?: number
): Record<string, CeldaInfo> => {
  if (tipoVista !== "no-lectiva" || !horarios?.length) return map;

  const next = { ...map };

  horarios.forEach((h) => {
    if (h.is_no_lectiva) return;

    let current = parse(h.hora_inicio, "HH:mm", new Date());
    const end = parse(h.hora_fin, "HH:mm", new Date());

    while (current < end) {
      const slotHora = format(current, "HH:mm");
      const key = `${h.dia_semana}-${slotHora}`;

      next[key] = {
        id_asignacion: h.id_asignacion,
        id_docente: idDocente,
        curso_nombre: h.curso_nombre || h.curso_codigo || "Carga lectiva",
        ambiente_nombre: h.ambiente_codigo || h.ambiente_nombre,
        tipo_clase: h.tipo_clase,
        estado: "bloqueado_lectivo",
      };

      current = addMinutes(current, 15);
    }
  });

  return next;
};

const aplicarCapasCargaHoraria = (
  map: Record<string, CeldaInfo>,
  horariosLectivos: Array<any> | undefined,
  actividades: Array<any> | undefined,
  actividadSeleccionadaId: number | undefined,
  tipoVista?: string,
  idDocente?: number
) =>
  aplicarActividadesNoLectivas(
    aplicarHorariosLectivosDocente(map, horariosLectivos, tipoVista, idDocente),
    actividades,
    actividadSeleccionadaId,
    idDocente
  );

interface ConflictoVisual {
  tipo: string;
  mensaje: string;
  severidad: "ERROR" | "ADVERTENCIA";
}

interface Props {
  id_periodo: number;

  id_ambiente?: number;

  id_docente_actual?: number;

  id_curso_actual?: number;

  id_grupo_actual?: number;

  tipo_clase_actual?: string;

  tipoVista?: string;

  actividadSeleccionadaId?: number;

  actividadesNoLectivas?: Array<any>;

  horariosLectivosDocente?: Array<any>;

  onCellClick?: (
    dia: number,
    hora: string
  ) => void;

  onRangeSelect?: (cells: Array<{dia: number; hora: string}>) => void;

  onRangeRemove?: (cells: Array<{dia: number; hora: string}>) => void;

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
  tipoVista,
  actividadSeleccionadaId,
  actividadesNoLectivas,
  horariosLectivosDocente,
  onCellClick,
  onRangeSelect,
  onRangeRemove,
  onSelectionChange,
  soloLectura: propSoloLectura,
}: Props) {
  const [disponibilidad, setDisponibilidad] =
    useState<Record<string, CeldaInfo>>(
      {}
    );

  const [loading, setLoading] =
    useState(true);

  const [intervalo, setIntervalo] =
    useState<number>(60);

  const [internalSoloLectura, setSoloLectura] =
    useState(false);

  const [processingCell, setProcessingCell] =
    useState<string | null>(null);

  const [
    conflictosActuales,
    setConflictosActuales,
  ] = useState<ConflictoVisual[]>([]);

  const [errorCell, setErrorCell] =
    useState<string | null>(null);

  const [filtroHorario, setFiltroHorario] =
    useState<
      "todos" | "libres" | "ocupados" | "mios"
    >("todos");

  const [dragStart, setDragStart] = useState<{dia: number; hora: string} | null>(null);
  const [dragEnd, setDragEnd] = useState<{dia: number; hora: string} | null>(null);
  const isDraggingRef = useRef(false);
  const isRemoveDragRef = useRef(false);

  const soloLectura =
    propSoloLectura ??
    internalSoloLectura;

  const timeSlots = useMemo(() => {
    const slots: string[] = [];

    let current = parse(
      "07:00",
      "HH:mm",
      new Date()
    );

    const end = parse(
      "22:00",
      "HH:mm",
      new Date()
    );

    while (current < end) {
      slots.push(format(current, "HH:mm"));

      current = addMinutes(
        current,
        intervalo
      );
    }

    return slots;
  }, [intervalo]);

  useEffect(() => {
    fetchDisponibilidad();

    checkAccess();

    const cleanup = setupSocket();

    return cleanup;
  }, [id_periodo, id_ambiente, id_curso_actual, id_grupo_actual, soloLectura]);

  // Re-map carga lectiva (guía) y carga no lectiva cuando cambian los datos
  useEffect(() => {
    if (!actividadesNoLectivas && !horariosLectivosDocente?.length) return;

    try {
      setDisponibilidad((prev) =>
        aplicarCapasCargaHoraria(
          prev,
          horariosLectivosDocente,
          actividadesNoLectivas,
          actividadSeleccionadaId,
          tipoVista,
          id_docente_actual
        )
      );
    } catch (err) {
      console.warn("Error remapeando capas de carga horaria", err);
    }
  }, [
    actividadesNoLectivas,
    horariosLectivosDocente,
    actividadSeleccionadaId,
    id_docente_actual,
    tipoVista,
  ]);

  const checkAccess = async () => {
    try {
      const res = await fetch(
        "/api/auth/check-access"
      );

      const data = await res.json();

      setSoloLectura(
        Boolean(data.soloLectura)
      );
    } catch (error) {
      console.error(
        "Error checking access",
        error
      );
    }
  };

  const setupSocket = () => {
    const socket = getSocket();

    socket.on(
      "horario-actualizado",
      () => {
        fetchDisponibilidad();

        if (onSelectionChange) {
          onSelectionChange();
        }
      }
    );

    return () => {
      socket.off("horario-actualizado");
    };
  };

  const fetchDisponibilidad =
    async () => {
      if (
        !id_periodo ||
        isNaN(id_periodo)
      ) {
        return;
      }

      setLoading(true);

      try {
        let url =
          `/api/horarios/disponibilidad-matriz?id_periodo=${id_periodo}`;

        if (
          id_ambiente !== undefined &&
          !isNaN(id_ambiente)
        ) {
          url += `&id_ambiente=${id_ambiente}`;
        }

        if (
          id_docente_actual !== undefined &&
          !isNaN(id_docente_actual)
        ) {
          url += `&id_docente=${id_docente_actual}`;
        }

        if (soloLectura) {
          url += "&modo_consulta=1";
        }

        if (
          id_curso_actual !== undefined &&
          !isNaN(id_curso_actual)
        ) {
          url += `&id_curso=${id_curso_actual}`;
        }

        if (
          id_grupo_actual !== undefined &&
          !isNaN(id_grupo_actual)
        ) {
          url += `&id_grupo=${id_grupo_actual}`;
        }

        const res = await fetch(url);

        const data = await res.json();

        const map: Record<
          string,
          CeldaInfo
        > = {};

        const fillSlots = (
          dia: number,
          horaInicio: string,
          horaFin: string,
          info: Partial<CeldaInfo>
        ) => {
          let current = parse(
            horaInicio,
            "HH:mm",
            new Date()
          );

          const end = parse(
            horaFin,
            "HH:mm",
            new Date()
          );

          while (current < end) {
            const slotHora = format(
              current,
              "HH:mm"
            );

            const key = `${dia}-${slotHora}`;

            map[key] = {
              ...map[key],
              ...info,
              estado:
                info.estado ??
                "ocupado",
            } as CeldaInfo;

            current = addMinutes(
              current,
              15
            );
          }
        };

        (data.asignaciones ?? []).forEach(
          (asig: any) => {
            const esMia =
              Number(asig.id_docente) === Number(id_docente_actual);

            fillSlots(
              asig.dia_semana,
              asig.hora_inicio,
              asig.hora_fin,
              {
                id_asignacion:
                  asig.id_asignacion,

                id_docente:
                  asig.id_docente,

                docente_nombre: `${asig.docente.nombres} ${asig.docente.apellidos}`,

                curso_nombre:
                  asig.curso.nombre,

                ambiente_nombre:
                  asig.ambiente?.codigo ||
                  asig.ambiente?.nombre,

                tipo_clase:
                  asig.tipo_clase,

                estado:
                  tipoVista === "no-lectiva" && esMia
                    ? "bloqueado_lectivo"
                    : esMia
                      ? "seleccionado_mio"
                      : "ocupado",
              }
            );
          }
        );

        (data.temporales ?? []).forEach(
          (temp: any) => {
            const esMia =
              Number(temp.id_docente) === Number(id_docente_actual);

            fillSlots(
              temp.dia_semana,
              temp.hora_inicio,
              temp.hora_fin,
              {
                id_seleccion:
                  temp.id_seleccion,

                id_docente:
                  temp.id_docente,

                docente_nombre: `${temp.docente.nombres} ${temp.docente.apellidos}`,

                curso_nombre:
                  temp.curso.nombre,

                ambiente_nombre:
                  temp.ambiente?.codigo ||
                  temp.ambiente?.nombre,

                tipo_clase:
                  temp.tipo_clase,

                estado:
                  tipoVista === "no-lectiva" && esMia
                    ? "bloqueado_lectivo"
                    : esMia
                      ? "seleccionado_mio"
                      : "ocupado",
              }
            );
          }
        );

        let curB = parse(
          "12:00",
          "HH:mm",
          new Date()
        );

        const endB = parse(
          "13:00",
          "HH:mm",
          new Date()
        );

        while (curB < endB) {
          const horaB = format(
            curB,
            "HH:mm"
          );

          DIAS.forEach((dia) => {
            const key = `${dia.id}-${horaB}`;

            if (!map[key]) {
              map[key] = {
                estado: "bloqueado",
              };
            }
          });

          curB = addMinutes(curB, 15);
        }

        setDisponibilidad(
          aplicarCapasCargaHoraria(
            map,
            horariosLectivosDocente,
            actividadesNoLectivas,
            actividadSeleccionadaId,
            tipoVista,
            id_docente_actual
          )
        );
      } catch (error) {
        console.error(error);

        toast.error(
          "Error al cargar disponibilidad"
        );
      } finally {
        setLoading(false);
      }
    };

  const handleCellClick = async (
    dia: number,
    hora: string
  ) => {
    if (soloLectura) {
      toast.info(
        "Modo solo lectura"
      );

      return;
    }

    const key = `${dia}-${hora}`;

    const celda =
      disponibilidad[key];

    const esMia =
      celda?.id_docente ===
      id_docente_actual;

    if (
      tipoVista !== "no-lectiva" &&
      esMia &&
      (celda?.id_seleccion ||
        celda?.id_asignacion)
    ) {
      try {
        const url =
          celda.id_asignacion
            ? `/api/horarios/seleccionar-celda?id_asignacion=${celda.id_asignacion}`
            : `/api/horarios/seleccionar-celda?id_seleccion=${celda.id_seleccion}`;

        const res = await fetch(url, {
          method: "DELETE",
        });

        if (res.ok) {
          toast.success(
            "Horario liberado"
          );

          fetchDisponibilidad();

          onSelectionChange?.();

          getSocket().emit(
            "horario-actualizado"
          );
        }
      } catch (error) {
        toast.error(
          "Error al eliminar"
        );
      }

      return;
    }

    if (
      onCellClick &&
      celda?.id_carga_no_lectiva &&
      actividadSeleccionadaId === celda.id_carga_no_lectiva
    ) {
      onCellClick(dia, hora);
      return;
    }

    if (
      celda?.estado === "bloqueado" ||
      celda?.estado === "bloqueado_lectivo" ||
      celda?.estado === "ocupado"
    ) {
      if (celda?.estado === "bloqueado_lectivo" && onCellClick) {
        toast.info("Este bloque está reservado por su carga lectiva");
      }
      return;
    }

    if (onCellClick) {
      onCellClick(dia, hora);

      return;
    }

    if (!id_docente_actual) {
      toast.warning(
        "Seleccione docente"
      );

      return;
    }

    if (!id_curso_actual) {
      toast.warning(
        "Seleccione curso"
      );

      return;
    }

    if (!id_grupo_actual) {
      toast.warning(
        "Seleccione grupo"
      );

      return;
    }

    if (!id_ambiente) {
      toast.warning(
        "Seleccione ambiente"
      );

      return;
    }

    setProcessingCell(key);

    try {
      const hora_fin = format(
        addMinutes(
          parse(
            hora,
            "HH:mm",
            new Date()
          ),
          intervalo
        ),
        "HH:mm"
      );

      const res = await fetch(
        "/api/horarios/seleccionar-celda",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            id_docente:
              id_docente_actual,

            id_curso:
              id_curso_actual,

            id_grupo:
              id_grupo_actual,

            id_ambiente,

            id_periodo,

            dia_semana: dia,

            hora_inicio: hora,

            hora_fin,

            tipo_clase:
              tipo_clase_actual ??
              "teoria",

            sesion_id:
              "sesion-temp-" +
              id_docente_actual,
          }),
        }
      );

      const result =
        await res.json();

      if (
        res.ok &&
        result.valido
      ) {
        toast.success(
          "Reserva creada"
        );

        fetchDisponibilidad();

        onSelectionChange?.();

        getSocket().emit(
          "horario-actualizado"
        );
      } else {
        toast.error(obtenerMensajeErrorValidacion(result));
      }
    } catch (error) {
      toast.error(
        "Error de conexión"
      );
    } finally {
      setProcessingCell(null);
    }
  };

  const cellsInDragRange = useMemo(() => {
    if (!dragStart || !dragEnd) return new Set<string>();
    const minDia = Math.min(dragStart.dia, dragEnd.dia);
    const maxDia = Math.max(dragStart.dia, dragEnd.dia);
    const startIdx = timeSlots.indexOf(dragStart.hora);
    const endIdx = timeSlots.indexOf(dragEnd.hora);
    if (startIdx === -1 || endIdx === -1) return new Set<string>();
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    const set = new Set<string>();
    for (let d = minDia; d <= maxDia; d++) {
      for (let i = minIdx; i <= maxIdx; i++) {
        set.add(`${d}-${timeSlots[i]}`);
      }
    }
    return set;
  }, [dragStart, dragEnd, timeSlots]);

  const handleCellMouseDown = (dia: number, hora: string, e: React.MouseEvent) => {
    if (soloLectura || processingCell) return;

    const key = `${dia}-${hora}`;
    const celda = disponibilidad[key];
    const esMia = celda?.id_docente === id_docente_actual;
    const esOwned = celda?.id_seleccion || celda?.id_asignacion;
    const esBloqueado = celda?.estado === 'bloqueado' || celda?.estado === 'bloqueado_lectivo' || celda?.estado === 'ocupado';

    if (tipoVista === 'no-lectiva' && actividadSeleccionadaId) {
      if (e.ctrlKey && celda?.id_carga_no_lectiva === actividadSeleccionadaId) {
        isDraggingRef.current = true;
        isRemoveDragRef.current = true;
        setDragStart({ dia, hora });
        setDragEnd({ dia, hora });
        return;
      }

      if (celda?.id_carga_no_lectiva === actividadSeleccionadaId) {
        onCellClick?.(dia, hora);
        return;
      }

      if (esBloqueado) return;

      isDraggingRef.current = true;
      isRemoveDragRef.current = false;
      setDragStart({ dia, hora });
      setDragEnd({ dia, hora });
      return;
    }

    // Lectiva mode: left-click drag (same as no-lectiva) / right-click also works
    if (e.button === 2) e.preventDefault();

    if (e.ctrlKey && esMia && esOwned) {
      isDraggingRef.current = true;
      isRemoveDragRef.current = true;
      setDragStart({ dia, hora });
      setDragEnd({ dia, hora });
      return;
    }

    if (esMia && esOwned) {
      handleCellClick(dia, hora);
      return;
    }

    if (esBloqueado) return;

    isDraggingRef.current = true;
    isRemoveDragRef.current = false;
    setDragStart({ dia, hora });
    setDragEnd({ dia, hora });
  };

  const handleCellMouseEnter = (dia: number, hora: string) => {
    if (!isDraggingRef.current || !dragStart) return;
    setDragEnd({ dia, hora });
  };

  const handleDragEnd = () => {
    if (!isDraggingRef.current || !dragStart || !dragEnd) {
      isDraggingRef.current = false;
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startIdx = timeSlots.indexOf(dragStart.hora);
    const endIdx = timeSlots.indexOf(dragEnd.hora);
    if (startIdx === -1 || endIdx === -1) {
      isDraggingRef.current = false;
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const minDia = Math.min(dragStart.dia, dragEnd.dia);
    const maxDia = Math.max(dragStart.dia, dragEnd.dia);
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);

    const rawCells: Array<{dia: number; hora: string}> = [];
    for (let d = minDia; d <= maxDia; d++) {
      for (let i = minIdx; i <= maxIdx; i++) {
        rawCells.push({ dia: d, hora: timeSlots[i] });
      }
    }

    const cells = rawCells.filter(cell => {
      const key = `${cell.dia}-${cell.hora}`;
      const celda = disponibilidad[key];

      if (isRemoveDragRef.current) {
        return tipoVista === 'no-lectiva'
          ? celda?.id_carga_no_lectiva === actividadSeleccionadaId
          : celda?.id_docente === id_docente_actual && (celda?.id_seleccion || celda?.id_asignacion);
      }

      return !celda || (
        celda.estado !== 'bloqueado' &&
        celda.estado !== 'bloqueado_lectivo' &&
        celda.estado !== 'ocupado'
      );
    });

    if (cells.length === 0) {
      isDraggingRef.current = false;
      isRemoveDragRef.current = false;
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    if (isRemoveDragRef.current) {
      if (onRangeRemove) {
        onRangeRemove(cells);
      } else {
        (async () => {
          for (const cell of cells) {
            const key = `${cell.dia}-${cell.hora}`;
            const celda = disponibilidad[key];
            if (celda?.id_seleccion) {
              await fetch(`/api/horarios/seleccionar-celda?id_seleccion=${celda.id_seleccion}`, { method: 'DELETE' });
            } else if (celda?.id_asignacion) {
              await fetch(`/api/horarios/seleccionar-celda?id_asignacion=${celda.id_asignacion}`, { method: 'DELETE' });
            }
          }
          toast.success('Reservas eliminadas');
          fetchDisponibilidad();
          onSelectionChange?.();
          getSocket().emit('horario-actualizado');
        })();
      }
    } else if (cells.length === 1 && onCellClick) {
      onCellClick(cells[0].dia, cells[0].hora);
    } else if (cells.length > 1 && onRangeSelect) {
      onRangeSelect(cells);
    } else if (cells.length >= 1) {
      (async () => {
        let hasError = false;
        for (const cell of cells) {
          const key = `${cell.dia}-${cell.hora}`;
          const celda = disponibilidad[key];
          if (celda?.estado === 'bloqueado' || celda?.estado === 'bloqueado_lectivo' || celda?.estado === 'ocupado') continue;

          const hora_fin = format(addMinutes(parse(cell.hora, "HH:mm", new Date()), intervalo || 60), "HH:mm");
          try {
            const res = await fetch("/api/horarios/seleccionar-celda", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id_docente: id_docente_actual,
                id_curso: id_curso_actual,
                id_grupo: id_grupo_actual,
                id_ambiente,
                id_periodo,
                dia_semana: cell.dia,
                hora_inicio: cell.hora,
                hora_fin,
                tipo_clase: tipo_clase_actual ?? "teoria",
                sesion_id: "sesion-temp-" + id_docente_actual,
              }),
            });
            const result = await res.json();
            if (!res.ok || !result.valido) {
              toast.error(result.error || result.mensaje || "Error al crear reserva");
              hasError = true;
              break;
            }
          } catch {
            toast.error("Error de conexión");
            hasError = true;
            break;
          }
        }
        if (!hasError) toast.success("Reservas creadas");
        fetchDisponibilidad();
        onSelectionChange?.();
        getSocket().emit("horario-actualizado");
      })();
    }

    isDraggingRef.current = false;
    isRemoveDragRef.current = false;
    setDragStart(null);
    setDragEnd(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-card rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <div className="h-16 w-16 border-4 border-muted border-t-primary rounded-full animate-spin" />

          <LayoutGrid className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>

        <p className="text-muted-foreground font-bold uppercase tracking-widest text-[10px]">
          Cargando Matriz...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card px-4 py-3 rounded-xl border border-border">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Intervalo</span>
            <Select
              value={intervalo.toString()}
              onValueChange={(v) => setIntervalo(Number(v))}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 min</SelectItem>
                <SelectItem value="30">30 min</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex flex-wrap items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-border bg-background" />
              Libre
            </span>
            {tipoVista === "no-lectiva" ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400/50 border border-amber-400/60" />
                  Mi carga no lectiva
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400/50" />
                  Carga lectiva (bloqueado)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500/15 border border-rose-200" />
                  Ocupado
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400/50 border border-amber-400/60" />
                  Mi reserva
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500/15 border border-rose-200" />
                  Ocupado
                </span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted-foreground" />
              Receso
            </span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 shrink-0">
          <Info className="h-3.5 w-3.5" />
          {tipoVista === "no-lectiva"
            ? "Use la matriz para ubicar su carga no lectiva sin cruzar horarios lectivos"
            : "Receso 12:00 – 13:00"}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm select-none" onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onContextMenu={(e) => e.preventDefault()}>
        <table className="w-full border-collapse min-w-[880px]">
          <thead>
            <tr className="bg-primary/90">
              <th className="w-16 py-2.5 px-2 text-[10px] font-bold text-primary-foreground sticky left-0 bg-primary/90 z-10">
                Hora
              </th>
              {DIAS.map((dia) => (
                <th
                  key={dia.id}
                  className="py-2.5 px-2 text-[10px] font-bold text-primary-foreground"
                >
                  {dia.nombre}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((hora) => (
              <tr key={hora}>
                <td className="py-2 px-2 text-center border-b border-border bg-muted/30 text-[10px] font-semibold text-muted-foreground sticky left-0 z-10">
                  {hora}
                </td>

                {DIAS.map((dia) => {
                  const key = `${dia.id}-${hora}`;

                  const info =
                    disponibilidad[key];

                  const esMia =
                    info?.id_docente ===
                    id_docente_actual;

                  const isProcessing =
                    processingCell ===
                    key;

                  const isInDragPreview = cellsInDragRange.has(key);

                  return (
                    <td
                      key={key}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        if (!isProcessing) handleCellMouseDown(dia.id, hora, e);
                      }}
                      onMouseEnter={() => isDraggingRef.current && handleCellMouseEnter(dia.id, hora)}
                      className={cn(
                        "relative h-12 border-b border-r border-border/60 cursor-pointer transition-colors select-none",
                        !info && !isInDragPreview && "hover:bg-emerald-500/10",
                        info?.estado === "ocupado" && !esMia && "bg-rose-500/10 cursor-not-allowed",
                        esMia && info?.estado !== "bloqueado_lectivo" && "bg-amber-400/35 ring-1 ring-inset ring-amber-500/40",
                        info?.estado === "bloqueado_lectivo" && "bg-blue-500/15 cursor-not-allowed ring-1 ring-inset ring-blue-400/40",
                        info?.estado === "bloqueado" && "bg-muted/60 cursor-not-allowed",
                        isInDragPreview && isRemoveDragRef.current && "bg-rose-400/30 ring-2 ring-inset ring-rose-500",
                        isInDragPreview && !isRemoveDragRef.current && "bg-emerald-400/30 ring-2 ring-inset ring-emerald-500"
                      )}
                    >
                      {isProcessing && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      )}

                      {!info &&
                        !soloLectura && (
                          <div className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Zap className="h-4 w-4 text-emerald-500" />
                          </div>
                        )}

                      {info &&
                        info.estado === "bloqueado_lectivo" && (
                          <div className="absolute inset-1 rounded-lg bg-blue-500/10 border border-blue-300/40 dark:border-blue-700/50 p-1 text-[9px] flex flex-col justify-between">
                            <div>
                              <p className="font-black truncate text-blue-800 dark:text-blue-300">
                                {info.curso_nombre}
                              </p>
                              <p className="truncate text-blue-700/80 dark:text-blue-400/80">
                                {info.ambiente_nombre || "Sin ambiente"}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] uppercase font-bold text-blue-700 dark:text-blue-400">
                                {info.tipo_clase}
                              </span>
                              <Lock className="h-3 w-3 text-blue-500" />
                            </div>
                          </div>
                        )}

                      {info &&
                        info.estado !== "bloqueado" &&
                        info.estado !== "bloqueado_lectivo" && (
                          info.id_carga_no_lectiva ? (
                            <div className={cn(
                              "absolute inset-1 rounded-lg border p-1 flex flex-col justify-between overflow-hidden transition-all",
                              esMia
                                ? "bg-amber-400/20 border-amber-500/60 shadow-sm"
                                : "bg-rose-500/10 border-rose-300/60"
                            )}>
                              <div className="min-w-0">
                                <p className="font-bold truncate text-[9px] leading-tight text-amber-800 dark:text-amber-300">
                                  {info.curso_nombre}
                                </p>
                                {info.docente_nombre && (
                                  <p className="truncate text-[8px] text-muted-foreground leading-tight mt-0.5">
                                    {info.docente_nombre}
                                  </p>
                                )}
                              </div>
                              {info.ambiente_nombre && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                  <span className="text-[7px] truncate text-muted-foreground">{info.ambiente_nombre}</span>
                                </div>
                              )}
                              {esMia && (
                                <CheckCircle2 className="absolute top-0.5 right-0.5 h-2.5 w-2.5 text-amber-600" />
                              )}
                            </div>
                          ) : (
                            <div className="absolute inset-1 rounded-lg bg-card border border-border p-1 text-[9px] flex flex-col justify-between">
                              <div>
                                <p className="font-black truncate">
                                  {
                                    info.curso_nombre
                                  }
                                </p>

                                <p className="truncate text-muted-foreground">
                                  {
                                    info.docente_nombre
                                  }
                                </p>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="text-[8px] uppercase font-bold">
                                  {
                                    info.tipo_clase
                                  }
                                </span>

                                {esMia ? (
                                  <CheckCircle2 className="h-3 w-3 text-primary" />
                                ) : (
                                  <Lock className="h-3 w-3 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                          )
                        )}

                      {info?.estado ===
                        "bloqueado" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Lock className="h-4 w-4 text-muted-foreground/40" />
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

      {conflictosActuales.length >
        0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />

              <p className="text-sm font-bold text-destructive">
                Conflictos detectados
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setConflictosActuales(
                  []
                );

                setErrorCell(null);
              }}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {conflictosActuales.map(
              (c, i) => (
                <div
                  key={i}
                  className="text-sm"
                >
                  • {c.mensaje}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}