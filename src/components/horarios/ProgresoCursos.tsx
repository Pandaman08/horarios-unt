"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CursoProgreso {
  id_curso: number;
  nombre: string;
  codigo: string;
  tipo_clase: string;
  horas_requeridas: number;
  horas_asignadas: number;
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
                  <h4 className="font-bold text-sm">{curso.nombre}</h4>
                  <p className="text-xs text-muted-foreground">{curso.codigo}</p>
                </div>
                <Badge variant={completado ? "default" : "secondary"} className="capitalize">
                  {curso.tipo_clase}
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progreso</span>
                  <span>{curso.horas_asignadas} / {curso.horas_requeridas} h</span>
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

import { cn } from "@/lib/utils";
