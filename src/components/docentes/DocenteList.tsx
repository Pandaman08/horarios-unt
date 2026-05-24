"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  BookOpen, 
  Search, 
  Mail, 
  Phone, 
  Users,
  UserCircle2,
  Filter,
  GraduationCap,
  CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AsignarCursosDialog } from "./AsignarCursosDialog";
import { Pagination } from "@/components/ui/pagination";

interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  modalidad: string;
  categoria: string;
  dedicacion: string;
  antiguedad: number;
  correo_electronico: string;
  telefono: string;
  grado_academico?: string;
  fecha_ingreso?: string;
}

export function DocenteList() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Estados de Filtros
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todos");
  const [filtroModalidad, setFiltroModalidad] = useState<string>("todos");
  const [filtroGrado, setFiltroGrado] = useState<string>("todos");
  const [filtroAntiguedad, setFiltroAntiguedad] = useState<string>("todos");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const calculateAntiquity = (fechaIngreso?: string) => {
    if (!fechaIngreso) return 0;
    const ingreso = new Date(fechaIngreso);
    const actual = new Date();
    let years = actual.getFullYear() - ingreso.getFullYear();
    const monthDiff = actual.getMonth() - ingreso.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && actual.getDate() < ingreso.getDate())) {
      years--;
    }
    return Math.max(0, years);
  };

  const filteredDocentes = docentes.filter(d => {
    const matchesSearch = `${d.nombres} ${d.apellidos} ${d.codigo_docente}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = filtroCategoria === "todos" || d.categoria?.toUpperCase() === filtroCategoria.toUpperCase();
    const matchesModalidad = filtroModalidad === "todos" || d.modalidad?.toUpperCase() === filtroModalidad.toUpperCase();
    const matchesGrado = filtroGrado === "todos" || d.grado_academico === filtroGrado;
    
    const years = calculateAntiquity(d.fecha_ingreso);
    let matchesAntiguedad = true;
    if (filtroAntiguedad === "0-5") matchesAntiguedad = years <= 5;
    else if (filtroAntiguedad === "6-15") matchesAntiguedad = years > 5 && years <= 15;
    else if (filtroAntiguedad === "16+") matchesAntiguedad = years > 15;

    return matchesSearch && matchesCategoria && matchesModalidad && matchesGrado && matchesAntiguedad;
  });

  // Cálculo de paginación
  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage);
  const currentItems = filteredDocentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    fetchDocentes();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCategoria, filtroModalidad, filtroGrado, filtroAntiguedad]);

  const fetchDocentes = async () => {
    try {
      const res = await fetch("/api/docentes");
      const contentType = res.headers.get("content-type");

      if (!res.ok) {
        const errorData = contentType?.includes("application/json") 
          ? await res.json() 
          : { error: `Error ${res.status}: ${res.statusText}` };
        throw new Error(errorData.error || "Error al cargar docentes");
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setDocentes(data);
      } else {
        setDocentes([]);
      }
    } catch (error: any) {
      console.error("Error en fetchDocentes:", error);
      toast.error(error.message || "Error al cargar docentes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground tracking-tight leading-none">Docentes</h2>
              <p className="text-muted-foreground text-[10px] mt-1">Gestión integral de la plana académica</p>
            </div>
          </div>

          <div className="relative flex-1 sm:min-w-[280px] max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar docente..." 
              className="pl-9 h-9 rounded-lg border-input bg-muted/50 font-semibold text-[11px] focus:ring-1 focus:ring-primary transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Barra de Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-border/50">
          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Categoría</Label>
            <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todas las categorías</SelectItem>
                <SelectItem value="PRINCIPAL" className="text-[10px] font-bold">Principal</SelectItem>
                <SelectItem value="ASOCIADO" className="text-[10px] font-bold">Asociado</SelectItem>
                <SelectItem value="AUXILIAR" className="text-[10px] font-bold">Auxiliar</SelectItem>
                <SelectItem value="EXTRAORDINARIO" className="text-[10px] font-bold">Extraordinario</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Modalidad</Label>
            <Select value={filtroModalidad} onValueChange={setFiltroModalidad}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todas las modalidades</SelectItem>
                <SelectItem value="NOMBRADO" className="text-[10px] font-bold">Nombrado</SelectItem>
                <SelectItem value="CONTRATADO" className="text-[10px] font-bold">Contratado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Grado Académico</Label>
            <Select value={filtroGrado} onValueChange={setFiltroGrado}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Todos los grados</SelectItem>
                <SelectItem value="DOCTOR" className="text-[10px] font-bold">Doctor</SelectItem>
                <SelectItem value="MAESTRO" className="text-[10px] font-bold">Maestro</SelectItem>
                <SelectItem value="INGENIERO" className="text-[10px] font-bold">Ingeniero</SelectItem>
                <SelectItem value="LICENCIADO" className="text-[10px] font-bold">Licenciado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Antigüedad</Label>
            <Select value={filtroAntiguedad} onValueChange={setFiltroAntiguedad}>
              <SelectTrigger className="h-8 text-[10px] font-bold rounded-lg bg-muted/30 border-border">
                <SelectValue placeholder="Cualquiera" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border">
                <SelectItem value="todos" className="text-[10px] font-bold">Cualquier antigüedad</SelectItem>
                <SelectItem value="0-5" className="text-[10px] font-bold">Nuevo (0-5 años)</SelectItem>
                <SelectItem value="6-15" className="text-[10px] font-bold">Intermedio (6-15 años)</SelectItem>
                <SelectItem value="16+" className="text-[10px] font-bold">Senior (16+ años)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[1000px] w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Cód.</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Apellidos y Nombres</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Grado</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2">Antigüedad</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Modalidad</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-center">Categoría</TableHead>
                <TableHead className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {loading ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : currentItems.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="py-10 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                currentItems.map((docente) => (
                  <TableRow key={docente.id_docente} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[9px] font-bold text-muted-foreground">{docente.codigo_docente}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-[9px]">
                          {docente.nombres.charAt(0)}{docente.apellidos.charAt(0)}
                        </div>
                        <span className="font-semibold text-foreground text-[11px]">{docente.apellidos}, {docente.nombres}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] font-medium">{docente.grado_academico || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarDays className="h-3 w-3 text-muted-foreground/40" />
                        <span className="text-[10px] font-medium">{calculateAntiquity(docente.fecha_ingreso)} años</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-widest border border-border">{docente.modalidad}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest border border-primary/20">{docente.categoria}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedDocente(docente); setIsAsignarOpen(true); }} 
                          title="Asignar Cursos" 
                          className="h-7 w-7 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-600 transition-all"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          className="border-t border-border bg-muted/10"
        />
      </div>

      <AsignarCursosDialog docenteId={selectedDocente?.id_docente || 0} docenteNombre={`${selectedDocente?.apellidos}, ${selectedDocente?.nombres}`} isOpen={isAsignarOpen} onClose={() => { setIsAsignarOpen(false); setSelectedDocente(null); }} />
    </div>
  );
}
