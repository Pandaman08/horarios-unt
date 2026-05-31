"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Save, Users, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { usePeriodo } from "@/contexts/PeriodoContext";

interface Docente {
  id_docente: number;
  nombres: string;
  apellidos: string;
  codigo_docente: string;
}

interface Curso {
  id_curso: number;
  nombre: string;
  codigo: string;
}

interface Grupo {
  id_grupo: number;
  codigo_grupo: string;
}

interface CargaLectivaAsignada {
  id?: number;
  id_curso: number;
  id_grupo?: number | null;
  tipo_clase: "teoria" | "practica" | "laboratorio";
  horas_semanales: number;
  grupos_asignados?: number | null;
}

export default function AsignacionCargaLectivaPage() {
  const { periodoActivo } = usePeriodo();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<Docente | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargasLectivas, setCargasLectivas] = useState<CargaLectivaAsignada[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Docente[]>([]);

  useEffect(() => {
    if (periodoActivo) {
      fetchDocentes();
      fetchCursos();
      fetchGrupos();
    }
  }, [periodoActivo]);

  const fetchDocentes = async () => {
    try {
      const res = await fetch("/api/docentes");
      const data = await res.json();
      setDocentes(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar docentes");
    }
  };

  const fetchCursos = async () => {
    try {
      const res = await fetch("/api/cursos");
      const data = await res.json();
      setCursos(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar cursos");
    }
  };

  const fetchGrupos = async () => {
    if (!periodoActivo) return;
    try {
      const res = await fetch(`/api/grupos?idPeriodo=${periodoActivo.id_periodo}`);
      const data = await res.json();
      setGrupos(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar grupos");
    }
  };

  const handleSearchDocente = async (term: string) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }

    const filtered = docentes.filter((doc) =>
      doc.nombres.toLowerCase().includes(term.toLowerCase()) ||
      doc.apellidos.toLowerCase().includes(term.toLowerCase()) ||
      doc.codigo_docente.toLowerCase().includes(term.toLowerCase())
    );

    setSearchResults(filtered);
  };

  const handleSeleccionarDocente = async (docente: Docente) => {
    setDocenteSeleccionado(docente);
    setSearchTerm("");
    setSearchResults([]);
    
    // Cargar la carga lectiva existente para este docente y periodo
    if (periodoActivo) {
      try {
        const res = await fetch(`/api/declaracion-horaria?idDocente=${docente.id_docente}&idPeriodo=${periodoActivo.id_periodo}`);
        const declaracion = await res.json();
        if (declaracion && declaracion.cargas_lectivas) {
          setCargasLectivas(declaracion.cargas_lectivas.map((cl: any) => ({
            id: cl.id_carga_lectiva,
            id_curso: cl.id_curso,
            id_grupo: cl.id_grupo,
            tipo_clase: cl.tipo_clase,
            horas_semanales: cl.horas_semanales,
            grupos_asignados: cl.grupos_asignados
          })));
        } else {
          setCargasLectivas([]);
        }
      } catch (error) {
        console.error(error);
        setCargasLectivas([]);
      }
    }
  };

  const addCargaLectiva = () => {
    setCargasLectivas([
      ...cargasLectivas,
      {
        id_curso: 0,
        tipo_clase: "teoria",
        horas_semanales: 0,
        grupos_asignados: 0
      }
    ]);
  };

  const removeCargaLectiva = (index: number) => {
    setCargasLectivas(cargasLectivas.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!docenteSeleccionado || !periodoActivo) {
      toast.error("Seleccione un docente y periodo");
      return;
    }

    setLoading(true);
    try {
      // Primero, asegurarnos de que exista la declaración
      let declaracionId: number | null = null;
      
      const declaracionRes = await fetch(`/api/declaracion-horaria?idDocente=${docenteSeleccionado.id_docente}&idPeriodo=${periodoActivo.id_periodo}`);
      const declaracion = await declaracionRes.json();

      if (declaracion) {
        declaracionId = declaracion.id_declaracion;
        // Borrar todas las cargas existentes para reemplazarlas
        for (const carga of declaracion.cargas_lectivas) {
          await fetch(`/api/carga-lectiva?id=${carga.id_carga_lectiva}`, {
            method: 'DELETE'
          });
        }
      } else {
        // Crear nueva declaración (solo los datos básicos por ahora)
        const createRes = await fetch("/api/declaracion-horaria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_docente: docenteSeleccionado.id_docente,
            id_periodo: periodoActivo.id_periodo,
            ibm: docenteSeleccionado.codigo_docente,
            condicion: "Nombrado",
            categoria: "Asociado",
            dedicacion: "Tiempo Completo 40 h",
            horas_dedicacion: 40
          })
        });
        const newDeclaracion = await createRes.json();
        declaracionId = newDeclaracion.id_declaracion;
      }

      // Agregar nuevas cargas
      for (const carga of cargasLectivas) {
        if (carga.id_curso) {
          await fetch("/api/carga-lectiva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_declaracion: declaracionId,
              id_curso: carga.id_curso,
              id_grupo: carga.id_grupo,
              tipo_clase: carga.tipo_clase,
              horas_semanales: carga.horas_semanales,
              grupos_asignados: carga.grupos_asignados
            })
          });
        }
      }

      // Recargar los datos para actualizar la lista con los IDs reales
      await handleSeleccionarDocente(docenteSeleccionado);
      toast.success("Carga lectiva asignada correctamente!");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar la carga lectiva");
    } finally {
      setLoading(false);
    }
  };

  const totalHoras = cargasLectivas.reduce((sum, carga) => sum + carga.horas_semanales, 0);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Asignación de Carga Lectiva</h1>
          <p className="text-slate-500 mt-1">Secretaría / Departamento Académico</p>
        </div>
        <div className="flex items-center gap-2">
          {periodoActivo && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {periodoActivo.nombre}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Docente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Buscar docente por nombre o código..."
                value={searchTerm}
                onChange={(e) => handleSearchDocente(e.target.value)}
              />
              
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((docente) => (
                    <Button
                      key={docente.id_docente}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSeleccionarDocente(docente)}
                    >
                      {docente.nombres} {docente.apellidos}
                    </Button>
                  ))}
                </div>
              )}

              {docenteSeleccionado && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-semibold">{docenteSeleccionado.nombres} {docenteSeleccionado.apellidos}</p>
                  <p className="text-sm text-slate-600">{docenteSeleccionado.codigo_docente}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {docenteSeleccionado ? (
            <div className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Carga Lectiva Asignada
                  </CardTitle>
                  <Button onClick={addCargaLectiva} size="sm" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cargasLectivas.map((carga, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-slate-50 rounded-lg border">
                      <div className="col-span-3 space-y-1">
                        <Label>Curso</Label>
                        <Select
                          value={carga.id_curso?.toString() || ""}
                          onValueChange={(value) => {
                            const updated = [...cargasLectivas];
                            updated[index].id_curso = parseInt(value);
                            setCargasLectivas(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar curso" />
                          </SelectTrigger>
                          <SelectContent>
                            {cursos.map((curso) => (
                              <SelectItem key={curso.id_curso} value={curso.id_curso.toString()}>
                                {curso.codigo} - {curso.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label>Tipo</Label>
                        <Select
                          value={carga.tipo_clase}
                          onValueChange={(value: any) => {
                            const updated = [...cargasLectivas];
                            updated[index].tipo_clase = value;
                            setCargasLectivas(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="teoria">Teoría</SelectItem>
                            <SelectItem value="practica">Práctica</SelectItem>
                            <SelectItem value="laboratorio">Laboratorio</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label>Grupo (opcional)</Label>
                        <Select
                          value={carga.id_grupo?.toString() || ""}
                          onValueChange={(value) => {
                            const updated = [...cargasLectivas];
                            updated[index].id_grupo = value ? parseInt(value) : null;
                            setCargasLectivas(updated);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupos.map((grupo) => (
                              <SelectItem key={grupo.id_grupo} value={grupo.id_grupo.toString()}>
                                {grupo.codigo_grupo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label>Horas</Label>
                        <Input
                          type="number"
                          value={carga.horas_semanales}
                          onChange={(e) => {
                            const updated = [...cargasLectivas];
                            updated[index].horas_semanales = parseInt(e.target.value) || 0;
                            setCargasLectivas(updated);
                          }}
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label>N° Grupos</Label>
                        <Input
                          type="number"
                          value={carga.grupos_asignados || 0}
                          onChange={(e) => {
                            const updated = [...cargasLectivas];
                            updated[index].grupos_asignados = parseInt(e.target.value) || 0;
                            setCargasLectivas(updated);
                          }}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeCargaLectiva(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {cargasLectivas.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      No hay cursos asignados. Agregue uno para empezar.
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <span className="text-sm font-medium text-slate-600">Total horas semanales: </span>
                  <span className="text-xl font-bold text-slate-900">{totalHoras}</span>
                </div>
                <Button onClick={handleSave} disabled={loading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {loading ? "Guardando..." : "Guardar Asignación"}
                </Button>
              </div>
            </div>
          ) : (
            <Card className="p-8">
              <div className="text-center text-slate-500">
                Seleccione un docente para empezar a asignar la carga lectiva.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
