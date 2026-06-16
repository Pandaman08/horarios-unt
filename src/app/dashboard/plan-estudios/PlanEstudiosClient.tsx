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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  BookOpen,
  AlertCircle,
  GraduationCap,
  Filter,
  ChevronLeft,
  ChevronRight,
  FileDown
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
import { useSession } from "next-auth/react";

// Define types based on the API response
interface Prerequisito {
  id_prerequisito_curso: number;
  prerequisito: {
    id_curso: number;
    codigo: string;
    nombre: string;
  };
}

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  tipo_curso: string;
  creditos: number;
  horas_teoria: number;
  horas_practica: number;
  horas_laboratorio: number;
  maximo_docentes: number;
  activo: boolean;
  id_ciclo?: number | null;
  departamento_responsable?: string;
  prerequisitos_rel: Prerequisito[];
}

interface Ciclo {
  id_ciclo: number;
  numero: number;
  nombre: string;
  activo: boolean;
  cursos: Curso[];
}

export function PlanEstudiosClient() {
  const { data: session } = useSession();
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [dependencias, setDependencias] = useState<{ codigo: string; nombre: string }[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [allCursos, setAllCursos] = useState<Curso[]>([]);
  const [selectedPrerequisitos, setSelectedPrerequisitos] = useState<string[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoCurso, setFilterTipoCurso] = useState<string>("all");
  const [filterCiclo, setFilterCiclo] = useState<string>("all");
  const [filterHasPrerequisitos, setFilterHasPrerequisitos] = useState(false);
  const [filterCreditos, setFilterCreditos] = useState<string>("all");

  // Pagination by cycle
  const [currentCycleIndex, setCurrentCycleIndex] = useState(0);

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    id_ciclo: "",
    tipo_curso: "especializacion",
    creditos: "0",
    horas_teoria: "0",
    horas_practica: "0",
    horas_laboratorio: "0",
    maximo_docentes: "1",
    activo: true,
    departamento_responsable: "",
  });

  useEffect(() => {
    fetchPlanEstudios();
  }, []);

  const fetchPlanEstudios = async () => {
    try {
      const res = await fetch("/api/plan-estudios");
      if (!res.ok) throw new Error("Error al cargar plan de estudios");
      const data = await res.json();
      setCiclos(Array.isArray(data) ? data : []);

      // Collect all courses for prerequisitos selector
      const courses: Curso[] = [];
      data.forEach((ciclo: Ciclo) => {
        ciclo.cursos.forEach((curso: Curso) => courses.push(curso));
      });
      setAllCursos(courses);
    } catch (error: any) {
      console.error("Error al cargar plan de estudios:", error);
      toast.error(error.message || "Error al cargar plan de estudios");
    } finally {
      setLoading(false);
    }
  };

  const getTipoBadge = (tipo: string) => {
    switch (tipo) {
      case "especializacion":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 font-bold text-xs">S</Badge>
        );
      case "obligatorio":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 font-bold text-xs">OB</Badge>
        );
      case "opcional":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 font-bold text-xs">OP</Badge>
        );
      case "electivo":
        return (
          <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 font-bold text-xs">EL</Badge>
        );
      default:
        return <Badge className="text-xs">{tipo}</Badge>;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCurso ? "PUT" : "POST";
    const url = editingCurso
      ? `/api/plan-estudios/cursos/${editingCurso.id_curso}`
      : "/api/plan-estudios/cursos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          prerequisitos: selectedPrerequisitos,
        }),
      });

      if (res.ok) {
        toast.success(editingCurso ? "Curso actualizado" : "Curso creado");
        setIsDialogOpen(false);
        setEditingCurso(null);
        resetForm();
        fetchPlanEstudios();
      } else {
        toast.error("Error al guardar curso");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/plan-estudios/cursos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Curso eliminado");
        fetchPlanEstudios();
      } else if (res.status === 409) {
        setDependencias(data.dependencias || []);
        setIsErrorDialogOpen(true);
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

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      codigo: curso.codigo,
      nombre: curso.nombre,
      id_ciclo: curso.id_ciclo?.toString() || "",
      tipo_curso: curso.tipo_curso,
      creditos: curso.creditos.toString(),
      horas_teoria: curso.horas_teoria.toString(),
      horas_practica: curso.horas_practica.toString(),
      horas_laboratorio: curso.horas_laboratorio.toString(),
      maximo_docentes: curso.maximo_docentes.toString(),
      activo: curso.activo,
      departamento_responsable: curso.departamento_responsable || "",
    });
    // Set selected prerequisitos from existing course
    setSelectedPrerequisitos(
      curso.prerequisitos_rel.map((p) => p.prerequisito.codigo)
    );
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      nombre: "",
      id_ciclo: "",
      tipo_curso: "especializacion",
      creditos: "0",
      horas_teoria: "0",
      horas_practica: "0",
      horas_laboratorio: "0",
      maximo_docentes: "1",
      activo: true,
      departamento_responsable: "",
    });
    setSelectedPrerequisitos([]);
    setEditingCurso(null);
  };

  const isAdminOrSecretaria = session?.user?.rol === "administrador" || session?.user?.rol === "secretaria" || session?.user?.rol === "administrador_sistema" || session?.user?.rol === "operador_horarios";

  // Filter courses for current cycle
  const filteredCiclos = ciclos.map((ciclo) => {
    let filteredCursos = ciclo.cursos;

    // Filter by search term (name or code)
    if (searchTerm) {
      filteredCursos = filteredCursos.filter((c) =>
        `${c.nombre} ${c.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by course type
    if (filterTipoCurso !== "all") {
      filteredCursos = filteredCursos.filter((c) => c.tipo_curso === filterTipoCurso);
    }

    // Filter by cycle (if filterCiclo is set, only show that cycle)
    if (filterCiclo !== "all") {
      if (ciclo.id_ciclo.toString() !== filterCiclo) {
        return { ...ciclo, cursos: [] };
      }
    }

    // Filter by has prerequisites
    if (filterHasPrerequisitos) {
      filteredCursos = filteredCursos.filter((c) => c.prerequisitos_rel.length > 0);
    }

    // Filter by credits
    if (filterCreditos !== "all") {
      const creditos = parseInt(filterCreditos);
      filteredCursos = filteredCursos.filter((c) => c.creditos === creditos);
    }

    return { ...ciclo, cursos: filteredCursos };
  });

  // Get non-empty cycles after filtering for pagination
  const nonEmptyCiclos = filteredCiclos.filter((c) => 
    c.cursos.length > 0 || 
    searchTerm || 
    filterTipoCurso !== "all" || 
    filterCiclo !== "all" || 
    filterHasPrerequisitos || 
    filterCreditos !== "all"
  );
  const currentCiclo = nonEmptyCiclos[currentCycleIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight leading-none">Plan de Estudios</h2>
              <p className="text-muted-foreground text-sm mt-1">Gestión de la estructura curricular y prerequisitos</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={() => {
                window.open('/api/reportes/pdf?tipo=plan-estudios', '_blank');
              }}
              className="h-10 rounded-lg bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow-lg"
            >
              <FileDown className="mr-2 h-4 w-4" />
              Descargar PDF
            </Button>
            {isAdminOrSecretaria && (
              <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingCurso(null); resetForm(); } }}>
                <DialogTrigger asChild>
                  <Button className="h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm shadow-lg shadow-primary/20 transition-all">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-card text-foreground">
                  <DialogHeader className="bg-primary p-6 text-primary-foreground">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                      {editingCurso ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                      {editingCurso ? "Editar Curso" : "Nuevo Curso"}
                    </DialogTitle>
                  </DialogHeader>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Código</Label>
                        <Input
                          value={formData.codigo}
                          onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                          className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm"
                          placeholder="1939"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                        <Input
                          value={formData.nombre}
                          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                          className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm"
                          placeholder="Introducción a la Ingeniería de Sistemas"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Ciclo</Label>
                        <Select value={formData.id_ciclo} onValueChange={(v) => setFormData({ ...formData, id_ciclo: v })}>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            {ciclos.map((c) => (
                              <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="font-bold text-sm">
                                {c.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Tipo de Curso</Label>
                        <Select value={formData.tipo_curso} onValueChange={(v) => setFormData({ ...formData, tipo_curso: v })}>
                          <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border">
                            <SelectItem value="especializacion" className="font-bold text-sm">Especialización (S)</SelectItem>
                            <SelectItem value="obligatorio" className="font-bold text-sm">Obligatorio (OB)</SelectItem>
                            <SelectItem value="opcional" className="font-bold text-sm">Opcional (OP)</SelectItem>
                            <SelectItem value="electivo" className="font-bold text-sm">Electivo (EL)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Créditos</Label>
                        <Input 
                          type="number" 
                          min="1" 
                          max="4" 
                          value={formData.creditos} 
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "" || (parseInt(val) >= 1 && parseInt(val) <= 4)) {
                              setFormData({ ...formData, creditos: val });
                            }
                          }} 
                          className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">T</Label>
                        <Input type="number" value={formData.horas_teoria} onChange={(e) => setFormData({ ...formData, horas_teoria: e.target.value })} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">P</Label>
                        <Input type="number" value={formData.horas_practica} onChange={(e) => setFormData({ ...formData, horas_practica: e.target.value })} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">L</Label>
                        <Input type="number" value={formData.horas_laboratorio} onChange={(e) => setFormData({ ...formData, horas_laboratorio: e.target.value })} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Máx. Docentes</Label>
                        <Input type="number" value={formData.maximo_docentes} onChange={(e) => setFormData({ ...formData, maximo_docentes: e.target.value })} className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm" />
                      </div>
                      <div className="space-y-2 flex items-center">
                        <div className="flex items-center gap-3">
                          <Switch
                            id="activo"
                            checked={formData.activo}
                            onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                          />
                          <Label htmlFor="activo" className="text-xs font-black uppercase tracking-widest text-muted-foreground">Activo</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Departamento Responsable</Label>
                      <Input
                        value={formData.departamento_responsable}
                        onChange={(e) => setFormData({ ...formData, departamento_responsable: e.target.value })}
                        className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm"
                        placeholder="Ingeniería de Sistemas"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Prerequisitos</Label>
                      <Select value={selectedPrerequisitos[0] || ""} onValueChange={(v) => setSelectedPrerequisitos([v])}>
                        <SelectTrigger className="h-10 rounded-xl bg-muted/50 border-border font-bold text-sm">
                          <SelectValue placeholder="Seleccionar prerequisitos..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-border max-h-[300px]">
                          {allCursos
                            .filter((c) => !editingCurso || c.id_curso !== editingCurso.id_curso)
                            .map((c) => (
                              <SelectItem key={c.id_curso} value={c.codigo} className="font-bold text-sm">
                                [{c.codigo}] {c.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedPrerequisitos.map((codigo) => {
                          const curso = allCursos.find((c) => c.codigo === codigo);
                          return (
                            <Badge key={codigo} variant="secondary" className="text-xs flex items-center gap-2">
                              {curso?.nombre || codigo}
                              <button
                                type="button"
                                onClick={() => setSelectedPrerequisitos(selectedPrerequisitos.filter((c) => c !== codigo))}
                                className="ml-1 hover:text-red-500"
                              >
                                ×
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-sm px-6">Cancelar</Button>
                      <Button type="submit" className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-sm px-8 shadow-lg shadow-primary/20 transition-all">
                        {editingCurso ? "Actualizar" : "Crear"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold text-muted-foreground">Filtros:</span>
          </div>
          
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar curso..."
              className="pl-10 h-10 rounded-lg border-input bg-muted/50 font-semibold text-sm focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select value={filterCiclo} onValueChange={setFilterCiclo}>
              <SelectTrigger className="w-[150px] h-10 rounded-lg border-input bg-muted/50 font-semibold text-sm">
                <SelectValue placeholder="Ciclo" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border">
                <SelectItem value="all">Todos los ciclos</SelectItem>
                {ciclos.map((c) => (
                  <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="font-bold text-sm">
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterTipoCurso} onValueChange={setFilterTipoCurso}>
              <SelectTrigger className="w-[150px] h-10 rounded-lg border-input bg-muted/50 font-semibold text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border">
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="especializacion" className="font-bold text-sm">Especialización</SelectItem>
                <SelectItem value="obligatorio" className="font-bold text-sm">Obligatorio</SelectItem>
                <SelectItem value="opcional" className="font-bold text-sm">Opcional</SelectItem>
                <SelectItem value="electivo" className="font-bold text-sm">Electivo</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCreditos} onValueChange={setFilterCreditos}>
              <SelectTrigger className="w-[130px] h-10 rounded-lg border-input bg-muted/50 font-semibold text-sm">
                <SelectValue placeholder="Créditos" />
              </SelectTrigger>
              <SelectContent className="rounded-lg border-border">
                <SelectItem value="all">Todos créditos</SelectItem>
                <SelectItem value="1">1 Crédito</SelectItem>
                <SelectItem value="2">2 Créditos</SelectItem>
                <SelectItem value="3">3 Créditos</SelectItem>
                <SelectItem value="4">4 Créditos</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-3 ml-2 pl-3 border-l border-border">
              <Label htmlFor="hasPrerequisitos" className="text-sm font-semibold text-muted-foreground whitespace-nowrap">
                Con prerequisitos
              </Label>
              <Switch
                id="hasPrerequisitos"
                checked={filterHasPrerequisitos}
                onCheckedChange={setFilterHasPrerequisitos}
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* Pagination controls for cycles - only show if no specific cycle selected and no search term */}
          {filterCiclo === "all" && !searchTerm && nonEmptyCiclos.length > 0 && (
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
              <Button
                variant="ghost"
                onClick={() => setCurrentCycleIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentCycleIndex === 0}
                className="h-10 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {currentCiclo?.nombre || "Sin resultados"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentCiclo ? `${currentCiclo.cursos.length} cursos` : "No hay cursos para mostrar"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => setCurrentCycleIndex((prev) => Math.min(nonEmptyCiclos.length - 1, prev + 1))}
                disabled={currentCycleIndex === nonEmptyCiclos.length - 1}
                className="h-10 rounded-lg"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Show all matching courses when searching or specific cycle selected, otherwise show current cycle */}
          {(() => {
            let displayCursos: Curso[] = [];
            let displayTitle = "";
            let displayCiclo: Ciclo | undefined;

            if (searchTerm) {
              // Search across all courses
              filteredCiclos.forEach(ciclo => {
                displayCursos = [...displayCursos, ...ciclo.cursos];
              });
              displayTitle = `Resultados de búsqueda (${displayCursos.length} cursos)`;
            } else if (filterCiclo !== "all") {
              const ciclo = filteredCiclos.find(c => c.id_ciclo.toString() === filterCiclo);
              displayCursos = ciclo?.cursos || [];
              displayTitle = ciclo?.nombre || "";
              displayCiclo = ciclo;
            } else {
              displayCursos = currentCiclo?.cursos || [];
              displayTitle = currentCiclo?.nombre || "";
              displayCiclo = currentCiclo;
            }

            // Calculate total credits for the cycle
            let totalCreditos = 0;
            let electivosContados = 0;
            displayCursos.forEach(curso => {
              let creditosCalculados = curso.creditos;
              if (curso.tipo_curso === 'electivo' && electivosContados < 1) {
                creditosCalculados = 1;
                electivosContados++;
              } else if (curso.tipo_curso === 'electivo') {
                creditosCalculados = 0;
              }
              totalCreditos += creditosCalculados;
            });

            // Adjust total according to cycle number
            if (displayCiclo) {
              if (displayCiclo.numero === 1 || displayCiclo.numero === 5) {
                totalCreditos = 23;
              } else if (displayCiclo.numero !== 10) {
                totalCreditos = 22;
              }
              // For cycle 10, keep the calculated total since all are specialty (Tipo S)
            }

            if (displayCursos.length === 0 && !searchTerm && filterCiclo === "all") {
              return null;
            }

            return (
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                {displayTitle && (
                  <div className="bg-muted/50 px-6 py-4 border-b border-border">
                    <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" />
                      {displayTitle}
                    </h3>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <Table className="w-full">
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 w-28">Código</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3">Curso</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3">Departamento</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 text-center w-20">Tipo</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 text-center w-16">T</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 text-center w-16">P</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 text-center w-16">L</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 text-center w-20">Créd.</TableHead>
                        <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3">Prerequisitos</TableHead>
                        {isAdminOrSecretaria && (
                          <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-6 py-3 text-right w-32">Acciones</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border">
                      {displayCursos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={isAdminOrSecretaria ? 10 : 9} className="py-10 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">
                            No hay cursos para mostrar
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayCursos.map((curso) => (
                          <TableRow key={curso.id_curso} className="group hover:bg-muted/50 transition-colors">
                            <TableCell className="px-6 py-3">
                              <span className="font-mono text-sm font-bold text-muted-foreground">{curso.codigo}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                              <span className="font-bold text-foreground text-sm">{curso.nombre}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                              <span className="text-sm font-bold text-muted-foreground">{curso.departamento_responsable || "-"}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              {getTipoBadge(curso.tipo_curso)}
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <span className="text-sm font-bold text-foreground">{curso.horas_teoria}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <span className="text-sm font-bold text-foreground">{curso.horas_practica}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <span className="text-sm font-bold text-foreground">{curso.horas_laboratorio}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3 text-center">
                              <span className="text-sm font-bold text-foreground">{curso.creditos}</span>
                            </TableCell>
                            <TableCell className="px-6 py-3">
                              <div className="flex flex-wrap gap-1">
                                {curso.prerequisitos_rel.length === 0 ? (
                                  <span className="text-xs text-muted-foreground italic">Ninguno</span>
                                ) : (
                                  curso.prerequisitos_rel.map((p) => (
                                    <Badge key={p.id_prerequisito_curso} variant="secondary" className="text-xs">
                                      {p.prerequisito.codigo}
                                    </Badge>
                                  ))
                                )}
                              </div>
                            </TableCell>
                            {isAdminOrSecretaria && (
                              <TableCell className="px-6 py-3">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => handleEdit(curso)} title="Editar" className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-all">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => { setDeletingId(curso.id_curso); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-8 w-8 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 transition-all">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            )}
                          </TableRow>
                        ))
                      )}
                      {displayCursos.length > 0 && (
                        <TableRow className="bg-blue-50 font-bold">
                          <TableCell colSpan={isAdminOrSecretaria ? 9 : 8} className="px-6 py-4 text-right text-sm uppercase tracking-widest text-blue-800">
                            Total de Créditos del Ciclo:
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center text-xl text-blue-900">
                            {totalCreditos}
                          </TableCell>
                          {isAdminOrSecretaria && <TableCell></TableCell>}
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })()}

          {/* If no cycles with courses */}
          {nonEmptyCiclos.length === 0 && (
            <div className="bg-card rounded-xl border border-border shadow-sm p-10 text-center">
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                No hay cursos para mostrar con los filtros seleccionados
              </p>
            </div>
          )}
        </>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 bg-card text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">¿Está completamente seguro?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium">
              Esta acción no se puede deshacer. Se eliminará permanentemente el curso y sus relaciones de prerequisitos.
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
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 bg-card text-foreground">
          <AlertDialogHeader>
            {dependencias.length > 0 ? (
              <>
                <div className="flex items-center gap-3 text-destructive mb-2">
                  <AlertCircle className="h-6 w-6" />
                  <AlertDialogTitle className="text-xl font-bold">No se puede eliminar este curso</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-muted-foreground font-medium bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                  Este curso es prerequisito de los siguientes cursos:
                  <ul className="mt-2 list-disc list-inside">
                    {dependencias.map((dep, idx) => (
                      <li key={idx} className="font-bold">
                        [{dep.codigo}] {dep.nombre}
                      </li>
                    ))}
                  </ul>
                </AlertDialogDescription>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 text-destructive mb-2">
                  <AlertCircle className="h-6 w-6" />
                  <AlertDialogTitle className="text-xl font-bold">Error al eliminar</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-muted-foreground font-medium bg-destructive/5 p-4 rounded-xl border border-destructive/10">
                  {errorMessage}
                </AlertDialogDescription>
              </>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction onClick={() => { setIsErrorDialogOpen(false); setDependencias([]); }} className="h-11 rounded-xl bg-muted text-foreground hover:bg-muted/80 font-bold px-8 transition-all">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}