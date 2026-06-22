'use client';

import React, { useState, useEffect } from 'react';
import { usePeriodo } from '@/contexts/PeriodoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Plus, 
  Trash2, 
  Save, 
  Send, 
  FileText, 
  Download, 
  Loader2, 
  BookOpen, 
  CheckCircle2, 
  User, 
  XCircle,
  LayoutGrid,
  Info,
  Clock,
  Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulacionBadge } from '@/components/ui/SimulacionBadge';
import { 
  mapCondicionToTexto, 
  mapCategoriaDocenteToTexto, 
  mapRegimenDedicacionToTexto 
} from '@/lib/docenteMappers';
import { 
  REGIMEN_DEDICACION, 
  TIPO_CONTRATO, 
  type RegimenDedicacion as RegimenDedicacionType, 
  type TipoContrato as TipoContratoType 
} from '@/lib/constants/regimenHoras';

const CONDICION_OPCIONES = [
  { value: 'ORDINARIO', label: 'Ordinario (Nombrado)' },
  { value: 'CONTRATADO', label: 'Contratado' },
  { value: 'EXTRAORDINARIO', label: 'Extraordinario' }
];

const CATEGORIA_OPCIONES = [
  { value: 'PRINCIPAL', label: 'Principal' },
  { value: 'ASOCIADO', label: 'Asociado' },
  { value: 'AUXILIAR', label: 'Auxiliar' }
];

const REGIMEN_OPCIONES = [
  { value: 'DE', label: 'Dedicación Exclusiva - 40h' },
  { value: 'TC', label: 'Tiempo Completo - 40h' },
  { value: 'TP1', label: 'Tiempo Parcial 1 - 20h' },
  { value: 'TP2', label: 'Tiempo Parcial 2 - 10h' },
  { value: 'TP3', label: 'Tiempo Parcial 3 - 8h' }
];

const TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS = [
  {
    value: 'PREPARACION_EVALUACION',
    label: 'Preparación y Evaluación',
    descripcion: 'Preparación de clases, elaboración de materiales, evaluación de estudiantes (Max 50% del Trabajo Lectivo)'
  },
  {
    value: 'TUTORIA',
    label: 'Consejería y Tutoría',
    descripcion: 'Acompañamiento académico y personal a estudiantes'
  },
  {
    value: 'INVESTIGACION',
    label: 'Investigación',
    descripcion: 'Desarrollo de proyectos de investigación'
  },
  {
    value: 'CAPACITACION',
    label: 'Capacitación',
    descripcion: 'Formación y actualización docente'
  },
  {
    value: 'GOBIERNO',
    label: 'Actividades de Gobierno',
    descripcion: 'Participación en órganos de gobierno de la facultad'
  },
  {
    value: 'ADMINISTRACION',
    label: 'Actividades de Administración',
    descripcion: 'Tareas administrativas asignadas'
  },
  {
    value: 'ASESORIA',
    label: 'Asesoría de Tesis, Exámenes Profesionales y Experiencia Profesional',
    descripcion: 'Asesoría a tesis, dirección de exámenes y experiencias profesionales'
  },
  {
    value: 'RESPONSABILIDAD_SOCIAL',
    label: 'Responsabilidad Social Universitaria',
    descripcion: 'Actividades de responsabilidad social (Mínimo 0.2 horas semanales)'
  },
  {
    value: 'COMITES_TECNICOS',
    label: 'Comités Técnicos y Comisiones',
    descripcion: 'Participación en comités técnicos y comisiones'
  },
  {
    value: 'AUTOEVALUACION_ACREDITACION',
    label: 'Autoevaluación y Acreditación',
    descripcion: 'Actividades de autoevaluación y preparación para acreditación'
  }
];

const TIPOS_QUE_REQUIEREN_DOCUMENTO = new Set([
  'INVESTIGACION',
  'CAPACITACION',
  'ASESORIA',
  'RESPONSABILIDAD_SOCIAL',
  'COMITES_TECNICOS',
  'AUTOEVALUACION_ACREDITACION'
]);

const DIAS_SEMANA = [
  { value: 'LU', label: 'Lunes' },
  { value: 'MA', label: 'Martes' },
  { value: 'MI', label: 'Miércoles' },
  { value: 'JU', label: 'Jueves' },
  { value: 'VI', label: 'Viernes' },
  { value: 'SA', label: 'Sábado' }
];

export default function CargaHorariaClient({ initialDocente }: { initialDocente: any }) {
  const { periodoActivo } = usePeriodo();
  const [declaracion, setDeclaracion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    ibm: initialDocente?.codigo_docente || '',
    condicion: '',
    categoria: '',
    dedicacion: '',
    horas_dedicacion: 0
  });
  const [cargasLectivas, setCargasLectivas] = useState<any[]>([]);
  const [cargasNoLectivas, setCargasNoLectivas] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [cargosAcademicos, setCargosAcademicos] = useState<any[]>([]);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch('/api/cursos');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCursos(data);
        } else if (data && Array.isArray(data.cursos)) {
          setCursos(data.cursos);
        } else {
          setCursos([]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCursos();
  }, []);

  useEffect(() => {
    const fetchCargos = async () => {
      try {
        const res = await fetch('/api/cargos-academicos-administrativos');
        const data = await res.json();
        if (Array.isArray(data)) {
          setCargosAcademicos(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCargos();
  }, []);

  useEffect(() => {
    if (periodoActivo) {
      fetchGrupos(periodoActivo.id_periodo);
      fetchDeclaracion(periodoActivo.id_periodo, initialDocente.id_docente);
    }
  }, [periodoActivo, initialDocente]);

  const getHorasDedicacion = (docente: any): number => {
    if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
      return TIPO_CONTRATO[docente.tipoContrato as TipoContratoType]?.totalHoras || 0;
    } else if (docente.regimenDedicacion) {
      return REGIMEN_DEDICACION[docente.regimenDedicacion as RegimenDedicacionType]?.totalHoras || 0;
    }
    return 0;
  };

  const fetchGrupos = async (idPeriodo: number) => {
    try {
      const res = await fetch(`/api/grupos?idPeriodo=${idPeriodo}`);
      const data = await res.json();
      setGrupos(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDeclaracion = async (idPeriodo: number, idDocente: number) => {
    try {
      const res = await fetch(`/api/declaracion-horaria?idDocente=${idDocente}&idPeriodo=${idPeriodo}`);
      const data = await res.json();
      if (data) {
        setDeclaracion(data);
        // Always use initialDocente's enums for formData
        setFormData({
          ibm: data.ibm || initialDocente.codigo_docente || '',
          condicion: initialDocente.condicion,
          categoria: initialDocente.categoriaDocente,
          dedicacion: initialDocente.regimenDedicacion,
          horas_dedicacion: getHorasDedicacion(initialDocente)
        });
        setCargasLectivas(data.cargas_lectivas || []);
        
        // Initialize with all predefined types, merging existing ones
        const cargasExistentes = data.cargas_no_lectivas || [];
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => {
          const existente = cargasExistentes.find((c: any) => c.tipo === tipo.value);
          if (existente) {
            return {
              ...existente
            };
          }
          return {
            id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
            tipo: tipo.value,
            descripcion: '',
            horas_semanales: 0,
            ambiente: '',
            cargoId: null
          };
        });
        setCargasNoLectivas(cargasInicializadas);
      } else {
        // If no declaration exists, initialize formData from initialDocente
        const horasDedicacion = getHorasDedicacion(initialDocente);
        
        setFormData({
          ibm: initialDocente.codigo_docente || '',
          condicion: initialDocente.condicion,
          categoria: initialDocente.categoriaDocente,
          dedicacion: initialDocente.regimenDedicacion,
          horas_dedicacion: horasDedicacion
        });
        
        // Initialize with all predefined types
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
          id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
          tipo: tipo.value,
          descripcion: '',
          horas_semanales: 0,
          ambiente: '',
          cargoId: null
        }));
        setCargasNoLectivas(cargasInicializadas);
      }
    } catch (err) {
      console.error(err);
      // Initialize formData from initialDocente even on error
      const horasDedicacion = getHorasDedicacion(initialDocente);
      
      setFormData({
        ibm: initialDocente.codigo_docente || '',
        condicion: initialDocente.condicion,
        categoria: initialDocente.categoriaDocente,
        dedicacion: initialDocente.regimenDedicacion,
        horas_dedicacion: horasDedicacion
      });
      
      // Initialize with all predefined types even on error
      const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
        id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
        tipo: tipo.value,
        descripcion: '',
        horas_semanales: 0,
        ambiente: '',
        cargoId: null
      }));
      setCargasNoLectivas(cargasInicializadas);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrSave = async () => {
    if (!initialDocente || !periodoActivo) return;

    // Validate total hours don't exceed dedication
    if (formData.horas_dedicacion > 0 && totalGeneral > formData.horas_dedicacion) {
      toast.error(`Error: El total de horas (${totalGeneral}h) excede las horas de dedicación (${formData.horas_dedicacion}h)`);
      return;
    }

    // Check if number of cargas lectivas exceeds recommended limit
    let warningShown = false;
    if (cargasLectivas.filter(c => c.id_curso).length > 10) {
      toast.warning('Supera el máximo recomendado de 10 cursos por declaración', { duration: 6000 });
      warningShown = true;
    }

    try {
      let declaracionId = declaracion?.id_declaracion;

      // Create or update declaración
      if (!declaracionId) {
        const res = await fetch('/api/declaracion-horaria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_docente: initialDocente.id_docente,
            id_periodo: periodoActivo.id_periodo,
            ...formData
          })
        });
        const newDeclaracion = await res.json();
        declaracionId = newDeclaracion.id_declaracion;
        setDeclaracion(newDeclaracion);
      } else {
        // Directly send formData, it doesn't include estado
        await fetch(`/api/declaracion-horaria/${declaracionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
      }

      // Save cargas lectivas
      for (const carga of cargasLectivas) {
        if (!carga.id_curso) continue;
        
        if (carga.id_carga_lectiva && typeof carga.id_carga_lectiva === 'number') {
          // TODO: Update existing carga
        } else {
          const res = await fetch('/api/carga-lectiva', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_declaracion: declaracionId,
              id_curso: carga.id_curso,
              id_grupo: carga.id_grupo || null,
              tipo_clase: carga.tipo_clase || 'teoria',
              horas_semanales: carga.horas_semanales || 0,
              grupos_asignados: carga.grupos_asignados || null
            })
          });
          const data = await res.json();
          if (data.warning && !warningShown) {
            toast.warning(data.warning, { duration: 6000 });
            warningShown = true;
          }
        }
      }

      // Save cargas no lectivas using upsert (without horarios)
      await fetch('/api/carga-no-lectiva', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_declaracion: declaracionId,
          cargas: cargasNoLectivas.map(c => {
            const { horarios, ...rest } = c;
            return rest;
          })
        })
      });

      // Refresh data
      fetchDeclaracion(periodoActivo.id_periodo, initialDocente.id_docente);
      toast.success('Declaración guardada correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la declaración');
    }
  };

  const addCargaLectiva = () => {
    setCargasLectivas([...cargasLectivas, { 
      id_carga_lectiva: Date.now(), 
      id_curso: null, 
      id_grupo: null,
      tipo_clase: 'teoria', 
      horas_semanales: 0,
      grupos_asignados: 0
    }]);
  };

  const removeCargaLectiva = async (id: number) => {
    if (typeof id === 'number' && declaracion) {
      try {
        await fetch(`/api/carga-lectiva?id=${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error(err);
      }
    }
    setCargasLectivas(cargasLectivas.filter(c => c.id_carga_lectiva !== id));
  };

  const handleEnviar = async () => {
    if (!declaracion) return;

    // Validación obligatoria de horas totales
    if (totalGeneral !== formData.horas_dedicacion) {
      toast.error(`Error: Para enviar la declaración, el total de horas (${totalGeneral}h) debe ser exactamente igual a las horas de dedicación asignadas (${formData.horas_dedicacion}h).`);
      return;
    }

    // Check if number of cargas lectivas exceeds recommended limit
    if (cargasLectivas.filter(c => c.id_curso).length > 10) {
      toast.warning('Supera el máximo recomendado de 10 cursos por declaración', { duration: 6000 });
    }

    try {
      await fetch(`/api/declaracion-horaria/${declaracion.id_declaracion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, estado: 'ENVIADO' })
      });
      toast.success('Declaración enviada para aprobación');
      fetchDeclaracion(periodoActivo!.id_periodo, initialDocente.id_docente);
    } catch (err) {
      console.error(err);
      toast.error('Error al enviar la declaración');
    }
  };

  const handleGenerarFormato = async (formato: string) => {
    if (!declaracion) return;
    try {
      const res = await fetch(`/api/reportes/pdf?idDeclaracion=${declaracion.id_declaracion}&formato=${formato}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${formato}-declaracion-carga-horaria.pdf`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  const totalLectivas = cargasLectivas.reduce((sum, c) => {
    const grupos = c.grupos_asignados || 0;
    const horas = c.horas_semanales || 0;
    return sum + (grupos * horas);
  }, 0);
  const totalNoLectivas = cargasNoLectivas.reduce((sum, c) => sum + (c.horas_semanales || 0), 0);
  const totalGeneral = totalLectivas + totalNoLectivas;

  // Función para agrupar cargas por curso
  const cargasPorCurso = cargasLectivas.reduce((acc, carga) => {
    const cursoId = carga.id_curso;
    if (!cursoId) return acc;
    
    if (!acc[cursoId]) {
      acc[cursoId] = { curso: (Array.isArray(cursos) ? cursos : []).find(c => c.id_curso === cursoId), cargas: [] };
    }
    acc[cursoId].cargas.push(carga);
    return acc;
  }, {} as Record<number, { curso: any; cargas: any[] }>);
  
  // Aseguramos el tipo para el map
  const cursosArray = Object.values(cargasPorCurso) as Array<{ curso: any; cargas: any[] }>;

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-6 space-y-4 bg-background min-h-screen">
      {/* Header Unificado */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <LayoutGrid className="text-blue-600 dark:text-blue-400 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">Declaración de Carga Horaria</h1>
                <p className="text-muted-foreground text-xs mt-1">Gestiona tu carga lectiva y no lectiva para el periodo académico</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleCreateOrSave} 
                variant="outline" 
                size="sm"
                className="h-9 px-4 text-xs font-bold uppercase border-border hover:bg-muted flex items-center gap-2"
              >
                <Save size={14} /> Guardar Borrador
              </Button>
              {declaracion && (declaracion.estado === 'BORRADOR' || declaracion.estado === 'RECHAZADO') && (
                <Button 
                  onClick={handleEnviar} 
                  variant="default" 
                  size="sm"
                  className="h-9 px-4 text-xs font-bold uppercase bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-sm shadow-emerald-100"
                >
                  <Send size={14} /> Enviar para Aprobación
                </Button>
              )}
              {declaracion && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted border border-border rounded-md">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">Estado:</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5",
                      declaracion.estado === 'BORRADOR' ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50" :
                      declaracion.estado === 'ENVIADO' ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50" :
                      declaracion.estado === 'APROBADO' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50" :
                      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
                    )}
                  >
                    {declaracion.estado}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comentarios de rechazo */}
      {declaracion && declaracion.estado === 'RECHAZADO' && declaracion.observaciones && (
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 shadow-none">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="mt-0.5 text-rose-600 dark:text-rose-400">
              <XCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-800 dark:text-rose-400 uppercase tracking-tight">Declaración Rechazada</h3>
              <p className="text-sm text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">{declaracion.observaciones}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Datos del Docente */}
        <Card className="p-4 lg:col-span-2 shadow-sm border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <User size={16} className="text-blue-500 dark:text-blue-400" />
              Datos del Docente
            </h3>
          </div>
          <CardContent className="p-4 space-y-6">
            {initialDocente && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Nombre Completo</p>
                  <p className="text-sm font-bold text-foreground">{initialDocente.nombres} {initialDocente.apellidos}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Departamento Académico</p>
                  <p className="text-sm font-medium text-foreground">{initialDocente.departamento?.nombre || initialDocente.especialidad || 'Ingeniería de Sistemas'}</p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">IBM / Código</Label>
                  {declaracion && (declaracion.estado === 'APROBADO' || declaracion.estado === 'RECHAZADO') ? (
                    <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted text-sm text-foreground">{formData.ibm}</div>
                  ) : (
                    <Input
                      value={formData.ibm}
                      onChange={e => setFormData({ ...formData, ibm: e.target.value })}
                      className="h-10 bg-background border-border focus:bg-background transition-all text-sm"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Condición</Label>
                  {declaracion && (declaracion.estado === 'APROBADO' || declaracion.estado === 'RECHAZADO') ? (
                    <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted text-sm text-foreground">{mapCondicionToTexto(initialDocente.condicion)}</div>
                  ) : (
                    <Select value={formData.condicion} onValueChange={v => setFormData({ ...formData, condicion: v })}>
                      <SelectTrigger className="h-10 bg-background border-border focus:bg-background transition-all text-sm">
                        <SelectValue placeholder="Seleccionar condición" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDICION_OPCIONES.map(c => <SelectItem key={c.value} value={c.value} className="text-sm">{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Categoría</Label>
                  {declaracion && (declaracion.estado === 'APROBADO' || declaracion.estado === 'RECHAZADO') ? (
                    <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted text-sm text-foreground">{mapCategoriaDocenteToTexto(initialDocente.categoriaDocente)}</div>
                  ) : (
                    <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                      <SelectTrigger className="h-10 bg-background border-border focus:bg-background transition-all text-sm">
                        <SelectValue placeholder="Seleccionar categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIA_OPCIONES.map(c => <SelectItem key={c.value} value={c.value} className="text-sm">{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Dedicación Horaria</Label>
                  {declaracion && (declaracion.estado === 'APROBADO' || declaracion.estado === 'RECHAZADO') ? (
                    <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted text-sm text-foreground">{mapRegimenDedicacionToTexto(initialDocente.regimenDedicacion)}</div>
                  ) : (
                    <Select
                      value={formData.dedicacion}
                      onValueChange={v => {
                        const newHoras = REGIMEN_DEDICACION[v as RegimenDedicacionType]?.totalHoras || 0;
                        setFormData({ ...formData, dedicacion: v, horas_dedicacion: newHoras });
                      }}
                    >
                      <SelectTrigger className="h-10 bg-background border-border focus:bg-background transition-all text-sm">
                        <SelectValue placeholder="Seleccionar dedicación" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIMEN_OPCIONES.map(d => <SelectItem key={d.value} value={d.value} className="text-sm">{d.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Horas */}
        <Card className="p-4 shadow-sm border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock size={16} className="text-indigo-500 dark:text-indigo-400" />
              Resumen de Horas
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">Carga Lectiva</span>
                <span className="text-lg font-black text-blue-600 dark:text-blue-400">{totalLectivas}h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-muted rounded-lg border border-border">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-tight">No Lectiva</span>
                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{totalNoLectivas}h</span>
              </div>
              <div className={cn(
                "flex justify-between items-center p-3 rounded-lg border transition-all duration-300",
                totalGeneral === formData.horas_dedicacion 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 shadow-sm shadow-emerald-50" 
                  : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
              )}>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-tight",
                    totalGeneral === formData.horas_dedicacion ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                  )}>Total Registrado</span>
                  <span className="text-[9px] text-muted-foreground font-medium">Meta: {formData.horas_dedicacion}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl font-black",
                    totalGeneral === formData.horas_dedicacion ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"
                  )}>{totalGeneral}h</span>
                  {totalGeneral === formData.horas_dedicacion && (
                    <CheckCircle2 size={20} className="text-emerald-500 dark:text-emerald-400" />
                  )}
                </div>
              </div>
            </div>
            
            {formData.horas_dedicacion > 0 && totalGeneral !== formData.horas_dedicacion && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg flex gap-2 items-start">
                <Info size={14} className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-tight font-medium">
                  La suma total debe coincidir exactamente con las {formData.horas_dedicacion}h de dedicación asignadas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Carga Lectiva Asignada */}
      <Card className="p-4 shadow-sm border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500 dark:text-blue-400" />
            Carga Lectiva Asignada
          </h3>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-[10px] font-bold px-2 py-0.5 border-blue-200 dark:border-blue-900/50 uppercase">
            Total: {totalLectivas}h
          </Badge>
        </div>
        <CardContent className="p-0">
          {cargasLectivas.length === 0 ? (
            <div className="text-center py-16 bg-card">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium text-xs">Aún no hay carga lectiva asignada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10">Código</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10">Curso</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">Tipo</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">Escuela</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">Ciclo</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">HT</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">HP</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-2 h-10 text-center">HL</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cursosArray.map(({ curso, cargas }, index) => {
                    const HT = cargas.find(c => c.tipo_clase === 'teoria')?.horas_semanales || 0;
                    const HP = cargas.find(c => c.tipo_clase === 'practica')?.horas_semanales || 0;
                    const cLaboratorio = cargas.find(c => c.tipo_clase === 'laboratorio');
                    const HL = (cLaboratorio?.grupos_asignados || 0) * (cLaboratorio?.horas_semanales || 0);
                    const totalHoras = HT + HP + HL;
                    
                    const cursoCiclos: { [key: string]: string } = {
                      'introducción a la programación': 'I', 'introducción a la ingeniería de sistemas': 'I',
                      'programación orientada a objetos ii': 'III', 'sistémica': 'III',
                      'ingeniería de datos i': 'V', 'sistemas de información': 'V',
                      'ingeniería del software i': 'VII', 'redes y comunicaciones i': 'VII',
                      'tesis i': 'IX', 'analítica de negocios': 'IX'
                    };
                    let ciclo = 'V';
                    if (curso?.nombre) {
                      const nombre = curso.nombre.toLowerCase().trim();
                      if (cursoCiclos[nombre]) ciclo = cursoCiclos[nombre];
                    }
                    
                    return (
                      <TableRow key={`${index}-${curso?.id_curso}`} className="hover:bg-muted/50 border-border last:border-0">
                        <TableCell className="px-4 py-3 text-xs font-bold text-foreground">{curso?.codigo}</TableCell>
                        <TableCell className="px-4 py-3 text-xs font-medium text-foreground">{curso?.nombre}</TableCell>
                        <TableCell className="px-2 py-3 text-center">
                          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-card border-border">
                            {curso?.codigo?.startsWith('EL') ? 'EL' : 'OB'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-3 text-center text-[11px] text-muted-foreground font-medium">Sistemas</TableCell>
                        <TableCell className="px-2 py-3 text-center text-[11px] font-bold text-foreground">{ciclo}</TableCell>
                        <TableCell className="px-2 py-3 text-center text-xs text-muted-foreground">{HT || '-'}</TableCell>
                        <TableCell className="px-2 py-3 text-center text-xs text-muted-foreground">{HP || '-'}</TableCell>
                        <TableCell className="px-2 py-3 text-center text-xs text-muted-foreground">{HL || '-'}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-xs font-black text-foreground">{totalHoras}h</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-muted/80 hover:bg-muted font-bold border-t border-border">
                    <TableCell colSpan={8} className="px-4 py-3 text-[11px] font-bold uppercase text-muted-foreground tracking-wider">Total Carga Lectiva</TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-black text-blue-600 dark:text-blue-400">{totalLectivas}h</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carga No Lectiva Asignada */}
      <Card className="p-4 shadow-sm border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-500 dark:text-indigo-400" />
            Carga No Lectiva Asignada
          </h3>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-[10px] font-bold px-2 py-0.5 border-indigo-200 dark:border-indigo-900/50 uppercase">
            Total: {totalNoLectivas}h
          </Badge>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10">Tipo de Actividad</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10">Descripción de Actividades</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-muted-foreground px-4 h-10 text-right">Horas/Sem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargasNoLectivas.map((carga, index) => {
                const tipoInfo = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.find(t => t.value === carga.tipo);
                const requiereDocumento = TIPOS_QUE_REQUIEREN_DOCUMENTO.has(carga.tipo);
                const colors = [
                  { bg: 'bg-rose-50/40 dark:bg-rose-950/30', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-100 dark:border-rose-900/50' },
                  { bg: 'bg-amber-50/40 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/50' },
                  { bg: 'bg-emerald-50/40 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/50' },
                  { bg: 'bg-cyan-50/40 dark:bg-cyan-950/30', text: 'text-cyan-700 dark:text-cyan-400', border: 'border-cyan-100 dark:border-cyan-900/50' },
                  { bg: 'bg-indigo-50/40 dark:bg-indigo-950/30', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-900/50' },
                  { bg: 'bg-fuchsia-50/40 dark:bg-fuchsia-950/30', text: 'text-fuchsia-700 dark:text-fuchsia-400', border: 'border-fuchsia-100 dark:border-fuchsia-900/50' },
                  { bg: 'bg-orange-50/40 dark:bg-orange-950/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/50' },
                  { bg: 'bg-sky-50/40 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-100 dark:border-sky-900/50' },
                ];
                const color = colors[index % colors.length];
                
                return (
                  <TableRow key={`no-lectiva-${carga.tipo || index}`} className={cn("border-border", color.bg)}>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn("font-bold text-xs", color.text)}>{tipoInfo?.label || carga.tipo}</div>
                        {carga.tipo === 'INVESTIGACION' && (
                          <SimulacionBadge tipo="INVESTIGACION_ETICA" />
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{tipoInfo?.descripcion}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3 space-y-3">
                      {/* Descripción / Documento */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {requiereDocumento ? 'N° de Resolución/Constancia/Código de Proyecto' : 'Descripción de Actividades'}
                        </Label>
                        <Input
                          placeholder={requiereDocumento ? 'Ingrese el documento de sustento...' : 'Describa brevemente la actividad...'}
                          value={carga.descripcion || ''}
                          className="bg-background/80 border-border h-8 text-xs focus:bg-background transition-all shadow-none"
                          onChange={e => {
                            const newCargas = [...cargasNoLectivas];
                            const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                            newCargas[idx].descripcion = e.target.value;
                            setCargasNoLectivas(newCargas);
                          }}
                        />
                      </div>

                      {/* Cargo (if applicable) */}
                      {(carga.tipo === 'GOBIERNO' || carga.tipo === 'ADMINISTRACION') && (
                        <div className="space-y-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              Cargo Académico/Administrativo
                            </Label>
                            <Select
                              value={carga.cargoId || ''}
                              onValueChange={val => {
                                const newCargas = [...cargasNoLectivas];
                                const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                                const cargo = cargosAcademicos.find(c => c.id === val);
                                if (cargo) {
                                  newCargas[idx].cargoId = val;
                                  newCargas[idx].horas_semanales = cargo.chnla;
                                } else {
                                  newCargas[idx].cargoId = null;
                                }
                                setCargasNoLectivas(newCargas);
                              }}
                            >
                              <SelectTrigger className="bg-background/80 border-border h-8 text-xs focus:bg-background transition-all shadow-none">
                                <SelectValue placeholder="Seleccione un cargo..." />
                              </SelectTrigger>
                              <SelectContent>
                                {cargosAcademicos.map(cargo => (
                                  <SelectItem key={cargo.id} value={cargo.id} className="text-xs">
                                    {cargo.nombre}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {carga.cargoId && (() => {
                            const cargo = cargosAcademicos.find(c => c.id === carga.cargoId);
                            return cargo ? (
                              <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg">
                                <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">
                                  Información del Cargo
                                </p>
                                <p className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
                                  Carga lectiva mínima sugerida: {cargo.chlm}h · Preparación y evaluación sugerida: {cargo.chnlpe}h
                                </p>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}

                      {/* Ambiente */}
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          Ambiente/Aula (opcional)
                        </Label>
                        <Input
                          placeholder="Ej: Aula 101, Laboratorio 3..."
                          value={carga.ambiente || ''}
                          className="bg-background/80 border-border h-8 text-xs focus:bg-background transition-all shadow-none"
                          onChange={e => {
                            const newCargas = [...cargasNoLectivas];
                            const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                            newCargas[idx].ambiente = e.target.value;
                            setCargasNoLectivas(newCargas);
                          }}
                        />
                      </div>


                    </TableCell>
                    <TableCell className="px-4 py-3 w-32 text-right align-top pt-3">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className={cn("bg-background border-border h-8 w-16 text-center font-black text-sm shadow-none", color.text)}
                          value={carga.horas_semanales || 0}
                          onChange={e => {
                            const horas = Math.floor(parseFloat(e.target.value) || 0);
                            const newCargas = [...cargasNoLectivas];
                            const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                            newCargas[idx].horas_semanales = Math.max(0, horas);
                            setCargasNoLectivas(newCargas);
                          }}
                        />
                        <span className={cn("text-xs font-bold", color.text)}>h</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-bold border-t border-indigo-200 dark:border-indigo-900/50">
                <TableCell colSpan={2} className="px-4 py-3 text-[11px] font-bold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">Total Carga No Lectiva</TableCell>
                <TableCell className="px-4 py-3 text-right text-sm font-black text-indigo-800 dark:text-indigo-400">{totalNoLectivas}h</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* TOTAL GENERAL CARD */}
      <Card className="bg-card border-border overflow-hidden shadow-sm">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 w-5 h-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Total General de Carga</p>
              <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-tight">Carga Lectiva + No Lectiva</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn(
              "text-3xl font-black transition-colors",
              totalGeneral === formData.horas_dedicacion ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
            )}>{totalGeneral}h</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                totalGeneral === formData.horas_dedicacion ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                {totalGeneral === formData.horas_dedicacion ? "Carga Completa" : `Faltan ${formData.horas_dedicacion - totalGeneral}h`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formatos de Declaración */}
      <Card className="p-4 shadow-sm border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText size={16} className="text-blue-500 dark:text-blue-400" />
            Formatos de Declaración Oficiales
          </h3>
        </div>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'formato1', label: 'Carga Horaria Asignada', sub: 'Formato 01 - Detalle' },
              { key: 'formato2', label: 'Declaración Jurada', sub: 'Formato 02 - Legal' },
              { key: 'formato3', label: 'Sedes Descentralizadas', sub: 'Formato 03 - Sedes' },
              { key: 'formato4', label: 'Horario Semanal', sub: 'Formato 04 - Horario' }
            ].map((formato) => (
              <div 
                key={formato.key} 
                className={cn(
                  "p-3 rounded-xl border transition-all duration-200 flex items-center justify-between group",
                  declaracion 
                    ? "bg-card border-border hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md cursor-pointer" 
                    : "bg-muted/50 border-border opacity-60 grayscale cursor-not-allowed"
                )}
                onClick={() => declaracion && handleGenerarFormato(formato.key)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-950/30 transition-colors">
                    <FileText className="text-muted-foreground group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground leading-tight">{formato.label}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">{formato.sub}</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-full bg-muted group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Download className="text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" size={14} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
