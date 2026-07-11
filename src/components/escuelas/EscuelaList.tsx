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
  GraduationCap,
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

interface Facultad {
  id: string;
  nombre: string;
  codigo: string;
}

interface Escuela {
  id: string;
  nombre: string;
  facultadId: string;
  facultad: Facultad;
}

export function EscuelaList() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([]);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEscuela, setEditingEscuela] = useState<Escuela | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultadId, setSelectedFacultadId] = useState<string>('all');
  const [formData, setFormData] = useState({
    nombre: '',
    facultadId: '',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEscuelas = escuelas.filter(e => 
    (selectedFacultadId === 'all' || e.facultadId === selectedFacultadId) &&
    (`${e.nombre} ${e.facultad.nombre} ${e.facultad.codigo}`.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredEscuelas.length / itemsPerPage);
  const currentItems = filteredEscuelas.slice(
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

  const fetchEscuelas = async (facultadId?: string) => {
    try {
      const url = facultadId ? `/api/escuelas?facultadId=${facultadId}` : '/api/escuelas';
      const res = await fetch(url);
      const data = await res.json();
      if (Array.isArray(data)) {
        setEscuelas(data);
      }
    } catch (error) {
      console.error('Error al cargar escuelas:', error);
      toast.error('Error al cargar escuelas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultades();
    fetchEscuelas();
  }, []);

  useEffect(() => {
    if (selectedFacultadId && selectedFacultadId !== 'all') {
      fetchEscuelas(selectedFacultadId);
    } else {
      fetchEscuelas();
    }
  }, [selectedFacultadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingEscuela ? 'PUT' : 'POST';
    const url = editingEscuela
      ? `/api/escuelas/${editingEscuela.id}`
      : '/api/escuelas';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingEscuela ? 'Escuela actualizada' : 'Escuela registrada');
        setIsDialogOpen(false);
        setEditingEscuela(null);
        resetForm();
        fetchEscuelas(selectedFacultadId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al guardar escuela');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta escuela?')) return;

    try {
      const res = await fetch(`/api/escuelas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Escuela eliminada correctamente');
        fetchEscuelas(selectedFacultadId);
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar escuela');
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
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <GraduationCap className="page-icon" />
            </div>
            <div>
              <h2 className="page-title">Escuelas Profesionales</h2>
              <p className="page-subtitle">Gestión de escuelas profesionales por facultad</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar escuela..."
                className="page-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingEscuela(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="page-btn">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nueva Escuela
                </Button>
              </DialogTrigger>
              <DialogContent className="page-modal">
                <DialogHeader className="page-modal-header">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground tracking-tight">
                        {editingEscuela ? 'Actualizar Escuela' : 'Registrar Escuela'}
                      </DialogTitle>
                      <p className="text-muted-foreground text-xs mt-1 font-medium">Complete la información de la escuela</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="page-modal-body space-y-4">
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Facultad</Label>
                    <Select value={formData.facultadId} onValueChange={(val) => setFormData({ ...formData, facultadId: val })} required>
                      <SelectTrigger className="page-modal-input">
                        <SelectValue placeholder="Seleccionar facultad" />
                      </SelectTrigger>
                      <SelectContent position="popper">
                        {facultades.map((facultad) => (
                          <SelectItem key={facultad.id} value={facultad.id} className="text-sm font-bold">{facultad.codigo} - {facultad.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="page-modal-field">
                    <Label className="page-modal-label">Nombre</Label>
                    <Input 
                      className="page-modal-input"
                      value={formData.nombre} 
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} 
                      required 
                    />
                  </div>
                  <div className="page-actions-row justify-end pt-4 border-t">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="page-modal-btn-cancel">Cancelar</Button>
                    <Button type="submit" className="page-modal-btn-submit">
                      {editingEscuela ? 'Actualizar' : 'Registrar'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="page-filters">
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Filtrar por Facultad</Label>
            <Select value={selectedFacultadId} onValueChange={setSelectedFacultadId}>
              <SelectTrigger className="page-filter-select">
                <SelectValue placeholder="Todas las facultades" />
              </SelectTrigger>
              <SelectContent position="popper" className="rounded-xl border-border">
                <SelectItem value="all" className="font-bold">Todas las facultades</SelectItem>
                {facultades.map((facultad) => (
                  <SelectItem key={facultad.id} value={facultad.id} className="font-bold">{facultad.codigo} - {facultad.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="page-table-card">
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Facultad</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={3} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((escuela) => (
                  <TableRow key={escuela.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-xs">
                          {escuela.facultad.codigo}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{escuela.facultad.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <span className="font-semibold text-foreground text-sm">{escuela.nombre}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingEscuela(escuela);
                            setFormData({
                              nombre: escuela.nombre,
                              facultadId: escuela.facultadId,
                            });
                            setIsDialogOpen(true);
                          }}
                          title="Editar Escuela"
                          className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(escuela.id)}
                          title="Eliminar Escuela"
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
