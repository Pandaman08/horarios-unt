"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import { getSocket } from "@/lib/socket-client";
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
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

export default function SeleccionHorariosPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [idPeriodo, setIdPeriodo] = useState<string>("");
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [idAmbiente, setIdAmbiente] = useState<string>("");
  const [cursosProgreso, setCursosProgreso] = useState<any[]>([]);
  const [cursoSeleccionado, setCursoSeleccionado] = useState<{id: number, tipo: string} | null>(null);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [idGrupo, setIdGrupo] = useState<string>("");
  const [ambientesFiltrados, setAmbientesFiltrados] = useState<any[]>([]);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [soloLectura, setSoloLectura] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState<string>("");
  const [yaConfirmo, setYaConfirmo] = useState(false);
  const [modoEdicionManual, setModoEdicionManual] = useState(false);
  const [finVentana, setFinVentana] = useState<number | null>(null);

  // Redirección por rol: Esta vista es exclusiva para docentes
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.rol !== "docente") {
      // Si es admin u operador, mandarlo a su flujo de atención
      if (["administrador_sistema", "operador_horarios"].includes(session.user.rol)) {
        router.push("/dashboard/horarios/asignacion");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (session?.user && idPeriodo && idPeriodo !== "undefined") {
      fetchDocenteCursos();
      checkAccess();
    }
  }, [session, idPeriodo]);

  useEffect(() => {
    if (finVentana === null) return;

    let restantes = finVentana;

    const timer = setInterval(() => {
      if (restantes <= 0) {
        setTiempoRestante("¡Tiempo agotado!");
        setSoloLectura(true);
        clearInterval(timer);
      } else {
        const min = Math.floor(restantes / 60);
        const seg = Math.floor(restantes % 60);
        setTiempoRestante(`${min}:${seg.toString().padStart(2, '0')}`);
        restantes -= 1;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [finVentana]);

  const checkAccess = async () => {
    try {
      const res = await fetch("/api/auth/check-access");
      const data = await res.json();
      setSoloLectura(!!data.soloLectura);
      
      if (data.tieneAcceso && data.segundos_restantes !== undefined) {
        setFinVentana(data.segundos_restantes);
      }
    } catch (error) {
      console.error("Error al verificar acceso", error);
    }
  };

  useEffect(() => {
    if (cursoSeleccionado && idPeriodo && idPeriodo !== "undefined") {
      fetchGrupos();
      fetchAmbientesCurso();
    }
  }, [cursoSeleccionado, idPeriodo]);

  const fetchInitialData = async () => {
    try {
      const [pRes] = await Promise.all([
        fetch("/api/periodos"),
      ]);
      const pData = await pRes.json();
      setPeriodos(pData);
      if (pData.length > 0 && !idPeriodo) setIdPeriodo(pData[0].id_periodo.toString());
    } catch (error) {
      toast.error("Error al cargar datos");
    }
  };

  const fetchAmbientesCurso = async () => {
    if (!cursoSeleccionado) return;
    try {
      const res = await fetch(`/api/cursos/${cursoSeleccionado.id}/ambientes`);
      const data = await res.json();
      const filtrados = data
        .filter((ca: any) => ca.tipo_clase.toLowerCase() === cursoSeleccionado.tipo.toLowerCase())
        .map((ca: any) => ca.ambiente);
      
      setAmbientesFiltrados(filtrados);
      if (filtrados.length > 0) {
        setIdAmbiente(prev => {
          const exists = filtrados.find((a: any) => a.id_ambiente.toString() === prev);
          return exists ? prev : filtrados[0].id_ambiente.toString();
        });
      } else {
        setIdAmbiente("");
        toast.warning(`No hay ambientes configurados para ${cursoSeleccionado.tipo} de este curso.`);
      }
    } catch (error) {
      toast.error("Error al cargar ambientes del curso");
    }
  };

  const fetchDocenteCursos = async () => {
    if (!idPeriodo || idPeriodo === "undefined") return;
    try {
      // Si el usuario es docente, usa mis-cursos normal
      // Si es admin u operador, debemos permitir ver cursos de un docente específico si quisiéramos, 
      // pero por ahora mantenemos la lógica de docente si es que tiene id_docente vinculado.
      const url = session?.user?.rol === 'docente' 
        ? `/api/docentes/mis-cursos?id_periodo=${idPeriodo}`
        : `/api/docentes/mis-cursos?id_periodo=${idPeriodo}&id_docente=${session?.user?.id_docente}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCursosProgreso(data);
        
        // Verificar si hay alguna asignación confirmada
        const algunConfirmado = data.some((c: any) => c.confirmado);
        setYaConfirmo(algunConfirmado);

        // Al cargar, seleccionar el primer curso si no hay uno seleccionado
        if (data.length > 0 && !cursoSeleccionado) {
          setCursoSeleccionado({ id: data[0].id_curso, tipo: data[0].tipo_clase });
        }
      } else {
        setCursosProgreso([]);
        const errorData = await res.json();
        if (errorData.error !== 'Docente no encontrado') {
          toast.error(errorData.error || "Error al cargar cursos");
        }
      }
    } catch (error) {
      console.error(error);
      setCursosProgreso([]);
    }
  };

  // El botón debe mostrar "Editar" si ya hay confirmados Y no estamos en modo edición manual
  const mostrarBotonEditar = yaConfirmo && !modoEdicionManual;

  const handleActivarEdicion = () => {
    setModoEdicionManual(true);
  };

  const fetchGrupos = async () => {
    if (!cursoSeleccionado || !idPeriodo) return;
    try {
      const res = await fetch(`/api/grupos?id_curso=${cursoSeleccionado.id}&id_periodo=${idPeriodo}`);
      const data = await res.json();
      setGrupos(data);
      if (data && data.length > 0) {
        setIdGrupo(prev => {
          const exists = data.find((g: any) => g.id_grupo.toString() === prev);
          return exists ? prev : data[0].id_grupo.toString();
        });
      } else {
        setIdGrupo("");
      }
    } catch (error) {
      toast.error("Error al cargar grupos");
    }
  };

  const confirmarTodo = async () => {
    if (!session?.user?.id_docente || !idPeriodo) return;
    
    // Verificar si hay reservas temporales para este docente en este periodo
    const resCheck = await fetch(`/api/horarios/disponibilidad-matriz?id_periodo=${idPeriodo}&id_docente=${session.user.id_docente}`);
    const dataCheck = await resCheck.json();
    const misTemporales = dataCheck.temporales.filter((t: any) => t.id_docente === parseInt(session.user.id_docente));
    
    if (misTemporales.length === 0) {
      toast.warning("No tiene bloques reservados (en amarillo) para confirmar.");
      return;
    }

    // Verificar si hay cursos con progreso incompleto
    const incompletos = cursosProgreso.filter(c => c.horas_asignadas < c.horas_requeridas);
    if (incompletos.length > 0) {
      if (!confirm(`Tiene ${incompletos.length} cursos con carga horaria incompleta. ¿Desea confirmar el horario de todas formas?`)) {
        return;
      }
    }

    setLoadingConfirm(true);
    try {
      const res = await fetch("/api/horarios/confirmar-seleccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_periodo: parseInt(idPeriodo)
        })
      });

      if (res.ok) {
        toast.success("Horario confirmado con éxito. Ahora es definitivo.");
        fetchDocenteCursos();
        setYaConfirmo(true);
        setModoEdicionManual(false);
        getSocket().emit("horario-actualizado", { 
          mensaje: `El docente ${session?.user?.name} ha confirmado su horario.` 
        });
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al confirmar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setLoadingConfirm(false);
    }
  };

  // Eliminar handleConfirmarTodo redundante

  return (
    <ProteccionVentana>
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700">
        {/* Header de la Página Estilo Moderno */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mx-4 md:mx-6 mt-4 md:mt-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
              <Calendar className="h-7 w-7 text-[#1a237e]" />
            </div>
            <div>
              <span className="text-[10px] bg-indigo-50 text-[#1a237e] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg">Autogestión de Horarios</span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight mt-2">Selección de Horarios</h1>
              <div className="flex items-center gap-2 mt-1">
                {tiempoRestante ? (
                  <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-lg border border-rose-100 shadow-sm">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Tiempo restante:</span>
                    <span className="text-xs font-mono font-black">{tiempoRestante}</span>
                  </div>
                ) : (
                  <p className="text-slate-500 text-xs">Gestione su carga académica para el período lectivo actual</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-full md:w-auto">
            <div className="flex items-center gap-2 px-3">
              <Clock className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-600">Período:</span>
              <Select value={idPeriodo} onValueChange={setIdPeriodo}>
                <SelectTrigger className="w-[140px] h-9 border border-slate-200 bg-white rounded-xl shadow-sm font-bold text-xs focus:ring-2 focus:ring-[#1a237e]">
                  <SelectValue placeholder="Ciclo" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  {periodos.map(p => (
                    <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold">Ciclo {p.codigo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Área de Trabajo Central (Scrollable) */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-6 space-y-6">
            {/* Card de Usuario Docente */}
            <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center ring-4 ring-indigo-50/30 shadow-sm">
                  <User className="h-8 w-8 text-[#1a237e]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 tracking-tight leading-none mb-2">
                    {session?.user?.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center bg-emerald-50 text-emerald-700 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-100">
                      Docente UNT
                    </span>
                    {yaConfirmo && (
                      <span className="inline-flex items-center bg-indigo-50 text-indigo-700 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-indigo-100">
                        Horario Confirmado
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                {mostrarBotonEditar && !soloLectura ? (
                  <Button 
                    variant="outline"
                    onClick={handleActivarEdicion}
                    className="h-10 px-6 border border-slate-200 text-[#1a237e] hover:bg-slate-50 rounded-xl font-bold transition-all text-xs whitespace-nowrap"
                  >
                    <Settings2 className="mr-2 h-4 w-4" /> Editar Horario
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        disabled={loadingConfirm || cursosProgreso.length === 0 || soloLectura}
                        className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-xs whitespace-nowrap"
                      >
                        <CheckCircle className="mr-2 h-4 w-4" /> 
                        {soloLectura ? "Finalizada" : (loadingConfirm ? "Confirmando..." : "Confirmar Horario")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-2xl border-none shadow-2xl sm:max-w-[450px] p-8">
                      <DialogHeader className="space-y-4">
                        <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-2">
                          <CheckCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">¿Confirmar Selección?</DialogTitle>
                        <DialogDescription className="text-slate-500 font-medium text-base leading-relaxed">
                          Al confirmar, su selección actual se volverá <span className="font-bold text-emerald-600">definitiva</span>. 
                          <br /><br />
                          Asegúrese de haber completado todas sus horas antes de proceder.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-3 sm:justify-end mt-8">
                        <DialogClose asChild>
                          <Button type="button" variant="ghost" className="rounded-xl font-bold text-slate-400 hover:bg-slate-50">
                            Revisar de nuevo
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button 
                            onClick={confirmarTodo}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-8"
                          >
                            Sí, confirmar ahora
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>

            {/* Grid de Pasos 1 y 2 */}
            <div className="flex flex-col xl:flex-row gap-6 items-stretch">
              <div className="flex-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <ProgresoCursos 
                  cursos={cursosProgreso}
                  cursoSeleccionadoId={cursoSeleccionado?.id}
                  tipoSeleccionado={cursoSeleccionado?.tipo}
                  onSelectCurso={(id, tipo) => setCursoSeleccionado({id, tipo})}
                />
              </div>

              <div className="flex-1">
                {cursoSeleccionado ? (
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 h-full animate-in zoom-in-95 duration-500">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0">
                          <Settings2 className="h-4 w-4 text-[#1a237e]" />
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider truncate">Configuración de Bloque</h4>
                      </div>
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-[#1a237e] rounded-md font-bold text-[9px] uppercase tracking-tighter shrink-0">
                        Paso 2
                      </span>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Grupo</Label>
                          <Select value={idGrupo} onValueChange={setIdGrupo}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold focus:ring-2 focus:ring-indigo-100 transition-all w-full text-xs">
                              <SelectValue placeholder="Grupo" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              {grupos.map(g => (
                                <SelectItem key={g.id_grupo} value={g.id_grupo.toString()} className="font-bold">G-{g.codigo_grupo}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Ambiente</Label>
                          <Select value={idAmbiente} onValueChange={setIdAmbiente}>
                            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold focus:ring-2 focus:ring-indigo-100 transition-all w-full overflow-hidden text-xs">
                              <div className="truncate pr-2 text-left">
                                <SelectValue placeholder="Ambiente" />
                              </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl max-w-[300px]">
                              {ambientesFiltrados.map(a => (
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
                  <div className="h-full min-h-[200px] bg-white p-8 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
                    <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300">
                      <ChevronRight className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Paso 1: Seleccione un curso de la izquierda
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Paso 3: Matriz de Disponibilidad (Ancho Completo) */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm min-h-[600px] relative overflow-hidden">
              {(!idGrupo || !idAmbiente) ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-center bg-white/80 backdrop-blur-sm rounded-2xl z-10">
                  <div className="h-20 w-20 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                    <Monitor className="h-10 w-10 text-[#1a237e] opacity-20" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 tracking-tight mb-2 uppercase tracking-widest">Paso 3: Matriz de Horarios</h4>
                  <p className="text-slate-400 font-medium max-w-sm mx-auto text-sm">
                    Complete la configuración del bloque (Paso 2) para habilitar la asignación en la matriz de horarios.
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
                    id_docente_actual={session?.user?.id_docente ? parseInt(session.user.id_docente) : undefined}
                    id_curso_actual={cursoSeleccionado?.id}
                    id_grupo_actual={parseInt(idGrupo)}
                    tipo_clase_actual={cursoSeleccionado?.tipo}
                    onSelectionChange={fetchDocenteCursos}
                    soloLectura={soloLectura}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProteccionVentana>
  );
}
