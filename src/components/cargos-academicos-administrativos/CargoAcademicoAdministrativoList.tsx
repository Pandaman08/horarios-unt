'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Briefcase,
  Search,
  Plus,
  Trash2,
  Edit,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CargoAcademicoAdministrativo {
  id: string;
  nombre: string;
  chlm: number;
  chnlpe: number;
  chnla: number;
}

export function CargoAcademicoAdministrativoList() {
  const [cargos, setCargos] = useState<CargoAcademicoAdministrativo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<CargoAcademicoAdministrativo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    chlm: 0,
    chnlpe: 0,
    chnla: 0,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredCargos = cargos.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCargos.length / itemsPerPage);
  const currentItems = filteredCargos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchCargos = async () => {
    try {
      const res = await fetch('/api/cargos-academicos-administrativos');
      const data = await res.json();
      if (Array.isArray(data)) {
        setCargos(data);
      }
    } catch (error) {
      console.error('Error al cargar cargos:', error);
      toast.error('Error al cargar cargos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingCargo ? 'PUT' : 'POST';
    const url = editingCargo
      ? `/api/cargos-academicos-administrativos/${editingCargo.id}`
      : '/api/cargos-academicos-administrativos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingCargo ? 'Cargo actualizado' : 'Cargo registrado');
        setIsDialogOpen(false);
        setEditingCargo(null);
        resetForm();
        fetchCargos();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al guardar cargo');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este cargo?')) return;

    try {
      const res = await fetch(`/api/cargos-academicos-administrativos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Cargo eliminado correctamente');
        fetchCargos();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar cargo');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      chlm: 0,
      chnlpe: 0,
      chnla: 0,
    });
  };

  return (
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <Briefcase className="page-icon" />
            </div>
            <div>
              <h2 className="page-title">Cargos Académicos Administrativos</h2>
              <p className="page-subtitle">Gestión de cargos y sus horas de carga</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar cargo..."
                className="page-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingCargo(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="page-btn">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Cargo
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-xl p-6 border-none shadow-2xl bg-card text-foreground">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <Briefcase className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                        {editingCargo ? 'Actualizar Cargo' : 'Registrar Cargo'}
                      </DialogTitle>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Complete la información del cargo</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre del Cargo</Label>
                    <Input 
                      className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">CHLM</Label>
                      <Input 
                        type="number"
                        min="0"
                        step="1"
                        className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                        value={formData.chlm} 
                        onChange={(e) => setFormData({ ...formData, chlm: parseInt(e.target.value) || 0 })} 
                        required 
                      />
                      <p className="text-xs text-muted-foreground">Carga Lectiva Mínima (horas semanales que debe tener el docente que ocupa este cargo)</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">CHNLPE</Label>
                      <Input 
                        type="number"
                        min="0"
                        step="1"
                        className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                        value={formData.chnlpe} 
                        onChange={(e) => setFormData({ ...formData, chnlpe: parseInt(e.target.value) || 0 })} 
                        required 
                      />
                      <p className="text-xs text-muted-foreground">Carga No Lectiva de Preparación y Evaluación (horas máximas semanales)</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">CHNLA</Label>
                      <Input 
                        type="number"
                        min="0"
                        step="1"
                        className="rounded-lg border-input bg-muted/50 font-bold focus:ring-1 focus:ring-primary transition-all" 
                        value={formData.chnla} 
                        onChange={(e) => setFormData({ ...formData, chnla: parseInt(e.target.value) || 0 })} 
                        required 
                      />
                      <p className="text-xs text-muted-foreground">Carga No Lectiva Administrativa (horas fijas que se autocompletan al seleccionar este cargo en la declaración)</p>
                    </div>
                  </div>
                  <div className="page-actions-row justify-end pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-lg font-bold text-muted-foreground hover:bg-muted px-6">Cancelar</Button>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold shadow-sm transition-all active:scale-95">
                      {editingCargo ? 'Actualizar' : 'Registrar'}
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
          <Table className="min-w-full w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre del Cargo</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">CHLM</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">CHNLPE</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">CHNLA</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((cargo) => (
                  <TableRow key={cargo.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-xs">
                          {cargo.nombre.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{cargo.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="font-bold text-foreground text-sm">{cargo.chlm}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="font-bold text-foreground text-sm">{cargo.chnlpe}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="font-bold text-foreground text-sm">{cargo.chnla}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingCargo(cargo);
                            setFormData({
                              nombre: cargo.nombre,
                              chlm: cargo.chlm,
                              chnlpe: cargo.chnlpe,
                              chnla: cargo.chnla,
                            });
                            setIsDialogOpen(true);
                          }}
                          title="Editar Cargo"
                          className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cargo.id)}
                          title="Eliminar Cargo"
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
