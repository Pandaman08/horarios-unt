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

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, cursoId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ambientesRes, asignacionesRes] = await Promise.all([
        fetch("/api/ambientes"),
        fetch(`/api/cursos/${cursoId}/ambientes`),
      ]);

      const ambientesData = await ambientesRes.json();
      const asignacionesData = await asignacionesRes.json();

      setAmbientes(ambientesData);
      setAsignaciones(asignacionesData.map((a: any) => ({
        id_ambiente: a.id_ambiente,
        tipo_clase: a.tipo_clase,
      })));
    } catch (error) {
      toast.error("Error al cargar datos de asignación de ambientes");
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
      const res = await fetch(`/api/cursos/${cursoId}/ambientes`, {
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
      <DialogContent className="w-[95vw] md:w-[90vw] lg:w-[1000px] max-w-6xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[32px] p-10 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle>Ambientes Habilitados para {cursoNombre}</DialogTitle>
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
                    <TableHead>Ambiente</TableHead>
                    <TableHead className="text-center">Teoría</TableHead>
                    <TableHead className="text-center">Laboratorio</TableHead>
                    <TableHead className="text-center">Práctica</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ambientes.map((ambiente) => (
                    <TableRow key={ambiente.id_ambiente}>
                      <TableCell>
                        <div className="font-medium">{ambiente.nombre}</div>
                        <div className="text-xs text-muted-foreground">{ambiente.codigo} - {ambiente.tipo}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(ambiente.id_ambiente, "teoria")}
                          onCheckedChange={() => toggleAsignacion(ambiente.id_ambiente, "teoria")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(ambiente.id_ambiente, "laboratorio")}
                          onCheckedChange={() => toggleAsignacion(ambiente.id_ambiente, "laboratorio")}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={isChecked(ambiente.id_ambiente, "practica")}
                          onCheckedChange={() => toggleAsignacion(ambiente.id_ambiente, "practica")}
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
