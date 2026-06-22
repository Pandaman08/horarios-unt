'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Database, User } from 'lucide-react';
import { toast } from 'sonner';

interface IntegracionSimulada {
  id: string;
  tipo: string;
  docenteId: number | null;
  docente: any;
  payload: string;
  resultado: string;
  fecha: string;
}

const TIPO_LABEL = {
  PERSONAL_ACADEMICO: 'Base de Datos de Personal Académico',
  INVESTIGACION_ETICA: 'Dirección de Investigación y Ética',
  RENACYT: 'RENACYT (CONCYTEC)',
  SANCIONES: 'Tribunal de Honor / RRHH'
};

export default function SimulacionesPage() {
  const [simulaciones, setSimulaciones] = useState<IntegracionSimulada[]>([]);
  const [loading, setLoading] = useState(true);
  const [docentes, setDocentes] = useState<any[]>([]);
  const [forzarResultado, setForzarResultado] = useState({
    docenteId: '',
    tipo: '',
    resultado: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [simRes, docRes] = await Promise.all([
          fetch('/api/simulaciones'),
          fetch('/api/docentes')
        ]);
        const simData = await simRes.json();
        const docData = await docRes.json();
        setSimulaciones(simData);
        setDocentes(docData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleForzar = async () => {
    try {
      const res = await fetch('/api/simulaciones/forzar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(forzarResultado)
      });
      if (res.ok) {
        toast.success('Resultado forzado exitosamente');
        const simRes = await fetch('/api/simulaciones');
        const simData = await simRes.json();
        setSimulaciones(simData);
      } else {
        toast.error('Error al forzar resultado');
      }
    } catch (error) {
      console.error('Error forcing result:', error);
      toast.error('Error al forzar resultado');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Simulaciones de Integración</h1>
          <p className="text-muted-foreground">Historial de llamadas a sistemas externos simulados</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Forzar Resultado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Forzar Resultado de Simulación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Docente</Label>
                <Select value={forzarResultado.docenteId} onValueChange={val => setForzarResultado({ ...forzarResultado, docenteId: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map(doc => (
                      <SelectItem key={doc.id_docente} value={doc.id_docente.toString()}>
                        {doc.nombres} {doc.apellidos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Simulación</Label>
                <Select value={forzarResultado.tipo} onValueChange={val => setForzarResultado({ ...forzarResultado, tipo: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABEL).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resultado JSON</Label>
                <Input
                  value={forzarResultado.resultado}
                  onChange={e => setForzarResultado({ ...forzarResultado, resultado: e.target.value })}
                  placeholder='{"validado": false, "observacion": "Informe pendiente"}'
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => {}}>Cancelar</Button>
                <Button onClick={handleForzar}>Aplicar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database size={18} /> Historial de Simulaciones
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Payload</TableHead>
                <TableHead>Resultado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : simulaciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No hay registros de simulación
                  </TableCell>
                </TableRow>
              ) : (
                simulaciones.map(sim => (
                  <TableRow key={sim.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(sim.fecha).toLocaleString('es-PE')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{TIPO_LABEL[sim.tipo as keyof typeof TIPO_LABEL] || sim.tipo}</Badge>
                    </TableCell>
                    <TableCell>
                      {sim.docente ? (
                        <div className="flex items-center gap-2">
                          <User size={14} />
                          {sim.docente.nombres} {sim.docente.apellidos}
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono text-muted-foreground">
                      {sim.payload}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-xs font-mono">
                      {sim.resultado}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
