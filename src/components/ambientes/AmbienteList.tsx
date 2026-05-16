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
import { Plus, Edit, Trash2 } from "lucide-react";

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Ambientes</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingAmbiente(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Ambiente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAmbiente ? "Editar Ambiente" : "Nuevo Ambiente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código</Label>
                <Input
                  id="codigo"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aula">Aula</SelectItem>
                    <SelectItem value="laboratorio">Laboratorio</SelectItem>
                    <SelectItem value="auditorio">Auditorio</SelectItem>
                    <SelectItem value="sala_reuniones">Sala de Reuniones</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad</Label>
                <Input
                  id="capacidad"
                  type="number"
                  value={formData.capacidad}
                  onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="piso">Piso</Label>
                <Input
                  id="piso"
                  value={formData.piso}
                  onChange={(e) => setFormData({ ...formData, piso: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pabellon">Pabellón</Label>
                <Input
                  id="pabellon"
                  value={formData.pabellon}
                  onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  {editingAmbiente ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : ambientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No hay ambientes registrados</TableCell>
              </TableRow>
            ) : (
              ambientes.map((ambiente) => (
                <TableRow key={ambiente.id_ambiente}>
                  <TableCell>{ambiente.codigo}</TableCell>
                  <TableCell>{ambiente.nombre}</TableCell>
                  <TableCell className="capitalize">{ambiente.tipo}</TableCell>
                  <TableCell>{ambiente.capacidad}</TableCell>
                  <TableCell>{`${ambiente.pabellon} - Piso ${ambiente.piso}`}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(ambiente)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(ambiente.id_ambiente)}>
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
  );
}
