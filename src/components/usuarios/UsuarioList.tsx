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
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Usuarios</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Control de accesos y roles</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar por nombre, código o email..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
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
              <Button className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-6 font-bold text-[14px] shadow-sm">
                <UserPlus className="mr-2 h-5 w-5" /> Nuevo Usuario
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] md:w-[80vw] lg:max-w-2xl rounded-2xl p-6 border-none shadow-2xl overflow-y-auto max-h-[90vh]">
              <DialogHeader className="mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-blue-50 rounded-xl flex items-center justify-center">
                    <UserCircle2 className="h-8 w-8 text-[#003366]" />
                  </div>
                  <div>
                    <DialogTitle className="text-[24px] font-black text-gray-900 tracking-tight">
                      {editingUsuario ? "Editar Usuario" : "Registrar Usuario"}
                    </DialogTitle>
                  </div>
                </div>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Código</Label>
                    <div className="relative">
                      <Input 
                        className="h-11 rounded-xl border-gray-200 font-bold text-[16px] bg-gray-50 pr-10" 
                        value={formData.codigo} 
                        readOnly
                        required 
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tight">Generado automáticamente según rol</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Rol de Usuario</Label>
                    <Select value={formData.rol} onValueChange={(v) => setFormData({ ...formData, rol: v })}>
                      <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="admin" className="font-bold text-[16px]">Administrador</SelectItem>
                        <SelectItem value="operador" className="font-bold text-[16px]">Operador</SelectItem>
                        <SelectItem value="docente" className="font-bold text-[16px]">Docente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Nombres</Label>
                    <Input className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={formData.nombres} onChange={(e) => setFormData({ ...formData, nombres: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Apellidos</Label>
                    <Input className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={formData.apellidos} onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })} required />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Correo Electrónico</Label>
                    <Input className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" type="email" value={formData.correo_electronico} onChange={(e) => setFormData({ ...formData, correo_electronico: e.target.value })} required />
                  </div>
                  {!editingUsuario && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Contraseña</Label>
                      <Input className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" type="password" value={formData.contrasena} onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })} required minLength={8} />
                    </div>
                  )}

                  {formData.rol === 'docente' && (
                    <>
                      <div className="md:col-span-2 grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Categoría</Label>
                          <Select value={formData.categoria} onValueChange={(v) => setFormData({ ...formData, categoria: v })}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="principal" className="font-bold">Principal</SelectItem>
                              <SelectItem value="asociado" className="font-bold">Asociado</SelectItem>
                              <SelectItem value="auxiliar" className="font-bold">Auxiliar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Modalidad</Label>
                          <Select value={formData.modalidad} onValueChange={(v) => setFormData({ ...formData, modalidad: v })}>
                            <SelectTrigger className="h-11 rounded-xl border-gray-200 font-bold text-[16px]"><SelectValue /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              <SelectItem value="nombrado" className="font-bold">Nombrado</SelectItem>
                              <SelectItem value="contratado" className="font-bold">Contratado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Grado Académico</Label>
                        <Input className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={formData.grado_academico} onChange={(e) => setFormData({ ...formData, grado_academico: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[14px] font-black uppercase tracking-widest text-gray-400">Especialidad</Label>
                        <Input className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" value={formData.especialidad} onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })} />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-50">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-11 rounded-xl font-bold text-gray-500 px-8 text-[16px]">Cancelar</Button>
                  <Button type="submit" className="h-11 bg-[#003366] hover:bg-[#002244] text-white rounded-xl px-10 font-black text-[16px]">
                    {editingUsuario ? "Actualizar" : "Crear"}
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
                <TableHead className="w-[120px]">Código</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando usuarios...</TableCell></TableRow>
              ) : filteredUsuarios.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id_usuario} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-bold text-[14px] text-gray-500">{usuario.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserCircle2 className="h-5 w-5 text-[#003366]/50" />
                        <div>
                          <p className="font-bold text-gray-900 text-[16px] leading-tight">{usuario.apellidos}, {usuario.nombres}</p>
                          <p className="text-[12px] text-gray-400 font-medium">{usuario.correo_electronico}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight",
                        usuario.rol === 'admin' ? "bg-red-50 text-red-700" : 
                        usuario.rol === 'operador' ? "bg-blue-50 text-blue-700" : 
                        "bg-green-50 text-green-700"
                      )}>
                        {usuario.rol}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2 w-2 rounded-full", usuario.activo ? "bg-emerald-500" : "bg-gray-300")} />
                        <span className="text-[14px] font-bold text-gray-600">{usuario.activo ? "Activo" : "Inactivo"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-gray-500">
                        <Activity className="h-4 w-4" />
                        <span className="text-[13px] font-medium">{usuario.ultimo_acceso || 'Nunca'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setTargetUserId(usuario.id_usuario);
                            setIsAdminConfirmOpen(true);
                          }} 
                          title="Cambiar Contraseña" 
                          className="h-9 w-9 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Key className="h-5 w-5" />
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
                          title="Editar" 
                          className="h-9 w-9 hover:bg-blue-50 hover:text-[#003366]"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setDeletingId(usuario.id_usuario);
                            setIsDeleteDialogOpen(true);
                          }}
                          title="Eliminar" 
                          className="h-9 w-9 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-5 w-5" />
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-gray-900">¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription className="text-[14px] font-medium text-gray-500">
              Esta acción eliminará permanentemente la cuenta de acceso. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-11 rounded-xl font-bold text-[14px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && handleDelete(deletingId)}
              className="h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-[14px] px-8"
            >
              Confirmar Eliminación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAdminConfirmOpen} onOpenChange={setIsAdminConfirmOpen}>
        <DialogContent className="rounded-2xl p-6 border-none shadow-2xl max-w-md">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <DialogTitle className="text-[20px] font-black text-gray-900 tracking-tight">Seguridad de Acceso</DialogTitle>
            </div>
          </DialogHeader>
          <div className="space-y-6">
            <p className="text-[14px] font-medium text-gray-500">Confirma tu identidad como administrador para resetear la contraseña del usuario.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[12px] font-black uppercase tracking-widest text-gray-400">Tu Contraseña (Admin)</Label>
                <Input 
                  type="password" 
                  className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[12px] font-black uppercase tracking-widest text-gray-400">Nueva Contraseña</Label>
                <Input 
                  type="password" 
                  className="h-11 rounded-xl border-gray-200 font-bold text-[16px]" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mín. 8 caracteres"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsAdminConfirmOpen(false)} className="font-bold">Cancelar</Button>
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
                      toast.success("Contraseña actualizada");
                      setIsAdminConfirmOpen(false);
                      setAdminPassword("");
                      setNewPassword("");
                    }
                  } catch (error) {
                    toast.error("Error al actualizar contraseña");
                  }
                }} 
                className="bg-[#003366] hover:bg-[#002244] text-white font-black px-8 rounded-xl h-11"
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
