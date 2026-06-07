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
import {
  CheckCircle2,
  XCircle,
  User,
  BookOpen,
  ClipboardList,
  Calendar,
  Clock,
  FileText,
} from 'lucide-react';

interface DeclaracionHoraria {
  id_declaracion: number;
  id_docente: number;
  id_periodo: number;
  ibm: string;
  condicion: string;
  categoria: string;
  dedicacion: string;
  horas_dedicacion: number;
  estado: 'BORRADOR' | 'ENVIADO' | 'APROBADO' | 'RECHAZADO';
  fecha_creacion: string;
  fecha_envio: string | null;
  fecha_aprobacion: string | null;
  observaciones: string | null;
  docente: {
    nombres: string;
    apellidos: string;
    codigo_docente: string;
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
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Borrador</Badge>;
    case 'ENVIADO':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Enviado</Badge>;
    case 'APROBADO':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Aprobado</Badge>;
    case 'RECHAZADO':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rechazado</Badge>;
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
};

export default function AprobacionCargaHorariaClient({ periodos }: { periodos: any[] }) {
  const { periodoActivo } = usePeriodo()
  const [declaraciones, setDeclaraciones] = useState<DeclaracionHoraria[]>([])
  const [loading, setLoading] = useState(true)
  const [rechazoComments, setRechazoComments] = useState<Record<number, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10;

  useEffect(() => {
    if (periodoActivo) {
      fetchDeclaraciones(periodoActivo.id_periodo);
    }
  }, [periodoActivo]);

  const fetchDeclaraciones = async (idPeriodo: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/declaracion-horaria?idPeriodo=${idPeriodo}`);
      let data = await res.json();
      // If it's a single object (when idDocente is also present), make it an array
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
      await fetch(`/api/declaracion-horaria/${declaracionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'APROBADO' })
      });
      alert('Declaración aprobada correctamente');
      if (periodoActivo) {
        fetchDeclaraciones(periodoActivo.id_periodo);
        // Regresar a la página 1 si es necesario
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
      alert('Error al aprobar la declaración');
    }
  };

  const handleRechazar = async (declaracionId: number) => {
    const comentarios = rechazoComments[declaracionId] || '';
    if (!comentarios.trim()) {
      alert('Por favor, ingrese un comentario para el rechazo');
      return;
    }

    try {
      await fetch(`/api/declaracion-horaria/${declaracionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado: 'RECHAZADO',
          observaciones: comentarios
        })
      });
      alert('Declaración rechazada correctamente');
      if (periodoActivo) {
        fetchDeclaraciones(periodoActivo.id_periodo);
        // Regresar a la página 1 si es necesario
        setCurrentPage(1);
      }
      // Clear the comment
      setRechazoComments(prev => {
        const newComments = { ...prev };
        delete newComments[declaracionId];
        return newComments;
      });
    } catch (err) {
      console.error(err);
      alert('Error al rechazar la declaración');
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

  // Filtrar solo las declaraciones que están ENVIADAS
  const declaracionesEnviadas = declaraciones.filter(d => d.estado === 'ENVIADO');
  
  // Lógica de paginación
  const totalPages = Math.ceil(declaracionesEnviadas.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentDeclaraciones = declaracionesEnviadas.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Aprobación de Carga Horaria</h1>
          <p className="text-slate-500 mt-1">Revisa y aprueba las declaraciones de carga horaria de los docentes</p>
        </div>
        <div className="text-sm text-slate-500">
          {declaracionesEnviadas.length} declaraciones pendientes
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Accordion>
            {currentDeclaraciones.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                No hay declaraciones de carga horaria pendientes de aprobación para este periodo.
              </div>
            ) : (
              currentDeclaraciones.map((declaracion) => {
                const totalLectivas = getTotalLectivas(declaracion.cargas_lectivas);
                const totalNoLectivas = getTotalNoLectivas(declaracion.cargas_no_lectivas);
                const totalGeneral = totalLectivas + totalNoLectivas;

                return (
                  <AccordionItem
                    key={declaracion.id_declaracion}
                    className="border border-slate-200 rounded-lg mb-4 p-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full text-left">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="text-blue-600" size={24} />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-800">
                              {declaracion.docente.nombres} {declaracion.docente.apellidos}
                            </h3>
                            <p className="text-sm text-slate-500">
                              IBM: {declaracion.ibm} | Categoría: {declaracion.categoria}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getEstadoBadge(declaracion.estado)}
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-700">Total: {totalGeneral}h</p>
                            <p className="text-xs text-slate-500">
                              Lectivas: {totalLectivas}h | No lectivas: {totalNoLectivas}h
                            </p>
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      {/* Observaciones de rechazo anterior (si hay) */}
                      {declaracion.observaciones && declaracion.estado === 'RECHAZADO' && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                          <h4 className="font-medium text-red-700 flex items-center gap-2">
                            <XCircle size={18} />
                            Comentarios de rechazo anterior:
                          </h4>
                          <p className="text-sm text-red-600 mt-2">{declaracion.observaciones}</p>
                        </div>
                      )}

                      {/* Datos de la declaración */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Condición</p>
                          <p className="font-medium">{declaracion.condicion}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Dedicación</p>
                          <p className="font-medium">{declaracion.dedicacion}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm text-slate-500">Horas de dedicación</p>
                          <p className="font-medium">{declaracion.horas_dedicacion}h</p>
                        </div>
                      </div>

                      {/* Carga Lectiva */}
                      <div className="mb-6">
                        <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                          <BookOpen size={18} />
                          Carga Lectiva Asignada
                        </h4>
                        {(declaracion.cargas_lectivas || []).length === 0 ? (
                          <div className="text-center py-4 text-slate-400">
                            No hay carga lectiva asignada.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(declaracion.cargas_lectivas || []).map((carga) => (
                              <div key={carga.id_carga_lectiva} className="grid grid-cols-12 gap-2 items-center p-3 bg-slate-50 rounded-lg">
                                <div className="col-span-4">
                                  <p className="text-sm font-medium text-slate-700">
                                    {carga.curso.codigo} - {carga.curso.nombre}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-slate-600">
                                    {carga.tipo_clase === 'teoria' ? 'Teoría' : 
                                     carga.tipo_clase === 'practica' ? 'Práctica' : 'Laboratorio'}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-slate-600">
                                    {(carga.grupos_asignados || 0) === 0 ? 'Sin grupos' : 
                                     `${carga.grupos_asignados} grupo${(carga.grupos_asignados || 0) > 1 ? 's' : ''}`}
                                  </p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm text-slate-600">{carga.horas_semanales}h/sem</p>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-sm font-bold text-slate-800">
                                    {(carga.grupos_asignados || 0) * carga.horas_semanales}h
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Carga No Lectiva */}
                      <div className="mb-6">
                        <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                          <ClipboardList size={18} />
                          Carga No Lectiva
                        </h4>
                        {(declaracion.cargas_no_lectivas || []).length === 0 ? (
                          <div className="text-center py-4 text-slate-400">
                            No hay carga no lectiva.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(declaracion.cargas_no_lectivas || []).map((carga) => (
                              <div key={carga.id_carga_no_lectiva} className="grid grid-cols-12 gap-2 items-start p-3 bg-slate-50 rounded-lg">
                                <div className="col-span-8">
                                  <p className="text-sm font-medium text-slate-700">
                                    {TIPOS_CARGA_NO_LECTIVA_LABELS[carga.tipo] || carga.tipo}
                                  </p>
                                  {carga.descripcion && (
                                    <p className="text-sm text-slate-500">{carga.descripcion}</p>
                                  )}
                                </div>
                                <div className="col-span-4 text-right">
                                  <p className="text-sm font-bold text-slate-800">{carga.horas_semanales}h/sem</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Resumen final */}
                      <div className="p-4 border-t pt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-slate-500">Total general</p>
                            <p className={`text-xl font-bold ${totalGeneral === declaracion.horas_dedicacion ? 'text-green-600' : 'text-red-600'}`}>
                              {totalGeneral}h
                              {totalGeneral !== declaracion.horas_dedicacion && (
                                <span className="text-sm font-normal text-red-500 ml-2">
                                  (debe coincidir con {declaracion.horas_dedicacion}h de dedicación)
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Botones de aprobación/rechazo */}
                          {declaracion.estado === 'ENVIADO' && (
                            <div className="flex items-center gap-4">
                              <div className="flex-1 max-w-xs">
                                <label className="text-sm font-medium text-slate-700">Comentarios de rechazo (opcional)</label>
                                <Textarea
                                  placeholder="Ingrese comentarios para que el docente pueda corregir..."
                                  value={rechazoComments[declaracion.id_declaracion] || ''}
                                  onChange={(e) => setRechazoComments(prev => ({
                                    ...prev,
                                    [declaracion.id_declaracion]: e.target.value
                                  }))}
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => handleAprobar(declaracion.id_declaracion)}
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                                >
                                  <CheckCircle2 size={16} />
                                  Aprobar
                                </Button>
                                <Button
                                  onClick={() => handleRechazar(declaracion.id_declaracion)}
                                  variant="destructive"
                                  className="flex items-center gap-2"
                                >
                                  <XCircle size={16} />
                                  Rechazar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })
            )}
          </Accordion>
          
          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    onClick={() => setCurrentPage(page)}
                    className="w-10 h-10 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
