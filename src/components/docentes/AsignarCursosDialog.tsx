"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface AsignarCursosDialogProps {
  docenteId: number;
  docenteNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
}

interface DocenteCurso {
  id_curso: number;
  tipo_clase: string;
}

export function AsignarCursosDialog({
  docenteId,
  docenteNombre,
  isOpen,
  onClose,
}: AsignarCursosDialogProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [asignaciones, setAsignaciones] = useState<DocenteCurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, docenteId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cursosRes, asignacionesRes] = await Promise.all([
        fetch("/api/cursos"),
        fetch(`/api/docentes/${docenteId}/cursos`),
      ]);

      const cursosData = await cursosRes.json();
      const asignacionesData = await asignacionesRes.json();

      setCursos(cursosData);
      setAsignaciones(asignacionesData.map((a: any) => ({
        id_curso: a.id_curso,
        tipo_clase: a.tipo_clase.toLowerCase(), // Normalizar a minúsculas
      })));
    } catch (error) {
      toast.error("Error al cargar datos de asignación");
    } finally {
      setLoading(false);
    }
  };

  const toggleAsignacion = (id_curso: number, tipo_clase: string) => {
    setAsignaciones((prev) => {
      const exists = prev.find(
        (a) => a.id_curso === id_curso && a.tipo_clase.toLowerCase() === tipo_clase.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (a) => !(a.id_curso === id_curso && a.tipo_clase.toLowerCase() === tipo_clase.toLowerCase())
        );
      } else {
        return [...prev, { id_curso, tipo_clase: tipo_clase.toLowerCase() }];
      }
    });
  };

  const isChecked = (id_curso: number, tipo_clase: string) => {
    return !!asignaciones.find(
      (a) => a.id_curso === id_curso && a.tipo_clase.toLowerCase() === tipo_clase.toLowerCase()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/docentes/${docenteId}/cursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asignaciones),
      });

      if (res.ok) {
        toast.success("Cursos asignados correctamente");
        onClose();
      } else {
        toast.error("Error al guardar asignaciones");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Cursos a {docenteNombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead className="text-center">Teoría</TableHead>
                    <TableHead className="text-center">Laboratorio</TableHead>
                    <TableHead className="text-center">Práctica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursos.map((curso) => (
                    <TableRow key={curso.id_curso}>
                      <TableCell>
                        <div className="font-medium">{curso.nombre}</div>
                        <div className="text-xs text-muted-foreground">{curso.codigo}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(curso.id_curso, "teoria")}
                          onCheckedChange={() => toggleAsignacion(curso.id_curso, "teoria")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(curso.id_curso, "laboratorio")}
                          onCheckedChange={() => toggleAsignacion(curso.id_curso, "laboratorio")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(curso.id_curso, "practica")}
                          onCheckedChange={() => toggleAsignacion(curso.id_curso, "practica")}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
