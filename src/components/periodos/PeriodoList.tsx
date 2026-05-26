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
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  Search, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Timer,
  Download,
  FileText
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePeriodo } from "@/contexts/PeriodoContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const context = usePeriodo();
  const periodoSeleccionado = context?.periodoSeleccionado;
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPeriodo, setEditingPeriodo] = useState<Periodo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPeriodos = periodos.filter(p => 
    `${p.nombre} ${p.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredPeriodos.length / itemsPerPage);
  const currentItems = filteredPeriodos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar periodos");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON de /api/periodos:", text.substring(0, 200));
        throw new Error("La respuesta de periodos no es un JSON válido");
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setPeriodos(data);
      } else {
        setPeriodos([]);
      }
    } catch (error: any) {
      console.error("Error en fetchPeriodos:", error);
      toast.error(error.message || "Error al cargar periodos");
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
    try {
      const res = await fetch(`/api/periodos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Periodo eliminado");
        fetchPeriodos();
      } else {
        setErrorMessage(data.error || "Error al eliminar periodo");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
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

  const handleGenerateSelectedPeriodReport = async () => {
    if (!periodoSeleccionado) {
      toast.error("Seleccione un periodo académico primero");
      return;
    }

    setGeneratingReport(999);
    try {
      const url = `/api/reportes?tipo=reporte_periodos&id_periodo=${periodoSeleccionado.id_periodo}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error en la generación');
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Reporte_Periodos_Academicos.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Reporte de periodos descargado");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar reporte");
    } finally {
      setGeneratingReport(null);
    }
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
    const states: Record<string, { label: string, color: string, icon: any }> = {
      planificacion: { label: "Planificación", color: "bg-primary/10 text-primary border-primary/20", icon: Clock },
      asignacion_horarios: { label: "Asignación", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Timer },
      en_curso: { label: "En Curso", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 },
      finalizado: { label: "Finalizado", color: "bg-muted text-muted-foreground border-border", icon: AlertCircle },
    };
    const state = states[estado] || states.planificacion;
    const Icon = state.icon;
    return (
      <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border", state.color)}>
        <Icon className="h-3.5 w-3.5" />
        {state.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Periodos Académicos</h2>
            <p className="text-muted-foreground text-[10px] mt-1">Configuración de ciclos y estados del sistema</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar periodo..." 
              className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-semibold text-[11px] focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleGenerateSelectedPeriodReport} 
            disabled={generatingReport !== null}
            variant="outline"
            className="h-9 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs transition-all"
          >
            {generatingReport !== null ? (
              <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
            ) : (
              <FileText className="mr-2 h-3.5 w-3.5" />
            )}
            Reporte de Periodos
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingPeriodo(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Periodo Académico
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-xl p-6 border-none shadow-2xl bg-card text-foreground">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                      {editingPeriodo ? "Actualizar Periodo" : "Registrar Periodo"}
                    </DialogTitle>
                    <p className="text-muted-foreground text-xs mt-1 font-medium">Gestione los periodos lectivos de la facultad</p>
                  </div>
                </div>
              </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Código del Periodo</Label>
                    <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })} required placeholder="Ej: 2024-I" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre Descriptivo</Label>
                    <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Semestre Académico 2024-I" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Año</Label>
                    <Input type="number" className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.anio} onChange={(e) => setFormData({ ...formData, anio: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Semestre</Label>
                    <Select value={formData.semestre} onValueChange={(val) => setFormData({ ...formData, semestre: val })}>
                      <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border">
                        <SelectItem value="1" className="font-bold text-[11px]">I Semestre</SelectItem>
                        <SelectItem value="2" className="font-bold text-[11px]">II Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Estado</Label>
                    <Select value={formData.estado} onValueChange={(val) => setFormData({ ...formData, estado: val })}>
                      <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border">
                        <SelectItem value="planificacion" className="font-bold text-[11px]">Planificación</SelectItem>
                        <SelectItem value="asignacion_horarios" className="font-bold text-[11px]">Asignación</SelectItem>
                        <SelectItem value="en_curso" className="font-bold text-[11px]">En Curso</SelectItem>
                        <SelectItem value="finalizado" className="font-bold text-[11px]">Finalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha Inicio</Label>
                    <Input type="date" className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.fecha_inicio} onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha Fin</Label>
                    <Input type="date" className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.fecha_fin} onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })} required />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-muted-foreground hover:bg-muted px-6 text-[11px]">Cancelar</Button>
                  <Button type="submit" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                    {editingPeriodo ? "Actualizar" : "Registrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 w-32">Código</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre del Periodo</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Duración</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-32">Estado</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((periodo) => (
                  <TableRow key={periodo.id_periodo} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[10px] font-bold text-primary">{periodo.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="font-bold text-foreground text-[11px]">{periodo.nombre}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-foreground">{format(new Date(periodo.fecha_inicio), "dd MMM yyyy", { locale: es })}</span>
                        <div className="h-3 w-[1px] bg-border my-0.5" />
                        <span className="text-[9px] font-medium text-muted-foreground">{format(new Date(periodo.fecha_fin), "dd MMM yyyy", { locale: es })}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <div className="flex justify-center">{getStatusBadge(periodo.estado)}</div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(periodo)} title="Editar" className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(periodo.id_periodo); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="border-t border-border bg-muted/10"
        />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[24px] border-none shadow-2xl p-8 bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Está completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Esta acción no se puede deshacer. Se eliminará permanentemente el periodo y todos sus horarios y configuraciones asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="h-11 rounded-xl font-bold border-border hover:bg-muted text-foreground">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 transition-all">
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-[24px] border-none shadow-2xl p-8 bg-card text-foreground">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-destructive mb-2">
              <AlertCircle className="h-6 w-6" />
              <AlertDialogTitle className="text-xl font-bold">Error al eliminar</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground font-medium bg-destructive/5 p-4 rounded-xl border border-destructive/10">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-11 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-bold px-8 transition-all">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
