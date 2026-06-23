"use client";

import { FileText } from "lucide-react";
import { resolverDeclaracionJurada } from "@/lib/declaracion-jurada";

interface DeclaracionJuradaPanelProps {
  declaracion: {
    declaracionJuradaOpcion?: string | null;
    fechaFirmaJurada?: string | null;
    estado?: string;
  };
  docente?: {
    id_docente?: number;
    condicion?: string | null;
    categoriaDocente?: string | null;
    regimenDedicacion?: string | null;
    tipoContrato?: string | null;
    esInvestigadorAcreditado?: boolean | null;
    tipoExtraordinario?: string | null;
  } | null;
}

export function DeclaracionJuradaPanel({ declaracion, docente }: DeclaracionJuradaPanelProps) {
  const texto = resolverDeclaracionJurada(declaracion, docente as any);

  if (!texto) {
    return (
      <div className="p-4 bg-muted/30 border border-border rounded-lg">
        <h4 className="text-sm font-bold text-muted-foreground mb-1 flex items-center gap-2">
          <FileText size={16} />
          Declaración Jurada
        </h4>
        <p className="text-xs text-muted-foreground italic">
          El docente aún no ha enviado su declaración o no se registró la opción jurada.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
      <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
        <FileText size={16} />
        Declaración Jurada (F02-CAD)
      </h4>
      <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">{texto}</p>
      {declaracion.fechaFirmaJurada && (
        <p className="text-[10px] text-amber-700/80 dark:text-amber-500 mt-2 font-medium">
          Firmada al enviar: {new Date(declaracion.fechaFirmaJurada).toLocaleString("es-PE")}
        </p>
      )}
    </div>
  );
}
