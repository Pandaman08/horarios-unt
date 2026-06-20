"use client";

import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CursoProgreso {
  id_curso: number;
  nombre: string;
  codigo: string;
  tipo_clase: string;
  horas_requeridas: number;
  horas_asignadas: number;
  confirmado?: boolean;
}

interface Props {
  cursos: CursoProgreso[];
  onSelectCurso: (id_curso: number, tipo: string) => void;
  cursoSeleccionadoId?: number;
  tipoSeleccionado?: string;
}

const tipoLabel = (tipo: string) => {
  const t = tipo.toLowerCase();
  if (t.includes("teoria") || t.includes("teoría")) return "Teoría";
  if (t.includes("laboratorio")) return "Lab";
  if (t.includes("practica") || t.includes("práctica")) return "Práctica";
  return tipo;
};

const tipoColor = (tipo: string, selected: boolean) => {
  if (selected) return "bg-white/15 text-white border-white/25";
  const t = tipo.toLowerCase();
  if (t.includes("teoria") || t.includes("teoría"))
    return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800";
  if (t.includes("laboratorio"))
    return "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
  return "bg-sky-50 text-sky-700 border-sky-100 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
};

export function ProgresoCursos({
  cursos,
  onSelectCurso,
  cursoSeleccionadoId,
  tipoSeleccionado,
}: Props) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
          <GraduationCap className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground">Carga académica</h3>
          <p className="text-[10px] text-muted-foreground">
            {cursos.length} curso{cursos.length !== 1 ? "s" : ""} aprobado{cursos.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 -mr-0.5 mt-3 space-y-2 max-h-[min(52vh,520px)] custom-scrollbar">
        {cursos.length === 0 ? (
          <div className="p-5 text-center rounded-xl border border-dashed border-border bg-muted/30 space-y-2">
            <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-foreground">Sin cursos</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Requiere carga horaria aprobada y grupos en el período.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <span className="text-[9px] font-semibold text-amber-700">Pendiente</span>
            </div>
          </div>
        ) : (
          cursos.map((curso) => {
            const completado = curso.horas_requeridas > 0 && curso.horas_asignadas >= curso.horas_requeridas;
            const seleccionado =
              cursoSeleccionadoId === curso.id_curso &&
              tipoSeleccionado === curso.tipo_clase;
            const pct = curso.horas_requeridas > 0
              ? Math.min(100, (curso.horas_asignadas / curso.horas_requeridas) * 100)
              : 0;

            return (
              <button
                key={`${curso.id_curso}-${curso.tipo_clase}`}
                type="button"
                onClick={() => onSelectCurso(curso.id_curso, curso.tipo_clase)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  seleccionado
                    ? "bg-primary border-primary text-primary-foreground shadow-md"
                    : "bg-card border-border hover:border-primary/40 hover:bg-muted/40",
                  completado && !seleccionado && "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[11px] font-bold leading-snug line-clamp-2",
                        seleccionado ? "text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {curso.nombre}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] font-mono mt-0.5",
                        seleccionado ? "text-primary-foreground/70" : "text-muted-foreground"
                      )}
                    >
                      {curso.codigo}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border",
                        tipoColor(curso.tipo_clase, seleccionado)
                      )}
                    >
                      {tipoLabel(curso.tipo_clase)}
                    </span>
                    {completado && (
                      <CheckCircle2
                        className={cn(
                          "h-3.5 w-3.5",
                          seleccionado ? "text-emerald-300" : "text-emerald-600"
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-semibold uppercase tracking-wide">
                    <span className={seleccionado ? "text-primary-foreground/70" : "text-muted-foreground"}>
                      Horas
                    </span>
                    <span className={seleccionado ? "text-primary-foreground" : "text-foreground"}>
                      {curso.horas_asignadas}/{curso.horas_requeridas}h
                    </span>
                  </div>
                  <div
                    className={cn(
                      "h-1 rounded-full overflow-hidden",
                      seleccionado ? "bg-white/20" : "bg-muted"
                    )}
                  >
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        seleccionado
                          ? "bg-white"
                          : completado
                            ? "bg-emerald-500"
                            : "bg-primary"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
