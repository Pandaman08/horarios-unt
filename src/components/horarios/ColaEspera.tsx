"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, ChevronRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Docente {
  id_docente: number;
  codigo_docente: string;
  nombres: string;
  apellidos: string;
  modalidad: string;
  categoria: string;
}

interface Props {
  id_periodo: number;
  onLlamarDocente: (docente: Docente) => void;
  docenteActualId?: number;
}

export function ColaEspera({ id_periodo, onLlamarDocente, docenteActualId }: Props) {
  const [cola, setCola] = useState<Docente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCola();
    const interval = setInterval(fetchCola, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, [id_periodo]);

  const fetchCola = async () => {
    try {
      const res = await fetch(`/api/cola-docentes?id_periodo=${id_periodo}`);
      const data = await res.json();
      setCola(data.docentes || []);
    } catch (error) {
      console.error("Error al cargar cola");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">Cola de Espera</CardTitle>
        <span className="inline-flex items-center bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs font-bold">{cola.length} en espera</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-[600px] overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Cargando cola...</div>
          ) : cola.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No hay docentes en espera actualmente.</p>
            </div>
          ) : (
            cola.map((docente, index) => {
              const esActual = docente.id_docente === docenteActualId;
              return (
                <div 
                  key={docente.id_docente}
                  className={cn(
                    "p-4 flex items-center justify-between hover:bg-gray-50 transition-colors",
                    esActual && "bg-blue-50 border-l-4 border-l-blue-500"
                  )}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 bg-gray-100 rounded-full p-2">
                      <User className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-none">
                        {docente.nombres} {docente.apellidos}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{docente.modalidad}</span>
                        <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-1 rounded">
                          {docente.categoria.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {!esActual && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onLlamarDocente(docente)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    >
                      Llamar <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  )}
                  {esActual && (
                    <span className="inline-flex items-center bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">En Atención</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
