'use client';

import React, { useState, useEffect } from 'react';
import { usePeriodo } from '@/contexts/PeriodoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Send, FileText, Download, Loader2, BookOpen, CheckCircle2, User, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const DEDICACIONES = [
  { label: 'Dedicación Exclusiva', horas: 40 },
  { label: 'Tiempo Completo 40 h', horas: 40 },
  { label: 'Tiempo Completo 30 h', horas: 30 },
  { label: 'Tiempo Parcial 20 h', horas: 20 },
  { label: 'Tiempo Parcial 16 h', horas: 16 },
  { label: 'Tiempo Parcial 12 h', horas: 12 },
  { label: 'Tiempo Parcial 10 h', horas: 10 },
  { label: 'Tiempo Parcial 8 h', horas: 8 }
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
        setCursos(data);
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
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map(tipo => {
          const existente = cargasExistentes.find((c: any) => c.tipo === tipo.value);
          if (existente) {
            return existente;
          }
          return {
            id_carga_no_lectiva: Date.now() + Math.random(),
            tipo: tipo.value,
            descripcion: '',
            horas_semanales: 0
          };
        });
        setCargasNoLectivas(cargasInicializadas);
      } else {
        // If no declaration exists, initialize with all predefined types
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
          id_carga_no_lectiva: Date.now() + idx,
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
        id_carga_no_lectiva: Date.now() + idx,
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
      alert(`Error: El total de horas (${totalGeneral}h) excede las horas de dedicación (${formData.horas_dedicacion}h)`);
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
      alert('Declaración guardada correctamente');
    } catch (err) {
      console.error(err);
      alert('Error al guardar la declaración');
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
    try {
      await fetch(`/api/declaracion-horaria/${declaracion.id_declaracion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, estado: 'ENVIADO' })
      });
      alert('Declaración enviada para aprobación');
      fetchDeclaracion(periodoActivo!.id_periodo, initialDocente.id_docente);
    } catch (err) {
      console.error(err);
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
      acc[cursoId] = { curso: cursos.find(c => c.id_curso === cursoId), cargas: [] };
    }
    acc[cursoId].cargas.push(carga);
    return acc;
  }, {} as Record<number, { curso: any; cargas: any[] }>);
  
  // Aseguramos el tipo para el map
  const cursosArray = Object.values(cargasPorCurso) as Array<{ curso: any; cargas: any[] }>;

  if (loading) return <div className="p-8">Cargando...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Declaración de Carga Horaria</h1>
          <p className="text-slate-500 mt-1">Gestiona tu carga lectiva y no lectiva para el periodo académico</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateOrSave} className="flex items-center gap-2">
            <Save size={16} /> Guardar Borrador
          </Button>
          {declaracion && (declaracion.estado === 'BORRADOR' || declaracion.estado === 'RECHAZADO') && (
            <Button onClick={handleEnviar} variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Send size={16} /> Enviar para Aprobación
            </Button>
          )}
        </div>
      </div>

      {/* Comentarios de rechazo (si hay) */}
      {declaracion && declaracion.estado === 'RECHAZADO' && declaracion.observaciones && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            <XCircle size={20} />
            Declaración Rechazada - Comentarios para corregir:
          </h3>
          <p className="text-red-600 mt-2">{declaracion.observaciones}</p>
        </div>
      )}

      {/* Datos del Docente y Periodo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Datos del Docente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {initialDocente && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-slate-500">Docente</Label>
                  <p className="font-medium">{initialDocente.nombres} {initialDocente.apellidos}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Departamento Académico</Label>
                  <p className="font-medium">{initialDocente.especialidad || 'Ingeniería de Sistemas'}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-500">Facultad</Label>
                  <p className="font-medium">Ingeniería</p>
                </div>
              </div>
            )}
            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium mb-4">Confirmar Datos</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>IBM</Label>
                  <Input
                    value={formData.ibm}
                    onChange={e => setFormData({ ...formData, ibm: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condición</Label>
                  <Select value={formData.condicion} onValueChange={v => setFormData({ ...formData, condicion: v })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar condición" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDICIONES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar categoría">
                        {formData.categoria ? (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              formData.categoria === 'Titular' ? 'bg-emerald-500' :
                              formData.categoria === 'Principal' ? 'bg-blue-500' :
                              formData.categoria === 'Asociado' ? 'bg-amber-500' : 'bg-slate-500'
                            }`} />
                            <span className="font-medium">{formData.categoria}</span>
                          </div>
                        ) : "Seleccionar categoría"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => (
                        <SelectItem key={c} value={c}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              c === 'Titular' ? 'bg-emerald-500' :
                              c === 'Principal' ? 'bg-blue-500' :
                              c === 'Asociado' ? 'bg-amber-500' : 'bg-slate-500'
                            }`} />
                            {c}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Dedicación</Label>
                  <Select
                    value={formData.dedicacion}
                    onValueChange={v => {
                      const ded = DEDICACIONES.find(d => d.label === v);
                      setFormData({ ...formData, dedicacion: v, horas_dedicacion: ded?.horas || 0 });
                    }}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Seleccionar dedicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEDICACIONES.map(d => <SelectItem key={d.label} value={d.label}>{d.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen de Horas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Carga Lectiva</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalLectivas}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs text-slate-500 uppercase tracking-wide">Carga No Lectiva</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{totalNoLectivas}</p>
              </div>
              <div className={`p-4 rounded-lg ${totalGeneral === formData.horas_dedicacion ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-xs font-medium uppercase tracking-wide ${totalGeneral === formData.horas_dedicacion ? 'text-green-700' : 'text-red-700'}`}>Total</p>
                <p className={`text-2xl font-bold ${totalGeneral === formData.horas_dedicacion ? 'text-green-800' : 'text-red-800'} mt-1`}>{totalGeneral}</p>
              </div>
            </div>
            {formData.horas_dedicacion > 0 && (
              <div className="text-center p-3">
                <p className="text-sm text-slate-600">
                  Horas de dedicación: <span className="font-semibold text-slate-800">{formData.horas_dedicacion}h</span>
                </p>
                {totalGeneral !== formData.horas_dedicacion && (
                  <p className="text-sm text-red-500 mt-2">
                    El total debe coincidir con las horas de dedicación
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Carga Lectiva Asignada */}
      <Card>
        <CardHeader>
          <CardTitle>Carga Lectiva Asignada</CardTitle>
        </CardHeader>
        <CardContent>
          {cargasLectivas.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Aún no hay carga lectiva asignada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">CÓDIGO</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">NOMBRE DEL CURSO</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">CUR.</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">ESC. PROF.</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">CIC.</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">SEC.</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">N° AL.</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">HT</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">HP</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">HL</th>
                    <th className="text-center py-3 px-2 font-semibold text-slate-700 text-xs uppercase tracking-wide bg-slate-50">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cursosArray.map(({ curso, cargas }, index) => {
                    // Separar cargas por tipo
                    const cargaTeoria = cargas.find(c => c.tipo_clase === 'teoria');
                    const cargaPractica = cargas.find(c => c.tipo_clase === 'practica');
                    const cargaLaboratorio = cargas.find(c => c.tipo_clase === 'laboratorio');
                    
                    // Obtener valores directos (HT, HP, HL = horas semanales)
                    const HT = cargaTeoria?.horas_semanales || 0;
                    const HP = cargaPractica?.horas_semanales || 0;
                    const gruposL = cargaLaboratorio?.grupos_asignados || 0;
                    const horasL = cargaLaboratorio?.horas_semanales || 0;
                    const HL = gruposL * horasL;
                    
                    // Calcular total
                    const totalHoras = HT + HP + HL;
                    
                    // Datos para las columnas
                    const escuela = "Ing. Sistemas";
                    
                    // Mapeo de cursos a ciclos según el seeder
                    const cursoCiclos: { [key: string]: string } = {
                      'introducción a la programación': 'I',
                      'introducción a la ingeniería de sistemas': 'I',
                      'desarrollo personal': 'I',
                      'desarrollo del pensamiento lógico matemático': 'I',
                      'lectura crítica y redacción de textos académicos': 'I',
                      'introducción al análisis matemático': 'I',
                      'estadística general': 'I',
                      
                      'programación orientada a objetos ii': 'III',
                      'sistémica': 'III',
                      'ingeniería gráfica': 'III',
                      'matemática aplicada i': 'III',
                      'estadística aplicada': 'III',
                      'administración general': 'III',
                      'física electrónica': 'III',
                      'psicología organizacional': 'III',
                      
                      'ingeniería de datos i': 'V',
                      'sistemas de información': 'V',
                      'transformación digital': 'V',
                      'tecnologías web': 'V',
                      'arquitectura y organización de computadoras': 'V',
                      'teleinformática': 'V',
                      'investigación de operaciones': 'V',
                      'contabilidad gerencial': 'V',
                      
                      'ingeniería del software i': 'VII',
                      'redes y comunicaciones i': 'VII',
                      'negocios electrónicos': 'VII',
                      'gestión de servicios de tic': 'VII',
                      'metodología de la investigación científica': 'VII',
                      'administración de base de datos': 'VII',
                      'planeamiento estratégico de la información': 'VII',
                      'cadena de suministros': 'VII',
                      
                      'tesis i': 'IX',
                      'analítica de negocios': 'IX',
                      'auditoría informática': 'IX',
                      'gestión de proyectos de tic': 'IX',
                      'ingeniería web': 'IX',
                      'computación en la nube': 'IX',
                      'hackeo ético': 'IX',
                    };
                    
                    // Determinar ciclo
                    let ciclo = 'V';
                    if (curso?.nombre) {
                      const nombreCurso = curso.nombre.toLowerCase().trim();
                      if (cursoCiclos[nombreCurso]) {
                        ciclo = cursoCiclos[nombreCurso];
                      }
                    }
                    
                    return (
                      <tr key={`${index}-${curso?.id_curso || curso?.nombre || 'unknown'}`} className="hover:bg-slate-50 transition-colors">
                        {/* CÓDIGO */}
                        <td className="py-3 px-3">
                          <span className="font-medium text-slate-800 text-sm">{curso?.codigo || ''}</span>
                        </td>
                        {/* NOMBRE DEL CURSO */}
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-800 text-sm">{curso?.nombre || 'Curso sin nombre'}</div>
                        </td>
                        {/* CUR. */}
                        <td className="py-3 px-2 text-center">
                          <span className={`text-sm font-semibold ${curso?.codigo?.toUpperCase().startsWith('EL') ? 'text-purple-700' : 'text-slate-600'}`}>
                            {curso?.codigo?.toUpperCase().startsWith('EL') ? 'EL' : 'OB'}
                          </span>
                        </td>
                        {/* ESC. PROF. */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm text-slate-600">{escuela}</span>
                        </td>
                        {/* CIC. */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-semibold text-slate-800">{ciclo}</span>
                        </td>
                        {/* SEC. */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm text-slate-600">A</span>
                        </td>
                        {/* N° AL. */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm text-slate-600">50</span>
                        </td>
                        {/* HT */}
                        <td className="py-3 px-2 text-center">
                          {HT > 0 ? (
                            <span className="text-sm font-semibold text-slate-800">{HT}</span>
                          ) : (
                            <span className="text-slate-300 text-sm">-</span>
                          )}
                        </td>
                        {/* HP */}
                        <td className="py-3 px-2 text-center">
                          {HP > 0 ? (
                            <span className="text-sm font-semibold text-slate-800">{HP}</span>
                          ) : (
                            <span className="text-slate-300 text-sm">-</span>
                          )}
                        </td>
                        {/* HL */}
                        <td className="py-3 px-2 text-center">
                          {HL > 0 ? (
                            <span className="text-sm font-semibold text-slate-800">{HL}</span>
                          ) : (
                            <span className="text-slate-300 text-sm">-</span>
                          )}
                        </td>
                        {/* TOTAL */}
                        <td className="py-3 px-2 text-center">
                          <span className="text-sm font-bold text-slate-800">{totalHoras}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {/* Fila de total general */}
                  <tr className="bg-slate-100 border-t border-slate-300">
                    <td className="py-3 px-3 font-semibold text-slate-800 text-sm" colSpan={7}>TOTAL LECTIVA</td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm font-semibold text-slate-800">
                        {cargasLectivas.filter(c => c.tipo_clase === 'teoria').reduce((sum, c) => sum + (c.horas_semanales || 0), 0)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm font-semibold text-slate-800">
                        {cargasLectivas.filter(c => c.tipo_clase === 'practica').reduce((sum, c) => sum + (c.horas_semanales || 0), 0)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-sm font-semibold text-slate-800">
                        {cargasLectivas.filter(c => c.tipo_clase === 'laboratorio').reduce((sum, c) => sum + ((c.grupos_asignados || 0) * (c.horas_semanales || 0)), 0)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="text-lg font-bold text-slate-800">{totalLectivas}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carga No Lectiva Asignada */}
      <Card>
        <CardHeader>
          <CardTitle className="text-indigo-900">Carga No Lectiva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-indigo-200">
                  <th className="text-left py-3 px-3 font-semibold text-indigo-700 text-xs uppercase tracking-wide bg-indigo-50">TIPO</th>
                  <th className="text-left py-3 px-3 font-semibold text-indigo-700 text-xs uppercase tracking-wide bg-indigo-50">DESCRIPCIÓN</th>
                  <th className="text-center py-3 px-3 font-semibold text-indigo-700 text-xs uppercase tracking-wide bg-indigo-50">HRS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargasNoLectivas.map((carga, index) => {
                  const tipoInfo = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.find(t => t.value === carga.tipo);
                  const colors = [
                    { bg: 'bg-rose-50', text: 'text-rose-800' },
                    { bg: 'bg-amber-50', text: 'text-amber-800' },
                    { bg: 'bg-emerald-50', text: 'text-emerald-800' },
                    { bg: 'bg-cyan-50', text: 'text-cyan-800' },
                    { bg: 'bg-violet-50', text: 'text-violet-800' },
                    { bg: 'bg-fuchsia-50', text: 'text-fuchsia-800' },
                    { bg: 'bg-orange-50', text: 'text-orange-800' },
                    { bg: 'bg-sky-50', text: 'text-sky-800' },
                  ];
                  const color = colors[index % colors.length];
                  
                  return (
                    <tr key={carga.id_carga_no_lectiva} className={`hover:bg-slate-50 ${color.bg}`}>
                      <td className="py-3 px-3">
                        <div className={`font-semibold text-sm ${color.text}`}>{tipoInfo?.label || carga.tipo}</div>
                        <p className="text-xs text-slate-500">{tipoInfo?.descripcion}</p>
                      </td>
                      <td className="py-3 px-3">
                        <Input
                          placeholder="Describa su actividad..."
                          value={carga.descripcion || ''}
                          className="bg-white border-slate-200"
                          onChange={e => {
                            const newCargas = [...cargasNoLectivas];
                            const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                            newCargas[idx].descripcion = e.target.value;
                            setCargasNoLectivas(newCargas);
                          }}
                        />
                      </td>
                      <td className="py-3 px-3 w-32">
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          className={`bg-white border-slate-200 font-semibold text-lg ${color.text}`}
                          value={carga.horas_semanales || 0}
                          onChange={e => {
                            const horas = Math.floor(parseFloat(e.target.value) || 0);
                            const newCargas = [...cargasNoLectivas];
                            const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                            newCargas[idx].horas_semanales = Math.max(0, horas);
                            setCargasNoLectivas(newCargas);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
                {/* Fila de total para carga no lectiva */}
                <tr className="bg-indigo-100 border-t-2 border-indigo-300">
                  <td className="py-3 px-3 font-bold text-indigo-900 text-sm" colSpan={2}>TOTAL NO LECTIVA</td>
                  <td className="py-3 px-3 text-center">
                    <span className="text-lg font-bold text-indigo-900">{totalNoLectivas}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* TOTAL GENERAL */}
      <table className="w-full border-collapse mt-4">
        <tbody>
          <tr>
            <td className="border-2 border-slate-800 p-3 text-right font-bold text-slate-800">TOTAL</td>
            <td className="border-2 border-slate-800 p-3 text-center font-bold text-slate-800 text-lg">{totalGeneral}</td>
          </tr>
        </tbody>
      </table>

      {/* Formatos de Declaración */}
      <Card>
        <CardHeader>
          <CardTitle>Formatos de Declaración</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'formato1', label: 'Formato 01 - Carga Horaria Asignada' },
              { key: 'formato2', label: 'Formato 02 - Declaración Jurada' },
              { key: 'formato3', label: 'Formato 03 - Sedes Descentralizadas' }
            ].map((formato) => (
              <div 
                key={formato.key} 
                className="p-4 border rounded-lg hover:bg-slate-50 transition cursor-pointer flex items-center justify-between"
                onClick={() => handleGenerarFormato(formato.key)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-blue-500" size={32} />
                  <div>
                    <p className="font-medium">{formato.label}</p>
                    <Badge variant="outline" className="mt-1">
                      {declaracion ? 'Disponible' : 'Guardar primero'}
                    </Badge>
                  </div>
                </div>
                <Download className="text-slate-400" size={20} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
