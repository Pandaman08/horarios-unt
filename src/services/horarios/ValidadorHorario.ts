import { prisma } from '@/lib/prisma';
import { MAX_HORAS_DIARIAS } from '@/lib/constantes';
import { emitirEvento } from '@/lib/socket-server';
import { etiquetaTipoClase } from '@/lib/horarios/mensajesValidacion';

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
  tipo: 'CRUCE_DOCENTE' | 'CRUCE_GRUPO' | 'OCUPACION_AMBIENTE' | 'EXCESO_HORAS_DIARIAS' | 'FUERA_FRANJA' | 'CURSO_NO_ASIGNABLE' | 'AMBIENTE_NO_VALIDO' | 'HORAS_COMPLETADAS' | 'CARGA_NO_APROBADA';
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
    const conflictos: Conflicto[] = [];

    // Run validations sequentially to avoid hitting connection limits
    conflictos.push(...await this.validarCruceDocente(solicitud));
    conflictos.push(...await this.validarCruceGrupo(solicitud));
    conflictos.push(...await this.validarOcupacionAmbiente(solicitud));
    conflictos.push(...await this.validarExcesoCargaDiaria(solicitud));
    conflictos.push(...await this.validarFranjaInstitucional(solicitud));
    conflictos.push(...await this.validarCursoAsignable(solicitud));
    conflictos.push(...await this.validarAmbienteValido(solicitud));
    conflictos.push(...await this.validarHorasCompletadas(solicitud));
    
    const fin = performance.now();
    const tiempoValidacion = fin - inicio;

    const tieneErrores = conflictos.some(c => c.severidad === 'ERROR');

    // Registrar conflictos de tipo ERROR de forma asíncrona
    if (tieneErrores) {
      this.registrarConflictos(solicitud, conflictos.filter(c => c.severidad === 'ERROR')).catch(err => {
        console.error('Error al registrar conflictos:', err);
      });
    }

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
        mensaje: `Usted ya tiene asignado "${cruceAsignado.curso.nombre}" en este mismo horario. Quite ese bloque o elija otra hora.`,
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
        mensaje: `Ya reservó un bloque para "${cruceTemporal.curso.nombre}" en este horario. Haga clic en la celda amarilla para quitarla o elija otra hora.`,
        severidad: 'ERROR',
        detalle: { id_seleccion: cruceTemporal.id_seleccion }
      });
    }

    return conflictos;
  }

  // 2. Cruce de grupo
  private static async validarCruceGrupo(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    
    // Horario asignado
    const cruceAsignado = await prisma.horarioAsignado.findFirst({
      where: {
        id_grupo: s.grupoId,
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
        tipo: 'CRUCE_GRUPO',
        mensaje: `El grupo seleccionado ya tiene "${cruceAsignado.curso.nombre}" en este horario con otro docente.`,
        severidad: 'ERROR'
      });
    }

    // Selección temporal
    const cruceTemporal = await prisma.seleccionTemporalHorario.findFirst({
      where: {
        id_grupo: s.grupoId,
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
        tipo: 'CRUCE_GRUPO',
        mensaje: `El grupo seleccionado ya tiene una reserva pendiente para "${cruceTemporal.curso.nombre}" en este horario.`,
        severidad: 'ERROR'
      });
    }

    return conflictos;
  }

  // 3. Ocupación de ambiente
  private static async validarOcupacionAmbiente(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    
    // Horario asignado
    const ocupadoAsignado = await prisma.horarioAsignado.findFirst({
      where: {
        id_ambiente: s.ambienteId,
        id_periodo: s.periodoId,
        dia_semana: s.diaSemana,
        id_asignacion: s.asignacionId ? { not: s.asignacionId } : undefined,
        OR: [
          { hora_inicio: { lte: s.horaInicio }, hora_fin: { gt: s.horaInicio } },
          { hora_inicio: { lt: s.horaFin }, hora_fin: { gte: s.horaFin } },
          { hora_inicio: { gte: s.horaInicio }, hora_fin: { lte: s.horaFin } }
        ]
      }
    });

    if (ocupadoAsignado) {
      conflictos.push({
        tipo: 'OCUPACION_AMBIENTE',
        mensaje: 'El ambiente elegido ya está ocupado en este horario. Seleccione otro ambiente u otra hora.',
        severidad: 'ERROR',
        detalle: {
          id_asignacion: ocupadoAsignado.id_asignacion,
          id_docente: ocupadoAsignado.id_docente,
          esTemporal: false
        }
      });
    }

    // Selección temporal
    const ocupadoTemporal = await prisma.seleccionTemporalHorario.findFirst({
      where: {
        id_ambiente: s.ambienteId,
        id_periodo: s.periodoId,
        dia_semana: s.diaSemana,
        fecha_expiracion: { gt: new Date() },
        OR: [
          { hora_inicio: { lte: s.horaInicio }, hora_fin: { gt: s.horaInicio } },
          { hora_inicio: { lt: s.horaFin }, hora_fin: { gte: s.horaFin } },
          { hora_inicio: { gte: s.horaInicio }, hora_fin: { lte: s.horaFin } }
        ]
      }
    });

    if (ocupadoTemporal) {
      conflictos.push({
        tipo: 'OCUPACION_AMBIENTE',
        mensaje: 'El ambiente elegido tiene otra reserva pendiente en este horario. Pruebe otro ambiente u otra hora.',
        severidad: 'ERROR',
        detalle: {
          id_seleccion: ocupadoTemporal.id_seleccion,
          id_docente: ocupadoTemporal.id_docente,
          esTemporal: true
        }
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
      const horasDia = Math.round((minutosTotales / 60) * 10) / 10;
      conflictos.push({
        tipo: 'EXCESO_HORAS_DIARIAS',
        mensaje: `Con este bloque superaría las ${MAX_HORAS_DIARIAS} horas diarias permitidas (llevaría ${horasDia}h ese día). Elija otro día o quite un bloque.`,
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
        mensaje: 'Este horario está fuera del rango permitido (07:00 a 22:00).',
        severidad: 'ERROR'
      });
    }

    // Bloque de almuerzo (13:00 - 14:00)
    const almuerzoInicio = this.timeToMinutes("13:00");
    const almuerzoFin = this.timeToMinutes("14:00");

    if ((inicio < almuerzoFin && fin > almuerzoInicio)) {
      conflictos.push({
        tipo: 'FUERA_FRANJA',
        mensaje: 'El horario interfiere con el bloque de almuerzo institucional (13:00 - 14:00).',
        severidad: 'ADVERTENCIA'
      });
    }

    return conflictos;
  }

  // 6. Curso no asignable al docente
  private static async validarCursoAsignable(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];

    const habilitadoDocenteCurso = await prisma.docenteCurso.findFirst({
      where: { 
        id_docente: s.docenteId, 
        id_curso: s.cursoId, 
        tipo_clase: s.tipoClase, 
        activo: true 
      }
    });

    const habilitadoDeclaracion = await prisma.cargaLectiva.findFirst({
      where: {
        id_curso: s.cursoId,
        tipo_clase: s.tipoClase,
        declaracion: {
          id_docente: s.docenteId,
          id_periodo: s.periodoId
          // COMENTADO: No validamos estado APROBADO aquí
          // Según el nuevo flujo, el docente puede seleccionar horarios
          // sin esperar la aprobación de la declaración
          // estado: 'APROBADO'
        }
      }
    });

    if (!habilitadoDocenteCurso && !habilitadoDeclaracion) {
      conflictos.push({
        tipo: 'CURSO_NO_ASIGNABLE',
        mensaje: `No tiene asignado este curso en ${etiquetaTipoClase(s.tipoClase)} en su carga horaria.`,
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
        mensaje: 'El ambiente seleccionado no está disponible. Elija otro de la lista.',
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

    const grupo = await prisma.grupo.findUnique({ where: { id_grupo: s.grupoId } });
    const codigoGrupo = grupo?.codigo_grupo ?? 'seleccionado';
    const tipoLabel = etiquetaTipoClase(s.tipoClase);
    const tipo = s.tipoClase.toLowerCase();

    // Buscar la carga lectiva del docente para este curso y tipo de clase
    const cargaLectiva = await prisma.cargaLectiva.findFirst({
      where: {
        id_curso: s.cursoId,
        tipo_clase: s.tipoClase,
        declaracion: {
          id_docente: s.docenteId,
          id_periodo: s.periodoId
        }
      }
    });

    // Calcular horas tope: usar carga lectiva si existe, sino usar horas del curso
    let horasTope = 0;
    if (cargaLectiva) {
      horasTope = cargaLectiva.horas_semanales * (cargaLectiva.grupos_asignados || 1);
    } else {
      // Fallback: usar horas del curso si no hay carga lectiva
      if (tipo.includes('teoria')) horasTope = curso.horas_teoria;
      else if (tipo.includes('laboratorio')) horasTope = curso.horas_laboratorio;
      else if (tipo.includes('practica') || tipo.includes('práctica')) horasTope = curso.horas_practica;
    }
    
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
      const horasAsignadas = Math.round(((minutosTotales + minutosNueva) / 60) * 10) / 10;
      const esLab = tipo.includes('laboratorio');
      const sugerenciaLab = esLab
        ? ' Seleccione otro grupo de laboratorio (L2, L3…) para seguir asignando.'
        : '';

      conflictos.push({
        tipo: 'HORAS_COMPLETADAS',
        mensaje: `Ya completó las ${horasTope}h semanales de ${tipoLabel} para el grupo ${codigoGrupo} (lleva ${horasAsignadas}h).${sugerenciaLab}`,
        severidad: 'ERROR',
        detalle: { horasAsignadas: (minutosTotales + minutosNueva) / 60, tope: horasTope }
      });
    }

    return conflictos;
  }

  // 9. Declaración Horaria Aprobada (DESACTIVADA - Ya no se requiere APROBADO)
  // Según el nuevo flujo de workflow, los docentes pueden seleccionar horarios
  // sin esperar a que su declaración sea aprobada. Solo necesitan CargaLectiva asignada.
  private static async validarDeclaracionAprobada(s: SolicitudAsignacion): Promise<Conflicto[]> {
    const conflictos: Conflicto[] = [];
    // MÉTODO DESACTIVADO - Mantener código por compatibilidad pero no se usa
    // const declaracion = await prisma.declaracionHoraria.findFirst({
    //   where: {
    //     id_docente: s.docenteId,
    //     id_periodo: s.periodoId
    //   }
    // });
    //
    // if (!declaracion || declaracion.estado !== 'APROBADO') {
    //   conflictos.push({
    //     tipo: 'CARGA_NO_APROBADA',
    //     mensaje: 'Su carga horaria aún no está aprobada. Espere la aprobación del administrador para asignar horarios.',
    //     severidad: 'ERROR'
    //   });
    // }

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
