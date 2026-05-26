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

interface AsignarAmbientesDialogProps {
  cursoId: number;
  cursoNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

interface Ambiente {
  id_ambiente: number;
  codigo: string;
  nombre: string;
  tipo: string;
}

interface CursoAmbiente {
  id_ambiente: number;
  tipo_clase: string;
}

export function AsignarAmbientesDialog({
  cursoId,
  cursoNombre,
  isOpen,
  onClose,
}: AsignarAmbientesDialogProps) {
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [asignaciones, setAsignaciones] = useState<CursoAmbiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const ambientesFiltrados = ambientes.filter(a => 
    tipoFiltro === "todos" || a.tipo === tipoFiltro
  );

  const totalPages = Math.ceil(ambientesFiltrados.length / itemsPerPage);
  const currentItems = ambientesFiltrados.slice(
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
  }, [isOpen, cursoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const [ambientesRes, asignacionesRes] = await Promise.all([
        fetch(`${apiUrl}/api/ambientes`),
        fetch(`${apiUrl}/api/cursos/${cursoId}/ambientes`),
      ]);

      const processRes = async (res: Response, name: string) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const errorData = contentType?.includes("application/json") ? await res.json() : {};
          throw new Error(errorData.error || `Error al cargar ${name}`);
        }
        return res.json();
      };

      const [ambientesData, asignacionesData] = await Promise.all([
        processRes(ambientesRes, "ambientes"),
        processRes(asignacionesRes, "asignaciones"),
      ]);

      setAmbientes(Array.isArray(ambientesData) ? ambientesData : []);
      setAsignaciones(Array.isArray(asignacionesData) ? asignacionesData.map((a: any) => ({
        id_ambiente: a.id_ambiente,
        tipo_clase: a.tipo_clase,
      })) : []);
    } catch (error: any) {
      console.error("Error en fetchData:", error);
      toast.error(error.message || "Error al cargar datos de asignación de ambientes");
    } finally {
      setLoading(false);
    }
  };

  const toggleAsignacion = (id_ambiente: number, tipo_clase: string) => {
    setAsignaciones((prev) => {
      const exists = prev.find(
        (a) => a.id_ambiente === id_ambiente && a.tipo_clase === tipo_clase
      );
      if (exists) {
        return prev.filter(
          (a) => !(a.id_ambiente === id_ambiente && a.tipo_clase === tipo_clase)
        );
      } else {
        return [...prev, { id_ambiente, tipo_clase }];
      }
    });
  };

  const isChecked = (id_ambiente: number, tipo_clase: string) => {
    return !!asignaciones.find(
      (a) => a.id_ambiente === id_ambiente && a.tipo_clase === tipo_clase
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(`${apiUrl}/api/cursos/${cursoId}/ambientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asignaciones),
      });

      if (res.ok) {
        toast.success("Ambientes asignados correctamente");
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
          <DialogTitle className="text-xl font-bold">Ambientes Habilitados para {cursoNombre}</DialogTitle>
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
                    <SelectItem value="aula" className="font-bold">Aula Teórica</SelectItem>
                    <SelectItem value="laboratorio" className="font-bold">Laboratorio</SelectItem>
                    <SelectItem value="auditorio" className="font-bold">Auditorio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="border border-border rounded-2xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b border-border hover:bg-transparent">
                    <TableHead className="font-black uppercase tracking-widest text-[10px] text-muted-foreground">Ambiente</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Teoría</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Laboratorio</TableHead>
                    <TableHead className="text-center font-black uppercase tracking-widest text-[10px] text-muted-foreground">Práctica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {currentItems.map((ambiente) => (
                    <TableRow key={ambiente.id_ambiente} className="hover:bg-muted/30 border-b border-border last:border-0 transition-colors">
                      <TableCell>
                        <div className="font-medium text-foreground">{ambiente.nombre}</div>
                        <div className="text-xs text-muted-foreground">{ambiente.codigo} - {ambiente.tipo}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(ambiente.id_ambiente, "teoria")}
                          onCheckedChange={() => toggleAsignacion(ambiente.id_ambiente, "teoria")}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(ambiente.id_ambiente, "laboratorio")}
                          onCheckedChange={() => toggleAsignacion(ambiente.id_ambiente, "laboratorio")}
                          className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(ambiente.id_ambiente, "practica")}
                          onCheckedChange={() => toggleAsignacion(ambiente.id_ambiente, "practica")}
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
