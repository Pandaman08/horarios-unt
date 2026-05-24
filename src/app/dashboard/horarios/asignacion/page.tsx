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
  BarChart3,
  HelpCircle,
  MousePointer2,
  Search,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

// Componente para el progreso general solicitado por Melanie
function ProgresoGeneral({ id_periodo }: { id_periodo: string }) {
  return (
    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Progreso de Asignación</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Avance general del período</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
          <svg className="h-full w-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={213.6}
              strokeDashoffset={213.6}
              className="text-emerald-500 transition-all duration-1000"
            />
          </svg>
          <span className="absolute text-lg font-black text-foreground">0%</span>
        </div>

        <div className="space-y-1">
          <p className="text-xs font-black text-foreground">0 <span className="text-muted-foreground mx-1">/</span> 0</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase leading-tight">
            Horas asignadas <br /> de 0 totales
          </p>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full bg-muted-foreground/20 w-0" />
          </div>
        </div>
      </div>

      <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl flex items-start gap-3">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <p className="text-[10px] font-medium text-primary leading-relaxed">
          El progreso se actualiza automáticamente conforme se asignan cursos.
        </p>
      </div>
    </div>
  );
}

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
      const filtered = data.filter((d: any) => 
        d.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.codigo_docente.toLowerCase().includes(searchTerm.toLowerCase())
      );
      // Asegurar resultados únicos por ID
      const resultadosUnicos = Array.from(new Map(filtered.map((d: any) => [d.id_docente, d])).values());
      setSearchResults(resultadosUnicos);
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
    // Asegurar periodos únicos por ID
    const periodosUnicos = Array.from(new Map(data.map((p: any) => [p.id_periodo, p])).values());
    setPeriodos(periodosUnicos);
    if (periodosUnicos.length > 0) setIdPeriodo(periodosUnicos[0].id_periodo.toString());
  };

  const fetchDocenteCursos = async () => {
    if (!docenteActual || !idPeriodo) return;
    
    try {
      // Usamos la API mis-cursos con el parámetro id_docente_manual para que el operador vea el progreso real
      const res = await fetch(`/api/docentes/mis-cursos?id_periodo=${idPeriodo}&id_docente_manual=${docenteActual.id_docente}`);
      if (res.ok) {
        const data = await res.json();
        // Los cursos ya vienen únicos por curso-tipo desde la API, pero podemos asegurar por si acaso
        setCursosProgreso(data);
      } else {
        console.error("Error al cargar cursos del docente");
        setCursosProgreso([]);
      }
    } catch (error) {
      console.error("Error en fetchDocenteCursos:", error);
      setCursosProgreso([]);
    }
  };

  const fetchGrupos = async () => {
    const res = await fetch(`/api/grupos?id_curso=${cursoSeleccionado.id_curso}&id_periodo=${idPeriodo}`);
    const data = await res.json();
    // Asegurar grupos únicos por ID
    const gruposUnicos = Array.from(new Map(data.map((g: any) => [g.id_grupo, g])).values());
    setGrupos(gruposUnicos);
    if (gruposUnicos.length > 0) setIdGrupo(gruposUnicos[0].id_grupo.toString());
  };

  const fetchAmbientesValidos = async () => {
    const res = await fetch(`/api/cursos/${cursoSeleccionado.id_curso}/ambientes`);
    const data = await res.json();
    // Unificar ambientes por ID para evitar duplicados si un curso tiene el mismo ambiente para teoría y lab
    const ambientesUnicos = Array.from(new Map(data.map((ca: any) => [ca.ambiente.id_ambiente, ca.ambiente])).values());
    setAmbientes(ambientesUnicos);
    if (ambientesUnicos.length > 0) setIdAmbiente(ambientesUnicos[0].id_ambiente.toString());
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
    setSearchTerm(""); // Limpiar búsqueda al finalizar
    setSearchResults([]);
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
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700 w-full overflow-x-hidden">
      {/* Header de la Página Estilo Moderno - Mejorado según mockup */}
      <div className="bg-card p-4 md:p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mx-3 md:mx-6 mt-3 md:mt-6 mb-5">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="h-10 md:h-14 w-10 md:w-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <LayoutIcon className="h-5 md:h-7 w-5 md:w-7 text-primary" />
          </div>
          <div>
            <span className="text-[9px] md:text-[10px] bg-primary/10 text-primary uppercase tracking-wider font-extrabold px-2 py-1 rounded-lg">MÓDULO DE ATENCIÓN PRESENCIAL</span>
            <h1 className="text-lg md:text-xl md:text-2xl font-bold text-foreground tracking-tight mt-2">Atención al Docente – Operador</h1>
            <p className="text-muted-foreground text-xs mt-1">Fecha de atención: 08/06/2026 | Ventana activa: <span className="font-bold text-primary">Principal Nombrado (8:00am - 9:30am)</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 bg-destructive/10 p-3 md:p-4 rounded-2xl border border-destructive/20 w-full md:w-auto">
          <span className="text-xs md:text-sm text-foreground font-medium">Tiempo restante de ventana</span>
          <span className="font-bold text-destructive text-base md:text-lg">45 minutos</span>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Izquierdo: Cola y Búsqueda */}
        {!docenteActual && (
          <aside className="w-80 bg-card border-r border-border flex flex-col shrink-0 animate-in slide-in-from-left duration-500">
            <Tabs defaultValue="cola" className="w-full flex flex-col h-full">
              <div className="p-4 border-b border-border bg-muted/20">
                <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-xl">
                  <TabsTrigger value="cola" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Cola</TabsTrigger>
                  <TabsTrigger value="buscar" className="text-[10px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-sm transition-all">Buscar</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="cola" className="flex-1 overflow-hidden flex flex-col mt-0">
                <div className="flex-1 overflow-hidden flex flex-col">
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Nombre o código..." 
                      className="pl-10 h-10 rounded-xl border-border bg-card shadow-sm font-bold text-xs focus:ring-2 focus:ring-primary transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="divide-y divide-border bg-card rounded-2xl border border-border overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar shadow-sm">
                    {isSearching ? (
                      <div className="p-8 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">Buscando...</div>
                    ) : searchResults.length === 0 ? (
                      <div className="p-8 text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        {searchTerm ? "No se encontraron resultados" : "Ingrese un término para buscar"}
                      </div>
                    ) : (
                      searchResults.map((docente) => (
                        <div
                          key={docente.id_docente}
                          className={cn(
                            "w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors group",
                            docenteActual?.id_docente === docente.id_docente && "bg-primary/10"
                          )}
                        >
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-sm font-bold text-foreground">{docente.nombres} {docente.apellidos}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter font-mono">{docente.codigo_docente}</span>
                              <span className="w-1 h-1 rounded-full bg-border" />
                              <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">{docente.modalidad}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLlamarDocente(docente)}
                            className="text-primary hover:text-primary hover:bg-primary/10 h-8 px-3 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-transparent hover:border-primary/20 transition-all"
                          >
                            Llamar
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </aside>
        )}

        {/* Área de Trabajo Central (Scrollable) */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-background custom-scrollbar relative transition-all duration-500",
          docenteActual ? "p-0" : "min-w-0"
        )}>
          {!docenteActual ? (
            <div className="max-w-[1600px] mx-auto p-4 sm:p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Card de Instrucciones */}
                <div className="bg-card p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center space-y-6 animate-in fade-in duration-700">
                  <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                    <MousePointer2 className="h-10 w-10 text-primary opacity-20" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-foreground uppercase tracking-widest mb-2">Operación Pendiente</h3>
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                      Seleccione un docente de la cola de atención o use el buscador para iniciar el proceso de asignación.
                    </p>
                  </div>
                  <div className="pt-4 w-full border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black text-primary/60 uppercase tracking-tighter">
                      <Info className="h-3 w-3" /> Requiere selección previa
                    </div>
                  </div>
                </div>

                {/* Card de Progreso General */}
                <ProgresoGeneral id_periodo={idPeriodo} />
              </div>
            </div>
          ) : (
            <div className="max-w-[1800px] mx-auto p-4 sm:p-6 space-y-6 animate-in fade-in duration-700">
              {/* Card de Docente en Atención */}
              <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center ring-4 ring-primary/5 shadow-sm">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <span className="text-[10px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 font-bold px-2 py-0.5 rounded uppercase font-mono animate-pulse">En Atención Directa</span>
                    <h2 className="text-2xl font-bold text-foreground tracking-tight leading-none mt-2">
                      {docenteActual.nombres} {docenteActual.apellidos}
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-500/20">
                        {docenteActual.modalidad}
                      </span>
                      <span className="inline-flex items-center bg-primary/10 text-primary font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-primary/20">
                        {docenteActual.categoria.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                  <Button 
                    variant="outline" 
                    onClick={handleGenerarReporte}
                    className="h-10 px-4 rounded-xl font-bold text-primary border-border hover:bg-muted/50 transition-all text-xs"
                  >
                    <FileText className="mr-2 h-4 w-4" /> Reporte
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={handleFinalizarAtencion}
                    disabled={isConfirming}
                    className="h-10 px-4 rounded-xl font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all text-xs"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  <Button 
                    onClick={handleConfirmarAsignacion}
                    disabled={isConfirming}
                    className="h-10 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-xs whitespace-nowrap"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" /> 
                    {isConfirming ? "Confirmando..." : "Confirmar Asignación"}
                  </Button>
                </div>
              </div>

              {/* Grid de Pasos 1 y 2 */}
              <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                <div className="flex-1 bg-card p-6 rounded-2xl border border-border shadow-sm">
                  <ProgresoCursos 
                    cursos={cursosProgreso}
                    cursoSeleccionadoId={cursoSeleccionado?.id_curso}
                    tipoSeleccionado={cursoSeleccionado?.tipo_clase}
                    onSelectCurso={(id, tipo) => setCursoSeleccionado(cursosProgreso.find(c => c.id_curso === id && c.tipo_clase === tipo))}
                  />
                </div>

                <div className="flex-1">
                  {cursoSeleccionado ? (
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6 h-full animate-in zoom-in-95 duration-500">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <Settings2 className="h-4 w-4 text-primary" />
                          </div>
                          <h4 className="text-sm font-black text-foreground uppercase tracking-wider truncate">Configuración de Bloque</h4>
                        </div>
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-md font-black text-[9px] uppercase tracking-tighter shrink-0">
                          Paso 2
                        </span>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grupo</Label>
                            <Select value={idGrupo} onValueChange={setIdGrupo}>
                              <SelectTrigger className="h-12 rounded-xl border-border bg-muted/50 font-bold focus:ring-4 focus:ring-primary/10 transition-all w-full">
                                <SelectValue placeholder="Grupo" />
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border shadow-xl">
                                {grupos.map(g => (
                                  <SelectItem key={g.id_grupo} value={g.id_grupo.toString()} className="font-bold">G-{g.codigo_grupo}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ambiente</Label>
                            <Select value={idAmbiente} onValueChange={setIdAmbiente}>
                              <SelectTrigger className="h-12 rounded-xl border-border bg-muted/50 font-bold focus:ring-4 focus:ring-primary/10 transition-all w-full overflow-hidden">
                                <div className="truncate pr-2 text-left">
                                  <SelectValue placeholder="Ambiente" />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-border shadow-xl max-w-[300px]">
                                {ambientes.map(a => (
                                  <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()} className="font-bold">{a.nombre}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {idGrupo && idAmbiente && (
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 animate-in zoom-in duration-300">
                            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-tight">
                              Configuración lista. Seleccione los bloques en la matriz inferior.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[200px] bg-card p-8 rounded-[32px] border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-4">
                      <div className="h-12 w-12 bg-muted/50 rounded-2xl flex items-center justify-center text-muted-foreground">
                        <ChevronRight className="h-6 w-6" />
                      </div>
                      <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                        Paso 1: Seleccione un curso de la izquierda
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Paso 3: Matriz de Disponibilidad (Ancho Completo) */}
              <div className="bg-card p-8 rounded-[40px] border border-border shadow-xl shadow-primary/5 min-h-[600px] relative">
                {(!idGrupo || !idAmbiente) ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-card/80 backdrop-blur-sm rounded-[40px] z-10">
                    <div className="h-20 w-20 bg-primary/10 rounded-[28px] flex items-center justify-center mb-6">
                      <Monitor className="h-10 w-10 text-primary opacity-20" />
                    </div>
                    <h4 className="text-xl font-black text-foreground tracking-tight mb-2 uppercase tracking-widest">Paso 3: Matriz de Horarios</h4>
                    <p className="text-muted-foreground font-medium max-w-sm mx-auto">
                      Complete la configuración del bloque (Paso 2) para habilitar la asignación en la matriz.
                    </p>
                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                        <Calendar className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <h3 className="text-lg font-black text-foreground uppercase tracking-widest">Matriz Académica Semanal</h3>
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

        {/* Floating Help Button (As shown in image) */}
        <button className="fixed bottom-6 right-6 h-12 w-12 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-[60] animate-in zoom-in duration-1000">
          <HelpCircle className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}
