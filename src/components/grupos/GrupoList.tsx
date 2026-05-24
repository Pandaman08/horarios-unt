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

  const filteredGrupos = grupos.filter(g => 
    `${g.curso.nombre} ${g.codigo_grupo} ${g.periodo.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        toast.success(editingGrupo ? "Grupo actualizado" : "Grupo creado");
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Layers className="h-7 w-7 text-[#1a237e]" />
          </div>
          <div>
            <span className="text-[10px] bg-indigo-50 text-[#1a237e] uppercase tracking-wider font-extrabold px-2.5 py-1 rounded-lg">Organización</span>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight mt-2">Grupos Académicos</h2>
            <p className="text-slate-500 text-xs mt-1">Gestión de secciones y capacidades por curso</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Buscar por curso, grupo o periodo..." 
              className="pl-11 h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all"
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
              <Button className="h-11 bg-[#1a237e] hover:bg-[#121858] text-white rounded-xl px-6 font-bold text-xs shadow-lg shadow-indigo-900/10 transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl rounded-2xl p-8 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
                    <Layers className="h-8 w-8 text-[#1a237e]" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-bold text-slate-800 tracking-tight">
                      {editingGrupo ? "Actualizar Grupo" : "Registrar Grupo"}
                    </DialogTitle>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Configure la sección para la asignatura</p>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Periodo Académico</Label>
                    <Select value={formData.id_periodo} onValueChange={(v) => setFormData({ ...formData, id_periodo: v })}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {periodos.map(p => <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-xs py-2">{p.codigo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Asignatura</Label>
                    <Select value={formData.id_curso} onValueChange={(v) => setFormData({ ...formData, id_curso: v })}>
                      <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        {cursos.map(c => <SelectItem key={c.id_curso} value={c.id_curso.toString()} className="font-bold text-xs py-2">{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código de Grupo</Label>
                    <Input 
                      className={cn("h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all", editingGrupo && "bg-slate-100")} 
                      value={formData.codigo_grupo} 
                      onChange={(e) => setFormData({ ...formData, codigo_grupo: e.target.value.toUpperCase().slice(0, 5) })} 
                      required 
                      readOnly={!!editingGrupo}
                      placeholder="Ej: A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Capacidad Máxima</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-xs focus:ring-2 focus:ring-indigo-100 transition-all" 
                      value={formData.capacidad_maxima} 
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(100, parseInt(e.target.value) || 1));
                        setFormData({ ...formData, capacidad_maxima: val.toString() });
                      }} 
                      required 
                      min={1}
                      max={100}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-slate-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-slate-400 hover:bg-slate-50 px-8 text-xs">Cancelar</Button>
                  <Button type="submit" className="h-11 bg-[#1a237e] hover:bg-[#121858] text-white rounded-xl px-10 font-bold text-xs shadow-lg shadow-indigo-900/10 transition-all active:scale-95">
                    {editingGrupo ? "Actualizar Grupo" : "Crear Grupo"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4">Nombre de la Asignatura</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4 text-center">Periodo</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4 text-center">Grupo</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4 text-center">Capacidad</TableHead>
                <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-6 py-4 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Cargando grupos...</TableCell></TableRow>
              ) : filteredGrupos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredGrupos.map((grupo) => (
                  <TableRow key={grupo.id_grupo} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100 text-[#1a237e] shadow-sm">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-800 text-xs">{grupo.curso.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center text-xs font-bold text-slate-500">{grupo.periodo.codigo}</TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-[#1a237e] text-[10px] font-bold border border-indigo-100 uppercase tracking-widest">{grupo.codigo_grupo}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">{grupo.capacidad_maxima}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(grupo)} title="Editar" className="h-8 w-8 rounded-lg hover:bg-indigo-50 hover:text-[#1a237e] transition-all opacity-0 group-hover:opacity-100"><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(grupo.id_grupo); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-8 w-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-[400px]">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-4 border border-rose-100">
              <Trash2 className="h-8 w-8 text-rose-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">¿Eliminar este grupo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">Esta acción no se puede deshacer y afectará a la programación asociada.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-3">
            <AlertDialogCancel className="h-10 rounded-xl font-bold text-xs text-slate-400 hover:bg-slate-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-8">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-8 max-w-[450px]">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4 border border-amber-100">
              <Layers className="h-8 w-8 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Aviso del Sistema</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-4 leading-relaxed">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-10 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-bold text-xs px-10 shadow-lg shadow-indigo-900/10">Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
