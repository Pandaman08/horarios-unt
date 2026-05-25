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
} from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS = [
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
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
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h1 className="text-lg font-black text-foreground">
            Mi Disponibilidad
          </h1>
        </div>
        <p className="text-xs text-muted-foreground">
          Selecciona los horarios disponibles. Esta información se utiliza para la asignación automática.
        </p>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 dark:text-blue-300 space-y-0.5">
              <p className="font-bold">
                Total de horas disponibles: <strong>{countDisponibles}</strong>
              </p>
              <p className="text-[10px] opacity-80">
                Los horarios disponibles se usan durante la generación automática.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-foreground">
          Periodo Académico
        </label>
        <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
          <SelectTrigger className="w-full sm:w-72 h-9 text-xs">
            <SelectValue placeholder="Selecciona un periodo" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            {periodos.map((p) => (
              <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="text-xs py-1.5">
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!loading ? (
        <Card>
          <CardHeader className="pb-2.5 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-black">Matriz de Disponibilidad</CardTitle>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Disponible
                <span className="w-2.5 h-2.5 rounded-full bg-muted ml-2"></span>
                No disponible
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 px-4 pb-4">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {diaActual.map((dia) => (
                <div
                  key={dia.id}
                  className="p-2 rounded-lg bg-muted/50 border border-border text-center"
                >
                  <p className="text-[10px] font-bold text-muted-foreground">
                    {dia.nombre.slice(0, 3)}
                  </p>
                  <p className="text-sm font-black text-primary mt-0.5">
                    {dia.count}h
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    / {timeSlots.length}h
                  </p>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-2.5 py-2 text-left font-bold text-[11px]">
                      Hora
                    </th>
                    {DIAS.map((dia) => (
                      <th
                        key={dia.id}
                        className="px-2 py-2 text-center font-bold text-[11px]"
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
                        <td className="px-2.5 py-1.5 font-medium whitespace-nowrap border-r border-border text-[11px]">
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
                              className="px-1.5 py-1.5 text-center"
                            >
                              <button
                                onClick={() =>
                                  toggleDisponibilidad(dia.id, hora)
                                }
                                className={cn(
                                  "w-6 h-6 rounded-md transition-all duration-200 flex items-center justify-center mx-auto border-1.5 relative",
                                  isAvailable
                                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : "bg-muted border-border text-muted-foreground hover:border-muted-foreground",
                                  isChanged && "ring-1.5 ring-amber-500/50"
                                )}
                                title={
                                  isAvailable
                                    ? "Desmarcar"
                                    : "Marcar como disponible"
                                }
                              >
                                {isAvailable && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {isChanged && (
                                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
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
          <CardContent className="py-8 text-center text-muted-foreground text-xs">
            Cargando disponibilidades...
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2 justify-end sticky bottom-0 bg-background/95 backdrop-blur p-3 -mx-3 rounded-lg border-t border-border">
        <Button
          variant="outline"
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="gap-1.5 h-8 text-xs"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Descartar
        </Button>
        <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
          <Button
            onClick={() => setShowConfirm(true)}
            disabled={!hasChanges || saving}
            className="gap-1.5 h-8 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Guardando..." : "Guardar"}
          </Button>

          <AlertDialogContent className="rounded-xl border-none shadow-2xl p-5 bg-card max-w-[380px]">
            <AlertDialogHeader>
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center mb-2.5">
                <AlertCircle className="h-4 w-4 text-primary" />
              </div>
              <AlertDialogTitle className="text-sm font-bold text-foreground">Confirmar cambios</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground font-medium text-[10px]">
                Estás a punto de guardar los cambios en tu disponibilidad. Esta información se utilizará para la próxima generación automática de horarios.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-1.5 mt-4">
              <AlertDialogCancel className="h-8 rounded-lg font-bold border-border hover:bg-muted text-[10px]">Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleSave} className="h-8 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4 text-[10px]">
                Sí, Guardar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
