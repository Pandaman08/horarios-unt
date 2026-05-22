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
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Layers,
  RefreshCw
} from "lucide-react";
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

interface Ciclo {
  id_ciclo: number;
  numero: number;
  nombre: string;
  activo: boolean;
}

export function CicloList() {
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<Ciclo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const filteredCiclos = ciclos.filter(c => 
    `${c.nombre} ${c.numero}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    numero: "",
    nombre: "",
  });

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ciclos");
      const contentType = res.headers.get("content-type");
      
      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar ciclos");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON:", text.substring(0, 100));
        throw new Error("La respuesta del servidor no es un JSON válido");
      }

      const data = await res.json();
      setCiclos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error en fetchCiclos:", error);
      toast.error(error.message || "Error al cargar ciclos");
      setCiclos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCiclo ? "PUT" : "POST";
    const url = editingCiclo 
      ? `/api/ciclos/${editingCiclo.id_ciclo}` 
      : "/api/ciclos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          numero: parseInt(formData.numero)
        }),
      });

      if (res.ok) {
        toast.success(editingCiclo ? "Ciclo actualizado" : "Ciclo creado");
        setIsDialogOpen(false);
        setEditingCiclo(null);
        setFormData({ numero: "", nombre: "" });
        fetchCiclos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al guardar ciclo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/ciclos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Ciclo eliminado");
        fetchCiclos();
      } else {
        toast.error(data.error || "Error al eliminar ciclo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (ciclo: Ciclo) => {
    setEditingCiclo(ciclo);
    setFormData({
      numero: ciclo.numero.toString(),
      nombre: ciclo.nombre,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
            <Layers className="h-4 w-4 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">Ciclos Académicos</h2>
            <p className="text-slate-500 text-[10px] mt-1">Gestión de niveles de progresión académica</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar ciclo..." 
              className="pl-9 h-9 rounded-lg border-slate-200 bg-slate-50/50 font-semibold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchCiclos} 
            className="h-9 rounded-lg border-slate-200 hover:bg-slate-50 transition-all px-3"
            title="Refrescar"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl p-6 border-none shadow-2xl">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <Layers className="h-5 w-5 text-[#1a237e]" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">
                      {editingCiclo ? "Actualizar Ciclo" : "Registrar Ciclo"}
                    </DialogTitle>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Configure los datos básicos del ciclo</p>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Número</Label>
                    <Input 
                      type="number"
                      className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                      value={formData.numero} 
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })} 
                      required 
                      min={1}
                      max={12}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                    <Input 
                      className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                      required 
                      placeholder="Ej: I Ciclo"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-slate-400 hover:bg-slate-50 px-6 text-[11px]">Cancelar</Button>
                  <Button type="submit" className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                    {editingCiclo ? "Actualizar" : "Crear"}
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
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 w-[80px]">Nº</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">Estado</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : filteredCiclos.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron ciclos</TableCell></TableRow>
              ) : (
                filteredCiclos.map((ciclo) => (
                  <TableRow key={ciclo.id_ciclo} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[10px] font-bold text-[#1a237e]">{ciclo.numero}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="font-semibold text-slate-800 text-[11px]">{ciclo.nombre}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border",
                        ciclo.activo ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        {ciclo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ciclo)} className="h-7 w-7 rounded-lg hover:bg-indigo-50 hover:text-[#1a237e] transition-all opacity-0 group-hover:opacity-100"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(ciclo.id_ciclo); setIsDeleteDialogOpen(true); }} className="h-7 w-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">¿Eliminar ciclo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2">
              Esta acción marcará el ciclo como inactivo. Solo se puede eliminar definitivamente si no tiene cursos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-10 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-8">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
