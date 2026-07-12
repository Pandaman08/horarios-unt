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
import { useLocale } from "@/contexts/LocaleContext";
import type { TranslationKey } from "@/lib/i18n/translations";

function getTipoColor(tipo?: string) {
  switch (tipo) {
    case "teoria":
      return {
        own: "bg-blue-500/15 border-blue-400/60",
        ownRing: "ring-blue-400/30",
        text: "text-blue-800 dark:text-blue-200",
        textMuted: "text-blue-600/80 dark:text-blue-400/80",
        badge: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
        blocked: "bg-blue-50/80 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/50",
        blockedText: "text-blue-700/70 dark:text-blue-400/70",
        td: "bg-blue-500/8",
      };
    case "practica":
      return {
        own: "bg-emerald-500/15 border-emerald-400/60",
        ownRing: "ring-emerald-400/30",
        text: "text-emerald-800 dark:text-emerald-200",
        textMuted: "text-emerald-600/80 dark:text-emerald-400/80",
        badge: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
        blocked: "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/50",
        blockedText: "text-emerald-700/70 dark:text-emerald-400/70",
        td: "bg-emerald-500/8",
      };
    case "laboratorio":
      return {
        own: "bg-violet-500/15 border-violet-400/60",
        ownRing: "ring-violet-400/30",
        text: "text-violet-800 dark:text-violet-200",
        textMuted: "text-violet-600/80 dark:text-violet-400/80",
        badge: "bg-violet-500/20 text-violet-700 dark:text-violet-300",
        blocked: "bg-violet-50/80 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-800/50",
        blockedText: "text-violet-700/70 dark:text-violet-400/70",
        td: "bg-violet-500/8",
      };
    default:
      return {
        own: "bg-slate-500/15 border-slate-400/60",
        ownRing: "ring-slate-400/30",
        text: "text-slate-800 dark:text-slate-200",
        textMuted: "text-slate-600/80 dark:text-slate-400/80",
        badge: "bg-slate-500/20 text-slate-700 dark:text-slate-300",
        blocked: "bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/50",
        blockedText: "text-slate-500",
        td: "bg-slate-500/5",
      };
  }
}

interface CeldaInfo {
  id_asignacion?: number;
  id_seleccion?: number;
  id_carga_no_lectiva?: number;
  id_docente?: number;
  id_curso?: number;
  docente_nombre?: string;
  curso_nombre?: string;
  ambiente_nombre?: string;
  tipo_clase?: string;
  grupo_nombre?: string;
  subgrupo_label?: string;

  estado:
    | "disponible"
    | "ocupado"
    | "seleccionado_mio"
    | "bloqueado"
    | "bloqueado_lectivo"
    | "no_disponible"
    | "error";

  mensaje_error?: string;
  disponible?: boolean;
}

const DIAS_CODIGO = ["LU", "MA", "MI", "JU", "VI", "SA"];

function getDias(t: (key: TranslationKey) => string) {
  return [
    { id: 0, nombre: t("dayMonday") },
    { id: 1, nombre: t("dayTuesday") },
    { id: 2, nombre: t("dayWednesday") },
    { id: 3, nombre: t("dayThursday") },
    { id: 4, nombre: t("dayFriday") },
    { id: 5, nombre: t("daySaturday") },
  ];
}

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

  rol_viewer?: "docente" | "secretaria";

  cursoActivoId?: number;

  numSubgrupos?: number;

  subgrupoActivo?: number;
}

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
  rol_viewer,
  cursoActivoId,
  numSubgrupos = 1,
  subgrupoActivo = 1,
}: Props) {
  const { t } = useLocale();
  const DIAS = getDias(t);
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
    if (numSubgrupos > 1) {
      const nuevoIntervalo = Math.floor(60 / numSubgrupos);
      setIntervalo(nuevoIntervalo);
    }
  }, [numSubgrupos]);

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

      console.log(`🔍 [FETCH] id_periodo=${id_periodo} id_docente=${id_docente_actual} id_ambiente=${id_ambiente}`);

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

                id_curso:
                  asig.id_curso,

                docente_nombre: `${asig.docente.nombres} ${asig.docente.apellidos}`,

                curso_nombre:
                  asig.curso.nombre,

                ambiente_nombre:
                  asig.ambiente?.codigo ||
                  asig.ambiente?.nombre,

                tipo_clase:
                  asig.tipo_clase,

                grupo_nombre:
                  asig.grupo?.codigo_grupo || "",

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

                id_curso:
                  temp.id_curso,

                docente_nombre: `${temp.docente.nombres} ${temp.docente.apellidos}`,

                curso_nombre:
                  temp.curso.nombre,

                ambiente_nombre:
                  temp.ambiente?.codigo ||
                  temp.ambiente?.nombre,

                tipo_clase:
                  temp.tipo_clase,

                grupo_nombre:
                  temp.grupo?.codigo_grupo || "",

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
                disponible: false,
              };
            }
          });

          curB = addMinutes(curB, 15);
        }

        // Sincronizar la matriz con la disponibilidad registrada por el docente
        if (data.disponibilidad && id_docente_actual !== undefined) {
          const disponibilidadRows = (data.disponibilidad as Array<{ dia_semana: number; hora_inicio: string; disponible: boolean }>) ?? [];
          const slotsDisponibles = disponibilidadRows.filter((slot) => slot.disponible);
          const slotsNoDisponibles = disponibilidadRows.filter((slot) => !slot.disponible);

          console.log(`📊 [MATRIZ] Disponibilidad para docente ${id_docente_actual}: disponibles=${slotsDisponibles.length}, noDisponibles=${slotsNoDisponibles.length}, total=${disponibilidadRows.length}`);

          slotsDisponibles.forEach((slot) => {
            const startH = Number.parseInt(slot.hora_inicio.split(':')[0], 10);
            for (let m = 0; m < 60; m += 15) {
              const slotHora = `${String(startH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              const key = `${slot.dia_semana}-${slotHora}`;
              if (!map[key]) {
                map[key] = { estado: 'disponible', disponible: true };
              }
            }
          });

          slotsNoDisponibles.forEach((slot) => {
            const startH = Number.parseInt(slot.hora_inicio.split(':')[0], 10);
            for (let m = 0; m < 60; m += 15) {
              const slotHora = `${String(startH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
              const key = `${slot.dia_semana}-${slotHora}`;
              if (!map[key]) {
                map[key] = { estado: 'no_disponible', disponible: false };
              }
            }
          });
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

        toast.error(t("errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

  const handleCellClick = async (
    dia: number,
    hora: string
  ) => {
    if (soloLectura) {
        toast.info(t("soloLectura"));

      return;
    }

    const key = `${dia}-${hora}`;
    const celda = disponibilidad[key];
    const esDeOtraAsignacion = cursoActivoId && celda?.id_curso && (
      celda.id_curso !== cursoActivoId ||
      (tipo_clase_actual && celda.tipo_clase && celda.tipo_clase !== tipo_clase_actual)
    );
    if (esDeOtraAsignacion) return;

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
          toast.success(t("scheduleReleased"));

          fetchDisponibilidad();

          onSelectionChange?.();

          getSocket().emit(
            "horario-actualizado"
          );
        }
      } catch (error) {
        toast.error(t("errorDeleting"));
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
                      celda?.estado === "ocupado" ||
                      celda?.estado === "no_disponible"
                    ) {
      if (celda?.estado === "bloqueado_lectivo" && onCellClick) {
          toast.info(t("lectureBlockReserved"));
      }
      if (celda?.estado === "no_disponible") {
          toast.info(t("notAvailable"));
      }
      return;
    }

    if (onCellClick) {
      onCellClick(dia, hora);

      return;
    }

    if (!id_docente_actual) {
      toast.warning(t("selectDocente"));

      return;
    }

    if (!id_curso_actual) {
      toast.warning(t("selectCourseFirst"));

      return;
    }

    if (!id_grupo_actual) {
      toast.warning(t("selectGroupFirst"));

      return;
    }

    if (!id_ambiente) {
      toast.warning(t("selectEnvFirst"));

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
        toast.success(t("reservationCreated"));

        fetchDisponibilidad();

        onSelectionChange?.();

        getSocket().emit(
          "horario-actualizado"
        );
      } else {
        toast.error(obtenerMensajeErrorValidacion(result));
      }
    } catch (error) {
      toast.error(t("connectionError"));
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
    const esBloqueado = celda?.estado === 'bloqueado' || celda?.estado === 'bloqueado_lectivo' || celda?.estado === 'ocupado' || celda?.estado === 'no_disponible';
    const esDeOtraAsignacion = cursoActivoId && celda?.id_curso && (
      celda.id_curso !== cursoActivoId ||
      (tipo_clase_actual && celda.tipo_clase && celda.tipo_clase !== tipo_clase_actual)
    );

    if (esDeOtraAsignacion) return;

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

      if (cursoActivoId && celda?.id_curso && (
        celda.id_curso !== cursoActivoId ||
        (tipo_clase_actual && celda.tipo_clase && celda.tipo_clase !== tipo_clase_actual)
      )) return false;

      if (isRemoveDragRef.current) {
        return tipoVista === 'no-lectiva'
          ? celda?.id_carga_no_lectiva === actividadSeleccionadaId
          : celda?.id_docente === id_docente_actual && (celda?.id_seleccion || celda?.id_asignacion);
      }

      return !celda || (
        celda.estado !== 'bloqueado' &&
        celda.estado !== 'bloqueado_lectivo' &&
        celda.estado !== 'ocupado' &&
        celda.estado !== 'no_disponible'
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
          toast.success(t('reservationsDeleted'));
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
          if (celda?.estado === 'bloqueado' || celda?.estado === 'bloqueado_lectivo' || celda?.estado === 'ocupado' || celda?.estado === 'no_disponible') continue;

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
              toast.error(result.error || result.mensaje || t("errorCreatingReservation"));
              hasError = true;
              break;
            }
          } catch {
            toast.error(t("connectionError"));
          }
        }
        if (!hasError) toast.success(t("reservationsCreated"));
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

        <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
          {t("loadingMatrix")}
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
            <span className="text-xs font-bold uppercase text-muted-foreground">{t("interval")}</span>
            <Select
              value={intervalo.toString()}
              onValueChange={(v) => setIntervalo(Number(v))}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">{t("interval15")}</SelectItem>
                <SelectItem value="30">{t("interval30")}</SelectItem>
                <SelectItem value="60">{t("interval60")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="hidden sm:block h-4 w-px bg-border" />
          <div className="flex flex-wrap items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-border bg-background" />
              {t("free")}
            </span>
            {tipoVista === "no-lectiva" ? (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400/50 border border-amber-400/60" />
                  {t("myNonLective")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-500/20 border border-blue-400/50" />
                  {t("lectiveBlocked")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500/15 border border-rose-200" />
                  {t("occupied")}
                </span>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-400/50 border border-amber-400/60" />
                  {t("myReservation")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-rose-500/15 border border-rose-200" />
                  {t("occupied")}
                </span>
              </>
            )}
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-slate-300/60 dark:border-slate-600/60 bg-slate-100/50 dark:bg-slate-800/30" />
              {t("notAvailable")}
            </span>
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-muted-foreground" />
              {t("breakLabel")}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
          <Info className="h-3.5 w-3.5" />
          {tipoVista === "no-lectiva"
            ? t("useMatrixHelp")
            : t("breakTime")}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm select-none" onMouseUp={handleDragEnd} onMouseLeave={handleDragEnd} onContextMenu={(e) => e.preventDefault()}>
        <table className="w-full border-collapse min-w-[880px]">
          <thead>
            <tr className="bg-primary/90">
              <th className="w-16 py-2.5 px-2 text-xs font-bold text-primary-foreground sticky left-0 bg-primary/90 z-10">
                {t("hour")}
              </th>
              {DIAS.map((dia) => (
                <th
                  key={dia.id}
                  className="py-2.5 px-2 text-xs font-bold text-primary-foreground"
                >
                  {dia.nombre}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((hora) => (
              <tr key={hora}>
                <td className="py-2 px-2 text-center border-b border-border bg-muted/30 text-xs font-semibold text-muted-foreground sticky left-0 z-10">
                  {hora}
                </td>

                {DIAS.map((dia) => {
                  const key = `${dia.id}-${hora}`;

                  const info =
                    disponibilidad[key];

                  const esMia =
                    info?.id_docente ===
                    id_docente_actual;

                  const esDelCursoActivo = cursoActivoId && tipo_clase_actual
                    ? info?.id_curso === cursoActivoId && info?.tipo_clase === tipo_clase_actual
                    : cursoActivoId
                      ? info?.id_curso === cursoActivoId
                      : true;

                  const esDeOtraAsignacion = cursoActivoId && info?.id_curso && (
                    info.id_curso !== cursoActivoId ||
                    (tipo_clase_actual && info.tipo_clase && info.tipo_clase !== tipo_clase_actual)
                  );

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
                        esDeOtraAsignacion && `${getTipoColor(info?.tipo_clase).td} cursor-not-allowed`,
                        info?.estado === "ocupado" && !esMia && !esDeOtraAsignacion && "bg-rose-500/10 cursor-not-allowed",
                        esMia && info?.estado !== "bloqueado_lectivo" && !esDeOtraAsignacion && `${getTipoColor(info?.tipo_clase).td} ring-1 ring-inset ${getTipoColor(info?.tipo_clase).ownRing}`,
                        info?.estado === "bloqueado_lectivo" && "bg-blue-500/15 cursor-not-allowed ring-1 ring-inset ring-blue-400/40",
                        info?.estado === "disponible" && "bg-emerald-500/10 ring-1 ring-inset ring-emerald-400/40",
                        info?.estado === "no_disponible" && !info?.id_carga_no_lectiva && "bg-slate-100/50 dark:bg-slate-800/30 cursor-not-allowed ring-1 ring-inset ring-slate-200/60 dark:ring-slate-700/50",
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
                          <div className="absolute inset-1 rounded-lg bg-blue-500/10 border border-blue-300/40 dark:border-blue-700/50 p-1 text-xs flex flex-col justify-between">
                            <div>
                              <p className="font-black truncate text-[10px] leading-tight text-blue-800 dark:text-blue-200">
                                {info.curso_nombre}
                              </p>
                              <p className="truncate text-[9px] text-blue-600/80 dark:text-blue-400/80 leading-tight">
                                {info.ambiente_nombre || t("noEnvironment")}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300">
                                {info.tipo_clase}
                              </span>
                              <Lock className="h-3 w-3 text-blue-500/60" />
                            </div>
                          </div>
                        )}

                      {info && info.estado === "disponible" && (
                        <div className="absolute inset-1 rounded-lg border border-emerald-300/60 bg-emerald-500/10 dark:bg-emerald-950/20 flex items-center justify-center">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                      )}

                      {info &&
                        info.estado !== "bloqueado" &&
                        info.estado !== "bloqueado_lectivo" &&
                        info.estado !== "disponible" && (
                          info.id_carga_no_lectiva ? (
                            <div className={cn(
                              "absolute inset-1 rounded-lg border p-1 flex flex-col justify-between overflow-hidden transition-all",
                              esMia
                                ? `${getTipoColor(info.tipo_clase).own} shadow-sm`
                                : `${getTipoColor(info.tipo_clase).blocked} border-dashed`
                            )}>
                              <div className="min-w-0">
                                <p className={cn("font-bold truncate text-[10px] leading-tight", getTipoColor(info.tipo_clase).text)}>
                                  {info.curso_nombre}
                                </p>
                                {info.docente_nombre && (
                                  <p className={cn("truncate text-[9px] leading-tight mt-0.5", getTipoColor(info.tipo_clase).textMuted)}>
                                    {info.docente_nombre}
                                  </p>
                                )}
                              </div>
                              {info.ambiente_nombre && (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", esMia ? "bg-current opacity-60" : "bg-current opacity-30", getTipoColor(info.tipo_clase).textMuted)} />
                                  <span className={cn("text-[7px] truncate", getTipoColor(info.tipo_clase).textMuted)}>{info.ambiente_nombre}</span>
                                </div>
                              )}
                              {esMia && (
                                <CheckCircle2 className={cn("absolute top-0.5 right-0.5 h-2.5 w-2.5", getTipoColor(info.tipo_clase).textMuted)} />
                              )}
                            </div>
                          ) : esDeOtraAsignacion ? (
                            <div className={cn(
                              "absolute inset-1 rounded-lg border border-dashed p-1 text-xs flex flex-col justify-center overflow-hidden",
                              getTipoColor(info.tipo_clase).blocked
                            )}>
                              <p className={cn("font-bold truncate text-[10px] leading-tight", getTipoColor(info.tipo_clase).blockedText)}>
                                {info.docente_nombre}
                              </p>
                              <p className={cn("truncate text-[9px] leading-tight", getTipoColor(info.tipo_clase).blockedText, "opacity-70")}>
                                {info.curso_nombre}
                                {info.tipo_clase && ` (${info.tipo_clase})`}
                              </p>
                              <p className={cn("truncate text-[9px] leading-tight", getTipoColor(info.tipo_clase).blockedText, "opacity-50")}>
                                {info.ambiente_nombre}
                              </p>
                            </div>
                          ) : rol_viewer === "secretaria" ? (
                            <div className={cn(
                              "absolute inset-1 rounded-lg border p-1 text-xs flex flex-col justify-between",
                              esMia
                                ? `${getTipoColor(info.tipo_clase).own} shadow-sm`
                                : `${getTipoColor(info.tipo_clase).blocked}`
                            )}>
                              <div>
                                <p className={cn("font-black truncate text-[10px] leading-tight", getTipoColor(info.tipo_clase).text)}>
                                  {info.docente_nombre}
                                </p>
                                <p className={cn("truncate text-[9px] leading-tight", getTipoColor(info.tipo_clase).textMuted)}>
                                  {info.curso_nombre}
                                  {info.grupo_nombre && ` — G${info.grupo_nombre}`}
                                  {info.subgrupo_label && ` — ${info.subgrupo_label}`}
                                </p>
                                <p className={cn("truncate text-[9px] leading-tight", getTipoColor(info.tipo_clase).textMuted, "opacity-70")}>
                                  {info.ambiente_nombre}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full", getTipoColor(info.tipo_clase).badge)}>
                                  {info.tipo_clase}
                                </span>
                                {esMia ? (
                                  <CheckCircle2 className={cn("h-3 w-3", getTipoColor(info.tipo_clase).text)} />
                                ) : (
                                  <Lock className={cn("h-3 w-3", getTipoColor(info.tipo_clase).textMuted, "opacity-50")} />
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className={cn(
                              "absolute inset-1 rounded-lg border p-1 text-xs flex flex-col justify-between",
                              esMia
                                ? `${getTipoColor(info.tipo_clase).own} shadow-sm`
                                : `${getTipoColor(info.tipo_clase).blocked}`
                            )}>
                              <div>
                                <p className={cn("font-black truncate text-[10px] leading-tight", getTipoColor(info.tipo_clase).text)}>
                                  {info.curso_nombre}
                                </p>
                                {info.grupo_nombre && (
                                  <p className={cn("truncate font-bold text-[9px] leading-tight", getTipoColor(info.tipo_clase).text)}>
                                    Grupo {info.grupo_nombre}
                                    {info.subgrupo_label && (
                                      <span className={cn("font-normal opacity-70", getTipoColor(info.tipo_clase).textMuted)}> — {info.subgrupo_label}</span>
                                    )}
                                  </p>
                                )}
                                <p className={cn("truncate text-[9px] leading-tight opacity-70", getTipoColor(info.tipo_clase).textMuted)}>
                                  {info.ambiente_nombre}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className={cn("text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full", getTipoColor(info.tipo_clase).badge)}>
                                  {info.tipo_clase}
                                </span>
                                {esMia ? (
                                  <CheckCircle2 className={cn("h-3 w-3", getTipoColor(info.tipo_clase).text)} />
                                ) : (
                                  <Lock className={cn("h-3 w-3", getTipoColor(info.tipo_clase).textMuted, "opacity-50")} />
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

                      {info?.estado === "no_disponible" && !info?.id_carga_no_lectiva && (
                        <div className="absolute inset-0 flex items-center justify-center" title="No disponible en tu horario">
                          <span className="text-[9px] font-medium text-slate-400/70 dark:text-slate-500/70 select-none">—</span>
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
                {t("conflictsDetected")}
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