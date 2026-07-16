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
  Building2,
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
  tipo: string;
}

export function FacultadList() {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFacultad, setEditingFacultad] = useState<Facultad | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    codigo: '',
    tipo: 'FACULTAD' as 'FACULTAD' | 'FILIAL' | 'ADMINISTRATIVA',
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredFacultades = facultades.filter(f => 
    `${f.nombre} ${f.codigo} ${f.tipo}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredFacultades.length / itemsPerPage);
  const currentItems = filteredFacultades.slice(
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
      toast.error('Error al cargar facultades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultades();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingFacultad ? 'PUT' : 'POST';
    const url = editingFacultad
      ? `/api/facultades/${editingFacultad.id}`
      : '/api/facultades';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(editingFacultad ? 'Facultad actualizada' : 'Facultad registrada');
        setIsDialogOpen(false);
        setEditingFacultad(null);
        resetForm();
        fetchFacultades();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al guardar facultad');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta facultad?')) return;

    try {
      const res = await fetch(`/api/facultades/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Facultad eliminada correctamente');
        fetchFacultades();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar facultad');
      }
    } catch (error) {
      toast.error('Error de conexión');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      tipo: 'FACULTAD',
    });
  };

  return (
    <div className="page-shell">
      <div className="page-header-card">
        <div className="page-header-top">
          <div className="page-header-brand">
            <div className="page-icon-box">
              <Building2 className="page-icon" />
            </div>
            <div>
              <h2 className="page-title">Facultades</h2>
              <p className="page-subtitle">Gestión de facultades, filiales y oficinas administrativas</p>
            </div>
          </div>

          <div className="page-toolbar">
            <div className="page-search-wrap">
              <Search className="page-search-icon" />
              <Input
                placeholder="Buscar facultad..."
                className="page-search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingFacultad(null);
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button className="page-btn">
                  <Plus className="mr-2 h-3.5 w-3.5" /> Nueva Facultad
                </Button>
              </DialogTrigger>
              <DialogContent className="page-modal">
                <DialogHeader className="page-modal-header">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <DialogTitle className="text-base font-bold text-foreground">
                        {editingFacultad ? 'Actualizar Facultad' : 'Registrar Facultad'}
                      </DialogTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">Complete la información de la facultad</p>
                    </div>
                  </div>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="page-modal-body space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Código</Label>
                      <Input 
                        className="page-modal-input" 
                        value={formData.codigo} 
                        onChange={(e) => setFormData({ ...formData, codigo: e.target.value })} 
                        required 
                      />
                    </div>
                    <div className="page-modal-field">
                      <Label className="page-modal-label">Tipo</Label>
                      <Select value={formData.tipo} onValueChange={(val: any) => setFormData({ ...formData, tipo: val })}>
                        <SelectTrigger className="rounded-lg border-input bg-muted/50 font-bold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent position="popper">
                          <SelectItem value="FACULTAD">Facultad</SelectItem>
                          <SelectItem value="FILIAL">Filial</SelectItem>
                          <SelectItem value="ADMINISTRATIVA">Oficina Administrativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  <div className="page-modal-footer border-t border-border pt-4">
                    <div className="page-actions-row justify-end gap-2">
                      <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="page-modal-btn-cancel">Cancelar</Button>
                      <Button type="submit" className="page-modal-btn-submit">
                        {editingFacultad ? 'Actualizar' : 'Registrar'}
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
          <Table className="min-w-full w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Código</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Nombre</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Tipo</TableHead>
                <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="py-10 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((facultad) => (
                  <TableRow key={facultad.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-xs font-bold text-primary">{facultad.codigo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-xs">
                          {facultad.nombre.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{facultad.nombre}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-widest border ${
                        facultad.tipo === 'FACULTAD' 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : facultad.tipo === 'FILIAL' 
                          ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' 
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      }`}>{facultad.tipo}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingFacultad(facultad);
                            setFormData({
                              nombre: facultad.nombre,
                              codigo: facultad.codigo,
                              tipo: facultad.tipo as any,
                            });
                            setIsDialogOpen(true);
                          }}
                          title="Editar Facultad"
                          className="h-7 w-7 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 transition-all"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(facultad.id)}
                          title="Eliminar Facultad"
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
