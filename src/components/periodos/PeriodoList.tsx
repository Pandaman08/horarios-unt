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
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar periodos");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON de /api/periodos:", text.substring(0, 200));
        throw new Error("La respuesta de periodos no es un JSON válido");
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setPeriodos(data);
      } else {
        setPeriodos([]);
      }
    } catch (error: any) {
      console.error("Error en fetchPeriodos:", error);
      toast.error(error.message || "Error al cargar periodos");
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
      planificacion: { label: "Planificación", color: "bg-indigo-50 text-indigo-700 border-indigo-100", icon: Clock },
      asignacion_horarios: { label: "Asignación", color: "bg-amber-50 text-amber-700 border-amber-100", icon: Timer },
      en_curso: { label: "En Curso", color: "bg-emerald-50 text-emerald-700 border-emerald-100", icon: CheckCircle2 },
      finalizado: { label: "Finalizado", color: "bg-slate-50 text-slate-700 border-slate-200", icon: AlertCircle },
    };
    const state = states[estado] || states.planificacion;
    const Icon = state.icon;
    return (
      <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border", state.color)}>
        <Icon className="h-3.5 w-3.5" />
        {state.label}
      </span>
    );
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
            <Calendar className="h-4 w-4 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">Periodos Académicos</h2>
            <p className="text-slate-500 text-[10px] mt-1">Configuración de ciclos y estados del sistema</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar periodo..." 
              className="pl-9 h-9 rounded-lg border-slate-200 bg-slate-50/50 font-semibold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
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
              <Button className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <Calendar className="h-5 w-5 text-[#1a237e]" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">
                      {editingPeriodo ? "Actualizar Periodo" : "Registrar Periodo"}
                    </DialogTitle>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Configure los parámetros del ciclo lectivo</p>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Código</Label>
                    <Input 
                      className={cn("h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all", editingPeriodo && "bg-slate-100")} 
                      value={formData.codigo} 
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 10) })} 
                      required 
                      readOnly={!!editingPeriodo}
                      placeholder="Ej: 2024-I"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                    <Input 
                      className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 50) })} 
                      required 
                      maxLength={50}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Año</Label>
                    <Input 
                      type="number" 
                      className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
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
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Inicio</Label>
                    <Input type="date" className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Fin</Label>
                    <Input type="date" className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Estado</Label>
                    <Select 
                      value={formData.estado} 
                      onValueChange={(val) => setFormData({ ...formData, estado: val })}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                        <SelectItem value="planificacion" className="font-bold text-[11px] py-1.5">Planificación</SelectItem>
                        <SelectItem value="asignacion_horarios" className="font-bold text-[11px] py-1.5">Asignación</SelectItem>
                        <SelectItem value="en_curso" className="font-bold text-[11px] py-1.5">En Curso</SelectItem>
                        <SelectItem value="finalizado" className="font-bold text-[11px] py-1.5">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-slate-400 hover:bg-slate-50 px-6 text-[11px]">Cancelar</Button>
                  <Button type="submit" className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                    {editingPeriodo ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 w-[100px]">Código</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Rango</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">Estado</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : filteredPeriodos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredPeriodos.map((periodo) => (
                  <TableRow key={periodo.id_periodo} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[10px] font-bold text-[#1a237e]">{periodo.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 font-semibold text-slate-800 text-[11px]">{periodo.nombre}</TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Timer className="h-3.5 w-3.5 text-slate-300" />
                        <span>{format(new Date(periodo.fecha_inicio), "dd MMM", { locale: es })} - {format(new Date(periodo.fecha_fin), "dd MMM yy", { locale: es })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex justify-center">{getStatusBadge(periodo.estado)}</div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(periodo)} title="Editar" className="h-7 w-7 rounded-lg hover:bg-indigo-50 hover:text-[#1a237e] transition-all opacity-0 group-hover:opacity-100"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(periodo.id_periodo); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-7 w-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-[400px]">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <AlertCircle className="h-8 w-8 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">¿Eliminar periodo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">Esta acción eliminará el periodo y toda la información asociada. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-10 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-8">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-[450px]">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Aviso del Sistema</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-4 leading-relaxed">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-10 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-bold text-xs px-10 shadow-lg shadow-indigo-900/10">Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
