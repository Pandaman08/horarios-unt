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
  Users, 
  BookOpen, 
  Calendar,
  Hash,
  AlertTriangle,
  Info
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar por curso o grupo..." 
            className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-[#003366]/10 font-medium"
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
            <Button className="bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-[90vw] lg:max-w-5xl rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[95vh] overflow-x-hidden">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <Layers className="h-8 w-8 text-[#003366]" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                    {editingGrupo ? "Editar Configuración" : "Nuevo Grupo de Estudios"}
                  </DialogTitle>
                  <p className="text-base text-gray-500 font-medium">Asocie un grupo a un curso y periodo específico.</p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Periodo Académico</Label>
                  <Select
                    value={formData.id_periodo}
                    onValueChange={(value) => setFormData({ ...formData, id_periodo: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue placeholder="Seleccione el periodo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      {periodos.map((p) => (
                        <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold">
                          {p.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Asignatura / Curso</Label>
                  <Select
                    value={formData.id_curso}
                    onValueChange={(value) => setFormData({ ...formData, id_curso: value })}
                  >
                    <SelectTrigger className="h-12 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue placeholder="Seleccione el curso" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl max-h-[300px]">
                      {cursos.map((c) => (
                        <SelectItem key={c.id_curso} value={c.id_curso.toString()} className="font-bold">
                          {`${c.codigo} - ${c.nombre}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Identificador de Grupo</Label>
                  <Input
                    placeholder="Ej: A, B, C1"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.codigo_grupo}
                    onChange={(e) => setFormData({ ...formData, codigo_grupo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Capacidad Máxima</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.capacidad_maxima}
                    onChange={(e) => setFormData({ ...formData, capacidad_maxima: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-12 rounded-xl font-bold text-gray-500 px-8 hover:bg-gray-100"
                >
                  Cancelar
                </Button>
                <Button type="submit" className="h-12 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-12 font-black shadow-xl shadow-blue-900/20 transition-all hover:scale-[1.02]">
                  {editingGrupo ? "Actualizar Configuración" : "Crear Grupo"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl shadow-blue-900/5 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8">Periodo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Curso / Asignatura</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Grupo</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Capacidad</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-blue-100 border-t-[#003366] rounded-full animate-spin" />
                      <p className="text-sm font-bold text-gray-400">Cargando grupos...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredGrupos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                        <Layers className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-black text-gray-400 tracking-tight">No hay grupos registrados</p>
                      <p className="text-sm text-gray-400 font-medium">Asocie grupos a los cursos del catálogo.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrupos.map((grupo) => (
                  <TableRow key={grupo.id_grupo} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="px-8 font-black text-xs text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {grupo.periodo.codigo}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-[#003366] transition-colors">
                          <BookOpen className="h-5 w-5 text-[#003366] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 tracking-tight">{grupo.curso.nombre}</span>
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{grupo.curso.codigo}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center bg-[#003366] text-white border-none font-black text-xs px-4 py-1 rounded-lg">
                        {grupo.codigo_grupo}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-lg">
                        <Users className="h-3.5 w-3.5 text-gray-400" />
                        <span className="text-sm font-black text-[#003366]">{grupo.capacidad_maxima}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(grupo)}
                          title="Editar"
                          className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(grupo.id_grupo);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Eliminar"
                          className="h-9 w-9 rounded-xl hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Ventana de Advertencia de Eliminación */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-gray-900">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-gray-500">
              Esta acción marcará el grupo como inactivo. Asegúrese de que no existan asignaciones de horarios vinculadas a este grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-bold border-gray-200 hover:bg-gray-50">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && handleDelete(deletingId)}
              className="h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black px-8"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ventana de Error por Dependencias */}
      <AlertDialog open={isErrorDialogOpen} onOpenChange={setIsErrorDialogOpen}>
        <AlertDialogContent className="rounded-[32px] border-none shadow-2xl p-8">
          <AlertDialogHeader>
            <div className="h-14 w-14 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
              <Info className="h-8 w-8 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-2xl font-black text-gray-900">No se puede eliminar</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium text-gray-600 bg-amber-50 p-4 rounded-2xl border border-amber-100">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction 
              onClick={() => setIsErrorDialogOpen(false)}
              className="h-12 rounded-xl bg-[#003366] hover:bg-[#002244] text-white font-black px-8"
            >
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
