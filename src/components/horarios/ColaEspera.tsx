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
  categoriaDocente?: string;
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
    <div className="h-full bg-card rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
        <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Cola de Espera</h4>
        <span className="text-xs bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full font-bold">
          {cola.length} en espera
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-border">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">Cargando cola...</p>
          </div>
        ) : cola.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-12 w-12 bg-muted rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Clock className="h-6 w-6 text-muted-foreground/50" />
            </div>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">No hay docentes en espera actualmente.</p>
          </div>
        ) : (
          cola.map((docente, index) => {
            const esActual = docente.id_docente === docenteActualId;
            return (
              <div 
                key={docente.id_docente}
                className={cn(
                  "p-4 flex items-center justify-between transition-all duration-200 group",
                  esActual ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm font-bold text-xs uppercase",
                    esActual ? "bg-card text-primary ring-2 ring-primary/20" : "bg-muted text-muted-foreground"
                  )}>
                    {docente.nombres.charAt(0)}{docente.apellidos.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-foreground leading-none truncate">
                      {docente.nombres} {docente.apellidos}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter font-mono">{docente.codigo_docente}</span>
                      <span className="w-0.5 h-0.5 rounded-full bg-border" />
                      <span className="text-xs font-bold text-primary uppercase tracking-tighter bg-primary/10 px-1.5 py-0.5 rounded">
                        {docente.categoriaDocente?.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="ml-3 shrink-0">
                  {esActual ? (
                    <span className="inline-flex items-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 px-2 py-0.5 rounded-lg text-xs font-bold uppercase tracking-widest border border-emerald-500/20 animate-pulse">
                      Atendiendo
                    </span>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => onLlamarDocente(docente)}
                      className="text-primary hover:text-primary hover:bg-card h-8 px-3 text-xs font-bold uppercase tracking-widest rounded-lg border border-transparent hover:border-primary/20 transition-all opacity-100"
                    >
                      Llamar
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
