"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  HelpCircle,
  MousePointer2,
  Search,
  BookOpen
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
          <Clock className="h-5 w-5 text-primary" />
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
          Esta sección es para casos manuales y excepciones. La generación automática se realiza en la página de Ventanas.
        </p>
      </div>
    </div>
  );
}

export default function AsignacionOperadorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
    if (status === "authenticated") {
      const userRol = session?.user?.rol;
      // Si es admin o operador, redirigir
      if (userRol === "administrador_sistema" || userRol === "operador_horarios") {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/docentes?search=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      const filtered = data.filter((d: any) => 
        d.nombres.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.codigo_docente.toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/periodos`);
      const data = await res.json();
      const periodosUnicos = Array.from(new Map(data.map((p: any) => [p.id_periodo, p])).values());
      setPeriodos(periodosUnicos);
      
      if (periodosUnicos.length > 0 && !idPeriodo) {
        // Priorizar el periodo activo
        const activo = periodosUnicos.find((p: any) => p.activo);
        if (activo) {
          setIdPeriodo(activo.id_periodo.toString());
        } else {
          setIdPeriodo(periodosUnicos[0].id_periodo.toString());
        }
      }
    } catch (error) {
      console.error("Error al cargar periodos:", error);
    }
  };

  const fetchDocenteCursos = async () => {
    if (!docenteActual || !idPeriodo) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/docentes/${docenteActual.id_docente}/cursos?id_periodo=${idPeriodo}`);
      const data = await res.json();
      setCursosProgreso(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar cursos del docente:", error);
      toast.error("Error al cargar cursos");
    }
  };

  const fetchAmbientesValidos = async () => {
    if (!cursoSeleccionado || !idPeriodo) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/ambientes/validos?id_docente_curso=${cursoSeleccionado.id_docente_curso}&id_periodo=${idPeriodo}`);
      const data = await res.json();
      setAmbientes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar ambientes:", error);
      toast.error("Error al cargar ambientes");
    }
  };

  const fetchGrupos = async () => {
    if (!idPeriodo) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/grupos?id_periodo=${idPeriodo}`);
      const data = await res.json();
      setGrupos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar grupos:", error);
      toast.error("Error al cargar grupos");
    }
  };

  const handleSeleccionarDocente = (docente: any) => {
    setDocenteActual(docente);
    setCursoSeleccionado(null);
    if (searchTerm) {
      setSearchTerm("");
      setSearchResults([]);
    }
  };

  const llamarSiguiente = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${apiUrl}/api/ventanas/llamar-siguiente`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_periodo: idPeriodo })
      });
    } catch (error) {
      console.error("Error al llamar siguiente:", error);
    }
  };

  const handleFinalizarAtencion = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      await fetch(`${apiUrl}/api/ventanas/finalizar-atencion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_periodo: idPeriodo })
      });
    } catch (error) {
      console.error("Error al finalizar atención:", error);
    }
    setDocenteActual(null);
    setCursoSeleccionado(null);
    setIdAmbiente("");
    setIdGrupo("");
  };

  const resetearHorario = async () => {
    if (!confirm("¿Está seguro de resetear el horario?")) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/horarios/resetear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_periodo: idPeriodo })
      });
      if (res.ok) {
        toast.success("Horario reseteado con éxito");
        handleFinalizarAtencion();
      } else {
        toast.error("Error al resetear el horario");
      }
    } catch (error) {
      console.error("Error al resetear:", error);
      toast.error("Error de conexión");
    }
  };

  const handleConfirmarAsignacion = async () => {
    if (!docenteActual || !idPeriodo) return;

    setIsConfirming(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/horarios/confirmar-seleccion`, {
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

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700 w-full overflow-x-hidden">
      {/* Header de la Página Estilo Moderno - Mejorado según mockup */}
      <header className="bg-card border-b border-border px-4 md:px-6 py-4 md:py-5 flex items-center justify-between gap-3 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 md:h-11 md:w-11 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
            <Users className="h-5 w-5 md:h-6 md:w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg md:text-xl font-black tracking-tight truncate">Atención y Correcciones Manuales</h1>
            <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">
              Resuelve excepciones y casos que no se asignaron automáticamente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-xl border border-border">
            <span className="text-xs font-medium text-muted-foreground">Periodo:</span>
            <Select value={idPeriodo} onValueChange={setIdPeriodo}>
              <SelectTrigger className="w-auto border-none bg-transparent font-bold text-primary p-0 focus:ring-0 h-auto text-sm">
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                {periodos.map((p) => (
                  <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-sm py-2">
                    {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 bg-muted/30">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
          
          {/* Columna Izquierda: Cola de Espera y Búsqueda (3/12) */}
          <div className="xl:col-span-3 flex flex-col gap-4 h-full">
            {/* Buscador */}
            <div className="bg-card rounded-2xl border border-border shadow-sm p-3 md:p-4">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar docente por nombre o código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 text-sm bg-muted/50 border-border rounded-xl focus-visible:ring-primary/20"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
              
              {searchTerm && searchResults.length > 0 && (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto border-t border-border pt-2">
                  {searchResults.map((doc) => (
                    <button
                      key={doc.id_docente}
                      onClick={() => handleSeleccionarDocente(doc)}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-muted transition-colors flex items-center gap-3 border border-transparent hover:border-primary/20"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {doc.nombres[0]}{doc.apellidos[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{doc.nombres} {doc.apellidos}</p>
                        <p className="text-xs text-muted-foreground truncate">{doc.codigo_docente}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cola de Espera */}
            <div className="flex-1 min-h-0 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
              <div className="p-4 border-b border-border bg-card/50">
                <div className="flex items-center justify-between">
                  <h2 className="font-black text-sm uppercase tracking-wider text-muted-foreground">Cola de Atención</h2>
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-black rounded-full">0</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Docentes que requieren atención manual</p>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                <ColaEspera onSeleccionarDocente={handleSeleccionarDocente} id_periodo={idPeriodo} />
              </div>
            </div>
          </div>

          {/* Columna Derecha: Matriz y Progreso (9/12) */}
          <div className="xl:col-span-9 flex flex-col gap-6 h-full">
            
            {!docenteActual ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card de Instrucciones */}
                <div className="bg-card p-6 md:p-8 rounded-2xl border border-border shadow-sm flex flex-col items-center text-center space-y-4 md:space-y-6 animate-in fade-in duration-700">
                  <div className="h-16 w-16 md:h-20 md:w-20 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                    <MousePointer2 className="h-8 w-8 md:h-10 md:w-10 text-primary opacity-20" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-foreground uppercase tracking-widest mb-2">Atención Pendiente</h3>
                    <p className="text-sm md:text-[13px] font-medium text-muted-foreground leading-relaxed max-w-[280px] mx-auto">
                      Selecciona un docente de la cola de atención o usa el buscador para iniciar la corrección manual.
                    </p>
                  </div>
                  <div className="pt-2 md:pt-4 w-full border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-[10px] md:text-xs font-black text-primary/60 uppercase tracking-tighter">
                      <Info className="h-3 w-3 md:h-4 md:w-4" /> Para generación automática ve a Ventanas
                    </div>
                  </div>
                </div>

                {/* Card de Progreso General */}
                <ProgresoGeneral id_periodo={idPeriodo} />
              </div>
            ) : (
              <div className="flex flex-col h-full gap-4 md:gap-6 animate-in slide-in-from-right-8 duration-300">
                {/* Header del Docente Seleccionado */}
                <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 md:h-14 md:w-14 bg-primary rounded-xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20">
                      {docenteActual.nombres[0]}{docenteActual.apellidos[0]}
                    </div>
                    <div>
                      <h2 className="text-lg md:text-xl font-black text-foreground">{docenteActual.nombres} {docenteActual.apellidos}</h2>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{docenteActual.codigo_docente}</span>
                         <span className="text-xs text-muted-foreground capitalize">{docenteActual.categoria} • {docenteActual.modalidad}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={handleFinalizarAtencion} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="h-4 w-4 mr-2" /> Cerrar
                  </Button>
                </div>

                {/* Tabs de Contenido */}
                <Tabs defaultValue="disponibilidad" className="flex-1 flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 bg-card border border-border rounded-xl p-1">
                    <TabsTrigger value="disponibilidad" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-sm font-bold">
                      Matriz de Disponibilidad
                    </TabsTrigger>
                    <TabsTrigger value="cursos" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-lg text-sm font-bold">
                      Cursos a Asignar
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 md:mt-6 flex-1 min-h-0">
                    <TabsContent value="disponibilidad" className="mt-0 h-full border-none p-0">
                      <MatrizDisponibilidad 
                        docente={docenteActual} 
                        id_periodo={idPeriodo} 
                      />
                    </TabsContent>
                    
                    <TabsContent value="cursos" className="mt-0 h-full border-none p-0 flex flex-col gap-4 md:gap-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 flex-1 min-h-0">
                        {/* Tarjeta de Cursos Asignados (Left) */}
                        <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
                          <div className="p-4 border-b border-border flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-primary" />
                              <h3 className="font-bold text-sm">Cursos Asignados</h3>
                            </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-2">
                            <ProgresoCursos 
                              cursos={cursosProgreso} 
                              onSelectCurso={setCursoSeleccionado} 
                              selectedId={cursoSeleccionado?.id_docente_curso} 
                            />
                          </div>
                        </div>

                        {/* Panel de Asignación (Right) */}
                        <div className="bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
                          <div className="p-4 border-b border-border">
                            <div className="flex items-center gap-2">
                              <LayoutIcon className="h-5 w-5 text-primary" />
                              <h3 className="font-bold text-sm">Detalle de Asignación</h3>
                            </div>
                          </div>
                          
                          <div className="p-4 flex-1 overflow-y-auto">
                            {cursoSeleccionado ? (
                              <div className="space-y-4">
                                {/* Info del Curso */}
                                <div className="bg-muted/30 p-3 rounded-xl">
                                  <p className="font-bold text-sm mb-1">{cursoSeleccionado.curso?.nombre}</p>
                                  <p className="text-xs text-muted-foreground">{cursoSeleccionado.curso?.codigo}</p>
                                </div>

                                {/* Selección de Grupo */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sección (Grupo)</Label>
                                  <Select value={idGrupo} onValueChange={setIdGrupo}>
                                    <SelectTrigger className="w-full h-10 border-border bg-muted/50">
                                      <SelectValue placeholder="Seleccionar grupo" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                      {grupos.map((g) => (
                                        <SelectItem key={g.id_grupo} value={g.id_grupo.toString()} className="text-sm">
                                          {g.nombre} ({g.ciclo?.nombre})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* Selección de Ambiente */}
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ambiente / Aula</Label>
                                  <Select value={idAmbiente} onValueChange={setIdAmbiente}>
                                    <SelectTrigger className="w-full h-10 border-border bg-muted/50">
                                      <SelectValue placeholder="Seleccionar ambiente" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                      {ambientes.map((a) => (
                                        <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()} className="text-sm">
                                          {a.nombre} ({a.tipo})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="pt-4 mt-4 border-t border-border">
                                  <Button 
                                    className="w-full h-10 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/10"
                                    disabled={!idGrupo || !idAmbiente}
                                    onClick={() => {
                                      toast.success("Asignación temporal registrada");
                                    }}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Guardar Asignación
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-50">
                                <HelpCircle className="h-10 w-10 mb-3" />
                                <p className="text-sm text-muted-foreground">Selecciona un curso para ver los detalles</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
                
                {/* Botón de Confirmación Final */}
                <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">Confirmar Horario</p>
                      <p className="text-xs text-muted-foreground">Finaliza la atención y guarda los cambios</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleConfirmarAsignacion} 
                    disabled={isConfirming}
                    className="h-10 px-6 font-black bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
                  >
                    {isConfirming ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Guardando...
                      </>
                    ) : (
                      "Confirmar Final"
                    )}
                  </Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
