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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Pagination } from "@/components/ui/pagination";

interface AsignarCursosDialogProps {
  docenteId: number;
  docenteNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DocenteCurso {
  id_curso: number;
  tipo_clase: string;
}

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  tipo_curso: string;
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
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const cursosFiltrados = cursos.filter(c => 
    tipoFiltro === "todos" || c.tipo_curso === tipoFiltro
  );

  const totalPages = Math.ceil(cursosFiltrados.length / itemsPerPage);
  const currentItems = cursosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [tipoFiltro, isOpen]);

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

      const processRes = async (res: Response, name: string) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const errorData = contentType?.includes("application/json") ? await res.json() : {};
          throw new Error(errorData.error || `Error al cargar ${name}`);
        }
        return res.json();
      };

      const [cursosData, asignacionesData] = await Promise.all([
        processRes(cursosRes, "cursos"),
        processRes(asignacionesRes, "asignaciones"),
      ]);

      setCursos(Array.isArray(cursosData) ? cursosData : []);
      setAsignaciones(Array.isArray(asignacionesData) ? asignacionesData.map((a: any) => ({
        id_curso: a.id_curso,
        tipo_clase: a.tipo_clase.toLowerCase(),
      })) : []);
    } catch (error: any) {
      console.error("Error en fetchData:", error);
      toast.error(error.message || "Error al cargar datos de asignación");
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
      <DialogContent className="w-[95vw] md:w-[90vw] lg:w-[1000px] max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[32px] p-10 border-none shadow-2xl bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Asignar Cursos a {docenteNombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-muted/50 p-4 rounded-2xl border border-border">
              <div className="space-y-1.5 flex-1 max-w-[300px]">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">Filtrar por Tipo</Label>
                <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                  <SelectTrigger className="h-11 rounded-xl border-2 border-input bg-card font-bold text-foreground">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border shadow-xl bg-card">
                    <SelectItem value="todos" className="font-bold">Todos los tipos</SelectItem>
                    <SelectItem value="general" className="font-bold">General</SelectItem>
                    <SelectItem value="linea_carrera" className="font-bold">Línea de Carrera</SelectItem>
                    <SelectItem value="electivo" className="font-bold">Electivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Curso</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Teoría</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Laboratorio</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Práctica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {currentItems.map((curso) => (
                    <TableRow key={curso.id_curso} className="hover:bg-muted/30 border-b border-border last:border-0 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{curso.nombre}</div>
                        <div className="text-xs text-muted-foreground">{curso.codigo}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(curso.id_curso, "teoria")}
                          onCheckedChange={() => toggleAsignacion(curso.id_curso, "teoria")}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(curso.id_curso, "laboratorio")}
                          onCheckedChange={() => toggleAsignacion(curso.id_curso, "laboratorio")}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(curso.id_curso, "practica")}
                          onCheckedChange={() => toggleAsignacion(curso.id_curso, "practica")}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} className="rounded-xl border-border hover:bg-muted text-foreground">Cancelar</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-xl bg-primary text-primary-foreground hover:bg-primary/90">
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
