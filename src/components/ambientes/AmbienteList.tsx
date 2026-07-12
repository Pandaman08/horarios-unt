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
  Search,
  MapPin,
  Users,
  Building2,
  DoorOpen,
  Monitor,
  AlertTriangle,
  Info,
  Filter,
  AlertCircle,
  Download,
  FileText,
  FileSpreadsheet
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
import { useDepartment } from "@/contexts/DepartmentContext";

interface Facultad {
  id: string;
  nombre: string;
  codigo: string;
}

interface Ambiente {
  id_ambiente: number;
  codigo: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  piso: string;
  pabellon: string;
  facultadId?: string;
  facultad?: Facultad;
}

export function AmbienteList() {
  const context = usePeriodo();
  const periodoSeleccionado = context?.periodoSeleccionado;
  const { departamentoSeleccionado, facultadSeleccionada } = useDepartment();
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAmbiente, setEditingAmbiente] = useState<Ambiente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);
  const [facultades, setFacultades] = useState<Facultad[]>([]);

  // Estados de Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [capacidadMin, setCapacidadMin] = useState<string>("");
  const [capacidadMax, setCapacidadMax] = useState<string>("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredAmbientes = ambientes.filter(a => {
    const matchesSearch = `${a.nombre} ${a.codigo} ${a.pabellon}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filtroTipo === "todos" || a.tipo === filtroTipo;

    const cMin = parseInt(capacidadMin) || 0;
    const cMax = parseInt(capacidadMax) || 50;
    const matchesCapacidad = a.capacidad >= cMin && a.capacidad <= cMax;

    return matchesSearch && matchesTipo && matchesCapacidad;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredAmbientes.length / itemsPerPage);
  const currentItems = filteredAmbientes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroTipo, capacidadMin, capacidadMax]);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    tipo: "aula",
    capacidad: "40",
    piso: "",
    pabellon: "",
    equipamiento: "",
    facultadId: "",
  });

  const fetchFacultades = async () => {
    try {
      const res = await fetch("/api/facultades");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFacultades(data);
      }
    } catch (error: any) {
      console.error("Error al cargar facultades:", error);
    }
  };

  useEffect(() => {
    fetchFacultades();
  }, []);

  useEffect(() => {
    fetchAmbientes();
  }, [departamentoSeleccionado, facultadSeleccionada]);

  const fetchAmbientes = async () => {
    try {
      let url = "/api/ambientes";
      const params = new URLSearchParams();
      if (facultadSeleccionada) {
        params.set('facultadId', facultadSeleccionada.id);
      }
      if (departamentoSeleccionado) {
        params.set('departamentoId', departamentoSeleccionado.id);
      }
      if (params.toString()) {
        url = `${url}?${params.toString()}`;
      }
      const res = await fetch(url);
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json")
          ? await res.json()
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar ambientes");
      }

      const data = await res.json();
      setAmbientes(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error en fetchAmbientes:", error);
      toast.error(error.message || "Error al cargar ambientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar capacidad máxima
    if (parseInt(formData.capacidad) > 50) {
      toast.error("La capacidad máxima permitida es de 50 personas");
      return;
    }

    const method = editingAmbiente ? "PUT" : "POST";
    const url = editingAmbiente
      ? `/api/ambientes/${editingAmbiente.id_ambiente}`
      : "/api/ambientes";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingAmbiente ? "Ambiente actualizado" : "Ambiente creado");
        setIsDialogOpen(false);
        setEditingAmbiente(null);
        resetForm();
        fetchAmbientes();
      } else {
        toast.error("Error al guardar ambiente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/ambientes/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Ambiente eliminado");
        fetchAmbientes();
      } else {
        setErrorMessage(data.error || "Error al eliminar ambiente");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (ambiente: Ambiente) => {
    setEditingAmbiente(ambiente);
    setFormData({
      codigo: ambiente.codigo,
      nombre: ambiente.nombre,
      tipo: ambiente.tipo,
      capacidad: ambiente.capacidad.toString(),
      piso: ambiente.piso || "",
      pabellon: ambiente.pabellon || "",
      equipamiento: "",
      facultadId: ambiente.facultadId || "",
    });
    setIsDialogOpen(true);
  };

  const handleGenerateConsolidatedReport = async (formato: 'pdf' | 'excel' = 'pdf') => {
    if (!periodoSeleccionado) {
      toast.error("Seleccione un periodo académico primero");
      return;
    }

    setGeneratingReport(999);
    try {
      const url = `/api/reportes/pdf?tipo=reporte_ambientes&id_periodo=${periodoSeleccionado.id_periodo}&formato=${formato}`;
      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Error en la generación');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const extension = formato === 'excel' ? 'xlsx' : 'pdf';
      a.download = `Reporte_Ambientes_Academicos.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Reporte de ambientes (${formato.toUpperCase()}) descargado`);
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
      tipo: "aula",
      capacidad: "40",
      piso: "",
      pabellon: "",
      equipamiento: "",
      facultadId: "",
    });
  };

  return (
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <MapPin className="page-icon" />
            </div>
            <div>
              <h2 className="page-title">Ambientes Académicos</h2>
              <p className="page-subtitle">Gestión de aulas, laboratorios y espacios físicos</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar ambiente..."
                className="page-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleGenerateConsolidatedReport('pdf')}
                disabled={generatingReport === 999}
                variant="outline"
                className="page-btn"
              >
                {generatingReport === 999 ? (
                  <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
                ) : (
                  <FileText className="mr-2 h-3.5 w-3.5" />
                )}
                Reporte de lista de ambientes
              </Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingAmbiente(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="page-btn bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Ambiente
                </Button>
              </DialogTrigger>
              <DialogContent className="page-modal">
                <DialogHeader className="page-modal-header">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                      {editingAmbiente ? <Edit className="h-4 w-4 text-primary" /> : <Plus className="h-4 w-4 text-primary" />}
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">{editingAmbiente ? "Editar Ambiente" : "Nuevo Ambiente"}</DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{editingAmbiente ? "Modificar datos del ambiente" : "Registrar un nuevo ambiente"}</p>
                    </div>
                  </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="page-modal-body space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Código</Label>
                      <Input value={formData.codigo} onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} className="page-modal-input" placeholder="A101" required />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Nombre</Label>
                      <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="page-modal-input" placeholder="Aula Magna" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                        <SelectTrigger className="page-modal-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          <SelectItem value="aula" className="font-bold">Aula Común</SelectItem>
                          <SelectItem value="laboratorio" className="font-bold">Laboratorio</SelectItem>
                          <SelectItem value="taller" className="font-bold">Taller</SelectItem>
                          <SelectItem value="auditorio" className="font-bold">Auditorio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Capacidad</Label>
                      <Input type="number" value={formData.capacidad} onChange={(e) => setFormData({ ...formData, capacidad: e.target.value })} className="page-modal-input" />
                    </div>
                  </div>

                  <div className="page-modal-field">
                    <Label className="page-modal-label">Facultad / Sede</Label>
                    <Select value={formData.facultadId} onValueChange={(v) => setFormData({ ...formData, facultadId: v })}>
                      <SelectTrigger className="page-modal-input">
                        <SelectValue placeholder="Seleccione facultad" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border">
                        {facultades.map((f) => (
                          <SelectItem key={f.id} value={f.id} className="font-bold">{f.codigo} - {f.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Pabellón</Label>
                      <Input value={formData.pabellon} onChange={(e) => setFormData({ ...formData, pabellon: e.target.value })} className="page-modal-input" placeholder="Pabellón A" />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Piso</Label>
                      <Input value={formData.piso} onChange={(e) => setFormData({ ...formData, piso: e.target.value })} className="page-modal-input" placeholder="1er Piso" />
                    </div>
                  </div>

                  <div className="page-modal-footer border-t border-border pt-4">
                    <div className="page-actions-row justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="page-modal-btn-cancel">Cancelar</Button>
                      <Button type="submit" className="page-modal-btn-submit">
                        {editingAmbiente ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="page-filters">
          <div className="space-y-1.5">
            <Label className="font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Ambiente</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="page-filter-select rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="font-bold">Todos los tipos</SelectItem>
                <SelectItem value="aula" className="font-bold">Aula Común</SelectItem>
                <SelectItem value="laboratorio" className="font-bold">Laboratorio</SelectItem>
                <SelectItem value="taller" className="font-bold">Taller</SelectItem>
                <SelectItem value="auditorio" className="font-bold">Auditorio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="font-black uppercase tracking-widest text-muted-foreground ml-1">Capacidad Mínima</Label>
            <Input
              type="number"
              value={capacidadMin}
              onChange={(e) => setCapacidadMin(e.target.value)}
              className="rounded-lg bg-muted/30 border-border font-bold"
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-black uppercase tracking-widest text-muted-foreground ml-1">Capacidad Máxima</Label>
            <Input
              type="number"
              value={capacidadMax}
              onChange={(e) => setCapacidadMax(e.target.value)}
              className="rounded-lg bg-muted/30 border-border font-bold"
              placeholder="50"
            />
          </div>
        </div>
      </div>

      <div className="page-table-card">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 w-24">Cód.</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Ambiente</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Facultad</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Ubicación</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-32">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-24">Cap.</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((ambiente) => (
                  <TableRow key={ambiente.id_ambiente} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{ambiente.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary">
                          {ambiente.tipo === 'laboratorio' ? <Monitor className="h-3 w-3" /> : <DoorOpen className="h-3 w-3" />}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{ambiente.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="text-xs font-medium text-muted-foreground">{ambiente.facultad?.codigo || '-'}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Building2 className="h-3 w-3 opacity-40" />
                        <span className="text-xs font-medium">{ambiente.pabellon} - {ambiente.piso}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-bold uppercase tracking-widest border border-border">
                        {ambiente.tipo}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-xs font-bold text-foreground">{ambiente.capacidad}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(ambiente)} title="Editar" className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(ambiente.id_ambiente); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all">
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
        <AlertDialogContent className="page-modal-alert">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Está completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Esta acción no se puede deshacer. Se eliminará permanentemente el ambiente y sus horarios relacionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="page-modal-alert-btn">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-11 rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold shadow-lg shadow-destructive/20 transition-all">
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="page-modal-alert">
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
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="page-modal-alert-btn">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
