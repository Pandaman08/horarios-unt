"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Download,
  FileText,
  FileSpreadsheet,
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

const getColorPorLeyendaNumero = (numero: number) =>
  CURSO_COLORES[(numero - 1) % CURSO_COLORES.length];

interface CursoLeyendaItem {
  key: string;
  numero: number;
  codigo: string;
  nombre: string;
  ciclo: string;
  grupo: string;
  teoria: number;
  practica: number;
  laboratorio: number;
}

interface NoLectivaLeyendaItem {
  id_carga_no_lectiva?: number;
  numero: number;
  tipo: string;
  descripcion: string;
  horasSemanales: number;
}

function DetalleCargaHorariaTables({
  cursosLeyenda,
  noLectivasLeyenda,
}: {
  cursosLeyenda: CursoLeyendaItem[];
  noLectivasLeyenda: NoLectivaLeyendaItem[];
}) {
  const lectivaCols = [
    { label: "Nº", headerClass: "w-12 text-center", cellClass: "text-center" },
    { label: "Código", headerClass: "w-24 text-center", cellClass: "text-center" },
    { label: "Asignatura", headerClass: "min-w-[180px] text-left", cellClass: "text-left" },
    { label: "Ciclo", headerClass: "w-28 text-center", cellClass: "text-center" },
    { label: "Grupo", headerClass: "w-20 text-center", cellClass: "text-center" },
    { label: "T / P / L", headerClass: "w-28 text-center", cellClass: "text-center" },
  ] as const;

  const noLectivaCols = [
    { label: "Nº", headerClass: "w-12 text-center", cellClass: "text-center" },
    { label: "Tipo", headerClass: "w-32 text-center", cellClass: "text-center" },
    { label: "Descripción", headerClass: "min-w-[200px] text-left", cellClass: "text-left" },
    { label: "Hrs/sem", headerClass: "w-24 text-center", cellClass: "text-center" },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="bg-primary px-4 py-2.5">
          <p className="text-sm font-bold text-primary-foreground text-center uppercase tracking-wide">
            Detalle de Carga Lectiva
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/80 border-b border-border">
              <tr>
                {lectivaCols.map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      "px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap",
                      col.headerClass,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cursosLeyenda.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground italic">
                    Sin carga lectiva registrada
                  </td>
                </tr>
              ) : (
                cursosLeyenda.map((curso) => {
                  const colores = getColorPorLeyendaNumero(curso.numero);
                  return (
                    <tr
                      key={curso.key}
                      className={cn("border-b border-border last:border-0", colores.bg)}
                    >
                      <td className={cn("px-3 py-2.5 font-bold", colores.text, lectivaCols[0].cellClass)}>
                        {curso.numero}
                      </td>
                      <td className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", colores.text, lectivaCols[1].cellClass)}>
                        {curso.codigo}
                      </td>
                      <td className={cn("px-3 py-2.5 font-medium", colores.text, lectivaCols[2].cellClass)}>
                        {curso.nombre}
                      </td>
                      <td className={cn("px-3 py-2.5 whitespace-nowrap", colores.text, lectivaCols[3].cellClass)}>
                        {curso.ciclo}
                      </td>
                      <td className={cn("px-3 py-2.5 font-semibold", colores.text, lectivaCols[4].cellClass)}>
                        {curso.grupo}
                      </td>
                      <td className={cn("px-3 py-2.5 font-semibold whitespace-nowrap", colores.text, lectivaCols[5].cellClass)}>
                        {curso.teoria} / {curso.practica} / {curso.laboratorio}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="bg-primary px-4 py-2.5">
          <p className="text-sm font-bold text-primary-foreground text-center uppercase tracking-wide">
            Detalle de Carga No Lectiva
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm table-fixed">
            <thead className="bg-muted/80 border-b border-border">
              <tr>
                {noLectivaCols.map((col) => (
                  <th
                    key={col.label}
                    className={cn(
                      "px-3 py-2.5 font-semibold text-muted-foreground text-xs uppercase tracking-wide whitespace-nowrap",
                      col.headerClass,
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {noLectivasLeyenda.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground italic">
                    Sin carga no lectiva registrada
                  </td>
                </tr>
              ) : (
                noLectivasLeyenda.map((nl) => (
                  <tr
                    key={`nl-${nl.id_carga_no_lectiva ?? nl.numero}`}
                    className="border-b border-border last:border-0 bg-rose-500/10"
                  >
                    <td className={cn("px-3 py-2.5 font-bold text-rose-600 dark:text-rose-400", noLectivaCols[0].cellClass)}>
                      {nl.numero}
                    </td>
                    <td className={cn("px-3 py-2.5 text-rose-600 dark:text-rose-400 whitespace-nowrap capitalize", noLectivaCols[1].cellClass)}>
                      {nl.tipo}
                    </td>
                    <td className={cn("px-3 py-2.5 text-rose-600 dark:text-rose-400", noLectivaCols[2].cellClass)}>
                      {nl.descripcion}
                    </td>
                    <td className={cn("px-3 py-2.5 font-bold text-rose-600 dark:text-rose-400", noLectivaCols[3].cellClass)}>
                      {nl.horasSemanales}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

interface HorarioAsignado {
  id_asignacion?: number;
  id_curso?: number | null;
  id_grupo?: number | null;
  id_ambiente?: number | null;
  id_carga_no_lectiva?: number;
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
  is_no_lectiva?: boolean;
}

export function MiHorarioDocenteView() {
  const { periodoSeleccionado, periodos } = usePeriodo();
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioAsignado[]>([]);
  const [cursosLeyenda, setCursosLeyenda] = useState<CursoLeyendaItem[]>([]);
  const [noLectivasLeyenda, setNoLectivasLeyenda] = useState<NoLectivaLeyendaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"matriz" | "lista">("matriz");
  const [generatingReport, setGeneratingReport] = useState(false);

  const [mostrarNoLectivas, setMostrarNoLectivas] = useState(true);

  useEffect(() => {
    if (periodoSeleccionado) {
      setSelectedPeriodo(periodoSeleccionado.id_periodo.toString());
    }
  }, [periodoSeleccionado]);

  useEffect(() => {
    if (selectedPeriodo) fetchHorarios();
  }, [selectedPeriodo]);

  const handleDownloadReport = async () => {
    if (!selectedPeriodo) {
      toast.warning("Seleccione un periodo académico");
      return;
    }

    try {
      setGeneratingReport(true);
      const url = `/api/reportes/pdf?tipo=docente_propio&id_periodo=${selectedPeriodo}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(errorData.error || "Error en la generación");
      }
      const blob = await response.blob();
      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Mi_Horario_${periodoActualObj?.nombre || "Docente"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(downloadUrl);
      toast.success("Horario generado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al generar horario");
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!selectedPeriodo) {
      toast.warning("Seleccione un periodo académico");
      return;
    }
    try {
      setGeneratingReport(true);
      const url = `/api/reportes/excel?id_periodo=${selectedPeriodo}&tipo=docente_propio`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Error al generar Excel");
      const blob = await response.blob();
      const downloadUrl = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `Mi_Horario_${periodoActualObj?.nombre || "Docente"}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      globalThis.URL.revokeObjectURL(downloadUrl);
      toast.success("Excel generado correctamente");
    } catch (error: any) {
      toast.error(error.message || "Error al generar Excel");
    } finally {
      setGeneratingReport(false);
    }
  };

  const fetchHorarios = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/docentes/horarios?periodoId=${selectedPeriodo}`);
      if (!res.ok) throw new Error("Error de red");
      const data = await res.json();
      if (Array.isArray(data)) {
        setHorarios(data);
        setCursosLeyenda([]);
        setNoLectivasLeyenda([]);
      } else {
        setHorarios(Array.isArray(data.horarios) ? data.horarios : []);
        setCursosLeyenda(data.cursosLeyenda ?? []);
        setNoLectivasLeyenda(data.noLectivasLeyenda ?? []);
      }
    } catch {
      toast.error("No se encontraron horarios asignados");
      setHorarios([]);
      setCursosLeyenda([]);
      setNoLectivasLeyenda([]);
    } finally {
      setLoading(false);
    }
  };

  const horasTotales = horarios.reduce((sum, h) => {
    const start = Number.parseInt(h.hora_inicio.split(":")[0], 10);
    const end = Number.parseInt(h.hora_fin.split(":")[0], 10);
    return sum + Math.max(0, end - start);
  }, 0);

  const noLectivas = horarios.filter((h) => h.is_no_lectiva);
  const lectivas = horarios.filter((h) => !h.is_no_lectiva);

  const getHorariosEnCelda = (diaIndex: number, hora: string) =>
    horarios.filter(
      (h) =>
        h.dia_semana === diaIndex &&
        h.hora_inicio <= hora &&
        h.hora_fin > hora &&
        (mostrarNoLectivas || !h.is_no_lectiva)
    );

  const cursosUnicos = Array.from(new Set(lectivas.map((h) => h.curso_nombre)));

  const getLeyendaNumero = (horario: HorarioAsignado) => {
    if (horario.is_no_lectiva) {
      if (horario.id_carga_no_lectiva) {
        return noLectivasLeyenda.find(
          (n) => n.id_carga_no_lectiva === horario.id_carga_no_lectiva,
        )?.numero;
      }
      return undefined;
    }
    const key = `${horario.id_curso}-${horario.id_grupo}`;
    return cursosLeyenda.find((c) => c.key === key)?.numero;
  };
  const horariosOrdenados = [...horarios].sort((a, b) => {
    if (a.dia_semana < b.dia_semana) return -1;
    if (a.dia_semana > b.dia_semana) return 1;
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });
  const totalHoras = horasTotales;
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
          <label htmlFor="periodo-select" className="text-sm font-semibold text-foreground">
            Periodo Académico
          </label>
          <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
            <SelectTrigger id="periodo-select" className="w-full sm:w-80 bg-card border-border text-card-foreground">
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
            <div className="text-xs text-muted-foreground mt-1">
              {lectivas.length} bloques lectivos y {noLectivas.length} bloques no lectivos cargados.
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
              variant="outline"
              size="sm"
              onClick={handleDownloadExcel}
              disabled={generatingReport}
              className="hidden sm:flex items-center gap-2 bg-card border-border text-card-foreground hover:bg-muted"
            >
              {generatingReport ? (
                <Download className="h-4 w-4 animate-bounce" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {generatingReport ? "Generando..." : "Descargar Excel"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!selectedPeriodo) { toast.warning("Seleccione un periodo académico"); return; }
                try {
                  setGeneratingReport(true);
                  const url = `/api/reportes/pdf?tipo=docente_propio&id_periodo=${selectedPeriodo}&incluirNoLectivas=1`;
                  const response = await fetch(url);
                  if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
                    throw new Error(errorData.error || "Error en la generación");
                  }
                  const blob = await response.blob();
                  const downloadUrl = globalThis.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = downloadUrl;
                  a.download = `Mi_Horario_Con_NoLectivas_${periodoActualObj?.nombre || "Docente"}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  globalThis.URL.revokeObjectURL(downloadUrl);
                  toast.success("Horario (con no lectivas) generado correctamente");
                } catch (error: any) {
                  toast.error(error.message || "Error al generar horario");
                } finally {
                  setGeneratingReport(false);
                }
              }}
              disabled={generatingReport}
              className="hidden sm:flex items-center gap-2 bg-card border-border text-card-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4" />
              Descargar con No-Lectivas
            </Button>
            <Button
              variant={view === "matriz" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("matriz")}
              className={view === "matriz" ? undefined : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              Vista Matriz
            </Button>
            <Button
              variant={view === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("lista")}
              className={view === "lista" ? undefined : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              Vista Lista
            </Button>
            <Button
              variant={mostrarNoLectivas ? "default" : "outline"}
              size="sm"
              onClick={() => setMostrarNoLectivas((prev) => !prev)}
              className={mostrarNoLectivas ? "" : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              {mostrarNoLectivas ? "Ocultar no lectivas" : "Mostrar no lectivas"}
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
                {DIAS.map((dia) => (
                  <div
                    key={dia}
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
                      {DIAS.map((dia, diaIndex) => {
                        const horariosEnCelda = getHorariosEnCelda(diaIndex, horaInicio);
                        return (
                          <div
                            key={dia}
                            className="relative min-h-[20px] border border-border rounded-lg bg-background p-1"
                          >
                            {horariosEnCelda.map((horario) => {
                              const esNoLectiva = horario.is_no_lectiva;
                              const leyendaNum = getLeyendaNumero(horario);
                              const colores = esNoLectiva
                                ? {
                                    bg: "bg-rose-500/10",
                                    border: "border-l-rose-500",
                                    text: "text-rose-600 dark:text-rose-400",
                                  }
                                : leyendaNum
                                  ? getColorPorLeyendaNumero(leyendaNum)
                                  : getColorPorCurso(horario.curso_nombre, cursosUnicos);

                              const horarioKey = `${esNoLectiva ? "no-lectiva" : "lectiva"}-${horario.id_asignacion ?? horario.id_carga_no_lectiva}-${horaInicio}-${horario.dia_semana}`;

                              return (
                                <div
                                  key={horarioKey}
                                  className={cn(
                                    "mb-0.5 p-1 rounded border-l-2 text-[10px]",
                                    colores.bg,
                                    colores.border,
                                    colores.text,
                                  )}
                                >
                                  <div className="font-bold truncate">
                                    {esNoLectiva
                                      ? `NL-${leyendaNum ?? ""}`
                                      : `${leyendaNum ?? ""} · ${horario.ambiente_codigo}`}
                                  </div>
                                  <div className="opacity-80 truncate">
                                    {esNoLectiva ? horario.curso_nombre : horario.ciclo_nombre}
                                  </div>
                                  <div className="opacity-70 truncate">
                                    {esNoLectiva ? horario.ciclo_nombre : horario.curso_codigo}
                                  </div>
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
                {horariosOrdenados.map((h, idx) => {
                    const rowKey = `${h.is_no_lectiva ? "no-lectiva" : "lectiva"}-${h.id_asignacion ?? h.id_carga_no_lectiva}-${h.dia_semana}-${h.hora_inicio}-${h.hora_fin}-${idx}`;
                    return (
                      <tr
                        key={rowKey}
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
                        {h.ambiente_codigo || (h.is_no_lectiva ? "-" : "")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-muted",
                          h.is_no_lectiva
                            ? "border-rose-500 text-rose-600 dark:text-rose-400"
                            : "border-border text-muted-foreground"
                        )}>
                          {h.tipo_clase}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DetalleCargaHorariaTables
        cursosLeyenda={cursosLeyenda}
        noLectivasLeyenda={noLectivasLeyenda}
      />
    </div>
  );
}