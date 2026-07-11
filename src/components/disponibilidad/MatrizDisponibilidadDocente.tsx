"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, addMinutes, parse } from "date-fns";
import { toast } from "sonner";
import { 
  CheckCircle2, 
  Loader2,
  Save,
  AlertCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  docenteId: number;
  periodoId: number;
  initialData?: any[];
  onSave: (data: any[]) => Promise<void>;
  onCancel: () => void;
  docenteNombre: string;
  isReadOnly?: boolean;
  horasMaximas?: number;
  etiquetaRegimen?: string;
}

const DIAS = [
  { id: 1, nombre: "Lun" },
  { id: 2, nombre: "Mar" },
  { id: 3, nombre: "Mié" },
  { id: 4, nombre: "Jue" },
  { id: 5, nombre: "Vie" },
  { id: 6, nombre: "Sáb" },
];

export function MatrizDisponibilidadDocente({
  initialData = [],
  onSave,
  onCancel,
  docenteNombre,
  isReadOnly = false,
  horasMaximas = 0,
  etiquetaRegimen = "",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [matriz, setMatriz] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    if (initialData.length > 0) {
      initialData.forEach(d => {
        initial[`${d.dia_semana}-${d.hora_inicio}`] = d.disponible;
      });
    }
    return initial;
  });

  const timeSlots = useMemo(() => {
    const slots = [];
    let current = parse("07:00", "HH:mm", new Date());
    const end = parse("22:00", "HH:mm", new Date());
    
    while (current < end) {
      slots.push(format(current, "HH:mm"));
      current = addMinutes(current, 60);
    }
    return slots;
  }, []);

  const totalDisponibles = useMemo(
    () => Object.values(matriz).filter(Boolean).length,
    [matriz]
  );

  const handleToggle = (dia: number, hora: string) => {
    if (isReadOnly) return;
    const key = `${dia}-${hora}`;
    const currentlyAvailable = !!matriz[key];

    if (!currentlyAvailable && horasMaximas > 0 && totalDisponibles >= horasMaximas) {
      toast.warning(
        `Máximo ${horasMaximas}h semanales${etiquetaRegimen ? ` (${etiquetaRegimen})` : ""}`
      );
      return;
    }

    setMatriz(prev => {
      const newState = { ...prev };
      if (newState[key]) {
        delete newState[key];
      } else {
        newState[key] = true;
      }
      return newState;
    });
  };

  const isAvailable = (dia: number, hora: string) => {
    const key = `${dia}-${hora}`;
    return !!matriz[key];
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const dataToSave: any[] = [];
      DIAS.forEach(dia => {
        timeSlots.forEach(hora => {
          const horaFin = format(addMinutes(parse(hora, "HH:mm", new Date()), 60), "HH:mm");
          dataToSave.push({
            dia_semana: dia.id,
            hora_inicio: hora,
            hora_fin: horaFin,
            disponible: isAvailable(dia.id, hora)
          });
        });
      });

      if (horasMaximas > 0 && totalDisponibles > horasMaximas) {
        toast.error(`La disponibilidad (${totalDisponibles}h) excede el máximo de ${horasMaximas}h semanales.`);
        return;
      }

      await onSave(dataToSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-card rounded-lg">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h2 className="text-base font-black text-foreground leading-tight">
            {isReadOnly ? "Ver Disponibilidad Histórica" : "Configurar Disponibilidad"}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 font-bold">
            Docente: <span className="text-primary">{docenteNombre}</span>
          </p>
        </div>
        {isReadOnly && (
          <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-500/20 uppercase font-black px-2 py-0.5">
            Solo Lectura
          </Badge>
        )}
      </div>

      <div className="p-3 overflow-auto max-h-[70vh]">
        <div className="bg-background rounded-md border border-border shadow-sm overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-center justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total disponibles:{" "}
                <span className={cn(
                  "font-black",
                  horasMaximas > 0 && totalDisponibles > horasMaximas ? "text-destructive" : "text-primary"
                )}>
                  {totalDisponibles}
                </span>
                {horasMaximas > 0 && (
                  <span className="text-muted-foreground"> / {horasMaximas}h máx.</span>
                )}
              </span>
              {etiquetaRegimen && (
                <span className="text-[10px] text-muted-foreground font-medium">{etiquetaRegimen}</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-primary"></span> Disponible
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="w-20 p-2 text-center border-r border-border">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">HORA</span>
                  </th>
                  {DIAS.map(dia => (
                    <th key={dia.id} className="p-2 text-center min-w-[80px] border-r border-border last:border-r-0">
                      <span className="text-xs font-black text-foreground uppercase">{dia.nombre}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timeSlots.map(hora => (
                  <tr key={hora} className="group hover:bg-muted/20 transition-colors h-12">
                    <td className="p-1 text-center border-r border-border bg-muted/10">
                      <span className="text-xs font-bold text-primary">{hora}</span>
                    </td>
                    {DIAS.map(dia => {
                      const available = isAvailable(dia.id, hora);
                      return (
                        <td
                          key={`${dia.id}-${hora}`}
                          onClick={() => handleToggle(dia.id, hora)}
                          className={cn(
                            "p-1 border-r border-border/50 last:border-r-0 transition-all duration-150 cursor-pointer",
                            available ? "bg-primary/15" : "hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-center w-full h-full min-h-[32px]">
                            {available && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex gap-2 justify-end mt-3">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-8 rounded-md font-bold text-sm px-4"
          >
            {isReadOnly ? "Cerrar" : "Cancelar"}
          </Button>
          {!isReadOnly && (
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={loading}
                className="h-8 bg-primary hover:bg-primary/90 rounded-md font-bold text-sm px-4"
              >
                {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                Guardar
              </Button>

              <AlertDialogContent className="page-modal-alert max-w-[300px]">
                <AlertDialogHeader>
                  <div className="h-8 w-8 bg-primary/10 rounded-md flex items-center justify-center mb-2">
                    <AlertCircle className="h-4 w-4 text-primary" />
                  </div>
                  <AlertDialogTitle className="text-sm font-bold text-foreground">¿Guardar?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground font-medium text-sm">
                    Modificar disponibilidad de <span className="font-bold text-primary">{docenteNombre}</span>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-1.5 mt-3">
                  <AlertDialogCancel className="page-modal-alert-btn">No</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmSave} className="page-modal-alert-btn bg-primary text-primary-foreground hover:bg-primary/90">
                    Sí, Guardar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
