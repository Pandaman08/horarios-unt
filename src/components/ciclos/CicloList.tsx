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
import { cn } from "@/lib/utils";

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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Layers className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Ciclos</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Gestión de ciclos académicos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar ciclo..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={fetchCiclos} 
            className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
            title="Refrescar"
          >
            <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Ciclo
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl p-6 border-none shadow-2xl">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">
                  {editingCiclo ? "Actualizar Ciclo" : "Registrar Ciclo"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Número de Ciclo</Label>
                    <Input 
                      type="number"
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                      value={formData.numero} 
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })} 
                      required 
                      min={1}
                      max={12}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Nombre Descriptivo</Label>
                    <Input 
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                      required 
                      placeholder="Ej: I Ciclo, II Ciclo..."
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold">Cancelar</Button>
                  <Button type="submit" className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black">
                    {editingCiclo ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="w-[100px] font-black text-gray-400 uppercase tracking-widest text-[11px] pl-6">Nº</TableHead>
              <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[11px]">Nombre del Ciclo</TableHead>
              <TableHead className="w-[120px] font-black text-gray-400 uppercase tracking-widest text-[11px] text-center">Estado</TableHead>
              <TableHead className="w-[150px] font-black text-gray-400 uppercase tracking-widest text-[11px] text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando ciclos...</TableCell></TableRow>
            ) : filteredCiclos.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron ciclos</TableCell></TableRow>
            ) : (
              filteredCiclos.map((ciclo) => (
                <TableRow key={ciclo.id_ciclo} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                  <TableCell className="font-black text-[16px] text-[#003366] pl-6">{ciclo.numero}</TableCell>
                  <TableCell className="font-bold text-gray-900 text-[16px]">{ciclo.nombre}</TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider",
                      ciclo.activo ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      {ciclo.activo ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <div className="flex items-center justify-end gap-2 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(ciclo)} className="h-9 w-9 hover:bg-blue-50 hover:text-[#003366]"><Edit className="h-5 w-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { setDeletingId(ciclo.id_ciclo); setIsDeleteDialogOpen(true); }} className="h-9 w-9 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">¿Eliminar ciclo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-500">
              Esta acción marcará el ciclo como inactivo. Solo se puede eliminar definitivamente si no tiene cursos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-10 rounded-xl font-bold">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black px-6">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
