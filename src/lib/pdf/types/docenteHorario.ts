export interface DocenteHorarioPdfItem {
  id_asignacion: number | null;
  dia_semana: number | null;
  hora_inicio: string | null;
  hora_fin: string | null;
  tipo_clase?: string | null;
  curso?: {
    nombre?: string | null;
    codigo?: string | null;
    ciclo_rel?: {
      numero?: number | string | null;
    } | null;
  } | null;
  grupo?: {
    codigo_grupo?: string | null;
  } | null;
  ambiente?: {
    nombre?: string | null;
  } | null;
  docente?: {
    nombres?: string | null;
    apellidos?: string | null;
  } | null;
}

export interface DocenteHorarioPdfDto {
  docente: {
    id_docente: number;
    nombres: string;
    apellidos: string;
    codigo_docente?: string | null;
  };
  ciclo?: number | string | null;
  periodo: {
    id_periodo: number;
    nombre?: string | null;
    anio?: number | string | null;
    semestre?: number | null;
  };
  escuela?: {
    nombre?: string | null;
    codigo?: string | null;
  } | null;
  horarios: DocenteHorarioPdfItem[];
  resumen: {
    totalClases: number;
    totalHoras: number;
    totalCursos: number;
    totalNoLectivas?: number;
  };
}
