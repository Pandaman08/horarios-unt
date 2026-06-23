'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePeriodo } from '@/contexts/PeriodoContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
  BookOpen, 
  CheckCircle2, 
  User, 
  XCircle,
  LayoutGrid,
  Info,
  Clock,
  Briefcase,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SimulacionBadge } from '@/components/ui/SimulacionBadge';
import { parse, format, addMinutes } from 'date-fns';
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
import { MatrizDisponibilidad } from '@/components/horarios/MatrizDisponibilidad';

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
  const router = useRouter();
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
  const [horariosLectivos, setHorariosLectivos] = useState<any[]>([]);
  const [horariosLectivosLoading, setHorariosLectivosLoading] = useState(true);
  const [actividadNoLectivaSeleccionada, setActividadNoLectivaSeleccionada] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const lastSavedSnapshotRef = useRef<string>('');

  // Verificar si los horarios lectivos ya están confirmados
  useEffect(() => {
    if (periodoActivo && initialDocente) {
      fetchHorariosLectivos();
    }
  }, [periodoActivo, initialDocente]);

  useEffect(() => {
    const fetchCursos = async () => {
      try {
        const res = await fetch('/api/cursos');
        const data = await res.json();
        setCursos(Array.isArray(data) ? data : (data?.cursos || []));
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
        setCargosAcademicos(Array.isArray(data) ? data : []);
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

  const fetchHorariosLectivos = async () => {
    if (!initialDocente?.id_docente || !periodoActivo?.id_periodo) return;
    try {
      setHorariosLectivosLoading(true);
      const res = await fetch(`/api/docentes/horarios?periodoId=${periodoActivo.id_periodo}`);
      if (res.ok) {
        const data = await res.json();
        setHorariosLectivos(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHorariosLectivosLoading(false);
    }
  };

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

  const getSaveSnapshot = (formData: any, cargas: any[]) => JSON.stringify({
    formData: {
      ibm: formData.ibm,
      condicion: formData.condicion,
      categoria: formData.categoria,
      dedicacion: formData.dedicacion,
      horas_dedicacion: formData.horas_dedicacion
    },
    cargasNoLectivas: cargas.map(c => ({
      id_carga_no_lectiva: c.id_carga_no_lectiva,
      tipo: c.tipo,
      descripcion: c.descripcion,
      horas_semanales: c.horas_semanales,
      ambiente: c.ambiente,
      horarios: c.horarios || [],
      cargoId: c.cargoId || null
    }))
  });

  const fetchDeclaracion = async (idPeriodo: number, idDocente: number) => {
    try {
      const res = await fetch(`/api/declaracion-horaria?idDocente=${idDocente}&idPeriodo=${idPeriodo}`);
      const data = await res.json();
      if (data) {
        setDeclaracion(data);
        // Always use initialDocente's enums for formData
        const loadedFormData = {
          ibm: data.ibm || initialDocente.codigo_docente || '',
          condicion: initialDocente.condicion,
          categoria: initialDocente.categoriaDocente,
          dedicacion: initialDocente.regimenDedicacion,
          horas_dedicacion: getHorasDedicacion(initialDocente)
        };

        setFormData(loadedFormData);
        setCargasLectivas(data.cargas_lectivas || []);
        
        // Initialize with all predefined types, merging existing ones
        const cargasExistentes = data.cargas_no_lectivas || [];
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => {
          const existente = cargasExistentes.find((c: any) => c.tipo === tipo.value);
          if (existente) {
            return {
              ...existente,
              horarios: existente.horarios || []
            };
          }
          return {
            id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
            tipo: tipo.value,
            descripcion: '',
            horas_semanales: 0,
            ambiente: '',
            horarios: [],
            cargoId: null
          };
        });
        setCargasNoLectivas(cargasInicializadas);
        lastSavedSnapshotRef.current = getSaveSnapshot(loadedFormData, cargasInicializadas);
      } else {
        // If no declaration exists, initialize formData from initialDocente
        const horasDedicacion = getHorasDedicacion(initialDocente);
        
        const loadedFormData = {
          ibm: initialDocente.codigo_docente || '',
          condicion: initialDocente.condicion,
          categoria: initialDocente.categoriaDocente,
          dedicacion: initialDocente.regimenDedicacion,
          horas_dedicacion: horasDedicacion
        };

        setFormData(loadedFormData);
        
        // Initialize with all predefined types
        const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
          id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
          tipo: tipo.value,
          descripcion: '',
          horas_semanales: 0,
          ambiente: '',
          horarios: [],
          cargoId: null
        }));
        setCargasNoLectivas(cargasInicializadas);
        lastSavedSnapshotRef.current = getSaveSnapshot(loadedFormData, cargasInicializadas);
      }
    } catch (err) {
      console.error(err);
      // Initialize formData from initialDocente even on error
      const horasDedicacion = getHorasDedicacion(initialDocente);
      
      const loadedFormData = {
        ibm: initialDocente.codigo_docente || '',
        condicion: initialDocente.condicion,
        categoria: initialDocente.categoriaDocente,
        dedicacion: initialDocente.regimenDedicacion,
        horas_dedicacion: horasDedicacion
      };
      setFormData(loadedFormData);
      
      const cargasInicializadas = TIPOS_CARGA_NO_LECTIVA_PREDEFINIDOS.map((tipo, idx) => ({
        id_carga_no_lectiva: `temp_${Date.now()}_${idx}`,
        tipo: tipo.value,
        descripcion: '',
        horas_semanales: 0,
        ambiente: '',
        horarios: [],
        cargoId: null
      }));
      setCargasNoLectivas(cargasInicializadas);
      lastSavedSnapshotRef.current = getSaveSnapshot(loadedFormData, cargasInicializadas);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrSave = async () => {
    if (!initialDocente || !periodoActivo) return;
    if (isSaving) return;

    const currentSnapshot = getSaveSnapshot(formData, cargasNoLectivas);
    if (lastSavedSnapshotRef.current === currentSnapshot) {
      toast.success('No hay cambios para guardar');
      return;
    }

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }

    setIsSaving(true);

    // Validate total hours don't exceed dedication
    if (formData.horas_dedicacion > 0 && totalGeneral > formData.horas_dedicacion) {
      toast.error(`Error: El total de horas (${totalGeneral}h) excede las horas de dedicación (${formData.horas_dedicacion}h)`);
      setIsSaving(false);
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
            ...formData,
            estado: 'BORRADOR'
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
      await fetchDeclaracion(periodoActivo.id_periodo, initialDocente.id_docente);
      lastSavedSnapshotRef.current = currentSnapshot;
      toast.success('Declaración guardada correctamente');
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la declaración');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnviar = async () => {
    if (!declaracion) return;

    // Verificar que los horarios lectivos estén confirmados
    if (horariosLectivos.length === 0) {
      toast.error('Error: Primero debe confirmar sus horarios lectivos en la sección de selección de horarios.');
      return;
    }

    // Guardar cambios pendientes antes de enviar para que el backend valide el estado con datos actualizados
    const currentSnapshot = getSaveSnapshot(formData, cargasNoLectivas);
    if (lastSavedSnapshotRef.current !== currentSnapshot) {
      await handleCreateOrSave();
      if (lastSavedSnapshotRef.current !== currentSnapshot) {
        toast.error('Error: No se pudieron guardar los cambios antes de enviar. Intente nuevamente.');
        return;
      }
    }

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
      const res = await fetch(`/api/declaracion-horaria/${declaracion.id_declaracion}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, estado: 'ENVIADO' })
      });

      const responseData = await res.json();
      if (!res.ok) {
        toast.error(responseData?.error || 'Error al enviar la declaración');
        return;
      }

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

  const getHorasNoLectivas = (carga: any) => {
    const minutos = (carga.horarios || []).reduce((s: number, h: any) => {
      try {
        const start = parse(h.horaInicio, 'HH:mm', new Date());
        const end = parse(h.horaFin, 'HH:mm', new Date());
        return s + Math.max(0, (end.getTime() - start.getTime()) / 60000);
      } catch (e) {
        return s;
      }
    }, 0);

    if (minutos > 0) {
      return Math.round((minutos / 60) * 100) / 100;
    }

    return carga.horas_semanales || 0;
  };

  const totalLectivas = cargasLectivas.reduce((sum, c) => {
    const grupos = c.grupos_asignados || 0;
    const horas = c.horas_semanales || 0;
    return sum + (grupos * horas);
  }, 0);
  const totalNoLectivas = cargasNoLectivas.reduce((sum, c) => sum + getHorasNoLectivas(c), 0);
  const totalGeneral = totalLectivas + totalNoLectivas;

  const cargasPorCurso = cargasLectivas.reduce((acc, carga) => {
    const cursoId = carga.id_curso;
    if (!cursoId) return acc;
    
    if (!acc[cursoId]) {
      acc[cursoId] = { curso: (Array.isArray(cursos) ? cursos : []).find(c => c.id_curso === cursoId), cargas: [] };
    }
    acc[cursoId].cargas.push(carga);
    return acc;
  }, {} as Record<number, { curso: any; cargas: any[] }>);
  
  const cursosArray = Object.values(cargasPorCurso) as Array<{ curso: any; cargas: any[] }>;

  // Verificar si el estado de la declaración permite editar no lectiva
  const puedeEditarNoLectiva = declaracion && (
    declaracion.estado === 'BORRADOR' || 
    declaracion.estado === 'RECHAZADO' || 
    declaracion.estado === 'LECTIVA_CONFIRMADA'
  );
  const puedeEnviar = declaracion && (
    declaracion.estado === 'BORRADOR' || 
    declaracion.estado === 'RECHAZADO' || 
    declaracion.estado === 'LECTIVA_CONFIRMADA'
  );
  const mostrarHorarioConfirmado = declaracion?.estado === 'LECTIVA_CONFIRMADA' && !horariosLectivosLoading && horariosLectivos.length > 0;

  // Handler para asignar bloques a la actividad no lectiva seleccionada
  const autosaveCargas = async (cargasToSave: any[]) => {
    if (!initialDocente || !periodoActivo) return;

    try {
      let declaracionId = declaracion?.id_declaracion;

      if (!declaracionId) {
        const res = await fetch('/api/declaracion-horaria', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id_docente: initialDocente.id_docente,
            id_periodo: periodoActivo.id_periodo,
            ...formData,
            estado: 'BORRADOR'
          })
        });

        if (res.ok) {
          const newDeclaracion = await res.json();
          declaracionId = newDeclaracion.id_declaracion;
          setDeclaracion(newDeclaracion);
        } else {
          toast.error('Error al crear declaración antes de guardar cargas');
          return;
        }
      }

      await fetch('/api/carga-no-lectiva', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_declaracion: declaracionId, cargas: cargasToSave })
      });

      // Refresh
      if (declaracionId) {
        await fetchDeclaracion(periodoActivo.id_periodo, initialDocente.id_docente);
        lastSavedSnapshotRef.current = getSaveSnapshot(formData, cargasToSave);
      }
      toast.success('Cambios guardados automáticamente');
    } catch (err) {
      console.error('Error autosaving cargas', err);
      toast.error('Error al guardar cambios automáticamente');
    }
  };

  // Debounced autosave: schedule saves to avoid spamming the server
  const autosaveTimerRef = useRef<number | null>(null);
  const lastCargasRef = useRef<any[] | null>(null);

  const scheduleAutosave = (cargasToSave: any[]) => {
    lastCargasRef.current = cargasToSave;

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      if (lastCargasRef.current) autosaveCargas(lastCargasRef.current);
      autosaveTimerRef.current = null;
    }, 800);
  };

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, []);

  const handleNoLectivaCellClick = async (dia: number, hora: string) => {
    if (!actividadNoLectivaSeleccionada) {
      toast.error('Seleccione una actividad antes de asignar bloques');
      return;
    }

    const diasCodigo = ['LU','MA','MI','JU','VI','SA'];
    const diaCodigo = diasCodigo[dia] || 'LU';

    const idx = cargasNoLectivas.findIndex(c => c.id_carga_no_lectiva === actividadNoLectivaSeleccionada);
    if (idx === -1) return;

    const carga = cargasNoLectivas[idx];

    // Limitar por horas semanales declaradas
    const existentes = carga.horarios || [];

    // Si ya está asignado, quitar (deseleccionar)
    const yaAsignadoIdx = existentes.findIndex((h: any) => h.dia === diaCodigo && h.horaInicio === hora);
    if (yaAsignadoIdx !== -1) {
      const newCargas = [...cargasNoLectivas];
      const nuevosHorarios = [...(newCargas[idx].horarios || [])];
      nuevosHorarios.splice(yaAsignadoIdx, 1);
      newCargas[idx] = { ...newCargas[idx], horarios: nuevosHorarios };
      setCargasNoLectivas(newCargas);

      // Persist change immediately for removals to reflect deletion on server
      await autosaveCargas(newCargas);
      return;
    }

    // Calcular minutos asignados actuales
    const minutosAsignados = (existentes || []).reduce((s: number, h: any) => {
      try {
        const start = parse(h.horaInicio, 'HH:mm', new Date());
        const end = parse(h.horaFin, 'HH:mm', new Date());
        return s + Math.max(0, (end.getTime() - start.getTime()) / 60000);
      } catch (e) {
        return s;
      }
    }, 0);

    const bloqueMinutos = 60; // actualmente se añade 60 min por bloque
    if (carga.horas_semanales && (minutosAsignados + bloqueMinutos) > (carga.horas_semanales * 60)) {
      toast.error('No puede asignar más bloques: excede las horas semanales declaradas para esta actividad');
      return;
    }

    // Evitar conflicto con otras actividades
    const conflicto = cargasNoLectivas.some(c => c.id_carga_no_lectiva !== carga.id_carga_no_lectiva && (c.horarios || []).some((h: any) => h.dia === diaCodigo && h.horaInicio === hora));
    if (conflicto) {
      toast.error('El bloque está ocupado por otra actividad no lectiva');
      return;
    }

    // Evitar conflicto con horarios lectivos confirmados
    const lectivoConflicto = horariosLectivos.some((hl: any) => hl.dia_semana === dia && hl.hora_inicio === hora);
    if (lectivoConflicto) {
      toast.error('El bloque está ocupado por horario lectivo confirmado');
      return;
    }

    // Calcular hora fin asumiendo 60 minutos
    const inicio = parse(hora, 'HH:mm', new Date());
    const fin = format(addMinutes(inicio, 60), 'HH:mm');

    const newCargas = [...cargasNoLectivas];
    newCargas[idx] = {
      ...newCargas[idx],
      horarios: [...(newCargas[idx].horarios || []), { dia: diaCodigo, horaInicio: hora, horaFin: fin }]
    };

    setCargasNoLectivas(newCargas);

    // Persist change (debounced)
    scheduleAutosave(newCargas);
  };

  if (loading) return <div className="p-8">Cargando...</div>;

  // Si no hay horarios lectivos confirmados y la declaración no existe o no está en estado LECTIVA_CONFIRMADA, redirigir
  if (!horariosLectivosLoading && horariosLectivos.length === 0 && declaracion?.estado !== 'LECTIVA_CONFIRMADA') {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <Calendar className="h-16 w-16 text-blue-500 mx-auto" />
          <h2 className="text-2xl font-bold text-foreground">Horarios Lectivos Pendientes</h2>
          <p className="text-muted-foreground">
            Primero debe seleccionar sus horarios lectivos en la ventana de autogestión.
          </p>
          <Button onClick={() => router.push('/dashboard/horarios/seleccion')} className="mt-4">
            Ir a Selección de Horarios
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4 bg-background min-h-screen">
      {/* Header */}
      <Card className="shadow-sm border-border overflow-hidden">
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center border border-blue-100 dark:border-blue-900/50">
                <LayoutGrid className="text-blue-600 dark:text-blue-400 w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">Declaración de Carga Horaria</h1>
                <p className="text-muted-foreground text-xs mt-1">Complete su carga no lectiva y envíe a aprobación</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {puedeEditarNoLectiva && (
                <Button 
                  onClick={handleCreateOrSave} 
                  variant="outline" 
                  size="sm"
                  disabled={isSaving}
                  className="h-9 px-4 text-xs font-bold uppercase border-border hover:bg-muted flex items-center gap-2"
                >
                  <Save size={14} /> {isSaving ? 'Guardando...' : 'Guardar Borrador'}
                </Button>
              )}
              {puedeEnviar && (
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
                      declaracion.estado === 'LECTIVA_CONFIRMADA' ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50" :
                      "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50"
                    )}
                  >
                    {mostrarHorarioConfirmado ? 'HORARIOS CONFIRMADOS' : declaracion.estado}
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
                      disabled={!puedeEditarNoLectiva}
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-muted-foreground uppercase">Condición</Label>
                  {declaracion && (declaracion.estado === 'APROBADO' || declaracion.estado === 'RECHAZADO') ? (
                    <div className="h-10 flex items-center px-3 border border-border rounded-md bg-muted text-sm text-foreground">{mapCondicionToTexto(initialDocente.condicion)}</div>
                  ) : (
                    <Select value={formData.condicion} onValueChange={v => setFormData({ ...formData, condicion: v })} disabled={!puedeEditarNoLectiva}>
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
                    <Select value={formData.categoria} onValueChange={v => setFormData({ ...formData, categoria: v })} disabled={!puedeEditarNoLectiva}>
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
                      disabled={!puedeEditarNoLectiva}
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

      {/* Horarios Lectivos Confirmados (Solo Lectura) */}
      <Card className="p-4 shadow-sm border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Calendar size={16} className="text-emerald-500 dark:text-emerald-400" />
            Horarios Lectivos Confirmados
          </h3>
          <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50">
            {horariosLectivos.length} bloques
          </Badge>
        </div>
        <CardContent className="p-4">
          {horariosLectivos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No hay horarios lectivos confirmados aún.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Curso</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Ambiente</TableHead>
                    <TableHead>Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horariosLectivos.map((h: any, idx: number) => (
                    <TableRow key={h.id_asignacion ?? `horario-${idx}`}>
                      <TableCell className="font-medium">{h.curso_nombre}</TableCell>
                      <TableCell>{['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][h.dia_semana]}</TableCell>
                      <TableCell>{h.hora_inicio} - {h.hora_fin}</TableCell>
                      <TableCell>{h.ambiente_nombre || h.ambiente_codigo || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {h.tipo_clase}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Carga No Lectiva Asignada (Editable) */}
      <Card className="p-4 shadow-sm border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-muted/30 flex justify-between items-center">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-500 dark:text-indigo-400" />
            Carga No Lectiva Asignada
          </h3>
          <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50">
            Total: {totalNoLectivas}h
          </Badge>
        </div>
        <CardContent className="p-0">
          <div className="p-4">
            {/* Shared matrix for no-lectiva */}
            {actividadNoLectivaSeleccionada && (
              <div className="mb-4">
                <div className="border rounded-lg p-2 bg-muted/10">
                  <MatrizDisponibilidad
                    id_periodo={periodoActivo?.id_periodo || 0}
                    id_docente_actual={initialDocente?.id_docente}
                    soloLectura={!puedeEditarNoLectiva}
                    tipoVista="no-lectiva"
                    actividadSeleccionadaId={actividadNoLectivaSeleccionada as any}
                    actividadesNoLectivas={cargasNoLectivas}
                    onCellClick={handleNoLectivaCellClick}
                    onSelectionChange={() => fetchDeclaracion(periodoActivo!.id_periodo, initialDocente.id_docente)}
                    />
                </div>
              </div>
            )}

          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
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
                  <TableRow key={carga.id_carga_no_lectiva ?? `no-lectiva-${index}`} className={cn("border-border", color.bg)}>
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
                          disabled={!puedeEditarNoLectiva}
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
                              value={carga.cargoId != null ? String(carga.cargoId) : ''}
                              disabled={!puedeEditarNoLectiva}
                              onValueChange={val => {
                                const newCargas = [...cargasNoLectivas];
                                const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                                if (val === 'none') {
                                  newCargas[idx].cargoId = null;
                                  newCargas[idx].horas_semanales = 0;
                                } else {
                                  const cargo = cargosAcademicos.find(c => String(c.id) === val);
                                  if (cargo) {
                                    newCargas[idx].cargoId = cargo.id;
                                    newCargas[idx].horas_semanales = cargo.chnla;
                                  }
                                }
                                setCargasNoLectivas(newCargas);
                              }}
                            >
                              <SelectTrigger className="bg-background/80 border-border h-8 text-xs focus:bg-background transition-all shadow-none">
                                <SelectValue placeholder="Seleccione un cargo..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none" className="text-xs text-muted-foreground">
                                  Ninguno
                                </SelectItem>
                                {cargosAcademicos.map(cargo => (
                                  <SelectItem key={cargo.id} value={String(cargo.id)} className="text-xs">
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
                          disabled={!puedeEditarNoLectiva}
                          onChange={e => {
                            const newCargas = [...cargasNoLectivas];
                            const idx = newCargas.findIndex(c => c.id_carga_no_lectiva === carga.id_carga_no_lectiva);
                            newCargas[idx].ambiente = e.target.value;
                            setCargasNoLectivas(newCargas);
                          }}
                        />
                      </div>

                      {/* Horarios - Selector para abrir la matriz compartida */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                            Horario Semanal (usar la matriz compartida)
                          </Label>
                          <Badge variant="outline" className="text-[10px]">
                            {carga.horarios?.length || 0} bloques
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          {puedeEditarNoLectiva ? (
                            <>
                              <Button
                                size="sm"
                                variant={actividadNoLectivaSeleccionada === carga.id_carga_no_lectiva ? 'destructive' : 'outline'}
                                onClick={() => setActividadNoLectivaSeleccionada(actividadNoLectivaSeleccionada === carga.id_carga_no_lectiva ? null : carga.id_carga_no_lectiva)}
                              >
                                {actividadNoLectivaSeleccionada === carga.id_carga_no_lectiva ? 'Cerrar matriz' : 'Seleccionar actividad'}
                              </Button>
                              <div className="text-xs text-muted-foreground">Seleccione la actividad y luego haga clic en los bloques libres de la matriz compartida.</div>
                            </>
                          ) : (
                            <div className="text-sm text-muted-foreground">
                              {carga.horarios?.length > 0 ? (
                                <div className="space-y-1">
                                  {carga.horarios.map((h: any, hIdx: number) => (
                                    <div key={`${carga.id_carga_no_lectiva ?? carga.tipo}-${h.dia}-${h.horaInicio}-${h.horaFin}-${hIdx}`} className="text-xs">
                                      {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][['LU','MA','MI','JU','VI','SA'].indexOf(h.dia)]}: {h.horaInicio} - {h.horaFin}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span>No hay horarios asignados</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 w-32 text-right align-top pt-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Mostrar horas actualmente asignadas (lectiva/no-lectiva) y no permitir edición manual */}
                        <Input
                          type="number"
                          className={cn("bg-background border-border h-8 w-16 text-center font-black text-sm shadow-none", color.text)}
                          value={(() => {
                            const minutos = (carga.horarios || []).reduce((s: number, h: any) => {
                              try {
                                const start = parse(h.horaInicio, 'HH:mm', new Date());
                                const end = parse(h.horaFin, 'HH:mm', new Date());
                                return s + Math.max(0, (end.getTime() - start.getTime()) / 60000);
                              } catch (e) {
                                return s;
                              }
                            }, 0);

                            return Math.round(minutos / 60);
                          })()}
                          disabled={true}
                        />
                        <span className={cn("text-xs font-bold", color.text)}>h</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow key="total-carga-no-lectiva" className="bg-indigo-50/80 dark:bg-indigo-950/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 font-bold border-t border-indigo-200 dark:border-indigo-900/50">
                <TableCell colSpan={2} className="px-4 py-3 text-[11px] font-bold uppercase text-indigo-700 dark:text-indigo-400 tracking-wider">Total Carga No Lectiva</TableCell>
                <TableCell className="px-4 py-3 text-right text-sm font-black text-indigo-800 dark:text-indigo-400">{totalNoLectivas}h</TableCell>
              </TableRow>
            </TableBody>
            </Table>
          </div>
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