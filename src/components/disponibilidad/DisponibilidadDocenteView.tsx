"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format, parse, addMinutes } from "date-fns";
import { Button } from "@/components/ui/button";
import {Select, SelectContent, SelectItem, SelectTrigger,SelectValue,
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
    <div className="p-6 space-y-4 bg-[#f8fafc] min-h-screen">
      {/* Header Unificado */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <LayoutGrid className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">Mi Disponibilidad</h1>
                <p className="text-slate-500 text-xs mt-1">
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
                  className="h-9 px-4 text-xs font-bold uppercase border-slate-200 hover:bg-slate-50 flex items-center gap-2"
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
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="bg-[#fcfcfc] px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Periodo Académico
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold text-slate-500 uppercase">Seleccionar Periodo</Label>
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger className="w-full h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm">
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
              esLectura ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100"
            )}>
              <div className="flex items-start gap-2.5">
                <Info className={cn("h-4 w-4 shrink-0 mt-0.5", esLectura ? "text-amber-600" : "text-blue-600")} />
                <div className="space-y-1">
                  <p className={cn("text-[11px] font-bold uppercase tracking-tight", esLectura ? "text-amber-700" : "text-blue-700")}>
                    {esLectura ? "Modo Lectura" : "Modo Edición"}
                  </p>
                  <p className={cn("text-[10px] leading-tight font-medium", esLectura ? "text-amber-600" : "text-blue-600")}>
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
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="bg-[#fcfcfc] px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" />
              Resumen de Horas
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-3 gap-2 mb-4">
              {diaActual.map((dia) => (
                <div key={dia.id} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">{dia.nombre.slice(0, 3)}</p>
                  <p className="text-sm font-black text-slate-700">{dia.count}h</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase text-emerald-600 tracking-tight">Total Disponible</span>
                  <span className="text-[9px] text-slate-400 font-medium">En toda la semana</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-emerald-700">{countDisponibles}h</span>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leyenda y Ayuda */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="bg-[#fcfcfc] px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Info size={16} className="text-amber-500" />
              Leyenda
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-slate-600">Horario Disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200"></div>
                <span className="text-xs font-medium text-slate-600">Horario No Disponible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded border-1.5 border-amber-500 relative">
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                </div>
                <span className="text-xs font-medium text-slate-600">Cambio sin guardar</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {!loading ? (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <div className="bg-[#fcfcfc] px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid size={16} className="text-blue-500" />
              Matriz de Disponibilidad Semanal
            </h3>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10 w-32 border-r">Hora</TableHead>
                    {DIAS.map((dia) => (
                      <TableHead key={dia.id} className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">{dia.nombre}</TableHead>
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
                      <TableRow key={hora} className={cn("hover:bg-slate-50/30 border-slate-100", idx % 2 === 0 ? "bg-white" : "bg-slate-50/20")}>
                        <TableCell className="px-4 py-2 text-[11px] font-bold text-slate-600 border-r border-slate-100 bg-slate-50/30">
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
                                    ? "bg-emerald-500/10 border-emerald-500 text-emerald-600"
                                    : "bg-transparent border-slate-100 text-slate-200 hover:border-slate-300",
                                  isChanged && "ring-2 ring-amber-400 ring-offset-1",
                                  esLectura && "cursor-default opacity-80"
                                )}
                              >
                                {isAvailable ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  !esLectura && <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                )}
                                {isChanged && (
                                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full border-2 border-white shadow-sm"></span>
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
        <Card className="shadow-sm border-slate-200">
          <CardContent className="py-20 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-3" />
            <p className="text-slate-400 font-medium text-sm">Cargando matriz de disponibilidad...</p>
          </CardContent>
        </Card>
      )}

      {/* Alert Dialog para confirmación */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-xl border-none shadow-2xl p-6 bg-white max-w-[400px]">
          <AlertDialogHeader>
            <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center mb-4">
              <Save className="h-5 w-5 text-emerald-600" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">Confirmar Cambios</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm leading-relaxed">
              ¿Estás seguro de que deseas guardar tu nueva disponibilidad? Esta información será utilizada por el sistema para la generación de horarios del periodo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-6">
            <AlertDialogCancel className="h-10 rounded-lg font-bold border-slate-200 text-slate-600 hover:bg-slate-50 text-xs uppercase">
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
