"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Mis Cursos Asignados</h3>
      {cursos.map((curso) => {
        const completado = curso.horas_asignadas >= curso.horas_requeridas;
        const seleccionado = cursoSeleccionadoId === curso.id_curso && tipoSeleccionado === curso.tipo_clase;
        
        return (
          <Card 
            key={`${curso.id_curso}-${curso.tipo_clase}`}
            className={cn(
              "cursor-pointer transition-all",
              seleccionado ? "border-blue-500 bg-blue-50" : "hover:border-gray-400",
              completado && "bg-green-50"
            )}
            onClick={() => onSelectCurso(curso.id_curso, curso.tipo_clase)}
          >
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-bold text-sm text-gray-900">{curso.nombre}</h4>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{curso.codigo}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-bold border",
                    curso.tipo_clase.toLowerCase().includes('teoria') ? "bg-blue-50 text-blue-700 border-blue-100" : 
                    curso.tipo_clase.toLowerCase().includes('laboratorio') ? "bg-purple-50 text-purple-700 border-purple-100" :
                    "bg-orange-50 text-orange-700 border-orange-100"
                  )}>
                    {curso.tipo_clase}
                  </span>
                  {curso.confirmado && (
                    <span className="text-[8px] mt-1 text-green-600 font-bold flex items-center bg-green-50 px-1 rounded border border-green-100">
                      <div className="w-1 h-1 bg-green-500 rounded-full mr-1"></div>
                      CONFIRMADO
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-bold">
                  <span className="text-gray-600">Progreso</span>
                  <span className={cn(
                    completado ? "text-green-600" : "text-blue-600"
                  )}>
                    {curso.horas_asignadas} / {curso.horas_requeridas} h
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      completado ? "bg-green-500" : "bg-blue-500"
                    )}
                    style={{ width: `${Math.min(100, (curso.horas_asignadas / curso.horas_requeridas) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
