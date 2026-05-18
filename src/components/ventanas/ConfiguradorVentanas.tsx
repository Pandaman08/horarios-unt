"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Calendar as CalendarIcon, 
  Wand2, 
  Plus, 
  Trash2, 
  Layout, 
  Clock, 
  UserCircle2, 
  ShieldCheck,
  Search,
  Loader2,
  CalendarCheck
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Ventana {
  id_ventana: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
  categoria: string;
  cantidad_docentes: number;
  completado: boolean;
}

interface Periodo {
  id_periodo: number;
  codigo: string;
}

export function ConfiguradorVentanas() {
  const [ventanas, setVentanas] = useState<Ventana[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isAutoDialogOpen, setIsAutoDialogOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [autoFormData, setAutoFormData] = useState({
    fecha_inicio: format(new Date(), "yyyy-MM-dd"),
    hora_inicio_jornada: "08:00",
    hora_fin_jornada: "18:00",
    intervalo_por_docente: "15",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPeriodo && selectedPeriodo !== "undefined" && selectedPeriodo !== "") {
      fetchVentanas();
    }
  }, [selectedPeriodo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [periodosRes, statsRes] = await Promise.all([
        fetch("/api/periodos"),
        fetch("/api/ventanas?stats=true"),
      ]);
      const periodosData = await periodosRes.json();
      const statsData = await statsRes.json();
      
      if (Array.isArray(periodosData)) {
        setPeriodos(periodosData);
        if (periodosData.length > 0 && !selectedPeriodo) {
          setSelectedPeriodo(periodosData[0].id_periodo.toString());
        }
      }
      setStats(statsData);
    } catch (error) {
      console.error("Error al cargar datos iniciales:", error);
      toast.error("Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const fetchVentanas = async () => {
    try {
      const res = await fetch(`/api/ventanas?id_periodo=${selectedPeriodo}`);
      const data = await res.json();
      setVentanas(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error("Error al cargar ventanas");
    }
  };

  const handleAutoSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodo) {
      toast.error("Seleccione un periodo primero");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/ventanas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...autoFormData,
          id_periodo: selectedPeriodo,
          programacion_automatica: true,
        }),
      });

      if (res.ok) {
        toast.success("Ventanas programadas exitosamente");
        setIsAutoDialogOpen(false);
        fetchVentanas();
      } else {
        toast.error("Error al programar ventanas");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta ventana?")) return;
    try {
      const res = await fetch(`/api/ventanas/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ventana eliminada");
        fetchVentanas();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Panel Izquierdo: Lista de Ventanas */}
        <div className="xl:col-span-3 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-6 rounded-[24px] border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <CalendarIcon className="h-5 w-5 text-[#003366]" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Filtro de Periodo</p>
                <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                  <SelectTrigger className="w-[200px] h-10 border-none bg-transparent font-black text-gray-900 p-0 focus:ring-0">
                    <SelectValue placeholder="Seleccione Periodo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                    {periodos.map((p) => (
                      <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold">
                        Ciclo {p.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]">
                  <Wand2 className="mr-2 h-4 w-4" /> Generar Programación
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] md:w-[80vw] lg:w-[800px] max-w-4xl rounded-[32px] p-10 border-none shadow-2xl overflow-y-auto max-h-[90vh] overflow-x-hidden">
                <DialogHeader className="mb-6">
                  <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                    <Wand2 className="h-6 w-6 text-[#003366]" />
                  </div>
                  <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">Asistente de Programación</DialogTitle>
                  <p className="text-sm text-gray-500 font-medium">Configure los parámetros para automatizar las ventanas de atención por jerarquía.</p>
                </DialogHeader>
                <form onSubmit={handleAutoSchedule} className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Inicio de Proceso</Label>
                    <Input
                      type="date"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold"
                      value={autoFormData.fecha_inicio}
                      onChange={(e) => setAutoFormData({ ...autoFormData, fecha_inicio: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Inicio Jornada</Label>
                      <Input
                        type="time"
                        className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold"
                        value={autoFormData.hora_inicio_jornada}
                        onChange={(e) => setAutoFormData({ ...autoFormData, hora_inicio_jornada: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Fin Jornada</Label>
                      <Input
                        type="time"
                        className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold"
                        value={autoFormData.hora_fin_jornada}
                        onChange={(e) => setAutoFormData({ ...autoFormData, hora_fin_jornada: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400 ml-1">Minutos Estimados por Docente</Label>
                    <Input
                      type="number"
                      className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold"
                      value={autoFormData.intervalo_por_docente}
                      onChange={(e) => setAutoFormData({ ...autoFormData, intervalo_por_docente: e.target.value })}
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isProcessing}
                    className="w-full h-14 bg-[#003366] hover:bg-[#002244] text-white rounded-xl font-black text-lg shadow-xl shadow-blue-900/20"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generando bloques...
                      </>
                    ) : "Confirmar y Generar"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8">Fecha</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Bloque Horario</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Segmento Docente</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Capacidad</TableHead>
                    <TableHead className="w-[100px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-10 w-10 border-4 border-blue-100 border-t-[#003366] rounded-full animate-spin" />
                          <p className="text-sm font-bold text-gray-400">Sincronizando ventanas...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : ventanas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="h-20 w-20 bg-gray-50 rounded-[32px] flex items-center justify-center mb-2">
                            <CalendarCheck className="h-10 w-10 text-gray-300" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-xl font-black text-gray-900 tracking-tight">Sin Ventanas Programadas</p>
                            <p className="text-sm text-gray-400 font-medium max-w-xs mx-auto">Utilice el botón superior para generar los bloques de atención automática para este periodo.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventanas.map((v) => (
                      <TableRow key={v.id_ventana} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <TableCell className="px-8">
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900 text-sm">{format(new Date(v.fecha), "dd 'de' MMM", { locale: es })}</span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{format(new Date(v.fecha), "yyyy")}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-white rounded-lg border border-gray-100 flex items-center justify-center shadow-sm">
                              <Clock className="h-4 w-4 text-[#003366]" />
                            </div>
                            <span className="font-bold text-gray-700">{`${v.hora_inicio} - ${v.hora_fin}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <span className={cn(
                              "inline-flex items-center px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-tighter border-none shadow-sm",
                              v.modalidad === 'nombrado' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                            )}>
                              {v.modalidad}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-tighter bg-gray-50 text-gray-600 border-none shadow-sm">
                              {v.categoria.replace("_", " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                            <UserCircle2 className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm font-black text-[#003366]">{v.cantidad_docentes}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-8">
                          <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(v.id_ventana)}
                              className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        {/* Panel Derecho: Estadísticas */}
        <div className="space-y-6">
          <div className="bg-[#003366] rounded-[32px] p-6 text-white shadow-xl shadow-blue-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-yellow-400" />
              </div>
              <h3 className="font-black text-lg tracking-tight">Control de Acceso</h3>
            </div>
            
            {stats ? (
              <div className="space-y-6">
                {Object.entries(stats).map(([modalidad, categorias]: [string, any]) => (
                  <div key={modalidad} className="space-y-3">
                    <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.2em]">{modalidad}s</p>
                    <div className="grid gap-2">
                      {Object.entries(categorias).map(([cat, count]: [string, any]) => (
                        <div key={cat} className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                          <span className="text-xs font-bold capitalize text-blue-50">{cat.replace("_", " ")}</span>
                          <span className="bg-yellow-400 text-[#003366] px-2.5 py-0.5 rounded-lg text-[10px] font-black">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center space-y-2 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <p className="text-xs font-bold">Calculando estadísticas...</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[32px] p-6 border border-gray-100 shadow-xl shadow-blue-900/5">
            <h4 className="font-black text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Estado del Sistema
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Última Actualización</p>
                <p className="text-sm font-bold text-gray-700">{format(new Date(), "PPpp", { locale: es })}</p>
              </div>
              <p className="text-[10px] text-gray-400 leading-relaxed italic">
                Las ventanas de atención regulan el acceso de los docentes al sistema de selección de horarios según su jerarquía institucional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
