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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  BookOpen, 
  Search, 
  Mail, 
  Phone, 
  Users,
  UserCircle2,
  Filter,
  GraduationCap,
  CalendarDays,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Download,
  FileText,
  FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AsignarCursosDialog } from "./AsignarCursosDialog";
import { Pagination } from "@/components/ui/pagination";
import { usePeriodo } from "@/contexts/PeriodoContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  modalidad: string;
  categoria: string;
  dedicacion: string;
  antiguedad: number;
  correo_electronico: string;
  telefono: string;
  grado_academico?: string;
  fecha_ingreso?: string;
  docente_cursos?: Array<{
    curso: {
      id_ciclo?: number;
    }
  }>;
}

export function DocenteList() {
  const context = usePeriodo();
  const periodoSeleccionado = context?.periodoSeleccionado;
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [isDocenteDialogOpen, setIsDocenteDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [generatingReport, setGeneratingReport] = useState<number | boolean | null>(false);

  const handleGenerateInstitutionalReport = async (formato: 'pdf' | 'excel' = 'pdf') => {
    if (!periodoSeleccionado) {
      toast.error("Seleccione un periodo académico primero");
      return;
    }

    setGeneratingReport(true);
    try {
      const url = `/api/reportes?tipo=reporte_docentes_lista&id_periodo=${periodoSeleccionado.id_periodo}&formato=${formato}`;
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
      a.download = `Reporte_General_Docentes.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Reporte de docentes (${formato.toUpperCase()}) descargado`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar reporte");
    } finally {
      setGeneratingReport(false);
    }
  };
  
  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    codigo_docente: "",
    correo_electronico: "",
    telefono: "",
    modalidad: "NOMBRADO",
    categoria: "PRINCIPAL",
    grado_academico: "INGENIERO",
    especialidad: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],
  });
  
  // Estados de Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroModalidad, setFiltroModalidad] = useState<string>("todos");
  const [filtroGrado, setFiltroGrado] = useState<string>("todos");
  const [filtroAntiguedad, setFiltroAntiguedad] = useState<string>("todos");
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [semestre, setSemestre] = useState<number>(0);
  const [filtroCiclo, setFiltroCiclo] = useState<string>("todos");

  // Sincronizar semestre con el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionado) {
      setSemestre(periodoSeleccionado.semestre);
    }
  }, [periodoSeleccionado]);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const calculateAntiquity = (fechaIngreso?: string) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const actual = new Date();
    let years = actual.getFullYear() - ingreso.getFullYear();
    const monthDiff = actual.getMonth() - ingreso.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && actual.getDate() < ingreso.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  const filteredDocentes = docentes.filter(d => {
    const matchesSearch = `${d.nombres} ${d.apellidos} ${d.codigo_docente}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filtroCategoria === "todos" || d.categoria?.toUpperCase() === filtroCategoria.toUpperCase();
    const matchesModalidad = filtroModalidad === "todos" || d.modalidad?.toUpperCase() === filtroModalidad.toUpperCase();
    const matchesGrado = filtroGrado === "todos" || d.grado_academico === filtroGrado;
    
    const years = calculateAntiquity(d.fecha_ingreso);
    let matchesAntiguedad = true;
    if (filtroAntiguedad === "0-5") matchesAntiguedad = years <= 5;
    else if (filtroAntiguedad === "6-15") matchesAntiguedad = years > 5 && years <= 15;
    else if (filtroAntiguedad === "16+") matchesAntiguedad = years > 15;

    // Filtrar por ciclo y semestre
    let matchesCiclo = true;
    let matchesSemestre = true;

    if (filtroCiclo !== "todos" || semestre !== 0) {
      // Obtener todos los ciclos asociados al docente
      const docenteCiclos = new Set<number>();
      d.docente_cursos?.forEach(dc => {
        if (dc.curso?.id_ciclo) {
          docenteCiclos.add(dc.curso.id_ciclo);
        }
      });

      // Filtrar por ciclo
      if (filtroCiclo !== "todos") {
        matchesCiclo = docenteCiclos.has(parseInt(filtroCiclo));
      }

      // Filtrar por semestre
      if (semestre !== 0) {
        matchesSemestre = Array.from(docenteCiclos).some(cicloId => {
          const ciclo = ciclos.find(c => c.id_ciclo === cicloId);
          if (ciclo) {
            const isPar = ciclo.numero % 2 === 0;
            return (semestre === 1 && !isPar) || (semestre === 2 && isPar);
          }
          return false;
        });
        // Si el docente no tiene cursos, no se muestra solo si se está filtrando por semestre
        if (docenteCiclos.size === 0) {
          matchesSemestre = false;
        }
      }
    }

    return matchesSearch && matchesCategoria && matchesModalidad && matchesGrado && matchesAntiguedad && matchesCiclo && matchesSemestre;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage);
  const currentItems = filteredDocentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchCiclos = async () => {
    try {
      const res = await fetch("/api/ciclos");
      const contentType = res.headers.get("content-type");
      
      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar ciclos");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON de /api/ciclos:", text.substring(0, 200));
        throw new Error("La respuesta de ciclos no es un JSON válido (posible 404 o redirección)");
      }

      const data = await res.json();
      setCiclos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error al cargar ciclos:", error);
      setCiclos([]);
    }
  };

  useEffect(() => {
    fetchDocentes();
    fetchCiclos();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCategoria, filtroModalidad, filtroGrado, filtroAntiguedad, filtroCiclo, semestre]);

  const fetchDocentes = async () => {
    try {
      const res = await fetch("/api/docentes");
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar docentes");
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setDocentes(data);
      } else {
        setDocentes([]);
      }
    } catch (error: any) {
      console.error("Error en fetchDocentes:", error);
      toast.error(error.message || "Error al cargar docentes");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (docente: Docente, formato: 'pdf' | 'excel' = 'pdf') => {
    if (!periodoSeleccionado) {
      toast.warning("Seleccione un periodo académico");
      return;
    }

    setGeneratingReport(docente.id_docente);
    try {
      const url = `/api/reportes?tipo=docente&id_periodo=${periodoSeleccionado.id_periodo}&id=${docente.id_docente}&formato=${formato}`;
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
      a.download = `Horario_${docente.apellidos}_${docente.nombres}.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Horario ${formato.toUpperCase()} generado correctamente`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar horario");
    } finally {
      setGeneratingReport(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este docente? Se marcará como inactivo.")) return;

    try {
      const res = await fetch(`/api/docentes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Docente eliminado correctamente");
        fetchDocentes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar docente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDocenteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDocente ? "PUT" : "POST";
    const url = editingDocente 
      ? `/api/docentes/${editingDocente.id_docente}` 
      : "/api/docentes";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingDocente ? "Docente actualizado" : "Docente registrado");
        setIsDocenteDialogOpen(false);
        setEditingDocente(null);
        resetDocenteForm();
        fetchDocentes();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al guardar docente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const resetDocenteForm = () => {
    setFormData({
      nombres: "",
      apellidos: "",
      codigo_docente: "",
      correo_electronico: "",
      telefono: "",
      modalidad: "NOMBRADO",
      categoria: "PRINCIPAL",
      grado_academico: "INGENIERO",
      especialidad: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Docentes</h2>
              <p className="text-muted-foreground text-[10px] mt-1">Gestión integral de la plana académica</p>
            </div>
          </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Buscar docente..." 
                  className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-semibold text-[11px] focus:ring-1 focus:ring-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleGenerateInstitutionalReport('pdf')} 
                  disabled={generatingReport === true}
                  variant="outline"
                  className="h-9 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs transition-all"
                >
                  {generatingReport === true ? (
                    <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
                  ) : (
                    <FileText className="mr-2 h-3.5 w-3.5" />
                  )}
                  PDF
                </Button>
                <Button 
                  onClick={() => handleGenerateInstitutionalReport('excel')} 
                  disabled={generatingReport === true}
                  variant="outline"
                  className="h-9 rounded-lg border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5 font-bold text-xs transition-all"
                >
                  {generatingReport === true ? (
                    <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-3.5 w-3.5" />
                  )}
                  Excel
                </Button>
              </div>
              <Dialog open={isDocenteDialogOpen} onOpenChange={(open) => {
              setIsDocenteDialogOpen(open);
              if (!open) {
                setEditingDocente(null);
                resetDocenteForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Docente 
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl rounded-xl p-6 border-none shadow-2xl bg-card text-foreground">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <UserCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                        {editingDocente ? "Actualizar Docente" : "Registrar Docente"}
                      </DialogTitle>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Complete la información del catedrático</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleDocenteSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombres</Label>
                      <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Apellidos</Label>
                      <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Código (Opcional)</Label>
                      <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.codigo_docente} onChange={(e) => setFormData({ ...formData, codigo_docente: e.target.value })} placeholder="Auto-generado" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Correo Electrónico</Label>
                      <Input type="email" className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.correo_electronico} onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Teléfono</Label>
                      <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Modalidad</Label>
                      <Select value={formData.modalidad} onValueChange={(val) => setFormData({ ...formData, modalidad: val })}>
                        <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="NOMBRADO">Nombrado</SelectItem>
                          <SelectItem value="CONTRATADO">Contratado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoría</Label>
                      <Select value={formData.categoria} onValueChange={(val) => setFormData({ ...formData, categoria: val })}>
                        <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="PRINCIPAL">Principal</SelectItem>
                          <SelectItem value="ASOCIADO">Asociado</SelectItem>
                          <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                          <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Grado Académico</Label>
                      <Select value={formData.grado_academico} onValueChange={(val) => setFormData({ ...formData, grado_academico: val })}>
                        <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="DOCTOR">Doctor</SelectItem>
                          <SelectItem value="MAESTRO">Maestro</SelectItem>
                          <SelectItem value="INGENIERO">Ingeniero</SelectItem>
                          <SelectItem value="LICENCIADO">Licenciado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Especialidad</Label>
                      <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha de Ingreso</Label>
                      <Input type="date" className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.fecha_ingreso} onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })} required />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button type="button" variant="ghost" onClick={() => setIsDocenteDialogOpen(false)} className="h-9 rounded-lg font-bold text-muted-foreground hover:bg-muted px-6 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                      {editingDocente ? "Actualizar" : "Registrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoría</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todas las categorías</SelectItem>
                <SelectItem value="PRINCIPAL" className="text-[10px] font-bold">Principal</SelectItem>
                <SelectItem value="ASOCIADO" className="text-[10px] font-bold">Asociado</SelectItem>
                <SelectItem value="AUXILIAR" className="text-[10px] font-bold">Auxiliar</SelectItem>
                <SelectItem value="EXTRAORDINARIO" className="text-[10px] font-bold">Extraordinario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modalidad</Label>
            <Select value={filtroModalidad} onValueChange={setFiltroModalidad}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todas las modalidades</SelectItem>
                <SelectItem value="NOMBRADO" className="text-[10px] font-bold">Nombrado</SelectItem>
                <SelectItem value="CONTRATADO" className="text-[10px] font-bold">Contratado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ciclo</Label>
            <Select value={filtroCiclo} onValueChange={setFiltroCiclo}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todos los ciclos</SelectItem>
                {ciclos
                  .filter(c => {
                    if (semestre === 0) return true;
                    const isPar = c.numero % 2 === 0;
                    return (semestre === 1 && !isPar) || (semestre === 2 && isPar);
                  })
                  .map(c => (
                    <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="text-[10px] font-bold">
                      {c.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grado Académico</Label>
            <Select value={filtroGrado} onValueChange={setFiltroGrado}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todos los grados</SelectItem>
                <SelectItem value="DOCTOR" className="text-[10px] font-bold">Doctor</SelectItem>
                <SelectItem value="MAESTRO" className="text-[10px] font-bold">Maestro</SelectItem>
                <SelectItem value="INGENIERO" className="text-[10px] font-bold">Ingeniero</SelectItem>
                <SelectItem value="LICENCIADO" className="text-[10px] font-bold">Licenciado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Antigüedad</Label>
            <Select value={filtroAntiguedad} onValueChange={setFiltroAntiguedad}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Cualquier antigüedad</SelectItem>
                <SelectItem value="0-5" className="text-[10px] font-bold">Nuevo (0-5 años)</SelectItem>
                <SelectItem value="6-15" className="text-[10px] font-bold">Intermedio (6-15 años)</SelectItem>
                <SelectItem value="16+" className="text-[10px] font-bold">Senior (16+ años)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Cód.</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Apellidos y Nombres</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Grado</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Antigüedad</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Modalidad</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Categoría</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((docente) => (
                  <TableRow key={docente.id_docente} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[9px] font-bold text-muted-foreground">{docente.codigo_docente}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-[9px]">
                          {docente.nombres.charAt(0)}{docente.apellidos.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-[11px]">{docente.apellidos}, {docente.nombres}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] font-medium">{docente.grado_academico || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] font-medium">{calculateAntiquity(docente.fecha_ingreso)} años</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-widest border border-border">{docente.modalidad}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest border border-primary/20">{docente.categoria}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingDocente(docente);
                            setFormData({
                              nombres: docente.nombres,
                              apellidos: docente.apellidos,
                              codigo_docente: docente.codigo_docente || "",
                              correo_electronico: docente.correo_electronico || "",
                              telefono: docente.telefono || "",
                              modalidad: docente.modalidad || "NOMBRADO",
                              categoria: docente.categoria || "PRINCIPAL",
                              grado_academico: docente.grado_academico || "INGENIERO",
                              especialidad: (docente as any).especialidad || "",
                              fecha_ingreso: docente.fecha_ingreso ? new Date(docente.fecha_ingreso).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                            });
                            setIsDocenteDialogOpen(true);
                          }} 
                          title="Editar Docente" 
                          className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleGenerateReport(docente, 'pdf')} 
                          title="Descargar Horario PDF" 
                          disabled={generatingReport === docente.id_docente}
                          className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all"
                        >
                          {generatingReport === docente.id_docente ? (
                            <Download className="h-3.5 w-3.5 animate-bounce" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleGenerateReport(docente, 'excel')} 
                          title="Descargar Horario Excel" 
                          disabled={generatingReport === docente.id_docente}
                          className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                        >
                          {generatingReport === docente.id_docente ? (
                            <Download className="h-3.5 w-3.5 animate-bounce" />
                          ) : (
                            <FileSpreadsheet className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedDocente(docente); setIsAsignarOpen(true); }} 
                          title="Asignar Cursos" 
                          className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(docente.id_docente)} 
                          title="Eliminar Docente" 
                          className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all"
                        >
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

      <AsignarCursosDialog docenteId={selectedDocente?.id_docente || 0} docenteNombre={`${selectedDocente?.apellidos}, ${selectedDocente?.nombres}`} isOpen={isAsignarOpen} onClose={() => { setIsAsignarOpen(false); setSelectedDocente(null); }} />
    </div>
  );
}
