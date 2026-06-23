import {
  REGIMEN_DEDICACION,
  TIPO_CONTRATO,
  type RegimenDedicacion,
  type TipoContrato,
} from '@/lib/constants/regimenHoras';

type HorarioBloque = { horaInicio?: string; horaFin?: string };

export type DocenteRegimen = {
  condicion?: string | null;
  regimenDedicacion?: string | null;
  tipoContrato?: string | null;
};

type CargaLectivaResumen = {
  horas_semanales?: number | null;
  grupos_asignados?: number | null;
};

/** Clave de columna del Art. 12.4 */
export type ClaveRegimenHoras =
  | 'DE'
  | 'TC'
  | 'TP1'
  | 'TP2'
  | 'TP3'
  | 'A1B1'
  | 'A2B2'
  | 'A3B3';

export const SIGLAS_REGIMEN: Record<ClaveRegimenHoras, string> = {
  DE: 'Dedicación Exclusiva (40h)',
  TC: 'Tiempo Completo (40h)',
  TP1: 'Tiempo Parcial 1 (20h)',
  TP2: 'Tiempo Parcial 2 (10h)',
  TP3: 'Tiempo Parcial 3 (8h) — solo CHL, sin CHNLC',
  A1B1: 'Contratado Doctor/Maestro Tiempo Completo (32h)',
  A2B2: 'Contratado Doctor/Maestro Tiempo Parcial (16h)',
  A3B3: 'Contratado Doctor/Maestro Tiempo Parcial (8h) — solo CHL, sin CHNLC',
};

/**
 * Art. 12.4 — Límites máximos de horas no lectivas por régimen.
 * `0` = el docente no puede asignar horas a esa actividad.
 */
export const LIMITES_ART_12_4: Record<
  string,
  Record<ClaveRegimenHoras, number>
> = {
  TUTORIA: { DE: 2, TC: 2, TP1: 2, TP2: 1, TP3: 0, A1B1: 3, A2B2: 1, A3B3: 0 },
  INVESTIGACION: { DE: 6, TC: 6, TP1: 0, TP2: 0, TP3: 0, A1B1: 6, A2B2: 0, A3B3: 0 },
  RESPONSABILIDAD_SOCIAL: { DE: 2, TC: 2, TP1: 2, TP2: 0, TP3: 0, A1B1: 2, A2B2: 1, A3B3: 0 },
  ASESORIA: { DE: 2, TC: 2, TP1: 0, TP2: 0, TP3: 0, A1B1: 1, A2B2: 0, A3B3: 0 },
  CAPACITACION: { DE: 2, TC: 2, TP1: 0, TP2: 0, TP3: 0, A1B1: 0, A2B2: 0, A3B3: 0 },
  AUTOEVALUACION_ACREDITACION: { DE: 2, TC: 2, TP1: 0, TP2: 0, TP3: 0, A1B1: 0, A2B2: 0, A3B3: 0 },
};

export const ETIQUETAS_ART_12_4: Record<string, string> = {
  TUTORIA: 'Tutoría y Consejería',
  INVESTIGACION: 'Investigación',
  RESPONSABILIDAD_SOCIAL: 'RSU',
  ASESORIA: 'Asesoría de Tesis',
  CAPACITACION: 'Formación Académica',
  AUTOEVALUACION_ACREDITACION: 'Autoevaluación',
};

/** Suma minutos de bloques horarios (cada bloque con horaInicio/horaFin). */
export function minutosDesdeHorarios(horarios: HorarioBloque[] = []): number {
  return horarios.reduce((sum, h) => {
    const inicio = h?.horaInicio;
    const fin = h?.horaFin;
    if (typeof inicio !== 'string' || typeof fin !== 'string') return sum;
    const [hi, mi] = inicio.split(':').map(Number);
    const [hf, mf] = fin.split(':').map(Number);
    if ([hi, mi, hf, mf].some((n) => Number.isNaN(n))) return sum;
    const fechaInicio = new Date(0, 0, 0, hi, mi);
    const fechaFin = new Date(0, 0, 0, hf, mf);
    return sum + Math.max(0, (fechaFin.getTime() - fechaInicio.getTime()) / 60000);
  }, 0);
}

export function horasDesdeHorarios(horarios: HorarioBloque[] = []): number {
  return Math.round(minutosDesdeHorarios(horarios) / 60);
}

/** Trabajo lectivo semanal (CHL): horas por grupo × número de grupos. */
export function getTrabajoLectivoSemanal(cargasLectivas: CargaLectivaResumen[] = []): number {
  return cargasLectivas.reduce((sum, c) => {
    const grupos = c.grupos_asignados || 0;
    const horas = c.horas_semanales || 0;
    return sum + grupos * horas;
  }, 0);
}

export function getClaveRegimenHoras(docente: DocenteRegimen): ClaveRegimenHoras | null {
  if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
    const tc = docente.tipoContrato;
    if (tc === 'A1' || tc === 'B1') return 'A1B1';
    if (tc === 'A2' || tc === 'B2') return 'A2B2';
    if (tc === 'A3' || tc === 'B3') return 'A3B3';
    return null;
  }

  const regimen = docente.regimenDedicacion;
  if (regimen && ['DE', 'TC', 'TP1', 'TP2', 'TP3'].includes(regimen)) {
    return regimen as ClaveRegimenHoras;
  }

  return null;
}

/**
 * Máximo de horas para Preparación y Evaluación.
 * Ordinarios DE/TC: 50% del trabajo lectivo, redondeado a la baja (13h → 6h).
 * TP1/TP2/TP3 y contratados: valores fijos del reglamento.
 */
export function getMaxHorasPreparacionEvaluacion(
  docente: DocenteRegimen,
  trabajoLectivo: number
): number {
  if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
    const cfg = TIPO_CONTRATO[docente.tipoContrato as TipoContrato];
    return cfg?.chnlpe ?? 0;
  }

  const regimen = docente.regimenDedicacion;
  if (regimen && REGIMEN_DEDICACION[regimen as RegimenDedicacion]) {
    const raw = REGIMEN_DEDICACION[regimen as RegimenDedicacion].getMaxChnlpe(trabajoLectivo);
    return Math.floor(raw);
  }

  return Math.floor(trabajoLectivo * 0.5);
}

/** Límite Art. 12.4 para actividades tabuladas (null si no aplica la tabla). */
export function getMaxHorasArt124(tipo: string, docente: DocenteRegimen): number | null {
  const limites = LIMITES_ART_12_4[tipo];
  if (!limites) return null;
  const clave = getClaveRegimenHoras(docente);
  if (!clave) return null;
  return limites[clave];
}

/**
 * Límite reglamentario por tipo de actividad.
 * `null` = sin tope en matriz (p. ej. gobierno/administración por cargo).
 * `0` = actividad no permitida para el régimen.
 */
export function getMaxHorasActividadNoLectiva(
  tipo: string,
  docente: DocenteRegimen,
  trabajoLectivo: number
): number | null {
  if (tipo === 'PREPARACION_EVALUACION') {
    return getMaxHorasPreparacionEvaluacion(docente, trabajoLectivo);
  }

  if (tipo === 'GOBIERNO' || tipo === 'ADMINISTRACION') {
    return null;
  }

  return getMaxHorasArt124(tipo, docente);
}

/** Texto breve del límite para mostrar en la UI. */
export function getEtiquetaLimiteActividad(
  tipo: string,
  docente: DocenteRegimen,
  trabajoLectivo: number
): string | null {
  const max = getMaxHorasActividadNoLectiva(tipo, docente, trabajoLectivo);
  if (max === null) return null;

  if (tipo === 'PREPARACION_EVALUACION') {
    if (max === 0) return 'No permitida para su régimen';
    return `Máx. ${max}h (50% de ${trabajoLectivo}h lectivas, redondeo a la baja)`;
  }

  if (max === 0) {
    return 'No permitida para su régimen (Art. 12.4)';
  }

  return `Máx. ${max}h semanales (Art. 12.4)`;
}

export function actividadPermitidaParaRegimen(
  tipo: string,
  docente: DocenteRegimen,
  trabajoLectivo: number
): boolean {
  const max = getMaxHorasActividadNoLectiva(tipo, docente, trabajoLectivo);
  return max === null || max > 0;
}
