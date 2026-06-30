"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MatrizDisponibilidad } from "@/components/horarios/MatrizDisponibilidad";
import { ProgresoCursos } from "@/components/horarios/ProgresoCursos";
import { Card, CardContent } from "@/components/ui/card";
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
import { getSocket } from "@/lib/socket-client";
import { 
  User, 
  CheckCircle, 
  Info,
  Clock,
  Layout as LayoutIcon,
  Calendar,
  BookOpen
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

const ESTADOS_LECTIVA_DECLARADA = [
  "LECTIVA_CONFIRMADA",
  "ENVIADO",
  "VALIDADO_DEPARTAMENTO",
  "APROBADO",
  "RECHAZADO",
] as const;

function esLectivaDeclarada(estado?: string | null) {
  return !!estado && ESTADOS_LECTIVA_DECLARADA.includes(estado as (typeof ESTADOS_LECTIVA_DECLARADA)[number]);
}

export default function SeleccionHorariosLectivosPage() {
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
  const [hayHorariosGenerados, setHayHorariosGenerados] = useState(false);
  const [horariosGenerados, setHorariosGenerados] = useState<any[]>([]);
  const [mensajeIntervalo, setMensajeIntervalo] = useState<string>("");
  const [declaracion, setDeclaracion] = useState<any>(null);
  
  // Timer simple - solo para visualización
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const checkAccessIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const segundosRestantesRef = useRef<number>(0);

  // Redirección por rol
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && !["docente", "decano", "director_departamento"].includes(session?.user?.rol)) {
      if (["administrador_sistema", "operador_horarios"].includes(session.user.rol)) {
        router.push("/dashboard/horarios/asignacion");
      } else {
        router.push("/dashboard");
      }
    }
  }, [session, status, router]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (session?.user && idPeriodo && idPeriodo !== "undefined") {
      fetchDeclaracion();
      fetchDocenteCursos();
      verificarHorariosGenerados();
      
      if (!timerIntervalRef.current) {
        checkAccessOnce();
      }
      if (!checkAccessIntervalRef.current) {
        checkAccessIntervalRef.current = setInterval(checkAccessOnce, 30000);
      }
    }
  }, [session, idPeriodo]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (checkAccessIntervalRef.current) {
        clearInterval(checkAccessIntervalRef.current);
      }
    };
  }, []);

  const checkAccessOnce = async () => {
    try {
      const res = await fetch("/api/horarios/check-interval");
      const data = await res.json();
      
      console.log('🔐 [CHECK-INTERVAL] Respuesta del servidor:', {
        soloLectura: data.soloLectura,
        mensaje: data.mensaje,
        esMiTurno: data.esMiTurno,
        dentroDeHorario: data.dentroDeHorario,
        segundos_restantes: data.segundos_restantes,
        status: res.status
      });
      
      if (data.soloLectura !== undefined && !esLectivaDeclarada(declaracion?.estado)) {
        setSoloLectura(!!data.soloLectura);
        console.log('📝 [CHECK-INTERVAL] soloLectura actualizado a:', !!data.soloLectura);
      }
      if (data.mensaje) {
        setMensajeIntervalo(data.mensaje);
        console.log('📝 [CHECK-INTERVAL] mensaje actualizado a:', data.mensaje);
      }
      
      let segundosRestantes = null;
      if (data.segundos_restantes !== undefined && data.segundos_restantes !== null) {
        segundosRestantes = data.segundos_restantes;
        console.log('⏱️  [CHECK-INTERVAL] Segundos restantes del servidor:', segundosRestantes);
      } else {
        const intervaloStr = localStorage.getItem('intervalo_horarios');
        if (intervaloStr) {
          const intervaloData = JSON.parse(intervaloStr);
          const fechaFin = new Date(intervaloData.fecha_fin_intervalo);
          const ahora = new Date();
          segundosRestantes = Math.max(0, Math.floor((fechaFin.getTime() - ahora.getTime()) / 1000));
          console.log('⏱️  [CHECK-INTERVAL] Segundos restantes desde localStorage:', segundosRestantes);
        }
      }
      
      if (segundosRestantes !== null && segundosRestantes > 0) {
        segundosRestantesRef.current = segundosRestantes;
        const min = Math.floor(segundosRestantes / 60);
        const seg = Math.floor(segundosRestantes % 60);
        setTiempoRestante(`${min}:${seg.toString().padStart(2, '0')}`);
        console.log('⏱️  [CHECK-INTERVAL] Timer iniciado:', `${min}:${seg.toString().padStart(2, '0')}`);
        
        timerIntervalRef.current = setInterval(() => {
          segundosRestantesRef.current -= 1;
          if (segundosRestantesRef.current <= 0) {
            console.log('⏱️  [TIMER] Tiempo agotado!');
            setTiempoRestante("¡Tiempo agotado!");
            setSoloLectura(true);
            if (timerIntervalRef.current) {
              clearInterval(timerIntervalRef.current);
              timerIntervalRef.current = null;
            }
          } else {
            const min = Math.floor(segundosRestantesRef.current / 60);
            const seg = Math.floor(segundosRestantesRef.current % 60);
            setTiempoRestante(`${min}:${seg.toString().padStart(2, '0')}`);
          }
        }, 1000);
      } else if (segundosRestantes === 0) {
        console.log('⏱️  [CHECK-INTERVAL] Tiempo ya agotado');
        setTiempoRestante("¡Tiempo agotado!");
      }
    } catch (error) {
      console.error("❌ [CHECK-INTERVAL] Error al verificar acceso", error);
    }
  };

  const fetchInitialData = async () => {
    try {
      const [pRes] = await Promise.all([fetch("/api/periodos")]);
      const pData = await pRes.json();
      const periodosActivos = pData.filter((p: any) => p.activo === true);
      setPeriodos(periodosActivos);
      if (periodosActivos.length > 0 && !idPeriodo) {
        setIdPeriodo(periodosActivos[0].id_periodo.toString());
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    }
  };

  const fetchDeclaracion = async () => {
    if (!session?.user?.id_docente || !idPeriodo) return;
    try {
      const res = await fetch(`/api/declaracion-horaria?idDocente=${session.user.id_docente}&idPeriodo=${idPeriodo}`);
      if (res.ok) {
        const data = await res.json();
        console.log('📋 [DECLARACION] Estado actual de la declaración:', {
          estado: data?.estado,
          id_docente: data?.id_docente,
          id_periodo: data?.id_periodo
        });
        setDeclaracion(data);
        if (esLectivaDeclarada(data?.estado)) {
          console.log('✅ [DECLARACION] Carga lectiva ya confirmada — modo solo lectura');
          setSoloLectura(true);
          setYaConfirmo(true);
        }
      } else {
        console.warn('⚠️  [DECLARACION] No se pudo obtener la declaración, status:', res.status);
      }
    } catch (error) {
      console.error("❌ [DECLARACION] Error al obtener declaración", error);
    }
  };

  const verificarHorariosGenerados = async () => {
    if (!session?.user?.id_docente || !idPeriodo) return;
    try {
      const resConfirmados = await fetch(`/api/docentes/horarios?periodoId=${idPeriodo}`);
      let horariosConfirmados: any[] = [];
      if (resConfirmados.ok) {
        const data = await resConfirmados.json();
        horariosConfirmados = Array.isArray(data) ? data : (data.horarios ?? []);
      }
      
      const resTemporales = await fetch(`/api/horarios/disponibilidad-matriz?id_periodo=${idPeriodo}&id_docente=${session.user.id_docente}`);
      let horariosTemporales: any[] = [];
      if (resTemporales.ok) {
        const dataTemp = await resTemporales.json();
        horariosTemporales = dataTemp.temporales || [];
      }
      
      const todosHorarios = [...horariosConfirmados, ...horariosTemporales];
      setHorariosGenerados(todosHorarios);
      setHayHorariosGenerados(todosHorarios.length > 0);
      
      const hayConfirmados = horariosConfirmados.length > 0;
      const hayTemporales = horariosTemporales.length > 0;
      
      console.log('📊 [HORARIOS] Verificación de horarios generados:', {
        horariosConfirmados: horariosConfirmados.length,
        horariosTemporales: horariosTemporales.length,
        total: todosHorarios.length,
        hayConfirmados,
        hayTemporales,
        estadoDeclaracion: declaracion?.estado
      });
      
      // yaConfirmo solo debe ser true si:
      // 1. La declaración está en estado LECTIVA_CONFIRMADA o superior
      // 2. O si ya hay horarios confirmados y NO hay temporales (significa que ya pasó por confirmación)
      const yaConfirmoActual =
        esLectivaDeclarada(declaracion?.estado) ||
        (hayConfirmados && !hayTemporales);
      
      setYaConfirmo(yaConfirmoActual);
      console.log('✅ [HORARIOS] yaConfirmo actualizado a:', yaConfirmoActual);
    } catch (error) {
      console.error("❌ [HORARIOS] Error al verificar horarios generados", error);
    }
  };

  const fetchAmbientesCurso = async () => {
    if (!cursoSeleccionado) return;
    try {
      const res = await fetch("/api/ambientes");
      const todosAmbientes = await res.json();
      let filtrados = todosAmbientes.filter((a: any) => a.activo === true);
      setAmbientesFiltrados(filtrados);
      if (filtrados.length > 0) {
        setIdAmbiente(prev => {
          const exists = filtrados.find((a: any) => a.id_ambiente.toString() === prev);
          return exists ? prev : filtrados[0].id_ambiente.toString();
        });
      } else {
        setIdAmbiente("");
        toast.warning("No hay ambientes disponibles.");
      }
    } catch (error) {
      toast.error("Error al cargar ambientes");
    }
  };

  const fetchDocenteCursos = async () => {
    if (!idPeriodo || idPeriodo === "undefined") return;
    try {
      const url = session?.user?.rol === 'docente' 
        ? `/api/docentes/mis-cursos?id_periodo=${idPeriodo}`
        : `/api/docentes/mis-cursos?id_periodo=${idPeriodo}&id_docente=${session?.user?.id_docente}`;

      console.log('📚 [CURSOS] Obteniendo cursos desde:', url);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const cursos = Array.isArray(data) ? data : [];
        console.log('📚 [CURSOS] Cursos obtenidos:', {
          cantidad: cursos.length,
          cursos: cursos.map(c => ({
            id_curso: c.id_curso,
            nombre: c.nombre,
            tipo_clase: c.tipo_clase,
            horas_asignadas: c.horas_asignadas,
            horas_requeridas: c.horas_requeridas
          }))
        });
        setCursosProgreso(cursos);
        if (cursos.length > 0 && !cursoSeleccionado) {
          setCursoSeleccionado({ id: cursos[0].id_curso, tipo: cursos[0].tipo_clase });
          console.log('📚 [CURSOS] Primer curso seleccionado automáticamente:', {
            id: cursos[0].id_curso,
            tipo: cursos[0].tipo_clase
          });
        }
      } else {
        console.warn('⚠️  [CURSOS] Error en respuesta, status:', res.status);
        setCursosProgreso([]);
        if (res.status !== 404 && res.status !== 400) {
          const errorData = await res.json().catch(() => ({}));
          console.error('❌ [CURSOS] Error del servidor:', errorData.error);
          toast.error(errorData.error || "Error al cargar cursos");
        }
      }
    } catch (error) {
      console.error("❌ [CURSOS] Error al cargar cursos del docente", error);
      toast.error("Error al cargar cursos del docente");
      setCursosProgreso([]);
    }
  };

  const fetchGrupos = async () => {
    if (!cursoSeleccionado || !idPeriodo || !session?.user?.id_docente) return;
    try {
      const params = new URLSearchParams({
        id_periodo: idPeriodo,
        id_curso: cursoSeleccionado.id.toString(),
        tipo_clase: cursoSeleccionado.tipo,
      });
      const res = await fetch(`/api/docentes/mis-grupos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const lista = data.grupos || [];
        setGrupos(lista);
        if (lista.length > 0) {
          setIdGrupo(lista[0].id_grupo.toString());
        } else {
          setIdGrupo("");
        }
      }
    } catch (error) {
      toast.error("Error al cargar grupos");
    }
  };

  useEffect(() => {
    if (cursoSeleccionado && idPeriodo && idPeriodo !== "undefined") {
      fetchGrupos();
      fetchAmbientesCurso();
    }
  }, [cursoSeleccionado, idPeriodo]);

  useEffect(() => {
    const restaurarConfiguracionDesdeHorarios = async () => {
      if (
        !yaConfirmo ||
        !session?.user?.id_docente ||
        !idPeriodo ||
        !cursoSeleccionado
      ) {
        return;
      }

      try {
        const res = await fetch(`/api/docentes/horarios?periodoId=${idPeriodo}`);
        if (!res.ok) return;

        const data = await res.json();
        const horarios = Array.isArray(data) ? data : (data.horarios ?? []);
        const delCurso = horarios.filter(
          (h: { is_no_lectiva?: boolean; id_curso?: number; tipo_clase?: string; id_grupo?: number | null; id_ambiente?: number | null }) =>
            !h.is_no_lectiva &&
            h.id_curso === cursoSeleccionado.id &&
            h.tipo_clase?.toLowerCase() === cursoSeleccionado.tipo?.toLowerCase(),
        );

        if (delCurso.length === 0) return;

        const primerHorario = delCurso[0];
        if (primerHorario.id_grupo) {
          setIdGrupo(primerHorario.id_grupo.toString());
        }
        if (primerHorario.id_ambiente) {
          setIdAmbiente(primerHorario.id_ambiente.toString());
        }
      } catch (error) {
        console.error("Error al restaurar configuración de horarios", error);
      }
    };

    void restaurarConfiguracionDesdeHorarios();
  }, [yaConfirmo, cursoSeleccionado, idPeriodo, session?.user?.id_docente]);

  const confirmarHorariosLectivos = async () => {
    if (!session?.user?.id_docente || !idPeriodo) return;
    
    console.log('🔄 [CONFIRMACION] Iniciando confirmación de horarios lectivos...');
    
    const resCheck = await fetch(`/api/horarios/disponibilidad-matriz?id_periodo=${idPeriodo}&id_docente=${session.user.id_docente}`);
    const dataCheck = await resCheck.json();
    const misTemporales = dataCheck.temporales.filter(
      (t: any) => t.id_docente === Number(session.user.id_docente ?? 0)
    );
    
    console.log('🔄 [CONFIRMACION] Verificación previa:', {
      horariosTemporalesDelDocente: misTemporales.length,
      hayHorariosGenerados
    });
    
    if (misTemporales.length === 0 && !hayHorariosGenerados) {
      console.warn('⚠️  [CONFIRMACION] No hay horarios temporales para confirmar');
      toast.warning("Primero debe seleccionar bloques en la matriz (aparecerán en amarillo) antes de confirmar.");
      return;
    }

    const incompletos = cursosProgreso.filter(c => c.horas_asignadas < c.horas_requeridas);
    if (incompletos.length > 0 && !hayHorariosGenerados) {
      console.warn('⚠️  [CONFIRMACION] Hay cursos incompletos:', incompletos.length);
      if (!confirm(`Tiene ${incompletos.length} cursos con carga horaria incompleta. ¿Desea confirmar el horario de todas formas?`)) {
        console.log('❌ [CONFIRMACION] Usuario canceló la confirmación con cursos incompletos');
        return;
      }
    }

    setLoadingConfirm(true);
    try {
      console.log('📤 [CONFIRMACION] Enviando solicitud al servidor...');
      const res = await fetch("/api/horarios/confirmar-seleccion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_periodo: parseInt(idPeriodo),
          solo_lectiva: true // Indicar que solo se confirman horarios lectivos
        })
      });

      if (res.ok) {
        console.log('✅ [CONFIRMACION] Horarios lectivos confirmados exitosamente');
        toast.success("Horarios lectivos confirmados. Continúe con su carga no lectiva.");
        
        setYaConfirmo(true);
        setSoloLectura(true);
        
        getSocket().emit("horario-actualizado", { 
          mensaje: `El docente ${session?.user?.name} ha confirmado sus horarios lectivos.` 
        });

        router.replace('/dashboard/carga-horaria');
      } else {
        const data = await res.json();
        console.error('❌ [CONFIRMACION] Error en respuesta del servidor:', data);
        toast.error(data.error || "Error al confirmar horarios lectivos");
      }
    } catch (error) {
      console.error("❌ [CONFIRMACION] Error de conexión", error);
      toast.error("Error de conexión");
    } finally {
      setLoadingConfirm(false);
    }
  };

  // Log de estado antes del renderizado
  console.log('📊 [RENDER] Estado del componente:', {
    soloLectura,
    yaConfirmo,
    cursosProgreso: cursosProgreso.length,
    cursoSeleccionado,
    idGrupo,
    idAmbiente,
    declaracionEstado: declaracion?.estado,
    hayHorariosGenerados,
    tiempoRestante
  });

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden animate-in fade-in duration-700">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mx-4 md:mx-6 mt-4 md:mt-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="h-14 w-14 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div>
              <span className={cn(
                "text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg",
                soloLectura && yaConfirmo
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary",
              )}>
                {soloLectura && yaConfirmo ? "Solo lectura" : "Paso 1/2"}
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight mt-2">
                Selección de Horarios Lectivos
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {mensajeIntervalo ? (
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border shadow-sm ${
                    soloLectura 
                      ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800' 
                      : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{mensajeIntervalo}</span>
                    {tiempoRestante && !soloLectura && (
                      <span className="text-xs font-mono font-black ml-2">{tiempoRestante}</span>
                    )}
                  </div>
                ) : tiempoRestante ? (
                  <div className="flex items-center gap-2 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 px-3 py-1 rounded-lg border border-rose-200 dark:border-rose-800 shadow-sm">
                    <Clock className="h-3.5 w-3.5 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Tiempo restante:</span>
                    <span className="text-xs font-mono font-black">{tiempoRestante}</span>
                  </div>
                ) : soloLectura && yaConfirmo ? (
                  <p className="text-muted-foreground text-xs">
                    Consulta de horarios lectivos confirmados (solo lectura)
                  </p>
                ) : (
                  <p className="text-muted-foreground text-xs">Seleccione los bloques horarios para sus cursos</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-muted/30 p-3 rounded-2xl border border-border w-full md:w-auto">
            <div className="flex items-center gap-2 px-3">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold text-muted-foreground">Período Lectivo:</span>
              <span className="text-sm font-black text-primary bg-primary/10 px-3 py-1 rounded-lg border border-primary/20">
                {periodos.find(p => p.id_periodo.toString() === idPeriodo)?.nombre || "Cargando..."}
              </span>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto p-6 space-y-6">
            
            {/* Panel de información del docente */}
            <div className="p-6 bg-card rounded-2xl border border-border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center ring-4 ring-primary/30 shadow-sm">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground tracking-tight leading-none mb-2">
                    {session?.user?.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      Docente UNT
                    </span>
                    {yaConfirmo && (
                      <span className="inline-flex items-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        Horario Confirmado
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      disabled={loadingConfirm || soloLectura}
                      className="h-10 px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/10 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 text-xs whitespace-nowrap"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" /> 
                      {soloLectura ? "Finalizada" : (loadingConfirm ? "Confirmando..." : "Confirmar Horarios Lectivos")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card rounded-2xl border-border shadow-2xl sm:max-w-[450px] p-8">
                    <DialogHeader className="space-y-4">
                      <div className="h-12 w-12 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center mb-2">
                        <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">¿Confirmar Horarios Lectivos?</DialogTitle>
                      <DialogDescription className="text-muted-foreground font-medium text-base leading-relaxed">
                        Al confirmar, tu horario lectivo se volverá <span className="font-bold text-emerald-600 dark:text-emerald-400">definitivo</span> y podrás continuar con la declaración de tu carga no lectiva.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-3 sm:justify-end mt-8">
                      <DialogClose asChild>
                        <Button type="button" variant="ghost" className="rounded-xl font-bold text-muted-foreground hover:bg-muted">
                          Revisar de nuevo
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button 
                          onClick={confirmarHorariosLectivos}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold px-8"
                        >
                          Sí, confirmar ahora
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Panel de selección de horarios */}
            <div className="flex flex-col lg:flex-row gap-4 lg:gap-5 items-start">
              {/* Panel lateral fijo */}
              <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 lg:sticky lg:top-4 space-y-3">
                <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
                  <ProgresoCursos
                    cursos={cursosProgreso}
                    onSelectCurso={(id, tipo) => setCursoSeleccionado({ id, tipo })}
                    cursoSeleccionadoId={cursoSeleccionado?.id}
                    tipoSeleccionado={cursoSeleccionado?.tipo}
                  />
                </div>

                {(cursoSeleccionado && (grupos.length > 0 || ambientesFiltrados.length > 0)) && (
                  <div className="rounded-2xl border border-border bg-card shadow-sm p-4 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Configuración del bloque
                    </p>
                    {grupos.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground">
                          Grupo
                          {cursoSeleccionado.tipo === "laboratorio" && grupos.length > 1 && (
                            <span className="text-muted-foreground font-normal"> — asigne horario a cada lab</span>
                          )}
                        </Label>
                        <Select value={idGrupo} onValueChange={setIdGrupo} disabled={soloLectura}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Seleccionar grupo" />
                          </SelectTrigger>
                          <SelectContent>
                            {grupos.map((g) => (
                              <SelectItem key={g.id_grupo} value={g.id_grupo.toString()}>
                                {g.codigo_grupo || `Grupo ${g.id_grupo}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {ambientesFiltrados.length > 0 && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold text-muted-foreground">Ambiente</Label>
                        <Select value={idAmbiente} onValueChange={setIdAmbiente} disabled={soloLectura}>
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Seleccionar ambiente" />
                          </SelectTrigger>
                          <SelectContent>
                            {ambientesFiltrados.map((a) => (
                              <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()}>
                                {a.codigo} — {a.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}
              </aside>

              {/* Matriz principal */}
              <div className="flex-1 min-w-0 w-full">
                {cursosProgreso.length === 0 ? (
                  soloLectura ? (
                    // Acceso restringido - sin matriz
                    <Card className="p-8 border-dashed border-rose-200 bg-rose-50/30">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-rose-800">
                            Acceso Restringido
                          </p>
                          <p className="text-xs text-rose-700 mt-1">
                            {mensajeIntervalo 
                              ? `${mensajeIntervalo} Si crees que esto es un error, contacta a la secretaría académica.`
                              : "Fuera de tu ventana de atención. Contacta a la secretaría académica si necesitas apoyo."
                            }
                          </p>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    // Acceso permitido pero sin cursos asignados
                    <Card className="p-8 border-dashed border-amber-200 bg-amber-50/30">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-amber-800">
                            Sin cursos asignados para este período
                          </p>
                          <p className="text-xs text-amber-700 mt-1">
                            No tienes <strong>cargas lectivas asignadas</strong> para este período académico. 
                            {' '}<strong>Contacta con la secretaría académica</strong> para que asigne tus cursos antes de continuar con la selección de horarios.
                          </p>
                        </div>
                      </div>
                    </Card>
                  )
                ) : cursoSeleccionado && idGrupo && idAmbiente && session?.user?.id_docente ? (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/40 border border-border text-xs">
                      <span className="font-semibold text-foreground">
                        {cursosProgreso.find(
                          (c) => c.id_curso === cursoSeleccionado.id && c.tipo_clase === cursoSeleccionado.tipo
                        )?.nombre || "Curso seleccionado"}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground capitalize">{cursoSeleccionado.tipo}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        Grupo {grupos.find((g) => g.id_grupo.toString() === idGrupo)?.codigo_grupo || idGrupo}
                      </span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">
                        {ambientesFiltrados.find((a) => a.id_ambiente.toString() === idAmbiente)?.codigo}
                      </span>
                    </div>
                    <MatrizDisponibilidad
                      id_periodo={parseInt(idPeriodo)}
                      id_ambiente={parseInt(idAmbiente)}
                      id_docente_actual={session.user.id_docente}
                      id_curso_actual={cursoSeleccionado.id}
                      id_grupo_actual={parseInt(idGrupo)}
                      tipo_clase_actual={cursoSeleccionado.tipo}
                      soloLectura={soloLectura}
                      onSelectionChange={() => {
                        console.log('🔄 [MATRIZ] Selección cambió, refrescando datos...');
                        fetchDocenteCursos();
                        verificarHorariosGenerados();
                      }}
                    />
                  </div>
                ) : (
                  <Card className="p-10 border-dashed border-border bg-muted/20">
                    <div className="text-center space-y-2 max-w-sm mx-auto">
                      <LayoutIcon className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                      <p className="text-sm font-semibold text-foreground">
                        Seleccione un curso de la lista
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Luego elija grupo y ambiente. Haga clic en la matriz para reservar bloques en amarillo.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
}