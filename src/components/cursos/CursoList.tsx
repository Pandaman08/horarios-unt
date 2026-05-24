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
  MapPin, 
  Search, 
  BookOpen, 
  GraduationCap,
  AlertCircle
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
  id_ciclo?: number;
  tipo_curso: string;
  ciclo_rel?: {
    id_ciclo: number;
    nombre: string;
  };
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
  const [ciclos, setCiclos] = useState<any[]>([]);

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
  };

  return (
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
            <BookOpen className="h-4 w-4 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">Cursos</h2>
            <p className="text-slate-500 text-[10px] mt-1">Mantenimiento de asignaturas y planes de estudio</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar curso..." 
              className="pl-9 h-9 rounded-lg border-slate-200 bg-slate-50/50 font-semibold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
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
              <Button className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl rounded-xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100">
                    <BookOpen className="h-5 w-5 text-[#1a237e]" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg font-bold text-slate-800 tracking-tight">
                      {editingCurso ? "Actualizar Curso" : "Registrar Curso"}
                    </DialogTitle>
                    <p className="text-slate-500 text-xs mt-1 font-medium">Complete la información de la asignatura</p>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Código</Label>
                    <Input 
                      className={cn("h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all", editingCurso && "bg-slate-100")} 
                      value={formData.codigo} 
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 10) })} 
                      required 
                      readOnly={!!editingCurso}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Nombre</Label>
                    <Input 
                      className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 100) })} 
                      required 
                      maxLength={100}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4 md:col-span-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">T (hrs)</Label>
                      <Input 
                        type="number" 
                        className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                        value={formData.horas_teoria} 
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                          setFormData({ ...formData, horas_teoria: val.toString() });
                        }} 
                        min={0}
                        max={20}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">L (hrs)</Label>
                      <Input 
                        type="number" 
                        className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                        value={formData.horas_laboratorio} 
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                          setFormData({ ...formData, horas_laboratorio: val.toString() });
                        }} 
                        min={0}
                        max={20}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">P (hrs)</Label>
                      <Input 
                        type="number" 
                        className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                        value={formData.horas_practica} 
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                          setFormData({ ...formData, horas_practica: val.toString() });
                        }} 
                        min={0}
                        max={20}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Créditos</Label>
                    <Input 
                      type="number" 
                      className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all" 
                      value={formData.creditos} 
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                        setFormData({ ...formData, creditos: val.toString() });
                      }} 
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Ciclo</Label>
                    <Select 
                      value={formData.id_ciclo} 
                      onValueChange={(val) => setFormData({ ...formData, id_ciclo: val })}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all">
                        <SelectValue placeholder="Ciclo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                        {ciclos.map((c) => (
                          <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="font-bold text-[11px] py-1.5">
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 ml-1">Tipo</Label>
                    <Select 
                      value={formData.tipo_curso} 
                      onValueChange={(val) => setFormData({ ...formData, tipo_curso: val })}
                    >
                      <SelectTrigger className="h-9 rounded-lg border-slate-200 bg-slate-50/50 font-bold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-100 shadow-xl">
                        <SelectItem value="general" className="font-bold text-[11px] py-1.5">General</SelectItem>
                        <SelectItem value="linea_carrera" className="font-bold text-[11px] py-1.5">Línea de Carrera</SelectItem>
                        <SelectItem value="electivo" className="font-bold text-[11px] py-1.5">Electivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-slate-400 hover:bg-slate-50 px-6 text-[11px]">Cancelar</Button>
                  <Button type="submit" className="h-9 bg-[#1a237e] hover:bg-[#121858] text-white rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                    {editingCurso ? "Actualizar" : "Crear"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Cód.</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Asignatura</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">T</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">L</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">P</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">Créd.</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Ciclo</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : filteredCursos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredCursos.map((curso) => (
                  <TableRow key={curso.id_curso} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[9px] font-bold text-slate-400">{curso.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center border border-indigo-100 text-[#1a237e] shadow-sm">
                          <GraduationCap className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-semibold text-slate-800 text-[11px]">{curso.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center text-[11px] font-bold text-slate-500">{curso.horas_teoria}</TableCell>
                    <TableCell className="px-4 py-2 text-center text-[11px] font-bold text-slate-500">{curso.horas_laboratorio}</TableCell>
                    <TableCell className="px-4 py-2 text-center text-[11px] font-bold text-slate-500">{curso.horas_practica}</TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-[#1a237e] text-[9px] font-bold border border-indigo-100">{curso.creditos}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="text-[10px] font-bold text-slate-500">
                        {curso.ciclo_rel?.nombre || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedCurso(curso); setIsAmbientesOpen(true); }} title="Asignar Ambientes" className="h-7 w-7 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"><MapPin className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(curso)} title="Editar" className="h-7 w-7 rounded-lg hover:bg-indigo-50 hover:text-[#1a237e] transition-all opacity-0 group-hover:opacity-100"><Edit className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(curso.id_curso); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-7 w-7 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></Button>
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
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 mt-2">Esta acción marcará el curso como inactivo en el sistema.</AlertDialogDescription>
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
            <AlertDialogTitle className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              Aviso del Sistema
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-slate-500 bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-4 leading-relaxed">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-10 rounded-xl bg-[#1a237e] hover:bg-[#121858] text-white font-bold text-xs px-10 shadow-lg shadow-indigo-900/10">Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AsignarAmbientesDialog cursoId={selectedCurso?.id_curso || 0} cursoNombre={selectedCurso?.nombre || ""} isOpen={isAmbientesOpen} onClose={() => { setIsAmbientesOpen(false); setSelectedCurso(null); }} />
    </div>
  );
}
