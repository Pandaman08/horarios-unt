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
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Timer
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Periodo {
  id_periodo: number;
  codigo: string;
  nombre: string;
  anio: number;
  semestre: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

export function PeriodoList() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredPeriodos = periodos.filter(p => 
    `${p.nombre} ${p.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    anio: new Date().getFullYear().toString(),
    semestre: "1",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "planificacion",
  });

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const fetchPeriodos = async () => {
    try {
      const res = await fetch("/api/periodos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPeriodos(data);
      } else {
        setPeriodos([]);
      }
    } catch (error) {
      toast.error("Error al cargar periodos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingPeriodo ? "PUT" : "POST";
    const url = editingPeriodo 
      ? `/api/periodos/${editingPeriodo.id_periodo}` 
      : "/api/periodos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingPeriodo ? "Periodo actualizado" : "Periodo creado");
        setIsDialogOpen(false);
        setEditingPeriodo(null);
        resetForm();
        fetchPeriodos();
      } else {
        toast.error("Error al guardar periodo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este periodo?")) return;

    try {
      const res = await fetch(`/api/periodos/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Periodo eliminado");
        fetchPeriodos();
      } else {
        toast.error("Error al eliminar periodo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleEdit = (periodo: Periodo) => {
    setEditingPeriodo(periodo);
    setFormData({
      codigo: periodo.codigo,
      nombre: periodo.nombre,
      anio: periodo.anio.toString(),
      semestre: periodo.semestre.toString(),
      fecha_inicio: periodo.fecha_inicio.split("T")[0],
      fecha_fin: periodo.fecha_fin.split("T")[0],
      estado: periodo.estado,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      anio: new Date().getFullYear().toString(),
      semestre: "1",
      fecha_inicio: "",
      fecha_fin: "",
      estado: "planificacion",
    });
  };

  const getStatusBadge = (estado: string) => {
    const states: Record<string, { label: string, color: string, icon: any }> = {
      planificacion: { label: "Planificación", color: "bg-blue-50 text-blue-700", icon: Clock },
      asignacion_horarios: { label: "Asignación", color: "bg-yellow-50 text-yellow-700", icon: Timer },
      en_curso: { label: "En Curso", color: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
      finalizado: { label: "Finalizado", color: "bg-gray-50 text-gray-700", icon: AlertCircle },
    };
    const state = states[estado] || states.planificacion;
    const Icon = state.icon;
    return (
      <span className={cn("px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-widest border-none flex items-center gap-1.5", state.color)}>
        <Icon className="h-3 w-3" />
        {state.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar periodo académico..." 
            className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-[#003366]/10 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPeriodo(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Periodo
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-[90vw] lg:max-w-5xl rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[95vh] overflow-x-hidden">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-[#003366]" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                    {editingPeriodo ? "Actualizar Periodo" : "Crear Ciclo Académico"}
                  </DialogTitle>
                  <p className="text-base text-gray-500 font-medium">Defina los rangos de fecha y el estado del periodo lectivo.</p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Código del Periodo</Label>
                  <Input
                    placeholder="Ej: 2026-I"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Año Lectivo</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.anio}
                    onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Semestre</Label>
                  <Select
                    value={formData.semestre}
                    onValueChange={(value) => setFormData({ ...formData, semestre: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="1" className="font-bold">Semestre I</SelectItem>
                      <SelectItem value="2" className="font-bold">Semestre II</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nombre del Periodo</Label>
                  <Input
                    placeholder="Ej: Semestre Académico 2026 - I"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Estado del Ciclo</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData({ ...formData, estado: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="planificacion" className="font-bold text-blue-600">Planificación</SelectItem>
                      <SelectItem value="asignacion_horarios" className="font-bold text-yellow-600">Asignación de Horarios</SelectItem>
                      <SelectItem value="en_curso" className="font-bold text-emerald-600">En Curso</SelectItem>
                      <SelectItem value="finalizado" className="font-bold text-gray-600">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Inicio</Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Fecha de Término</Label>
                  <Input
                    type="date"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-12 rounded-xl font-bold text-gray-500 px-8 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-12 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-12 font-black shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02]">
                  {editingPeriodo ? "Actualizar Periodo" : "Crear Periodo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8">Código</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Periodo Académico</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Duración</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Estado Actual</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-blue-100 border-t-[#003366] rounded-full animate-spin" />
                      <p className="text-sm font-bold text-gray-400">Cargando cronograma...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPeriodos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                        <Calendar className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-black text-gray-400 tracking-tight">No hay periodos registrados</p>
                      <p className="text-sm text-gray-400 font-medium">Configure el primer ciclo académico para comenzar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeriodos.map((periodo) => (
                  <TableRow key={periodo.id_periodo} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="px-8 font-black text-xs text-gray-400">{periodo.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-[#003366] transition-colors">
                          <Calendar className="h-5 w-5 text-[#003366] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 tracking-tight">{periodo.nombre}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Año {periodo.anio} - Semestre {periodo.semestre}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-600">
                          <span>{format(new Date(periodo.fecha_inicio), "dd MMM", { locale: es })}</span>
                          <span className="text-gray-300">→</span>
                          <span>{format(new Date(periodo.fecha_fin), "dd MMM", { locale: es })}</span>
                        </div>
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">Duración total</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center">
                        {getStatusBadge(periodo.estado)}
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(periodo)}
                          title="Editar"
                          className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(periodo.id_periodo)}
                          title="Eliminar"
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
  );
}
