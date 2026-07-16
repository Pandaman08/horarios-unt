export interface DocenteCargaHoraria {
  nombre: string;
  horas: number;
}

export interface GestionAcademicaPdfDto {
  periodo?: {
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
}
