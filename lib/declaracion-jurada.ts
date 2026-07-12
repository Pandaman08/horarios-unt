import { Docente, CondicionDocente, CategoriaDocente, RegimenDedicacion, TipoContrato } from "@prisma/client";

export const DECLARACIONES_JURADAS = [
  {
    id: 1,
    texto: "Soy docente, ordinario a Dedicación Exclusiva y NO EJERZO cualquier otra actividad o cargo remunerado en otra universidad, entidad pública o privada, fuera de la Universidad Nacional de Trujillo (De conformidad con el Artículo 225° del Estatuto Institucional vigente)."
  },
  {
    id: 2,
    texto: "Soy docente, ordinario a Tiempo Completo y NO EJERZO la misma modalidad en otra entidad pública o privada, así mismo, no tengo otra responsabilidad remunerada en alguna institución pública o privada más de diez (10) horas) semanales, excepto ley expresa que lo permita."
  },
  {
    id: 3,
    texto: "Soy docente, ordinario a Tiempo Parcial y NO TENGO incompatibilidad horaria con mi carga académica en la Universidad Nacional de Trujillo y otra institución donde laboro."
  },
  {
    id: 4,
    texto: "Soy docente, Investigador de la UNT a Dedicación Exclusiva acreditado con Resolución Vicerrectoral y NO ejerzo cualquier otra actividad o cargo remunerado en otra universidad, entidad pública o privada, fuera de la Universidad Nacional de Trujillo (De conformidad con el Artículo 225° del Estatuto Institucional vigente), así mismo en caso de incumplimiento, me someto a las sanciones dispuestas en el Reglamento del Docente Investigador y Promoción de la Investigación, aprobado por R.C.U. N°281-2021/UNT."
  },
  {
    id: 5,
    texto: "Soy docente, Investigador de la UNT a Tiempo Completo acreditado con Resolución Vicerrectoral y NO ejerzo cualquier otra actividad o cargo remunerado en otra universidad, entidad pública o privada, fuera de la Universidad Nacional de Trujillo (De conformidad con el Artículo 225° del Estatuto Institucional vigente), así mismo en caso de incumplimiento, me someto a las sanciones dispuestas en el Reglamento del Docente Investigador y Promoción de la Investigación, aprobado por R.C.U. N°281-2021/UNT."
  },
  {
    id: 6,
    texto: "Soy docente, contratado a Tiempo Completo y NO EJERZO la misma modalidad en otra entidad pública o privada, así mismo, no tengo otra responsabilidad remunerada en alguna institución pública o privada más de diez (10 horas) semanales, excepto ley expresa que lo permita."
  },
  {
    id: 7,
    texto: "Soy docente, contratado a Tiempo Parcial y NO TENGO incompatibilidad horaria con mi carga académica en la Universidad Nacional de Trujillo y otra institución donde laboro."
  },
  {
    id: 8,
    texto: "Soy docente, extraordinario cesante, NO ejerzo cualquier otra actividad o cargo remunerado en otra universidad, entidad pública o privada, fuera de la Universidad Nacional de Trujillo."
  },
  {
    id: 9,
    texto: "Soy docente, extraordinario (Honoris Causa, Emérito, Honorario, Investigador o Visitante) y solo desarrollaré un curso al año, conforme al Art. 10.5 del Reglamento CAD."
  }
];

export function calcularDeclaracionJurada(docente: Docente): string {
  const { condicion, categoriaDocente, regimenDedicacion, tipoContrato, esInvestigadorAcreditado } = docente;

  // Caso 1: Ordinario DE
  if (condicion === CondicionDocente.ORDINARIO && regimenDedicacion === RegimenDedicacion.DE) {
    if (esInvestigadorAcreditado) {
      return DECLARACIONES_JURADAS[3].texto;
    }
    return DECLARACIONES_JURADAS[0].texto;
  }

  // Caso 2: Ordinario TC
  if (condicion === CondicionDocente.ORDINARIO && regimenDedicacion === RegimenDedicacion.TC) {
    if (esInvestigadorAcreditado) {
      return DECLARACIONES_JURADAS[4].texto;
    }
    return DECLARACIONES_JURADAS[1].texto;
  }

  // Caso 3: Ordinario TP1/TP2/TP3
  if (condicion === CondicionDocente.ORDINARIO && typeof regimenDedicacion === 'string' && ['TP1', 'TP2', 'TP3'].includes(regimenDedicacion)) {
    return DECLARACIONES_JURADAS[2].texto;
  }

  // Caso 4: Contratado TC
  if (condicion === CondicionDocente.CONTRATADO && (tipoContrato === 'A1' || tipoContrato === 'B1')) {
    return DECLARACIONES_JURADAS[5].texto;
  }

  // Caso 5: Contratado TP
  if (condicion === CondicionDocente.CONTRATADO && typeof tipoContrato === 'string' && ['A2', 'A3', 'B2', 'B3'].includes(tipoContrato)) {
    return DECLARACIONES_JURADAS[6].texto;
  }

  // Caso 6: Extraordinario Cesante (asumimos por categoria o tipoExtraordinario)
  if (condicion === CondicionDocente.EXTRAORDINARIO) {
    if (docente.tipoExtraordinario === null) { // Cesante no tiene tipoExtraordinario
      return DECLARACIONES_JURADAS[7].texto;
    }
    return DECLARACIONES_JURADAS[8].texto;
  }

  // Fallback a opción 9 y log warning
  console.warn(`No se encontró una combinación exacta para el docente ${docente.id_docente}. Usando opción 9.`, {
    condicion,
    categoriaDocente,
    regimenDedicacion,
    tipoContrato
  });
  
  return DECLARACIONES_JURADAS[8].texto;
}

type DocenteJurada = Pick<
  Docente,
  | 'id_docente'
  | 'condicion'
  | 'categoriaDocente'
  | 'regimenDedicacion'
  | 'tipoContrato'
  | 'esInvestigadorAcreditado'
  | 'tipoExtraordinario'
>;

const ESTADOS_CON_JURADA = ['ENVIADO', 'VALIDADO_DEPARTAMENTO', 'APROBADO', 'RECHAZADO'] as const;

function esCodigoLegacyOpcion(valor: string): boolean {
  return /^OPCION_\d+$/i.test(valor.trim());
}

/** Convierte códigos legacy (OPCION_1 … OPCION_9) al texto legal completo. */
export function textoDesdeCodigoOpcion(codigo: string): string | null {
  const match = codigo.trim().match(/^OPCION_(\d+)$/i);
  if (!match) return null;
  const idx = Number.parseInt(match[1], 10) - 1;
  if (idx >= 0 && idx < DECLARACIONES_JURADAS.length) {
    return DECLARACIONES_JURADAS[idx].texto;
  }
  return null;
}

function esTextoJuradaCompleto(valor: string): boolean {
  const t = valor.trim();
  return t.startsWith('Soy docente') || t.length > 80;
}

/** Texto de declaración jurada: usa el guardado al enviar o lo calcula del perfil docente. */
export function resolverDeclaracionJurada(
  declaracion: { declaracionJuradaOpcion?: string | null; estado?: string },
  docente?: DocenteJurada | null
): string | null {
  const guardado = declaracion.declaracionJuradaOpcion?.trim();

  if (guardado) {
    if (esCodigoLegacyOpcion(guardado)) {
      const desdeCodigo = textoDesdeCodigoOpcion(guardado);
      if (desdeCodigo) return desdeCodigo;
    } else if (esTextoJuradaCompleto(guardado)) {
      return guardado;
    }
  }

  if (
    docente &&
    declaracion.estado &&
    ESTADOS_CON_JURADA.includes(declaracion.estado as (typeof ESTADOS_CON_JURADA)[number])
  ) {
    return calcularDeclaracionJurada(docente as Docente);
  }

  if (guardado && esCodigoLegacyOpcion(guardado)) {
    return textoDesdeCodigoOpcion(guardado);
  }

  return guardado || null;
}
