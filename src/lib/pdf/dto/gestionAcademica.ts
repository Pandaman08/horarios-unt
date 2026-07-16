import type { GestionAcademicaPdfDto, DocenteCargaHoraria } from '../types/gestionAcademica';

type GestionAcademicaParams = {
  periodo?: {
    id_periodo?: number;
    nombre?: string | null;
    anio?: number | null;
    semestre?: string | null;
  };
  estadisticas: {
    total_asignaciones: number;
    media_horas: string;
    mediana_horas: string;
    desviacion_estandar: string;
    min_horas: number;
    max_horas: number;
    observaciones: string[];
  };
  docentes: DocenteCargaHoraria[];
};

export function createGestionAcademicaPdfDto(params: GestionAcademicaParams): GestionAcademicaPdfDto {
  return {
    periodo: params.periodo,
    estadisticas: params.estadisticas,
    docentes: params.docentes,
  };
}
