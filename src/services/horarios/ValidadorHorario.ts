import { prisma } from '@/lib/prisma';
import { MAX_HORAS_DIARIAS } from '@/lib/constantes';
import { emitirEvento } from '@/lib/socket-server';

export interface SolicitudAsignacion {
  docenteId: number;
  cursoId: number;
  grupoId: number;
  tipoClase: string;
  ambienteId: number;
  diaSemana: number;   // 0=Lunes,...,5=Sábado
  horaInicio: string;  // formato 'HH:MM'
  horaFin: string;
  periodoId: number;   // id del período académico
  asignacionId?: number; // para ediciones, excluirse a sí mismo
}

export interface Conflicto {
  tipo: 'CRUCE_DOCENTE' | 'CRUCE_GRUPO' | 'OCUPACION_AMBIENTE' | 'EXCESO_HORAS_DIARIAS' | 'FUERA_FRANJA' | 'CURSO_NO_ASIGNABLE' | 'AMBIENTE_NO_VALIDO' | 'HORAS_COMPLETADAS';
  mensaje: string;     // texto legible
  severidad: 'ERROR' | 'ADVERTENCIA';
  detalle?: any;
}

export interface ResultadoValidacion {
  valido: boolean;
  conflictos: Conflicto[];
  tiempoValidacion: number; // ms
}

export class ValidadorHorario {
  /**
   * Ejecuta las 8 validaciones obligatorias en paralelo
   */
  static async validarAsignacion(solicitud: SolicitudAsignacion): Promise<ResultadoValidacion> {
    const inicio = performance.now();

    const validaciones = [
      this.validarCruceDocente(solicitud),
      this.validarCruceGrupo(solicitud),
      this.validarOcupacionAmbiente(solicitud),
      this.validarExcesoCargaDiaria(solicitud),
      this.validarFranjaInstitucional(solicitud),
      this.validarCursoAsignable(solicitud),
      this.validarAmbienteValido(solicitud),
      this.validarHorasCompletadas(solicitud),
    ];

    const resultados = await Promise.all(validaciones);
    const conflictos = resultados.flat();
    
    const fin = performance.now();
    const tiempoValidacion = fin - inicio;

    const tieneErrores = conflictos.some(c => c.severidad === 'ERROR');

    // Registrar conflictos de tipo ERROR de forma asíncrona
    if (tieneErrores) {
      this.registrarConflictos(solicitud, conflictos.filter(c => c.severidad === 'ERROR')).catch(err => {
        console.error('Error al registrar conflictos:', err);
      });
    }

    // Validación: Bloques mínimos (mínimo 2 casillas horarias consecutivas)
    // Nota: El motor actual asigna bloques de 1 hora. Esta validación asegura que si se programa algo, 
    // sea por al menos 2 horas si el curso tiene carga suficiente.

    return {
      valido: !tieneErrores,
      conflictos,
      tiempoValidacion
    };
  }

  /**
   * Valida si el horario cumple con el mínimo de 2 bloques por curso programado
   */
  static validarBloquesMinimos(horarios: any[]): { valido: boolean; error?: string } {
    const bloquesPorCurso = new Map<number, number>();
    horarios.forEach(h => {
      bloquesPorCurso.set(h.id_curso, (bloquesPorCurso.get(h.id_curso) || 0) + 1);
    });

    for (const [id_curso, cantidad] of bloquesPorCurso.entries()) {
      if (cantidad < 2) {
        return { 
          valido: false, 
          error: `El curso con ID ${id_curso} tiene programado solo ${cantidad} bloque(s). Debe tener al menos 2.` 
        };
      }
    }
    return { valido: true };
  }

  // 1. Cruce de docente
  private static async validarCruceDocente(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    
    // Buscar en horario_asignado
    const cruceAsignado = await prisma.horarioAsignado.findFirst({
      where: {
        id_docente: s.docenteId,
        id_periodo: s.periodoId,
        dia_semana: s.diaSemana,
        id_asignacion: s.asignacionId ? { not: s.asignacionId } : undefined,
        OR: [
          { hora_inicio: { lte: s.horaInicio }, hora_fin: { gt: s.horaInicio } },
          { hora_inicio: { lt: s.horaFin }, hora_fin: { gte: s.horaFin } },
          { hora_inicio: { gte: s.horaInicio }, hora_fin: { lte: s.horaFin } }
        ]
      },
      include: { curso: true }
    });

    if (cruceAsignado) {
      conflictos.push({
        tipo: 'CRUCE_DOCENTE',
        mensaje: `El docente ya tiene una clase asignada (${cruceAsignado.curso.nombre}) en este horario.`,
        severidad: 'ERROR',
        detalle: { id_asignacion: cruceAsignado.id_asignacion }
      });
    }

    // Buscar en seleccion_temporal_horario
    const cruceTemporal = await prisma.seleccionTemporalHorario.findFirst({
      where: {
        id_docente: s.docenteId,
        id_periodo: s.periodoId,
        dia_semana: s.diaSemana,
        fecha_expiracion: { gt: new Date() },
        OR: [
          { hora_inicio: { lte: s.horaInicio }, hora_fin: { gt: s.horaInicio } },
          { hora_inicio: { lt: s.horaFin }, hora_fin: { gte: s.horaFin } },
          { hora_inicio: { gte: s.horaInicio }, hora_fin: { lte: s.horaFin } }
        ]
      },
      include: { curso: true }
    });

    if (cruceTemporal) {
      conflictos.push({
        tipo: 'CRUCE_DOCENTE',
        mensaje: `El docente tiene una selección temporal bloqueada para el curso ${cruceTemporal.curso.nombre}.`,
        severidad: 'ERROR',
        detalle: { id_seleccion: cruceTemporal.id_seleccion }
      });
    }

    return conflictos;
  }

  // 2. Cruce de grupo
  private static async validarCruceGrupo(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    const cruce = await prisma.horarioAsignado.findFirst({
      where: {
        id_grupo: s.grupoId,
        id_periodo: s.periodoId,
        dia_semana: s.diaSemana,
        id_asignacion: s.asignacionId ? { not: s.asignacionId } : undefined,
        OR: [
          { hora_inicio: { lte: s.horaInicio }, hora_fin: { gt: s.horaInicio } },
          { hora_inicio: { lt: s.horaFin }, hora_fin: { gte: s.horaFin } }
        ]
      },
      include: { curso: true }
    });

    if (cruce) {
      conflictos.push({
        tipo: 'CRUCE_GRUPO',
        mensaje: `El grupo ya tiene el curso ${cruce.curso.nombre} asignado en este horario.`,
        severidad: 'ERROR'
      });
    }

    return conflictos;
  }

  // 3. Ocupación de ambiente
  private static async validarOcupacionAmbiente(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    const ocupado = await prisma.horarioAsignado.findFirst({
      where: {
        id_ambiente: s.ambienteId,
        id_periodo: s.periodoId,
        dia_semana: s.diaSemana,
        id_asignacion: s.asignacionId ? { not: s.asignacionId } : undefined,
        OR: [
          { hora_inicio: { lte: s.horaInicio }, hora_fin: { gt: s.horaInicio } },
          { hora_inicio: { lt: s.horaFin }, hora_fin: { gte: s.horaFin } }
        ]
      }
    });

    if (ocupado) {
      conflictos.push({
        tipo: 'OCUPACION_AMBIENTE',
        mensaje: 'El ambiente seleccionado ya está ocupado en este horario.',
        severidad: 'ERROR'
      });
    }

    return conflictos;
  }

  // 4. Exceso de carga diaria
  private static async validarExcesoCargaDiaria(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    
    // Obtener horas ya asignadas
    const asignados = await prisma.horarioAsignado.findMany({
      where: { 
        id_docente: s.docenteId, 
        id_periodo: s.periodoId, 
        dia_semana: s.diaSemana,
        id_asignacion: s.asignacionId ? { not: s.asignacionId } : undefined
      }
    });

    let minutosTotales = 0;
    asignados.forEach((a:any) => {
      minutosTotales += (this.timeToMinutes(a.hora_fin) - this.timeToMinutes(a.hora_inicio));
    });

    // Sumar nueva duración
    minutosTotales += (this.timeToMinutes(s.horaFin) - this.timeToMinutes(s.horaInicio));

    if (minutosTotales > MAX_HORAS_DIARIAS * 60) {
      conflictos.push({
        tipo: 'EXCESO_HORAS_DIARIAS',
        mensaje: `El docente superaría las ${MAX_HORAS_DIARIAS} horas diarias permitidas.`,
        severidad: 'ERROR',
        detalle: { horasActuales: minutosTotales / 60 }
      });
    }
    return conflictos;
  }

  // 5. Fuera de franja institucional
  private static async validarFranjaInstitucional(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    const inicio = this.timeToMinutes(s.horaInicio);
    const fin = this.timeToMinutes(s.horaFin);

    if (inicio < this.timeToMinutes("07:00") || fin > this.timeToMinutes("22:00")) {
      conflictos.push({
        tipo: 'FUERA_FRANJA',
        mensaje: 'El horario solicitado está fuera de la franja permitida (07:00 - 22:00).',
        severidad: 'ERROR'
      });
    }

    // Bloque de almuerzo (12:00 - 13:00)
    const almuerzoInicio = this.timeToMinutes("12:00");
    const almuerzoFin = this.timeToMinutes("13:00");

    if ((inicio < almuerzoFin && fin > almuerzoInicio)) {
      conflictos.push({
        tipo: 'FUERA_FRANJA',
        mensaje: 'El horario interfiere con el bloque de almuerzo institucional (12:00 - 13:00).',
        severidad: 'ADVERTENCIA'
      });
    }

    return conflictos;
  }

  // 6. Curso no asignable al docente
  private static async validarCursoAsignable(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    const habilitado = await prisma.docenteCurso.findFirst({
      where: { 
        id_docente: s.docenteId, 
        id_curso: s.cursoId, 
        tipo_clase: s.tipoClase, 
        activo: true 
      }
    });

    if (!habilitado) {
      conflictos.push({
        tipo: 'CURSO_NO_ASIGNABLE',
        mensaje: 'El docente no tiene asignado este curso o tipo de clase en su carga académica.',
        severidad: 'ERROR'
      });
    }
    return conflictos;
  }

  // 7. Ambiente no válido para el curso/tipo
  private static async validarAmbienteValido(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    
    // Verificamos solo que el ambiente exista y esté activo
    const ambiente = await prisma.ambiente.findUnique({
      where: { id_ambiente: s.ambienteId }
    });

    if (!ambiente || !ambiente.activo) {
      conflictos.push({
        tipo: 'AMBIENTE_NO_VALIDO',
        mensaje: 'El ambiente seleccionado no existe o no está activo.',
        severidad: 'ERROR'
      });
    }

    // Opcional: Podríamos validar que el tipo de ambiente coincida (ej: laboratorio para laboratorio)
    // Pero por ahora damos libertad total como solicitó el usuario
    
    return conflictos;
  }

  // 8. Horas completadas del curso
  private static async validarHorasCompletadas(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    const curso = await prisma.curso.findUnique({ where: { id_curso: s.cursoId } });
    if (!curso) return conflictos;

    let horasTope = 0;
    const tipo = s.tipoClase.toLowerCase();
    if (tipo.includes('teoria')) horasTope = curso.horas_teoria;
    else if (tipo.includes('laboratorio')) horasTope = curso.horas_laboratorio;
    else if (tipo.includes('practica')) horasTope = curso.horas_practica;
    else if (tipo.includes('práctica')) horasTope = curso.horas_practica;
    
    // Sumar horas ya asignadas (confirmadas)
    const asignados = await prisma.horarioAsignado.findMany({
      where: { 
        id_curso: s.cursoId, 
        id_grupo: s.grupoId, 
        tipo_clase: s.tipoClase, 
        id_periodo: s.periodoId,
        id_asignacion: s.asignacionId ? { not: s.asignacionId } : undefined
      }
    });

    // Sumar selecciones temporales vigentes
    const temporales = await prisma.seleccionTemporalHorario.findMany({
      where: {
        id_curso: s.cursoId,
        id_grupo: s.grupoId,
        tipo_clase: s.tipoClase,
        id_periodo: s.periodoId,
        fecha_expiracion: { gt: new Date() }
      }
    });

    let minutosTotales = 0;
    (asignados as any[]).forEach((a: any) => {
      minutosTotales += (this.timeToMinutes(a.hora_fin) - this.timeToMinutes(a.hora_inicio));
    });
    (temporales as any[]).forEach((t: any) => {
      minutosTotales += (this.timeToMinutes(t.hora_fin) - this.timeToMinutes(t.hora_inicio));
    });

    // Sumar nueva duración
    const minutosNueva = (this.timeToMinutes(s.horaFin) - this.timeToMinutes(s.horaInicio));
    
    if ((minutosTotales + minutosNueva) > (horasTope * 60)) {
      conflictos.push({
        tipo: 'HORAS_COMPLETADAS',
        mensaje: `Se excede el total de horas de ${s.tipoClase} para este curso (${horasTope}h).`,
        severidad: 'ERROR',
        detalle: { horasAsignadas: (minutosTotales + minutosNueva) / 60, tope: horasTope }
      });
    }

    return conflictos;
  }

  private static async registrarConflictos(s: SolicitudAsignacion, errores: Conflicto[]) {
    try {
      for (const error of errores) {
        const conflicto = await prisma.conflictoHorario.create({
          data: {
            id_periodo: s.periodoId,
            tipo_conflicto: error.tipo,
            descripcion: error.mensaje,
            id_docente_1: s.docenteId,
            id_curso: s.cursoId,
            id_ambiente: s.ambienteId,
            dia_semana: s.diaSemana,
            hora_inicio: s.horaInicio,
            hora_fin: s.horaFin,
            resuelto: false,
            fecha_deteccion: new Date()
          }
        });

        // Emitir vía WebSocket
        emitirEvento('nuevo_conflicto', {
          id_conflicto: conflicto.id_conflicto,
          descripcion: conflicto.descripcion,
          tipo: conflicto.tipo_conflicto,
          timestamp: conflicto.fecha_deteccion,
          id_periodo: s.periodoId
        });
      }
    } catch (err) {
      console.error('Error al guardar conflictos en BD:', err);
    }
  }

  private static timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }
}
