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
    <div className="space-y-6 animate-in fade-in duration-500 w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-3 md:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 md:h-12 w-10 md:w-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
            <CalendarIcon className="h-5 md:h-6 w-5 md:w-6 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-base md:text-lg md:text-xl font-bold text-slate-800 tracking-tight">Configuración de Ventanas de Atención</h2>
            <p className="text-[10px] md:text-xs text-slate-500 mt-1">Define el orden jerárquico de prioridad para la selección de horarios.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-xs font-medium text-slate-600">Período:</span>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-auto border-none bg-transparent font-bold text-[#1a237e] p-0 focus:ring-0 text-sm">
                <SelectValue placeholder="Periodo" />
                <span className="text-slate-400 ml-1 text-xs">(Activo)</span>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                {periodos.map((p) => (
                  <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-sm py-2 focus:bg-indigo-50 focus:text-[#1a237e]">{p.codigo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-[#1a237e] hover:bg-[#0d145a] text-white rounded-xl px-5 font-bold text-sm shadow-lg shadow-indigo-100 transition-all active:scale-95">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12">
              <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 border-4 border-indigo-50 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Sincronizando Calendario...</p>
              </div>
            </div>
          ) : ventanas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12">
              <div className="flex flex-col items-center gap-2 opacity-30">
                <CalendarIcon className="h-12 w-12 text-slate-400" />
                <p className="text-[15px] font-bold text-slate-500">No hay ventanas programadas</p>
              </div>
            </div>
          ) : (
            <>
              {[...new Set(ventanas.map((v) => v.fecha))].map((fecha, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 md:p-5 border-b border-slate-100 flex items-center gap-3">
                    <CalendarIcon className="h-5 w-5 text-[#1a237e]" />
                    <h3 className="font-bold text-slate-800 text-base">
                      Día: {format(new Date(fecha), "dd/MM/yyyy", { locale: es })}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px] w-full">
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="border-none hover:bg-transparent">
                          <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Orden</TableHead>
                          <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Categoría</TableHead>
                          <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Modalidad</TableHead>
                          <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Desde</TableHead>
                          <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Hasta</TableHead>
                          <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Estado</TableHead>
                          <TableHead className="w-[100px] text-right text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ventanas.filter((v) => v.fecha === fecha).map((v, vIdx) => (
                          <TableRow key={v.id_ventana} className="group border-b border-slate-50 hover:bg-slate-50/50 transition-all">
                            <TableCell className="px-6 py-4">
                              <span className="font-bold text-slate-600 text-[13px]">#{vIdx + 1}</span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <span className="font-bold text-slate-800 text-[13px]">
                                  {v.categoria}
                                </span>
                                {v.cantidad_docentes > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[9px] font-black uppercase border border-amber-200 w-fit">
                                    {v.cantidad_docentes} docentes pendientes
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="text-slate-600 text-[13px]">{v.modalidad}</span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="text-[#1a237e] font-bold font-mono text-[13px]">{v.hora_inicio}</span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="text-[#1a237e] font-bold font-mono text-[13px]">{v.hora_fin}</span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black uppercase border",
                                v.completado 
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                  : "bg-slate-50 text-slate-600 border-slate-200"
                              )}>
                                {v.completado ? "Completado" : "Pendiente"}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex justify-end">
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
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <div className="space-y-4 md:space-y-6">
          <Card className="rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <CardHeader className="p-5 md:p-6 pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-slate-400">Docentes Pendientes por Categoría</CardTitle>
            </CardHeader>
            <CardContent className="p-5 md:p-6 pt-0 space-y-3">
              {[
                { categoria: "Auxiliar Nombrado", cantidad: 6, color: "bg-amber-100 text-amber-800" },
                { categoria: "JP Nombrado", cantidad: 4, color: "bg-slate-100 text-slate-700" },
                { categoria: "Principal Contratado", cantidad: 3, color: "bg-slate-100 text-slate-700" },
                { categoria: "Asociado Contratado", cantidad: 5, color: "bg-slate-100 text-slate-700" },
                { categoria: "Auxiliar Contratado", cantidad: 14, color: "bg-slate-100 text-slate-700" },
                { categoria: "JP Contratado", cantidad: 6, color: "bg-slate-100 text-slate-700" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-600 text-[13px] font-medium">{item.categoria}</span>
                  <span className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold", item.color)}>
                    {item.cantidad} pendientes
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-5 md:p-6 pb-4">
              <CardTitle className="text-[11px] font-black uppercase tracking-widest text-indigo-200 flex items-center gap-2">
                <span className="text-yellow-400">💡</span> TIP DE OPERADOR
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 md:p-6 pt-0">
              <p className="text-slate-300 text-[13px] leading-relaxed">
                Las horas desde/hasta pueden ser modificadas directamente haciendo doble clic en el valor dentro de la grilla. El sistema propagará automáticamente los cambios al guardar.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
