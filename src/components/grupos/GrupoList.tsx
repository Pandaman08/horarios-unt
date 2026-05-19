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
      const [gruposData, cursosData, periodosData] = await Promise.all([
        gruposRes.json(),
        cursosRes.json(),
        periodosRes.json(),
      ]);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setCursos(Array.isArray(cursosData) ? cursosData : []);
      setPeriodos(Array.isArray(periodosData) ? periodosData : []);
    } catch (error) {
      toast.error("Error al cargar datos");
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Layers className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Grupos</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Gestión de secciones académicas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar grupo..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
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
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm transition-all">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-3xl rounded-2xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Layers className="h-8 w-8 text-[#003366]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">
                      {editingGrupo ? "Editar Grupo" : "Registrar Grupo"}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Periodo Académico</Label>
                    <Select value={formData.id_periodo} onValueChange={(v) => setFormData({ ...formData, id_periodo: v })}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {periodos.map(p => <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-[16px]">{p.codigo}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Asignatura</Label>
                    <Select value={formData.id_curso} onValueChange={(v) => setFormData({ ...formData, id_curso: v })}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {cursos.map(c => <SelectItem key={c.id_curso} value={c.id_curso.toString()} className="font-bold text-[16px]">{c.nombre}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Código de Grupo</Label>
                    <Input 
                      className={cn("h-11 rounded-xl border-gray-200 font-bold text-[16px]", editingGrupo && "bg-gray-50")} 
                      value={formData.codigo_grupo} 
                      onChange={(e) => setFormData({ ...formData, codigo_grupo: e.target.value.toUpperCase().slice(0, 5) })} 
                      required 
                      readOnly={!!editingGrupo}
                      placeholder="Ej: A"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Capacidad Máxima</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
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
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-gray-500 px-8 text-[16px]">Cancelar</Button>
                  <Button type="submit" className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black text-[16px]">
                    {editingGrupo ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead>Nombre de la Asignatura</TableHead>
                <TableHead className="w-[150px] text-center">Periodo</TableHead>
                <TableHead className="w-[120px] text-center">Grupo</TableHead>
                <TableHead className="w-[120px] text-center">Capacidad</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando grupos...</TableCell></TableRow>
              ) : filteredGrupos.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredGrupos.map((grupo) => (
                  <TableRow key={grupo.id_grupo} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <BookOpen className="h-5 w-5 text-[#003366]/50" />
                        <span className="font-bold text-gray-900 truncate text-[16px]">{grupo.curso.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[14px] font-bold text-gray-500">{grupo.periodo.codigo}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#003366] text-[12px] font-black uppercase tracking-tight">{grupo.codigo_grupo}</span>
                    </TableCell>
                    <TableCell className="text-center text-[14px] font-bold text-gray-600">{grupo.capacidad_maxima}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(grupo)} title="Editar" className="h-9 w-9 hover:bg-blue-50 hover:text-[#003366]"><Edit className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(grupo.id_grupo); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-9 w-9 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-5 w-5" /></Button>
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
        <AlertDialogContent className="rounded-lg border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">¿Eliminar este grupo?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-500">Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-10 rounded-lg font-bold text-sm">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingId && handleDelete(deletingId)} className="h-10 rounded-lg bg-red-600 hover:bg-red-700 text-white font-black text-sm px-6">Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-lg border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">Aviso</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-600 bg-amber-50 p-4 rounded-lg border border-amber-100">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-10 rounded-lg bg-[#003366] hover:bg-[#002244] text-white font-black text-sm px-8">Cerrar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
