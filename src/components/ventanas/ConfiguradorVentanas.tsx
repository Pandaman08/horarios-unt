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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Wand2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Ventana {
  id_ventana: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  modalidad: string;
  categoria: string;
  cantidad_docentes: number;
  completado: boolean;
}

interface Periodo {
  id_periodo: number;
  codigo: string;
}

export function ConfiguradorVentanas() {
  const [ventanas, setVentanas] = useState<Ventana[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isAutoDialogOpen, setIsAutoDialogOpen] = useState(false);
  const [stats, setStats] = useState<any>(null);

  const [autoFormData, setAutoFormData] = useState({
    fecha_inicio: format(new Date(), "yyyy-MM-dd"),
    hora_inicio_jornada: "08:00",
    hora_fin_jornada: "18:00",
    intervalo_por_docente: "15",
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchVentanas();
    }
  }, [selectedPeriodo]);

  const fetchData = async () => {
    try {
      const [periodosRes, statsRes] = await Promise.all([
        fetch("/api/periodos"),
        fetch("/api/ventanas?stats=true"),
      ]);
      const periodosData = await periodosRes.json();
      const statsData = await statsRes.json();
      
      setPeriodos(periodosData);
      setStats(statsData);
      if (periodosData.length > 0) {
        setSelectedPeriodo(periodosData[0].id_periodo.toString());
      }
    } catch (error) {
      toast.error("Error al cargar datos iniciales");
    } finally {
      setLoading(false);
    }
  };

  const fetchVentanas = async () => {
    try {
      const res = await fetch(`/api/ventanas?id_periodo=${selectedPeriodo}`);
      const data = await res.json();
      setVentanas(data);
    } catch (error) {
      toast.error("Error al cargar ventanas");
    }
  };

  const handleAutoSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodo) {
      toast.error("Seleccione un periodo primero");
      return;
    }

    try {
      const res = await fetch("/api/ventanas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...autoFormData,
          id_periodo: selectedPeriodo,
          programacion_automatica: true,
        }),
      });

      if (res.ok) {
        toast.success("Ventanas programadas exitosamente");
        setIsAutoDialogOpen(false);
        fetchVentanas();
      } else {
        toast.error("Error al programar ventanas");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta ventana?")) return;
    try {
      const res = await fetch(`/api/ventanas/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Ventana eliminada");
        fetchVentanas();
      }
    } catch (error) {
      toast.error("Error al eliminar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ventanas de Atención</CardTitle>
            <div className="flex space-x-2">
              <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id_periodo} value={p.id_periodo.toString()}>
                      {p.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Wand2 className="mr-2 h-4 w-4" /> Programación Auto
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Programar Ventanas Automáticamente</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAutoSchedule} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <Input
                        type="date"
                        value={autoFormData.fecha_inicio}
                        onChange={(e) => setAutoFormData({ ...autoFormData, fecha_inicio: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hora Inicio Jornada</Label>
                        <Input
                          type="time"
                          value={autoFormData.hora_inicio_jornada}
                          onChange={(e) => setAutoFormData({ ...autoFormData, hora_inicio_jornada: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hora Fin Jornada</Label>
                        <Input
                          type="time"
                          value={autoFormData.hora_fin_jornada}
                          onChange={(e) => setAutoFormData({ ...autoFormData, hora_fin_jornada: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Minutos por Docente</Label>
                      <Input
                        type="number"
                        value={autoFormData.intervalo_por_docente}
                        onChange={(e) => setAutoFormData({ ...autoFormData, intervalo_por_docente: e.target.value })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">Generar Ventanas</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Horario</TableHead>
                  <TableHead>Modalidad / Categoría</TableHead>
                  <TableHead>Docentes</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ventanas.map((v) => (
                  <TableRow key={v.id_ventana}>
                    <TableCell>{format(new Date(v.fecha), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{`${v.hora_inicio} - ${v.hora_fin}`}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="capitalize text-sm font-medium">{v.modalidad}</span>
                        <span className="capitalize text-xs text-muted-foreground">{v.categoria.replace("_", " ")}</span>
                      </div>
                    </TableCell>
                    <TableCell>{v.cantidad_docentes}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id_ventana)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen Docentes</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="space-y-4">
                {Object.entries(stats).map(([modalidad, categorias]: [string, any]) => (
                  <div key={modalidad} className="space-y-2">
                    <h4 className="font-bold capitalize border-b pb-1">{modalidad}s</h4>
                    {Object.entries(categorias).map(([cat, count]: [string, any]) => (
                      <div key={cat} className="flex justify-between items-center text-sm">
                        <span className="capitalize">{cat.replace("_", " ")}</span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
