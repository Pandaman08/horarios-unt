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
import { Badge } from "@/components/ui/badge";

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
      setPeriodos(data);
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
    const states: Record<string, { label: string, color: string }> = {
      planificacion: { label: "Planificación", color: "bg-blue-100 text-blue-800" },
      asignacion_horarios: { label: "Asignación", color: "bg-yellow-100 text-yellow-800" },
      en_curso: { label: "En Curso", color: "bg-green-100 text-green-800" },
      finalizado: { label: "Finalizado", color: "bg-gray-100 text-gray-800" },
    };
    const state = states[estado] || states.planificacion;
    return <Badge className={state.color}>{state.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Periodos</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingPeriodo(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Periodo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPeriodo ? "Editar Periodo" : "Nuevo Periodo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código (ej: 2026-I)</Label>
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
                <Label htmlFor="anio">Año</Label>
                <Input
                  id="anio"
                  type="number"
                  value={formData.anio}
                  onChange={(e) => setFormData({ ...formData, anio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semestre">Semestre</Label>
                <Input
                  id="semestre"
                  type="number"
                  min="1"
                  max="2"
                  value={formData.semestre}
                  onChange={(e) => setFormData({ ...formData, semestre: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha Fin</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Estado</Label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) => setFormData({ ...formData, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planificacion">Planificación</SelectItem>
                    <SelectItem value="asignacion_horarios">Asignación de Horarios</SelectItem>
                    <SelectItem value="en_curso">En Curso</SelectItem>
                    <SelectItem value="finalizado">Finalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  {editingPeriodo ? "Actualizar" : "Guardar"}
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
              <TableHead>Año/Semestre</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : periodos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No hay periodos registrados</TableCell>
              </TableRow>
            ) : (
              periodos.map((periodo) => (
                <TableRow key={periodo.id_periodo}>
                  <TableCell className="font-medium">{periodo.codigo}</TableCell>
                  <TableCell>{periodo.nombre}</TableCell>
                  <TableCell>{`${periodo.anio}-${periodo.semestre}`}</TableCell>
                  <TableCell>
                    {new Date(periodo.fecha_inicio).toLocaleDateString()} - {new Date(periodo.fecha_fin).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(periodo.estado)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(periodo)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(periodo.id_periodo)}>
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
