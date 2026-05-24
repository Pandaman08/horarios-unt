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

interface Usuario {
  id_usuario: number;
  codigo: string;
  nombres: string;
  apellidos: string;
  correo_electronico: string;
  rol: string;
  activo: boolean;
  ultimo_acceso: string | null;
  docente?: {
    categoria: string;
    modalidad: string;
    especialidad: string;
    grado_academico: string;
    antiguedad: number;
  } | null;
}

export function UsuarioList() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    codigo: "",
    nombres: "",
    apellidos: "",
    correo_electronico: "",
    contrasena: "",
    rol: "operador",
    // Campos académicos para docente
    categoria: "auxiliar",
    modalidad: "contratado",
    especialidad: "",
    grado_academico: "",
    antiguedad: "0",
  });

  useEffect(() => {
    if (!editingUsuario && isDialogOpen) {
      generarNuevoCodigo(formData.rol);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingUsuario ? "PUT" : "POST";
    const url = editingUsuario 
      ? `/api/usuarios/${editingUsuario.id_usuario}` 
      : "/api/usuarios";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      nombres: "",
      apellidos: "",
      correo_electronico: "",
      contrasena: "",
      rol: "operador",
    });
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-foreground tracking-tight">Usuarios del Sistema</h2>
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mt-1">Gestión de Accesos y Privilegios</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre, código o email..." 
              className="pl-11 h-11 rounded-xl border-border bg-muted/20 font-bold text-[13px] focus:ring-2 focus:ring-primary focus:bg-card transition-all"
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
              <Button className="h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 font-bold text-[13px] shadow-lg shadow-primary/10 transition-all active:scale-95">
                <UserPlus className="mr-2 h-4 w-4" /> Nuevo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-2xl rounded-2xl p-0 border-none shadow-2xl overflow-hidden bg-card">
              <div className="bg-primary p-6 text-primary-foreground">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                    <UserCircle2 className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-[22px] font-black text-white tracking-tight">
                      {editingUsuario ? "Editar Perfil de Usuario" : "Registrar Nuevo Usuario"}
                    </DialogTitle>
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">
                      {editingUsuario ? "Actualizar credenciales y permisos" : "Crear nueva cuenta de acceso al sistema"}
                    </p>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-8 bg-card">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Identificador (Código)</Label>
                    <div className="relative group">
                      <Input 
                        className="h-12 rounded-xl border-border font-bold text-[15px] bg-muted/50 pr-10 border-dashed focus:border-primary transition-colors" 
                        value={formData.codigo} 
                        readOnly
                        required 
                      />
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-[9px] font-bold text-primary uppercase tracking-tighter ml-1">🔒 Asignado automáticamente por el sistema</p>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nivel de Acceso (Rol)</Label>
                    <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v })}>
                      <SelectTrigger className="h-12 rounded-xl border-border font-bold text-[15px] bg-card focus:ring-primary/10 transition-all">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border shadow-xl">
                        <SelectItem value="admin" className="font-bold text-[14px] focus:bg-primary/10 focus:text-primary">Administrador General</SelectItem>
                        <SelectItem value="operador" className="font-bold text-[14px] focus:bg-primary/10 focus:text-primary">Operador de Turno</SelectItem>
                        <SelectItem value="docente" className="font-bold text-[14px] focus:bg-primary/10 focus:text-primary">Docente Académico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nombres</Label>
                    <Input 
                      className="h-12 rounded-xl border-border font-bold text-[15px] focus:ring-primary/10" 
                      value={formData.nombres} 
                      onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} 
                      required 
                      placeholder="Ej. Juan Carlos"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Apellidos</Label>
                    <Input 
                      className="h-12 rounded-xl border-border font-bold text-[15px] focus:ring-primary/10" 
                      value={formData.apellidos} 
                      onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} 
                      required 
                      placeholder="Ej. Pérez Gómez"
                    />
                  </div>

                  <div className="space-y-2.5 md:col-span-2">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Correo Institucional</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        className="h-12 pl-11 rounded-xl border-border font-bold text-[15px] focus:ring-primary/10" 
                        type="email" 
                        value={formData.correo_electronico} 
                        onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })} 
                        required 
                        placeholder="usuario@unitru.edu.pe"
                      />
                    </div>
                  </div>

                  {!editingUsuario && (
                    <div className="space-y-2.5 md:col-span-2">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Contraseña de Acceso</Label>
                      <div className="relative">
                        <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          className="h-12 pl-11 rounded-xl border-border font-bold text-[15px] focus:ring-primary/10" 
                          type="password" 
                          value={formData.contrasena} 
                          onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} 
                          required 
                          minLength={8} 
                          placeholder="Mínimo 8 caracteres"
                        />
                      </div>
                    </div>
                  )}

                  {formData.rol === 'docente' && (
                    <div className="md:col-span-2 pt-4 border-t border-border mt-2">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="h-6 w-1 bg-primary rounded-full" />
                        <h4 className="text-[12px] font-black text-foreground uppercase tracking-widest">Información Académica</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoría</Label>
                          <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                            <SelectTrigger className="h-12 rounded-xl border-border bg-card font-bold text-[15px]"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                              <SelectItem value="principal" className="font-bold">Docente Principal</SelectItem>
                              <SelectItem value="asociado" className="font-bold">Docente Asociado</SelectItem>
                              <SelectItem value="auxiliar" className="font-bold">Docente Auxiliar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modalidad</Label>
                          <Select value={formData.modalidad} onValueChange={(v) => setFormData({ ...formData, modalidad: v })}>
                            <SelectTrigger className="h-12 rounded-xl border-border bg-card font-bold text-[15px]"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl border-border">
                              <SelectItem value="nombrado" className="font-bold">Nombrado</SelectItem>
                              <SelectItem value="contratado" className="font-bold">Contratado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grado Académico</Label>
                          <Input className="h-12 rounded-xl border-border bg-card font-bold text-[15px]" value={formData.grado_academico} onChange={(e) => setFormData({ ...formData, grado_academico: e.target.value })} placeholder="Ej. Doctor en Ingeniería" />
                        </div>
                        <div className="space-y-2.5">
                          <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Especialidad</Label>
                          <Input className="h-12 rounded-xl border-border bg-card font-bold text-[15px]" value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} placeholder="Ej. Inteligencia Artificial" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3 pt-6 border-t border-border">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-12 rounded-xl font-bold text-muted-foreground px-8 text-[14px] hover:bg-muted transition-colors">
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-10 font-black text-[14px] shadow-lg shadow-primary/10 active:scale-95 transition-all">
                    {editingUsuario ? "Guardar Cambios" : "Finalizar Registro"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[120px] text-[10px] font-black text-muted-foreground uppercase tracking-widest px-6 py-4">Código</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-6 py-4">Usuario</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-6 py-4">Rol</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-6 py-4">Estado</TableHead>
                <TableHead className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-6 py-4">Último Acceso</TableHead>
                <TableHead className="w-[150px] text-right text-[10px] font-black text-muted-foreground uppercase tracking-widest px-6 py-4">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                      <p className="text-[13px] font-bold text-muted-foreground uppercase tracking-widest">Sincronizando Usuarios...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Search className="h-12 w-12 text-muted-foreground" />
                      <p className="text-[15px] font-bold text-muted-foreground">No se encontraron registros</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentItems.map((usuario) => (
                  <TableRow key={usuario.id_usuario} className="group border-b border-border hover:bg-muted/50 transition-all">
                    <TableCell className="px-6 py-4">
                      <span className="font-mono font-bold text-[12px] text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10">
                        {usuario.codigo}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center border border-primary/10 text-primary shadow-sm">
                          <UserCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground text-[14px] leading-tight">{usuario.apellidos}, {usuario.nombres}</p>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{usuario.correo_electronico}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider shadow-sm",
                        usuario.rol === 'admin' ? "bg-destructive/10 text-destructive border border-destructive/20" : 
                        usuario.rol === 'operador' ? "bg-primary/10 text-primary border border-primary/20" : 
                        "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      )}>
                        {usuario.rol}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          "h-2 w-2 rounded-full", 
                          usuario.activo ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-muted-foreground/30"
                        )} />
                        <span className={cn(
                          "text-[12px] font-bold",
                          usuario.activo ? "text-emerald-600" : "text-muted-foreground/50"
                        )}>
                          {usuario.activo ? "Activo" : "Inactivo"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Activity className="h-3.5 w-3.5" />
                        <span className="text-[12px] font-bold font-mono uppercase">
                          {usuario.ultimo_acceso ? usuario.ultimo_acceso : 'S/I'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5 opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setTargetUserId(usuario.id_usuario);
                            setIsAdminConfirmOpen(true);
                          }} 
                          title="Cambiar Contraseña" 
                          className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 text-muted-foreground transition-colors"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setEditingUsuario(usuario);
                            setFormData({
                              codigo: usuario.codigo,
                              nombres: usuario.nombres,
                              apellidos: usuario.apellidos,
                              correo_electronico: usuario.correo_electronico,
                              contrasena: "",
                              rol: usuario.rol,
                              categoria: usuario.docente?.categoria || "auxiliar",
                              modalidad: usuario.docente?.modalidad || "contratado",
                              especialidad: usuario.docente?.especialidad || "",
                              grado_academico: usuario.docente?.grado_academico || "",
                              antiguedad: usuario.docente?.antiguedad?.toString() || "0",
                            });
                            setIsDialogOpen(true);
                          }} 
                          title="Editar Perfil" 
                          className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(usuario.id_usuario);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Eliminar Registro" 
                          className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
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
        
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="border-t border-border bg-muted/10"
        />
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-0 overflow-hidden max-w-md bg-card">
          <div className="bg-destructive p-6 text-destructive-foreground flex items-center gap-4">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
              <Trash2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <AlertDialogTitle className="text-xl font-black text-white">¿Eliminar Usuario?</AlertDialogTitle>
              <p className="text-destructive-foreground/60 text-[11px] font-bold uppercase tracking-widest mt-0.5">Esta acción es irreversible</p>
            </div>
          </div>
          <div className="p-8 bg-card">
            <AlertDialogDescription className="text-[14px] font-bold text-muted-foreground leading-relaxed">
              ¿Está seguro que desea eliminar permanentemente esta cuenta de acceso? El usuario perderá el acceso al sistema de forma inmediata.
            </AlertDialogDescription>
            <div className="flex justify-end gap-3 mt-8">
              <AlertDialogCancel className="h-11 rounded-xl font-bold text-[13px] border-border hover:bg-muted px-6">
                No, Mantener
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => deletingId && handleDelete(deletingId)}
                className="h-11 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-[13px] px-8 shadow-lg shadow-destructive/10 transition-all active:scale-95"
              >
                Sí, Confirmar Eliminación
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAdminConfirmOpen} onOpenChange={setIsAdminConfirmOpen}>
        <DialogContent className="rounded-2xl p-0 border-none shadow-2xl max-w-md overflow-hidden bg-card">
          <div className="bg-amber-500 p-6 text-white flex items-center gap-4">
            <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-white">Seguridad de Acceso</DialogTitle>
              <p className="text-amber-100 text-[11px] font-bold uppercase tracking-widest mt-0.5">Reset de credenciales</p>
            </div>
          </div>
          <div className="p-8 space-y-6 bg-card">
            <p className="text-[13px] font-bold text-muted-foreground leading-relaxed">
              Para resetear la contraseña del usuario, confirme su identidad como administrador del sistema.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Tu Contraseña (Admin)</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    className="h-12 pl-11 rounded-xl border-border bg-muted/50 font-bold text-[15px] focus:ring-amber-500/10" 
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Contraseña de administrador"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nueva Contraseña del Usuario</Label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password" 
                    className="h-12 pl-11 rounded-xl border-border bg-muted/50 font-bold text-[15px] focus:ring-amber-500/10" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsAdminConfirmOpen(false)} className="h-11 font-bold text-muted-foreground">
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
                className="bg-amber-500 hover:bg-amber-600 text-white font-black px-8 rounded-xl h-11 shadow-lg shadow-amber-500/10 transition-all active:scale-95"
              >
                Actualizar Acceso
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}