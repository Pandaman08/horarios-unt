export interface HorarioReportePdfItem {
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

export interface HorarioReporteGroup {
  title: string;
  subtitle?: string;
  items: HorarioReportePdfItem[];
  ciclo?: number | string | null;
  periodo?: {
    anio?: number | string | null;
    semestre?: number | null;
  } | null;
}

export interface HorarioReportePdfDto {
  title: string;
  subtitle: string;
  periodo?: {
    nombre?: string | null;
    anio?: number | string | null;
    semestre?: number | null;
  } | null;
  groups: HorarioReporteGroup[];
}
