import { CondicionDocente, CategoriaDocente, RegimenDedicacion } from "@prisma/client";

export const mapCondicionToTexto = (condicion?: CondicionDocente | null): string => {
  switch (condicion) {
    case CondicionDocente.ORDINARIO:
      return "Ordinario (Nombrado)";
    case CondicionDocente.EXTRAORDINARIO:
      return "Extraordinario";
    case CondicionDocente.CONTRATADO:
      return "Contratado";
    default:
      return "-";
  }
};

export const mapCategoriaDocenteToTexto = (categoria?: CategoriaDocente | null): string => {
  switch (categoria) {
    case CategoriaDocente.PRINCIPAL:
      return "Principal";
    case CategoriaDocente.ASOCIADO:
      return "Asociado";
    case CategoriaDocente.AUXILIAR:
      return "Auxiliar";
    default:
      return "-";
  }
};

export const mapRegimenDedicacionToTexto = (regimen?: RegimenDedicacion | null): string => {
  switch (regimen) {
    case RegimenDedicacion.DE:
      return "Dedicación Exclusiva - 40h";
    case RegimenDedicacion.TC:
      return "Tiempo Completo - 40h";
    case RegimenDedicacion.TP1:
      return "Tiempo Parcial 1 - 20h";
    case RegimenDedicacion.TP2:
      return "Tiempo Parcial 2 - 10h";
    case RegimenDedicacion.TP3:
      return "Tiempo Parcial 3 - 8h";
    default:
      return "-";
  }
};
