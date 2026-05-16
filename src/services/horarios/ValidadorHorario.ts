import { prisma } from '@/lib/prisma';

export interface ValidacionResultado {
  valido: boolean;
  error?: string;
  tipo?: string;
}

export class ValidadorHorario {
  /**
   * Ejecuta las 8 validaciones obligatorias en paralelo
   */
  static async validarAsignacion(params: {
    id_docente: number;
    id_curso: number;
    id_grupo: number;
    id_ambiente: number;
    id_periodo: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    tipo_clase: string;
  }): Promise<ValidacionResultado> {
    const validations = [
      this.validarCruceDocente(params),
      this.validarCruceGrupo(params),
      this.validarOcupacionAmbiente(params),
      this.validarExcesoCargaDiaria(params),
      this.validarFranjaInstitucional(params),
      this.validarCursoAsignable(params),
      this.validarAmbienteValido(params),
      this.validarHorasCompletadas(params),
    ];

    const resultados = await Promise.all(validations);
    const fallos = resultados.filter(r => !r.valido);

    if (fallos.length > 0) {
      // Registrar conflicto en la base de datos
      for (const fallo of fallos) {
        await prisma.conflictoHorario.create({
          data: {
            id_periodo: params.id_periodo,
            id_docente: params.id_docente,
            tipo_conflicto: fallo.tipo || 'desconocido',
            descripcion: fallo.error || 'Conflicto detectado',
            fecha_deteccion: new Date(),
            resuelto: false
          }
        });
      }
      return fallos[0];
    }

    return { valido: true };
  }

  // 1. Cruce de docente
  private static async validarCruceDocente(p: any): Promise<ValidacionResultado> {
    const cruceDefinitivo = await prisma.horarioAsignado.findFirst({
      where: {
        id_docente: p.id_docente,
        id_periodo: p.id_periodo,
        dia_semana: p.dia_semana,
        OR: [
          { hora_inicio: { lte: p.hora_inicio }, hora_fin: { gt: p.hora_inicio } },
          { hora_inicio: { lt: p.hora_fin }, hora_fin: { gte: p.hora_fin } },
          { hora_inicio: { gte: p.hora_inicio }, hora_fin: { lte: p.hora_fin } }
        ]
      }
    });

    if (cruceDefinitivo) return { valido: false, error: 'El docente ya tiene una clase en este horario.', tipo: 'cruce_docente' };

    const cruceTemporal = await prisma.seleccionTemporalHorario.findFirst({
      where: {
        id_docente: p.id_docente,
        id_periodo: p.id_periodo,
        dia_semana: p.dia_semana,
        fecha_expiracion: { gt: new Date() },
        OR: [
          { hora_inicio: { lte: p.hora_inicio }, hora_fin: { gt: p.hora_inicio } },
          { hora_inicio: { lt: p.hora_fin }, hora_fin: { gte: p.hora_fin } }
        ]
      }
    });

    if (cruceTemporal) return { valido: false, error: 'El docente tiene una selección temporal en este horario.', tipo: 'cruce_docente' };

    return { valido: true };
  }

  // 2. Cruce de grupo
  private static async validarCruceGrupo(p: any): Promise<ValidacionResultado> {
    const cruce = await prisma.horarioAsignado.findFirst({
      where: {
        id_grupo: p.id_grupo,
        id_periodo: p.id_periodo,
        dia_semana: p.dia_semana,
        OR: [
          { hora_inicio: { lte: p.hora_inicio }, hora_fin: { gt: p.hora_inicio } },
          { hora_inicio: { lt: p.hora_fin }, hora_fin: { gte: p.hora_fin } }
        ]
      }
    });

    if (cruce) return { valido: false, error: 'El grupo ya tiene otra clase en este horario.', tipo: 'cruce_grupo' };
    return { valido: true };
  }

  // 3. Ocupación de ambiente
  private static async validarOcupacionAmbiente(p: any): Promise<ValidacionResultado> {
    const ocupado = await prisma.horarioAsignado.findFirst({
      where: {
        id_ambiente: p.id_ambiente,
        id_periodo: p.id_periodo,
        dia_semana: p.dia_semana,
        OR: [
          { hora_inicio: { lte: p.hora_inicio }, hora_fin: { gt: p.hora_inicio } },
          { hora_inicio: { lt: p.hora_fin }, hora_fin: { gte: p.hora_fin } }
        ]
      }
    });

    if (ocupado) return { valido: false, error: 'El ambiente ya está ocupado en este horario.', tipo: 'cruce_ambiente' };
    return { valido: true };
  }

  // 4. Exceso de carga diaria (máximo 8 horas)
  private static async validarExcesoCargaDiaria(p: any): Promise<ValidacionResultado> {
    const asignados = await prisma.horarioAsignado.findMany({
      where: { id_docente: p.id_docente, id_periodo: p.id_periodo, dia_semana: p.dia_semana }
    });

    let minutosTotales = 0;
    asignados.forEach(a => {
      const inicio = this.timeToMinutes(a.hora_inicio);
      const fin = this.timeToMinutes(a.hora_fin);
      minutosTotales += (fin - inicio);
    });

    const actualInicio = this.timeToMinutes(p.hora_inicio);
    const actualFin = this.timeToMinutes(p.hora_fin);
    minutosTotales += (actualFin - actualInicio);

    if (minutosTotales > 8 * 60) {
      return { valido: false, error: 'El docente supera el máximo de 8 horas diarias.', tipo: 'exceso_carga' };
    }
    return { valido: true };
  }

  // 5. Fuera de franja institucional (07:00-22:00, no almuerzo 12-13)
  private static async validarFranjaInstitucional(p: any): Promise<ValidacionResultado> {
    const inicio = this.timeToMinutes(p.hora_inicio);
    const fin = this.timeToMinutes(p.hora_fin);

    if (inicio < this.timeToMinutes("07:00") || fin > this.timeToMinutes("22:00")) {
      return { valido: false, error: 'Horario fuera de la franja institucional (07:00 - 22:00).', tipo: 'franja_institucional' };
    }

    // Cruce con hora de almuerzo (12:00 - 13:00)
    const almuerzoInicio = this.timeToMinutes("12:00");
    const almuerzoFin = this.timeToMinutes("13:00");

    if ((inicio < almuerzoFin && fin > almuerzoInicio)) {
      return { valido: false, error: 'Cruce con la hora de almuerzo (12:00 - 13:00).', tipo: 'franja_institucional' };
    }

    return { valido: true };
  }

  // 6. Curso no asignable al docente
  private static async validarCursoAsignable(p: any): Promise<ValidacionResultado> {
    const asignable = await prisma.docenteCurso.findFirst({
      where: { id_docente: p.id_docente, id_curso: p.id_curso, tipo_clase: p.tipo_clase, activo: true }
    });

    if (!asignable) return { valido: false, error: 'El docente no está habilitado para dictar este curso/tipo.', tipo: 'curso_no_asignable' };
    return { valido: true };
  }

  // 7. Ambiente no válido para el curso/tipo
  private static async validarAmbienteValido(p: any): Promise<ValidacionResultado> {
    const valido = await prisma.cursoAmbiente.findFirst({
      where: { id_curso: p.id_curso, id_ambiente: p.id_ambiente, tipo_clase: p.tipo_clase }
    });

    if (!valido) return { valido: false, error: 'El ambiente seleccionado no es válido para este curso.', tipo: 'ambiente_no_valido' };
    return { valido: true };
  }

  // 8. Horas completadas del curso
  private static async validarHorasCompletadas(p: any): Promise<ValidacionResultado> {
    const curso = await prisma.curso.findUnique({ where: { id_curso: p.id_curso } });
    if (!curso) return { valido: false, error: 'Curso no encontrado.' };

    const horasRequeridas = p.tipo_clase === 'teoria' ? curso.horas_teoria : curso.horas_laboratorio;
    
    const asignados = await prisma.horarioAsignado.findMany({
      where: { id_curso: p.id_curso, id_grupo: p.id_grupo, tipo_clase: p.tipo_clase, id_periodo: p.id_periodo }
    });

    let minutosAsignados = 0;
    asignados.forEach(a => {
      minutosAsignados += (this.timeToMinutes(a.hora_fin) - this.timeToMinutes(a.hora_inicio));
    });

    const minutosActual = (this.timeToMinutes(p.hora_fin) - this.timeToMinutes(p.hora_inicio));
    
    if ((minutosAsignados + minutosActual) > (horasRequeridas * 60)) {
      return { valido: false, error: 'Se supera el total de horas requeridas para este curso.', tipo: 'horas_completadas' };
    }

    return { valido: true };
  }

  private static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
