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
  Settings2,
  Calendar,
  Search,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const res = await fetch(`/api/docentes?search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSearchResults(data.filter((d: any) => 
        d.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.codigo_docente.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    } catch (error) {
      console.error("Error al buscar docentes:", error);
    } finally {
      setIsSearching(false);
    }
  };

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
    if (!docenteActual || !idPeriodo) return;
    
    // 1. Obtener cursos que el docente tiene asignados para dictar
    const resCursos = await fetch(`/api/docentes/${docenteActual.id_docente}/cursos`);
    const cursosData = await resCursos.json();
    
    // 2. Obtener lo que ya tiene asignado en el horario para este periodo
    const resHorarios = await fetch(`/api/horarios/validar?id_docente=${docenteActual.id_docente}&id_periodo=${idPeriodo}`);
    const horariosData = await resHorarios.json();
    
    const transformado = cursosData.map((dc: any) => {
      // Contar horas ya asignadas (permanentemente o temporalmente)
      const horasAsignadas = (horariosData.asignados || [])
        .filter((h: any) => h.id_curso === dc.id_curso && h.tipo_clase === dc.tipo_clase)
        .length; // Asumiendo que cada registro es 1 hora (ajustar si es diferente)

      return {
        id_curso: dc.id_curso,
        nombre: dc.curso.nombre,
        codigo: dc.curso.codigo,
        tipo_clase: dc.tipo_clase,
        horas_requeridas: dc.tipo_clase === 'teoria' ? dc.curso.horas_teoria : dc.curso.horas_laboratorio,
        horas_asignadas: horasAsignadas
      };
    });
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

  const handleGenerarReporte = async () => {
    if (!docenteActual || !idPeriodo) return;
    
    try {
      const url = `/api/reportes?tipo=docente&id=${docenteActual.id_docente}&id_periodo=${idPeriodo}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("Error al generar reporte");
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `reporte-docente-${docenteActual.codigo_docente}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Reporte generado con éxito");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el reporte");
    }
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
        {/* Sidebar Izquierdo: Cola y Búsqueda */}
        <aside className="w-80 bg-gray-50/50 border-r border-gray-100 flex flex-col shrink-0">
          <Tabs defaultValue="cola" className="w-full flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 bg-white/50">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cola" className="text-[10px] font-black uppercase tracking-widest">Cola</TabsTrigger>
                <TabsTrigger value="buscar" className="text-[10px] font-black uppercase tracking-widest">Buscar</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="cola" className="flex-1 overflow-hidden flex flex-col mt-0">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <ColaEspera 
                  id_periodo={parseInt(idPeriodo)} 
                  onLlamarDocente={handleLlamarDocente}
                  docenteActualId={docenteActual?.id_docente}
                />
              </div>
            </TabsContent>

            <TabsContent value="buscar" className="flex-1 overflow-hidden flex flex-col mt-0">
              <div className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="Nombre o código..." 
                    className="pl-10 h-10 rounded-xl border-gray-100 bg-white shadow-sm font-bold text-xs focus:ring-2 focus:ring-blue-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="divide-y divide-gray-100 bg-white rounded-2xl border border-gray-100 overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                  {isSearching ? (
                    <div className="p-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Buscando...</div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-8 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {searchTerm ? "No se encontraron resultados" : "Ingrese un término para buscar"}
                    </div>
                  ) : (
                    searchResults.map((docente) => (
                      <div
                        key={docente.id_docente}
                        className={cn(
                          "w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors",
                          docenteActual?.id_docente === docente.id_docente && "bg-blue-50"
                        )}
                      >
                        <div className="flex flex-col items-start gap-1">
                          <span className="text-sm font-black text-gray-900">{docente.nombres} {docente.apellidos}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{docente.codigo_docente}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-200" />
                            <span className="text-[9px] font-black text-[#003366] uppercase tracking-tighter">{docente.modalidad}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleLlamarDocente(docente)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 h-8 px-2 text-[10px] font-black uppercase tracking-widest"
                        >
                          Verificar
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </aside>

        {/* Área de Trabajo Central (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-gray-50/30 custom-scrollbar">
          {!docenteActual ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <div className="w-24 h-24 bg-blue-50 rounded-[40px] flex items-center justify-center mb-6 animate-bounce duration-[3000ms]">
                <Users className="h-10 w-10 text-[#003366] opacity-20" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Esperando Operación</h3>
              <p className="text-gray-400 font-medium max-w-sm">Seleccione un docente de la cola lateral para iniciar el proceso de asignación de horarios.</p>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto p-6 space-y-6">
              {/* Card de Docente en Atención */}
              <div className="p-6 bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center ring-4 ring-blue-50/50">
                    <User className="h-8 w-8 text-[#003366]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-2">
                      {docenteActual.nombres} {docenteActual.apellidos}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                        {docenteActual.modalidad}
                      </span>
                      <span className="inline-flex items-center bg-blue-50 text-blue-700 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                        {docenteActual.categoria.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                  <Button 
                    variant="outline" 
                    onClick={handleGenerarReporte}
                    className="h-10 px-4 rounded-xl font-bold text-blue-600 border-blue-100 hover:bg-blue-50 transition-all text-xs"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Reporte
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleFinalizarAtencion}
                    disabled={isConfirming}
                    className="h-10 px-4 rounded-xl font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all text-xs"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmarAsignacion}
                    disabled={isConfirming}
                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-lg shadow-emerald-900/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-xs whitespace-nowrap"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> 
                    {isConfirming ? "Confirmando..." : "Confirmar Asignación"}
                  </Button>
                </div>
              </div>

              {/* Grid de Pasos 1 y 2 */}
              <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                <div className="flex-1 bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5">
                  <ProgresoCursos 
                    cursos={cursosProgreso}
                    cursoSeleccionadoId={cursoSeleccionado?.id_curso}
                    tipoSeleccionado={cursoSeleccionado?.tipo_clase}
                    onSelectCurso={(id, tipo) => setCursoSeleccionado(cursosProgreso.find(c => c.id_curso === id && c.tipo_clase === tipo))}
                  />
                </div>

                <div className="flex-1">
                  {cursoSeleccionado ? (
                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 space-y-6 h-full animate-in zoom-in-95 duration-500">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Settings2 className="h-4 w-4 text-[#003366]" />
                          </div>
                          <h4 className="text-sm font-black text-gray-900 uppercase tracking-wider truncate">Configuración de Bloque</h4>
                        </div>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-[#003366] rounded-md font-black text-[9px] uppercase tracking-tighter shrink-0">
                          Paso 2
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Grupo</Label>
                            <Select value={idGrupo} onValueChange={setIdGrupo}>
                              <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold focus:ring-4 focus:ring-blue-100 transition-all w-full">
                                <SelectValue placeholder="Grupo" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                                {grupos.map(g => (
                                  <SelectItem key={g.id_grupo} value={g.id_grupo.toString()} className="font-bold">G-{g.codigo_grupo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Ambiente</Label>
                            <Select value={idAmbiente} onValueChange={setIdAmbiente}>
                              <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50/50 font-bold focus:ring-4 focus:ring-blue-100 transition-all w-full overflow-hidden">
                                <div className="truncate pr-2 text-left">
                                  <SelectValue placeholder="Ambiente" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-gray-100 shadow-xl max-w-[300px]">
                                {ambientes.map(a => (
                                  <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()} className="font-bold">{a.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {idGrupo && idAmbiente && (
                          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
                            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-tight">
                              Configuración lista. Seleccione los bloques en la matriz inferior.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[200px] bg-white p-8 rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider">
                        Paso 1: Seleccione un curso de la izquierda
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Paso 3: Matriz de Disponibilidad (Ancho Completo) */}
              <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-xl shadow-blue-900/5 min-h-[600px] relative">
                {(!idGrupo || !idAmbiente) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-white/80 backdrop-blur-sm rounded-[40px] z-10">
                    <div className="h-20 w-20 bg-blue-50 rounded-[28px] flex items-center justify-center mb-6">
                      <Monitor className="h-10 w-10 text-[#003366] opacity-20" />
                    </div>
                    <h4 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase tracking-widest">Paso 3: Matriz de Horarios</h4>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto">
                      Complete la configuración del bloque (Paso 2) para habilitar la asignación en la matriz.
                    </p>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 bg-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Matriz Académica Semanal</h3>
                    </div>
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
          )}
        </main>
      </div>
    </div>
  );
}
