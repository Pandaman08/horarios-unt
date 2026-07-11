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
  Layers, 
  BookOpen
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

interface Grupo {
  id_grupo: number;
  id_curso: number;
  id_periodo: number;
  codigo_grupo: string;
  capacidad_maxima: number;
  curso: { nombre: string; codigo: string };
  periodo: { codigo: string };
}

interface Curso {
  id_curso: number;
  nombre: string;
  codigo: string;
}

interface Periodo {
  id_periodo: number;
  codigo: string;
}

export function GrupoList() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredGrupos = grupos.filter(g => 
    `${g.curso.nombre} ${g.codigo_grupo} ${g.periodo.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredGrupos.length / itemsPerPage);
  const currentItems = filteredGrupos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const [formData, setFormData] = useState({
    id_curso: "",
    id_periodo: "",
    codigo_grupo: "",
    capacidad_maxima: "40",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gruposRes, cursosRes, periodosRes] = await Promise.all([
        fetch("/api/grupos"),
        fetch("/api/cursos"),
        fetch("/api/periodos"),
      ]);

      const processRes = async (res: Response, name: string) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const errorData = contentType?.includes("application/json") ? await res.json() : {};
          throw new Error(errorData.error || `Error al cargar ${name}`);
        }
        if (!contentType?.includes("application/json")) {
          const text = await res.text();
          console.error(`Respuesta no es JSON de /api/${name}:`, text.substring(0, 200));
          throw new Error(`La respuesta de ${name} no es un JSON válido`);
        }
        return res.json();
      };

      const [gruposData, cursosData, periodosData] = await Promise.all([
        processRes(gruposRes, "grupos"),
        processRes(cursosRes, "cursos"),
        processRes(periodosRes, "periodos"),
      ]);

      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setCursos(Array.isArray(cursosData) ? cursosData : []);
      setPeriodos(Array.isArray(periodosData) ? periodosData : []);
    } catch (error: any) {
      console.error("Error en fetchData:", error);
      toast.error(error.message || "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingGrupo ? "PUT" : "POST";
    const url = editingGrupo 
      ? `/api/grupos/${editingGrupo.id_grupo}` 
      : "/api/grupos";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(editingGrupo ? "Grupo actualizado" : "Grupo creado");
        
        // Show warning if present
        if (data.warning) {
          toast.warning(data.warning, { duration: 6000 });
        }
        
        setIsDialogOpen(false);
        setEditingGrupo(null);
        resetForm();
        fetchData();
      } else {
        toast.error("Error al guardar grupo");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/grupos/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (res.ok) {
        toast.success("Grupo eliminado");
        fetchData();
      } else {
        setErrorMessage(data.error || "Error al eliminar grupo");
        setIsErrorDialogOpen(true);
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setFormData({
      id_curso: grupo.id_curso.toString(),
      id_periodo: grupo.id_periodo.toString(),
      codigo_grupo: grupo.codigo_grupo,
      capacidad_maxima: grupo.capacidad_maxima.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      id_curso: "",
      id_periodo: "",
      codigo_grupo: "",
      capacidad_maxima: "40",
    });
  };

  return (
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-brand">
          <div className="page-icon-box">
            <Layers className="page-icon" />
          </div>
          <div>
            <span className="text-xs bg-primary/10 text-primary uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg">Organización</span>
            <h2 className="page-title">Grupos Académicos</h2>
            <p className="page-subtitle">Gestión de secciones y capacidades por curso</p>
          </div>
        </div>

        <div className="page-toolbar">
          <div className="page-search-wrap">
            <Search className="page-search-icon" />
            <Input 
              placeholder="Buscar por curso, grupo o periodo..." 
              className="page-search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingGrupo(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button className="page-btn">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="page-modal-lg">
              <DialogHeader className="page-modal-header">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                    <Layers className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-foreground">
                      {editingGrupo ? "Actualizar Grupo" : "Registrar Grupo"}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Defina la sección y capacidad para el curso seleccionado
                    </p>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="page-modal-body space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Periodo Académico</Label>
                    <Select value={formData.id_periodo} onValueChange={(v) => setFormData(p => ({ ...p, id_periodo: v }))}>
                      <SelectTrigger className="page-modal-input"><SelectValue placeholder="Seleccionar periodo" /></SelectTrigger>
                      <SelectContent className="rounded-lg border-border shadow-xl">
                        {periodos.map(p => <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-sm">{p.codigo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Curso</Label>
                    <Select value={formData.id_curso} onValueChange={(v) => setFormData(p => ({ ...p, id_curso: v }))}>
                      <SelectTrigger className="page-modal-input"><SelectValue placeholder="Seleccionar curso" /></SelectTrigger>
                      <SelectContent className="rounded-lg border-border shadow-xl">
                        {cursos.map(c => <SelectItem key={c.id_curso} value={c.id_curso.toString()} className="font-bold text-sm">{c.nombre} ({c.codigo})</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Código de Grupo</Label>
                    <Input 
                      className={cn("page-modal-input", editingGrupo && "bg-muted/30")} 
                      value={formData.codigo_grupo}
                      onChange={(e) => setFormData(p => ({ ...p, codigo_grupo: e.target.value.toUpperCase().slice(0, 5) }))}
                      required 
                      readOnly={!!editingGrupo}
                      placeholder="Ej: A, B, C..."
                    />
                  </div>
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Capacidad Máxima</Label>
                    <Input 
                      type="number" 
                      className="page-modal-input" 
                      value={formData.capacidad_maxima} 
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                        setFormData(p => ({ ...p, capacidad_maxima: val.toString() }));
                      }} 
                      required 
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
                <div className="page-modal-footer border-t border-border pt-4">
                  <div className="page-actions-row justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="page-modal-btn-cancel">Cancelar</Button>
                    <Button type="submit" className="page-modal-btn-submit">
                      {editingGrupo ? "Guardar Cambios" : "Crear Grupo"}
                    </Button>
                  </div>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="page-table-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-b border-border hover:bg-muted/50">
                <TableHead className="text-xs font-black text-muted-foreground uppercase tracking-widest h-14 px-6">Curso</TableHead>
                <TableHead className="text-xs font-black text-muted-foreground uppercase tracking-widest h-14 px-6">Grupo</TableHead>
                <TableHead className="text-xs font-black text-muted-foreground uppercase tracking-widest h-14 px-6">Periodo</TableHead>
                <TableHead className="text-xs font-black text-muted-foreground uppercase tracking-widest h-14 px-6 text-center">Capacidad</TableHead>
                <TableHead className="text-xs font-black text-muted-foreground uppercase tracking-widest h-14 px-6 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                      <span className="text-sm font-black text-muted-foreground uppercase tracking-widest">Cargando grupos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-40 text-center text-sm font-black text-muted-foreground uppercase tracking-widest">
                    No se encontraron grupos registrados
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((grupo) => (
                  <TableRow key={grupo.id_grupo} className="group hover:bg-muted/30 border-b border-border transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/5 rounded-xl flex items-center justify-center border border-primary/10 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-foreground text-sm leading-none">{grupo.curso.nombre}</span>
                          <span className="text-xs font-bold text-muted-foreground mt-1.5 uppercase tracking-wider">{grupo.curso.codigo}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="inline-flex items-center bg-primary/10 text-primary font-black text-xs uppercase tracking-widest px-3 py-1 rounded-lg border border-primary/20">
                        Grupo {grupo.codigo_grupo}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="font-bold text-foreground text-sm">{grupo.periodo.codigo}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="font-bold text-foreground text-sm">{grupo.capacidad_maxima} alumnos</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(grupo)}
                          className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setDeletingId(grupo.id_grupo); setIsDeleteDialogOpen(true); }}
                          className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                        >
                          <Trash2 className="h-4.5 w-4.5" />
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
            <div className="h-14 w-14 bg-destructive/10 rounded-2xl flex items-center justify-center mb-4 border border-destructive/20">
              <Trash2 className="h-8 w-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground tracking-tight">¿Eliminar este grupo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground mt-2 leading-relaxed">Esta acción no se puede deshacer y afectará a la programación asociada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="page-modal-alert-btn">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="page-modal-alert-btn bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/10">
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="page-modal-alert">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4 border border-amber-500/20">
              <Layers className="h-8 w-8 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-foreground tracking-tight">Aviso del Sistema</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-muted-foreground bg-amber-500/5 p-4 rounded-xl border border-amber-500/10 mt-4 leading-relaxed">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="page-modal-alert-btn bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/10">Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
