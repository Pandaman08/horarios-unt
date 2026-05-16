"use client";

import { useState, useEffect } from "react";
import { ColaEspera } from "@/components/horarios/ColaEspera";
import { MatrizDisponibilidad } from "@/components/horarios/MatrizDisponibilidad";
import { ProgresoCursos } from "@/components/horarios/ProgresoCursos";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { User, CheckCircle, XCircle } from "lucide-react";

export default function AsignacionOperadorPage() {
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [idPeriodo, setIdPeriodo] = useState<string>("");
  const [docenteActual, setDocenteActual] = useState<any>(null);
  const [cursosProgreso, setCursosProgreso] = useState<any[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<any>(null);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [idAmbiente, setIdAmbiente] = useState<string>("");
  const [grupos, setGrupos] = useState<any[]>([]);
  const [idGrupo, setIdGrupo] = useState<string>("");

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (docenteActual && idPeriodo) {
      fetchDocenteCursos();
    }
  }, [docenteActual, idPeriodo]);

  useEffect(() => {
    if (cursoSeleccionado && idPeriodo) {
      fetchGrupos();
      fetchAmbientesValidos();
    }
  }, [cursoSeleccionado, idPeriodo]);

  const fetchPeriodos = async () => {
    const res = await fetch("/api/periodos");
    const data = await res.json();
    setPeriodos(data);
    if (data.length > 0) setIdPeriodo(data[0].id_periodo.toString());
  };

  const fetchDocenteCursos = async () => {
    const res = await fetch(`/api/docentes/${docenteActual.id_docente}/cursos`);
    const data = await res.json();
    // Transformar a formato progreso
    const transformado = data.map((dc: any) => ({
      id_curso: dc.id_curso,
      nombre: dc.curso.nombre,
      codigo: dc.curso.codigo,
      tipo_clase: dc.tipo_clase,
      horas_requeridas: dc.tipo_clase === 'teoria' ? dc.curso.horas_teoria : dc.curso.horas_laboratorio,
      horas_asignadas: 0 // Simplificado para la demo
    }));
    setCursosProgreso(transformado);
  };

  const fetchGrupos = async () => {
    const res = await fetch(`/api/grupos?id_curso=${cursoSeleccionado.id_curso}&id_periodo=${idPeriodo}`);
    const data = await res.json();
    setGrupos(data);
    if (data.length > 0) setIdGrupo(data[0].id_grupo.toString());
  };

  const fetchAmbientesValidos = async () => {
    const res = await fetch(`/api/cursos/${cursoSeleccionado.id_curso}/ambientes`);
    const data = await res.json();
    setAmbientes(data.map((ca: any) => ca.ambiente));
    if (data.length > 0) setIdAmbiente(data[0].id_ambiente.toString());
  };

  const handleLlamarDocente = (docente: any) => {
    setDocenteActual(docente);
    setCursoSeleccionado(null);
    setIdGrupo("");
    setIdAmbiente("");
    toast.info(`Atendiendo a: ${docente.nombres} ${docente.apellidos}`);
  };

  const handleFinalizarAtencion = () => {
    setDocenteActual(null);
    setCursosProgreso([]);
    setCursoSeleccionado(null);
    toast.success("Atención finalizada");
  };

  return (
    <div className="p-6 grid grid-cols-12 gap-6 h-[calc(100vh-100px)]">
      {/* Columna Izquierda: Cola de Espera */}
      <div className="col-span-12 lg:col-span-3">
        <ColaEspera 
          id_periodo={parseInt(idPeriodo)} 
          onLlamarDocente={handleLlamarDocente}
          docenteActualId={docenteActual?.id_docente}
        />
      </div>

      {/* Columna Central/Derecha: Panel de Asignación */}
      <div className="col-span-12 lg:col-span-9 flex flex-col space-y-6 overflow-y-auto">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-2 rounded-full">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {docenteActual ? `${docenteActual.nombres} ${docenteActual.apellidos}` : "Ningún docente en atención"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {docenteActual ? `${docenteActual.modalidad} - ${docenteActual.categoria.replace("_", " ")}` : "Seleccione un docente de la cola"}
              </p>
            </div>
          </div>
          
          {docenteActual && (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleFinalizarAtencion}>
                <XCircle className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button onClick={handleFinalizarAtencion} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="mr-2 h-4 w-4" /> Finalizar y Confirmar
              </Button>
            </div>
          )}
        </div>

        {docenteActual && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4 space-y-6">
              <ProgresoCursos 
                cursos={cursosProgreso}
                cursoSeleccionadoId={cursoSeleccionado?.id_curso}
                tipoSeleccionado={cursoSeleccionado?.tipo_clase}
                onSelectCurso={(id, tipo) => setCursoSeleccionado(cursosProgreso.find(c => c.id_curso === id && c.tipo_clase === tipo))}
              />

              {cursoSeleccionado && (
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
                      <Label>Ambiente (Válidos)</Label>
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
              )}
            </div>

            <div className="col-span-12 md:col-span-8">
              <MatrizDisponibilidad 
                id_periodo={parseInt(idPeriodo)}
                id_ambiente={parseInt(idAmbiente)}
                id_docente_actual={docenteActual.id_docente}
                id_curso_actual={cursoSeleccionado?.id_curso}
                id_grupo_actual={parseInt(idGrupo)}
                tipo_clase_actual={cursoSeleccionado?.tipo_clase}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
