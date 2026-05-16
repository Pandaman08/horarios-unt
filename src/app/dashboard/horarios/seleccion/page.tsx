"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MatrizDisponibilidad } from "@/components/horarios/MatrizDisponibilidad";
import { ProgresoCursos } from "@/components/horarios/ProgresoCursos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProteccionVentana } from "@/components/auth/ProteccionVentana";

export default function SeleccionHorariosPage() {
  const { data: session } = useSession();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [idPeriodo, setIdPeriodo] = useState<string>("");
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [idAmbiente, setIdAmbiente] = useState<string>("");
  const [cursosProgreso, setCursosProgreso] = useState<any[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<{id: number, tipo: string} | null>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [idGrupo, setIdGrupo] = useState<string>("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (session?.user && idPeriodo) {
      fetchDocenteCursos();
    }
  }, [session, idPeriodo]);

  useEffect(() => {
    if (cursoSeleccionado && idPeriodo) {
      fetchGrupos();
    }
  }, [cursoSeleccionado, idPeriodo]);

  const fetchInitialData = async () => {
    try {
      const [pRes, aRes] = await Promise.all([
        fetch("/api/periodos"),
        fetch("/api/ambientes"),
      ]);
      const pData = await pRes.json();
      const aData = await aRes.json();
      setPeriodos(pData);
      setAmbientes(aData);
      if (pData.length > 0) setIdPeriodo(pData[0].id_periodo.toString());
    } catch (error) {
      toast.error("Error al cargar datos");
    }
  };

  const fetchDocenteCursos = async () => {
    // En una implementación real, este endpoint devolvería los cursos del docente logueado
    // y su progreso basado en asignaciones definitivas.
    // Por ahora simularemos los datos para la demo.
    try {
      // Supongamos que tenemos un endpoint para esto
      const res = await fetch(`/api/docentes/mis-cursos?id_periodo=${idPeriodo}`);
      if (res.ok) {
        const data = await res.json();
        setCursosProgreso(data);
      } else {
        // Mock data para propósitos de desarrollo
        setCursosProgreso([
          { id_curso: 1, nombre: "Ingeniería de Software II", codigo: "ISW-201", tipo_clase: "teoria", horas_requeridas: 4, horas_asignadas: 0 },
          { id_curso: 1, nombre: "Ingeniería de Software II", codigo: "ISW-201", tipo_clase: "laboratorio", horas_requeridas: 2, horas_asignadas: 0 },
        ]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGrupos = async () => {
    if (!cursoSeleccionado) return;
    try {
      const res = await fetch(`/api/grupos?id_curso=${cursoSeleccionado.id}&id_periodo=${idPeriodo}`);
      const data = await res.json();
      setGrupos(data);
      if (data.length > 0) setIdGrupo(data[0].id_grupo.toString());
    } catch (error) {
      toast.error("Error al cargar grupos");
    }
  };

  return (
    <ProteccionVentana>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Selección de Horarios</h1>
          <div className="flex space-x-4">
            <div className="flex items-center space-x-2">
              <Label>Periodo:</Label>
              <Select value={idPeriodo} onValueChange={setIdPeriodo}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.id_periodo} value={p.id_periodo.toString()}>{p.codigo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <ProgresoCursos 
              cursos={cursosProgreso}
              cursoSeleccionadoId={cursoSeleccionado?.id}
              tipoSeleccionado={cursoSeleccionado?.tipo}
              onSelectCurso={(id, tipo) => setCursoSeleccionado({id, tipo})}
            />

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Configuración de Bloque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Grupo</Label>
                  <Select value={idGrupo} onValueChange={setIdGrupo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione grupo" />
                    </SelectTrigger>
                    <SelectContent>
                      {grupos.map(g => (
                        <SelectItem key={g.id_grupo} value={g.id_grupo.toString()}>{g.codigo_grupo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ambiente</Label>
                  <Select value={idAmbiente} onValueChange={setIdAmbiente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione ambiente" />
                    </SelectTrigger>
                    <SelectContent>
                      {ambientes.map(a => (
                        <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()}>{a.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Button className="w-full" variant="default" size="lg">
              Confirmar Todo el Horario
            </Button>
          </div>

          <div className="lg:col-span-3">
            <MatrizDisponibilidad 
              id_periodo={parseInt(idPeriodo)}
              id_ambiente={parseInt(idAmbiente)}
              id_docente_actual={session?.user ? parseInt(session.user.id_usuario) : undefined}
              id_curso_actual={cursoSeleccionado?.id}
              id_grupo_actual={parseInt(idGrupo)}
              tipo_clase_actual={cursoSeleccionado?.tipo}
            />
          </div>
        </div>
      </div>
    </ProteccionVentana>
  );
}
