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
  UserCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AsignarCursosDialog } from "./AsignarCursosDialog";

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
}

export function DocenteList() {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocente, setSelectedDocente] = useState<Docente | null>(null);
  const [isAsignarOpen, setIsAsignarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredDocentes = docentes.filter(d => 
    `${d.nombres} ${d.apellidos} ${d.codigo_docente}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchDocentes();
  }, []);

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

      if (!contentType?.includes("application/json")) {
        const text = await res.text();
        console.error("Respuesta no es JSON de /api/docentes:", text.substring(0, 200));
        throw new Error("La respuesta de docentes no es un JSON válido");
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
    <div className="space-y-3 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 bg-indigo-50 rounded-lg flex items-center justify-center border border-indigo-100 shadow-sm">
            <Users className="h-4 w-4 text-[#1a237e]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 tracking-tight leading-none">Docentes</h2>
            <p className="text-slate-500 text-[10px] mt-1">Gestión integral de la plana académica</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input 
              placeholder="Buscar docente..." 
              className="pl-9 h-9 rounded-lg border-slate-200 bg-slate-50/50 font-semibold text-[11px] focus:ring-1 focus:ring-[#1a237e] transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100 hover:bg-transparent">
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Cód.</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Apellidos y Nombres</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Contacto</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2">Teléfono</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-center">Categoría</TableHead>
                <TableHead className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-4 py-2 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-50">
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargando...</TableCell></TableRow>
              ) : filteredDocentes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredDocentes.map((docente) => (
                  <TableRow key={docente.id_docente} className="group hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-2">
                      <span className="font-mono text-[9px] font-bold text-slate-400">{docente.codigo_docente}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-md bg-indigo-50 flex items-center justify-center border border-indigo-100 text-[#1a237e] font-bold text-[9px]">
                          {docente.nombres.charAt(0)}{docente.apellidos.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800 text-[11px]">{docente.apellidos}, {docente.nombres}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="h-3 w-3 text-slate-300" />
                        <span className="text-[10px] font-medium truncate max-w-[150px]">{docente.correo_electronico || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="h-3 w-3 text-slate-300" />
                        <span className="text-[10px] font-medium">{docente.telefono || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-2 text-center">
                      <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-[#1a237e] text-[8px] font-bold uppercase tracking-widest border border-indigo-100">{docente.categoria}</span>
                    </TableCell>
                    <TableCell className="px-4 py-2">
                      <div className="flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedDocente(docente); setIsAsignarOpen(true); }} 
                          title="Asignar Cursos" 
                          className="h-7 w-7 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all opacity-0 group-hover:opacity-100"
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
      </div>

      <AsignarCursosDialog docenteId={selectedDocente?.id_docente || 0} docenteNombre={`${selectedDocente?.apellidos}, ${selectedDocente?.nombres}`} isOpen={isAsignarOpen} onClose={() => { setIsAsignarOpen(false); setSelectedDocente(null); }} />
    </div>
  );
}
