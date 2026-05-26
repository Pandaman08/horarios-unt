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
  BookOpen, 
  GraduationCap,
  AlertCircle,
  Clock,
  Filter,
  Calendar,
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

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  horas_teoria: number;
  horas_laboratorio: number;
  horas_practica: number;
  creditos: number;
  id_ciclo?: number;
  tipo_curso: string;
  ciclo_rel?: {
    id_ciclo: number;
    nombre: string;
  };
}

export function CursoList() {
  const context = usePeriodo();
  const periodoSeleccionado = context?.periodoSeleccionado;
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatingReport, setGeneratingReport] = useState<number | null>(null);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [semestre, setSemestre] = useState<number>(1);

  // Sincronizar semestre con el periodo seleccionado
  useEffect(() => {
    if (periodoSeleccionado) {
      setSemestre(periodoSeleccionado.semestre);
    }
  }, [periodoSeleccionado]);
  
  // Estados de Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroHoras, setFiltroHoras] = useState<string>("todos");
  const [filtroCiclo, setFiltroCiclo] = useState<string>("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCursos = cursos.filter(c => {
    const matchesSearch = `${c.nombre} ${c.codigo}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filtroTipo === "todos" || c.tipo_curso === filtroTipo;
    const matchesCiclo = filtroCiclo === "todos" || c.id_ciclo?.toString() === filtroCiclo;
    
    const totalHoras = c.horas_teoria + c.horas_laboratorio + c.horas_practica;
    let matchesHoras = true;
    if (filtroHoras === "0-3") matchesHoras = totalHoras <= 3;
    else if (filtroHoras === "4-6") matchesHoras = totalHoras > 3 && totalHoras <= 6;
    else if (filtroHoras === "7+") matchesHoras = totalHoras > 6;

    // Filtrar por semestre según ciclo
    const ciclo = ciclos.find(cy => cy.id_ciclo === c.id_ciclo);
    if (ciclo) {
      const isPar = ciclo.numero % 2 === 0;
      const matchesSemestre = (semestre === 1 && !isPar) || (semestre === 2 && isPar);
      return matchesSearch && matchesTipo && matchesCiclo && matchesHoras && matchesSemestre;
    }

    return matchesSearch && matchesTipo && matchesCiclo && matchesHoras;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredCursos.length / itemsPerPage);
  const currentItems = filteredCursos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroTipo, filtroHoras, filtroCiclo, semestre]);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    horas_teoria: "0",
    horas_laboratorio: "0",
    horas_practica: "0",
    creditos: "0",
    id_ciclo: "",
    tipo_curso: "linea_carrera",
    plan_estudios: "",
    prerequisitos: "",
  });

  useEffect(() => {
    fetchCursos();
    fetchCiclos();
  }, []);

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

  const fetchCursos = async () => {
    try {
      const res = await fetch("/api/cursos");
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar cursos");
      }

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON de /api/cursos:", text.substring(0, 200));
        throw new Error("La respuesta de cursos no es un JSON válido (posible 404 o redirección)");
      }

      const data = await res.json();
      setCursos(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Error en fetchCursos:", error);
      toast.error(error.message || "Error al cargar cursos");
      setCursos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCurso ? "PUT" : "POST";
    const url = editingCurso 
      ? `/api/cursos/${editingCurso.id_curso}` 
      : "/api/cursos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCurso ? "Curso actualizado" : "Curso creado");
        setIsDialogOpen(false);
        setEditingCurso(null);
        resetForm();
        fetchCursos();
      } else {
        toast.error("Error al guardar curso");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/cursos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Curso eliminado");
        fetchCursos();
      } else {
        setErrorMessage(data.error || "Error al eliminar curso");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (curso: any) => {
    setEditingCurso(curso);
    setFormData({
      codigo: curso.codigo,
      nombre: curso.nombre,
      horas_teoria: curso.horas_teoria.toString(),
      horas_laboratorio: curso.horas_laboratorio.toString(),
      horas_practica: curso.horas_practica.toString(),
      creditos: curso.creditos.toString(),
      id_ciclo: curso.id_ciclo?.toString() || "",
      tipo_curso: curso.tipo_curso || "linea_carrera",
      plan_estudios: curso.plan_estudios || "",
      prerequisitos: curso.prerequisitos || "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      horas_teoria: "0",
      horas_laboratorio: "0",
      horas_practica: "0",
      creditos: "0",
      id_ciclo: "",
      tipo_curso: "linea_carrera",
      plan_estudios: "",
      prerequisitos: "",
    });
    setEditingCurso(null);
  };

  const handleGenerateReport = async (formato: 'pdf' | 'excel' = 'pdf') => {
    if (!periodoSeleccionado) {
      toast.error("Seleccione un periodo académico primero");
      return;
    }

    setGeneratingReport(999);
    try {
      const url = `/api/reportes?tipo=reporte_cursos&id_periodo=${periodoSeleccionado.id_periodo}&formato=${formato}`;
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
      a.download = `Reporte_Cursos_Sistemas.${extension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success(`Reporte de cursos (${formato.toUpperCase()}) descargado`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar reporte");
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Cursos</h2>
              <p className="text-muted-foreground text-[10px] mt-1">Mantenimiento de asignaturas y planes de estudio</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar curso..." 
              className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-semibold text-[11px] focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) { setEditingCurso(null); resetForm(); } }}>
              <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleGenerateReport('pdf')} 
                  disabled={generatingReport === 999}
                  variant="outline"
                  className="h-9 rounded-lg border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs transition-all"
                >
                  {generatingReport === 999 ? (
                    <Download className="mr-2 h-3.5 w-3.5 animate-bounce" />
                  ) : (
                    <FileText className="mr-2 h-3.5 w-3.5" />
                  )}
                  Reporte Cursos
                </Button>
              </div>
                <DialogTrigger asChild>
                  <Button className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs shadow-lg shadow-primary/20 transition-all">
                    <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Curso
                  </Button>
                </DialogTrigger>
              </div>
              <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-card text-foreground">
                <DialogHeader className="bg-primary p-6 text-primary-foreground">
                  <DialogTitle className="text-xl font-bold flex items-center gap-2">
                    {editingCurso ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                    {editingCurso ? "Editar Curso" : "Nuevo Curso"}
                  </DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Código</Label>
                      <Input 
                        value={formData.codigo} 
                        onChange={(e) => setFormData({...formData, codigo: e.target.value})} 
                        className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs"
                        placeholder="SIST001"
                        required 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                      <Input 
                        value={formData.nombre} 
                        onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                        className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs"
                        placeholder="Matemática I"
                        required 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Curso</Label>
                      <Select value={formData.tipo_curso} onValueChange={(v) => setFormData({...formData, tipo_curso: v})}>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          <SelectItem value="general" className="font-bold text-xs">General (EG)</SelectItem>
                          <SelectItem value="linea_carrera" className="font-bold text-xs">Línea de Carrera (EE)</SelectItem>
                          <SelectItem value="electivo" className="font-bold text-xs">Electivo (EL)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ciclo</Label>
                      <Select value={formData.id_ciclo} onValueChange={(v) => setFormData({...formData, id_ciclo: v})}>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border">
                          {ciclos.map(c => (
                            <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="font-bold text-xs">{c.nombre}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Teoría</Label>
                      <Input type="number" value={formData.horas_teoria} onChange={(e) => setFormData({...formData, horas_teoria: e.target.value})} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lab.</Label>
                      <Input type="number" value={formData.horas_laboratorio} onChange={(e) => setFormData({...formData, horas_laboratorio: e.target.value})} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prác.</Label>
                      <Input type="number" value={formData.horas_practica} onChange={(e) => setFormData({...formData, horas_practica: e.target.value})} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Créd.</Label>
                      <Input type="number" value={formData.creditos} onChange={(e) => setFormData({...formData, creditos: e.target.value})} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-xs" />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-xs px-6">Cancelar</Button>
                    <Button type="submit" className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs px-8 shadow-lg shadow-primary/20 transition-all">
                      {editingCurso ? "Actualizar" : "Crear"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Curso</Label>
            <Select value={filtroTipo} onValueChange={setFiltroTipo}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todos los tipos</SelectItem>
                <SelectItem value="general" className="text-[10px] font-bold">General (EG)</SelectItem>
                <SelectItem value="linea_carrera" className="text-[10px] font-bold">Línea de Carrera (EE)</SelectItem>
                <SelectItem value="electivo" className="text-[10px] font-bold">Electivo (EL)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ciclo</Label>
            <Select value={filtroCiclo} onValueChange={setFiltroCiclo}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todos los ciclos</SelectItem>
                {ciclos
                  .filter(c => {
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
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Horas Totales</Label>
            <Select value={filtroHoras} onValueChange={setFiltroHoras}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Cualquier cantidad</SelectItem>
                <SelectItem value="0-3" className="text-[10px] font-bold">Corta (0-3 hrs)</SelectItem>
                <SelectItem value="4-6" className="text-[10px] font-bold">Media (4-6 hrs)</SelectItem>
                <SelectItem value="7+" className="text-[10px] font-bold">Intensa (7+ hrs)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[900px] w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 w-24">Cód.</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Curso</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Horas (T-L-P)</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-24">Créd.</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center w-24">Ciclo</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((curso) => (
                  <TableRow key={curso.id_curso} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[9px] font-bold text-muted-foreground">{curso.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-[11px] leading-tight">{curso.nombre}</span>
                        <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter mt-0.5">
                          {curso.tipo_curso.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded">{curso.horas_teoria}</span>
                        <span className="text-[10px] font-black text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded">{curso.horas_laboratorio}</span>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">{curso.horas_practica}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="text-[10px] font-bold text-foreground">{curso.creditos}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="text-[10px] font-bold text-foreground">{curso.ciclo_rel?.nombre || '-'}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(curso)} title="Editar" className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(curso.id_curso); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all">
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
              Esta acción no se puede deshacer. Se eliminará permanentemente el curso y sus asignaciones relacionadas.
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
