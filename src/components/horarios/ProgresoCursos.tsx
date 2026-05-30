"use client";

import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  GraduationCap
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

export function ProgresoCursos({ cursos, onSelectCurso, cursoSeleccionadoId, tipoSeleccionado }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
          <GraduationCap className="h-4 w-4 text-[#1a237e]" />
        </div>
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Carga Académica</h3>
      </div>

      <div className="grid gap-3">
        {cursos.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200 space-y-4">
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <BookOpen className="h-6 w-6 text-slate-300" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-700 uppercase tracking-wider mb-1">Sin cursos asignados</p>
              <p className="text-[10px] font-medium text-slate-400 leading-relaxed max-w-[200px] mx-auto">
                Este docente aún no tiene relaciones de carga académica en el sistema.
              </p>
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter">Requiere validación</span>
              </div>
            </div>
          </div>
        ) : (
          cursos.map((curso) => {
            const completado = curso.horas_asignadas >= curso.horas_requeridas;
            const seleccionado = cursoSeleccionadoId === curso.id_curso && tipoSeleccionado === curso.tipo_clase;
            
            return (
              <div 
                key={`${curso.id_curso}-${curso.tipo_clase}`}
                onClick={() => onSelectCurso(curso.id_curso, curso.tipo_clase)}
                className={cn(
                  "relative group cursor-pointer transition-all duration-300",
                  "rounded-2xl border p-4 shadow-sm",
                  seleccionado 
                    ? "bg-[#1a237e] border-[#1a237e] shadow-lg shadow-indigo-900/20 translate-x-1" 
                    : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md",
                  completado && !seleccionado && "bg-emerald-50/30 border-emerald-100"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className={cn(
                      "font-bold text-[11px] leading-tight truncate uppercase tracking-tight",
                      seleccionado ? "text-white" : "text-slate-800"
                    )}>
                      {curso.nombre}
                    </h4>
                    <p className={cn(
                      "text-[9px] font-bold mt-0.5 font-mono",
                      seleccionado ? "text-indigo-200" : "text-slate-400"
                    )}>
                      {curso.codigo}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded-lg font-bold text-[8px] uppercase border",
                      seleccionado 
                        ? "bg-white/10 text-white border-white/20" 
                        : (curso.tipo_clase.toLowerCase().includes('teoria') ? "bg-indigo-50 text-indigo-700 border-indigo-100" : 
                           curso.tipo_clase.toLowerCase().includes('laboratorio') ? "bg-purple-50 text-purple-700 border-purple-100" :
                           "bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-300 border-sky-100 dark:border-sky-800/50")
                    )}>
                      {curso.tipo_clase.toUpperCase()}
                    </span>
                    {completado && (
                      <CheckCircle2 className={cn(
                        "h-3.5 w-3.5",
                        seleccionado ? "text-emerald-400" : "text-emerald-500"
                      )} />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest",
                      seleccionado ? "text-indigo-200" : "text-slate-400"
                    )}>
                      Progreso
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold",
                      seleccionado ? "text-white" : "text-[#1a237e]"
                    )}>
                      {curso.horas_asignadas}<span className="opacity-40 mx-0.5">/</span>{curso.horas_requeridas}h
                    </span>
                  </div>
                  <div className={cn(
                    "w-full rounded-full h-1.5 overflow-hidden shadow-inner",
                    seleccionado ? "bg-white/10" : "bg-slate-100"
                  )}>
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        seleccionado ? "bg-white" : "bg-[#1a237e]",
                        completado && !seleccionado && "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, (curso.horas_asignadas / curso.horas_requeridas) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
