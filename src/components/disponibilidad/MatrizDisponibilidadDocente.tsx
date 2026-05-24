"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { format, addMinutes, parse } from "date-fns";
import { 
  CheckCircle2, 
  Loader2,
  Save,
  AlertCircle,
  X
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
  docenteNombre
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

  const handleToggle = (dia: number, hora: string) => {
    const key = `${dia}-${hora}`;
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
      await onSave(dataToSave);
    } finally {
      setLoading(false);
    }
  };

  const totalDisponibles = Object.values(matriz).filter(Boolean).length;

  return (
    <div className="flex flex-col bg-card rounded-lg">
      <div className="p-2 border-b border-border flex items-center justify-between bg-muted/30">
        <div>
          <h2 className="text-sm font-black text-foreground leading-tight">Configurar Disponibilidad</h2>
          <p className="text-[8px] text-muted-foreground mt-0.5 font-bold">
            Docente: <span className="text-primary">{docenteNombre}</span>
          </p>
        </div>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="p-2 overflow-auto max-h-[65vh]">
        <div className="bg-background rounded-md border border-border shadow-sm overflow-hidden">
          <div className="px-2 py-1.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-wider">
              Total disponibles: <span className="text-primary font-black">{totalDisponibles}</span>h
            </span>
            <div className="flex items-center gap-1.5 text-[6.5px] text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary"></span> Disponible
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="w-10 p-1 text-center border-r border-border">
                    <span className="text-[6.5px] font-black text-muted-foreground uppercase tracking-widest">HORA</span>
                  </th>
                  {DIAS.map(dia => (
                    <th key={dia.id} className="p-1 text-center min-w-[42px] border-r border-border last:border-r-0">
                      <span className="text-[7px] font-black text-foreground uppercase">{dia.nombre}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {timeSlots.map(hora => (
                  <tr key={hora} className="group hover:bg-muted/20 transition-colors h-5">
                    <td className="p-0.5 text-center border-r border-border bg-muted/10">
                      <span className="text-[7px] font-bold text-primary">{hora}</span>
                    </td>
                    {DIAS.map(dia => {
                      const available = isAvailable(dia.id, hora);
                      return (
                        <td
                          key={`${dia.id}-${hora}`}
                          onClick={() => handleToggle(dia.id, hora)}
                          className={cn(
                            "p-0.5 border-r border-border/50 last:border-r-0 transition-all duration-150 cursor-pointer",
                            available ? "bg-primary/15" : "hover:bg-muted/30"
                          )}
                        >
                          <div className="flex items-center justify-center w-full h-full min-h-[16px]">
                            {available && <CheckCircle2 className="h-2.5 w-2.5 text-primary" />}
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

        <div className="flex gap-1.5 justify-end mt-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="h-6 rounded-md font-bold text-[8px] px-2.5"
          >
            Cancelar
          </Button>
          <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={loading}
              className="h-6 bg-primary hover:bg-primary/90 rounded-md font-bold text-[8px] px-3"
            >
              {loading ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" /> : <Save className="mr-1 h-2.5 w-2.5" />}
              Guardar
            </Button>

            <AlertDialogContent className="rounded-lg border-none shadow-xl p-3.5 bg-card max-w-[300px]">
              <AlertDialogHeader>
                <div className="h-6 w-6 bg-primary/10 rounded-md flex items-center justify-center mb-1.5">
                  <AlertCircle className="h-3 w-3 text-primary" />
                </div>
                <AlertDialogTitle className="text-xs font-bold text-foreground">¿Guardar?</AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground font-medium text-[8px]">
                  Modificar disponibilidad de <span className="font-bold text-primary">{docenteNombre}</span>?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-1 mt-2">
                <AlertDialogCancel className="h-6 rounded-md font-bold border-border hover:bg-muted text-[8px] px-2.5">No</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmSave} className="h-6 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-3 text-[8px]">
                  Sí, Guardar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
