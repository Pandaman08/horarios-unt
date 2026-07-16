export interface DocenteListItem {
  apellidos: string;
  nombres: string;
  codigo_docente?: string | null;
  grado_academico?: string | null;
  categoria?: string | null;
  modalidad?: string | null;
  correo_electronico?: string | null;
}

export interface CursoListItem {
  codigo?: string | null;
  nombre?: string | null;
  horas_teoria: number;
  horas_practica: number;
  horas_laboratorio: number;
  ciclo?: { numero: number } | null;
}

export interface AmbienteListItem {
  nombre?: string | null;
  codigo?: string | null;
  tipo?: string | null;
  capacidad?: number | null;
  pabellon?: string | null;
  piso?: string | null;
}

export interface PeriodoListItem {
  codigo?: string | null;
  nombre?: string | null;
  anio?: number | null;
  semestre?: number | null;
  estado?: string | null;
  fecha_inicio?: Date | null;
  fecha_fin?: Date | null;
}

export interface ListReportPdfDto<T> {
  title: string;
  subtitle: string;
  periodo?: {
    nombre?: string | null;
    anio?: number | null;
    semestre?: string | null;
  };
  items: T[];
}
