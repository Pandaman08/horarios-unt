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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  LayoutGrid,
  Plus,
  Loader2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodo } from "@/contexts/PeriodoContext";

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
  const { periodoSeleccionado, periodos } = usePeriodo();
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadItem[]>([]);
  const [changes, setChanges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Sincronizar con el periodo global al inicio o cuando cambie
  useEffect(() => {
    if (periodoSeleccionado) {
      setSelectedPeriodo(periodoSeleccionado.id_periodo.toString());
    }
  }, [periodoSeleccionado]);

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
    if (selectedPeriodo) {
      fetchDisponibilidades();
    }
  }, [selectedPeriodo]);

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
            (d: any) =>
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
    // Si el periodo no es el activo o está finalizado, no permitir cambios
    const periodoActual = periodos.find(p => p.id_periodo.toString() === selectedPeriodo);
    if (!periodoActual?.activo || periodoActual?.estado === 'finalizado') {
      toast.error("No se puede editar la disponibilidad en un periodo finalizado o inactivo");
      return;
    }

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
  
  const periodoActualObj = periodos.find(p => p.id_periodo.toString() === selectedPeriodo);
  const esLectura = !periodoActualObj?.activo || periodoActualObj?.estado === 'finalizado';

  const diaActual = DIAS.map((dia) => {
    const count = disponibilidades
      .filter((d) => d.dia_semana === dia.id && d.disponible)
      .length;
    return { ...dia, count };
  });

  return (
    <div className="p-6 space-y-4 bg-background min-h-screen">
      {/* Header Unificado */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <LayoutGrid className="text-blue-600 dark:text-blue-400 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">Mi Disponibilidad</h1>
                <p className="text-muted-foreground text-xs mt-1">
                  {esLectura 
                    ? "Visualizando disponibilidad histórica. No se permiten modificaciones." 
                    : "Selecciona los horarios disponibles para la asignación automática."
                  }
                </p>
              </div>
              </div>
            {!esLectura && (
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handleReset} 
                  variant="outline" 
                  size="sm"
                  disabled={!hasChanges || saving}
                  className="h-9 px-4 text-xs font-bold uppercase border-border hover:bg-muted flex items-center gap-2"
                >
                  <RotateCcw size={14} /> Descartar
                </Button>
                <Button 
                  onClick={() => setShowConfirm(true)} 
                  variant="default" 
                  size="sm"
                  disabled={!hasChanges || saving}
                  className="h-9 px-4 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-100"
                >
                  <Save size={14} /> {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Selección de Periodo */}
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar size={16} className="text-blue-500 dark:text-blue-400" />
              Periodo Académico
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-muted-foreground uppercase">Seleccionar Periodo</Label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger className="w-full h-10 bg-background border-border focus:bg-background transition-all text-sm">
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="text-sm">
                      {p.nombre} {p.activo && "(Activo)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={cn(
              "p-3 rounded-lg border transition-all duration-300",
              esLectura 
                ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50" 
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50"
            )}>
              <div className="flex items-start gap-2.5">
                <Info className={cn("h-4 w-4 shrink-0 mt-0.5", esLectura ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")} />
                <div className="space-y-1">
                  <p className={cn("text-[11px] font-bold uppercase tracking-tight", esLectura ? "text-amber-700 dark:text-amber-400" : "text-blue-700 dark:text-blue-400")}>
                    {esLectura ? "Modo Lectura" : "Modo Edición"}
                  </p>
                  <p className={cn("text-[10px] leading-tight font-medium", esLectura ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400")}>
                    {esLectura 
                      ? "Este periodo está finalizado o inactivo." 
                      : "Tus cambios afectan directamente a la generación automática."}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Disponibilidad */}
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-indigo-500 dark:text-indigo-400" />
              Resumen de Horas
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {diaActual.map((dia) => (
                <div key={dia.id} className="p-2 rounded-lg bg-muted border border-border text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">{dia.nombre.slice(0, 3)}</p>
                  <p className="text-sm font-black text-foreground">{dia.count}h</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-900/50">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-tight">Total Disponible</span>
                  <span className="text-[9px] text-muted-foreground font-medium">En toda la semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{countDisponibles}h</span>
                  <CheckCircle2 size={20} className="text-emerald-500 dark:text-emerald-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leyenda y Ayuda */}
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Info size={16} className="text-amber-500 dark:text-amber-400" />
              Leyenda
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-xs font-medium text-foreground">Horario Disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-muted border border-border"></div>
                <span className="text-xs font-medium text-foreground">Horario No Disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border-1.5 border-amber-500 relative">
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                </div>
                <span className="text-xs font-medium text-foreground">Cambio sin guardar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!loading ? (
        <Card className="shadow-sm border-border overflow-hidden">
          <div className="bg-muted/30 px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <LayoutGrid size={16} className="text-blue-500 dark:text-blue-400" />
              Matriz de Disponibilidad Semanal
            </h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10 w-32 border-r border-border">Hora</TableHead>
                    {DIAS.map((dia) => (
                      <TableHead key={dia.id} className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">{dia.nombre}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map((hora, idx) => {
                    const siguienteHora = format(
                      addMinutes(parse(hora, "HH:mm", new Date()), 60),
                      "HH:mm"
                    );
                    return (
                      <TableRow key={hora} className={cn("hover:bg-muted/30 border-border", idx % 2 === 0 ? "bg-background" : "bg-muted/20")}>
                        <TableCell className="px-4 py-2 text-[11px] font-bold text-foreground border-r border-border bg-muted/30">
                          {hora} - {siguienteHora}
                        </TableCell>
                        {DIAS.map((dia) => {
                          const disp = disponibilidades.find(
                            (d) => d.dia_semana === dia.id && d.hora_inicio === hora
                          );
                          const isAvailable = disp?.disponible ?? false;
                          const isChanged = changes.has(`${dia.id}-${hora}`);

                          return (
                            <TableCell key={`${dia.id}-${hora}`} className="p-1 text-center">
                              <button
                                onClick={() => toggleDisponibilidad(dia.id, hora)}
                                disabled={esLectura}
                                className={cn(
                                  "w-full h-10 rounded-md transition-all duration-200 flex items-center justify-center border-1.5 relative",
                                  isAvailable
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                    : "bg-transparent border-border text-muted-foreground/30 hover:border-muted-foreground/50",
                                  isChanged && "ring-2 ring-amber-400 ring-offset-1 dark:ring-offset-background",
                                  esLectura && "cursor-default opacity-80"
                                )}
                              >
                                {isAvailable ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  !esLectura && <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                )}
                                {isChanged && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-background shadow-sm"></span>
                                )}
                              </button>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border-border">
          <CardContent className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium text-sm">Cargando matriz de disponibilidad...</p>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog para confirmación */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-xl border-none shadow-2xl p-6 bg-card max-w-[400px]">
          <AlertDialogHeader>
            <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg flex items-center justify-center mb-4">
              <Save className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">Confirmar Cambios</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
              ¿Estás seguro de que deseas guardar tu nueva disponibilidad? Esta información será utilizada por el sistema para la generación de horarios del periodo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-10 rounded-lg font-bold border-border text-foreground hover:bg-muted text-xs uppercase">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSave} 
              className="h-10 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6 text-xs uppercase shadow-md shadow-emerald-100"
            >
              Sí, Guardar Cambios
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
