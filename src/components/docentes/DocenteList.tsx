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
import { Plus, Edit, Trash2, BookOpen } from "lucide-react";

interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  modalidad: string;
  categoria: string;
  dedicacion: string;
  antiguedad: number;
  correo_electronico: string;
  telefono: string;
}

export function DocenteList() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);

  const [formData, setFormData] = useState({
    codigo_docente: "",
    nombres: "",
    apellidos: "",
    modalidad: "nombrado",
    categoria: "principal",
    dedicacion: "tiempo_completo",
    antiguedad: "0",
    correo_electronico: "",
    telefono: "",
    grado_academico: "",
    especialidad: "",
  });

  useEffect(() => {
    fetchDocentes();
  }, []);

  const fetchDocentes = async () => {
    try {
      const res = await fetch("/api/docentes");
      const data = await res.json();
      setDocentes(data);
    } catch (error) {
      toast.error("Error al cargar docentes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDocente ? "PUT" : "POST";
    const url = editingDocente 
      ? `/api/docentes/${editingDocente.id_docente}` 
      : "/api/docentes";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingDocente ? "Docente actualizado" : "Docente creado");
        setIsDialogOpen(false);
        setEditingDocente(null);
        resetForm();
        fetchDocentes();
      } else {
        toast.error("Error al guardar docente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este docente?")) return;

    try {
      const res = await fetch(`/api/docentes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Docente eliminado");
        fetchDocentes();
      } else {
        toast.error("Error al eliminar docente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleEdit = (docente: Docente) => {
    setEditingDocente(docente);
    setFormData({
      codigo_docente: docente.codigo_docente,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      modalidad: docente.modalidad,
      categoria: docente.categoria,
      dedicacion: docente.dedicacion,
      antiguedad: docente.antiguedad.toString(),
      correo_electronico: docente.correo_electronico || "",
      telefono: docente.telefono || "",
      grado_academico: "", // Simplificado para el ejemplo
      especialidad: "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo_docente: "",
      nombres: "",
      apellidos: "",
      modalidad: "nombrado",
      categoria: "principal",
      dedicacion: "tiempo_completo",
      antiguedad: "0",
      correo_electronico: "",
      telefono: "",
      grado_academico: "",
      especialidad: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Docentes</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingDocente(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Docente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingDocente ? "Editar Docente" : "Nuevo Docente"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo_docente">Código</Label>
                <Input
                  id="codigo_docente"
                  value={formData.codigo_docente}
                  onChange={(e) => setFormData({ ...formData, codigo_docente: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nombres">Nombres</Label>
                <Input
                  id="nombres"
                  value={formData.nombres}
                  onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos</Label>
                <Input
                  id="apellidos"
                  value={formData.apellidos}
                  onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correo">Correo</Label>
                <Input
                  id="correo"
                  type="email"
                  value={formData.correo_electronico}
                  onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Modalidad</Label>
                <Select
                  value={formData.modalidad}
                  onValueChange={(value) => setFormData({ ...formData, modalidad: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nombrado">Nombrado</SelectItem>
                    <SelectItem value="contratado">Contratado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal</SelectItem>
                    <SelectItem value="asociado">Asociado</SelectItem>
                    <SelectItem value="auxiliar">Auxiliar</SelectItem>
                    <SelectItem value="jefe_practica">Jefe de Práctica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="antiguedad">Antigüedad (años)</Label>
                <Input
                  id="antiguedad"
                  type="number"
                  value={formData.antiguedad}
                  onChange={(e) => setFormData({ ...formData, antiguedad: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  {editingDocente ? "Actualizar" : "Guardar"}
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
              <TableHead>Nombres y Apellidos</TableHead>
              <TableHead>Modalidad</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : docentes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No hay docentes registrados</TableCell>
              </TableRow>
            ) : (
              docentes.map((docente) => (
                <TableRow key={docente.id_docente}>
                  <TableCell>{docente.codigo_docente}</TableCell>
                  <TableCell>{`${docente.nombres} ${docente.apellidos}`}</TableCell>
                  <TableCell className="capitalize">{docente.modalidad}</TableCell>
                  <TableCell className="capitalize">{docente.categoria.replace("_", " ")}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(docente)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(docente.id_docente)}>
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
