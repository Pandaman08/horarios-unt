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
import { toast } from "sonner";
import { 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Search, 
  BookOpen, 
  Clock, 
  Star, 
  Layers,
  GraduationCap,
  AlertTriangle,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AsignarAmbientesDialog } from "./AsignarAmbientesDialog";
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

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  horas_teoria: number;
  horas_laboratorio: number;
  horas_practica: number;
  creditos: number;
  ciclo: number;
}

export function CursoList() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCurso, setEditingCurso] = useState<Curso | null>(null);
  const [isAmbientesOpen, setIsAmbientesOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<Curso | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const filteredCursos = cursos.filter(c => 
    `${c.nombre} ${c.codigo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    horas_teoria: "0",
    horas_laboratorio: "0",
    horas_practica: "0",
    creditos: "0",
    ciclo: "",
    plan_estudios: "",
    prerequisitos: "",
  });

  useEffect(() => {
    fetchCursos();
  }, []);

  const fetchCursos = async () => {
    try {
      const res = await fetch("/api/cursos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setCursos(data);
      } else {
        setCursos([]);
      }
    } catch (error) {
      toast.error("Error al cargar cursos");
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

  const handleEdit = (curso: Curso) => {
    setEditingCurso(curso);
    setFormData({
      codigo: curso.codigo,
      nombre: curso.nombre,
      horas_teoria: curso.horas_teoria.toString(),
      horas_laboratorio: curso.horas_laboratorio.toString(),
      horas_practica: curso.horas_practica.toString(),
      creditos: curso.creditos.toString(),
      ciclo: curso.ciclo?.toString() || "",
      plan_estudios: "",
      prerequisitos: "",
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
      ciclo: "",
      plan_estudios: "",
      prerequisitos: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar curso por nombre o código..." 
            className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-[#003366]/10 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingCurso(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Curso
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-[90vw] lg:max-w-5xl rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[95vh] overflow-x-hidden">
            <DialogHeader className="mb-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-[#003366]" />
                </div>
                <div>
                  <DialogTitle className="text-3xl font-black text-gray-900 tracking-tight">
                    {editingCurso ? "Actualizar Curso" : "Registrar Nuevo Curso"}
                  </DialogTitle>
                  <p className="text-base text-gray-500 font-medium">Defina los parámetros académicos de la asignatura.</p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Código del Curso</Label>
                  <Input
                    placeholder="Ej: CUR-001"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Créditos Académicos</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.creditos}
                    onChange={(e) => setFormData({ ...formData, creditos: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Ciclo Académico</Label>
                  <Input
                    type="number"
                    placeholder="1 al 10"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.ciclo}
                    onChange={(e) => setFormData({ ...formData, ciclo: e.target.value })}
                    required
                  />
                </div>
                <div className="md:col-span-2 lg:col-span-3 space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Nombre Completo de la Asignatura</Label>
                  <Input
                    placeholder="Ej: Ingeniería de Software I"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Horas Teoría (Semanales)</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base text-center"
                    value={formData.horas_teoria}
                    onChange={(e) => setFormData({ ...formData, horas_teoria: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Horas Laboratorio</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base text-center"
                    value={formData.horas_laboratorio}
                    onChange={(e) => setFormData({ ...formData, horas_laboratorio: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 ml-1">Horas Práctica</Label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base text-center"
                    value={formData.horas_practica}
                    onChange={(e) => setFormData({ ...formData, horas_practica: e.target.value })}
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
                  {editingCurso ? "Actualizar Asignatura" : "Crear Asignatura"}
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
                <TableHead className="w-[120px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8">Código</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Asignatura</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Créditos</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 text-center">Horas (TEO/LAB)</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-blue-100 border-t-[#003366] rounded-full animate-spin" />
                      <p className="text-sm font-bold text-gray-400">Cargando catálogo...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCursos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                        <BookOpen className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-black text-gray-400 tracking-tight">No hay cursos registrados</p>
                      <p className="text-sm text-gray-400 font-medium">Comience agregando una nueva asignatura al sistema.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCursos.map((curso) => (
                  <TableRow key={curso.id_curso} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="px-8 font-black text-xs text-gray-400">{curso.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-[#003366] transition-colors">
                          <GraduationCap className="h-5 w-5 text-[#003366] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 tracking-tight">{curso.nombre}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Layers className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ciclo {curso.ciclo}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center bg-yellow-50 text-yellow-700 border-none font-black text-[10px] px-3 py-1 rounded-lg">
                        {curso.creditos} CR
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Teo</span>
                          <span className="text-sm font-bold text-[#003366]">{curso.horas_teoria}h</span>
                        </div>
                        <div className="w-px h-6 bg-gray-100" />
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-black text-gray-400 uppercase">Lab</span>
                          <span className="text-sm font-bold text-purple-600">{curso.horas_laboratorio}h</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedCurso(curso);
                            setIsAmbientesOpen(true);
                          }}
                          title="Asignar Ambientes"
                          className="h-9 w-9 rounded-xl hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <MapPin className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(curso)}
                          title="Editar"
                          className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(curso.id_curso);
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
              Esta acción marcará el curso como inactivo. Esta operación es segura siempre que no existan dependencias académicas activas.
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

      <AsignarAmbientesDialog
        cursoId={selectedCurso?.id_curso || 0}
        cursoNombre={selectedCurso?.nombre || ""}
        isOpen={isAmbientesOpen}
        onClose={() => {
          setIsAmbientesOpen(false);
          setSelectedCurso(null);
        }}
      />
    </div>
  );
}
