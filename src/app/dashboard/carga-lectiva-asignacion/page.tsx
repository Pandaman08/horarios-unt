"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Search, 
  Calendar, 
  User, 
  ArrowUpDown, 
  Edit3, 
  BookOpen,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { usePeriodo } from "@/contexts/PeriodoContext";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DocenteDisp {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  dni: string;
  categoria: string;
  modalidad: string;
  antiguedad: number | null;
  tiene_disponibilidad: boolean;
}

interface Curso {
  id_curso: number;
  nombre: string;
  codigo: string;
  maximo_docentes: number;
  creditos: number;
  horas_teoria: number;
  horas_practica: number;
  horas_laboratorio: number;
  ciclo_rel?: { id_ciclo: number; numero: number; nombre: string };
  malla_rel?: { id_malla: number; nombre: string; anio: number };
}

interface Grupo {
  id_grupo: number;
  id_curso: number;
  codigo_grupo: string;
}

interface MallaCurricular {
  id_malla: number;
  nombre: string;
  anio: number;
}

interface CargaLectivaAsignada {
  id?: number;
  id_curso: number;
  id_grupo?: number | null;
  tipo_clase: "teoria" | "practica" | "laboratorio";
  horas_semanales: number;
  grupos_asignados?: number | null;
}

// Componente SelectTrigger con efecto de texto desplazable
const MarqueeSelectTrigger = ({ 
  className, 
  children, 
  ...props 
}: React.ComponentProps<typeof SelectTrigger>) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const span = containerRef.current.querySelector('span');
        if (span) {
          setIsOverflowing(span.scrollWidth > containerRef.current.clientWidth);
        }
      }
    };
    
    checkOverflow();
    const timer = setTimeout(checkOverflow, 100);
    
    return () => clearTimeout(timer);
  }, [children]);

  return (
    <SelectTrigger 
      className={className} 
      {...props}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <span 
          className={cn(
            "whitespace-nowrap inline-block",
            isOverflowing && "animate-marquee",
            isOverflowing && !isHovered && "animate-active"
          )}
        >
          {children}
          {isOverflowing && (
            <>
              <span className="mx-4"></span>
              {children}
            </>
          )}
        </span>
      </div>
    </SelectTrigger>
  );
};

export default function AsignacionCargaLectivaPage() {
  const { periodoSeleccionado, periodos } = usePeriodo();
  const [docentes, setDocentes] = useState<DocenteDisp[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [modalidad, setModalidad] = useState("todos");
  const [orden, setOrden] = useState("antiguedad_desc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(docentes.length / itemsPerPage);
  const currentItems = docentes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Modal de Carga Lectiva
  const [editingDocente, setEditingDocente] = useState<DocenteDisp | null>(null);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [mallas, setMallas] = useState<MallaCurricular[]>([]);
  const [selectedMalla, setSelectedMalla] = useState<string>("all");
  const [mallaFilaInicial, setMallaFilaInicial] = useState<string>("all");
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [allCargasLectivas, setAllCargasLectivas] = useState<CargaLectivaAsignada[]>([]); // Todas las cargas
  const [cargasLectivas, setCargasLectivas] = useState<CargaLectivaAsignada[]>([]); // Cargas filtradas por malla
  const [loadingModal, setLoadingModal] = useState(false);
  const [filtrarPorSemestre, setFiltrarPorSemestre] = useState(true);

  // Sincronizar con periodo global
  useEffect(() => {
    if (periodoSeleccionado) {
      setSelectedPeriodo(periodoSeleccionado.id_periodo.toString());
    }
  }, [periodoSeleccionado]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoria, modalidad, orden]);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchDocentes();
      fetchCursos();
      fetchMallas();
      fetchGrupos();
    }
  }, [selectedPeriodo, searchTerm, categoria, modalidad, orden]);

  const fetchDocentes = async () => {
    if (!selectedPeriodo) return;
    setLoading(true);
    try {
      const url = `/api/docentes/disponibilidad/listar?periodoId=${selectedPeriodo}&search=${searchTerm}&categoria=${categoria}&modalidad=${modalidad}&orden=${orden}`;
      const res = await fetch(url);
      const data = await res.json();
      setDocentes(data);
    } catch (error) {
      toast.error("Error al cargar docentes");
    } finally {
      setLoading(false);
    }
  };

  const fetchCursos = async () => {
    try {
      const res = await fetch("/api/cursos");
      const data = await res.json();
      setCursos(data);
    } catch (error) {
      toast.error("Error al cargar cursos");
    }
  };

  const fetchMallas = async () => {
    try {
      const res = await fetch("/api/mallas-curriculares");
      const data = await res.json();
      setMallas(data);
    } catch (error) {
      toast.error("Error al cargar mallas curriculares");
    }
  };

  const fetchGrupos = async () => {
    if (!selectedPeriodo) return;
    try {
      const res = await fetch(`/api/grupos?idPeriodo=${selectedPeriodo}`);
      const data = await res.json();
      setGrupos(data);
    } catch (error) {
      toast.error("Error al cargar grupos");
    }
  };

  // Cuando se abre el modal, inicializar con fila vacía al principio y todas las cargas
  const handleEditCarga = async (docente: DocenteDisp) => {
    setEditingDocente(docente);
    setLoadingModal(true);
    setSelectedMalla("all"); // Reiniciar la selección de malla
    setMallaFilaInicial("all"); // Reiniciar la malla de la fila inicial
    if (!selectedPeriodo) return;

    try {
      const res = await fetch(`/api/declaracion-horaria?idDocente=${docente.id_docente}&idPeriodo=${selectedPeriodo}`);
      const declaracion = await res.json();
      if (declaracion && declaracion.cargas_lectivas) {
        // Inicializar con fila vacía al principio, luego todas las cargas
        const todasLasCargas = [
          { id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 }, // Fila vacía al principio
          ...declaracion.cargas_lectivas.map((cl: any) => ({
            id: cl.id_carga_lectiva,
            id_curso: cl.id_curso,
            id_grupo: cl.id_grupo,
            tipo_clase: cl.tipo_clase,
            horas_semanales: cl.horas_semanales,
            grupos_asignados: cl.grupos_asignados
          }))
        ];
        setAllCargasLectivas(todasLasCargas);
        setCargasLectivas(todasLasCargas); // Inicialmente mostramos todas
      } else {
        const inicial = [{ id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 }];
        setAllCargasLectivas(inicial as CargaLectivaAsignada[]);
        setCargasLectivas(inicial as CargaLectivaAsignada[]);
      }
    } catch (error) {
      const inicial = [{ id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 }];
      setAllCargasLectivas(inicial as CargaLectivaAsignada[]);
      setCargasLectivas(inicial as CargaLectivaAsignada[]);
    } finally {
      setLoadingModal(false);
    }
  };

  // Filtrar cargas por malla cuando cambie la selección (mantener fila vacía al principio con su estado actual)
  useEffect(() => {
    if (editingDocente) {
      // Obtener todas las filas excepto la primera (vacía)
      const filasNormales = allCargasLectivas.filter((_, index) => index !== 0);
      
      // Filtrar las filas normales por la malla seleccionada
      const filtradas = filasNormales.filter(carga => {
        const curso = cursos.find(c => c.id_curso === carga.id_curso);
        if (selectedMalla === "all") return true;
        return curso?.malla_rel?.id_malla?.toString() === selectedMalla;
      });

      // Añadir la fila vacía ACTUAL (preservando su estado) al principio
      setCargasLectivas((prevCargas) => [
        prevCargas[0] || { id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 },
        ...filtradas
      ]);
    }
  }, [selectedMalla, allCargasLectivas, cursos, editingDocente]);

  // Actualizar las horas cuando se selecciona curso o tipo de clase
  const actualizarHoras = (index: number) => {
    const carga = cargasLectivas[index];
    if (!carga.id_curso) return;
    
    const curso = cursos.find(c => c.id_curso === carga.id_curso);
    if (curso) {
      let horas = 0;
      if (carga.tipo_clase === "teoria") horas = curso.horas_teoria || 0;
      if (carga.tipo_clase === "practica") horas = curso.horas_practica || 0;
      if (carga.tipo_clase === "laboratorio") horas = curso.horas_laboratorio || 0;
      
      // Actualizar la carga
      const updatedCargas = [...cargasLectivas];
      updatedCargas[index].horas_semanales = horas;
      
      // Si es la fila vacía (primera), también actualizamos allCargasLectivas
      if (index === 0) {
        const updatedAllCargas = [...allCargasLectivas];
        updatedAllCargas[0] = { ...updatedCargas[0] };
        setAllCargasLectivas(updatedAllCargas);
      } else {
        // Si es una fila normal, actualizamos allCargasLectivas
        const updatedAllCargas = [...allCargasLectivas];
        const idxEnAll = updatedAllCargas.findIndex(c => c.id === carga.id);
        if (idxEnAll !== -1) {
          updatedAllCargas[idxEnAll] = { ...updatedCargas[index] };
          setAllCargasLectivas(updatedAllCargas);
        }
      }
      
      setCargasLectivas(updatedCargas);
    }
  };

  const addCargaLectiva = (index: number) => {
    const cargaAAgregar = cargasLectivas[index];
    const cursoSeleccionado = cursos.find(c => c.id_curso === cargaAAgregar.id_curso);
    
    // Verificar que tenga un curso seleccionado
    if (!cargaAAgregar.id_curso) {
      toast.warning("Debes seleccionar un curso primero");
      return;
    }
    
    // Verificar que tenga un tipo de clase seleccionado válido
    if (!cargaAAgregar.tipo_clase) {
      toast.warning("Debes seleccionar un tipo de clase");
      return;
    }
    
    // Verificar que las horas semanales sean válidas
    if (cargaAAgregar.horas_semanales < 0) {
      toast.warning("Las horas semanales no pueden ser negativas");
      return;
    }
    
    if (cursoSeleccionado) {
      // Verificar que las horas no excedan las máximas del tipo de clase
      let maxHoras = 0;
      if (cargaAAgregar.tipo_clase === "teoria") maxHoras = cursoSeleccionado.horas_teoria;
      if (cargaAAgregar.tipo_clase === "practica") maxHoras = cursoSeleccionado.horas_practica;
      if (cargaAAgregar.tipo_clase === "laboratorio") maxHoras = cursoSeleccionado.horas_laboratorio;
      
      if (cargaAAgregar.horas_semanales > maxHoras) {
        toast.warning(`Las horas semanales no pueden exceder ${maxHoras} horas para este tipo de clase`);
        return;
      }
      
      // Verificar que el tipo de clase es válido para el curso
      let tipoValido = false;
      if (cargaAAgregar.tipo_clase === "teoria" && cursoSeleccionado.horas_teoria > 0) tipoValido = true;
      if (cargaAAgregar.tipo_clase === "practica" && cursoSeleccionado.horas_practica > 0) tipoValido = true;
      if (cargaAAgregar.tipo_clase === "laboratorio" && cursoSeleccionado.horas_laboratorio > 0) tipoValido = true;
      
      if (!tipoValido) {
        toast.warning("El tipo de clase seleccionado no está disponible para este curso");
        return;
      }
    }
    
    // Verificar que las horas sean válidas antes de agregar (para cursos con más de un docente)
    let horasValidas = cargaAAgregar.horas_semanales;
    if (cursoSeleccionado && cursoSeleccionado.maximo_docentes >= 2 && horasValidas === 0) {
      let minHours = 0;
      if (cargaAAgregar.tipo_clase === "teoria") minHours = cursoSeleccionado.horas_teoria > 0 ? 1 : 0;
      if (cargaAAgregar.tipo_clase === "practica") minHours = cursoSeleccionado.horas_practica > 0 ? 1 : 0;
      if (cargaAAgregar.tipo_clase === "laboratorio") minHours = cursoSeleccionado.horas_laboratorio > 0 ? 1 : 0;
      horasValidas = minHours;
    }
    
    const cargaFinal = { ...cargaAAgregar, horas_semanales: horasValidas };
    
    // Agregar la fila a las cargas normales y crear nueva fila vacía al principio
    const updatedAllCargas = [
      { id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 }, // Nueva fila vacía
      { ...cargaFinal, id: Date.now() }, // La fila que se está agregando
      ...allCargasLectivas.filter((_, idx) => idx !== 0) // Las filas normales existentes
    ];
    const typedCargaFinal = {
      ...cargaFinal,
      id: Date.now(),
      tipo_clase: cargaFinal.tipo_clase as "teoria" | "practica" | "laboratorio"
    };
    const typedEmptyRow: CargaLectivaAsignada = { 
      id_curso: 0, 
      tipo_clase: "teoria", 
      horas_semanales: 0, 
      grupos_asignados: 0 
    };
    const typedAllCargas = allCargasLectivas.filter((_, idx) => idx !== 0);
    const finalUpdatedAllCargas: CargaLectivaAsignada[] = [
      typedEmptyRow,
      typedCargaFinal,
      ...typedAllCargas
    ];
    setAllCargasLectivas(finalUpdatedAllCargas);
    
    // También actualizar cargasLectivas para reflejar la nueva fila vacía
    setCargasLectivas((prev) => {
      const filasNormales = prev.filter((_, idx) => idx !== 0);
      return [
        { id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 }, // Nueva fila vacía
        { ...cargaFinal, id: Date.now() }, // La fila que se está agregando
        ...filasNormales
      ];
    });
    
    // Resetear la malla de la fila inicial
    setMallaFilaInicial("all");
    
    toast.success("Curso agregado correctamente");
  };

  const removeCargaLectiva = (index: number) => {
    // Obtener la carga que queremos eliminar
    const cargaAEliminar = cargasLectivas[index];
    
    // Eliminar de allCargasLectivas
    const updatedAllCargas = allCargasLectivas.filter(c => c.id !== cargaAEliminar.id);
    
    // Asegurar que siempre haya una fila vacía al principio
    if (updatedAllCargas[0]?.id_curso) {
      updatedAllCargas.unshift({ id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 });
    }
    
    setAllCargasLectivas(updatedAllCargas);
  };

  const totalHoras = cargasLectivas
    .filter((_, index) => index !== 0)
    .reduce((sum, carga) => {
      const grupos = carga.grupos_asignados || 0;
      const horas = carga.horas_semanales || 0;
      return sum + (grupos * horas);
    }, 0);
  
  const handleSave = async () => {
    if (!editingDocente || !selectedPeriodo) return;
    setLoadingModal(true);
    try {
      let declaracionId: number | null = null;
      const declaracionRes = await fetch(`/api/declaracion-horaria?idDocente=${editingDocente.id_docente}&idPeriodo=${selectedPeriodo}`);
      const declaracion = await declaracionRes.json();

      if (declaracion && declaracion.id_declaracion) {
        declaracionId = declaracion.id_declaracion;
        // Borrar cargas anteriores para este periodo
        for (const carga of declaracion.cargas_lectivas) {
          await fetch(`/api/carga-lectiva?id=${carga.id_carga_lectiva}`, { method: 'DELETE' });
        }
      } else {
        // Crear nueva declaración
        const createRes = await fetch("/api/declaracion-horaria", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id_docente: editingDocente.id_docente,
            id_periodo: parseInt(selectedPeriodo),
            ibm: editingDocente.codigo_docente,
            condicion: "Nombrado",
            categoria: "Asociado",
            dedicacion: "Tiempo Completo 40 h",
            horas_dedicacion: 40
          })
        });
        const newDeclaracion = await createRes.json();
        declaracionId = newDeclaracion.id_declaracion;
      }

      // Guardar nuevas cargas (ignorar la primera fila vacía)
      const cargasParaGuardar = allCargasLectivas.filter((_, index) => index !== 0);
      for (const carga of cargasParaGuardar) {
        if (carga.id_curso) {
          await fetch("/api/carga-lectiva", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id_declaracion: declaracionId,
              id_curso: carga.id_curso,
              id_grupo: carga.id_grupo,
              tipo_clase: carga.tipo_clase,
              horas_semanales: carga.horas_semanales,
              grupos_asignados: carga.grupos_asignados
            })
          });
        }
      }

      toast.success("Carga lectiva asignada correctamente");
      setEditingDocente(null);
      fetchDocentes();
    } catch (error) {
      toast.error("Error al guardar la carga lectiva");
    } finally {
      setLoadingModal(false);
    }
  };
  
  const periodoActualObj = periodos.find(p => p.id_periodo.toString() === selectedPeriodo);
  const esLectura = !periodoActualObj?.activo || periodoActualObj?.estado === 'finalizado';

  // Filtrar cursos habilitados para el semestre y malla
  const cursosVisibles = cursos.filter(c => {
    // Verificar malla
    const matchesMalla = selectedMalla === "all" || 
      (c.malla_rel && c.malla_rel.id_malla.toString() === selectedMalla);
    
    // Verificar semestre
    let matchesSemestre = true;
    if (filtrarPorSemestre && periodoActualObj && c.ciclo_rel) {
      if (periodoActualObj.semestre === 1) {
        matchesSemestre = c.ciclo_rel.numero % 2 !== 0; // Semestre 1 = ciclos impares
      } else {
        matchesSemestre = c.ciclo_rel.numero % 2 === 0; // Semestre 2 = ciclos pares
      }
    }
    
    return matchesMalla && matchesSemestre;
  });
  
  // Filtrar cursos específicamente para la fila inicial
  const cursosFilaInicial = cursos.filter(c => {
    // Determinar qué malla usar
    const mallaAUsar = selectedMalla === "all" ? mallaFilaInicial : selectedMalla;
    
    // Verificar malla
    const matchesMalla = mallaAUsar === "all" || 
      (c.malla_rel && c.malla_rel.id_malla.toString() === mallaAUsar);
    
    // Verificar semestre
    let matchesSemestre = true;
    if (filtrarPorSemestre && periodoActualObj && c.ciclo_rel) {
      if (periodoActualObj.semestre === 1) {
        matchesSemestre = c.ciclo_rel.numero % 2 !== 0; // Semestre 1 = ciclos impares
      } else {
        matchesSemestre = c.ciclo_rel.numero % 2 === 0; // Semestre 2 = ciclos pares
      }
    }
    
    return matchesMalla && matchesSemestre;
  });

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-4 animate-in fade-in duration-500">
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight leading-none">Asignación de Carga Lectiva</h1>
              <p className="text-muted-foreground text-[10px] mt-1">Gestión de cursos asignados por docente</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-border/50">
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nombre o DNI..." 
              className="pl-9 h-8 rounded-lg border-border bg-muted/20 font-medium text-[11px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={categoria} onValueChange={setCategoria}>
            <MarqueeSelectTrigger className="h-8 rounded-lg border-border bg-muted/20 font-bold text-[10px]">
              <SelectValue placeholder="Categoría" />
            </MarqueeSelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos" className="text-[10px] font-bold">Todas las categorías</SelectItem>
              <SelectItem value="PRINCIPAL" className="text-[10px] font-bold">Principal</SelectItem>
              <SelectItem value="ASOCIADO" className="text-[10px] font-bold">Asociado</SelectItem>
              <SelectItem value="AUXILIAR" className="text-[10px] font-bold">Auxiliar</SelectItem>
              <SelectItem value="JEFE_PRACTICA" className="text-[10px] font-bold">Jefe de Práctica</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modalidad} onValueChange={setModalidad}>
            <MarqueeSelectTrigger className="h-8 rounded-lg border-border bg-muted/20 font-bold text-[10px]">
              <SelectValue placeholder="Modalidad" />
            </MarqueeSelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos" className="text-[10px] font-bold">Todas las modalidades</SelectItem>
              <SelectItem value="NOMBRADO" className="text-[10px] font-bold">Nombrado</SelectItem>
              <SelectItem value="CONTRATADO" className="text-[10px] font-bold">Contratado</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            onClick={() => setOrden(prev => prev === "antiguedad_desc" ? "antiguedad_asc" : "antiguedad_desc")}
            className="h-8 rounded-lg border-border bg-muted/20 font-bold text-[9px] uppercase tracking-widest gap-2"
          >
            <ArrowUpDown className="h-3 w-3" />
            Antigüedad {orden === "antiguedad_desc" ? "↓" : "↑"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Docente</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">DNI / Código</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Categoría</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Modalidad</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Cargando docentes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">No se encontraron docentes</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              currentItems.map((docente) => (
                <TableRow key={docente.id_docente} className="group hover:bg-muted/50 border-b border-border transition-all">
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-[9px]">
                        {docente.nombres.charAt(0)}{docente.apellidos.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-foreground text-[11px] leading-tight">{docente.apellidos}, {docente.nombres}</p>
                        <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{docente.codigo_docente}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">{docente.dni || 'N/A'}</span>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="outline" className="rounded-md bg-primary/5 text-primary border-primary/20 text-[8px] font-bold uppercase tracking-widest">
                      {docente.categoria}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <Badge variant="outline" className="rounded-md bg-muted text-muted-foreground border-border text-[8px] font-bold uppercase tracking-widest">
                      {docente.modalidad}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        onClick={() => handleEditCarga(docente)}
                        className={cn(
                          "h-7 px-3 rounded-lg font-bold text-[10px] shadow-sm transition-all active:scale-95 flex items-center gap-1.5",
                          esLectura 
                            ? "bg-muted text-muted-foreground hover:bg-muted/80" 
                            : "bg-primary hover:bg-primary/90 text-primary-foreground"
                        )}
                      >
                        {esLectura ? <Search className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
                        {esLectura ? "Ver Carga" : "Asignar Cursos"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="border-t border-border bg-muted/10"
        />
      </div>

      <Dialog open={!!editingDocente} onOpenChange={(open) => !open && setEditingDocente(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-[85vw] lg:max-w-[900px] max-h-[90vh] flex flex-col p-6 rounded-xl overflow-hidden">
          <DialogTitle className="flex items-center gap-2 text-xl font-black">
            <BookOpen className="h-5 w-5 text-primary" />
            Asignación de Carga Lectiva
          </DialogTitle>
          <DialogDescription>
            {editingDocente?.nombres} {editingDocente?.apellidos} - {editingDocente?.codigo_docente}
          </DialogDescription>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="filterSemestre" 
                  checked={filtrarPorSemestre} 
                  onChange={(e) => setFiltrarPorSemestre(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <Label htmlFor="filterSemestre" className="text-xs font-semibold cursor-pointer">
                  Mostrar cursos habilitados para el Semestre {periodoActualObj?.semestre === 1 ? "I" : "II"}
                </Label>
              </div>
              <Select value={selectedMalla} onValueChange={setSelectedMalla}>
                <MarqueeSelectTrigger className="w-[180px] h-8 rounded-lg border-border bg-muted/20 font-bold text-[10px]">
                  <SelectValue placeholder="Malla Curricular" />
                </MarqueeSelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[10px] font-bold">Todas las mallas</SelectItem>
                  {mallas.map((m) => (
                    <SelectItem key={m.id_malla} value={m.id_malla.toString()} className="text-[10px] font-bold">
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loadingModal ? (
              <div className="flex flex-col items-center justify-center h-40 gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</span>
              </div>
            ) : (
              cargasLectivas.map((carga, index) => {
                const esFilaVacia = index === 0;
                const curso = cursos.find(c => c.id_curso === carga.id_curso);
                
                return (
                <div key={index} className="grid grid-cols-12 gap-4 items-end p-4 bg-muted/30 rounded-lg border border-border relative">
                  {esFilaVacia && selectedMalla === "all" && (
                    <div className={`col-span-12 sm:col-span-2 lg:col-span-2 space-y-1 ${!(esFilaVacia && selectedMalla === "all") ? "hidden" : ""}`}>
                      <Label className="text-[10px] uppercase font-bold text-muted-foreground">Plan de Estudios</Label>
                      <Select
                        disabled={esLectura}
                        value={mallaFilaInicial}
                        onValueChange={(value) => {
                          setMallaFilaInicial(value);
                          // Limpiar el curso seleccionado si cambiamos de malla
                          const nuevasCargas = [...cargasLectivas];
                          nuevasCargas[0].id_curso = 0;
                          nuevasCargas[0].horas_semanales = 0;
                          setCargasLectivas(nuevasCargas);
                          const nuevasAllCargas = [...allCargasLectivas];
                          nuevasAllCargas[0] = { ...nuevasCargas[0] };
                          setAllCargasLectivas(nuevasAllCargas);
                        }}
                      >
                        <MarqueeSelectTrigger className="h-8 w-full min-w-0 rounded-lg border-border bg-muted/50 font-bold text-[10px]">
                          <SelectValue placeholder="Seleccionar plan" />
                        </MarqueeSelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="all" className="text-[10px] font-bold">Todos los planes</SelectItem>
                          {mallas.map((m) => (
                            <SelectItem key={m.id_malla} value={m.id_malla.toString()} className="text-[10px] font-bold">
                              {m.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="min-h-[18px]"></div>
                    </div>
                  )}
                  <div className={`space-y-1 ${esFilaVacia && selectedMalla === "all" ? "col-span-12 sm:col-span-4 lg:col-span-4" : "col-span-12 sm:col-span-6 lg:col-span-6"}`}>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Curso</Label>
                    {esFilaVacia ? (
                      <SearchableSelect
                        disabled={esLectura}
                        options={cursosFilaInicial.map((curso) => ({
                          value: curso.id_curso.toString(),
                          label: `${curso.codigo} - ${curso.nombre}${curso.ciclo_rel ? ` (C${curso.ciclo_rel.numero})` : ''}`
                        }))}
                        placeholder="Buscar curso por código o nombre"
                        value={carga.id_curso?.toString() || ""}
                        onValueChange={(value) => {
                          // Primero, actualizamos cargasLectivas
                          const nuevasCargas = [...cargasLectivas];
                          nuevasCargas[0].id_curso = value ? parseInt(value) : 0;
                          nuevasCargas[0].id_grupo = null;
                          
                          // Actualizar horas y tipo de clase automáticamente
                          if (value) {
                            const cursoSeleccionado = cursosFilaInicial.find(c => c.id_curso.toString() === value);
                            if (cursoSeleccionado) {
                              // Verificar si el tipo de clase actual es válido para este curso
                              let tipoValido = false;
                              if (nuevasCargas[0].tipo_clase === "teoria" && cursoSeleccionado.horas_teoria > 0) tipoValido = true;
                              if (nuevasCargas[0].tipo_clase === "practica" && cursoSeleccionado.horas_practica > 0) tipoValido = true;
                              if (nuevasCargas[0].tipo_clase === "laboratorio" && cursoSeleccionado.horas_laboratorio > 0) tipoValido = true;
                              
                              // Si no es válido, buscar el primer tipo disponible
                              if (!tipoValido) {
                                if (cursoSeleccionado.horas_teoria > 0) nuevasCargas[0].tipo_clase = "teoria";
                                else if (cursoSeleccionado.horas_practica > 0) nuevasCargas[0].tipo_clase = "practica";
                                else if (cursoSeleccionado.horas_laboratorio > 0) nuevasCargas[0].tipo_clase = "laboratorio";
                              }
                              
                              let horas = 0;
                              if (nuevasCargas[0].tipo_clase === "teoria") horas = cursoSeleccionado.horas_teoria || 0;
                              if (nuevasCargas[0].tipo_clase === "practica") horas = cursoSeleccionado.horas_practica || 0;
                              if (nuevasCargas[0].tipo_clase === "laboratorio") horas = cursoSeleccionado.horas_laboratorio || 0;
                              nuevasCargas[0].horas_semanales = horas;
                            }
                          }
                          
                          setCargasLectivas(nuevasCargas);
                          
                          // Ahora actualizamos allCargasLectivas
                          const nuevasAllCargas = [...allCargasLectivas];
                          nuevasAllCargas[0] = { ...nuevasCargas[0] };
                          setAllCargasLectivas(nuevasAllCargas);
                        }}
                        className="h-8"
                      />
                    ) : (
                      <SearchableSelect
                        disabled={esLectura}
                        options={cursosVisibles.map((curso) => ({
                          value: curso.id_curso.toString(),
                          label: `${curso.codigo} - ${curso.nombre}${curso.ciclo_rel ? ` (C${curso.ciclo_rel.numero})` : ''}`
                        }))}
                        placeholder="Seleccionar curso"
                        value={carga.id_curso?.toString() || ""}
                        onValueChange={(value) => {
                          const updated = [...cargasLectivas];
                          updated[index].id_curso = value ? parseInt(value) : 0;
                          updated[index].id_grupo = null; // Resetear grupo al cambiar de curso
                          
                          // Actualizar horas y tipo de clase automáticamente
                          if (value) {
                            const cursoSeleccionado = cursosVisibles.find(c => c.id_curso.toString() === value);
                            if (cursoSeleccionado) {
                              // Verificar si el tipo de clase actual es válido para este curso
                              let tipoValido = false;
                              if (updated[index].tipo_clase === "teoria" && cursoSeleccionado.horas_teoria > 0) tipoValido = true;
                              if (updated[index].tipo_clase === "practica" && cursoSeleccionado.horas_practica > 0) tipoValido = true;
                              if (updated[index].tipo_clase === "laboratorio" && cursoSeleccionado.horas_laboratorio > 0) tipoValido = true;
                              
                              // Si no es válido, buscar el primer tipo disponible
                              if (!tipoValido) {
                                if (cursoSeleccionado.horas_teoria > 0) updated[index].tipo_clase = "teoria";
                                else if (cursoSeleccionado.horas_practica > 0) updated[index].tipo_clase = "practica";
                                else if (cursoSeleccionado.horas_laboratorio > 0) updated[index].tipo_clase = "laboratorio";
                              }
                              
                              let horas = 0;
                              if (updated[index].tipo_clase === "teoria") horas = cursoSeleccionado.horas_teoria || 0;
                              if (updated[index].tipo_clase === "practica") horas = cursoSeleccionado.horas_practica || 0;
                              if (updated[index].tipo_clase === "laboratorio") horas = cursoSeleccionado.horas_laboratorio || 0;
                              updated[index].horas_semanales = horas;
                            }
                          }
                          
                          setCargasLectivas(updated);
                          
                          // Ahora actualizamos allCargasLectivas
                          const updatedAllCargas = [...allCargasLectivas];
                          const idxEnAll = updatedAllCargas.findIndex(c => c.id === carga.id);
                          if (idxEnAll !== -1) {
                            updatedAllCargas[idxEnAll] = { ...updated[index] };
                            setAllCargasLectivas(updatedAllCargas);
                          }
                        }}
                        className="h-8"
                      />
                    )}
                    <div className="min-h-[18px]">
                      {curso && (
                        <div className="text-[9px] text-amber-700 font-medium">
                          Máx. {curso.maximo_docentes || 1} docente{curso.maximo_docentes > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className={`col-span-6 sm:col-span-2 lg:col-span-2 space-y-1 ${esFilaVacia && selectedMalla === "all" ? "" : ""}`}>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</Label>
                    <Select
                      disabled={esLectura || !carga.id_curso}
                      value={carga.tipo_clase}
                      onValueChange={(value: any) => {
                        const updated = [...cargasLectivas];
                        updated[index].tipo_clase = value;
                        setCargasLectivas(updated);
                        
                        // Actualizar también allCargasLectivas
                        const updatedAllCargas = [...allCargasLectivas];
                        if (esFilaVacia) {
                          updatedAllCargas[0] = { ...updated[0] };
                        } else {
                          const idxEnAll = updatedAllCargas.findIndex(c => c.id === carga.id);
                          if (idxEnAll !== -1) {
                            updatedAllCargas[idxEnAll] = { ...updated[index] };
                          }
                        }
                        setAllCargasLectivas(updatedAllCargas);
                        
                        // Actualizar horas automáticamente
                        if (carga.id_curso) {
                          const cursoObj = cursos.find(c => c.id_curso === carga.id_curso);
                          if (cursoObj) {
                            let horas = 0;
                            if (value === "teoria") horas = cursoObj.horas_teoria || 0;
                            if (value === "practica") horas = cursoObj.horas_practica || 0;
                            if (value === "laboratorio") horas = cursoObj.horas_laboratorio || 0;
                            
                            const updatedWithHours = [...updated];
                            updatedWithHours[index].horas_semanales = horas;
                            setCargasLectivas(updatedWithHours);
                            
                            const updatedAllWithHours = [...updatedAllCargas];
                            if (esFilaVacia) {
                              updatedAllWithHours[0].horas_semanales = horas;
                            } else {
                              const idxEnAllHours = updatedAllWithHours.findIndex(c => c.id === carga.id);
                              if (idxEnAllHours !== -1) {
                                updatedAllWithHours[idxEnAllHours].horas_semanales = horas;
                              }
                            }
                            setAllCargasLectivas(updatedAllWithHours);
                          }
                        }
                      }}
                    >
                      <MarqueeSelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </MarqueeSelectTrigger>
                      <SelectContent>
                        {curso && curso.horas_teoria > 0 && (
                          <SelectItem value="teoria" className="text-xs">Teoría</SelectItem>
                        )}
                        {curso && curso.horas_practica > 0 && (
                          <SelectItem value="practica" className="text-xs">Práctica</SelectItem>
                        )}
                        {curso && curso.horas_laboratorio > 0 && (
                          <SelectItem value="laboratorio" className="text-xs">Laboratorio</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="min-h-[18px]"></div>
                  </div>
                  <div className="col-span-6 sm:col-span-2 lg:col-span-2 space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Grupos</Label>
                    <Select
                      disabled={esLectura || !carga.id_curso}
                      value={carga.grupos_asignados?.toString() || "0"}
                      onValueChange={(value) => {
                        const updated = [...cargasLectivas];
                        updated[index].grupos_asignados = parseInt(value);
                        setCargasLectivas(updated);
                        
                        // Actualizar also allCargasLectivas
                        const updatedAllCargas = [...allCargasLectivas];
                        if (esFilaVacia) {
                          updatedAllCargas[0] = { ...updated[0] };
                        } else {
                          const idxEnAll = updatedAllCargas.findIndex(c => c.id === carga.id);
                          if (idxEnAll !== -1) {
                            updatedAllCargas[idxEnAll] = { ...updated[index] };
                          }
                        }
                        setAllCargasLectivas(updatedAllCargas);
                      }}
                    >
                      <MarqueeSelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={carga.id_curso ? "Número de grupos" : "N/A"} />
                      </MarqueeSelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()} className="text-xs font-bold">
                            {num === 0 ? "Sin grupos" : `${num} grupo${num > 1 ? "s" : ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="min-h-[18px]"></div>
                  </div>
                  <div className="col-span-6 sm:col-span-1 lg:col-span-1 space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Horas</Label>
                    <Input
                      disabled={esLectura || (curso && curso.maximo_docentes <= 1)}
                      type="number"
                      className="h-8 text-xs text-center font-bold"
                      value={carga.horas_semanales}
                      onChange={(e) => {
                        let newHours = parseInt(e.target.value) || 0;
                        
                        // Validar horas no sean menores a 0 ni mayores al curso
                        if (newHours < 0) newHours = 0;
                        if (curso) {
                          // Si curso permite 2+ docentes, horas no pueden ser 0
                          if (curso.maximo_docentes >= 2 && newHours === 0) {
                            let minHours = 0;
                            if (carga.tipo_clase === "teoria") minHours = curso.horas_teoria > 0 ? 1 : 0;
                            if (carga.tipo_clase === "practica") minHours = curso.horas_practica > 0 ? 1 : 0;
                            if (carga.tipo_clase === "laboratorio") minHours = curso.horas_laboratorio > 0 ? 1 : 0;
                            newHours = minHours;
                          }
                          
                          let maxHours = 0;
                          if (carga.tipo_clase === "teoria") maxHours = curso.horas_teoria || 0;
                          if (carga.tipo_clase === "practica") maxHours = curso.horas_practica || 0;
                          if (carga.tipo_clase === "laboratorio") maxHours = curso.horas_laboratorio || 0;
                          if (newHours > maxHours) newHours = maxHours;
                        }
                        
                        const updated = [...cargasLectivas];
                        updated[index].horas_semanales = newHours;
                        setCargasLectivas(updated);
                        
                        // Actualizar también allCargasLectivas
                        const updatedAllCargas = [...allCargasLectivas];
                        if (esFilaVacia) {
                          updatedAllCargas[0] = { ...updated[0] };
                        } else {
                          const idxEnAll = updatedAllCargas.findIndex(c => c.id === carga.id);
                          if (idxEnAll !== -1) {
                            updatedAllCargas[idxEnAll] = { ...updated[index] };
                          }
                        }
                        setAllCargasLectivas(updatedAllCargas);
                      }}
                    />
                    <div className="min-h-[18px]"></div>
                  </div>
                  {/* Este campo se reemplazó por el selector de grupos, lo ocultamos */}
                  <div className="col-span-0 hidden"></div>
                  <div className={`col-span-6 sm:col-span-1 lg:col-span-1 flex flex-col space-y-1 items-center ${esLectura ? "hidden" : ""}`}>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Acción</Label>
                    <div className="flex justify-center w-full">
                      {esFilaVacia ? (
                        <Button
                          variant="default"
                          size="icon"
                          className="h-8 w-8 bg-primary hover:bg-primary/90 transition-all duration-200 hover:scale-110 active:scale-95"
                          onClick={() => addCargaLectiva(index)}
                          disabled={!carga.id_curso}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 transition-all duration-200 hover:scale-110 active:scale-95"
                          onClick={() => removeCargaLectiva(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                    <div className="min-h-[18px]"></div>
                  </div>
                </div>
              )})
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg border border-primary/20">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Total horas:</span>
              <span className="text-lg font-black text-primary">{totalHoras}</span>
            </div>
            {!esLectura && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditingDocente(null)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={loadingModal} className="gap-2 font-bold">
                  <Save className="h-4 w-4" />
                  {loadingModal ? "Guardando..." : "Guardar Asignación"}
                </Button>
              </div>
            )}
            {esLectura && (
              <Button onClick={() => setEditingDocente(null)}>Cerrar</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
