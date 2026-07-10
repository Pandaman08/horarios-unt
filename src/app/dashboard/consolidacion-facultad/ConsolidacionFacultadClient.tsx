'use client';

import React, { useState, useEffect } from 'react';
import { usePeriodo } from '@/contexts/PeriodoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  XCircle,
  User,
  BookOpen,
  ClipboardList,
  Calendar,
  Clock,
  FileText,
  AlertTriangle,
  Check,
  ChevronRight,
  Info,
  Search,
  MoreHorizontal,
  LayoutGrid,
  Eye,
  Download,
  Building2
} from 'lucide-react';
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from 'next-auth/react';
import { useDepartment } from '@/contexts/DepartmentContext';
import { DeclaracionJuradaPanel } from '@/components/declaracion/DeclaracionJuradaPanel';

interface DeclaracionHoraria {
  id_declaracion: number;
  id_docente: number;
  id_periodo: number;
  ibm: string;
  condicion: string;
  categoria: string;
  dedicacion: string;
  horas_dedicacion: number;
  estado: 'BORRADOR' | 'ENVIADO' | 'VALIDADO_DEPARTAMENTO' | 'APROBADO' | 'RECHAZADO';
  fecha_creacion: string;
  fecha_envio: string | null;
  fecha_aprobacion: string | null;
  observaciones: string | null;
  validadoPorId: number | null;
  fechaValidacionDepartamento: string | null;
  etapaRechazo: string | null;
  declaracionJuradaOpcion: string | null;
  fechaFirmaJurada: string | null;
  docente: {
    nombres: string;
    apellidos: string;
    codigo_docente: string;
    departamentoId: string;
    departamento?: {
      id: string;
      nombre: string;
    };
    facultadId: string;
    facultad?: {
      id: string;
      nombre: string;
    };
  };
  periodo: {
    nombre: string;
  };
  cargas_lectivas: {
    id_carga_lectiva: number;
    id_curso: number;
    tipo_clase: string;
    horas_semanales: number;
    grupos_asignados: number | null;
    curso: {
      codigo: string;
      nombre: string;
    };
  }[];
  cargas_no_lectivas: {
    id_carga_no_lectiva: number;
    tipo: string;
    descripcion: string | null;
    horas_semanales: number;
  }[];
}

const TIPOS_CARGA_NO_LECTIVA_LABELS: Record<string, string> = {
  PREPARACION_EVALUACION: 'Preparación y Evaluación',
  TUTORIA: 'Consejería y Tutoría',
  INVESTIGACION: 'Investigación',
  CAPACITACION: 'Capacitación',
  GOBIERNO: 'Actividades de Gobierno',
  ADMINISTRACION: 'Actividades de Administración',
  ASESORIA: 'Asesoría de Tesis, Exámenes Profesionales y Experiencia Profesional',
  RESPONSABILIDAD_SOCIAL: 'Responsabilidad Social Universitaria',
  COMITES_TECNICOS: 'Comités Técnicos y Comisiones',
  OTRO: 'Otro',
};

const getEstadoBadge = (estado: string) => {
  switch (estado) {
    case 'BORRADOR':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800 px-3 py-1 font-semibold uppercase text-xs tracking-wider">Borrador</Badge>;
    case 'ENVIADO':
      return <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800 px-3 py-1 font-semibold uppercase text-xs tracking-wider animate-pulse">Pendiente</Badge>;
    case 'VALIDADO_DEPARTAMENTO':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 px-3 py-1 font-semibold uppercase text-xs tracking-wider">Validado</Badge>;
    case 'APROBADO':
      return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 px-3 py-1 font-semibold uppercase text-xs tracking-wider">Aprobado</Badge>;
    case 'RECHAZADO':
      return <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800 px-3 py-1 font-semibold uppercase text-xs tracking-wider">Rechazado</Badge>;
    default:
      return <Badge variant="outline" className="px-3 py-1 font-semibold uppercase text-xs tracking-wider">{estado}</Badge>;
  }
};

export default function ConsolidacionFacultadClient({ periodos }: { periodos: any[] }) {
  const { data: session } = useSession();
  const { periodoActivo } = usePeriodo();
  const { departamentoSeleccionado } = useDepartment();
  const [declaraciones, setDeclaraciones] = useState<DeclaracionHoraria[]>([])
  const [loading, setLoading] = useState(true)
  const [rechazoComments, setRechazoComments] = useState<Record<number, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [repositorioUrl, setRepositorioUrl] = useState('')
  const itemsPerPage = 10;

  useEffect(() => {
    if (periodoActivo && session) {
      fetchDeclaraciones(periodoActivo.id_periodo);
    }
  }, [periodoActivo, session]);

  const fetchDeclaraciones = async (idPeriodo: number) => {
    try {
      setLoading(true);
      let url = `/api/consolidacion-facultad?idPeriodo=${idPeriodo}`;
      const res = await fetch(url);
      let data = await res.json();
      if (!Array.isArray(data)) {
        data = data ? [data] : [];
      }
      setDeclaraciones(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAprobar = async (declaracionId: number) => {
    try {
      const res = await fetch(`/api/consolidacion-facultad/${declaracionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'aprobar' })
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Error al aprobar la declaración');
        return;
      }
      toast.success('Declaración aprobada correctamente');
      setSelectedDeclaracion(null);
      if (periodoActivo) {
        fetchDeclaraciones(periodoActivo.id_periodo);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al aprobar la declaración');
    }
  };

  const handleRechazar = async (declaracionId: number) => {
    const comentarios = rechazoComments[declaracionId] || '';
    if (!comentarios.trim()) {
      toast.warning('Por favor, ingrese un comentario para el rechazo');
      return;
    }

    try {
      const res = await fetch(`/api/consolidacion-facultad/${declaracionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          accion: 'rechazar',
          observaciones: comentarios
        })
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Error al rechazar la declaración');
        return;
      }
      toast.success('Declaración rechazada correctamente');
      setSelectedDeclaracion(null);
      if (periodoActivo) {
        fetchDeclaraciones(periodoActivo.id_periodo);
        setCurrentPage(1);
      }
      setRechazoComments(prev => {
        const newComments = { ...prev };
        delete newComments[declaracionId];
        return newComments;
      });
    } catch (err) {
      console.error(err);
      toast.error('Error al rechazar la declaración');
    }
  };

  const handleGenerarEntregable = async () => {
    try {
      const res = await fetch(`/api/consolidacion-facultad/entregable`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idPeriodo: periodoActivo?.id_periodo,
          repositorioUrl
        })
      });
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Error al generar el entregable');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `entregable-consolidacion-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Entregable generado correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al generar el entregable');
    }
  };

  const getTotalLectivas = (cargas: DeclaracionHoraria['cargas_lectivas']) => {
    return (cargas || []).reduce((sum, c) => {
      const grupos = c.grupos_asignados || 0;
      const horas = c.horas_semanales || 0;
      return sum + (grupos * horas);
    }, 0);
  };

  const getTotalNoLectivas = (cargas: DeclaracionHoraria['cargas_no_lectivas']) => {
    return (cargas || []).reduce((sum, c) => sum + (c.horas_semanales || 0), 0);
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeclaracion, setSelectedDeclaracion] = useState<DeclaracionHoraria | null>(null);

  const declaracionesEnviadas = declaraciones.filter(d => {
    const matchesEstado = d.estado === 'VALIDADO_DEPARTAMENTO';
    const nombres = d.docente?.nombres || '';
    const apellidos = d.docente?.apellidos || '';
    const ibm = d.ibm || '';
    const departamento = d.docente?.departamento?.nombre || '';
    const matchesSearch = `${nombres} ${apellidos} ${ibm} ${departamento}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEstado && matchesSearch;
  });
  
  const totalPages = Math.ceil(declaracionesEnviadas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeclaraciones = declaracionesEnviadas.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-6 space-y-4 bg-background min-h-screen">
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border bg-card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center border border-purple-100 dark:border-purple-800">
                <LayoutGrid className="text-purple-600 dark:text-purple-400 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">Consolidación de Facultad</h1>
                <p className="text-muted-foreground text-xs mt-1">Aprobación final de declaraciones y generación de entregable</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-3 py-1.5 rounded-md text-xs font-semibold border border-purple-100 dark:border-purple-800">
              <ClipboardList size={14} />
              {declaracionesEnviadas.length} Pendientes
            </div>
          </div>
          
          <div className="p-3 bg-muted/30 flex flex-col md:flex-row gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Buscar por nombre, IBM o departamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 bg-background border-border focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-400 rounded-md text-sm shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="URL del repositorio..."
                value={repositorioUrl}
                onChange={(e) => setRepositorioUrl(e.target.value)}
                className="h-10 bg-background border-border rounded-md text-sm"
              />
              <Button
                onClick={handleGenerarEntregable}
                className="h-10 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold uppercase"
              >
                <Download className="w-4 h-4 mr-2" />
                Generar Entregable
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border">
              <TableRow>
                <TableHead className="text-sm font-bold uppercase text-muted-foreground px-6 py-3">Docente</TableHead>
                <TableHead className="text-sm font-bold uppercase text-muted-foreground px-6 py-3">IBM / Código</TableHead>
                <TableHead className="text-sm font-bold uppercase text-muted-foreground px-6 py-3">Departamento</TableHead>
                <TableHead className="text-sm font-bold uppercase text-muted-foreground px-6 py-3">Categoría</TableHead>
                <TableHead className="text-sm font-bold uppercase text-muted-foreground px-6 py-3 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDeclaraciones.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={40} className="text-muted-foreground/30" />
                      <p className="text-muted-foreground font-medium text-sm">No hay declaraciones pendientes</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                currentDeclaraciones.map((declaracion) => {
                  const totalLectivas = getTotalLectivas(declaracion.cargas_lectivas);
                  const totalNoLectivas = getTotalNoLectivas(declaracion.cargas_no_lectivas);
                  const totalGeneral = totalLectivas + totalNoLectivas;
                  const isComplete = totalGeneral === declaracion.horas_dedicacion;

                  return (
                    <TableRow key={declaracion.id_declaracion} className="hover:bg-muted/50 transition-colors border-b border-border last:border-0">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-foreground border border-border uppercase">
                            {declaracion.docente?.nombres?.charAt(0)}{declaracion.docente?.apellidos?.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground text-xs uppercase">
                              {declaracion.docente?.apellidos}, {declaracion.docente?.nombres}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">{declaracion.docente?.codigo_docente}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <span className="text-xs text-foreground font-medium">{declaracion.ibm}</span>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-foreground font-medium">{declaracion.docente?.departamento?.nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 text-[9px] font-bold uppercase px-2 py-0.5">
                          {declaracion.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-end">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="default" 
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase h-8 px-4 flex items-center gap-2 rounded-md transition-all shadow-sm"
                                onClick={() => setSelectedDeclaracion(declaracion)}
                              >
                                <Eye size={14} />
                                Revisar
                              </Button>
                            </DialogTrigger>
                          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-8">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                <User className="text-purple-600 dark:text-purple-400" size={20} />
                                Revisión de Carga: {declaracion.docente?.nombres} {declaracion.docente?.apellidos}
                              </DialogTitle>
                              <DialogDescription className="text-xs text-muted-foreground uppercase font-medium tracking-wider">
                                IBM: {declaracion.ibm} | {declaracion.docente?.departamento?.nombre} | {declaracion.dedicacion}
                              </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 mt-4">
                              <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-muted/30 rounded-xl border border-border text-center">
                                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Carga Lectiva</p>
                                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">{totalLectivas}h</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border border-border text-center">
                                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">No Lectiva</p>
                                  <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{totalNoLectivas}h</p>
                                </div>
                                <div className="p-4 bg-muted/30 rounded-xl border border-border text-center">
                                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Total General</p>
                                  <p className={`text-xl font-black ${isComplete ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {totalGeneral} / {declaracion.horas_dedicacion}h
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                    <BookOpen size={16} className="text-blue-500 dark:text-blue-400" />
                                    Carga Lectiva
                                  </h4>
                                  <div className="border border-border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader className="bg-muted/30">
                                        <TableRow>
                                          <TableHead className="text-xs font-bold uppercase text-muted-foreground">Curso</TableHead>
                                          <TableHead className="text-xs font-bold uppercase text-muted-foreground text-center">Tipo</TableHead>
                                          <TableHead className="text-xs font-bold uppercase text-muted-foreground text-center">Grupos</TableHead>
                                          <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(declaracion.cargas_lectivas || []).length === 0 ? (
                                          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6 text-xs italic">Sin registros de carga lectiva</TableCell></TableRow>
                                        ) : (
                                          (declaracion.cargas_lectivas || []).map((carga) => (
                                            <TableRow key={carga.id_carga_lectiva}>
                                              <TableCell className="py-2 text-xs font-medium text-foreground">
                                                {carga.curso?.nombre} <span className="text-muted-foreground font-normal ml-1">({carga.curso?.codigo})</span>
                                              </TableCell>
                                              <TableCell className="py-2 text-xs text-center text-foreground capitalize">{carga.tipo_clase}</TableCell>
                                              <TableCell className="py-2 text-xs text-center text-foreground">{carga.grupos_asignados}</TableCell>
                                              <TableCell className="py-2 text-xs text-right font-bold text-foreground">{(carga.grupos_asignados || 0) * (carga.horas_semanales || 0)}h</TableCell>
                                            </TableRow>
                                          ))
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
                                    <ClipboardList size={16} className="text-indigo-500 dark:text-indigo-400" />
                                    Carga No Lectiva
                                  </h4>
                                  <div className="border border-border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader className="bg-muted/30">
                                        <TableRow>
                                          <TableHead className="text-xs font-bold uppercase text-muted-foreground">Actividad</TableHead>
                                          <TableHead className="text-xs font-bold uppercase text-muted-foreground text-right">Horas</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {(declaracion.cargas_no_lectivas || []).length === 0 ? (
                                          <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-6 text-xs italic">Sin registros de carga no lectiva</TableCell></TableRow>
                                        ) : (
                                          (declaracion.cargas_no_lectivas || []).map((carga) => (
                                            <TableRow key={carga.id_carga_no_lectiva}>
                                              <TableCell className="py-2 text-xs font-medium text-foreground">
                                                {TIPOS_CARGA_NO_LECTIVA_LABELS[carga.tipo] || carga.tipo}
                                                {carga.descripcion && <p className="text-xs text-muted-foreground font-normal italic mt-0.5">{carga.descripcion}</p>}
                                              </TableCell>
                                              <TableCell className="py-2 text-xs text-right font-bold text-foreground">{carga.horas_semanales || 0}h</TableCell>
                                            </TableRow>
                                          ))
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                </div>

                                <DeclaracionJuradaPanel
                                  declaracion={declaracion}
                                  docente={declaracion.docente as any}
                                />
                              </div>

                              <div className="pt-6 border-t border-border space-y-4">
                                <div className="space-y-2">
                                  <Label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                                    <AlertTriangle size={14} className="text-amber-500 dark:text-amber-400" />
                                    Observaciones (Opcional si aprueba, obligatorio si rechaza)
                                  </Label>
                                  <Textarea
                                    placeholder="Indique los motivos del rechazo o sugerencias de corrección..."
                                    value={rechazoComments[declaracion.id_declaracion] || ''}
                                    onChange={(e) => setRechazoComments(prev => ({ ...prev, [declaracion.id_declaracion]: e.target.value }))}
                                    className="min-h-[100px] bg-muted/30 text-sm border-border"
                                  />
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button
                                    variant="outline"
                                    onClick={() => handleRechazar(declaracion.id_declaracion)}
                                    className="text-rose-600 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-800 dark:hover:bg-rose-900/30 h-10 px-6 text-xs font-bold uppercase"
                                  >
                                    Rechazar Declaración
                                  </Button>
                                  <Button
                                    onClick={() => handleAprobar(declaracion.id_declaracion)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-10 text-xs font-bold uppercase shadow-md shadow-emerald-100 dark:shadow-emerald-900/20 transition-all hover:scale-[1.02]"
                                  >
                                    Aprobar Carga
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-md border-border"
          >
            <MoreHorizontal className="w-4 h-4 rotate-180" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 rounded-md border-border"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 text-sm font-medium text-muted-foreground">
            Página <span className="font-bold text-foreground">{currentPage}</span> de <span className="font-bold text-foreground">{totalPages}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-md border-border"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="w-8 h-8 rounded-md border-border"
          >
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
