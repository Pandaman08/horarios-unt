export type GrupoBasico = {
  id_grupo: number;
  codigo_grupo: string;
};

export function esGrupoLaboratorio(codigo: string): boolean {
  return /^L\d+$/i.test(codigo.trim());
}

export function esGrupoSeccion(codigo: string): boolean {
  const c = codigo.trim();
  return /^[A-Z]$/i.test(c) && !esGrupoLaboratorio(c);
}

export function gruposPorDefectoSegunTipo(tipoClase: string): number {
  const tipo = tipoClase.toLowerCase();
  if (tipo === 'laboratorio') return 1;
  if (tipo === 'teoria' || tipo === 'practica') return 1;
  return 0;
}

export function filtrarGruposSegunCargaLectiva(
  grupos: GrupoBasico[],
  tipoClase: string,
  gruposAsignados?: number | null
): GrupoBasico[] {
  const tipo = tipoClase.toLowerCase();
  const limite = gruposAsignados && gruposAsignados > 0 ? gruposAsignados : undefined;

  let filtrados: GrupoBasico[];

  if (tipo === 'laboratorio') {
    filtrados = grupos.filter((g) => esGrupoLaboratorio(g.codigo_grupo));
    if (filtrados.length === 0) {
      filtrados = [...grupos];
    }
  } else {
    filtrados = grupos.filter((g) => esGrupoSeccion(g.codigo_grupo));
    if (filtrados.length === 0) {
      filtrados = grupos.filter((g) => !esGrupoLaboratorio(g.codigo_grupo));
    }
    if (filtrados.length === 0) {
      filtrados = [...grupos];
    }
  }

  if (limite) {
    return filtrados.slice(0, limite);
  }

  return filtrados;
}
