import {
  REGIMEN_DEDICACION,
  TIPO_CONTRATO,
  type RegimenDedicacion,
  type TipoContrato,
} from '@/lib/constants/regimenHoras';

export interface DocenteHorasProfile {
  condicion?: string | null;
  regimenDedicacion?: string | null;
  tipoContrato?: string | null;
  horas_maximas_semanales?: number | null;
}

export interface DisponibilidadSlot {
  disponible: boolean;
}

export interface ValidacionDisponibilidad {
  valido: boolean;
  horasDisponibles: number;
  horasMaximas: number;
  mensaje?: string;
  etiquetaRegimen: string;
}

/** Horas semanales máximas según condición, régimen o tipo de contrato del docente. */
export function getHorasMaximasSemanales(docente: DocenteHorasProfile): number {
  if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
    return TIPO_CONTRATO[docente.tipoContrato as TipoContrato]?.totalHoras ?? 0;
  }
  if (docente.regimenDedicacion) {
    return REGIMEN_DEDICACION[docente.regimenDedicacion as RegimenDedicacion]?.totalHoras ?? 0;
  }
  if (docente.horas_maximas_semanales && docente.horas_maximas_semanales > 0) {
    return docente.horas_maximas_semanales;
  }
  return 0;
}

export function contarHorasDisponibles(slots: DisponibilidadSlot[]): number {
  return slots.filter((s) => s.disponible).length;
}

export function getEtiquetaRegimenHoras(docente: DocenteHorasProfile): string {
  if (docente.condicion === 'CONTRATADO' && docente.tipoContrato) {
    const cfg = TIPO_CONTRATO[docente.tipoContrato as TipoContrato];
    if (!cfg) return '';
    const pe = cfg.chnlpe > 0 ? ` + ${cfg.chnlpe} PE` : '';
    const comp = cfg.chnlc > 0 ? ` + ${cfg.chnlc} complementarias` : '';
    return `${docente.tipoContrato}: ${cfg.totalHoras}h semanales (${cfg.lectivaMin} lectivas${pe}${comp})`;
  }

  if (docente.regimenDedicacion) {
    const cfg = REGIMEN_DEDICACION[docente.regimenDedicacion as RegimenDedicacion];
    const labels: Record<string, string> = {
      DE: 'Dedicación Exclusiva (DE)',
      TC: 'Tiempo Completo (TC)',
      TP1: 'Tiempo Parcial 1 (TP1)',
      TP2: 'Tiempo Parcial 2 (TP2)',
      TP3: 'Tiempo Parcial 3 (TP3)',
    };
    if (cfg) {
      return `${labels[docente.regimenDedicacion] ?? docente.regimenDedicacion}: ${cfg.totalHoras}h semanales`;
    }
  }

  return '';
}

export function validarDisponibilidadHoras(
  docente: DocenteHorasProfile,
  slots: DisponibilidadSlot[]
): ValidacionDisponibilidad {
  const horasMaximas = getHorasMaximasSemanales(docente);
  const horasDisponibles = contarHorasDisponibles(slots);
  const etiquetaRegimen = getEtiquetaRegimenHoras(docente);

  if (horasMaximas === 0) {
    return {
      valido: false,
      horasDisponibles,
      horasMaximas,
      etiquetaRegimen,
      mensaje:
        'El docente no tiene régimen de dedicación ni tipo de contrato configurado. Actualice los datos del docente antes de registrar disponibilidad.',
    };
  }

  if (horasDisponibles > horasMaximas) {
    const detalle = etiquetaRegimen ? ` (${etiquetaRegimen})` : '';
    return {
      valido: false,
      horasDisponibles,
      horasMaximas,
      etiquetaRegimen,
      mensaje: `La disponibilidad registrada (${horasDisponibles}h) excede el máximo permitido de ${horasMaximas}h semanales${detalle}.`,
    };
  }

  return {
    valido: true,
    horasDisponibles,
    horasMaximas,
    etiquetaRegimen,
  };
}
