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
  Trash2, 
  Clock, 
  ShieldCheck,
  Loader2,
  CalendarCheck,
  RefreshCw,
  Search,
  Plus
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <CalendarIcon className="h-6 w-6 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-slate-800 tracking-tight">Ventanas de Atención</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Programación de Turnos para Autogestión</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-slate-50/50 px-4 h-11 rounded-xl border border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo Activo</span>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-[110px] h-8 border-none bg-transparent font-black text-[#1a237e] p-0 focus:ring-0 text-[13px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                {periodos.map((p) => (
                  <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-[13px] py-2 focus:bg-indigo-50 focus:text-[#1a237e]">Ciclo {p.codigo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 bg-[#1a237e] hover:bg-[#0d145a] text-white rounded-xl px-6 font-bold text-[13px] shadow-lg shadow-indigo-100 transition-all active:scale-95">
                <Wand2 className="mr-2 h-4 w-4" /> Generar Programación
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-xl rounded-2xl p-0 border-none shadow-2xl overflow-hidden bg-white">
              <div className="bg-[#1a237e] p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <Wand2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-[22px] font-black text-white tracking-tight">Asistente de Turnos</DialogTitle>
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">Generación automática de ventanas de atención</p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleAutoSchedule} className="p-8 space-y-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Fecha de Inicio</Label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        type="date" 
                        className="h-12 pl-11 rounded-xl border-slate-200 font-bold text-[15px] focus:ring-indigo-100" 
                        value={autoFormData.fecha_inicio} 
                        onChange={(e) => setAutoFormData({ ...autoFormData, fecha_inicio: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Minutos por Docente</Label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input 
                        type="number" 
                        className="h-12 pl-11 rounded-xl border-slate-200 font-bold text-[15px] focus:ring-indigo-100" 
                        value={autoFormData.intervalo_por_docente} 
                        onChange={(e) => setAutoFormData({ ...autoFormData, intervalo_por_docente: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Inicio de Jornada</Label>
                    <Input 
                      type="time" 
                      className="h-12 rounded-xl border-slate-200 font-bold text-[15px] focus:ring-indigo-100" 
                      value={autoFormData.hora_inicio_jornada} 
                      onChange={(e) => setAutoFormData({ ...autoFormData, hora_inicio_jornada: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Fin de Jornada</Label>
                    <Input 
                      type="time" 
                      className="h-12 rounded-xl border-slate-200 font-bold text-[15px] focus:ring-indigo-100" 
                      value={autoFormData.hora_fin_jornada} 
                      onChange={(e) => setAutoFormData({ ...autoFormData, hora_fin_jornada: e.target.value })} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-50">
                  <Button type="button" variant="ghost" onClick={() => setIsAutoDialogOpen(false)} className="h-12 rounded-xl font-bold text-slate-500 px-8 text-[14px] hover:bg-slate-50 transition-colors">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isProcessing} className="h-12 bg-[#1a237e] hover:bg-[#0d145a] text-white rounded-xl px-10 font-black text-[14px] shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wand2 className="h-4 w-4 mr-2" />}
                    {isProcessing ? "Procesando..." : "Iniciar Generación"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Fecha Programada</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Franja Horaria</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Filtros de Acceso</TableHead>
                    <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4 text-center">Cupos</TableHead>
                    <TableHead className="w-[100px] text-right text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="h-10 w-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                          <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando Calendario...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : ventanas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <CalendarIcon className="h-12 w-12 text-slate-400" />
                          <p className="text-[15px] font-bold text-slate-500">No hay ventanas programadas</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    ventanas.map((v) => (
                      <TableRow key={v.id_ventana} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-[#1a237e]">
                              <CalendarCheck className="h-4 w-4" />
                            </div>
                            <span className="font-bold text-slate-800 text-[13px] uppercase">
                              {format(new Date(v.fecha), "EEEE dd 'de' MMMM", { locale: es })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2.5 text-[13px] font-bold text-slate-500 font-mono">
                            <Clock className="h-3.5 w-3.5 text-slate-300" />
                            <span>{v.hora_inicio} - {v.hora_fin}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-wider border border-indigo-100 shadow-sm">{v.modalidad}</span>
                            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-wider border border-slate-100 shadow-sm">{v.categoria}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 border border-slate-100 text-[13px] font-black text-slate-800">
                            {v.cantidad_docentes}
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDelete(v.id_ventana)} 
                              title="Eliminar Turno" 
                              className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-400 transition-colors"
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

        <div className="space-y-6">
          <Card className="rounded-2xl border-none shadow-xl bg-[#1a237e] text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
            <CardHeader className="p-8 pb-4 relative z-10">
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200">Panel de Estadísticas</CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-0 relative z-10 space-y-8">
              <div className="flex items-center justify-between group/item">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shadow-lg group-hover/item:scale-110 transition-transform">
                    <CalendarCheck className="h-6 w-6 text-indigo-200" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest">Total Turnos</p>
                    <p className="text-2xl font-black">{stats?.total_ventanas || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between group/item">
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-lg group-hover/item:scale-110 transition-transform">
                    <ShieldCheck className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">Completados</p>
                    <p className="text-2xl font-black text-emerald-400">{stats?.ventanas_completadas || 0}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <div className="flex justify-between items-center text-[11px] font-bold text-indigo-300 uppercase tracking-widest mb-2">
                  <span>Progreso Global</span>
                  <span>{stats?.total_ventanas ? Math.round((stats.ventanas_completadas / stats.total_ventanas) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-400 transition-all duration-1000" 
                    style={{ width: `${stats?.total_ventanas ? (stats.ventanas_completadas / stats.total_ventanas) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Herramientas</h4>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 hover:text-[#1a237e] hover:border-indigo-100 transition-all justify-start group"
                onClick={() => fetchData()}
              >
                <RefreshCw className="mr-3 h-4 w-4 text-slate-400 group-hover:rotate-180 transition-transform duration-500" /> 
                Sincronizar Datos
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl border-slate-200 text-slate-600 font-bold text-[13px] hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-100 transition-all justify-start"
              >
                <Plus className="mr-3 h-4 w-4 text-slate-400" /> 
                Crear Manualmente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
