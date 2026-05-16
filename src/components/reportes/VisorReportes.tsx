"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Download, Printer, User, Home } from "lucide-react";
import { toast } from "sonner";

export function VisorReportes({ id_periodo }: { id_periodo: number }) {
  const [docentes, setDocentes] = useState<any[]>([]);
  const [ambientes, setAmbientes] = useState<any[]>([]);
  const [selectedDocente, setSelectedDocente] = useState<string>("");
  const [selectedAmbiente, setSelectedAmbiente] = useState<string>("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dRes, aRes] = await Promise.all([
        fetch("/api/docentes"),
        fetch("/api/ambientes")
      ]);
      setDocentes(await dRes.json());
      setAmbientes(await aRes.json());
    } catch (error) {
      toast.error("Error al cargar datos de reportes");
    }
  };

  const handleDownload = async (tipo: string, id: string) => {
    if (!id) {
      toast.warning("Seleccione un elemento de la lista");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch(`/api/reportes?tipo=${tipo}&id=${id}&id_periodo=${id_periodo}`);
      if (!res.ok) throw new Error("Error al generar PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${tipo}-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("PDF generado correctamente");
    } catch (error) {
      toast.error("Error al descargar el reporte");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5 text-blue-600" /> Horario por Docente
          </CardTitle>
          <CardDescription>Genera el horario individual oficial de un docente</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Docente</Label>
            <Select value={selectedDocente} onValueChange={setSelectedDocente}>
              <SelectTrigger>
                <SelectValue placeholder="Busca un docente..." />
              </SelectTrigger>
              <SelectContent>
                {docentes.map(d => (
                  <SelectItem key={d.id_docente} value={d.id_docente.toString()}>
                    {d.nombres} {d.apellidos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            disabled={generating} 
            onClick={() => handleDownload('docente', selectedDocente)}
          >
            <Download className="mr-2 h-4 w-4" /> 
            {generating ? "Generando..." : "Descargar PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Home className="mr-2 h-5 w-5 text-green-600" /> Horario por Ambiente
          </CardTitle>
          <CardDescription>Genera el horario de uso de un aula o laboratorio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Ambiente</Label>
            <Select value={selectedAmbiente} onValueChange={setSelectedAmbiente}>
              <SelectTrigger>
                <SelectValue placeholder="Busca un aula/lab..." />
              </SelectTrigger>
              <SelectContent>
                {ambientes.map(a => (
                  <SelectItem key={a.id_ambiente} value={a.id_ambiente.toString()}>
                    {a.nombre} ({a.tipo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            className="w-full" 
            variant="secondary"
            disabled={generating} 
            onClick={() => handleDownload('aula', selectedAmbiente)}
          >
            <Download className="mr-2 h-4 w-4" /> 
            {generating ? "Generando..." : "Descargar PDF"}
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5 text-indigo-600" /> Reportes de Gestión
          </CardTitle>
          <CardDescription>Resúmenes ejecutivos y estadísticas descriptivas del periodo</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="justify-start">
            <Printer className="mr-2 h-4 w-4" /> Consolidado de Carga
          </Button>
          <Button variant="outline" className="justify-start">
            <Printer className="mr-2 h-4 w-4" /> Reporte de Conflictos
          </Button>
          <Button variant="outline" className="justify-start">
            <Printer className="mr-2 h-4 w-4" /> Estadísticas Finales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
