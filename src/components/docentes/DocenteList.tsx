"use client";

import { useState, useEffect, useMemo } from "react";
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
  BookOpen, 
  Search, 
  UserCircle2, 
  Mail, 
  Phone, 
  GraduationCap, 
  MoreVertical, 
  Briefcase,
  Users,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AsignarCursosDialog } from "./AsignarCursosDialog";

interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  modalidad: string;
  categoria: string;
  dedicacion: string;
  antiguedad: number;
  correo_electronico: string;
  telefono: string;
}

export function DocenteList() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocente, setEditingDocente] = useState<Docente | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocentes = docentes.filter(d => 
    `${d.nombres} ${d.apellidos} ${d.codigo_docente}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [formData, setFormData] = useState({
    codigo_docente: "",
    nombres: "",
    apellidos: "",
    modalidad: "nombrado",
    categoria: "principal",
    dedicacion: "tiempo_completo",
    antiguedad: "0",
    correo_electronico: "",
    telefono: "",
    grado_academico: "",
    especialidad: "",
  });

  // Calcular el siguiente código disponible
  const suggestedCode = useMemo(() => {
    if (docentes.length === 0) return "1001";
    const codes = docentes
      .map(d => parseInt(d.codigo_docente))
      .filter(c => !isNaN(c));
    if (codes.length === 0) return "1001";
    return (Math.max(...codes) + 1).toString();
  }, [docentes]);

  // Validar si el código ya existe (solo para nuevos registros o si cambia en edición)
  const isCodeDuplicate = useMemo(() => {
    if (!formData.codigo_docente) return false;
    return docentes.some(d => 
      d.codigo_docente === formData.codigo_docente && 
      d.id_docente !== editingDocente?.id_docente
    );
  }, [formData.codigo_docente, docentes, editingDocente]);

  useEffect(() => {
    fetchDocentes();
  }, []);

  useEffect(() => {
    // Autocompletar código si es un registro nuevo y el diálogo se abre
    if (isDialogOpen && !editingDocente && !formData.codigo_docente) {
      setFormData(prev => ({ ...prev, codigo_docente: suggestedCode }));
    }
  }, [isDialogOpen, editingDocente, suggestedCode]);

  const fetchDocentes = async () => {
    try {
      const res = await fetch("/api/docentes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocentes(data);
      } else {
        setDocentes([]);
      }
    } catch (error) {
      toast.error("Error al cargar docentes");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDocente ? "PUT" : "POST";
    const url = editingDocente 
      ? `/api/docentes/${editingDocente.id_docente}` 
      : "/api/docentes";

    try {
      if (isCodeDuplicate) {
        toast.error(`El código ${formData.codigo_docente} ya está en uso.`);
        return;
      }

      // Validación de seguridad: antigüedad no mayor a 50 años (asumiendo edad promedio de jubilación)
      if (parseInt(formData.antiguedad) > 50) {
        toast.error("La antigüedad no puede ser mayor a 50 años por políticas institucionales.");
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingDocente ? "Docente actualizado" : "Docente creado");
        setIsDialogOpen(false);
        setEditingDocente(null);
        resetForm();
        fetchDocentes();
      } else {
        toast.error("Error al guardar docente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este docente?")) return;

    try {
      const res = await fetch(`/api/docentes/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Docente eliminado");
        fetchDocentes();
      } else {
        toast.error("Error al eliminar docente");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleEdit = (docente: Docente) => {
    setEditingDocente(docente);
    setFormData({
      codigo_docente: docente.codigo_docente,
      nombres: docente.nombres,
      apellidos: docente.apellidos,
      modalidad: docente.modalidad,
      categoria: docente.categoria,
      dedicacion: docente.dedicacion,
      antiguedad: docente.antiguedad.toString(),
      correo_electronico: docente.correo_electronico || "",
      telefono: docente.telefono || "",
      grado_academico: "",
      especialidad: "",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      codigo_docente: "",
      nombres: "",
      apellidos: "",
      modalidad: "nombrado",
      categoria: "principal",
      dedicacion: "tiempo_completo",
      antiguedad: "0",
      correo_electronico: "",
      telefono: "",
      grado_academico: "",
      especialidad: "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header y Acciones */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Buscar docente por nombre o código..." 
            className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-[#003366]/10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingDocente(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
              <Plus className="mr-2 h-4 w-4" /> Nuevo Docente
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] md:w-[90vw] lg:max-w-5xl rounded-[32px] p-8 border-none shadow-2xl overflow-y-auto max-h-[95vh] overflow-x-hidden">
            <DialogHeader className="mb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center">
                  <UserCircle2 className="h-6 w-6 text-[#003366]" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">
                    {editingDocente ? "Actualizar Información" : "Registrar Nuevo Docente"}
                  </DialogTitle>
                  <p className="text-sm text-gray-500 font-medium">Complete los datos institucionales para la gestión académica.</p>
                </div>
              </div>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Alerta de Código Sugerido */}
              {!editingDocente && !isCodeDuplicate && (
                <div className="flex items-center gap-3 mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <p className="font-medium">
                    Código sugerido automáticamente: <span className="font-black underline">{suggestedCode}</span>
                  </p>
                </div>
              )}

              {/* Alerta de Código Duplicado */}
              {isCodeDuplicate && (
                <div className="flex items-center gap-3 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 animate-in zoom-in duration-300">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="font-black text-red-900">Código en uso</p>
                    <p className="font-medium opacity-90">El código <span className="font-black">{formData.codigo_docente}</span> ya se encuentra registrado. Por favor utilice otro código.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Código Institucional</Label>
                  <div className="relative">
                    <Input
                      placeholder="Ej: 1001"
                      readOnly
                      className={cn(
                        "h-11 rounded-xl border-gray-200 bg-gray-50/80 text-gray-500 cursor-not-allowed font-bold text-base transition-all",
                        isCodeDuplicate && "border-red-300 text-red-600"
                      )}
                      value={formData.codigo_docente}
                      required
                    />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-1 ml-1">
                      Código generado automáticamente por el sistema
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Correo Electrónico</Label>
                  <Input
                    type="email"
                    placeholder="ejemplo@unt.edu.pe"
                    className="h-11 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.correo_electronico}
                    onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Nombres</Label>
                  <Input
                    placeholder="Nombres completos"
                    className="h-11 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.nombres}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúñÑ ]/g, "");
                      setFormData({ ...formData, nombres: value });
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Apellidos</Label>
                  <Input
                    placeholder="Apellidos completos"
                    className="h-11 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.apellidos}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-ZáéíóúñÑ ]/g, "");
                      setFormData({ ...formData, apellidos: value });
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Teléfono</Label>
                  <Input
                    placeholder="Ej: 987654321"
                    className="h-11 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base"
                    value={formData.telefono}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, "");
                      if (value.length <= 9) {
                        setFormData({ ...formData, telefono: value });
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Modalidad</Label>
                  <Select
                    value={formData.modalidad}
                    onValueChange={(value) => setFormData({ ...formData, modalidad: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="nombrado" className="font-bold">Nombrado</SelectItem>
                      <SelectItem value="contratado" className="font-bold">Contratado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Categoría</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-100 shadow-xl">
                      <SelectItem value="principal" className="font-bold">Principal</SelectItem>
                      <SelectItem value="asociado" className="font-bold">Asociado</SelectItem>
                      <SelectItem value="auxiliar" className="font-bold">Auxiliar</SelectItem>
                      <SelectItem value="jefe_practica" className="font-bold">Jefe de Práctica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Antigüedad (Años)</Label>
                  <div className="space-y-1">
                    <Input
                      type="number"
                      min="0"
                      max="50"
                      className={cn(
                        "h-11 rounded-xl border-gray-200 focus:border-[#003366] focus:ring-4 focus:ring-blue-50 font-bold text-base",
                        parseInt(formData.antiguedad) > 40 && "border-amber-300 bg-amber-50"
                      )}
                      value={formData.antiguedad}
                      onChange={(e) => setFormData({ ...formData, antiguedad: e.target.value })}
                    />
                    {parseInt(formData.antiguedad) > 40 && (
                      <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter animate-in fade-in">
                        ⚠ Antigüedad cercana al límite institucional (50 años).
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsDialogOpen(false)}
                  className="h-12 rounded-xl font-bold text-gray-500 px-8 hover:bg-gray-100 transition-colors"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCodeDuplicate}
                  className={cn(
                    "h-12 px-12 rounded-xl font-black shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                    isCodeDuplicate 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                      : "bg-[#003366] hover:bg-[#002244] text-white shadow-blue-900/20"
                  )}
                >
                  {editingDocente ? "Actualizar Registro" : "Crear Docente"}
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
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Docente</TableHead>
                <TableHead className="min-w-[220px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Modalidad / Categoría</TableHead>
                <TableHead className="font-black text-[10px] uppercase tracking-widest text-gray-400 py-6">Contacto</TableHead>
                <TableHead className="w-[150px] font-black text-[10px] uppercase tracking-widest text-gray-400 py-6 px-8 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-blue-100 border-t-[#003366] rounded-full animate-spin" />
                      <p className="text-sm font-bold text-gray-400">Cargando docentes...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredDocentes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-2">
                        <Users className="h-8 w-8 text-gray-300" />
                      </div>
                      <p className="text-lg font-black text-gray-400 tracking-tight">No se encontraron docentes</p>
                      <p className="text-sm text-gray-400 font-medium">Prueba con otros términos de búsqueda o registra uno nuevo.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDocentes.map((docente) => (
                  <TableRow key={docente.id_docente} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="px-8 font-black text-xs text-gray-400">{docente.codigo_docente}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-4 py-2">
                        <div className="h-10 w-10 bg-[#003366]/5 rounded-xl flex items-center justify-center group-hover:bg-[#003366] transition-colors">
                          <UserCircle2 className="h-5 w-5 text-[#003366] group-hover:text-white transition-colors" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 tracking-tight">{`${docente.nombres} ${docente.apellidos}`}</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Briefcase className="h-3 w-3 text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Años: {docente.antiguedad}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                          <span className={cn(
                          "px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-tighter border-none whitespace-nowrap",
                          docente.modalidad === 'nombrado' ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                        )}>
                          {docente.modalidad}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-lg font-black text-[9px] uppercase tracking-tighter bg-gray-50 text-gray-600 border-none whitespace-nowrap">
                          {docente.categoria.replace("_", " ")}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span className="text-xs font-medium truncate max-w-[150px]">{docente.correo_electronico || 'N/A'}</span>
                        </div>
                        {docente.telefono && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span className="text-[10px] font-bold">{docente.telefono}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-8">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedDocente(docente);
                            setIsAsignarOpen(true);
                          }}
                          title="Asignar Cursos"
                          className="h-9 w-9 rounded-xl hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(docente)}
                          title="Editar"
                          className="h-9 w-9 rounded-xl hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDelete(docente.id_docente)}
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

      <AsignarCursosDialog
        docenteId={selectedDocente?.id_docente || 0}
        docenteNombre={`${selectedDocente?.nombres} ${selectedDocente?.apellidos}`}
        isOpen={isAsignarOpen}
        onClose={() => setIsAsignarOpen(false)}
      />
    </div>
  );
}
