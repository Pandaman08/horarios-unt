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
  GraduationCap
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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Cursos</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Mantenimiento de asignaturas</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar curso..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
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
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Curso
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-3xl rounded-2xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-8 w-8 text-[#003366]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">
                      {editingCurso ? "Actualizar Curso" : "Registrar Curso"}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Código</Label>
                    <Input 
                      className={cn("h-11 rounded-xl border-gray-200 font-bold text-[16px]", editingCurso && "bg-gray-50")} 
                      value={formData.codigo} 
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase().slice(0, 10) })} 
                      required 
                      readOnly={!!editingCurso}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Nombre</Label>
                    <Input 
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value.slice(0, 100) })} 
                      required 
                      maxLength={100}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-6 md:col-span-3">
                    <div className="space-y-2">
                      <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">T (hrs)</Label>
                      <Input 
                        type="number" 
                        className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                        value={formData.horas_teoria} 
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                          setFormData({ ...formData, horas_teoria: val.toString() });
                        }} 
                        min={0}
                        max={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">L (hrs)</Label>
                      <Input 
                        type="number" 
                        className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                        value={formData.horas_laboratorio} 
                        onChange={(e) => {
                          const val = Math.max(0, Math.min(20, parseInt(e.target.value) || 0));
                          setFormData({ ...formData, horas_laboratorio: val.toString() });
                        }} 
                        min={0}
                        max={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">P (hrs)</Label>
                      <Input 
                        type="number" 
                        className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
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
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Créditos</Label>
                    <Input 
                      type="number" 
                      className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                      value={formData.creditos} 
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                        setFormData({ ...formData, creditos: val.toString() });
                      }} 
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Ciclo</Label>
                    <Select 
                      value={formData.id_ciclo} 
                      onValueChange={(val) => setFormData({ ...formData, id_ciclo: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]">
                        <SelectValue placeholder="Seleccionar ciclo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        {ciclos.map((c) => (
                          <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="font-bold">
                            {c.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Tipo de Curso</Label>
                    <Select 
                      value={formData.tipo_curso} 
                      onValueChange={(val) => setFormData({ ...formData, tipo_curso: val })}
                    >
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]">
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                        <SelectItem value="general" className="font-bold">General</SelectItem>
                        <SelectItem value="linea_carrera" className="font-bold">Línea de Carrera</SelectItem>
                        <SelectItem value="electivo" className="font-bold">Electivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-gray-500 px-8 text-[16px]">Cancelar</Button>
                  <Button type="submit" className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black text-[16px]">
                    {editingCurso ? "Actualizar" : "Crear"}
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
                <TableHead className="w-[100px]">Cód.</TableHead>
                <TableHead>Nombre de la Asignatura</TableHead>
                <TableHead className="w-[80px] text-center">T</TableHead>
                <TableHead className="w-[80px] text-center">L</TableHead>
                <TableHead className="w-[80px] text-center">P</TableHead>
                <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[11px] text-center">Créd.</TableHead>
                <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[11px]">Ciclo</TableHead>
                <TableHead className="font-black text-gray-400 uppercase tracking-widest text-[11px] text-right pr-8">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando cursos...</TableCell></TableRow>
              ) : filteredCursos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredCursos.map((curso) => (
                  <TableRow key={curso.id_curso} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-bold text-[14px] text-gray-500">{curso.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <GraduationCap className="h-5 w-5 text-[#003366]/50" />
                        <span className="font-bold text-gray-900 truncate text-[16px]">{curso.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-[14px] font-bold text-gray-600">{curso.horas_teoria}</TableCell>
                    <TableCell className="text-center text-[14px] font-bold text-gray-600">{curso.horas_laboratorio}</TableCell>
                    <TableCell className="text-center text-[14px] font-bold text-gray-600">{curso.horas_practica}</TableCell>
                    <TableCell className="text-center">
                      <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#003366] text-[12px] font-black">{curso.creditos}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-[14px] font-bold text-gray-600">
                        {curso.ciclo_rel?.nombre || "No asignado"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedCurso(curso); setIsAmbientesOpen(true); }} title="Asignar Ambientes" className="h-9 w-9 hover:bg-emerald-50 hover:text-emerald-600"><MapPin className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(curso)} title="Editar" className="h-9 w-9 hover:bg-blue-50 hover:text-[#003366]"><Edit className="h-5 w-5" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { setDeletingId(curso.id_curso); setIsDeleteDialogOpen(true); }} title="Eliminar" className="h-9 w-9 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-5 w-5" /></Button>
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
            <AlertDialogTitle className="text-xl font-black text-gray-900">¿Confirmar eliminación?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-500">Esta acción marcará el curso como inactivo.</AlertDialogDescription>
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
            <AlertDialogTitle className="text-xl font-black text-gray-900">Aviso del Sistema</AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-600 bg-amber-50 p-4 rounded-lg border border-amber-100">{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction onClick={() => setIsErrorDialogOpen(false)} className="h-10 rounded-lg bg-[#003366] hover:bg-[#002244] text-white font-black text-sm px-8">Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AsignarAmbientesDialog cursoId={selectedCurso?.id_curso || 0} cursoNombre={selectedCurso?.nombre || ""} isOpen={isAmbientesOpen} onClose={() => { setIsAmbientesOpen(false); setSelectedCurso(null); }} />
    </div>
  );
}
