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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit,
  Building2,
} from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Facultad {
  id: string;
  nombre: string;
  codigo: string;
}

interface Departamento {
  id: string;
  nombre: string;
  facultadId: string;
  facultad: Facultad;
}

export function DepartamentoList() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepartamento, setEditingDepartamento] = useState<Departamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultadId, setSelectedFacultadId] = useState<string>('all');
  const [formData, setFormData] = useState({
    nombre: '',
    facultadId: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredDepartamentos = departamentos.filter(d => 
    (selectedFacultadId === 'all' || d.facultadId === selectedFacultadId) &&
    (`${d.nombre} ${d.facultad.nombre} ${d.facultad.codigo}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredDepartamentos.length / itemsPerPage);
  const currentItems = filteredDepartamentos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const fetchFacultades = async () => {
    try {
      const res = await fetch('/api/facultades');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFacultades(data);
      }
    } catch (error) {
      console.error('Error al cargar facultades:', error);
    }
  };

  const fetchDepartamentos = async (facultadId?: string) => {
    try {
      const url = facultadId ? `/api/departamentos?facultadId=${facultadId}` : '/api/departamentos';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setDepartamentos(data);
      }
    } catch (error) {
      console.error('Error al cargar departamentos:', error);
      toast.error('Error al cargar departamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultades();
    fetchDepartamentos();
  }, []);

  useEffect(() => {
    if (selectedFacultadId && selectedFacultadId !== 'all') {
      fetchDepartamentos(selectedFacultadId);
    } else {
      fetchDepartamentos();
    }
  }, [selectedFacultadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingDepartamento ? 'PUT' : 'POST';
    const url = editingDepartamento
      ? `/api/departamentos/${editingDepartamento.id}`
      : '/api/departamentos';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingDepartamento ? 'Departamento actualizado' : 'Departamento registrado');
        setIsDialogOpen(false);
        setEditingDepartamento(null);
        resetForm();
        fetchDepartamentos(selectedFacultadId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al guardar departamento');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este departamento?')) return;

    try {
      const res = await fetch(`/api/departamentos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Departamento eliminado correctamente');
        fetchDepartamentos(selectedFacultadId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar departamento');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      facultadId: '',
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
              <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Departamentos Académicos</h2>
              <p className="text-muted-foreground text-[10px] mt-1">Gestión de departamentos académicos por facultad</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar departamento..."
                className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingDepartamento(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nuevo Departamento
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-xl p-6 border-none shadow-2xl bg-card text-foreground">
                <DialogHeader className="mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                        {editingDepartamento ? 'Actualizar Departamento' : 'Registrar Departamento'}
                      </DialogTitle>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Complete la información del departamento</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Facultad</Label>
                    <Select value={formData.facultadId} onValueChange={(val) => setFormData({ ...formData, facultadId: val })} required>
                      <SelectTrigger className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px]">
                        <SelectValue placeholder="Seleccionar facultad" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {facultades.map((facultad) => (
                          <SelectItem key={facultad.id} value={facultad.id} className="text-[11px] font-bold">{facultad.codigo} - {facultad.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Nombre</Label>
                    <Input 
                      className="h-9 rounded-lg border-input bg-muted/50 font-bold text-[11px] focus:ring-1 focus:ring-primary transition-all"
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="h-9 rounded-lg font-bold text-muted-foreground hover:bg-muted px-6 text-[11px]">Cancelar</Button>
                    <Button type="submit" className="h-9 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 font-bold text-[11px] shadow-sm transition-all active:scale-95">
                      {editingDepartamento ? 'Actualizar' : 'Registrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Filtrar por Facultad</Label>
            <Select value={selectedFacultadId} onValueChange={setSelectedFacultadId}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todas las facultades" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="all" className="text-[10px] font-bold">Todas las facultades</SelectItem>
                {facultades.map((facultad) => (
                  <SelectItem key={facultad.id} value={facultad.id} className="text-[10px] font-bold">{facultad.codigo} - {facultad.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-full w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Facultad</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={3} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((departamento) => (
                  <TableRow key={departamento.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-[9px]">
                          {departamento.facultad.codigo}
                        </div>
                        <span className="font-semibold text-foreground text-[11px]">{departamento.facultad.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="font-semibold text-foreground text-[11px]">{departamento.nombre}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingDepartamento(departamento);
                            setFormData({
                              nombre: departamento.nombre,
                              facultadId: departamento.facultadId,
                            });
                            setIsDialogOpen(true);
                          }}
                          title="Editar Departamento"
                          className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(departamento.id)}
                          title="Eliminar Departamento"
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
