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
import { 
  User, 
  CheckCircle, 
  XCircle, 
  Users, 
  Monitor, 
  ChevronRight,
  Info,
  Clock,
  Layout as LayoutIcon,
  Settings2
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [isConfirming, setIsConfirming] = useState(false);

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
    const transformado = data.map((dc: any) => ({
      id_curso: dc.id_curso,
      nombre: dc.curso.nombre,
      codigo: dc.curso.codigo,
      tipo_clase: dc.tipo_clase,
      horas_requeridas: dc.tipo_clase === 'teoria' ? dc.curso.horas_teoria : dc.curso.horas_laboratorio,
      horas_asignadas: 0 
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

  const handleConfirmarAsignacion = async () => {
    if (!docenteActual || !idPeriodo) return;

    setIsConfirming(true);
    try {
      const res = await fetch("/api/horarios/confirmar-seleccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_periodo: parseInt(idPeriodo),
          id_docente: docenteActual.id_docente
        })
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Horario confirmado con éxito para ${docenteActual.nombres}`);
        handleFinalizarAtencion();
      } else {
        toast.error(data.error || "Error al confirmar asignación");
      }
    } catch (error) {
      console.error("Error al confirmar:", error);
      toast.error("Error de conexión al confirmar");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700">
      {/* Header de la Página */}
      <div className="bg-white border-b border-gray-100 p-6 shadow-sm z-20">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="h-12 w-12 bg-[#003366] rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <LayoutIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Centro de Asignación</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-black text-[#003366]/40 uppercase tracking-[0.2em]">Gestión en Tiempo Real</p>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <div className="flex items-center gap-2 px-3">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-bold text-gray-600">Periodo:</span>
              <Select value={idPeriodo} onValueChange={setIdPeriodo}>
                <SelectTrigger className="w-[140px] h-9 border-none bg-white rounded-xl shadow-sm font-black text-xs focus:ring-2 focus:ring-blue-100">
                  <SelectValue placeholder="Ciclo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                  {periodos.map(p => (
                    <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold">Ciclo {p.codigo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Izquierdo: Cola de Espera */}
        <aside className="w-80 bg-gray-50/50 border-r border-gray-100 flex flex-col shrink-0">
          <div className="p-4 border-b border-gray-100 bg-white/50">
            <div className="flex items-center gap-2 text-gray-400 mb-4 px-2">
              <Users className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Cola de Atención</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ColaEspera 
              id_periodo={parseInt(idPeriodo)} 
              onLlamarDocente={handleLlamarDocente}
              docenteActualId={docenteActual?.id_docente}
            />
          </div>
        </aside>

        {/* Área de Trabajo Central */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          {!docenteActual ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mb-6 animate-bounce duration-[3000ms]">
                <Users className="h-10 w-10 text-[#003366] opacity-20" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Esperando Operación</h3>
              <p className="text-gray-400 font-medium max-w-sm">Seleccione un docente de la cola lateral para iniciar el proceso de asignación de horarios.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              {/* Header del Docente en Atención */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm shrink-0">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center ring-4 ring-blue-50/50">
                    <User className="h-7 w-7 text-[#003366]" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1">
                      {docenteActual.nombres} {docenteActual.apellidos}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border-none font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-md">
                        {docenteActual.modalidad}
                      </span>
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 border-none font-black text-[9px] uppercase tracking-tighter px-2 py-0.5 rounded-md">
                        {docenteActual.categoria.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    onClick={handleFinalizarAtencion}
                    disabled={isConfirming}
                    className="h-12 px-6 rounded-xl font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmarAsignacion}
                    disabled={isConfirming}
                    className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <CheckCircle className="mr-2 h-5 w-5" /> 
                    {isConfirming ? "Confirmando..." : "Confirmar Asignación"}
                  </Button>
                </div>
              </div>

              {/* Grid de Operación */}
              <div className="flex-1 flex overflow-hidden">
                {/* Columna de Cursos y Configuración */}
                <div className="w-[400px] border-r border-gray-100 flex flex-col shrink-0 bg-gray-50/30">
                  <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    <ProgresoCursos 
                      cursos={cursosProgreso}
                      cursoSeleccionadoId={cursoSeleccionado?.id_curso}
                      tipoSeleccionado={cursoSeleccionado?.tipo_clase}
                      onSelectCurso={(id, tipo) => setCursoSeleccionado(cursosProgreso.find(c => c.id_curso === id && c.tipo_clase === tipo))}
                    />

                    {cursoSeleccionado && (
                      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 space-y-6 animate-in slide-in-from-left-4 duration-500">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Settings2 className="h-4 w-4 text-[#003366]" />
                            </div>
                            <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider">Configuración de Bloque</h4>
                          </div>
                          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-[#003366] rounded-md font-black text-[9px] uppercase tracking-tighter">
                            Paso 2 de 3
                          </span>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2 relative">
                            <div className="flex items-center justify-between ml-1">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Grupo de Estudios</Label>
                              {idGrupo && (
                                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Seleccionado
                                </span>
                              )}
                            </div>
                            <Select value={idGrupo} onValueChange={setIdGrupo}>
                              <SelectTrigger 
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-gray-50/50 font-bold focus:ring-4 focus:ring-blue-100 transition-all",
                                  grupos.length === 0 && "opacity-60 cursor-not-allowed bg-gray-100"
                                )}
                              >
                                <SelectValue placeholder={grupos.length === 0 ? "Sin grupos disponibles" : "Seleccione grupo"} />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                {grupos.length === 0 ? (
                                  <div className="p-4 text-center">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase">No hay grupos configurados</p>
                                    <p className="text-[9px] text-gray-400 mt-1">Verifique el registro de grupos para este curso.</p>
                                  </div>
                                ) : (
                                  grupos.map(g => (
                                    <SelectItem key={g.id_grupo} value={g.id_grupo.toString()} className="font-bold">Grupo {g.codigo_grupo}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between ml-1">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ambiente de Clase</Label>
                              {idAmbiente && (
                                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> Seleccionado
                                </span>
                              )}
                            </div>
                            <Select value={idAmbiente} onValueChange={setIdAmbiente}>
                              <SelectTrigger 
                                className={cn(
                                  "h-12 rounded-xl border-gray-200 bg-gray-50/50 font-bold focus:ring-4 focus:ring-blue-100 transition-all",
                                  ambientes.length === 0 && "opacity-60 cursor-not-allowed bg-gray-100"
                                )}
                              >
                                <SelectValue placeholder={ambientes.length === 0 ? "Sin ambientes válidos" : "Seleccione ambiente"} />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                {ambientes.length === 0 ? (
                                  <div className="p-4 text-center">
                                    <p className="text-[10px] font-bold text-amber-600 uppercase">Sin ambientes asignados</p>
                                    <p className="text-[9px] text-gray-400 mt-1">Asigne ambientes válidos a este curso para continuar.</p>
                                  </div>
                                ) : (
                                  ambientes.map(a => (
                                    <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()} className="font-bold">{a.nombre}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {idGrupo && idAmbiente && (
                            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 animate-in zoom-in duration-300">
                              <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                              <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase tracking-tight">
                                ¡Listo! Ahora puede seleccionar los bloques horarios en la matriz de la derecha para completar la carga.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!cursoSeleccionado && (
                      <div className="bg-white p-8 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center text-center space-y-4">
                        <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                          <ChevronRight className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-gray-900 uppercase tracking-wider mb-1">Paso 1: Seleccionar Curso</p>
                          <p className="text-[10px] font-medium text-gray-400 leading-relaxed">
                            Elija una asignatura de la lista superior para habilitar la configuración de grupos y ambientes.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Área de la Matriz (Expandida) */}
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/50 custom-scrollbar relative">
                  <div className="max-w-[1400px] mx-auto h-full">
                    {(!idGrupo || !idAmbiente) ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center p-10 bg-white/50 rounded-[40px] border-2 border-dashed border-gray-200 animate-in fade-in duration-700">
                        <div className="relative mb-6">
                          <div className="h-20 w-20 bg-blue-50 rounded-[28px] flex items-center justify-center">
                            <Monitor className="h-10 w-10 text-[#003366] opacity-20" />
                          </div>
                          <div className="absolute -top-2 -right-2 h-8 w-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-100">
                            <span className="text-xs font-black text-[#003366]">3</span>
                          </div>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase tracking-widest">Paso 3: Asignación en Matriz</h4>
                        <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">
                          {!cursoSeleccionado 
                            ? "Seleccione primero un curso de la carga académica para comenzar." 
                            : "Configure el grupo y el ambiente en el panel izquierdo para habilitar la matriz de horarios."}
                        </p>
                        
                        <div className="mt-8 flex gap-3">
                          <div className={cn("h-2 w-8 rounded-full transition-all", cursoSeleccionado ? "bg-[#003366]" : "bg-gray-200")} />
                          <div className={cn("h-2 w-8 rounded-full transition-all", (idGrupo && idAmbiente) ? "bg-[#003366]" : "bg-gray-200")} />
                          <div className="h-2 w-8 rounded-full bg-gray-200" />
                        </div>
                      </div>
                    ) : (
                      <div className="animate-in fade-in zoom-in-95 duration-500">
                        <MatrizDisponibilidad 
                          id_periodo={parseInt(idPeriodo)}
                          id_ambiente={parseInt(idAmbiente)}
                          id_docente_actual={docenteActual.id_docente}
                          id_curso_actual={cursoSeleccionado?.id_curso}
                          id_grupo_actual={parseInt(idGrupo)}
                          tipo_clase_actual={cursoSeleccionado?.tipo_clase}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
