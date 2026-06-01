'use client';

import React, { useState, useEffect } from 'react';
import { usePeriodo } from '@/contexts/PeriodoContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Send, FileText, Download } from 'lucide-react';

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

const TIPOS_CARGA_NO_LECTIVA = [
  { value: 'PREPARACION_EVALUACION', label: 'Preparación y Evaluación' },
  { value: 'TUTORIA', label: 'Tutoría' },
  { value: 'INVESTIGACION', label: 'Investigación' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'GOBIERNO', label: 'Gobierno' },
  { value: 'ADMINISTRACION', label: 'Administración' },
  { value: 'ASESORIA', label: 'Asesoría' },
  { value: 'RESPONSABILIDAD_SOCIAL', label: 'Responsabilidad Social' },
  { value: 'COMITES_TECNICOS', label: 'Comités Técnicos' },
  { value: 'OTRO', label: 'Otro' }
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
        setCargasNoLectivas(data.cargas_no_lectivas || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrSave = async () => {
    if (!initialDocente || !periodoActivo) return;

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

      // Save cargas no lectivas
      for (const carga of cargasNoLectivas) {
        if (carga.id_carga_no_lectiva && typeof carga.id_carga_no_lectiva === 'number') {
          // TODO: Update existing carga
        } else {
          await fetch('/api/carga-no-lectiva', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id_declaracion: declaracionId,
              tipo: carga.tipo || 'OTRO',
              descripcion: carga.descripcion || null,
              horas_semanales: carga.horas_semanales || 0
            })
          });
        }
      }

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

  const addCargaNoLectiva = () => {
    setCargasNoLectivas([...cargasNoLectivas, { 
      id_carga_no_lectiva: Date.now(), 
      tipo: 'OTRO', 
      descripcion: '', 
      horas_semanales: 0 
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

  const removeCargaNoLectiva = async (id: number) => {
    if (typeof id === 'number' && declaracion) {
      try {
        await fetch(`/api/carga-no-lectiva?id=${id}`, { method: 'DELETE' });
      } catch (err) {
        console.error(err);
      }
    }
    setCargasNoLectivas(cargasNoLectivas.filter(c => c.id_carga_no_lectiva !== id));
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

  const totalLectivas = cargasLectivas.reduce((sum, c) => sum + (c.horas_semanales || 0), 0);
  const totalNoLectivas = cargasNoLectivas.reduce((sum, c) => sum + (c.horas_semanales || 0), 0);
  const totalGeneral = totalLectivas + totalNoLectivas;

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
          {declaracion && declaracion.estado === 'BORRADOR' && (
            <Button onClick={handleEnviar} variant="default" className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Send size={16} /> Enviar para Aprobación
            </Button>
          )}
        </div>
      </div>

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
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDICIONES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
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
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Carga Lectiva</p>
                <p className="text-3xl font-bold text-blue-700">{totalLectivas}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Carga No Lectiva</p>
                <p className="text-3xl font-bold text-purple-700">{totalNoLectivas}</p>
              </div>
              <div className={`p-4 rounded-lg ${totalGeneral === formData.horas_dedicacion ? 'bg-green-50' : 'bg-red-50'}`}>
                <p className={`text-sm font-medium ${totalGeneral === formData.horas_dedicacion ? 'text-green-600' : 'text-red-600'}`}>Total</p>
                <p className={`text-3xl font-bold ${totalGeneral === formData.horas_dedicacion ? 'text-green-700' : 'text-red-700'}`}>{totalGeneral}</p>
              </div>
            </div>
            {formData.horas_dedicacion > 0 && (
              <div className="text-center">
                <p className="text-sm text-slate-500">
                  Horas de dedicación: <span className="font-bold">{formData.horas_dedicacion}h</span>
                </p>
                {totalGeneral !== formData.horas_dedicacion && (
                  <p className="text-sm text-red-500 mt-1">
                    ⚠️ El total debe coincidir con las horas de dedicación
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Cargas */}
      <Tabs defaultValue="lectiva" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="lectiva" className="flex-1">Carga Lectiva</TabsTrigger>
          <TabsTrigger value="no-lectiva" className="flex-1">Carga No Lectiva</TabsTrigger>
          <TabsTrigger value="formatos" className="flex-1">Formatos</TabsTrigger>
        </TabsList>

        <TabsContent value="lectiva" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Carga Lectiva Asignada</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cargasLectivas.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    Aún no hay carga lectiva asignada por el departamento.
                  </div>
                ) : (
                  cargasLectivas.map(carga => {
                    const curso = cursos.find(c => c.id_curso === carga.id_curso);
                    const grupo = grupos.find(g => g.id_grupo === carga.id_grupo);
                    return (
                      <div key={carga.id_carga_lectiva} className="grid grid-cols-12 gap-4 items-center p-4 bg-slate-50 rounded-lg">
                        <div className="col-span-4">
                          <Label className="text-sm text-slate-500">Curso</Label>
                          <p className="font-medium">{curso ? `${curso.codigo} - ${curso.nombre}` : '—'}</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm text-slate-500">Tipo</Label>
                          <p className="font-medium">{
                            carga.tipo_clase === 'teoria' ? 'Teoría' : 
                            carga.tipo_clase === 'practica' ? 'Práctica' : 'Laboratorio'
                          }</p>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-sm text-slate-500">Grupo</Label>
                          <p className="font-medium">{grupo ? grupo.codigo_grupo : '—'}</p>
                        </div>
                        <div className="col-span-1">
                          <Label className="text-sm text-slate-500">Horas/Sem</Label>
                          <p className="font-medium">{carga.horas_semanales}</p>
                        </div>
                        <div className="col-span-1">
                          <Label className="text-sm text-slate-500">N° Grupos</Label>
                          <p className="font-medium">{carga.grupos_asignados || '—'}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-lectiva" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Carga No Lectiva</CardTitle>
              <Button onClick={addCargaNoLectiva} size="sm" className="flex items-center gap-2">
                <Plus size={16} /> Agregar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cargasNoLectivas.map(carga => (
                  <div key={carga.id_carga_no_lectiva} className="grid grid-cols-12 gap-4 items-end p-4 bg-slate-50 rounded-lg">
                    <div className="col-span-4 space-y-1">
                      <Label>Tipo de Actividad</Label>
                      <Select
                        value={carga.tipo || 'OTRO'}
                        onValueChange={v => {
                          const newCargas = [...cargasNoLectivas];
                          const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                          newCargas[idx].tipo = v;
                          setCargasNoLectivas(newCargas);
                        }}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TIPOS_CARGA_NO_LECTIVA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-5 space-y-1">
                      <Label>Descripción</Label>
                      <Input
                        placeholder="Describa la actividad"
                        value={carga.descripcion || ''}
                        onChange={e => {
                          const newCargas = [...cargasNoLectivas];
                          const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                          newCargas[idx].descripcion = e.target.value;
                          setCargasNoLectivas(newCargas);
                        }}
                      />
                    </div>
                    <div className="col-span-1 space-y-1">
                      <Label>Horas</Label>
                      <Input
                        type="number"
                        value={carga.horas_semanales || 0}
                        onChange={e => {
                          const newCargas = [...cargasNoLectivas];
                          const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                          newCargas[idx].horas_semanales = parseInt(e.target.value) || 0;
                          setCargasNoLectivas(newCargas);
                        }}
                      />
                    </div>
                    <div className="col-span-1">
                      <Button variant="destructive" size="sm" onClick={() => removeCargaNoLectiva(carga.id_carga_no_lectiva)}>
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                {cargasNoLectivas.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    No hay cargas no lectivas agregadas
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="formatos" className="mt-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
