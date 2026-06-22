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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  UserCircle2,
  Building2
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useDepartment } from "@/contexts/DepartmentContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DepartamentoAcademico {
  id: string;
  nombre: string;
  facultadId: string;
}

interface PersonalApoyo {
  id: string;
  nombre: string;
  tipo: string;
  modalidad: string;
  departamentoId?: string;
  departamento?: DepartamentoAcademico;
  createdAt: Date;
  updatedAt: Date;
}

export function PersonalApoyoList() {
  const { departamentoSeleccionado } = useDepartment();
  const [personalApoyo, setPersonalApoyo] = useState<PersonalApoyo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PersonalApoyo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [departamentos, setDepartamentos] = useState<DepartamentoAcademico[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "JEFE_PRACTICA",
    modalidad: "TC",
    departamentoId: "",
  });

  const filteredPersonal = personalApoyo.filter(d => {
    return `${d.nombre} ${d.tipo}`.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredPersonal.length / itemsPerPage);
  const currentItems = filteredPersonal.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchDepartamentos = async () => {
    try {
      const res = await fetch("/api/departamentos");
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartamentos(data);
      }
    } catch (error: any) {
      console.error("Error al cargar departamentos:", error);
    }
  };

  const fetchPersonalApoyo = async () => {
    try {
      let url = "/api/personal-apoyo";
      if (departamentoSeleccionado) {
        url = `/api/personal-apoyo?departamentoId=${departamentoSeleccionado.id}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setPersonalApoyo(data);
      } else {
        setPersonalApoyo([]);
      }
    } catch (error: any) {
      console.error("Error en fetchPersonalApoyo:", error);
      toast.error(error.message || "Error al cargar personal de apoyo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartamentos();
  }, []);

  useEffect(() => {
    fetchPersonalApoyo();
  }, [departamentoSeleccionado]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingItem ? "PUT" : "POST";
    const url = editingItem
      ? `/api/personal-apoyo/${editingItem.id}`
      : "/api/personal-apoyo";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingItem ? "Personal de apoyo actualizado" : "Personal de apoyo registrado");
        setIsDialogOpen(false);
        setEditingItem(null);
        resetForm();
        fetchPersonalApoyo();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al guardar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Está seguro de eliminar este personal de apoyo?")) return;

    try {
      const res = await fetch(`/api/personal-apoyo/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Personal de apoyo eliminado correctamente");
        fetchPersonalApoyo();
      } else {
        const data = await res.json();
        toast.error(data.error || "Error al eliminar");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: "",
      tipo: "JEFE_PRACTICA",
      modalidad: "TC",
      departamentoId: "",
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Personal de Apoyo</h2>
              <p className="text-muted-foreground text-[10px] mt-1">Gestión de jefes de práctica y personal de apoyo</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar personal..."
                className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-semibold text-[11px] focus:ring-1 focus:ring-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingItem(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Personal
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl rounded-xl p-6 border-none shadow-2xl bg-card text-foreground">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <UserCircle2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                        {editingItem ? "Actualizar Personal" : "Registrar Personal de Apoyo"}
                      </DialogTitle>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Complete la información</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre Completo</Label>
                    <Input className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(val) => setFormData({ ...formData, tipo: val })}>
                        <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="JEFE_PRACTICA">Jefe de Práctica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Modalidad</Label>
                      <Select value={formData.modalidad} onValueChange={(val) => setFormData({ ...formData, modalidad: val })}>
                        <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="TC">TC (Tiempo Completo)</SelectItem>
                          <SelectItem value="TP1">TP1</SelectItem>
                          <SelectItem value="TP2">TP2</SelectItem>
                          <SelectItem value="TP3">TP3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Departamento Académico</Label>
                    <Select value={formData.departamentoId} onValueChange={(val) => setFormData({ ...formData, departamentoId: val })} required>
                      <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                        <SelectValue placeholder="Seleccione departamento" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {departamentos.map((depto) => (
                          <SelectItem key={depto.id} value={depto.id}>{depto.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-muted-foreground hover:bg-muted px-6 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                      {editingItem ? "Actualizar" : "Registrar"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[800px] w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Tipo</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Modalidad</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Departamento</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-[9px]">
                          {item.nombre.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-[11px]">{item.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest border border-primary/20">{item.tipo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-widest border border-border">{item.modalidad}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] font-medium">{item.departamento?.nombre || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingItem(item);
                            setFormData({
                              nombre: item.nombre,
                              tipo: item.tipo,
                              modalidad: item.modalidad,
                              departamentoId: item.departamentoId || "",
                            });
                            setIsDialogOpen(true);
                          }}
                          title="Editar"
                          className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar"
                          className="h-7 w-7 rounded-lg hover:bg-red-500/10 hover:text-red-600 transition-all"
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
    </div>
  );
}
