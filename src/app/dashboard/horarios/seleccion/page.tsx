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
import { getSocket } from "@/lib/socket-client";

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
  const { data: session } = useSession();
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
      const res = await fetch(`/api/docentes/mis-cursos?id_periodo=${idPeriodo}`);
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
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Selección de Horarios</h1>
            {tiempoRestante && (
              <div className="flex items-center space-x-2 bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 w-fit">
                <span className="text-xs font-bold uppercase">Tiempo restante:</span>
                <span className="text-sm font-mono font-bold">{tiempoRestante}</span>
              </div>
            )}
          </div>
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
                      {ambientesFiltrados.map(a => (
                        <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()}>{a.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {mostrarBotonEditar && !soloLectura ? (
                  <Button 
                    variant="outline"
                    className="w-full mt-4 border-2 border-black font-bold py-6 rounded-xl transition-all transform hover:scale-[1.02]"
                    onClick={handleActivarEdicion}
                  >
                    Editar Horario
                  </Button>
                ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full mt-4 bg-black hover:bg-gray-800 text-white font-bold py-6 rounded-xl shadow-lg transition-all transform hover:scale-[1.02]"
                        disabled={loadingConfirm || cursosProgreso.length === 0 || soloLectura}
                      >
                        {soloLectura ? "Ventana Finalizada (Solo Lectura)" : (loadingConfirm ? "Confirmando..." : "Confirmar Todo el Horario")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-white rounded-2xl border-2 sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900">¿Confirmar selección de horario?</DialogTitle>
                        <DialogDescription className="text-gray-600 text-base">
                          Al confirmar, su selección actual se volverá <span className="font-bold text-black underline">definitiva y fija</span> para todo el periodo académico. 
                          <br /><br />
                          Asegúrese de haber completado todas sus horas antes de proceder.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter className="gap-2 sm:justify-end mt-4">
                        <DialogClose asChild>
                          <Button type="button" variant="outline" className="rounded-xl border-gray-200 hover:bg-gray-50 font-semibold">
                            Revisar de nuevo
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button 
                            onClick={confirmarTodo}
                            className="bg-black hover:bg-gray-800 text-white rounded-xl font-bold px-6"
                          >
                            Sí, confirmar horario
                          </Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
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
        </div>
      </div>
    </ProteccionVentana>
  );
}
