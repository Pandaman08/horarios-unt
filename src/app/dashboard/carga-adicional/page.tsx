'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Calendar, Clock, Building2, Briefcase } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface CargaLectivaAdicional {
  id: string;
  docenteId: number;
  dependencia: string;
  sedeId: string;
  sede: { id: string; nombre: string };
  curso: string;
  numeroResolucion: string | null;
  fechaInicio: Date;
  fechaFin: Date;
  totalHoras: number;
  estado: string;
  observaciones: string | null;
  validadoPorId: number | null;
  validador: any;
  fechaValidacion: Date | null;
  createdAt: Date;
  updatedAt: Date;
  horarios: Array<{ id: string; dia: string; horaInicio: string; horaFin: string }>;
}

interface Facultad {
  id: string;
  nombre: string;
  codigo: string;
}

const DIAS_SEMANA = [
  { value: 'LU', label: 'Lunes' },
  { value: 'MA', label: 'Martes' },
  { value: 'MI', label: 'Miércoles' },
  { value: 'JU', label: 'Jueves' },
  { value: 'VI', label: 'Viernes' },
  { value: 'SA', label: 'Sábado' }
];

const DEPENDENCIAS = [
  { value: 'FILIAL', label: 'Filial' },
  { value: 'POSGRADO', label: 'Posgrado' },
  { value: 'SEGUNDA_ESPECIALIDAD', label: 'Segunda Especialidad' },
  { value: 'CENTRO_PRODUCCION', label: 'Centro de Producción' },
  { value: 'EXTENSION_UNIVERSITARIA', label: 'Extensión Universitaria' }
];

const getEstadoBadgeVariant = (estado: string) => {
  switch (estado) {
    case 'BORRADOR':
      return 'outline';
    case 'ENVIADO':
      return 'secondary';
    case 'VALIDADO_DEPARTAMENTO':
    case 'APROBADO':
      return 'success';
    case 'RECHAZADO':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function CargaAdicionalPage() {
  const { data: session } = useSession();
  const [clads, setClads] = useState<CargaLectivaAdicional[]>([]);
  const [sedes, setSedes] = useState<Facultad[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClad, setEditingClad] = useState<CargaLectivaAdicional | null>(null);
  const [formData, setFormData] = useState({
    dependencia: '',
    sedeId: '',
    curso: '',
    numeroResolucion: '',
    fechaInicio: '',
    fechaFin: '',
    totalHoras: 0,
    observaciones: '',
    horarios: [{ id: Date.now().toString(), dia: 'LU', horaInicio: '08:00', horaFin: '10:00' }]
  });
  const [loading, setLoading] = useState(true);

  const fetchClads = async () => {
    try {
      if (!session?.user?.id) return;
      const docente = await fetch(`/api/docentes?userId=${session.user.id}`).then(r => r.json());
      const res = await fetch(`/api/carga-lectiva-adicional?docenteId=${docente.id_docente}`);
      const data = await res.json();
      if (Array.isArray(data)) setClads(data);
    } catch (error) {
      console.error('Error fetching clads:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSedes = async () => {
    try {
      const res = await fetch('/api/facultades');
      const data = await res.json();
      if (Array.isArray(data)) setSedes(data);
    } catch (error) {
      console.error('Error fetching sedes:', error);
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      fetchClads();
      fetchSedes();
    }
  }, [session?.user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!session?.user?.id) return;
      const docente = await fetch(`/api/docentes?userId=${session.user.id}`).then(r => r.json());
      
      const method = editingClad ? 'PUT' : 'POST';
      const url = editingClad ? '/api/carga-lectiva-adicional' : '/api/carga-lectiva-adicional';
      
      const body = {
        ...(editingClad ? { id: editingClad.id } : { docenteId: docente.id_docente }),
        ...formData,
        totalHoras: parseInt(formData.totalHoras.toString())
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error guardando CLAD');
        return;
      }

      toast.success(editingClad ? 'CLAD actualizado' : 'CLAD creado');
      setIsDialogOpen(false);
      setEditingClad(null);
      resetForm();
      fetchClads();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Error guardando CLAD');
    }
  };

  const handleEnviar = async (clad: CargaLectivaAdicional) => {
    try {
      const res = await fetch('/api/carga-lectiva-adicional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clad.id,
          estado: 'ENVIADO'
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error enviando CLAD');
        return;
      }

      toast.success('CLAD enviado para validación');
      fetchClads();
    } catch (error) {
      console.error('Error enviando:', error);
      toast.error('Error enviando CLAD');
    }
  };

  const resetForm = () => {
    setFormData({
      dependencia: '',
      sedeId: '',
      curso: '',
      numeroResolucion: '',
      fechaInicio: '',
      fechaFin: '',
      totalHoras: 0,
      observaciones: '',
      horarios: [{ id: Date.now().toString(), dia: 'LU', horaInicio: '08:00', horaFin: '10:00' }]
    });
  };

  const handleEdit = (clad: CargaLectivaAdicional) => {
    setEditingClad(clad);
    setFormData({
      dependencia: clad.dependencia,
      sedeId: clad.sedeId,
      curso: clad.curso,
      numeroResolucion: clad.numeroResolucion || '',
      fechaInicio: new Date(clad.fechaInicio).toISOString().split('T')[0],
      fechaFin: new Date(clad.fechaFin).toISOString().split('T')[0],
      totalHoras: clad.totalHoras,
      observaciones: clad.observaciones || '',
      horarios: clad.horarios.map(h => ({ id: h.id, dia: h.dia, horaInicio: h.horaInicio, horaFin: h.horaFin }))
    });
    setIsDialogOpen(true);
  };

  const addHorario = () => {
    setFormData(prev => ({
      ...prev,
      horarios: [...prev.horarios, { id: Date.now().toString(), dia: 'LU', horaInicio: '08:00', horaFin: '10:00' }]
    }));
  };

  const removeHorario = (id: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.filter(h => h.id !== id)
    }));
  };

  const updateHorario = (id: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      horarios: prev.horarios.map(h => h.id === id ? { ...h, [field]: value } : h)
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Carga Lectiva Adicional (CLAD)</h1>
          <p className="text-muted-foreground">Gestiona tus cargas lectivas adicionales</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={o => {
          setIsDialogOpen(o);
          if (!o) {
            setEditingClad(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo CLAD
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingClad ? 'Editar CLAD' : 'Nuevo CLAD'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Dependencia</Label>
                  <Select 
                    value={formData.dependencia} 
                    onValueChange={val => setFormData({ ...formData, dependencia: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona dependencia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPENDENCIAS.map(d => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sede</Label>
                  <Select 
                    value={formData.sedeId} 
                    onValueChange={val => setFormData({ ...formData, sedeId: val })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedes.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Curso</Label>
                  <Input 
                    value={formData.curso} 
                    onChange={e => setFormData({ ...formData, curso: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número de Resolución (opcional)</Label>
                  <Input 
                    value={formData.numeroResolucion} 
                    onChange={e => setFormData({ ...formData, numeroResolucion: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Fecha Inicio</Label>
                  <Input 
                    type="date" 
                    value={formData.fechaInicio} 
                    onChange={e => setFormData({ ...formData, fechaInicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Fin</Label>
                  <Input 
                    type="date" 
                    value={formData.fechaFin} 
                    onChange={e => setFormData({ ...formData, fechaFin: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Total Horas</Label>
                  <Input 
                    type="number" 
                    value={formData.totalHoras} 
                    onChange={e => setFormData({ ...formData, totalHoras: parseInt(e.target.value) || 0 })}
                    min={1}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Horarios</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addHorario}>
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar Horario
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.horarios.map((horario, idx) => (
                    <div key={horario.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Select
                          value={horario.dia}
                          onValueChange={val => updateHorario(horario.id, 'dia', val)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DIAS_SEMANA.map(d => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="time"
                          value={horario.horaInicio}
                          onChange={e => updateHorario(horario.id, 'horaInicio', e.target.value)}
                          className="w-32"
                        />
                        <span>a</span>
                        <Input
                          type="time"
                          value={horario.horaFin}
                          onChange={e => updateHorario(horario.id, 'horaFin', e.target.value)}
                          className="w-32"
                        />
                      </div>
                      {formData.horarios.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="ml-auto"
                          onClick={() => removeHorario(horario.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observaciones (opcional)</Label>
                <textarea
                  className="w-full p-2 border rounded-md bg-background"
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDialogOpen(false);
                  setEditingClad(null);
                  resetForm();
                }}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingClad ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis CLADs</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : clads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tienes CLADs registrados
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Curso</TableHead>
                  <TableHead>Dependencia</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clads.map(clad => (
                  <TableRow key={clad.id}>
                    <TableCell className="font-medium">{clad.curso}</TableCell>
                    <TableCell>{DEPENDENCIAS.find(d => d.value === clad.dependencia)?.label}</TableCell>
                    <TableCell>{clad.sede?.nombre}</TableCell>
                    <TableCell>{clad.totalHoras}h</TableCell>
                    <TableCell>
                      <Badge variant={getEstadoBadgeVariant(clad.estado)}>
                        {clad.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {clad.estado === 'BORRADOR' && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleEdit(clad)} className="mr-2">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => handleEnviar(clad)}>
                            Enviar
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
