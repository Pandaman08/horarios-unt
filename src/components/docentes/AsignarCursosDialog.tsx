"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Calendar, Search, AlertCircle } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";

interface AsignarCursosDialogProps {
  docenteId: number;
  docenteNombre: string;
  isOpen: boolean;
  onClose: () => void;
}

interface DocenteCurso {
  id_curso: number;
  tipo_clase: string;
}

interface Curso {
  id_curso: number;
  codigo: string;
  nombre: string;
  tipo_curso: string;
  id_ciclo?: number;
  ciclo_rel?: {
    id_ciclo: number;
    numero: number;
    nombre: string;
  };
}

interface Periodo {
  id_periodo: number;
  codigo: string;
  nombre: string;
  anio: number;
  semestre: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}

export function AsignarCursosDialog({
  docenteId,
  docenteNombre,
  isOpen,
  onClose,
}: AsignarCursosDialogProps) {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [ciclos, setCiclos] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [asignaciones, setAsignaciones] = useState<DocenteCurso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [cicloFiltro, setCicloFiltro] = useState<string>("todos");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [semestre, setSemestre] = useState<number>(1);
  const [periodoActivo, setPeriodoActivo] = useState<Periodo | null>(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const cursosFiltrados = cursos.filter(c => {
    const matchesSearch = !searchTerm || 
      `${c.nombre} ${c.codigo}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFiltro === "todos" || c.tipo_curso === tipoFiltro;
    const matchesCiclo = cicloFiltro === "todos" || 
      c.id_ciclo?.toString() === cicloFiltro;
    
    // Filtrar por semestre según ciclo
    const ciclo = c.ciclo_rel || ciclos.find(cy => cy.id_ciclo === c.id_ciclo);
    if (ciclo && ciclo.numero) {
      const isPar = ciclo.numero % 2 === 0;
      const matchesSemestre = (semestre === 1 && !isPar) || (semestre === 2 && isPar);
      return matchesSearch && matchesTipo && matchesCiclo && matchesSemestre;
    }

    return matchesSearch && matchesTipo && matchesCiclo;
  });

  const totalPages = Math.ceil(cursosFiltrados.length / itemsPerPage);
  const currentItems = cursosFiltrados.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [tipoFiltro, cicloFiltro, searchTerm, semestre, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, docenteId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cursosRes, asignacionesRes, ciclosRes, periodosRes] = await Promise.all([
        fetch("/api/cursos"),
        fetch(`/api/docentes/${docenteId}/cursos`),
        fetch("/api/ciclos"),
        fetch("/api/periodos"),
      ]);

      const processRes = async (res: Response, name: string) => {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const errorData = contentType?.includes("application/json") ? await res.json() : {};
          throw new Error(errorData.error || `Error al cargar ${name}`);
        }
        return res.json();
      };

      const [cursosData, asignacionesData, ciclosData, periodosData] = await Promise.all([
        processRes(cursosRes, "cursos"),
        processRes(asignacionesRes, "asignaciones"),
        processRes(ciclosRes, "ciclos"),
        processRes(periodosRes, "periodos"),
      ]);

      setCursos(Array.isArray(cursosData) ? cursosData : []);
      setCiclos(Array.isArray(ciclosData) ? ciclosData : []);
      setPeriodos(Array.isArray(periodosData) ? periodosData : []);
      
      // Encontrar el periodo activo (en_curso o asignacion_horarios)
      const activo = periodosData.find((p: Periodo) => 
        p.estado === "en_curso" || p.estado === "asignacion_horarios"
      );
      setPeriodoActivo(activo || null);
      
      // Establecer el semestre según el periodo activo
      if (activo) {
        setSemestre(activo.semestre);
      }

      setAsignaciones(Array.isArray(asignacionesData) ? asignacionesData.map((a: any) => ({
        id_curso: a.id_curso,
        tipo_clase: a.tipo_clase.toLowerCase(),
      })) : []);
    } catch (error: any) {
      console.error("Error en fetchData:", error);
      toast.error(error.message || "Error al cargar datos de asignación");
    } finally {
      setLoading(false);
    }
  };

  const toggleAsignacion = (id_curso: number, tipo_clase: string) => {
    setAsignaciones((prev) => {
      const exists = prev.find(
        (a) => a.id_curso === id_curso && a.tipo_clase.toLowerCase() === tipo_clase.toLowerCase()
      );
      if (exists) {
        return prev.filter(
          (a) => !(a.id_curso === id_curso && a.tipo_clase.toLowerCase() === tipo_clase.toLowerCase())
        );
      } else {
        return [...prev, { id_curso, tipo_clase: tipo_clase.toLowerCase() }];
      }
    });
  };

  const isChecked = (id_curso: number, tipo_clase: string) => {
    return !!asignaciones.find(
      (a) => a.id_curso === id_curso && a.tipo_clase.toLowerCase() === tipo_clase.toLowerCase()
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/docentes/${docenteId}/cursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(asignaciones),
      });

      if (res.ok) {
        toast.success("Cursos asignados correctamente");
        onClose();
      } else {
        toast.error("Error al guardar asignaciones");
      }
    } catch (error) {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] md:max-w-2xl lg:max-w-3xl rounded-xl p-0 border-none shadow-2xl overflow-hidden bg-card text-foreground">
        <DialogHeader className="bg-primary p-4 text-primary-foreground">
          <DialogTitle className="text-sm font-bold text-white">Asignar Cursos a {docenteNombre}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {periodoActivo ? (
              <div className="border border-emerald-200 rounded-md bg-emerald-50 p-2.5 flex items-center gap-2">
                <div className="h-6 w-6 bg-emerald-500/10 rounded-md flex items-center justify-center border border-emerald-500/20">
                  <Calendar className="h-3 w-3 text-emerald-600" />
                </div>
                <div>
                  <div className="text-emerald-800 font-bold text-[10px]">Periodo Activo</div>
                  <div className="text-emerald-700 text-[10px]">{periodoActivo.nombre} - Semestre {periodoActivo.semestre}</div>
                </div>
              </div>
            ) : (
              <div className="border border-amber-200 rounded-md bg-amber-50 p-2.5 flex items-center gap-2">
                <div className="h-6 w-6 bg-amber-500/10 rounded-md flex items-center justify-center border border-amber-500/20">
                  <AlertCircle className="h-3 w-3 text-amber-600" />
                </div>
                <div>
                  <div className="text-amber-800 font-bold text-[10px]">Sin Periodo Activo</div>
                  <div className="text-amber-700 text-[10px]">No hay periodo académico activo</div>
                </div>
              </div>
            )}

            <div className="space-y-3 bg-muted/30 p-3 rounded-lg border border-border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Semestre</Label>
                  <div className="flex items-center gap-2 bg-muted p-1 rounded-md border border-border">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <Select 
                      value={semestre.toString()} 
                      onValueChange={(v) => {
                        const newSem = parseInt(v);
                        if (periodoActivo && newSem !== periodoActivo.semestre) {
                          toast.warning(`Este semestre aún no está disponible. Actualmente está activo el Semestre ${periodoActivo.semestre}`);
                          return;
                        }
                        setSemestre(newSem);
                      }}
                    >
                      <SelectTrigger className="h-7 rounded-md border-none bg-transparent font-semibold text-[11px] focus:ring-0 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-border">
                        <SelectItem value="1" className="font-semibold text-[11px]">I Semestre</SelectItem>
                        <SelectItem value="2" className="font-semibold text-[11px]">II Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Ciclo</Label>
                  <Select value={cicloFiltro} onValueChange={setCicloFiltro}>
                    <SelectTrigger className="h-8 rounded-md border-border bg-card font-semibold text-[12px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border shadow-md bg-card">
                      <SelectItem value="todos" className="font-semibold text-[12px]">Todos</SelectItem>
                      {ciclos
                        .filter(c => {
                          const isPar = c.numero % 2 === 0;
                          return (semestre === 1 && !isPar) || (semestre === 2 && isPar);
                        })
                        .map(c => (
                          <SelectItem key={c.id_ciclo} value={c.id_ciclo.toString()} className="font-semibold text-[12px]">
                            {c.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Tipo</Label>
                  <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                    <SelectTrigger className="h-8 rounded-md border-border bg-card font-semibold text-[12px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent className="rounded-md border-border shadow-md bg-card">
                      <SelectItem value="todos" className="font-semibold text-[12px]">Todos</SelectItem>
                      <SelectItem value="general" className="font-semibold text-[12px]">General</SelectItem>
                      <SelectItem value="linea_carrera" className="font-semibold text-[12px]">Línea</SelectItem>
                      <SelectItem value="electivo" className="font-semibold text-[12px]">Electivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground ml-0.5">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Buscar curso..." 
                      className="pl-8 h-8 rounded-md border-border bg-card font-semibold text-[12px] focus:ring-primary transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {cursosFiltrados.length === 0 ? (
              <div className="border border-amber-200 rounded-md overflow-hidden shadow-sm bg-amber-50 p-6 text-center">
                <div className="text-amber-800 font-bold text-sm mb-1">
                  No hay cursos disponibles
                </div>
                <div className="text-amber-600 text-xs">
                  {semestre === 1 
                    ? "No se puede asignar cursos de segundo semestre. Por favor, selecciona el semestre II."
                    : "No se puede asignar cursos de primer semestre. Por favor, selecciona el semestre I."}
                </div>
              </div>
            ) : (
              <div className="border border-border rounded-md overflow-hidden shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="font-bold uppercase tracking-wider text-[9px] text-muted-foreground px-3 py-1.5">Curso</TableHead>
                      <TableHead className="text-center font-bold uppercase tracking-wider text-[9px] text-muted-foreground px-3 py-1.5">Teoría</TableHead>
                      <TableHead className="text-center font-bold uppercase tracking-wider text-[9px] text-muted-foreground px-3 py-1.5">Lab.</TableHead>
                      <TableHead className="text-center font-bold uppercase tracking-wider text-[9px] text-muted-foreground px-3 py-1.5">Prác.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-border">
                    {currentItems.map((curso) => (
                      <TableRow key={curso.id_curso} className="hover:bg-muted/30 border-b border-border last:border-0 transition-colors">
                        <TableCell className="px-3 py-1.5">
                          <div className="font-medium text-foreground text-[12px]">{curso.nombre}</div>
                          <div className="text-[10px] text-muted-foreground">{curso.codigo}</div>
                        </TableCell>
                        <TableCell className="text-center px-3 py-1.5">
                          <Checkbox
                            checked={isChecked(curso.id_curso, "teoria")}
                            onCheckedChange={() => toggleAsignacion(curso.id_curso, "teoria")}
                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="text-center px-3 py-1.5">
                          <Checkbox
                            checked={isChecked(curso.id_curso, "laboratorio")}
                            onCheckedChange={() => toggleAsignacion(curso.id_curso, "laboratorio")}
                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4"
                          />
                        </TableCell>
                        <TableCell className="text-center px-3 py-1.5">
                          <Checkbox
                            checked={isChecked(curso.id_curso, "practica")}
                            onCheckedChange={() => toggleAsignacion(curso.id_curso, "practica")}
                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground h-4 w-4"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {cursosFiltrados.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="border-t border-border bg-muted/10 py-2"
              />
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button variant="ghost" onClick={onClose} className="h-8 rounded-md font-semibold text-muted-foreground px-4 text-[12px] hover:bg-muted transition-colors">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving} className="h-8 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground px-5 font-bold text-[12px] shadow-sm transition-all active:scale-95">
                {saving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                Guardar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
