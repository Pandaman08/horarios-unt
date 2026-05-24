"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, addMinutes, parse } from "date-fns";
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Save,
  X,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

const DIAS = [
  { id: 1, nombre: "Lunes" },
  { id: 2, nombre: "Martes" },
  { id: 3, nombre: "Miércoles" },
  { id: 4, nombre: "Jueves" },
  { id: 5, nombre: "Viernes" },
  { id: 6, nombre: "Sábado" },
];

export function MatrizDisponibilidadDocente({
  initialData = [],
  onSave,
  onCancel,
  docenteNombre
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  // Estado local para la matriz: dia-hora -> disponible (boolean)
  const [matriz, setMatriz] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    // Por defecto todos NO disponibles (el usuario debe seleccionar)
    // Pero si hay data inicial, cargarla
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
      current = addMinutes(current, 60); // Intervalos de 1 hora
    }
    return slots;
  }, []);

  const handleToggle = (dia: number, hora: string) => {
    const key = `${dia}-${hora}`;
    setMatriz(prev => {
      const newState = { ...prev };
      if (newState[key]) {
        delete newState[key]; // Si estaba, se borra (no disponible)
      } else {
        newState[key] = true; // Si no estaba, se agrega (disponible)
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
      await onSave(dataToSave);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/20">
        <div>
          <h2 className="text-base font-bold text-foreground leading-tight">Configurar Disponibilidad</h2>
          <p className="text-[10px] text-muted-foreground mt-0.5 uppercase font-bold tracking-wider">Docente: <span className="text-primary">{docenteNombre}</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onCancel} className="h-8 rounded-lg font-bold text-[10px]">
            Cancelar
          </Button>
          <Button onClick={() => setShowConfirm(true)} disabled={loading} className="h-8 bg-primary hover:bg-primary/90 rounded-lg font-bold text-[10px] shadow-sm">
            {loading ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Save className="mr-1.5 h-3 w-3" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 custom-scrollbar">
        <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden max-w-4xl mx-auto">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="w-16 p-1.5 text-center border-r border-border">
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Hora</span>
                  </th>
                  {DIAS.map(dia => (
                    <th key={dia.id} className="p-1.5 text-center min-w-[80px] border-r border-border last:border-r-0">
                      <span className="text-[9px] font-black text-foreground uppercase tracking-widest">{dia.nombre}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timeSlots.map(hora => (
                  <tr key={hora} className="group hover:bg-muted/30 transition-colors h-8">
                    <td className="p-1.5 text-center border-r border-border bg-muted/10">
                      <span className="text-[9px] font-bold text-primary">{hora}</span>
                    </td>
                    {DIAS.map(dia => {
                      const available = isAvailable(dia.id, hora);
                      return (
                        <td
                          key={`${dia.id}-${hora}`}
                          onClick={() => handleToggle(dia.id, hora)}
                          className={cn(
                            "p-0.5 border-r border-border/50 last:border-r-0 transition-all duration-200 cursor-pointer relative",
                            available ? "bg-primary/20" : "hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center justify-center w-full h-full min-h-[28px]">
                            {available && (
                              <div className="flex items-center gap-1 text-primary animate-in zoom-in duration-200">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                                <span className="text-[7px] font-black uppercase tracking-tighter">Disponible</span>
                              </div>
                            )}
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
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl border-none shadow-2xl p-6 bg-card max-w-[400px]">
          <AlertDialogHeader>
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
              <AlertCircle className="h-5 w-5 text-primary" />
            </div>
            <AlertDialogTitle className="text-lg font-bold text-foreground">¿Guardar Cambios?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-medium text-xs">
              ¿Está seguro que desea modificar la disponibilidad de <span className="font-bold text-primary">{docenteNombre}</span>? Esta acción afectará la asignación automática de horarios.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-5">
            <AlertDialogCancel className="h-9 rounded-lg font-bold border-border hover:bg-muted text-[10px]">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-5 text-[10px]">
              Sí, Guardar Disponibilidad
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
