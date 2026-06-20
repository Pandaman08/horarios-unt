type ConflictoRespuesta = {
  mensaje: string;
  severidad?: 'ERROR' | 'ADVERTENCIA';
  tipo?: string;
};

type ResultadoValidacionRespuesta = {
  error?: string;
  conflictos?: ConflictoRespuesta[];
};

export function obtenerMensajeErrorValidacion(
  result: ResultadoValidacionRespuesta
): string {
  if (result.error?.trim()) {
    return result.error.trim();
  }

  const conflictos = result.conflictos ?? [];
  const errores = conflictos.filter((c) => c.severidad !== 'ADVERTENCIA');
  const relevantes = errores.length > 0 ? errores : conflictos;

  if (relevantes.length === 0) {
    return 'No se pudo reservar este horario. Pruebe otro día, hora o grupo.';
  }

  if (relevantes.length === 1) {
    return relevantes[0].mensaje;
  }

  return relevantes.map((c, i) => `${i + 1}) ${c.mensaje}`).join(' ');
}

export function etiquetaTipoClase(tipo: string): string {
  const t = tipo.toLowerCase();
  if (t.includes('teoria') || t.includes('teoría')) return 'Teoría';
  if (t.includes('laboratorio')) return 'Laboratorio';
  if (t.includes('practica') || t.includes('práctica')) return 'Práctica';
  return tipo;
}
