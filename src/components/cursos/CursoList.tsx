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
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { AsignarAmbientesDialog } from "./AsignarAmbientesDialog";

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  horas_teoria: number;
  horas_laboratorio: number;
  horas_practica: number;
  creditos: number;
  ciclo: number;
}

export function CursoList() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [isAmbientesOpen, setIsAmbientesOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    horas_teoria: "0",
    horas_laboratorio: "0",
    horas_practica: "0",
    creditos: "0",
    ciclo: "",
    plan_estudios: "",
    prerequisitos: "",
  });

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      const res = await fetch("/api/cursos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCursos(data);
      } else {
        setCursos([]);
      }
    } catch (error) {
      toast.error("Error al cargar cursos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCurso ? "PUT" : "POST";
    const url = editingCurso 
      ? `/api/cursos/${editingCurso.id_curso}` 
      : "/api/cursos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCurso ? "Curso actualizado" : "Curso creado");
        setIsDialogOpen(false);
        setEditingCurso(null);
        resetForm();
        fetchCursos();
      } else {
        toast.error("Error al guardar curso");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este curso?")) return;

    try {
      const res = await fetch(`/api/cursos/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Curso eliminado");
        fetchCursos();
      } else {
        toast.error("Error al eliminar curso");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      codigo: curso.codigo,
      nombre: curso.nombre,
      horas_teoria: curso.horas_teoria.toString(),
      horas_laboratorio: curso.horas_laboratorio.toString(),
      horas_practica: curso.horas_practica.toString(),
      creditos: curso.creditos.toString(),
      ciclo: curso.ciclo?.toString() || "",
      plan_estudios: "",
      prerequisitos: "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      horas_teoria: "0",
      horas_laboratorio: "0",
      horas_practica: "0",
      creditos: "0",
      ciclo: "",
      plan_estudios: "",
      prerequisitos: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gestión de Cursos</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCurso(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCurso ? "Editar Curso" : "Nuevo Curso"}</DialogTitle>
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
                <Label htmlFor="horas_teoria">Horas Teoría</Label>
                <Input
                  id="horas_teoria"
                  type="number"
                  value={formData.horas_teoria}
                  onChange={(e) => setFormData({ ...formData, horas_teoria: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horas_laboratorio">Horas Laboratorio</Label>
                <Input
                  id="horas_laboratorio"
                  type="number"
                  value={formData.horas_laboratorio}
                  onChange={(e) => setFormData({ ...formData, horas_laboratorio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditos">Créditos</Label>
                <Input
                  id="creditos"
                  type="number"
                  value={formData.creditos}
                  onChange={(e) => setFormData({ ...formData, creditos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ciclo">Ciclo</Label>
                <Input
                  id="ciclo"
                  type="number"
                  value={formData.ciclo}
                  onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                />
              </div>
              <div className="col-span-2">
                <Button type="submit" className="w-full">
                  {editingCurso ? "Actualizar" : "Guardar"}
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
              <TableHead>HT / HL</TableHead>
              <TableHead>Créditos</TableHead>
              <TableHead>Ciclo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Cargando...</TableCell>
              </TableRow>
            ) : cursos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">No hay cursos registrados</TableCell>
              </TableRow>
            ) : (
              cursos.map((curso) => (
                <TableRow key={curso.id_curso}>
                  <TableCell>{curso.codigo}</TableCell>
                  <TableCell>{curso.nombre}</TableCell>
                  <TableCell>{`${curso.horas_teoria} / ${curso.horas_laboratorio}`}</TableCell>
                  <TableCell>{curso.creditos}</TableCell>
                  <TableCell>{curso.ciclo}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        title="Asignar Ambientes"
                        onClick={() => {
                          setSelectedCurso(curso);
                          setIsAmbientesOpen(true);
                        }}
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleEdit(curso)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(curso.id_curso)}>
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

      {selectedCurso && (
        <AsignarAmbientesDialog
          cursoId={selectedCurso.id_curso}
          cursoNombre={selectedCurso.nombre}
          isOpen={isAmbientesOpen}
          onClose={() => {
            setIsAmbientesOpen(false);
            setSelectedCurso(null);
          }}
        />
      )}
    </div>
  );
}
