import { prisma } from '@/lib/prisma';
import { addMinutes } from 'date-fns';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

export class GestorSeleccionTemporal {
  /**
   * Crea una selección temporal para un docente
   */
  static async crearSeleccion(params: {
    id_docente: number;
    id_curso: number;
    id_grupo: number;
    id_ambiente: number;
    dia_semana: number;
    hora_inicio: string;
    hora_fin: string;
    tipo_clase: string;
    id_periodo: number;
    sesion_id: string;
  }) {
    // 30 minutos de expiración
    const fechaExpiracion = addMinutes(new Date(), 30);

    return await prisma.seleccionTemporalHorario.upsert({
      where: {
        sesion_id_dia_semana_hora_inicio: {
          sesion_id: params.sesion_id,
          dia_semana: params.dia_semana,
          hora_inicio: params.hora_inicio
        }
      },
      update: {
        ...params,
        fecha_expiracion: fechaExpiracion
      },
      create: {
        ...params,
        fecha_expiracion: fechaExpiracion
      }
    });
  }

  /**
   * Elimina una selección temporal específica
   */
  static async eliminarSeleccion(id_seleccion: number) {
    return await prisma.seleccionTemporalHorario.delete({
      where: { id_seleccion }
    });
  }

  /**
   * Limpia selecciones expiradas y devuelve los IDs eliminados para notificar vía Socket
   */
  static async limpiarExpirados() {
    const ahora = new Date();
    
    // Obtener las que van a ser eliminadas para notificar
    const expiradas = await prisma.seleccionTemporalHorario.findMany({
      where: { fecha_expiracion: { lte: ahora } }
    });

    await prisma.seleccionTemporalHorario.deleteMany({
      where: { fecha_expiracion: { lte: ahora } }
    });

    return expiradas;
  }

  /**
   * Confirma todas las selecciones temporales de un docente en un periodo
   */
  static async confirmarTodo(id_docente: number, id_periodo: number, usuario_id: number, esAutomatico: boolean = false) {
    const temporales = await prisma.seleccionTemporalHorario.findMany({
      where: { id_docente, id_periodo }
    });

    if (temporales.length === 0) throw new Error("No hay selecciones temporales para confirmar");

    return await prisma.$transaction(async (tx) => {
      const asignaciones = [];
      
      for (const temporal of temporales) {
        const definitiva = await tx.horarioAsignado.create({
          data: {
            id_docente: temporal.id_docente,
            id_curso: temporal.id_curso,
            id_grupo: temporal.id_grupo,
            id_ambiente: temporal.id_ambiente,
            dia_semana: temporal.dia_semana,
            hora_inicio: temporal.hora_inicio,
            hora_fin: temporal.hora_fin,
            id_periodo: temporal.id_periodo,
            tipo_clase: temporal.tipo_clase,
            estado: 'confirmado',
            creado_por: usuario_id
          }
        });
        asignaciones.push(definitiva);
      }

      await tx.seleccionTemporalHorario.deleteMany({
        where: { id_docente, id_periodo }
      });

      return asignaciones;
    }).then(async (asignaciones) => {
      // Después de confirmar, cargar datos completos y programar notificaciones
      for (const asignacion of asignaciones) {
        const horarioCompleto = await prisma.horarioAsignado.findUnique({
          where: { id_asignacion: asignacion.id_asignacion },
          include: {
            docente: true,
            curso: true,
            grupo: true,
            ambiente: true,
            periodo: true
          }
        });
        
        if (horarioCompleto) {
          await ServicioNotificador.programarNotificacionesHorarioConfirmado(
            horarioCompleto as any,
            esAutomatico
          );
        }
      }
      
      return asignaciones;
    });
  }
}
