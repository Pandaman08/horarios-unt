import { z } from 'zod';
import { ToolRegistry } from '../ToolRegistry';
import { prisma } from '@/lib/prisma';
import { ServicioEstadisticas } from '@/services/reportes/ServicioEstadisticas';
import { ValidadorHorario } from '@/services/horarios/ValidadorHorario';
import { ServicioHorariosDocente } from '@/services/horarios/ServicioHorariosDocente';
import type { ToolContext } from '../ToolRegistry';

// ==========================================
// 1. obtenerHorarioPropio (Reutiliza ServicioHorariosDocente)
// ==========================================
const ObtenerHorarioPropioSchema = z.object({
  periodoId: z.number().optional().describe('ID del período académico (opcional, usa el activo por defecto)')
});

ToolRegistry.register({
  name: 'obtenerHorarioPropio',
  description: 'Obtiene el horario personal del docente autenticado',
  parameters: ObtenerHorarioPropioSchema,
  requiredRoles: ['docente'],
  handler: async (args: z.infer<typeof ObtenerHorarioPropioSchema>, context: ToolContext) => {
    if (!context.docenteId) throw new Error('No se encontró el ID del docente');

    const resultado = await ServicioHorariosDocente.obtenerHorarioDocente(
      context.docenteId,
      args.periodoId
    );

    return {
      periodoId: resultado.periodoId,
      totalClases: resultado.horarios.length,
      horarios: resultado.horarios.map(h => ({
        id: h.id_asignacion,
        curso: h.curso_nombre,
        grupo: h.grupo_codigo,
        ambiente: h.ambiente_nombre,
        tipoClase: h.tipo_clase,
        diaSemana: h.dia_semana,
        horaInicio: h.hora_inicio,
        horaFin: h.hora_fin
      }))
    };
  }
});

// ==========================================
// 2. consultarAulasLibres
// ==========================================
const ConsultarAulasLibresSchema = z.object({
  diaSemana: z.number().min(0).max(5).describe('Día de la semana (0=Lunes, 5=Sábado)'),
  horaInicio: z.string().describe('Hora de inicio (formato HH:MM)'),
  horaFin: z.string().describe('Hora de fin (formato HH:MM)'),
  periodoId: z.number().optional().describe('ID del período académico (opcional)')
});

ToolRegistry.register({
  name: 'consultarAulasLibres',
  description: 'Consulta qué ambientes están disponibles en un horario específico',
  parameters: ConsultarAulasLibresSchema,
  requiredRoles: ['administrador_sistema', 'operador_horarios'],
  handler: async (args: z.infer<typeof ConsultarAulasLibresSchema>, context: ToolContext) => {
    let periodoId = args.periodoId;
    if (!periodoId) {
      const periodoActivo = await prisma.periodoAcademico.findFirst({ where: { activo: true } });
      if (!periodoActivo) throw new Error('No hay período académico activo');
      periodoId = periodoActivo.id_periodo;
    }

    // Obtener todos los ambientes activos
    const todosAmbientes = await prisma.ambiente.findMany({ where: { activo: true } });

    // Obtener ambientes ocupados en horarios confirmados/definitivos
    const ambientesOcupadosAsignados = await prisma.horarioAsignado.findMany({
      where: {
        id_periodo: periodoId,
        dia_semana: args.diaSemana,
        AND: [
          {
            OR: [
              { estado: 'confirmado' },
              { estado: 'definitivo' }
            ]
          },
          {
            OR: [
              { hora_inicio: { lte: args.horaInicio }, hora_fin: { gt: args.horaInicio } },
              { hora_inicio: { lt: args.horaFin }, hora_fin: { gte: args.horaFin } },
              { hora_inicio: { gte: args.horaInicio }, hora_fin: { lte: args.horaFin } }
            ]
          }
        ]
      },
      select: { id_ambiente: true }
    });

    // Obtener ambientes ocupados en selecciones temporales vigentes
    const ambientesOcupadosTemporales = await prisma.seleccionTemporalHorario.findMany({
      where: {
        id_periodo: periodoId,
        dia_semana: args.diaSemana,
        fecha_expiracion: { gt: new Date() },
        OR: [
          { hora_inicio: { lte: args.horaInicio }, hora_fin: { gt: args.horaInicio } },
          { hora_inicio: { lt: args.horaFin }, hora_fin: { gte: args.horaFin } },
          { hora_inicio: { gte: args.horaInicio }, hora_fin: { lte: args.horaFin } }
        ]
      },
      select: { id_ambiente: true }
    });

    // Combinar IDs de ambientes ocupados
    const idsOcupados = new Set([
      ...ambientesOcupadosAsignados.map(a => a.id_ambiente),
      ...ambientesOcupadosTemporales.map(a => a.id_ambiente)
    ]);
    const ambientesLibres = todosAmbientes.filter(a => !idsOcupados.has(a.id_ambiente));

    return {
      periodoId,
      diaSemana: args.diaSemana,
      horaInicio: args.horaInicio,
      horaFin: args.horaFin,
      totalDisponibles: ambientesLibres.length,
      ambientes: ambientesLibres.map(a => ({
        id: a.id_ambiente,
        nombre: a.nombre,
        codigo: a.codigo,
        tipo: a.tipo,
        capacidad: a.capacidad
      }))
    };
  }
});

// ==========================================
// 3. obtenerEstadisticasGestion
// ==========================================
const ObtenerEstadisticasGestionSchema = z.object({
  periodoId: z.number().optional().describe('ID del período académico (opcional)')
});

ToolRegistry.register({
  name: 'obtenerEstadisticasGestion',
  description: 'Obtiene estadísticas generales de gestión de horarios',
  parameters: ObtenerEstadisticasGestionSchema,
  requiredRoles: ['administrador_sistema', 'operador_horarios'],
  handler: async (args: z.infer<typeof ObtenerEstadisticasGestionSchema>, context: ToolContext) => {
    let periodoId = args.periodoId;
    if (!periodoId) {
      const periodoActivo = await prisma.periodoAcademico.findFirst({ where: { activo: true } });
      if (!periodoActivo) throw new Error('No hay período académico activo');
      periodoId = periodoActivo.id_periodo;
    }

    const estadisticas = await ServicioEstadisticas.obtenerEstadisticasGestion(periodoId);
    const totalDocentes = await prisma.docente.count({ where: { activo: true } });
    const totalConflictos = await prisma.conflictoHorario.count({ where: { id_periodo: periodoId, resuelto: false } });

    return {
      periodoId,
      ...estadisticas,
      totalDocentesActivos: totalDocentes,
      conflictosPendientes: totalConflictos
    };
  }
});

// ==========================================
// 4. validarCambioHorario (SIN CAMBIOS)
// ==========================================
const ValidarCambioHorarioSchema = z.object({
  docenteId: z.number().describe('ID del docente'),
  cursoId: z.number().describe('ID del curso'),
  grupoId: z.number().describe('ID del grupo'),
  tipoClase: z.string().describe('Tipo de clase (teoria, practica, laboratorio)'),
  ambienteId: z.number().describe('ID del ambiente'),
  diaSemana: z.number().min(0).max(5).describe('Día de la semana (0=Lunes, 5=Sábado)'),
  horaInicio: z.string().describe('Hora de inicio (formato HH:MM)'),
  horaFin: z.string().describe('Hora de fin (formato HH:MM)'),
  periodoId: z.number().optional().describe('ID del período académico (opcional)')
});

ToolRegistry.register({
  name: 'validarCambioHorario',
  description: 'Valida si un cambio de horario es posible sin conflictos',
  parameters: ValidarCambioHorarioSchema,
  requiredRoles: ['administrador_sistema', 'operador_horarios', 'docente'],
  handler: async (args: z.infer<typeof ValidarCambioHorarioSchema>, context: ToolContext) => {
    let periodoId = args.periodoId;
    if (!periodoId) {
      const periodoActivo = await prisma.periodoAcademico.findFirst({ where: { activo: true } });
      if (!periodoActivo) throw new Error('No hay período académico activo');
      periodoId = periodoActivo.id_periodo;
    }

    const resultado = await ValidadorHorario.validarAsignacion({
      ...args,
      periodoId
    });

    return {
      valido: resultado.valido,
      tiempoValidacionMs: resultado.tiempoValidacion,
      conflictos: resultado.conflictos.map(c => ({
        tipo: c.tipo,
        mensaje: c.mensaje,
        severidad: c.severidad
      }))
    };
  }
});

// ==========================================
// 5. buscarAlternativasHorario
// ==========================================
const BuscarAlternativasHorarioSchema = z.object({
  periodoId: z.number().optional().describe('ID del período académico (opcional, usa el activo por defecto)'),
  cursoId: z.number().describe('ID del curso para el que se buscan alternativas'),
  grupoId: z.number().describe('ID del grupo para el que se buscan alternativas'),
  tipoClase: z.string().describe('Tipo de clase (teoria, practica, laboratorio)'),
  docenteId: z.number().optional().describe('ID del docente (opcional; si se proporciona, busca alternativas solo para él)'),
  maxAlternativas: z.number().optional().default(5).describe('Máximo de alternativas a devolver (por defecto: 5)')
});

ToolRegistry.register({
  name: 'buscarAlternativasHorario',
  description: 'Busca alternativas válidas de horario para un curso y grupo usando las reglas oficiales del sistema',
  parameters: BuscarAlternativasHorarioSchema,
  requiredRoles: ['administrador_sistema', 'operador_horarios'],
  handler: async (args: z.infer<typeof BuscarAlternativasHorarioSchema>, context: ToolContext) => {
    // 1. Obtener período
    let periodoId = args.periodoId;
    if (!periodoId) {
      const periodoActivo = await prisma.periodoAcademico.findFirst({ where: { activo: true } });
      if (!periodoActivo) throw new Error('No hay período académico activo');
      periodoId = periodoActivo.id_periodo;
    }

    // 2. Obtener curso para duración oficial
    const curso = await prisma.curso.findUnique({ where: { id_curso: args.cursoId } });
    if (!curso) throw new Error('Curso no encontrado');

    // 3. Calcular duración requerida en minutos según tipo de clase
    let horasRequeridas: number;
    const tipo = args.tipoClase.toLowerCase();
    if (tipo.includes('teoria')) horasRequeridas = curso.horas_teoria;
    else if (tipo.includes('laboratorio')) horasRequeridas = curso.horas_laboratorio;
    else if (tipo.includes('practica') || tipo.includes('práctica')) horasRequeridas = curso.horas_practica;
    else horasRequeridas = 0;
    const duracionRequeridaMin = horasRequeridas * 60;

    // Helper para convertir horas:MM a minutos
    const timeToMinutes = (time: string): number => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    // Helper para convertir minutos a horas:MM
    const minutesToTime = (minutes: number): string => {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    // 4. Obtener docentes aptos
    const whereDocente = {
      activo: true,
      declaraciones_horarias: { some: { id_periodo: periodoId, estado: 'APROBADO' } },
      disponibilidad: { some: { id_periodo: periodoId, disponible: true } },
      docente_cursos: { some: { id_curso: args.cursoId, tipo_clase: args.tipoClase, activo: true } }
    };

    // Si se proporciona docenteId, filtrar solo a ese docente
    const whereDocenteFinal = args.docenteId
      ? { ...whereDocente, id_docente: args.docenteId }
      : whereDocente;

    const docentes = await prisma.docente.findMany({
      where: whereDocenteFinal,
      include: {
        disponibilidad: { where: { id_periodo: periodoId, disponible: true } }
      }
    });

    if (docentes.length === 0) {
      return {
        periodoId,
        cursoId: args.cursoId,
        grupoId: args.grupoId,
        tipoClase: args.tipoClase,
        alternativas: [],
        totalAlternativasEncontradas: 0,
        maxAlternativasSolicitadas: args.maxAlternativas
      };
    }

    // 5. Obtener ambientes válidos para el curso y tipo de clase
    const ambientesValidos = await prisma.ambiente.findMany({
      where: {
        activo: true,
        curso_ambientes: { some: { id_curso: args.cursoId, tipo_clase: args.tipoClase } }
      }
    });

    // 6. Iterar candidatos y validar con ValidadorHorario
    const alternativas: any[] = [];
    const maxAlts = args.maxAlternativas || 5;

    for (const docente of docentes) {
      for (const disponibilidad of docente.disponibilidad) {
        const inicioMin = timeToMinutes(disponibilidad.hora_inicio);
        const finMin = timeToMinutes(disponibilidad.hora_fin);
        const duracionDisponible = finMin - inicioMin;

        // Verificar que la duración disponible sea suficiente
        if (duracionDisponible < duracionRequeridaMin) {
          continue;
        }

        // Calcular la hora de fin con la duración requerida exacta
        const finAlternativaMin = inicioMin + duracionRequeridaMin;
        const horaFinAlternativa = minutesToTime(finAlternativaMin);

        for (const ambiente of ambientesValidos) {
          // Construir solicitud de prueba
          const solicitud = {
            docenteId: docente.id_docente,
            cursoId: args.cursoId,
            grupoId: args.grupoId,
            tipoClase: args.tipoClase,
            ambienteId: ambiente.id_ambiente,
            diaSemana: disponibilidad.dia_semana,
            horaInicio: disponibilidad.hora_inicio,
            horaFin: horaFinAlternativa,
            periodoId: periodoId
          };

          // Validar con ValidadorHorario
          const resultado = await ValidadorHorario.validarAsignacion(solicitud);

          if (resultado.valido) {
            // Agregar alternativa
            alternativas.push({
              id: alternativas.length + 1,
              docente: {
                id_docente: docente.id_docente,
                nombres: docente.nombres,
                apellidos: docente.apellidos,
                codigo_docente: docente.codigo_docente,
                modalidad: docente.modalidad,
                categoria: docente.categoria
              },
              ambiente: {
                id_ambiente: ambiente.id_ambiente,
                codigo: ambiente.codigo,
                nombre: ambiente.nombre,
                tipo: ambiente.tipo,
                capacidad: ambiente.capacidad
              },
              dia_semana: disponibilidad.dia_semana,
              hora_inicio: disponibilidad.hora_inicio,
              hora_fin: horaFinAlternativa,
              motivo_recomendacion: 'Alternativa válida según todas las reglas oficiales del sistema.'
            });

            // Detenerse si alcanzamos el máximo
            if (alternativas.length >= maxAlts) {
              break;
            }
          }
        }

        if (alternativas.length >= maxAlts) {
          break;
        }
      }

      if (alternativas.length >= maxAlts) {
        break;
      }
    }

    // 8. Devolver resultado
    return {
      periodoId,
      cursoId: args.cursoId,
      grupoId: args.grupoId,
      tipoClase: args.tipoClase,
      alternativas,
      totalAlternativasEncontradas: alternativas.length,
      maxAlternativasSolicitadas: args.maxAlternativas
    };
  }
});
