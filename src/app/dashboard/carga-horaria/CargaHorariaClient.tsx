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

const DEDICACIONES = [
  { label: 'Tiempo Completo 40 h', horas: 40 },
  { label: 'Tiempo Parcial 20 h', horas: 20 }
];

const CONDICIONES = ['Nombrado', 'Principal', 'Auxiliar', 'Jefe de Práctica', 'Profesor', 'Alumno'];
const CATEGORIAS = ['Asociado', 'Principal', 'Auxiliar', 'Titular'];

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
  }
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
    if (periodoActivo) {
      fetchGrupos(periodoActivo.id_periodo);
      fetchDeclaracion(periodoActivo.id_periodo, initialDocente.id_docente);
    }
  }, [periodoActivo, initialDocente]);

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
        setFormData({
          ibm: data.ibm,
          condicion: data.condicion,
          categoria: data.categoria,
          dedicacion: data.dedicacion,
          horas_dedicacion: data.horas_dedicacion
        });
        setCargasLectivas(data.cargas_lectivas || []);
        
        // Initialize with all predefined types, merging existing ones
        const cargasExistentes = data.cargas_no_lectivas || [];
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => {
          const existente = cargasExistentes.find((c: any) => c.tipo === tipo.value);
          if (existente) {
            return existente;
          }
          return {
            id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
            tipo: tipo.value,
            descripcion: '',
            horas_semanales: 0
          };
        });
        setCargasNoLectivas(cargasInicializadas);
      } else {
        // If no declaration exists, initialize with all predefined types
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
          id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
          tipo: tipo.value,
          descripcion: '',
          horas_semanales: 0
        }));
        setCargasNoLectivas(cargasInicializadas);
      }
    } catch (err) {
      console.error(err);
      // Initialize with all predefined types even on error
      const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
        id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
        tipo: tipo.value,
        descripcion: '',
        horas_semanales: 0
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
          await fetch('/api/carga-lectiva', {
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
        }
      }

      // Save cargas no lectivas using upsert
      await fetch('/api/carga-no-lectiva', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_declaracion: declaracionId,
          cargas: cargasNoLectivas
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
    <div className="p-6 space-y-4 bg-[#f8fafc] min-h-screen">
      {/* Header Unificado */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                <LayoutGrid className="text-blue-600 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-none">Declaración de Carga Horaria</h1>
                <p className="text-slate-500 text-xs mt-1">Gestiona tu carga lectiva y no lectiva para el periodo académico</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleCreateOrSave} 
                variant="outline" 
                size="sm"
                className="h-9 px-4 text-xs font-bold uppercase border-slate-200 hover:bg-slate-50 flex items-center gap-2"
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
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Estado:</span>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[9px] font-bold uppercase px-2 py-0.5",
                      declaracion.estado === 'BORRADOR' ? "bg-amber-50 text-amber-700 border-amber-100" :
                      declaracion.estado === 'ENVIADO' ? "bg-blue-50 text-blue-700 border-blue-100" :
                      declaracion.estado === 'APROBADO' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      "bg-rose-50 text-rose-700 border-rose-100"
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
        <Card className="border-rose-200 bg-rose-50/30 shadow-none">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="mt-0.5 text-rose-600">
              <XCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-800 uppercase tracking-tight">Declaración Rechazada</h3>
              <p className="text-sm text-rose-700 mt-1 leading-relaxed">{declaracion.observaciones}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Datos del Docente */}
        <Card className="p-4 lg:col-span-2 shadow-sm border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              Datos del Docente
            </h3>
          </div>
          <CardContent className="p-4 space-y-6">
            {initialDocente && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nombre Completo</p>
                  <p className="text-sm font-bold text-slate-700">{initialDocente.nombres} {initialDocente.apellidos}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Departamento Académico</p>
                  <p className="text-sm font-medium text-slate-600">{initialDocente.especialidad || 'Ingeniería de Sistemas'}</p>
                </div>
              </div>
            )}
            
            <div className="pt-4 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">IBM / Código</Label>
                  <Input
                    value={formData.ibm}
                    onChange={e => setFormData({ ...formData, ibm: e.target.value })}
                    className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Condición</Label>
                  <Select value={formData.condicion} onValueChange={v => setFormData({ ...formData, condicion: v })}>
                    <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm">
                      <SelectValue placeholder="Seleccionar condición" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDICIONES.map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Categoría</Label>
                  <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                    <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm">
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c} className="text-sm">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-slate-500 uppercase">Dedicación Horaria</Label>
                  <Select
                    value={formData.dedicacion}
                    onValueChange={v => {
                      const ded = DEDICACIONES.find(d => d.label === v);
                      setFormData({ ...formData, dedicacion: v, horas_dedicacion: ded?.horas || 0 });
                    }}
                  >
                    <SelectTrigger className="h-10 bg-slate-50/50 border-slate-200 focus:bg-white transition-all text-sm">
                      <SelectValue placeholder="Seleccionar dedicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEDICACIONES.map(d => <SelectItem key={d.label} value={d.label} className="text-sm">{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de Horas */}
        <Card className="p-4 shadow-sm border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock size={16} className="text-indigo-500" />
              Resumen de Horas
            </h3>
          </div>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Carga Lectiva</span>
                <span className="text-lg font-black text-blue-600">{totalLectivas}h</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">No Lectiva</span>
                <span className="text-lg font-black text-indigo-600">{totalNoLectivas}h</span>
              </div>
              <div className={cn(
                "flex justify-between items-center p-3 rounded-lg border transition-all duration-300",
                totalGeneral === formData.horas_dedicacion 
                  ? "bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-50" 
                  : "bg-rose-50 border-rose-100"
              )}>
                <div className="flex flex-col">
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-tight",
                    totalGeneral === formData.horas_dedicacion ? "text-emerald-600" : "text-rose-600"
                  )}>Total Registrado</span>
                  <span className="text-[9px] text-slate-400 font-medium">Meta: {formData.horas_dedicacion}h</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-2xl font-black",
                    totalGeneral === formData.horas_dedicacion ? "text-emerald-700" : "text-rose-700"
                  )}>{totalGeneral}h</span>
                  {totalGeneral === formData.horas_dedicacion && (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  )}
                </div>
              </div>
            </div>
            
            {formData.horas_dedicacion > 0 && totalGeneral !== formData.horas_dedicacion && (
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-2 items-start">
                <Info size={14} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 leading-tight font-medium">
                  La suma total debe coincidir exactamente con las {formData.horas_dedicacion}h de dedicación asignadas.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Carga Lectiva Asignada */}
      <Card className="p-4 shadow-sm border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <BookOpen size={16} className="text-blue-500" />
            Carga Lectiva Asignada
          </h3>
          <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 text-[10px] font-bold px-2 py-0.5 border-blue-100 uppercase">
            Total: {totalLectivas}h
          </Badge>
        </div>
        <CardContent className="p-0">
          {cargasLectivas.length === 0 ? (
            <div className="text-center py-16 bg-white">
              <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400 font-medium text-xs">Aún no hay carga lectiva asignada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10">Código</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10">Curso</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">Tipo</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">Escuela</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">Ciclo</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">HT</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">HP</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-2 h-10 text-center">HL</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10 text-right">Total</TableHead>
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
                      <TableRow key={`${index}-${curso?.id_curso}`} className="hover:bg-slate-50/50 border-slate-100 last:border-0">
                        <TableCell className="px-4 py-3 text-xs font-bold text-slate-700">{curso?.codigo}</TableCell>
                        <TableCell className="px-4 py-3 text-xs font-medium text-slate-800">{curso?.nombre}</TableCell>
                        <TableCell className="px-2 py-3 text-center">
                          <Badge variant="outline" className="text-[9px] font-bold px-1.5 py-0 bg-white">
                            {curso?.codigo?.startsWith('EL') ? 'EL' : 'OB'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-2 py-3 text-center text-[11px] text-slate-500 font-medium">Sistemas</TableCell>
                        <TableCell className="px-2 py-3 text-center text-[11px] font-bold text-slate-700">{ciclo}</TableCell>
                        <TableCell className="px-2 py-3 text-center text-xs text-slate-600">{HT || '-'}</TableCell>
                        <TableCell className="px-2 py-3 text-center text-xs text-slate-600">{HP || '-'}</TableCell>
                        <TableCell className="px-2 py-3 text-center text-xs text-slate-600">{HL || '-'}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-xs font-black text-slate-900">{totalHoras}h</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50 font-bold border-t border-slate-200">
                    <TableCell colSpan={8} className="px-4 py-3 text-[11px] font-bold uppercase text-slate-600 tracking-wider">Total Carga Lectiva</TableCell>
                    <TableCell className="px-4 py-3 text-right text-sm font-black text-blue-600">{totalLectivas}h</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carga No Lectiva Asignada */}
      <Card className="p-4 shadow-sm border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-500" />
            Carga No Lectiva Asignada
          </h3>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 text-[10px] font-bold px-2 py-0.5 border-indigo-100 uppercase">
            Total: {totalNoLectivas}h
          </Badge>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10">Tipo de Actividad</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10">Descripción de Actividades</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-slate-500 px-4 h-10 text-right">Horas/Sem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargasNoLectivas.map((carga, index) => {
                const tipoInfo = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.find(t => t.value === carga.tipo);
                const colors = [
                  { bg: 'bg-rose-50/40', text: 'text-rose-700', border: 'border-rose-100' },
                  { bg: 'bg-amber-50/40', text: 'text-amber-700', border: 'border-amber-100' },
                  { bg: 'bg-emerald-50/40', text: 'text-emerald-700', border: 'border-emerald-100' },
                  { bg: 'bg-cyan-50/40', text: 'text-cyan-700', border: 'border-cyan-100' },
                  { bg: 'bg-indigo-50/40', text: 'text-indigo-700', border: 'border-indigo-100' },
                  { bg: 'bg-fuchsia-50/40', text: 'text-fuchsia-700', border: 'border-fuchsia-100' },
                  { bg: 'bg-orange-50/40', text: 'text-orange-700', border: 'border-orange-100' },
                  { bg: 'bg-sky-50/40', text: 'text-sky-700', border: 'border-sky-100' },
                ];
                const color = colors[index % colors.length];
                
                return (
                  <TableRow key={`no-lectiva-${carga.tipo || index}`} className={cn("border-slate-100", color.bg)}>
                    <TableCell className="px-4 py-3 w-[30%]">
                      <div className={cn("font-bold text-xs", color.text)}>{tipoInfo?.label || carga.tipo}</div>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">{tipoInfo?.descripcion}</p>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Input
                        placeholder="Describa brevemente la actividad..."
                        value={carga.descripcion || ''}
                        className="bg-white/80 border-white/50 h-8 text-xs focus:bg-white transition-all shadow-none"
                        onChange={e => {
                          const newCargas = [...cargasNoLectivas];
                          const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                          newCargas[idx].descripcion = e.target.value;
                          setCargasNoLectivas(newCargas);
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 w-32 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className={cn("bg-white border-white/50 h-8 w-16 text-center font-black text-sm shadow-none", color.text)}
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
              <TableRow className="bg-indigo-50/80 hover:bg-indigo-50 font-bold border-t border-indigo-200">
                <TableCell colSpan={2} className="px-4 py-3 text-[11px] font-bold uppercase text-indigo-700 tracking-wider">Total Carga No Lectiva</TableCell>
                <TableCell className="px-4 py-3 text-right text-sm font-black text-indigo-800">{totalNoLectivas}h</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* TOTAL GENERAL CARD */}
      <Card className="bg-white border-slate-200 overflow-hidden shadow-sm">
        <CardContent className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="text-emerald-600 w-5 h-5" />
            </div>
            <div>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Total General de Carga</p>
              <p className="text-slate-400 text-[10px] font-medium uppercase tracking-tight">Carga Lectiva + No Lectiva</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn(
              "text-3xl font-black transition-colors",
              totalGeneral === formData.horas_dedicacion ? "text-emerald-600" : "text-slate-900"
            )}>{totalGeneral}h</span>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                totalGeneral === formData.horas_dedicacion ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              )} />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                {totalGeneral === formData.horas_dedicacion ? "Carga Completa" : `Faltan ${formData.horas_dedicacion - totalGeneral}h`}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formatos de Declaración */}
      <Card className="p-4 shadow-sm border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
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
                    ? "bg-white border-slate-100 hover:border-blue-300 hover:shadow-md cursor-pointer" 
                    : "bg-slate-50 border-slate-100 opacity-60 grayscale cursor-not-allowed"
                )}
                onClick={() => declaracion && handleGenerarFormato(formato.key)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                    <FileText className="text-slate-400 group-hover:text-blue-500 transition-colors" size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 leading-tight">{formato.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{formato.sub}</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-full bg-slate-50 group-hover:bg-blue-100 transition-colors">
                  <Download className="text-slate-300 group-hover:text-blue-600 transition-colors" size={14} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
