"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

const RANGOS_HORARIOS = [
  "07:00 - 08:00",
  "08:00 - 09:00",
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  "12:00 - 13:00",
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00",
  "17:00 - 18:00",
  "18:00 - 19:00",
  "19:00 - 20:00"
];

const CURSO_COLORES = [
  { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-400", text: "text-blue-800 dark:text-blue-200" },
  { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-400", text: "text-purple-800 dark:text-purple-200" },
  { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-400", text: "text-amber-800 dark:text-amber-200" },
  { bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-emerald-400", text: "text-emerald-800 dark:text-emerald-200" },
  { bg: "bg-pink-50 dark:bg-pink-950/30", border: "border-pink-400", text: "text-pink-800 dark:text-pink-200" },
  { bg: "bg-cyan-50 dark:bg-cyan-950/30", border: "border-cyan-400", text: "text-cyan-800 dark:text-cyan-200" },
  { bg: "bg-orange-50 dark:bg-orange-950/30", border: "border-orange-400", text: "text-orange-800 dark:text-orange-200" },
  { bg: "bg-rose-50 dark:bg-rose-950/30", border: "border-rose-400", text: "text-rose-800 dark:text-rose-200" },
];

const getColorPorCurso = (cursoNombre: string, cursosUnicos: string[]) => {
  const index = cursosUnicos.indexOf(cursoNombre);
  return CURSO_COLORES[index % CURSO_COLORES.length];
};

interface HorarioAsignado {
  id_asignacion: number;
  id_curso: number;
  id_grupo: number;
  id_ambiente: number;
  curso_codigo: string;
  curso_nombre: string;
  grupo_codigo: string;
  ambiente_codigo: string;
  ambiente_nombre: string;
  tipo_clase: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  ciclo_nombre: string;
}

export function MiHorarioDocenteView() {
  const { data: session } = useSession();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"matriz" | "lista">("matriz");

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchHorarios();
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

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/docentes/horarios?periodoId=${selectedPeriodo}`
      );
      if (!res.ok) throw new Error("Error al obtener horarios");
      const data = await res.json();
      setHorarios(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se encontraron horarios asignados");
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const getHorariosEnCelda = (diaIndex: number, hora: string) => {
    return horarios.filter(h => {
      return h.dia_semana === diaIndex && 
             h.hora_inicio <= hora && 
             h.hora_fin > hora;
    });
  };

  const getEventoAltura = (horaInicio: string, horaFin: string) => {
    const [hInicio, mInicio] = horaInicio.split(':').map(Number);
    const [hFin, mFin] = horaFin.split(':').map(Number);
    const duracionHoras = (hFin - hInicio) + (mFin - mInicio) / 60;
    return duracionHoras * 80;
  };

  const totalHoras = horarios.length;
  
  const cursosUnicos = Array.from(new Set(horarios.map(h => h.curso_nombre)));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Cargando horarios...
        </CardContent>
      </Card>
    );
  }

  if (horarios.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Mi Horario</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Visualiza los horarios asignados a tus cursos por periodo académico.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Periodo Académico</label>
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-full sm:w-80">
              <SelectValue placeholder="Selecciona un periodo" />
            </SelectTrigger>
            <SelectContent>
              {periodos.map((p) => (
                <SelectItem key={p.id_periodo} value={p.id_periodo.toString()}>
                  {p.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">No hay horarios asignados</p>
                <p className="text-xs opacity-80">
                  Los horarios se generan automáticamente una vez que el administrador
                  o operador ejecuta la generación de horarios. Una vez generados,
                  aparecerán aquí.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Mi Horario</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === "matriz" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("matriz")}
            >
              Vista Matriz
            </Button>
            <Button
              variant={view === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("lista")}
            >
              Vista Lista
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Horarios asignados en el período seleccionado. Total: <strong>{totalHoras} horas</strong>
        </p>
      </div>

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
                {p.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {view === "matriz" ? (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 gap-1 mb-1">
                <div className="p-2 text-center text-sm font-semibold text-muted-foreground bg-muted rounded">
                  Hora
                </div>
                {DIAS.map((dia, idx) => (
                  <div 
                    key={idx} 
                    className="p-2 text-center text-sm font-semibold bg-primary text-primary-foreground rounded"
                  >
                    {dia}
                  </div>
                ))}
              </div>

              <div className="space-y-1">
                {RANGOS_HORARIOS.map((rango) => {
                  const horaInicio = rango.split(' - ')[0];
                  return (
                    <div key={rango} className="grid grid-cols-7 gap-1">
                      <div className="p-2 text-xs font-mono text-muted-foreground bg-muted rounded flex items-center justify-center">
                        {rango}
                      </div>
                      
                      {DIAS.map((_, diaIndex) => {
                        const horariosEnCelda = getHorariosEnCelda(diaIndex, horaInicio);
                        
                        return (
                          <div 
                            key={diaIndex} 
                            className="relative min-h-[20px] border border-border rounded bg-card p-1"
                          >
                            {horariosEnCelda.map((horario) => {
                              const colores = getColorPorCurso(horario.curso_nombre, cursosUnicos);
                              
                              return (
                                <div
                                  key={horario.id_asignacion}
                                  className={cn(
                                    "mb-0.5 p-1 rounded border-l-2 text-[10px]",
                                    colores.bg,
                                    colores.border,
                                    colores.text
                                  )}
                                >
                                  <div>{horario.ambiente_codigo}</div>
                                  <div className="opacity-70">{horario.ciclo_nombre}</div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Leyenda de Cursos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {cursosUnicos.map((cursoNombre) => {
                  const colores = getColorPorCurso(cursoNombre, cursosUnicos);
                  return (
                    <div key={cursoNombre} className="flex items-center gap-2">
                      <div className={cn("w-4 h-4 rounded border", colores.bg, colores.border)}></div>
                      <span className="text-xs">{cursoNombre}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lista de Horarios</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Curso</th>
                    <th className="px-4 py-3 text-left font-semibold">Día</th>
                    <th className="px-4 py-3 text-left font-semibold">Hora</th>
                    <th className="px-4 py-3 text-left font-semibold">Grupo</th>
                    <th className="px-4 py-3 text-left font-semibold">Ambiente</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {horarios
                    .sort((a, b) => {
                      if (a.dia_semana !== b.dia_semana) {
                        return a.dia_semana - b.dia_semana;
                      }
                      return a.hora_inicio.localeCompare(b.hora_inicio);
                    })
                    .map((h, idx) => (
                      <tr
                        key={h.id_asignacion}
                        className={
                          idx % 2 === 0 ? "bg-white dark:bg-transparent" : "bg-muted/30"
                        }
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-semibold">{h.curso_codigo}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {h.curso_nombre}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {DIAS[h.dia_semana]}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {h.hora_inicio} - {h.hora_fin}
                        </td>
                        <td className="px-4 py-3">{h.grupo_codigo}</td>
                        <td className="px-4 py-3">{h.ambiente_codigo}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">
                            {h.tipo_clase}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
