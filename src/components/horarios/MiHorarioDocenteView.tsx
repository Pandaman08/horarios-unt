"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { format } from "date-fns";
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
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
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

const TIPO_CLASE_COLORES = {
  teoria: { bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900", text: "text-blue-700 dark:text-blue-300", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  laboratorio: { bg: "bg-purple-50 dark:bg-purple-950/30", border: "border-purple-200 dark:border-purple-900", text: "text-purple-700 dark:text-purple-300", badge: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  practica: { bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-amber-200 dark:border-amber-900", text: "text-amber-700 dark:text-amber-300", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
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
}

interface HorariosPorDia {
  [key: string]: HorarioAsignado[];
}

export function MiHorarioDocenteView() {
  const { data: session } = useSession();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"semana" | "lista">("semana");

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

  const horariosPorDia: HorariosPorDia = horarios.reduce((acc, h) => {
    const dia = DIAS[h.dia_semana] || "Desconocido";
    if (!acc[dia]) acc[dia] = [];
    acc[dia].push(h);
    return acc;
  }, {} as HorariosPorDia);

  // Ordenar por hora
  Object.keys(horariosPorDia).forEach((dia) => {
    horariosPorDia[dia].sort((a, b) =>
      a.hora_inicio.localeCompare(b.hora_inicio)
    );
  });

  const diasOrdenados = DIAS.filter((dia) => horariosPorDia[dia]);
  const totalHoras = horarios.length;

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
                  {p.codigo} - {p.nombre}
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
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Mi Horario</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === "semana" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("semana")}
            >
              Vista Semanal
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

      {/* Vista Semanal */}
      {view === "semana" ? (
        <div className="space-y-4">
          {diasOrdenados.map((dia) => (
            <Card key={dia} className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-3">
                <CardTitle className="text-base">{dia}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {horariosPorDia[dia].map((h) => {
                    const colores =
                      TIPO_CLASE_COLORES[h.tipo_clase as keyof typeof TIPO_CLASE_COLORES] ||
                      TIPO_CLASE_COLORES.teoria;
                    return (
                      <div
                        key={h.id_asignacion}
                        className={cn(
                          "p-4 border-b border-border last:border-0",
                          colores.bg,
                          "hover:shadow-sm transition-shadow"
                        )}
                      >
                        <div className="space-y-3">
                          {/* Encabezado */}
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-foreground">
                                  {h.curso_codigo}
                                </h3>
                                <Badge className={colores.badge}>
                                  {h.tipo_clase.charAt(0).toUpperCase() +
                                    h.tipo_clase.slice(1)}
                                </Badge>
                              </div>
                              <p className="text-sm text-foreground line-clamp-2">
                                {h.curso_nombre}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-sm font-bold">
                                <Clock className="h-4 w-4" />
                                {h.hora_inicio} - {h.hora_fin}
                              </div>
                            </div>
                          </div>

                          {/* Detalles */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>Grupo {h.grupo_codigo}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{h.ambiente_codigo}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Vista Lista */
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
