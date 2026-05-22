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
  Search, 
  MapPin, 
  Users, 
  Building2, 
  DoorOpen, 
  Monitor,
  AlertTriangle,
  Info
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

interface Ambiente {
  id_ambiente: number;
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  piso: string;
  pabellon: string;
}

export function AmbienteList() {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAmbiente, setEditingAmbiente] = useState<Ambiente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredAmbientes = ambientes.filter(a => 
    `${a.nombre} ${a.codigo} ${a.pabellon}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    tipo: "aula",
    capacidad: "40",
    piso: "",
    pabellon: "",
    equipamiento: "",
  });

  useEffect(() => {
    fetchAmbientes();
  }, []);

  const fetchAmbientes = async () => {
    try {
      const res = await fetch("/api/ambientes");
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar ambientes");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON de /api/ambientes:", text.substring(0, 200));
        throw new Error("La respuesta de ambientes no es un JSON válido");
      }

      const data = await res.json();
      setAmbientes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error en fetchAmbientes:", error);
      toast.error(error.message || "Error al cargar ambientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingAmbiente ? "PUT" : "POST";
    const url = editingAmbiente 
      ? `/api/ambientes/${editingAmbiente.id_ambiente}` 
      : "/api/ambientes";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingAmbiente ? "Ambiente actualizado" : "Ambiente creado");
        setIsDialogOpen(false);
        setEditingAmbiente(null);
        resetForm();
        fetchAmbientes();
      } else {
        toast.error("Error al guardar ambiente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/ambientes/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Ambiente eliminado");
        fetchAmbientes();
      } else {
        setErrorMessage(data.error || "Error al eliminar ambiente");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (ambiente: Ambiente) => {
    setEditingAmbiente(ambiente);
    setFormData({
      codigo: ambiente.codigo,
      nombre: ambiente.nombre,
      tipo: ambiente.tipo,
      capacidad: ambiente.capacidad.toString(),
      piso: ambiente.piso || "",
      pabellon: ambiente.pabellon || "",
      equipamiento: "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      tipo: "aula",
      capacidad: "40",
      piso: "",
      pabellon: "",
      equipamiento: "",
    });
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
            <MapPin className="h-4 w-4 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">Ambientes Académicos</h2>
            <p className="text-slate-500 text-[10px] mt-1">Gestión de aulas, laboratorios y espacios físicos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar ambiente..." 
              className="pl-9 h-9 rounded-lg border-slate-200 bg-slate-50/50 font-semibold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingAmbiente(null);
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
                  <Building2 className="h-5 w-5 text-[#1a237e]" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">
                    {editingAmbiente ? "Actualizar Ambiente" : "Registrar Ambiente"}
                  </DialogTitle>
                  <p className="text-slate-500 text-xs mt-1 font-medium">Configure los detalles del espacio físico</p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Código</Label>
                  <Input
                    placeholder="Ej: A-101"
                    className={cn("h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all", editingAmbiente && "bg-slate-100")}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 10) })}
                    required
                    readOnly={!!editingAmbiente}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Capacidad</Label>
                  <Input
                    type="number"
                    className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
                    value={formData.capacidad}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(500, parseInt(e.target.value) || 1));
                      setFormData({ ...formData, capacidad: val.toString() });
                    }}
                    required
                    min={1}
                    max={500}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                      <SelectItem value="aula" className="font-bold text-[11px] py-1.5">Aula Teórica</SelectItem>
                      <SelectItem value="laboratorio" className="font-bold text-[11px] py-1.5">Laboratorio</SelectItem>
                      <SelectItem value="auditorio" className="font-bold text-[11px] py-1.5">Auditorio</SelectItem>
                      <SelectItem value="sala_reuniones" className="font-bold text-[11px] py-1.5">Sala de Reuniones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre Completo</Label>
                  <Input
                    placeholder="Ej: Aula Magna - Facultad de Ingeniería"
                    className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Pabellón</Label>
                  <Input
                    placeholder="Ej: B"
                    className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
                    value={formData.pabellon}
                    onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nivel / Piso</Label>
                  <Input
                    placeholder="Ej: 2"
                    className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-9 rounded-lg font-bold text-slate-400 hover:bg-slate-50 px-6 text-[11px]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                  {editingAmbiente ? "Actualizar" : "Crear"}
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
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 w-[80px]">Cód.</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Ambiente</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Ubicación</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">Tipo</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">Cap.</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : filteredAmbientes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredAmbientes.map((ambiente) => (
                  <TableRow key={ambiente.id_ambiente} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[9px] font-bold text-slate-400">{ambiente.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center border border-indigo-100 text-[#1a237e] shadow-sm">
                          <DoorOpen className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[11px]">{ambiente.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                        <Building2 className="h-3 w-3 text-slate-300" />
                        <span>Pab. {ambiente.pabellon || '-'} • Piso {ambiente.piso || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border",
                        ambiente.tipo === 'laboratorio' ? "bg-purple-50 text-purple-700 border-purple-100" : "bg-indigo-50 text-[#1a237e] border-indigo-100"
                      )}>
                        {ambiente.tipo.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold border border-slate-200">{ambiente.capacidad}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(ambiente)}
                          title="Editar"
                          className="h-7 w-7 rounded-lg hover:bg-indigo-50 hover:text-[#1a237e] transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(ambiente.id_ambiente);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Eliminar"
                          className="h-7 w-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-[400px]">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <AlertTriangle className="h-8 w-8 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
              Esta acción marcará el ambiente como inactivo. Asegúrese de que no sea necesario para la programación actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-10 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && handleDelete(deletingId)}
              className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-8"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-[450px]">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
              <Info className="h-8 w-8 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">No se puede eliminar</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-4 leading-relaxed">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogAction 
              onClick={() => setIsErrorDialogOpen(false)}
              className="h-10 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-bold text-xs px-10 shadow-lg shadow-indigo-900/10"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
