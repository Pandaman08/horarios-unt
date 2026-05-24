"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Calendar, 
  User, 
  ArrowUpDown, 
  Edit3, 
  CheckCircle2, 
  XCircle,
  Filter,
  Loader2
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
import { MatrizDisponibilidadDocente } from "./MatrizDisponibilidadDocente";
import { Pagination } from "@/components/ui/pagination";

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

interface Periodo {
  id_periodo: number;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export function DisponibilidadList() {
  const [docentes, setDocentes] = useState<DocenteDisp[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoria, setCategoria] = useState("todos");
  const [modalidad, setModalidad] = useState("todos");
  const [orden, setOrden] = useState("antiguedad_desc");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Cálculo de paginación
  const totalPages = Math.ceil(docentes.length / itemsPerPage);
  const currentItems = docentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoria, modalidad, orden]);

  // Estado para el modal de edición
  const [editingDocente, setEditingDocente] = useState<DocenteDisp | null>(null);
  const [disponibilidadActual, setDisponibilidadActual] = useState<any[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPeriodo) {
      fetchDocentes();
    }
  }, [selectedPeriodo, searchTerm, categoria, modalidad, orden]);

  const fetchInitialData = async () => {
    try {
      // 1. Obtener periodos
      const resPeriodos = await fetch("/api/periodos");
      const dataPeriodos = await resPeriodos.json();
      setPeriodos(dataPeriodos);

      // 2. Obtener periodo activo
      const resActivo = await fetch("/api/periodos/activo");
      if (resActivo.ok) {
        const dataActivo = await resActivo.json();
        setSelectedPeriodo(dataActivo.id_periodo.toString());
      } else if (dataPeriodos.length > 0) {
        setSelectedPeriodo(dataPeriodos[0].id_periodo.toString());
      }
    } catch (error) {
      toast.error("Error al cargar datos iniciales");
    }
  };

  const fetchDocentes = async () => {
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

  const handleEditDisponibilidad = async (docente: DocenteDisp) => {
    setEditingDocente(docente);
    setLoadingDisp(true);
    try {
      const res = await fetch(`/api/docentes/disponibilidad/${docente.id_docente}?periodoId=${selectedPeriodo}`);
      const data = await res.json();
      setDisponibilidadActual(data);
    } catch (error) {
      toast.error("Error al cargar disponibilidad");
    } finally {
      setLoadingDisp(false);
    }
  };

  const handleSaveDisponibilidad = async (data: any[]) => {
    if (!editingDocente) return;
    try {
      const res = await fetch("/api/docentes/disponibilidad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_docente: editingDocente.id_docente,
          id_periodo: parseInt(selectedPeriodo),
          disponibilidad: data
        })
      });

      if (res.ok) {
        toast.success("Disponibilidad guardada correctamente");
        setEditingDocente(null);
        fetchDocentes();
      } else {
        toast.error("Error al guardar disponibilidad");
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Header y Filtros */}
      <div className="bg-card p-4 rounded-xl border border-border shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground tracking-tight leading-none">Gestión de Disponibilidad</h1>
              <p className="text-muted-foreground text-[10px] mt-1">Registro de franjas horarias habilitadas por docente</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border border-border w-full md:w-auto">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-2">Periodo:</span>
            <Select value={selectedPeriodo} onValueChange={setSelectedPeriodo}>
              <SelectTrigger className="w-[140px] h-7 rounded-md border-none bg-card font-bold text-primary focus:ring-0 text-[10px]">
                <SelectValue placeholder="Seleccionar periodo" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border shadow-xl">
                {periodos.map(p => (
                  <SelectItem key={p.id_periodo} value={p.id_periodo.toString()} className="font-bold text-[10px]">
                    {p.codigo} {p.activo && "(Activo)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          <div className="space-y-1">
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
          </div>

          <div className="space-y-1">
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
          </div>

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

      {/* Tabla de Docentes */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-b border-border hover:bg-transparent">
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Docente</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">DNI / Código</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Categoría</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Modalidad</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Antigüedad</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Estado Disp.</TableHead>
              <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-border">
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Cargando docentes...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : currentItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
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
                    <span className="text-[10px] font-bold text-foreground">
                      {docente.antiguedad !== null ? `${docente.antiguedad} años` : 'N/A'}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      {docente.tiene_disponibilidad ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Configurado</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-amber-500">
                          <XCircle className="h-3 w-3" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">Pendiente</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-2">
                    <div className="flex justify-end">
                      <Button 
                        size="sm"
                        onClick={() => handleEditDisponibilidad(docente)}
                        className="h-7 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-[10px] shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <Edit3 className="h-3 w-3" />
                        Editar Disp.
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

      {/* Modal de Matriz de Disponibilidad */}
      <Dialog open={!!editingDocente} onOpenChange={(open) => !open && setEditingDocente(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-[90vw] lg:max-w-[1200px] h-[90vh] p-0 border-none shadow-2xl overflow-hidden rounded-3xl">
          <DialogTitle className="sr-only">
            Editar Disponibilidad de {editingDocente?.nombres} {editingDocente?.apellidos}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Configure las franjas horarias en las que el docente está disponible.
          </DialogDescription>
          {loadingDisp ? (
            <div className="flex flex-col items-center justify-center h-full bg-card gap-4">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Cargando disponibilidad...</p>
            </div>
          ) : (
            editingDocente && (
              <MatrizDisponibilidadDocente
                docenteId={editingDocente.id_docente}
                periodoId={parseInt(selectedPeriodo)}
                initialData={disponibilidadActual}
                docenteNombre={`${editingDocente.nombres} ${editingDocente.apellidos}`}
                onSave={handleSaveDisponibilidad}
                onCancel={() => setEditingDocente(null)}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
