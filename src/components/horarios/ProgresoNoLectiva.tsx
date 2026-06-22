"use client";

import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Type mapping for TipoCargaNoLectiva enum to friendly labels
const tipoLabel = (tipo: string) => {
  const labels: Record<string, string> = {
    PREPARACION_EVALUACION: "Preparación y Evaluación",
    TUTORIA: "Tutoría",
    INVESTIGACION: "Investigación",
    CAPACITACION: "Capacitación",
    GOBIERNO: "Gobierno Universitario",
    ADMINISTRACION: "Administración",
    ASESORIA: "Asesoría",
    RESPONSABILIDAD_SOCIAL: "Responsabilidad Social",
    COMITES_TECNICOS: "Comités Técnicos",
    AUTOEVALUACION_ACREDITACION: "Autoevaluación y Acreditación",
    OTRO: "Otro",
  };
  return labels[tipo] || tipo;
};

const tipoColor = (tipo: string, selected: boolean) => {
  if (selected) return "bg-white/15 text-white border-white/25";
  
  const colors: Record<string, string> = {
    PREPARACION_EVALUACION: "bg-green-50 text-green-700 border-green-100 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800",
    TUTORIA: "bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
    INVESTIGACION: "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
    CAPACITACION: "bg-yellow-50 text-yellow-700 border-yellow-100 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800",
    GOBIERNO: "bg-red-50 text-red-700 border-red-100 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
    ADMINISTRACION: "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
    ASESORIA: "bg-cyan-50 text-cyan-700 border-cyan-100 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800",
    RESPONSABILIDAD_SOCIAL: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
    COMITES_TECNICOS: "bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-950/40 dark:text-slate-300 dark:border-slate-800",
    AUTOEVALUACION_ACREDITACION: "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800",
    OTRO: "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-950/40 dark:text-gray-300 dark:border-gray-800",
  };
  
  return colors[tipo] || "bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-950/40 dark:text-gray-300 dark:border-gray-800";
};

interface ActividadProgreso {
  id_carga_no_lectiva: number;
  tipo: string;
  descripcion?: string;
  horas_semanales: number;
  horas_asignadas: number;
}

interface Props {
  actividades: ActividadProgreso[];
  onSelectActividad: (id: number) => void;
  actividadSeleccionadaId?: number;
}

export function ProgresoNoLectiva({
  actividades,
  onSelectActividad,
  actividadSeleccionadaId,
}: Props) {
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border shrink-0">
        <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
          <CalendarCheck className="h-4 w-4 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-foreground">Carga no lectiva</h3>
          <p className="text-[10px] text-muted-foreground">
            {actividades.length} actividad{actividades.length !== 1 ? "es" : ""} declarada{actividades.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-0.5 -mr-0.5 mt-3 space-y-2 max-h-[min(52vh,520px)] custom-scrollbar">
        {actividades.length === 0 ? (
          <div className="p-5 text-center rounded-xl border border-dashed border-border bg-muted/30 space-y-2">
            <BookOpen className="h-8 w-8 text-muted-foreground/40 mx-auto" />
            <p className="text-xs font-semibold text-foreground">Sin actividades</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Requiere carga horaria aprobada con actividades no lectivas.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="h-3 w-3 text-amber-600" />
              <span className="text-[9px] font-semibold text-amber-700">Pendiente</span>
            </div>
          </div>
        ) : (
          actividades.map((actividad) => {
            const completado = actividad.horas_semanales > 0 && actividad.horas_asignadas >= actividad.horas_semanales;
            const seleccionado = actividadSeleccionadaId === actividad.id_carga_no_lectiva;
            const pct = actividad.horas_semanales > 0
              ? Math.min(100, (actividad.horas_asignadas / actividad.horas_semanales) * 100)
              : 0;

            return (
              <button
                key={actividad.id_carga_no_lectiva}
                type="button"
                onClick={() => onSelectActividad(actividad.id_carga_no_lectiva)}
                className={cn(
                  "w-full text-left rounded-xl border p-3 transition-all duration-200",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50",
                  seleccionado
                    ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                    : "bg-card border-border hover:border-emerald-500/40 hover:bg-muted/40",
                  completado && !seleccionado && "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-[11px] font-bold leading-snug line-clamp-2",
                        seleccionado ? "text-white" : "text-foreground"
                      )}
                    >
                      {tipoLabel(actividad.tipo)}
                    </p>
                    {actividad.descripcion && (
                      <p
                        className={cn(
                          "text-[10px] mt-0.5 line-clamp-2",
                          seleccionado ? "text-white/70" : "text-muted-foreground"
                        )}
                      >
                        {actividad.descripcion}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border",
                        tipoColor(actividad.tipo, seleccionado)
                      )}
                    >
                      {actividad.tipo}
                    </span>
                    {completado && (
                      <CheckCircle2
                        className={cn(
                          "h-3.5 w-3.5",
                          seleccionado ? "text-emerald-100" : "text-emerald-600"
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-semibold uppercase tracking-wide">
                    <span className={seleccionado ? "text-white/70" : "text-muted-foreground"}>
                      Horas
                    </span>
                    <span className={seleccionado ? "text-white" : "text-foreground"}>
                      {actividad.horas_asignadas}/{actividad.horas_semanales}h
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
                            : "bg-emerald-600"
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
