import { prisma } from '@/lib/prisma';

export class ServicioHorariosDocente {
  /**
   * Obtiene el horario personal de un docente para un período académico
   * @param id_docente - ID del docente
   * @param id_periodo - ID del período académico (opcional, usa el activo si no se proporciona)
   */
  static async obtenerHorarioDocente(id_docente: number, id_periodo?: number) {
    let periodoId = id_periodo;

    if (!periodoId) {
      const periodoActivo = await prisma.periodoAcademico.findFirst({
        where: { activo: true }
      });
      if (!periodoActivo) throw new Error('No hay período académico activo');
      periodoId = periodoActivo.id_periodo;
    }

    // Verificar que el período exista
    const periodo = await prisma.periodoAcademico.findUnique({
      where: { id_periodo: periodoId }
    });
    if (!periodo) throw new Error('Período académico no encontrado');

    // Obtener horarios asignados con información completa
    const horarios = await prisma.horarioAsignado.findMany({
      where: {
        id_docente,
        id_periodo: periodoId
      },
      include: {
        curso: {
          select: {
            id_curso: true,
            codigo: true,
            nombre: true,
            creditos: true,
            ciclo_rel: true
          }
        },
        grupo: {
          select: {
            id_grupo: true,
            codigo_grupo: true
          }
        },
        ambiente: {
          select: {
            id_ambiente: true,
            codigo: true,
            nombre: true,
            capacidad: true
          }
        }
      },
      orderBy: [
        { dia_semana: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    // Formatear la respuesta (mismo formato que el endpoint)
    const horariosFormato = horarios.map((h) => ({
      id_asignacion: h.id_asignacion,
      id_curso: h.id_curso,
      id_grupo: h.id_grupo,
      id_ambiente: h.id_ambiente,
      curso_codigo: h.curso.codigo,
      curso_nombre: h.curso.nombre,
      grupo_codigo: h.grupo.codigo_grupo,
      ambiente_codigo: h.ambiente.codigo,
      ambiente_nombre: h.ambiente.nombre,
      tipo_clase: h.tipo_clase,
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio,
      hora_fin: h.hora_fin,
      ciclo_nombre: h.curso.ciclo_rel?.nombre || ''
    }));

    return {
      periodoId,
      periodoActivo: periodo.activo,
      horarios: horariosFormato
    };
  }
}
