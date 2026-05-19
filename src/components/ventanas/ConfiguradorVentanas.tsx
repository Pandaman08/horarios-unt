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
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Ventanas de Atención</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Programación de horarios docente</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-3 bg-gray-50/50 px-4 h-11 rounded-xl border border-gray-100">
            <span className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Periodo</span>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-[140px] h-8 border-none bg-transparent font-black text-gray-900 p-0 focus:ring-0 text-[14px]">
                <SelectValue placeholder="Periodo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {periodos.map((p) => (
                  <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-[14px]">Ciclo {p.codigo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm">
                <Wand2 className="mr-2 h-5 w-5" /> Generar Programación
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-2xl rounded-2xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Wand2 className="h-8 w-8 text-[#003366]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">Asistente de Programación</DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleAutoSchedule} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Fecha de Inicio</Label>
                    <Input type="date" className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={autoFormData.fecha_inicio} onChange={(e) => setAutoFormData({ ...autoFormData, fecha_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Minutos por Docente</Label>
                    <Input type="number" className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={autoFormData.intervalo_por_docente} onChange={(e) => setAutoFormData({ ...autoFormData, intervalo_por_docente: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Inicio Jornada</Label>
                    <Input type="time" className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={autoFormData.hora_inicio_jornada} onChange={(e) => setAutoFormData({ ...autoFormData, hora_inicio_jornada: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Fin Jornada</Label>
                    <Input type="time" className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={autoFormData.hora_fin_jornada} onChange={(e) => setAutoFormData({ ...formData, hora_fin_jornada: e.target.value })} required />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                  <Button type="button" variant="ghost" onClick={() => setIsAutoDialogOpen(false)} className="h-11 rounded-xl font-bold text-gray-500 px-8 text-[16px]">Cancelar</Button>
                  <Button type="submit" disabled={isProcessing} className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black text-[16px]">
                    {isProcessing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    {isProcessing ? "Procesando..." : "Generar Ventanas"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="border-none hover:bg-transparent">
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario de Atención</TableHead>
                    <TableHead>Modalidad / Categoría</TableHead>
                    <TableHead className="w-[120px] text-center">Docentes</TableHead>
                    <TableHead className="w-[120px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando ventanas...</TableCell></TableRow>
                  ) : ventanas.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
                  ) : (
                    ventanas.map((v) => (
                      <TableRow key={v.id_ventana} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                        <TableCell className="font-bold text-[16px] text-gray-900">{format(new Date(v.fecha), "EEEE dd 'de' MMMM", { locale: es })}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3 text-[14px] font-bold text-gray-500">
                            <Clock className="h-5 w-5 text-[#003366]/50" />
                            <span>{v.hora_inicio} - {v.hora_fin}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#003366] text-[12px] font-black uppercase tracking-tight">{v.modalidad}</span>
                            <span className="px-3 py-1 rounded-lg bg-gray-50 text-gray-600 text-[12px] font-black uppercase tracking-tight">{v.categoria}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-[16px] font-black text-[#003366]">{v.cantidad_docentes}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id_ventana)} title="Eliminar" className="h-9 w-9 hover:bg-red-50 hover:text-red-600">
                              <Trash2 className="h-5 w-5" />
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

        <div className="space-y-4">
          <Card className="rounded-xl border-none shadow-sm bg-[#003366] text-white overflow-hidden">
            <CardHeader className="p-4 pb-0">
              <CardTitle className="text-[14px] font-black uppercase tracking-widest text-blue-200">Resumen de Atención</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <CalendarCheck className="h-5 w-5 text-blue-200" />
                    </div>
                    <span className="text-[14px] font-bold">Total Ventanas</span>
                  </div>
                  <span className="text-[24px] font-black">{stats?.total_ventanas || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <ShieldCheck className="h-5 w-5 text-emerald-400" />
                    </div>
                    <span className="text-[14px] font-bold">Completadas</span>
                  </div>
                  <span className="text-[24px] font-black">{stats?.ventanas_completadas || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
