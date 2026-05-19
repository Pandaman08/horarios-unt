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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    try {
      const res = await fetch(`/api/periodos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Periodo eliminado");
        fetchPeriodos();
      } else {
        setErrorMessage(data.error || "Error al eliminar periodo");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
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
      <span className={cn("px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-tight flex items-center gap-2", state.color)}>
        <Icon className="h-4 w-4" />
        {state.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Calendar className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Periodos</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Ciclos académicos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar periodo..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
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
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm transition-all">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Periodo
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-3xl rounded-2xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-[#003366]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">
                      {editingPeriodo ? "Actualizar Periodo" : "Registrar Periodo"}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Código</Label>
                    <Input 
                      className={cn("h-11 rounded-xl border-gray-200 font-bold text-[16px]", editingPeriodo && "bg-gray-50")} 
                      value={formData.codigo} 
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 10) })} 
                      required 
                      readOnly={!!editingPeriodo}
                      placeholder="Ej: 2024-I"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Nombre</Label>
                    <Input 
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 50) })} 
                      required 
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Año</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                      value={formData.anio} 
                      onChange={(e) => {
                        const val = Math.max(2020, Math.min(2100, parseInt(e.target.value) || 2024));
                        setFormData({ ...formData, anio: val.toString() });
                      }} 
                      required 
                      min={2020}
                      max={2100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Fecha Inicio</Label>
                    <Input type="date" className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Fecha Fin</Label>
                    <Input type="date" className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} required />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-gray-500 px-8 text-[16px]">Cancelar</Button>
                  <Button type="submit" className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black text-[16px]">
                    {editingPeriodo ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[100px]">Código</TableHead>
                <TableHead>Nombre del Periodo</TableHead>
                <TableHead className="w-[200px]">Rango de Fechas</TableHead>
                <TableHead className="w-[180px] text-center">Estado</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando periodos...</TableCell></TableRow>
              ) : filteredPeriodos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredPeriodos.map((periodo) => (
                  <TableRow key={periodo.id_periodo} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-bold text-[14px] text-gray-500">{periodo.codigo}</TableCell>
                    <TableCell className="font-bold text-gray-900 text-[16px]">{periodo.nombre}</TableCell>
                    <TableCell className="text-[14px] font-bold text-gray-500">
                      {format(new Date(periodo.fecha_inicio), "dd MMM yyyy", { locale: es })} - {format(new Date(periodo.fecha_fin), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">{getStatusBadge(periodo.estado)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(periodo)} title="Editar" className="h-9 w-9 hover:bg-blue-50 hover:text-[#003366]"><Edit className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(periodo.id_periodo); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-9 w-9 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-5 w-5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-lg border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">¿Eliminar este periodo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-500">Esta acción eliminará el periodo y toda la información asociada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-10 rounded-lg font-bold text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-sm px-6">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-lg border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">Error</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-600 bg-amber-50 p-4 rounded-lg border border-amber-100">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-10 rounded-lg bg-[#003366] hover:bg-[#002244] text-white font-black text-sm px-8">Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
