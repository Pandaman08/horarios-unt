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
  Grid3X3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { HorarioGrafico } from "./HorarioGrafico";

const ESTADOS_LECTIVA_DECLARADA = [
  "LECTIVA_CONFIRMADA",
  "ENVIADO",
  "VALIDADO_DEPARTAMENTO",
  "APROBADO",
  "RECHAZADO",
] as const;

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const TIPO_NO_LECTIVA_LABELS: Record<string, string> = {
  PREPARACION_EVALUACION: 'Preparación y Evaluación',
  TUTORIA: 'Consejería y Tutoría',
  INVESTIGACION: 'Investigación',
  CAPACITACION: 'Capacitación',
  GOBIERNO: 'Gobierno',
  ADMINISTRACION: 'Administración',
  ASESORIA: 'Asesoría',
  RESPONSABILIDAD_SOCIAL: 'RSU',
  COMITES_TECNICOS: 'Comités Técnicos',
  AUTOEVALUACION_ACREDITACION: 'Autoevaluación',
};


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
  const { periodoSeleccionado, periodos, periodoActivo, loading: periodoLoading } = usePeriodo();
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [horarios, setHorarios] = useState<HorarioAsignado[]>([]);
  const [cursosLeyenda, setCursosLeyenda] = useState<CursoLeyendaItem[]>([]);
  const [noLectivasLeyenda, setNoLectivasLeyenda] = useState<NoLectivaLeyendaItem[]>([]);
  const [estadoDeclaracion, setEstadoDeclaracion] = useState<string | null>(null);
  const [cargaAprobadaPorDecano, setCargaAprobadaPorDecano] = useState(false);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"matriz" | "lista" | "grafico">("matriz");
  const [generatingReport, setGeneratingReport] = useState(false);

  const [mostrarNoLectivas, setMostrarNoLectivas] = useState(true);

  useEffect(() => {
    const periodoId = periodoSeleccionado?.id_periodo ?? periodoActivo?.id_periodo;
    if (periodoId) {
      setSelectedPeriodo(periodoId.toString());
    }
  }, [periodoSeleccionado, periodoActivo]);

  useEffect(() => {
    if (periodoLoading) return;
    if (!selectedPeriodo) {
      setLoading(false);
      return;
    }
    void fetchHorarios();
  }, [selectedPeriodo, periodoLoading]);

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
        setEstadoDeclaracion(null);
        setCargaAprobadaPorDecano(false);
      } else {
        setHorarios(Array.isArray(data.horarios) ? data.horarios : []);
        setCursosLeyenda(data.cursosLeyenda ?? []);
        setNoLectivasLeyenda(data.noLectivasLeyenda ?? []);
        setEstadoDeclaracion(data.estadoDeclaracion ?? null);
        setCargaAprobadaPorDecano(!!data.cargaAprobadaPorDecano);
      }
    } catch {
      toast.error("No se encontraron horarios asignados");
      setHorarios([]);
      setCursosLeyenda([]);
      setNoLectivasLeyenda([]);
      setEstadoDeclaracion(null);
      setCargaAprobadaPorDecano(false);
    } finally {
      setLoading(false);
    }
  };

  const noLectivas = horarios.filter((h) => h.is_no_lectiva);
  const lectivas = horarios.filter((h) => !h.is_no_lectiva);
  const tieneCargaLectiva =
    lectivas.length > 0 ||
    (estadoDeclaracion != null &&
      ESTADOS_LECTIVA_DECLARADA.includes(
        estadoDeclaracion as (typeof ESTADOS_LECTIVA_DECLARADA)[number],
      ));
  const horariosVisibles = cargaAprobadaPorDecano ? horarios : lectivas;
  const puedeUsarOpciones = cargaAprobadaPorDecano && horariosVisibles.length > 0;

  const horasTotales = horariosVisibles.reduce((sum, h) => {
    const start = Number.parseInt(h.hora_inicio.split(":")[0], 10);
    const end = Number.parseInt(h.hora_fin.split(":")[0], 10);
    return sum + Math.max(0, end - start);
  }, 0);

  const getHorariosEnCelda = (diaIndex: number, hora: string) =>
    horariosVisibles.filter(
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
  const horariosOrdenados = [...horariosVisibles].sort((a, b) => {
    if (a.dia_semana < b.dia_semana) return -1;
    if (a.dia_semana > b.dia_semana) return 1;
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });
  const totalHoras = horasTotales;
  const periodoActualObj = periodos.find(
    (p) => p.id_periodo.toString() === selectedPeriodo
  );

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading || periodoLoading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground">
        Cargando horarios...
      </div>
    );
  }

  // ── Vista principal (unificada con o sin horarios) ────────────────────────
  return (
    <div className="space-y-6 w-full min-w-0">

      {/* Cabecera */}
      <div className="space-y-4">
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
              disabled={generatingReport || !puedeUsarOpciones}
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
              disabled={generatingReport || !puedeUsarOpciones}
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
              variant={view === "matriz" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("matriz")}
              disabled={!puedeUsarOpciones}
              className={view === "matriz" ? undefined : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              Vista Matriz
            </Button>
            <Button
              variant={view === "grafico" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("grafico")}
              disabled={!puedeUsarOpciones}
              className={view === "grafico" ? undefined : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              Horario
            </Button>
            <Button
              variant={view === "lista" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("lista")}
              disabled={!puedeUsarOpciones}
              className={view === "lista" ? undefined : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              Vista Lista
            </Button>
            <Button
              variant={mostrarNoLectivas ? "default" : "outline"}
              size="sm"
              onClick={() => setMostrarNoLectivas((prev) => !prev)}
              disabled={!puedeUsarOpciones || noLectivas.length === 0}
              className={mostrarNoLectivas ? "" : "bg-card border-border text-card-foreground hover:bg-muted"}
            >
              {mostrarNoLectivas ? "Ocultar no lectivas" : "Mostrar no lectivas"}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="space-y-2 flex-1">
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
          </div>
          <p className="text-sm text-muted-foreground sm:pb-2">
            {cargaAprobadaPorDecano ? (
              <>
                Total: <strong className="text-foreground">{totalHoras} horas</strong>
                {" · "}
                {lectivas.length} lectivo(s), {noLectivas.length} no lectivo(s)
              </>
            ) : tieneCargaLectiva ? (
              <>
                {lectivas.length} lectivo(s) registrado(s).
              </>
            ) : (
              "No hay bloques asignados en este periodo."
            )}
          </p>
        </div>
      </div>

      {!tieneCargaLectiva && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Aún no tiene horarios registrados para el periodo seleccionado.
            Complete primero su declaración de carga horaria.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/carga-horaria">Ir a Carga Horaria</a>
          </Button>
        </div>
      )}

      {estadoDeclaracion === "LECTIVA_CONFIRMADA" && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20 p-8 text-center space-y-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Su declaración de carga horaria está pendiente de envío.
            <br />
            Complete y <strong>envíe su carga horaria</strong> para su revisión y aprobación.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/carga-horaria">Ir a Carga Horaria</a>
          </Button>
        </div>
      )}

      {(estadoDeclaracion === "ENVIADO" || estadoDeclaracion === "VALIDADO_DEPARTAMENTO") && (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/20 p-8 text-center">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Su carga horaria fue enviada para aprobación. Actualmente está{" "}
            <strong>pendiente de revisión</strong>.
            <br />
            Debe esperar la aprobación del decano.
          </p>
        </div>
      )}

      {estadoDeclaracion === "RECHAZADO" && (
        <div className="rounded-2xl border border-dashed border-rose-200 bg-rose-50/30 dark:border-rose-950/20 dark:border-rose-900/50 p-8 text-center space-y-4">
          <p className="text-sm text-rose-800 dark:text-rose-200">
            Su carga horaria ha sido <strong>rechazada</strong>.
            <br />
            Revise las observaciones y <strong>modifique su declaración</strong> para volver a enviarla.
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="/dashboard/carga-horaria">Modificar Carga Horaria</a>
          </Button>
        </div>
      )}

      {cargaAprobadaPorDecano && horariosVisibles.length > 0 && (
        <>
      {/* ── Vista Matriz / Lista / Gráfico ─────────────────────────────────────────── */}
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

                              const noLectivaLabel = TIPO_NO_LECTIVA_LABELS[horario.curso_codigo] || horario.ciclo_nombre;

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
                                  {esNoLectiva ? (
                                    <>
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="font-bold truncate">{noLectivaLabel}</span>
                                        <span className="shrink-0 text-[9px] font-bold opacity-80">NL</span>
                                      </div>
                                      <div className="opacity-80 truncate mt-0.5">
                                        {horario.curso_nombre}
                                      </div>
                                      {horario.ambiente_nombre && (
                                        <div className="flex items-center gap-1 mt-0.5 opacity-70">
                                          <span className="w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                                          <span className="truncate">{horario.ambiente_nombre}</span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <div className="font-bold truncate">
                                        {leyendaNum ?? ""} · {horario.ambiente_codigo}
                                      </div>
                                      <div className="opacity-80 truncate">
                                        {horario.ciclo_nombre}
                                      </div>
                                      <div className="opacity-70 truncate">
                                        {horario.curso_codigo}
                                      </div>
                                    </>
                                  )}
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
      ) : view === "grafico" ? (
        <HorarioGrafico
          modo="lectiva"
          id_periodo={periodoSeleccionado?.id_periodo ?? periodoActivo?.id_periodo ?? 0}
          soloLectura={true}
          horariosAsignados={horariosVisibles}
        />
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
                    const esNoLectiva = h.is_no_lectiva;
                    const rowKey = `${esNoLectiva ? "no-lectiva" : "lectiva"}-${h.id_asignacion ?? h.id_carga_no_lectiva}-${h.dia_semana}-${h.hora_inicio}-${h.hora_fin}-${idx}`;
                    const noLectivaLabel = TIPO_NO_LECTIVA_LABELS[h.curso_codigo] || h.ciclo_nombre;
                    return (
                      <tr
                        key={rowKey}
                        className={cn(
                          "border-b border-border last:border-0 transition-colors hover:bg-muted/50",
                          idx % 2 !== 0 && "bg-muted/30",
                          esNoLectiva && "bg-rose-500/[0.03]"
                        )}
                      >
                      <td className="px-4 py-3">
                        {esNoLectiva ? (
                          <>
                            <p className="font-semibold text-rose-600 dark:text-rose-400">
                              {noLectivaLabel}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {h.curso_nombre}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-card-foreground">
                              {h.curso_codigo}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {h.curso_nombre}
                            </p>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">
                        {DIAS[h.dia_semana]}
                      </td>
                      <td className="px-4 py-3 font-medium text-card-foreground">
                        {h.hora_inicio} - {h.hora_fin}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">
                        {esNoLectiva ? (
                          <span className="text-[10px] text-rose-500 font-medium">—</span>
                        ) : (
                          h.grupo_codigo
                        )}
                      </td>
                      <td className="px-4 py-3 text-card-foreground">
                        {h.ambiente_codigo || (esNoLectiva ? <span className="text-[10px] text-muted-foreground">—</span> : "")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-muted",
                          esNoLectiva
                            ? "border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-500/10"
                            : "border-border text-muted-foreground"
                        )}>
                          {esNoLectiva ? "No Lectiva" : h.tipo_clase}
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
        </>
      )}

      {cargaAprobadaPorDecano && (
        <DetalleCargaHorariaTables
          cursosLeyenda={cursosLeyenda}
          noLectivasLeyenda={noLectivasLeyenda}
        />
      )}
    </div>
  );
}