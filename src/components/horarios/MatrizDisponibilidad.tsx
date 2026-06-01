"use client";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { getSocket } from "@/lib/socket-client";
import { toast } from "sonner";
import { format, addMinutes, parse } from "date-fns";

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
  id_docente?: number;
  docente_nombre?: string;
  curso_nombre?: string;
  tipo_clase?: string;

  estado:
    | "disponible"
    | "ocupado"
    | "seleccionado_mio"
    | "bloqueado"
    | "error";

  mensaje_error?: string;
}

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

  onCellClick?: (
    dia: number,
    hora: string
  ) => void;

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
  }, [id_periodo, id_ambiente]);

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

                tipo_clase:
                  asig.tipo_clase,

                estado: "ocupado",
              }
            );
          }
        );

        (data.temporales ?? []).forEach(
          (temp: any) => {
            const esMia =
              temp.id_docente ===
              id_docente_actual;

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

                tipo_clase:
                  temp.tipo_clase,

                estado: esMia
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

        setDisponibilidad(map);
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
      celda?.estado ===
        "bloqueado" ||
      celda?.estado === "ocupado"
    ) {
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
        toast.error(
          result.error ??
            "Error al seleccionar"
        );
      }
    } catch (error) {
      toast.error(
        "Error de conexión"
      );
    } finally {
      setProcessingCell(null);
    }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <Clock className="h-5 w-5 text-primary" />

          <div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Intervalo
            </p>

            <Select
              value={intervalo.toString()}
              onValueChange={(v) =>
                setIntervalo(
                  Number(v)
                )
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="15">
                  15 min
                </SelectItem>

                <SelectItem value="30">
                  30 min
                </SelectItem>

                <SelectItem value="60">
                  1 hora
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="h-4 w-4" />

          Receso:
          12:00 PM - 1:00 PM
        </div>
      </div>

      <div className="overflow-x-auto bg-card rounded-2xl border border-border shadow-sm">
        <table className="w-full border-collapse min-w-[1000px]">
          <thead>
            <tr className="bg-primary">
              <th className="w-24 p-4 text-primary-foreground">
                Hora
              </th>

              {DIAS.map((dia) => (
                <th
                  key={dia.id}
                  className="p-4 text-primary-foreground"
                >
                  {dia.nombre}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {timeSlots.map((hora) => (
              <tr key={hora}>
                <td className="p-3 text-center border border-border bg-muted/20 font-bold">
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

                  return (
                    <td
                      key={key}
                      onClick={() =>
                        !isProcessing &&
                        handleCellClick(
                          dia.id,
                          hora
                        )
                      }
                      className={cn(
                        "relative h-16 border border-border cursor-pointer transition-all",

                        !info &&
                          "hover:bg-emerald-500/10",

                        info?.estado ===
                          "ocupado" &&
                          !esMia &&
                          "bg-rose-500/10 cursor-not-allowed",

                        esMia &&
                          "bg-amber-500/20",

                        info?.estado ===
                          "bloqueado" &&
                          "bg-muted/50 cursor-not-allowed"
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
                        info.estado !==
                          "bloqueado" && (
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