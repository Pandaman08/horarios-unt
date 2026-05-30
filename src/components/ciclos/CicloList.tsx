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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Layers,
  RefreshCw,
  Calendar,
  Download,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
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

import { Pagination } from "@/components/ui/pagination";
import { usePeriodo } from "@/contexts/PeriodoContext";

interface Ciclo {
  id_ciclo: number;
  numero: number;
  nombre: string;
  activo: boolean;
}

export function CicloList() {
  const context = usePeriodo();
  const periodoSeleccionado = context?.periodoSeleccionado;
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCiclo, setEditingCiclo] = useState<Ciclo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);
  const [semestre, setSemestre] = useState<number>(1);

  // Sincronizar semestre con el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionado) {
      setSemestre(periodoSeleccionado.semestre);
    }
  }, [periodoSeleccionado]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCiclos = ciclos.filter(c => {
    const matchesSearch = `${c.nombre} ${c.numero}`.toLowerCase().includes(searchTerm.toLowerCase());
    const isPar = c.numero % 2 === 0;
    // Si el periodo es 1 (I), ciclos impares. Si es 2 (II), ciclos pares.
    const matchesSemestre = (semestre === 1 && !isPar) || (semestre === 2 && isPar);
    return matchesSearch && matchesSemestre;
  });

  const totalPages = Math.ceil(filteredCiclos.length / itemsPerPage);
  const currentItems = filteredCiclos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    numero: "",
    nombre: "",
  });

  useEffect(() => {
    fetchCiclos();
  }, []);

  const fetchCiclos = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ciclos");
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json")
          ? await res.json()
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar ciclos");
      }

      const data = await res.json();
      setCiclos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error en fetchCiclos:", error);
      toast.error(error.message || "Error al cargar ciclos");
      setCiclos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCiclo ? "PUT" : "POST";
    const url = editingCiclo
      ? `/api/ciclos/${editingCiclo.id_ciclo}`
      : "/api/ciclos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          numero: parseInt(formData.numero)
        }),
      });

      if (res.ok) {
        toast.success(editingCiclo ? "Ciclo actualizado" : "Ciclo creado");
        setIsDialogOpen(false);
        setEditingCiclo(null);
        setFormData({ numero: "", nombre: "" });
        fetchCiclos();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al guardar ciclo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/ciclos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Ciclo eliminado");
        fetchCiclos();
      } else {
        toast.error(data.error || "Error al eliminar ciclo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (ciclo: Ciclo) => {
    setEditingCiclo(ciclo);
    setFormData({
      numero: ciclo.numero.toString(),
      nombre: ciclo.nombre,
    });
    setIsDialogOpen(true);
  };

  const handleGenerateConsolidatedReport = async () => {
    if (!periodoSeleccionado) {
      toast.error("Seleccione un periodo académico primero");
      return;
    }

    setGeneratingReport(999);
    try {
      const url = `/api/reportes/pdf?tipo=ciclos_todos&id_periodo=${periodoSeleccionado.id_periodo}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error en la generación');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `Consolidado_Horarios_Ciclos.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Consolidado de ciclos descargado");
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar reporte");
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-3 rounded-xl border border-border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Ciclos Académicos</h2>
            <p className="text-muted-foreground text-[10px] mt-1">Gestión de niveles de progresión académica</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar ciclo..."
              className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-semibold text-[11px] focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button
            onClick={handleGenerateConsolidatedReport}
            disabled={generatingReport !== null}
            variant="outline"
            className="h-9 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs transition-all"
          >
            {generatingReport !== null ? (
              <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
            ) : (
              <FileText className="mr-2 h-3.5 w-3.5" />
            )}
            Reporte de lista de ciclos
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Ciclo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-xl p-6 border-none shadow-2xl bg-card text-foreground">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <Layers className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                      {editingCiclo ? "Actualizar Ciclo" : "Registrar Ciclo"}
                    </DialogTitle>
                    <p className="text-muted-foreground text-xs mt-1 font-medium">Configure los datos básicos del ciclo</p>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Número</Label>
                    <Input
                      type="number"
                      className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all"
                      value={formData.numero}
                      onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                      required
                      min={1}
                      max={12}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                    <Input
                      className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      required
                      placeholder="Ej: I Ciclo"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-muted-foreground hover:bg-muted px-6 text-[11px]">Cancelar</Button>
                  <Button type="submit" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                    {editingCiclo ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[600px] w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-24">Nivel</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre del Ciclo</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-24">Estado</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>

              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((ciclo) => (
                  <TableRow key={ciclo.id_ciclo} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2 text-center">
                      <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary font-black text-[10px]">
                        {ciclo.numero}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="font-bold text-foreground text-[11px] uppercase">{ciclo.nombre}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border",
                        ciclo.activo
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      )}>
                        {ciclo.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ciclo)} title="Editar" className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(ciclo.id_ciclo); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all">
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el ciclo y sus registros asociados.
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
    </div>
  );
}
