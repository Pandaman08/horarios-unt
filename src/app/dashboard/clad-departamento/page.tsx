'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, Building2, User, CheckCircle2, XCircle } from 'lucide-react';

interface CargaLectivaAdicional {
  id: string;
  docenteId: number;
  docente: { id_docente: number; nombres: string; apellidos: string };
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

export default function CladDepartamentoPage() {
  const { data: session } = useSession();
  const [clads, setClads] = useState<CargaLectivaAdicional[]>([]);
  const [selectedClad, setSelectedClad] = useState<CargaLectivaAdicional | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchClads = async () => {
    try {
      const res = await fetch('/api/carga-lectiva-adicional?estado=ENVIADO');
      const data = await res.json();
      if (Array.isArray(data)) setClads(data);
    } catch (error) {
      console.error('Error fetching clads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClads();
  }, []);

  const handleAprobar = async (clad: CargaLectivaAdicional) => {
    try {
      const res = await fetch('/api/carga-lectiva-adicional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clad.id,
          estado: 'VALIDADO_DEPARTAMENTO',
          observaciones: observaciones || clad.observaciones
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error aprobando CLAD');
        return;
      }

      toast.success('CLAD aprobado correctamente');
      setSelectedClad(null);
      fetchClads();
    } catch (error) {
      console.error('Error aprobando:', error);
      toast.error('Error aprobando CLAD');
    }
  };

  const handleRechazar = async (clad: CargaLectivaAdicional) => {
    if (!observaciones) {
      toast.error('Por favor agrega observaciones antes de rechazar');
      return;
    }
    try {
      const res = await fetch('/api/carga-lectiva-adicional', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: clad.id,
          estado: 'RECHAZADO',
          observaciones
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        toast.error(errorData.error || 'Error rechazando CLAD');
        return;
      }

      toast.success('CLAD rechazado');
      setSelectedClad(null);
      fetchClads();
    } catch (error) {
      console.error('Error rechazando:', error);
      toast.error('Error rechazando CLAD');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Validación de CLADs</h1>
        <p className="text-muted-foreground">Revisa y valida los CLADs enviados por los docentes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>CLADs Enviados</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : clads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay CLADs pendientes de validación
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Docente</TableHead>
                  <TableHead>Curso</TableHead>
                  <TableHead>Dependencia</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clads.map(clad => (
                  <TableRow key={clad.id}>
                    <TableCell className="font-medium">
                      {clad.docente.nombres} {clad.docente.apellidos}
                    </TableCell>
                    <TableCell>{clad.curso}</TableCell>
                    <TableCell>{DEPENDENCIAS.find(d => d.value === clad.dependencia)?.label}</TableCell>
                    <TableCell>{clad.sede?.nombre}</TableCell>
                    <TableCell>{clad.totalHoras}h</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Revisar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="page-modal-lg">
                          <DialogHeader className="page-modal-header">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <DialogTitle className="text-base font-bold text-foreground">Revisar CLAD</DialogTitle>
                                <p className="text-xs text-muted-foreground mt-0.5">Validar carga lectiva adicional del docente</p>
                              </div>
                            </div>
                          </DialogHeader>
                          <div className="page-modal-body space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="page-modal-field">
                                <p className="page-modal-label">Docente</p>
                                <p className="font-medium">{clad.docente.nombres} {clad.docente.apellidos}</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Curso</p>
                                <p className="font-medium">{clad.curso}</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Dependencia</p>
                                <p className="font-medium">{DEPENDENCIAS.find(d => d.value === clad.dependencia)?.label}</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Sede</p>
                                <p className="font-medium">{clad.sede?.nombre}</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Número de Resolución</p>
                                <p className="font-medium">{clad.numeroResolucion || '-'}</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Total Horas</p>
                                <p className="font-medium">{clad.totalHoras}h</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Fecha Inicio</p>
                                <p className="font-medium">{new Date(clad.fechaInicio).toLocaleDateString('es-PE')}</p>
                              </div>
                              <div className="page-modal-field">
                                <p className="page-modal-label">Fecha Fin</p>
                                <p className="font-medium">{new Date(clad.fechaFin).toLocaleDateString('es-PE')}</p>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <p className="page-modal-label">Horarios</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {clad.horarios.map(horario => (
                                  <div key={horario.id} className="p-2 border rounded-md bg-muted flex items-center gap-3">
                                    <span className="font-medium">
                                      {DIAS_SEMANA.find(d => d.value === horario.dia)?.label}:
                                    </span>
                                    <span>{horario.horaInicio} - {horario.horaFin}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="page-modal-field">
                              <p className="page-modal-label">Observaciones</p>
                              <Textarea
                                placeholder="Agrega observaciones (requerido para rechazar)"
                                value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <div className="page-modal-footer border-t border-border pt-4">
                              <div className="page-actions-row justify-end gap-2">
                                <Button
                                  variant="destructive"
                                  className="page-modal-btn-submit bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleRechazar(clad)}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Rechazar
                                </Button>
                                <Button
                                  className="page-modal-btn-submit"
                                  onClick={() => handleAprobar(clad)}
                                >
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Aprobar
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
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
