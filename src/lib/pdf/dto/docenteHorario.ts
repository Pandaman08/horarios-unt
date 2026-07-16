import type { DocenteHorarioPdfDto, DocenteHorarioPdfItem } from '../types/docenteHorario';

interface CreateDocenteHorarioPdfDtoInput {
  docente: {
    id_docente: number;
    nombres: string;
    apellidos: string;
    codigo_docente?: string | null;
  };
  periodo: {
    id_periodo: number;
    nombre?: string | null;
    anio?: number | string | null;
    semestre?: string | null;
  };
  escuela?: {
    nombre?: string | null;
    codigo?: string | null;
  } | null;
  horarios: unknown[];
}

export function createDocenteHorarioPdfDto(input: CreateDocenteHorarioPdfDtoInput): DocenteHorarioPdfDto {
  const horarios: DocenteHorarioPdfItem[] = input.horarios.map((item) => {
    const sourceItem = item as Record<string, unknown>;

    return {
      id_asignacion: (sourceItem.id_asignacion as number | null) ?? null,
      dia_semana: (sourceItem.dia_semana as number | null) ?? (sourceItem.dia as number | null) ?? null,
      hora_inicio: (sourceItem.hora_inicio as string | null) ?? (sourceItem.horaInicio as string | null) ?? null,
      hora_fin: (sourceItem.hora_fin as string | null) ?? (sourceItem.horaFin as string | null) ?? null,
      tipo_clase: (sourceItem.tipo_clase as string | null) ?? (sourceItem.tipo as string | null) ?? null,
      curso: (sourceItem.curso as DocenteHorarioPdfItem['curso']) ?? null,
      grupo: (sourceItem.grupo as DocenteHorarioPdfItem['grupo']) ?? null,
      ambiente: (sourceItem.ambiente as DocenteHorarioPdfItem['ambiente']) ?? null,
      docente: (sourceItem.docente as DocenteHorarioPdfItem['docente']) ?? null,
    };
  });

  const totalClases = horarios.length;
  const totalCursos = new Set(horarios.map((item) => item.curso?.nombre ?? 'sin-curso')).size;
  const totalHoras = horarios.reduce((acc, item) => {
    if (!item.hora_inicio || !item.hora_fin) return acc;
    const [startHour, startMinute] = item.hora_inicio.split(':').map(Number);
    const [endHour, endMinute] = item.hora_fin.split(':').map(Number);
    return acc + Math.max(0, ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60);
  }, 0);

  return {
    docente: {
      id_docente: input.docente.id_docente,
      nombres: input.docente.nombres,
      apellidos: input.docente.apellidos,
      codigo_docente: input.docente.codigo_docente ?? null,
    },
    periodo: {
      id_periodo: input.periodo.id_periodo,
      nombre: input.periodo.nombre ?? null,
      anio: input.periodo.anio ?? null,
      semestre: input.periodo.semestre ?? null,
    },
    escuela: input.escuela ?? null,
    horarios,
    resumen: {
      totalClases,
      totalHoras: Number(totalHoras.toFixed(2)),
      totalCursos,
      totalNoLectivas: 0,
    },
  };
}
