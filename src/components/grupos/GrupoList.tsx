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

interface Grupo {
  id_grupo: number;
  id_curso: number;
  id_periodo: number;
  codigo_grupo: string;
  capacidad_maxima: number;
  curso: { nombre: string; codigo: string };
  periodo: { codigo: string };
}

interface Curso {
  id_curso: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  id_periodo: number;
  codigo: string;
}

export function GrupoList() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);

  const [formData, setFormData] = useState({
    id_curso: "",
    id_periodo: "",
    codigo_grupo: "",
    capacidad_maxima: "40",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gruposRes, cursosRes, periodosRes] = await Promise.all([
        fetch("/api/grupos"),
        fetch("/api/cursos"),
        fetch("/api/periodos"),
      ]);
      const [gruposData, cursosData, periodosData] = await Promise.all([
        gruposRes.json(),
        cursosRes.json(),
        periodosRes.json(),
      ]);
      setGrupos(gruposData);
      setCursos(cursosData);
      setPeriodos(periodosData);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingGrupo ? "PUT" : "POST";
    const url = editingGrupo 
      ? `/api/grupos/${editingGrupo.id_grupo}` 
      : "/api/grupos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingGrupo ? "Grupo actualizado" : "Grupo creado");
        setIsDialogOpen(false);
        setEditingGrupo(null);
        resetForm();
        fetchData();
      } else {
        toast.error("Error al guardar grupo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este grupo?")) return;

    try {
      const res = await fetch(`/api/grupos/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Grupo eliminado");
        fetchData();
      } else {
        toast.error("Error al eliminar grupo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setFormData({
      id_curso: grupo.id_curso.toString(),
      id_periodo: grupo.id_periodo.toString(),
      codigo_grupo: grupo.codigo_grupo,
      capacidad_maxima: grupo.capacidad_maxima.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id_curso: "",
      id_periodo: "",
      codigo_grupo: "",
      capacidad_maxima: "40",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Grupos</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingGrupo(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingGrupo ? "Editar Grupo" : "Nuevo Grupo"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Periodo</Label>
                <Select
                  value={formData.id_periodo}
                  onValueChange={(value) => setFormData({ ...formData, id_periodo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p.id_periodo} value={p.id_periodo.toString()}>
                        {p.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curso</Label>
                <Select
                  value={formData.id_curso}
                  onValueChange={(value) => setFormData({ ...formData, id_curso: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {cursos.map((c) => (
                      <SelectItem key={c.id_curso} value={c.id_curso.toString()}>
                        {`${c.codigo} - ${c.nombre}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="codigo_grupo">Código Grupo (A, B, C1...)</Label>
                <Input
                  id="codigo_grupo"
                  value={formData.codigo_grupo}
                  onChange={(e) => setFormData({ ...formData, codigo_grupo: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad Máxima</Label>
                <Input
                  id="capacidad"
                  type="number"
                  value={formData.capacidad_maxima}
                  onChange={(e) => setFormData({ ...formData, capacidad_maxima: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingGrupo ? "Actualizar" : "Guardar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Periodo</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : grupos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">No hay grupos registrados</TableCell>
              </TableRow>
            ) : (
              grupos.map((grupo) => (
                <TableRow key={grupo.id_grupo}>
                  <TableCell>{grupo.periodo.codigo}</TableCell>
                  <TableCell>{`${grupo.curso.codigo} - ${grupo.curso.nombre}`}</TableCell>
                  <TableCell>{grupo.codigo_grupo}</TableCell>
                  <TableCell>{grupo.capacidad_maxima}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(grupo)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(grupo.id_grupo)}>
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
