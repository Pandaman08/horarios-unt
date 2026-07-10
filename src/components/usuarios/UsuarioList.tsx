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
  UserCircle2, 
  Mail, 
  ShieldCheck,
  Activity,
  UserPlus,
  Key,
  Lock
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

interface Docente {
  id_docente: number;
  codigo_docente?: string;
  nombres: string;
  apellidos: string;
  dni?: string;
  correo_electronico?: string;
  categoriaDocente?: string;
  condicion?: string;
  especialidad?: string;
  grado_academico?: string;
  fecha_ingreso?: string;
  departamentoId?: number | null;
  facultadId?: number | null;
  departamento?: {
    nombre: string;
  } | null;
  facultad?: {
    nombre: string;
  } | null;
}

interface Usuario {
  id_usuario: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  rol: string;
  activo: boolean;
  ultimo_acceso: string | null;
  docente?: Docente | null;
}

export function UsuarioList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [docentesSinUsuario, setDocentesSinUsuario] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    codigo: "",
    dni: "",
    nombres: "",
    apellidos: "",
    correo_electronico: "",
    contrasena: "",
    rol: "operador",
    id_docente: "", // Nuevo campo: id_docente (string porque Select usa string)
    // Campos académicos para docente
    categoriaDocente: "AUXILIAR",
    condicion: "CONTRATADO",
    especialidad: "",
    grado_academico: "",
    fecha_ingreso: "",
  });

  const handleDocenteSelect = (docenteId: string) => {
    if (!docenteId) {
      resetForm();
      return;
    }
    const docenteSeleccionado = docentes.find(d => d.id_docente === parseInt(docenteId)) 
                            || docentesSinUsuario.find(d => d.id_docente === parseInt(docenteId));
    if (docenteSeleccionado) {
      setFormData({
        ...formData,
        id_docente: docenteId,
        dni: docenteSeleccionado.dni || "",
        nombres: docenteSeleccionado.nombres,
        apellidos: docenteSeleccionado.apellidos,
        correo_electronico: docenteSeleccionado.correo_electronico || "",
        codigo: docenteSeleccionado.codigo_docente || "",
        categoriaDocente: ((docenteSeleccionado as any).categoriaDocente || "AUXILIAR"),
        condicion: ((docenteSeleccionado as any).condicion || "CONTRATADO"),
        especialidad: (docenteSeleccionado as any).especialidad || "",
        grado_academico: (docenteSeleccionado as any).grado_academico || "",
        fecha_ingreso: (docenteSeleccionado as any).fecha_ingreso 
          ? new Date((docenteSeleccionado as any).fecha_ingreso).toISOString().split('T')[0] 
          : "",
        // Establecer rol por defecto a docente si se selecciona un docente
        rol: formData.rol !== 'admin' ? "docente" : formData.rol
      });
    }
  };

  useEffect(() => {
    if (formData.dni) {
      setFormData(prev => ({ ...prev, codigo: formData.dni }));
    }
  }, [formData.dni]);

  useEffect(() => {
    if (!editingUsuario && isDialogOpen) {
      // No necesitamos generar código, se usará el DNI
    }
  }, [formData.rol, isDialogOpen]);

  const generarNuevoCodigo = async (rol: string) => {
    try {
      const res = await fetch(`/api/usuarios/generar-codigo?rol=${rol}`);
      const data = await res.json();
      if (data.codigo) {
        setFormData(prev => ({ ...prev, codigo: data.codigo }));
      }
    } catch (error) {
      console.error("Error al generar código:", error);
    }
  };

  const [isAdminConfirmOpen, setIsAdminConfirmOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [targetUserId, setTargetUserId] = useState<number | null>(null);

  const filteredUsuarios = usuarios.filter(u => 
    `${u.nombres} ${u.apellidos} ${u.codigo} ${u.correo_electronico}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredUsuarios.length / itemsPerPage);
  const currentItems = filteredUsuarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    fetchUsuarios();
    fetchDocentes();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await fetch("/api/usuarios");
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsuarios(data);
      }
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocentes = async () => {
    try {
      const res = await fetch("/api/docentes");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocentes(data);
        // Filtrar docentes sin usuario
        setDocentesSinUsuario(data.filter((d: any) => !d.id_usuario));
      }
    } catch (error) {
      toast.error("Error al cargar docentes");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUsuario ? "PUT" : "POST";
    const url = editingUsuario 
      ? `/api/usuarios/${editingUsuario.id_usuario}` 
      : "/api/usuarios";

    // Validaciones para roles jerárquicos
    if (['director_departamento', 'decano', 'docente'].includes(formData.rol)) {
      if (!formData.id_docente) {
        toast.error("Debe seleccionar un docente asociado para este rol");
        return;
      }
    }

    const selectedDocente = formData.id_docente 
      ? (docentes.find(d => d.id_docente === parseInt(formData.id_docente)) 
        || docentesSinUsuario.find(d => d.id_docente === parseInt(formData.id_docente)))
      : null;

    if (formData.rol === 'director_departamento') {
      if (!selectedDocente?.departamentoId) {
        toast.error("El docente seleccionado debe tener un departamento asignado");
        return;
      }
    }

    if (formData.rol === 'decano') {
      if (!selectedDocente?.facultadId) {
        toast.error("El docente seleccionado debe tener una facultad asignada");
        return;
      }
    }

    // Convertir nombres y apellidos a mayúsculas y usar DNI como código
    const datosParaEnviar = {
      ...formData,
      nombres: formData.nombres.toUpperCase(),
      apellidos: formData.apellidos.toUpperCase(),
      codigo: formData.dni || formData.codigo,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosParaEnviar),
      });

      if (res.ok) {
        toast.success(editingUsuario ? "Usuario actualizado" : "Usuario creado");
        setIsDialogOpen(false);
        setEditingUsuario(null);
        resetForm();
        fetchUsuarios();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al guardar usuario");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Usuario eliminado");
        fetchUsuarios();
      } else {
        const error = await res.json();
        toast.error(error.error || "Error al eliminar usuario");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo: "",
      dni: "",
      nombres: "",
      apellidos: "",
      correo_electronico: "",
      contrasena: "",
      rol: "operador",
      id_docente: "",
      categoriaDocente: "AUXILIAR",
      condicion: "CONTRATADO",
      especialidad: "",
      grado_academico: "",
      fecha_ingreso: "",
    });
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  return (
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <ShieldCheck className="page-icon" />
            </div>
            <div>
              <h2 className="page-title">Usuarios</h2>
              <p className="page-subtitle">Gestión de accesos y privilegios</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar por nombre, código o email..."
                className="page-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingUsuario(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="page-btn">
                  <UserPlus className="mr-2 h-3.5 w-3.5" /> Nuevo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl rounded-xl p-6 border-none shadow-2xl bg-card text-foreground max-h-[90vh] overflow-y-auto">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <UserCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                        {editingUsuario ? "Editar Usuario" : "Nuevo Usuario"}
                      </DialogTitle>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">
                        {editingUsuario ? "Actualizar datos de acceso" : "Registrar nueva cuenta"}
                      </p>
                    </div>
                  </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">DNI</Label>
                      <Input
                        className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all"
                        value={formData.dni}
                        onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                        required
                        placeholder="DNI"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Rol</Label>
                      <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v })}>
                        <SelectTrigger className="rounded-lg border-input bg-muted/50 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="operador">Operador</SelectItem>
                          <SelectItem value="docente">Docente</SelectItem>
                          <SelectItem value="director_departamento">Director de Departamento</SelectItem>
                          <SelectItem value="decano">Decano</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                  {['docente', 'director_departamento', 'decano', 'admin'].includes(formData.rol) && (
                    <div className="space-y-1">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Docente Asociado
                        {['docente', 'director_departamento', 'decano'].includes(formData.rol) && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      <Select 
                        value={formData.id_docente} 
                        onValueChange={(v) => {
                          if (!editingUsuario) {
                            handleDocenteSelect(v);
                          } else {
                            setFormData({ ...formData, id_docente: v });
                          }
                        }}
                      >
                        <SelectTrigger className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all">
                          <SelectValue placeholder="Seleccionar docente" />
                        </SelectTrigger>
                        <SelectContent className="rounded-md border-border shadow-md max-h-80">
                          {editingUsuario 
                            ? docentes.map((docente) => (
                                <SelectItem 
                                  key={docente.id_docente} 
                                  value={docente.id_docente.toString()} 
                                  className="text-sm focus:bg-primary/10 focus:text-primary"
                                >
                                  {docente.nombres} {docente.apellidos} ({docente.departamento?.nombre || 'Sin departamento'})
                                </SelectItem>
                              ))
                            : docentesSinUsuario.map((docente) => (
                                <SelectItem 
                                  key={docente.id_docente} 
                                  value={docente.id_docente.toString()} 
                                  className="text-sm focus:bg-primary/10 focus:text-primary"
                                >
                                  {docente.nombres} {docente.apellidos} ({docente.departamento?.nombre || 'Sin departamento'})
                                </SelectItem>
                              ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombres</Label>
                    <Input 
                      className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                      value={formData.nombres} 
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} 
                      required 
                      placeholder="Nombres"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Apellidos</Label>
                    <Input 
                      className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                      value={formData.apellidos} 
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} 
                      required 
                      placeholder="Apellidos"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Correo</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all pl-9" 
                        type="email" 
                        value={formData.correo_electronico} 
                        onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })} 
                        required 
                        placeholder="usuario@unitru.edu.pe"
                      />
                    </div>
                  </div>

                  {!editingUsuario && (
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Contraseña</Label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all pl-9" 
                          type="password" 
                          value={formData.contrasena} 
                          onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} 
                          required 
                          minLength={8} 
                          placeholder="Mín 8 caracteres"
                        />
                      </div>
                    </div>
                  )}

                  {formData.rol === 'docente' && (
                    <div className="md:col-span-2 pt-2 border-t border-border mt-1">
                      <div className="flex items-center gap-1 mb-2">
                        <div className="h-3 w-0.5 bg-primary rounded-full" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 text-foreground">Datos Académicos</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Categoría</Label>
                          {formData.id_docente ? (
                            <Input 
                              className="rounded-lg border-input bg-muted/50 font-bold" 
                              value={formData.categoriaDocente} 
                              disabled 
                            />
                          ) : (
                            <Select value={formData.categoriaDocente} onValueChange={(v) => setFormData({ ...formData, categoriaDocente: v })}>
                              <SelectTrigger className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-md border-border">
                                <SelectItem value="PRINCIPAL" className="font-semibold">Principal</SelectItem>
                                <SelectItem value="ASOCIADO" className="font-semibold">Asociado</SelectItem>
                                <SelectItem value="AUXILIAR" className="font-semibold">Auxiliar</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Condición</Label>
                          {formData.id_docente ? (
                            <Input 
                              className="rounded-lg border-input bg-muted/50 font-bold" 
                              value={formData.condicion} 
                              disabled 
                            />
                          ) : (
                            <Select value={formData.condicion} onValueChange={(v) => setFormData({ ...formData, condicion: v })}>
                              <SelectTrigger className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all"><SelectValue /></SelectTrigger>
                              <SelectContent className="rounded-md border-border">
                                <SelectItem value="ORDINARIO" className="font-semibold">Ordinario</SelectItem>
                                <SelectItem value="CONTRATADO" className="font-semibold">Contratado</SelectItem>
                                <SelectItem value="EXTRAORDINARIO" className="font-semibold">Extraordinario</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Grado</Label>
                          <Input 
                            className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                            value={formData.grado_academico} 
                            onChange={(e) => setFormData({ ...formData, grado_academico: e.target.value })} 
                            placeholder="Grado académico" 
                            disabled={!!formData.id_docente} 
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Especialidad</Label>
                          <Input 
                            className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                            value={formData.especialidad} 
                            onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} 
                            placeholder="Especialidad" 
                            disabled={!!formData.id_docente} 
                          />
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Fecha Ingreso</Label>
                          <Input 
                            type="date" 
                            className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                            value={formData.fecha_ingreso} 
                            onChange={(e) => setFormData({ ...formData, fecha_ingreso: e.target.value })} 
                            disabled={!!formData.id_docente} 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="page-actions-row justify-end pt-4 border-t">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-lg font-bold text-muted-foreground hover:bg-muted px-6">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold shadow-sm transition-all active:scale-95">
                    {editingUsuario ? "Actualizar" : "Registrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </div>

      <div className="page-table-card">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 w-24">Código</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Usuario</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Rol</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 hidden md:table-cell">Docente</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Estado</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 hidden lg:table-cell">Último Acceso</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((usuario) => (
                  <TableRow key={usuario.id_usuario} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
                        {(usuario as any).dni || usuario.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex flex-col min-w-[160px]">
                        <span className="font-bold text-foreground text-sm leading-tight">{usuario.apellidos}, {usuario.nombres}</span>
                        <span className="text-xs text-muted-foreground font-medium mt-0.5 truncate">{usuario.correo_electronico}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className={cn(
                        "inline-flex px-2 py-0.5 rounded-md text-xs font-black uppercase tracking-tighter",
                        usuario.rol === 'admin' ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                        usuario.rol === 'operador' ? "bg-primary/10 text-primary border border-primary/20" : 
                        usuario.rol === 'director_departamento' ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" :
                        usuario.rol === 'decano' ? "bg-purple-500/10 text-purple-600 border border-purple-500/20" :
                        "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      )}>
                        {usuario.rol === 'director_departamento' ? 'Director de Departamento' :
                         usuario.rol === 'decano' ? 'Decano' :
                         usuario.rol}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-2 hidden md:table-cell">
                      {usuario.docente ? (
                        <div>
                          <p className="text-xs font-bold text-foreground">{usuario.docente.nombres} {usuario.docente.apellidos}</p>
                          <p className="text-xs text-muted-foreground">{usuario.docente.departamento?.nombre || 'Sin departamento'}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sin docente</span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          usuario.activo ? "bg-emerald-500" : "bg-muted-foreground/30"
                        )} />
                        <span className={cn(
                          "text-xs font-bold",
                          usuario.activo ? "text-emerald-600" : "text-muted-foreground/50"
                        )}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        <span className="text-xs font-bold font-mono">
                          {usuario.ultimo_acceso ? usuario.ultimo_acceso : 'S/I'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setTargetUserId(usuario.id_usuario);
                            setIsAdminConfirmOpen(true);
                          }} 
                          title="Cambiar Contraseña" 
                          className="h-7 w-7 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground transition-all"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingUsuario(usuario);
                            setFormData({
                              codigo: (usuario as any).dni || usuario.codigo,
                              dni: (usuario as any).dni || "",
                              nombres: usuario.nombres,
                              apellidos: usuario.apellidos,
                              correo_electronico: usuario.correo_electronico,
                              contrasena: "",
                              rol: usuario.rol,
                              id_docente: usuario.docente?.id_docente ? usuario.docente.id_docente.toString() : "",
                              categoriaDocente: ((usuario.docente as any)?.categoriaDocente || "AUXILIAR"),
                              condicion: ((usuario.docente as any)?.condicion || "CONTRATADO"),
                              especialidad: (usuario.docente as any)?.especialidad || "",
                              grado_academico: (usuario.docente as any)?.grado_academico || "",
                              fecha_ingreso: (usuario.docente as any)?.fecha_ingreso ? new Date((usuario.docente as any).fecha_ingreso).toISOString().split('T')[0] : "",
                            });
                            setIsDialogOpen(true);
                          }} 
                          title="Editar Perfil" 
                          className="h-7 w-7 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(usuario.id_usuario);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Eliminar Registro" 
                          className="h-7 w-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-600 text-muted-foreground transition-all"
                        >
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
        <AlertDialogContent className="rounded-xl border-none shadow-2xl p-6 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              Esta acción es irreversible. El usuario perderá el acceso al sistema de forma inmediata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-4">
            <AlertDialogCancel className="h-9 rounded-lg font-bold text-sm border-border hover:bg-muted px-6">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="h-9 rounded-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold text-sm px-6"
            >
              Confirmar eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAdminConfirmOpen} onOpenChange={setIsAdminConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-xl p-6 border-none shadow-2xl bg-card">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-500/10 rounded-lg flex items-center justify-center border border-amber-500/20">
                <Lock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Reset de contraseña</DialogTitle>
                <p className="text-muted-foreground text-xs mt-1">Confirme su identidad como administrador</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Tu contraseña (admin)</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="password"
                  className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all pl-9"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Contraseña de administrador"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nueva contraseña</Label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="password"
                  className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all pl-9"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>
            <div className="page-actions-row justify-end pt-2">
              <Button variant="ghost" onClick={() => setIsAdminConfirmOpen(false)} className="rounded-lg font-bold text-muted-foreground">
                Cancelar
              </Button>
              <Button
                onClick={async () => {
                  if (newPassword.length < 8) {
                    toast.error("La nueva contraseña debe tener al menos 8 caracteres");
                    return;
                  }
                  
                  try {
                    const res = await fetch(`/api/usuarios/${targetUserId}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ contrasena: newPassword })
                    });
                    if (res.ok) {
                      toast.success("Contraseña actualizada correctamente");
                      setIsAdminConfirmOpen(false);
                      setAdminPassword("");
                      setNewPassword("");
                    }
                  } catch (error) {
                    toast.error("Error al actualizar contraseña");
                  }
                }} 
                className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold px-6"
              >
                Actualizar acceso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
