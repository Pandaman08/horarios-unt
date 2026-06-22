export interface RegimenDedicacionConfig {
  totalHoras: number;
  lectivaMin: number;
  lectivaMax: number;
  /** Calcula el máximo de CHNLPE+ basado en la CHL asignada */
  getMaxChnlpe: (chlAsignada: number) => number;
}

export interface TipoContratoConfig {
  totalHoras: number;
  lectivaMin: number;
  chnlpe: number;
  chnlc: number;
}

// Reglamento Oficial: Ordinarios (DE, TC, TP1, TP2, TP3)
export const REGIMEN_DEDICACION: Record<string, RegimenDedicacionConfig> = {
  DE: {
    totalHoras: 40,
    lectivaMin: 16,
    lectivaMax: 22,
    getMaxChnlpe: (chlAsignada: number) => chlAsignada * 0.5, // 50% de la CHL asignada
  },
  TC: {
    totalHoras: 40,
    lectivaMin: 16,
    lectivaMax: 22,
    getMaxChnlpe: (chlAsignada: number) => chlAsignada * 0.5, // Mismo que DE
  },
  TP1: {
    totalHoras: 20,
    lectivaMin: 12,
    lectivaMax: 12, // TP1 tiene CHLM- fijo
    getMaxChnlpe: () => 4, // CHNLPE+ fijo para TP1
  },
  TP2: {
    totalHoras: 10,
    lectivaMin: 8,
    lectivaMax: 8, // TP2 tiene CHLM- fijo
    getMaxChnlpe: () => 2, // CHNLPE+ fijo para TP2
  },
  TP3: {
    totalHoras: 8,
    lectivaMin: 8,
    lectivaMax: 8, // TP3 tiene CHLM- fijo
    getMaxChnlpe: () => 0, // No asume CHNLPE
  },
} as const;

// Reglamento Oficial: Contratados (A1/A2/A3/B1/B2/B3)
export const TIPO_CONTRATO: Record<string, TipoContratoConfig> = {
  A1: {
    totalHoras: 32,
    lectivaMin: 20,
    chnlpe: 6,
    chnlc: 6,
  },
  A2: {
    totalHoras: 16,
    lectivaMin: 12,
    chnlpe: 2,
    chnlc: 2,
  },
  A3: {
    totalHoras: 8,
    lectivaMin: 8,
    chnlpe: 0,
    chnlc: 0,
  },
  B1: {
    totalHoras: 32,
    lectivaMin: 20,
    chnlpe: 6,
    chnlc: 6,
  },
  B2: {
    totalHoras: 16,
    lectivaMin: 12,
    chnlpe: 2,
    chnlc: 2,
  },
  B3: {
    totalHoras: 8,
    lectivaMin: 8,
    chnlpe: 0,
    chnlc: 0,
  },
} as const;

export type RegimenDedicacion = keyof typeof REGIMEN_DEDICACION;
export type TipoContrato = keyof typeof TIPO_CONTRATO;

export const TIPO_PERSONAL_APOYO = {
  JEFE_PRACTICA: "JEFE_PRACTICA",
} as const;

export type TipoPersonalApoyo = keyof typeof TIPO_PERSONAL_APOYO;
