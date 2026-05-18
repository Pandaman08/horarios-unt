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
  Monitor 
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    if (!confirm("¿Está seguro de eliminar este ambiente?")) return;

    try {
      const res = await fetch(`/api/ambientes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ambiente eliminado");
        fetchAmbientes();
      } else {
        toast.error("Error al eliminar ambiente");
      }
    } catch (error) {
      toast.error("Error de conexión");
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar ambiente por nombre o código..." 
            className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-[#003366]/10 font-medium"
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
            <Button className="bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Ambiente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-[90vw] lg:max-w-5xl rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[95vh] overflow-x-hidden">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-[#003366]" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                    {editingAmbiente ? "Actualizar Ambiente" : "Registrar Nuevo Ambiente"}
                  </DialogTitle>
                  <p className="text-base text-gray-500 font-medium">Configure las características del espacio físico.</p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Código Identificador</Label>
                  <Input
                    placeholder="Ej: A-101"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Capacidad (Personas)</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.capacidad}
                    onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Tipo de Ambiente</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="aula" className="font-bold">Aula Teórica</SelectItem>
                      <SelectItem value="laboratorio" className="font-bold">Laboratorio Especializado</SelectItem>
                      <SelectItem value="auditorio" className="font-bold">Auditorio</SelectItem>
                      <SelectItem value="sala_reuniones" className="font-bold">Sala de Reuniones</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Descriptivo</Label>
                  <Input
                    placeholder="Ej: Aula Magna de Ingeniería"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Pabellón</Label>
                  <Input
                    placeholder="Ej: Pabellón B"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.pabellon}
                    onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Piso / Nivel</Label>
                  <Input
                    placeholder="Ej: Segundo Piso"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
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
                  className="h-12 rounded-xl font-bold text-gray-500 px-8 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-12 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-12 font-black shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02]">
                  {editingAmbiente ? "Actualizar Ambiente" : "Crear Ambiente"}
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
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Ambiente</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Tipo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Capacidad</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-blue-100 border-t-[#003366] rounded-full animate-spin" />
                      <p className="text-sm font-bold text-gray-400">Cargando ambientes...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAmbientes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                        <MapPin className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-black text-gray-400 tracking-tight">No hay ambientes registrados</p>
                      <p className="text-sm text-gray-400 font-medium">Registre los espacios físicos de la facultad.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAmbientes.map((ambiente) => (
                  <TableRow key={ambiente.id_ambiente} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="px-8 font-black text-xs text-gray-400">{ambiente.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-[#003366] transition-colors">
                          <DoorOpen className="h-5 w-5 text-[#003366] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 tracking-tight">{ambiente.nombre}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pabellón {ambiente.pabellon} - Piso {ambiente.piso}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-tighter border-none",
                        ambiente.tipo === 'laboratorio' ? "bg-purple-50 text-purple-700" : "bg-blue-50 text-blue-700"
                      )}>
                        {ambiente.tipo === 'laboratorio' ? <Monitor className="h-3 w-3 mr-1 inline" /> : null}
                        {ambiente.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-black text-[#003366]">{ambiente.capacidad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(ambiente)}
                          title="Editar"
                          className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(ambiente.id_ambiente)}
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
