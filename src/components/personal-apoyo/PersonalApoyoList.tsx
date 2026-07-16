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
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <Users className="page-icon" />
            </div>
            <div>
              <h2 className="page-title">Personal de Apoyo</h2>
              <p className="page-subtitle">Gestión de jefes de práctica y personal de apoyo</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar personal..."
                className="page-search"
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
                <Button className="page-btn">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Personal
                </Button>
              </DialogTrigger>
              <DialogContent className="page-modal-lg">
                <DialogHeader className="page-modal-header">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                      <UserCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        {editingItem ? "Actualizar Personal" : "Registrar Personal de Apoyo"}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Complete la información</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="page-modal-body space-y-4">
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Nombre Completo</Label>
                    <Input className="page-modal-input" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(val) => setFormData({ ...formData, tipo: val })}>
                        <SelectTrigger className="page-modal-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="JEFE_PRACTICA">Jefe de Práctica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Modalidad</Label>
                      <Select value={formData.modalidad} onValueChange={(val) => setFormData({ ...formData, modalidad: val })}>
                        <SelectTrigger className="page-modal-input">
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

                  <div className="page-modal-field">
                    <Label className="page-modal-label">Departamento Académico</Label>
                    <Select value={formData.departamentoId} onValueChange={(val) => setFormData({ ...formData, departamentoId: val })} required>
                      <SelectTrigger className="page-modal-input">
                        <SelectValue placeholder="Seleccione departamento" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {departamentos.map((depto) => (
                          <SelectItem key={depto.id} value={depto.id}>{depto.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="page-modal-footer border-t border-border pt-4">
                    <div className="page-actions-row justify-end gap-2">
                      <Button type="button" variant="ghost" className="page-modal-btn-cancel" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                      <Button type="submit" className="page-modal-btn-submit">
                        {editingItem ? "Actualizar" : "Registrar"}
                      </Button>
                    </div>
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
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Modalidad</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Departamento</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-xs">
                          {item.nombre.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{item.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest border border-primary/20">{item.tipo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-bold uppercase tracking-widest border border-border">{item.modalidad}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Building2 className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-xs font-medium">{item.departamento?.nombre || '-'}</span>
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
