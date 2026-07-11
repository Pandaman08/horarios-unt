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
import { Pagination } from "@/components/ui/pagination";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { useDepartment } from "@/contexts/DepartmentContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SimulacionBadge } from "@/components/ui/SimulacionBadge";
import { Checkbox } from "@/components/ui/checkbox";

interface Facultad {
  id: string;
  nombre: string;
  codigo: string;
}

interface DepartamentoAcademico {
  id: string;
  nombre: string;
  facultadId: string;
}

interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  condicion?: string;
  categoriaDocente?: string;
  regimenDedicacion?: string;
  antiguedad?: number;
  correo_electronico: string;
  telefono?: string;
  grado_academico?: string;
  fecha_ingreso?: string;
  facultadId?: string;
  facultad?: Facultad;
  departamentoId?: string;
  departamento?: DepartamentoAcademico;
  dni?: string;
  esInvestigadorAcreditado?: boolean;
  nivelRenacyt?: string;
  sancionActiva?: boolean;
  sancionHasta?: string;
  tipoContrato?: string;
  tipoExtraordinario?: string;
  especialidad?: string;
  docente_cursos?: Array<{
    curso: {
      id_ciclo?: number;
    }
  }>;
}

export function DocenteList() {
  const context = usePeriodo();
  const periodoSeleccionado = context?.periodoSeleccionado;
  const { departamentoSeleccionado } = useDepartment();
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
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
      const url = `/api/reportes/pdf?tipo=reporte_docentes_lista&id_periodo=${periodoSeleccionado.id_periodo}`;
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

  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [departamentos, setDepartamentos] = useState<DepartamentoAcademico[]>([]);

  const [formData, setFormData] = useState({
    nombres: "",
    apellidos: "",
    codigo_docente: "",
    correo_electronico: "",
    telefono: "",
    categoriaDocente: "PRINCIPAL",
    grado_academico: "INGENIERO",
    especialidad: "",
    fecha_ingreso: new Date().toISOString().split("T")[0],
    facultadId: "",
    departamentoId: "",
    dni: "",
    esInvestigadorAcreditado: false,
    nivelRenacyt: "",
    sancionActiva: false,
    sancionHasta: "",
    condicion: "",
    regimenDedicacion: "",
    tipoContrato: "",
    tipoExtraordinario: "",
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
    const matchesCategoriaDocente = filtroCategoria === "todos" || d.categoriaDocente?.toUpperCase() === filtroCategoria.toUpperCase();
    const matchesCondicion = filtroModalidad === "todos" || d.condicion?.toUpperCase() === filtroModalidad.toUpperCase();
    const matchesGrado = filtroGrado === "todos" || d.grado_academico === filtroGrado;

    // Filtrar por ciclo y semestre (solo si hay filtros activos)
    let matchesCiclo = true;
    let matchesSemestre = true;

    if (filtroCiclo !== "todos" || semestre !== 0) {
      // Obtener todos los ciclos asociados al docente (a través de declaracion_horaria o docente_cursos)
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
        // Si el docente no tiene cursos, se muestra incluso con filtro de semestre
        if (docenteCiclos.size === 0) {
          matchesSemestre = true;
        } else {
          matchesSemestre = Array.from(docenteCiclos).some(cicloId => {
            const ciclo = ciclos.find(c => c.id_ciclo === cicloId);
            if (ciclo) {
              const isPar = ciclo.numero % 2 === 0;
              return (semestre === 1 && !isPar) || (semestre === 2 && isPar);
            }
            return false;
          });
        }
      }
    }

    return matchesSearch && matchesCategoriaDocente && matchesCondicion && matchesGrado && matchesCiclo && matchesSemestre;
  }).sort((a, b) => {
    if (filtroAntiguedad === "todos") return 0;
    const yearsA = calculateAntiquity(a.fecha_ingreso);
    const yearsB = calculateAntiquity(b.fecha_ingreso);
    return filtroAntiguedad === "asc" ? yearsA - yearsB : yearsB - yearsA;
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

  const fetchDepartamentos = async (facultadId?: string) => {
    try {
      const url = facultadId 
        ? `/api/departamentos?facultadId=${encodeURIComponent(facultadId)}` 
        : "/api/departamentos";
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartamentos(data);
      }
    } catch (error: any) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  useEffect(() => {
    fetchCiclos();
    fetchFacultades();
  }, []);

  useEffect(() => {
    fetchDocentes();
  }, [departamentoSeleccionado]);

  // Cuando la facultad cambia, actualizar los departamentos
  useEffect(() => {
    if (formData.facultadId) {
      fetchDepartamentos(formData.facultadId);
    } else {
      setDepartamentos([]);
    }
  }, [formData.facultadId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCategoria, filtroModalidad, filtroGrado, filtroAntiguedad, filtroCiclo, semestre, departamentoSeleccionado]);

  const fetchDocentes = async () => {
    try {
      let url = "/api/docentes";
      if (departamentoSeleccionado) {
        url = `/api/docentes?departamentoId=${departamentoSeleccionado.id}`;
      }
      const res = await fetch(url);
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
      const url = `/api/reportes/pdf?tipo=docente&id_periodo=${periodoSeleccionado.id_periodo}&id=${docente.id_docente}`;
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
      categoriaDocente: "PRINCIPAL",
      grado_academico: "INGENIERO",
      especialidad: "",
      fecha_ingreso: new Date().toISOString().split("T")[0],
      facultadId: "",
      departamentoId: "",
      dni: "",
      esInvestigadorAcreditado: false,
      nivelRenacyt: "",
      sancionActiva: false,
      sancionHasta: "",
      condicion: "",
      regimenDedicacion: "",
      tipoContrato: "",
      tipoExtraordinario: "",
    });
  };

  return (
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <Users className="page-icon" />
            </div>
            <div className="min-w-0">
              <h2 className="page-title">Docentes</h2>
              <p className="page-subtitle">Gestión integral de la plana académica</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar docente..."
                className="page-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => handleGenerateInstitutionalReport('pdf')}
                disabled={generatingReport === true}
                variant="outline"
                className="page-btn border-primary/20 text-primary hover:bg-primary/5"
              >
                {generatingReport === true ? (
                  <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
                ) : (
                  <FileText className="mr-2 h-3.5 w-3.5" />
                )}
                Reporte
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
                <Button className="page-btn bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Docente
                </Button>
              </DialogTrigger>
              <DialogContent className="page-modal-lg">
                <DialogHeader className="page-modal-header">
                  <div className="flex items-center gap-3">
                    <div className="page-icon-box">
                      <UserCircle2 className="page-icon" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        {editingDocente ? "Actualizar Docente" : "Registrar Docente"}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Complete la información del catedrático</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleDocenteSubmit} className="page-modal-body space-y-4 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Nombres</Label>
                      <Input className="page-modal-input" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} required />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Apellidos</Label>
                      <Input className="page-modal-input" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} required />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Código</Label>
                      <Input className="page-modal-input" value={formData.codigo_docente} onChange={(e) => setFormData({ ...formData, codigo_docente: e.target.value })} placeholder="Auto-generado" />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Correo Electrónico</Label>
                      <Input className="page-modal-input" type="email" value={formData.correo_electronico} onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })} required />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Teléfono</Label>
                      <Input className="page-modal-input" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Condición</Label>
                      <Select value={formData.condicion} onValueChange={(val) => setFormData({ ...formData, condicion: val })}>
                        <SelectTrigger className="page-modal-input">
                          <SelectValue placeholder="Seleccione condición" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                          <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
                          <SelectItem value="CONTRATADO">Contratado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {formData.condicion === "ORDINARIO" && (
                      <div className="page-modal-field">
                        <Label className="page-modal-label">Régimen de Dedicación</Label>
                        <Select value={formData.regimenDedicacion} onValueChange={(val) => setFormData({ ...formData, regimenDedicacion: val })}>
                          <SelectTrigger className="page-modal-input">
                            <SelectValue placeholder="Seleccione régimen" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="DE">DE (Dedicación Exclusiva - 40h)</SelectItem>
                            <SelectItem value="TC">TC (Tiempo Completo - 40h)</SelectItem>
                            <SelectItem value="TP1">TP1 (Tiempo Parcial 1 - 20h)</SelectItem>
                            <SelectItem value="TP2">TP2 (Tiempo Parcial 2 - 10h)</SelectItem>
                            <SelectItem value="TP3">TP3 (Tiempo Parcial 3 - 8h)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {formData.condicion === "CONTRATADO" && (
                      <div className="page-modal-field">
                        <Label className="page-modal-label">Tipo de Contrato</Label>
                        <Select value={formData.tipoContrato} onValueChange={(val) => setFormData({ ...formData, tipoContrato: val })}>
                          <SelectTrigger className="page-modal-input">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="A1">A1 (Doctor - 32h)</SelectItem>
                            <SelectItem value="A2">A2 (Doctor - 16h)</SelectItem>
                            <SelectItem value="A3">A3 (Doctor - 8h)</SelectItem>
                            <SelectItem value="B1">B1 (Maestro - 32h)</SelectItem>
                            <SelectItem value="B2">B2 (Maestro - 16h)</SelectItem>
                            <SelectItem value="B3">B3 (Maestro - 8h)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {formData.condicion === "EXTRAORDINARIO" && (
                      <div className="page-modal-field">
                        <Label className="page-modal-label">Tipo Extraordinario</Label>
                        <Select value={formData.tipoExtraordinario} onValueChange={(val) => setFormData({ ...formData, tipoExtraordinario: val })}>
                          <SelectTrigger className="page-modal-input">
                            <SelectValue placeholder="Seleccione tipo" />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            <SelectItem value="HONORIS_CAUSA">Honoris Causa</SelectItem>
                            <SelectItem value="EMERITO">Emérito</SelectItem>
                            <SelectItem value="HONORARIO">Honorario</SelectItem>
                            <SelectItem value="INVESTIGADOR">Investigador</SelectItem>
                            <SelectItem value="VISITANTE">Visitante</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Grado Académico</Label>
                      <Select value={formData.grado_academico} onValueChange={(val) => setFormData({ ...formData, grado_academico: val })}>
                        <SelectTrigger className="page-modal-input">
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
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Categoría</Label>
                      <Select value={formData.categoriaDocente} onValueChange={(val) => setFormData({ ...formData, categoriaDocente: val })}>
                        <SelectTrigger className="page-modal-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="PRINCIPAL">Principal</SelectItem>
                          <SelectItem value="ASOCIADO">Asociado</SelectItem>
                          <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Facultad</Label>
                      <Select value={formData.facultadId} onValueChange={(val) => {
                        setFormData({ ...formData, facultadId: val, departamentoId: "" });
                      }} required>
                        <SelectTrigger className="page-modal-input w-full min-w-0">
                          <SelectValue placeholder="Seleccione facultad" className="truncate" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {facultades.map((facultad) => (
                            <SelectItem key={facultad.id} value={facultad.id}>{facultad.codigo} - {facultad.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Departamento Académico</Label>
                      <Select value={formData.departamentoId} onValueChange={(val) => setFormData({ ...formData, departamentoId: val })} disabled={!formData.facultadId} required>
                        <SelectTrigger className="page-modal-input w-full min-w-0">
                          <SelectValue placeholder="Seleccione departamento" className="truncate" />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          {departamentos.map((depto) => (
                            <SelectItem key={depto.id} value={depto.id}>{depto.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">DNI</Label>
                      <div className="flex items-center gap-2 min-w-0">
                        <Input className="page-modal-input min-w-0 flex-1" value={formData.dni} onChange={(e) => setFormData({ ...formData, dni: e.target.value })} />
                        <SimulacionBadge tipo="PERSONAL_ACADEMICO" />
                      </div>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Nivel RENACYT</Label>
                      <Input className="page-modal-input" value={formData.nivelRenacyt} onChange={(e) => setFormData({ ...formData, nivelRenacyt: e.target.value })} placeholder="Ej: V" />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Investigador RENACYT</Label>
                      <div className="flex items-center gap-2 h-9">
                        <Checkbox 
                          checked={formData.esInvestigadorAcreditado} 
                          onCheckedChange={(checked) => setFormData({ ...formData, esInvestigadorAcreditado: checked === true })} 
                          id="investigador-acreditado"
                        />
                        <label htmlFor="investigador-acreditado" className="text-xs text-muted-foreground font-medium cursor-pointer">
                          Sí <SimulacionBadge tipo="RENACYT" />
                        </label>
                      </div>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Especialidad</Label>
                      <Input className="page-modal-input" value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Fecha de Ingreso</Label>
                      <Input className="page-modal-input" type="date" value={formData.fecha_ingreso} onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })} required />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Sanción Activa</Label>
                      <div className="flex items-center gap-2 h-9">
                        <Checkbox 
                          checked={formData.sancionActiva} 
                          onCheckedChange={(checked) => setFormData({ ...formData, sancionActiva: checked === true })} 
                          id="sancion-activa"
                        />
                        <label htmlFor="sancion-activa" className="text-xs text-muted-foreground font-medium cursor-pointer">
                          Sí <SimulacionBadge tipo="SANCIONES" />
                        </label>
                      </div>
                    </div>
                    {formData.sancionActiva && (
                      <div className="page-modal-field">
                        <Label className="page-modal-label">Sanción Hasta</Label>
                        <Input className="page-modal-input" type="date" value={formData.sancionHasta} onChange={(e) => setFormData({ ...formData, sancionHasta: e.target.value })} />
                      </div>
                    )}
                  </div>

                  <div className="page-actions-row justify-end pt-4 border-t border-border/50">
                    <Button type="button" variant="ghost" onClick={() => setIsDocenteDialogOpen(false)} className="page-modal-btn-cancel">Cancelar</Button>
                    <Button type="submit" className="page-modal-btn-submit">
                      {editingDocente ? "Actualizar" : "Registrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="page-filters">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categoría</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="page-filter-select">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="todos">Todas las categorías</SelectItem>
                <SelectItem value="PRINCIPAL">Principal</SelectItem>
                <SelectItem value="ASOCIADO">Asociado</SelectItem>
                <SelectItem value="AUXILIAR">Auxiliar</SelectItem>
                <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Condición</Label>
            <Select value={filtroModalidad} onValueChange={setFiltroModalidad}>
              <SelectTrigger className="page-filter-select">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="todos">Todas las condiciones</SelectItem>
                <SelectItem value="ORDINARIO">Ordinario</SelectItem>
                <SelectItem value="CONTRATADO">Contratado</SelectItem>
                <SelectItem value="EXTRAORDINARIO">Extraordinario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ciclo</Label>
            <Select value={filtroCiclo} onValueChange={setFiltroCiclo}>
              <SelectTrigger className="page-filter-select">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="todos">Todos los ciclos</SelectItem>
                {ciclos
                  .filter(c => {
                    if (semestre === 0) return true;
                    const isPar = c.numero % 2 === 0;
                    return (semestre === 1 && !isPar) || (semestre === 2 && isPar);
                  })
                  .map(c => (
                    <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Grado Académico</Label>
            <Select value={filtroGrado} onValueChange={setFiltroGrado}>
              <SelectTrigger className="page-filter-select">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="todos">Todos los grados</SelectItem>
                <SelectItem value="DOCTOR">Doctor</SelectItem>
                <SelectItem value="MAESTRO">Maestro</SelectItem>
                <SelectItem value="INGENIERO">Ingeniero</SelectItem>
                <SelectItem value="LICENCIADO">Licenciado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Orden por Antigüedad</Label>
            <Select value={filtroAntiguedad} onValueChange={setFiltroAntiguedad}>
              <SelectTrigger className="page-filter-select">
                <SelectValue placeholder="Sin orden" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="todos">Sin orden</SelectItem>
                <SelectItem value="asc">Menor a Mayor antigüedad</SelectItem>
                <SelectItem value="desc">Mayor a Menor antigüedad</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="page-table-card">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Cód.</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Apellidos y Nombres</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Grado</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Facultad</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Departamento</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Antigüedad</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Modalidad</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Categoría</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={9} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((docente) => (
                  <TableRow key={docente.id_docente} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-xs font-bold text-muted-foreground">{docente.codigo_docente}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-xs">
                          {docente.nombres.charAt(0)}{docente.apellidos.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{docente.apellidos}, {docente.nombres}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-xs font-medium">{docente.grado_academico || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="text-xs font-medium text-muted-foreground">{docente.facultad?.codigo || '-'}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="text-xs font-medium text-muted-foreground">{docente.departamento?.nombre || '-'}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-xs font-medium">{calculateAntiquity(docente.fecha_ingreso)} años</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-bold uppercase tracking-widest border border-border">{docente.condicion}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">{docente.categoriaDocente}</span>
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
                              grado_academico: docente.grado_academico || "INGENIERO",
                              especialidad: docente.especialidad || "",
                              fecha_ingreso: docente.fecha_ingreso ? new Date(docente.fecha_ingreso).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
                              facultadId: docente.facultadId || "",
                              departamentoId: docente.departamentoId || "",
                              dni: docente.dni || "",
                              esInvestigadorAcreditado: docente.esInvestigadorAcreditado || false,
                              nivelRenacyt: docente.nivelRenacyt || "",
                              sancionActiva: docente.sancionActiva || false,
                              sancionHasta: docente.sancionHasta ? new Date(docente.sancionHasta).toISOString().split("T")[0] : "",
                              condicion: docente.condicion || "ORDINARIO",
                              categoriaDocente: docente.categoriaDocente || "PRINCIPAL",
                              regimenDedicacion: docente.regimenDedicacion || "",
                              tipoContrato: docente.tipoContrato || "",
                              tipoExtraordinario: docente.tipoExtraordinario || "",
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
    </div>
  );
}
