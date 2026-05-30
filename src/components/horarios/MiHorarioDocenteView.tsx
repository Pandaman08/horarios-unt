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
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodo } from "@/contexts/PeriodoContext";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const RANGOS_HORARIOS = [
  "07:00 - 08:00", "08:00 - 09:00", "09:00 - 10:00",
  "10:00 - 11:00", "11:00 - 12:00", "12:00 - 13:00",
  "13:00 - 14:00", "14:00 - 15:00", "15:00 - 16:00",
  "16:00 - 17:00", "17:00 - 18:00", "18:00 - 19:00",
  "19:00 - 20:00",
];

// Colores usando solo clases de Tailwind con variante dark explícita
// (colores fijos de paleta, no variables CSS — funcionan bien en Tailwind v4)
const CURSO_COLORES = [
  { bg: "bg-blue-500/10",   border: "border-l-blue-400",   text: "text-blue-600 dark:text-blue-400"   },
  { bg: "bg-purple-500/10", border: "border-l-purple-400", text: "text-purple-600 dark:text-purple-400" },
  { bg: "bg-amber-500/10",  border: "border-l-amber-400",  text: "text-amber-600 dark:text-amber-400"  },
  { bg: "bg-emerald-500/10",border: "border-l-emerald-400",text: "text-emerald-600 dark:text-emerald-400"},
  { bg: "bg-pink-500/10",   border: "border-l-pink-400",   text: "text-pink-600 dark:text-pink-400"   },
  { bg: "bg-cyan-500/10",   border: "border-l-cyan-400",   text: "text-cyan-600 dark:text-cyan-400"   },
  { bg: "bg-orange-500/10", border: "border-l-orange-400", text: "text-orange-600 dark:text-orange-400"},
  { bg: "bg-rose-500/10",   border: "border-l-rose-400",   text: "text-rose-600 dark:text-rose-400"   },
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
  const { periodoSeleccionado, periodos } = usePeriodo();
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"matriz" | "lista">("matriz");
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    if (periodoSeleccionado) {
      setSelectedPeriodo(periodoSeleccionado.id_periodo.toString());
    }
  }, [periodoSeleccionado]);

  useEffect(() => {
    if (selectedPeriodo) fetchHorarios();
  }, [selectedPeriodo]);

  const handleDownloadReport = async () => {
    if (!selectedPeriodo) { toast.warning("Seleccione un periodo académico"); return; }
    try {
      setGeneratingReport(true);
      const url = `/api/reportes/pdf?tipo=docente_propio&id_periodo=${selectedPeriodo}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "Error en la generación");
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Mi_Horario_${periodoActualObj?.nombre || "Docente"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Horario generado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al generar horario");
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/docentes/horarios?periodoId=${selectedPeriodo}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setHorarios(Array.isArray(data) ? data : []);
    } catch {
      toast.error("No se encontraron horarios asignados");
      setHorarios([]);
    } finally {
      setLoading(false);
    }
  };

  const getHorariosEnCelda = (diaIndex: number, hora: string) =>
    horarios.filter(
      (h) => h.dia_semana === diaIndex && h.hora_inicio <= hora && h.hora_fin > hora
    );

  const cursosUnicos = Array.from(new Set(horarios.map((h) => h.curso_nombre)));
  const totalHoras = horarios.length;
  const periodoActualObj = periodos.find(
    (p) => p.id_periodo.toString() === selectedPeriodo
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
        Cargando horarios...
      </div>
    );
  }

  // ── Sin horarios ──────────────────────────────────────────────────────────
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
          <label className="text-sm font-semibold text-foreground">
            Periodo Académico
          </label>
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger className="w-full sm:w-80 bg-card border-border text-card-foreground">
              <SelectValue placeholder="Selecciona un periodo" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-card-foreground">
              {periodos.map((p) => (
                <SelectItem key={p.id_periodo} value={p.id_periodo.toString()}>
                  {p.nombre} {p.activo && "(Activo)"}{" "}
                  {p.estado === "finalizado" && "(Finalizado)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Aviso sin horarios */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-500 mb-1">
                No hay horarios asignados
              </p>
              <p className="text-xs text-blue-500/80">
                {periodoActualObj?.estado === "finalizado"
                  ? "No se encontraron horarios registrados para este periodo finalizado."
                  : "Los horarios se generan automáticamente una vez que el administrador o operador ejecuta la generación de horarios."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista principal ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Cabecera */}
      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Mi Horario</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadReport}
              disabled={generatingReport}
              className="hidden sm:flex items-center gap-2 bg-card border-border text-card-foreground hover:bg-muted"
            >
              {generatingReport ? (
                <Download className="h-4 w-4 animate-bounce" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {generatingReport ? "Generando..." : "Descargar PDF"}
            </Button>
            <Button
              variant={view === "matriz" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("matriz")}
              className={view !== "matriz" ? "bg-card border-border text-card-foreground hover:bg-muted" : ""}
            >
              Vista Matriz
            </Button>
            <Button
              variant={view === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("lista")}
              className={view !== "lista" ? "bg-card border-border text-card-foreground hover:bg-muted" : ""}
            >
              Vista Lista
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Horarios asignados en el período seleccionado. Total:{" "}
          <strong className="text-foreground">{totalHoras} horas</strong>
        </p>
      </div>

      {/* ── Vista Matriz ─────────────────────────────────────────────────── */}
      {view === "matriz" ? (
        <>
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <div className="min-w-[700px] p-4">
              {/* Header días */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                <div className="p-2 text-center text-sm font-semibold text-muted-foreground bg-muted rounded-lg">
                  Hora
                </div>
                {DIAS.map((dia, idx) => (
                  <div
                    key={idx}
                    className="p-2 text-center text-sm font-semibold bg-primary text-primary-foreground rounded-lg"
                  >
                    {dia}
                  </div>
                ))}
              </div>

              {/* Filas de horas */}
              <div className="space-y-1">
                {RANGOS_HORARIOS.map((rango) => {
                  const horaInicio = rango.split(" - ")[0];
                  return (
                    <div key={rango} className="grid grid-cols-7 gap-1">
                      {/* Columna hora */}
                      <div className="p-2 text-xs font-mono text-muted-foreground bg-muted rounded-lg flex items-center justify-center">
                        {rango}
                      </div>

                      {/* Celdas por día */}
                      {DIAS.map((_, diaIndex) => {
                        const horariosEnCelda = getHorariosEnCelda(diaIndex, horaInicio);
                        return (
                          <div
                            key={diaIndex}
                            className="relative min-h-[20px] border border-border rounded-lg bg-background p-1"
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
                                  <div className="font-bold">{horario.ambiente_codigo}</div>
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

          {/* Leyenda */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-sm font-bold text-card-foreground mb-3">
              Leyenda de Cursos
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {cursosUnicos.map((cursoNombre) => {
                const colores = getColorPorCurso(cursoNombre, cursosUnicos);
                return (
                  <div key={cursoNombre} className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-4 h-4 rounded border-l-2",
                        colores.bg,
                        colores.border
                      )}
                    />
                    <span className="text-xs text-card-foreground">{cursoNombre}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        /* ── Vista Lista ───────────────────────────────────────────────── */
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-border">
            <p className="text-base font-bold text-card-foreground">
              Lista de Horarios
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted border-b border-border">
                <tr>
                  {["Curso", "Día", "Hora", "Grupo", "Ambiente", "Tipo"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {horarios
                  .sort((a, b) =>
                    a.dia_semana !== b.dia_semana
                      ? a.dia_semana - b.dia_semana
                      : a.hora_inicio.localeCompare(b.hora_inicio)
                  )
                  .map((h, idx) => (
                    <tr
                      key={h.id_asignacion}
                      className={cn(
                        "border-b border-border last:border-0 transition-colors hover:bg-muted/50",
                        idx % 2 !== 0 && "bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-card-foreground">
                          {h.curso_codigo}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {h.curso_nombre}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-card-foreground">
                        {DIAS[h.dia_semana]}
                      </td>
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {h.hora_inicio} - {h.hora_fin}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">
                        {h.grupo_codigo}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">
                        {h.ambiente_codigo}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-border bg-muted text-muted-foreground">
                          {h.tipo_clase}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}