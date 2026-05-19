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
      const data = await res.json();
      if (Array.isArray(data)) {
        setDocentes(data);
      } else {
        setDocentes([]);
      }
    } catch (error) {
      toast.error("Error al cargar docentes");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users className="h-6 w-6 text-[#003366]" />
          </div>
          <div>
            <h2 className="text-[20px] font-black text-gray-900 tracking-tight">Docentes</h2>
            <p className="text-[14px] font-bold text-gray-400 uppercase tracking-widest leading-none">Gestión de plana académica</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:min-w-[280px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input 
              placeholder="Buscar docente..." 
              className="pl-12 h-11 rounded-xl border-gray-100 bg-gray-50/50 font-bold text-[14px] focus:ring-2 focus:ring-blue-100 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="w-[100px]">Cód.</TableHead>
                <TableHead>Apellidos y Nombres</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead className="w-[150px]">Teléfono</TableHead>
                <TableHead className="w-[150px] text-center">Categoría</TableHead>
                <TableHead className="w-[150px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-[16px] font-bold text-gray-400">Cargando docentes...</TableCell></TableRow>
              ) : filteredDocentes.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-12 text-center text-[16px] font-bold text-gray-400">No se encontraron registros</TableCell></TableRow>
              ) : (
                filteredDocentes.map((docente) => (
                  <TableRow key={docente.id_docente} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-colors">
                    <TableCell className="font-bold text-[14px] text-gray-500">{docente.codigo_docente}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserCircle2 className="h-5 w-5 text-[#003366]/50" />
                        <span className="font-bold text-gray-900 truncate text-[16px]">{docente.apellidos}, {docente.nombres}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-gray-500">
                        <Mail className="h-5 w-5" />
                        <span className="text-[14px] font-medium truncate">{docente.correo_electronico || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-gray-500">
                        <Phone className="h-5 w-5" />
                        <span className="text-[14px] font-medium">{docente.telefono || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="px-3 py-1 rounded-lg bg-blue-50 text-[#003366] text-[12px] font-black uppercase tracking-tight">{docente.categoria}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => { setSelectedDocente(docente); setIsAsignarOpen(true); }} 
                          title="Asignar Cursos" 
                          className="h-9 w-9 hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <BookOpen className="h-5 w-5" />
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
