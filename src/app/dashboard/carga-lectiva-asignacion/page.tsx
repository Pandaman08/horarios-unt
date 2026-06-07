"use client";

import { useState, useEffect } from "react";
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
  ciclo_rel?: { numero: number };
}

interface Grupo {
  id_grupo: number;
  id_curso: number;
  codigo_grupo: string;
}

interface CargaLectivaAsignada {
  id?: number;
  id_curso: number;
  id_grupo?: number | null;
  tipo_clase: "teoria" | "practica" | "laboratorio";
  horas_semanales: number;
  grupos_asignados?: number | null;
}

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
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [cargasLectivas, setCargasLectivas] = useState<CargaLectivaAsignada[]>([]);
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

  const handleEditCarga = async (docente: DocenteDisp) => {
    setEditingDocente(docente);
    setLoadingModal(true);
    if (!selectedPeriodo) return;

    try {
      const res = await fetch(`/api/declaracion-horaria?idDocente=${docente.id_docente}&idPeriodo=${selectedPeriodo}`);
      const declaracion = await res.json();
      if (declaracion && declaracion.cargas_lectivas) {
        setCargasLectivas(declaracion.cargas_lectivas.map((cl: any) => ({
          id: cl.id_carga_lectiva,
          id_curso: cl.id_curso,
          id_grupo: cl.id_grupo,
          tipo_clase: cl.tipo_clase,
          horas_semanales: cl.horas_semanales,
          grupos_asignados: cl.grupos_asignados
        })));
      } else {
        setCargasLectivas([]);
      }
    } catch (error) {
      setCargasLectivas([]);
    } finally {
      setLoadingModal(false);
    }
  };

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

      // Guardar nuevas cargas
      for (const carga of cargasLectivas) {
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

  const addCargaLectiva = () => {
    setCargasLectivas([...cargasLectivas, { id_curso: 0, tipo_clase: "teoria", horas_semanales: 0, grupos_asignados: 0 }]);
  };

  const removeCargaLectiva = (index: number) => {
    setCargasLectivas(cargasLectivas.filter((_, i) => i !== index));
  };

  const totalHoras = cargasLectivas.reduce((sum, carga) => {
    const grupos = carga.grupos_asignados || 0;
    const horas = carga.horas_semanales || 0;
    return sum + (grupos * horas);
  }, 0);
  
  const periodoActualObj = periodos.find(p => p.id_periodo.toString() === selectedPeriodo);
  const esLectura = !periodoActualObj?.activo || periodoActualObj?.estado === 'finalizado';

  // Filtrar cursos habilitados para el semestre
  const cursosVisibles = cursos.filter(c => {
    if (!filtrarPorSemestre || !periodoActualObj || !c.ciclo_rel) return true;
    const isPar = c.ciclo_rel.numero % 2 === 0;
    return periodoActualObj.semestre === 1 ? !isPar : isPar;
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
            <SelectTrigger className="h-8 rounded-lg border-border bg-muted/20 font-bold text-[10px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="todos" className="text-[10px] font-bold">Todas las categorías</SelectItem>
              <SelectItem value="PRINCIPAL" className="text-[10px] font-bold">Principal</SelectItem>
              <SelectItem value="ASOCIADO" className="text-[10px] font-bold">Asociado</SelectItem>
              <SelectItem value="AUXILIAR" className="text-[10px] font-bold">Auxiliar</SelectItem>
              <SelectItem value="JEFE_PRACTICA" className="text-[10px] font-bold">Jefe de Práctica</SelectItem>
            </SelectContent>
          </Select>
          <Select value={modalidad} onValueChange={setModalidad}>
            <SelectTrigger className="h-8 rounded-lg border-border bg-muted/20 font-bold text-[10px]">
              <SelectValue placeholder="Modalidad" />
            </SelectTrigger>
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
            {!esLectura && (
              <Button onClick={addCargaLectiva} size="sm" className="h-8 gap-2 w-full sm:w-auto">
                <Plus className="h-3.5 w-3.5" />
                Agregar Curso
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loadingModal ? (
              <div className="flex flex-col items-center justify-center h-40 gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cargando...</span>
              </div>
            ) : (
              cargasLectivas.map((carga, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-end p-4 bg-muted/30 rounded-lg border border-border relative">
                  <div className="col-span-12 sm:col-span-4 lg:col-span-4 space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Curso</Label>
                    <Select
                      disabled={esLectura}
                      value={carga.id_curso?.toString() || ""}
                      onValueChange={(value) => {
                        const updated = [...cargasLectivas];
                        updated[index].id_curso = parseInt(value);
                        updated[index].id_grupo = null; // Resetear grupo al cambiar de curso
                        setCargasLectivas(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-[11px] font-semibold truncate w-full">
                        <SelectValue placeholder="Seleccionar curso" />
                      </SelectTrigger>
                      <SelectContent className="max-w-[400px]">
                        {cursosVisibles.map((curso) => (
                          <SelectItem 
                            key={curso.id_curso} 
                            value={curso.id_curso.toString()} 
                            className="text-[11px]"
                          >
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="flex items-center gap-1 w-full cursor-help">
                                  <span className="font-bold shrink-0">{curso.codigo}</span>
                                  <span className="truncate max-w-[180px]">- {curso.nombre}</span>
                                  {curso.ciclo_rel && <span className="text-[9px] opacity-60 shrink-0">(C{curso.ciclo_rel.numero})</span>}
                                </div>
                              </PopoverTrigger>
                              <PopoverContent side="right" className="w-80 p-3 text-[11px] font-semibold bg-popover shadow-xl border-primary/20 z-[100]">
                                <div className="flex flex-col gap-1">
                                  <div className="text-primary font-black uppercase tracking-wider text-[9px]">Nombre completo del curso</div>
                                  <div className="text-foreground leading-tight">{curso.nombre}</div>
                                  <div className="mt-1 pt-1 border-t border-border flex justify-between text-[9px] text-muted-foreground uppercase">
                                    <span>Código: {curso.codigo}</span>
                                    {curso.ciclo_rel && <span>Ciclo: {curso.ciclo_rel.numero}</span>}
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6 sm:col-span-3 lg:col-span-2 space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</Label>
                    <Select
                      disabled={esLectura}
                      value={carga.tipo_clase}
                      onValueChange={(value: any) => {
                        const updated = [...cargasLectivas];
                        updated[index].tipo_clase = value;
                        setCargasLectivas(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="teoria" className="text-xs">Teoría</SelectItem>
                        <SelectItem value="practica" className="text-xs">Práctica</SelectItem>
                        <SelectItem value="laboratorio" className="text-xs">Laboratorio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6 sm:col-span-3 lg:col-span-2 space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Grupos</Label>
                    <Select
                      disabled={esLectura || !carga.id_curso}
                      value={carga.grupos_asignados?.toString() || "0"}
                      onValueChange={(value) => {
                        const updated = [...cargasLectivas];
                        updated[index].grupos_asignados = parseInt(value);
                        setCargasLectivas(updated);
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={carga.id_curso ? "Número de grupos" : "N/A"} />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4].map((num) => (
                          <SelectItem key={num} value={num.toString()} className="text-xs font-bold">
                            {num === 0 ? "Sin grupos" : `${num} grupo${num > 1 ? "s" : ""}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4 sm:col-span-2 lg:col-span-1 space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Horas</Label>
                    <Input
                      disabled={esLectura}
                      type="number"
                      className="h-8 text-xs text-center font-bold"
                      value={carga.horas_semanales}
                      onChange={(e) => {
                        const updated = [...cargasLectivas];
                        updated[index].horas_semanales = parseInt(e.target.value) || 0;
                        setCargasLectivas(updated);
                      }}
                    />
                  </div>
                  {/* Este campo se reemplazó por el selector de grupos, lo ocultamos */}
                  <div className="col-span-0 hidden"></div>
                  {!esLectura && (
                    <div className="col-span-4 sm:col-span-2 lg:col-span-1 flex justify-end">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeCargaLectiva(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
            
            {!loadingModal && cargasLectivas.length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-muted/10">
                <p className="text-xs font-semibold text-muted-foreground">No hay cursos asignados para este docente.</p>
              </div>
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
