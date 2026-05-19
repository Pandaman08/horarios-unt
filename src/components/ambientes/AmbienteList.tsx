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
      const data = await res.json();
      setAmbientes(data);
    } catch (error) {
      toast.error("Error al cargar ambientes");
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
    <div className="space-y-4">
      {/* Header Balanceado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <MapPin className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Ambientes</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Gestión de espacios físicos</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar ambientes..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
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
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm transition-all">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Ambiente
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-3xl rounded-2xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-[#003366]" />
                </div>
                <div>
                  <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">
                    {editingAmbiente ? "Actualizar Ambiente" : "Registrar Ambiente"}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Código</Label>
                  <Input
                    placeholder="Ej: A-101"
                    className={cn("h-11 rounded-xl border-gray-200 font-bold text-[16px]", editingAmbiente && "bg-gray-50")}
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 10) })}
                    required
                    readOnly={!!editingAmbiente}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Capacidad</Label>
                  <Input
                    type="number"
                    className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"
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
                <div className="space-y-2">
                  <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Tipo</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="aula" className="font-bold text-[16px]">Aula Teórica</SelectItem>
                      <SelectItem value="laboratorio" className="font-bold text-[16px]">Laboratorio</SelectItem>
                      <SelectItem value="auditorio" className="font-bold text-[16px]">Auditorio</SelectItem>
                      <SelectItem value="sala_reuniones" className="font-bold text-[16px]">Sala de Reuniones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Nombre</Label>
                  <Input
                    placeholder="Ej: Aula Magna"
                    className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Pabellón</Label>
                  <Input
                    placeholder="Ej: B"
                    className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"
                    value={formData.pabellon}
                    onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Piso</Label>
                  <Input
                    placeholder="Ej: 2"
                    className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"
                    value={formData.piso}
                    onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 rounded-xl font-bold text-gray-500 px-8 text-[16px]"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black text-[16px]">
                  {editingAmbiente ? "Actualizar" : "Crear"}
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
                <TableHead className="w-[100px]">Cód.</TableHead>
                <TableHead>Nombre del Ambiente</TableHead>
                <TableHead className="w-[120px]">Pabellón</TableHead>
                <TableHead className="w-[120px]">Piso</TableHead>
                <TableHead className="w-[140px] text-center">Tipo</TableHead>
                <TableHead className="w-[100px] text-center">Cap.</TableHead>
                <TableHead className="w-[120px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando ambientes...</TableCell></TableRow>
              ) : filteredAmbientes.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredAmbientes.map((ambiente) => (
                  <TableRow key={ambiente.id_ambiente} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-bold text-[14px] text-gray-500">{ambiente.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <DoorOpen className="h-5 w-5 text-[#003366]/50" />
                        <span className="font-bold text-gray-900 truncate text-[16px]">{ambiente.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[14px] font-bold text-gray-500">{ambiente.pabellon || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[14px] font-bold text-gray-500">{ambiente.piso || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-tight",
                        ambiente.tipo === 'laboratorio' ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {ambiente.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-[16px] font-black text-[#003366]">{ambiente.capacidad}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(ambiente)}
                          title="Editar"
                          className="h-9 w-9 hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(ambiente.id_ambiente);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Eliminar"
                          className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                        >
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

      {/* Ventana de Advertencia de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-gray-900">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-gray-500">
              Esta acción marcará el ambiente como inactivo. Asegúrese de que no sea necesario para la programación actual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-bold border-gray-200 hover:bg-gray-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && handleDelete(deletingId)}
              className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black px-8"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ventana de Error por Dependencias */}
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
              <Info className="h-8 w-8 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-gray-900">No se puede eliminar</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-gray-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction 
              onClick={() => setIsErrorDialogOpen(false)}
              className="h-12 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-black px-8"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
