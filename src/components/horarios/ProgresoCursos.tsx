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
        <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-[#003366]" />
        </div>
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Carga Académica</h3>
      </div>

      <div className="grid gap-3">
        {cursos.length === 0 ? (
          <div className="p-8 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-200 space-y-3">
            <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <BookOpen className="h-6 w-6 text-gray-300" />
            </div>
            <div>
              <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider mb-1">Sin cursos asignados</p>
              <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                Este docente aún no tiene relaciones de carga académica en el sistema.
              </p>
            </div>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="h-3 w-3 text-amber-600" />
                <span className="text-[9px] font-bold text-amber-700 uppercase tracking-tighter">Requiere validación de datos</span>
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
                  "rounded-2xl border p-4",
                  seleccionado 
                    ? "bg-[#003366] border-[#003366] shadow-xl shadow-blue-900/20 translate-x-1" 
                    : "bg-white border-gray-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-900/5",
                  completado && !seleccionado && "bg-emerald-50/50 border-emerald-100"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <h4 className={cn(
                      "font-black text-[11px] leading-tight truncate uppercase tracking-tight",
                      seleccionado ? "text-white" : "text-gray-900"
                    )}>
                      {curso.nombre}
                    </h4>
                    <p className={cn(
                      "text-[9px] font-bold mt-0.5",
                      seleccionado ? "text-blue-200" : "text-gray-400"
                    )}>
                      {curso.codigo}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md font-black text-[8px] uppercase border-none",
                      seleccionado 
                        ? "bg-white/20 text-white" 
                        : (curso.tipo_clase.toLowerCase().includes('teoria') ? "bg-blue-50 text-blue-700" : 
                           curso.tipo_clase.toLowerCase().includes('laboratorio') ? "bg-purple-50 text-purple-700" :
                           "bg-orange-50 text-orange-700")
                    )}>
                      {curso.tipo_clase === 'teoria' ? 'TEORÍA' : 'LAB'}
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
                      "text-[9px] font-black uppercase tracking-widest",
                      seleccionado ? "text-blue-200" : "text-gray-400"
                    )}>
                      Progreso de Horas
                    </span>
                    <span className={cn(
                      "text-[10px] font-black",
                      seleccionado ? "text-white" : "text-[#003366]"
                    )}>
                      {curso.horas_asignadas}<span className="opacity-40 mx-0.5">/</span>{curso.horas_requeridas}h
                    </span>
                  </div>
                  <div className={cn(
                    "w-full rounded-full h-1.5 overflow-hidden",
                    seleccionado ? "bg-white/10" : "bg-gray-100"
                  )}>
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        seleccionado ? "bg-white" : "bg-[#003366]",
                        completado && !seleccionado && "bg-emerald-500"
                      )}
                      style={{ width: `${Math.min(100, (curso.horas_asignadas / curso.horas_requeridas) * 100)}%` }}
                    />
                  </div>
                </div>

                {seleccionado && (
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
