"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format, parse, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Calendar,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS = [
  { id: 0, nombre: "Lunes" },
  { id: 1, nombre: "Martes" },
  { id: 2, nombre: "Miércoles" },
  { id: 3, nombre: "Jueves" },
  { id: 4, nombre: "Viernes" },
];

interface DisponibilidadItem {
  id_disponibilidad?: number;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  disponible: boolean;
}

export function DisponibilidadDocenteView() {
  const { data: session } = useSession();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadItem[]>([]);
  const [changes, setChanges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    let current = parse("07:00", "HH:mm", new Date());
    const end = parse("22:00", "HH:mm", new Date());

    while (current <= end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, 60);
    }
    return slots;
  }, []);

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchDisponibilidades();
    }
  }, [selectedPeriodo]);

  const fetchPeriodos = async () => {
    try {
      const res = await fetch("/api/periodos");
      const data = await res.json();
      setPeriodos(Array.isArray(data) ? data : []);
      if (data.length > 0) {
        setSelectedPeriodo(data[0].id_periodo.toString());
      }
    } catch {
      toast.error("Error al cargar periodos");
    }
  };

  const fetchDisponibilidades = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/docentes/disponibilidad?periodoId=${selectedPeriodo}`
      );
      const data = await res.json();
      
      // Crear matriz con todos los horarios posibles
      const matriz: DisponibilidadItem[] = [];
      for (const dia of DIAS) {
        for (const hora of timeSlots) {
          const existing = data.find(
            (d) =>
              d.dia_semana === dia.id &&
              d.hora_inicio === hora
          );
          matriz.push({
            id_disponibilidad: existing?.id_disponibilidad,
            dia_semana: dia.id,
            hora_inicio: hora,
            hora_fin: format(
              addMinutes(parse(hora, "HH:mm", new Date()), 60),
              "HH:mm"
            ),
            disponible: existing?.disponible ?? false,
          });
        }
      }
      setDisponibilidades(matriz);
      setChanges(new Set());
    } catch {
      toast.error("Error al cargar disponibilidades");
    } finally {
      setLoading(false);
    }
  };

  const toggleDisponibilidad = (diaId: number, hora: string) => {
    const key = `${diaId}-${hora}`;
    setDisponibilidades((prev) =>
      prev.map((d) =>
        d.dia_semana === diaId && d.hora_inicio === hora
          ? { ...d, disponible: !d.disponible }
          : d
      )
    );

    const newChanges = new Set(changes);
    newChanges.add(key);
    setChanges(newChanges);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/docentes/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodoId: Number(selectedPeriodo),
          disponibilidades: disponibilidades.map((d) => ({
            dia_semana: d.dia_semana,
            hora_inicio: d.hora_inicio,
            disponible: d.disponible,
          })),
        }),
      });

      if (!res.ok) throw new Error("Error al guardar");

      toast.success("Disponibilidad guardada correctamente");
      setChanges(new Set());
      setShowConfirm(false);
    } catch {
      toast.error("Error al guardar disponibilidad");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchDisponibilidades();
    setChanges(new Set());
  };

  const countDisponibles = disponibilidades.filter((d) => d.disponible).length;
  const hasChanges = changes.size > 0;

  const diaActual = DIAS.map((dia) => {
    const count = disponibilidades
      .filter((d) => d.dia_semana === dia.id && d.disponible)
      .length;
    return { ...dia, count };
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">
            Mi Disponibilidad
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Selecciona los horarios en los que estás disponible para impartir clases.
          Esta información se utiliza para asignar automáticamente tus cursos.
        </p>
      </div>

      {/* Información */}
      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <p className="font-medium">
                Total de horas disponibles: <strong>{countDisponibles}</strong>
              </p>
              <p className="text-xs opacity-80">
                Los horarios disponibles se utilizan durante la generación automática
                de horarios. Una vez generados, tu horario será visible en la sección
                "Mi Horario".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selector de Periodo */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-foreground">
          Periodo Académico
        </label>
        <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="Selecciona un periodo" />
          </SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.id_periodo} value={p.id_periodo.toString()}>
                {p.codigo} - {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Matriz de Disponibilidad */}
      {!loading ? (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <CardTitle>Matriz de Disponibilidad</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                Disponible
                <span className="w-3 h-3 rounded-full bg-muted ml-3"></span>
                No disponible
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Resumen por día */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {diaActual.map((dia) => (
                <div
                  key={dia.id}
                  className="p-3 rounded-lg bg-muted/50 border border-border text-center"
                >
                  <p className="text-xs font-semibold text-muted-foreground">
                    {dia.nombre}
                  </p>
                  <p className="text-lg font-bold text-primary mt-1">
                    {dia.count}h
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    / {timeSlots.length}h
                  </p>
                </div>
              ))}
            </div>

            {/* Tabla de horarios */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-4 py-3 text-left font-semibold">
                      Hora
                    </th>
                    {DIAS.map((dia) => (
                      <th
                        key={dia.id}
                        className="px-3 py-3 text-center font-semibold text-xs"
                      >
                        {dia.nombre.slice(0, 3)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((hora, idx) => {
                    const siguienteHora = format(
                      addMinutes(parse(hora, "HH:mm", new Date()), 60),
                      "HH:mm"
                    );
                    return (
                      <tr
                        key={hora}
                        className={
                          idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-muted/30"
                        }
                      >
                        <td className="px-4 py-2 font-medium whitespace-nowrap border-r border-border">
                          {hora} - {siguienteHora}
                        </td>
                        {DIAS.map((dia) => {
                          const disp = disponibilidades.find(
                            (d) =>
                              d.dia_semana === dia.id &&
                              d.hora_inicio === hora
                          );
                          const isAvailable = disp?.disponible ?? false;
                          const isChanged =
                            changes.has(`${dia.id}-${hora}`);

                          return (
                            <td
                              key={`${dia.id}-${hora}`}
                              className="px-3 py-2 text-center"
                            >
                              <button
                                onClick={() =>
                                  toggleDisponibilidad(dia.id, hora)
                                }
                                className={cn(
                                  "w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center mx-auto border-2 relative",
                                  isAvailable
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : "bg-muted border-border text-muted-foreground hover:border-muted-foreground",
                                  isChanged && "ring-2 ring-amber-500/50"
                                )}
                                title={
                                  isAvailable
                                    ? "Desmarcar"
                                    : "Marcar como disponible"
                                }
                              >
                                {isAvailable && (
                                  <CheckCircle2 className="h-4 w-4" />
                                )}
                                {isChanged && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Cargando disponibilidades...
          </CardContent>
        </Card>
      )}

      {/* Acciones */}
      <div className="flex gap-3 justify-end sticky bottom-0 bg-background/95 backdrop-blur p-4 -mx-4 rounded-lg border-t border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Descartar cambios
        </Button>
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? "Guardando..." : "Guardar disponibilidad"}
          </Button>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Confirmar cambios
              </AlertDialogTitle>
              <AlertDialogDescription>
                Estás a punto de guardar los cambios en tu disponibilidad. Esta
                información se utilizará para la próxima generación automática
                de horarios.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSave}
                className="bg-primary hover:bg-primary/90"
              >
                Confirmar y guardar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
