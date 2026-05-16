import { prisma } from '@/lib/prisma';
import { ServicioCorreo } from './ServicioCorreo';
import { ServicioTelegram } from './ServicioTelegram';

export class ServicioNotificador {
  /**
   * Procesa la cola de notificaciones pendientes
   */
  static async procesarCola() {
    const ahora = new Date();
    const pendientes = await prisma.colaNotificaciones.findMany({
      where: {
        estado: 'pendiente',
        fecha_programada: { lte: ahora },
        intentos: { lt: 3 }
      },
      include: { docente: { include: { preferencias_notificacion: true } } },
      take: 10 // Procesar en bloques
    });

    for (const notificacion of pendientes) {
      await this.enviarNotificacion(notificacion);
    }
  }

  private static async enviarNotificacion(notif: any) {
    let success = false;
    const datos = notif.datos_mensaje as any;

    try {
      if (notif.canal === 'correo') {
        const res = await ServicioCorreo.enviarCorreo(
          notif.docente.correo_electronico,
          datos.asunto,
          datos.html
        );
        success = res.success;
      } else if (notif.canal === 'telegram') {
        const pref = notif.docente.preferencias_notificacion.find((p: any) => p.canal === 'telegram');
        if (pref && pref.verificado) {
          const res = await ServicioTelegram.enviarMensaje(
            (pref.datos_contacto as any).chat_id,
            datos.texto
          );
          success = res.success;
        }
      }

      // Actualizar estado en la cola
      await prisma.colaNotificaciones.update({
        where: { id_cola: notif.id_cola },
        data: {
          estado: success ? 'completado' : 'fallido',
          intentos: { increment: 1 },
          fecha_procesamiento: new Date()
        }
      });

      // Registrar en historial
      await prisma.historialNotificaciones.create({
        data: {
          id_docente: notif.id_docente,
          tipo_notificacion: notif.tipo_notificacion,
          canal: notif.canal,
          mensaje: success ? 'Enviado con éxito' : 'Error en el envío',
          estado_envio: success ? 'enviado' : 'fallido',
          fecha_envio: new Date()
        }
      });

    } catch (error) {
      console.error(`Error procesando notificación ${notif.id_cola}:`, error);
    }
  }

  /**
   * Programa notificaciones para una ventana de atención
   */
  static async programarNotificacionesVentana(id_ventana: number) {
    const ventana = await prisma.ventanaAtencion.findUnique({
      where: { id_ventana },
      include: { periodo: true }
    });

    if (!ventana) return;

    // Obtener docentes que pertenecen a esta ventana
    const docentes = await prisma.docente.findMany({
      where: { 
        modalidad: ventana.modalidad, 
        categoria: ventana.categoria,
        activo: true 
      }
    });

    for (const docente of docentes) {
      // 1. Programar recordatorio 24 horas antes
      const fecha24h = new Date(ventana.fecha);
      fecha24h.setDate(fecha24h.getDate() - 1);
      // Ajustar a una hora razonable, ej: 08:00 AM
      fecha24h.setHours(8, 0, 0, 0);

      if (fecha24h > new Date()) {
        await this.crearEntradaCola(docente.id_docente, 'recordatorio_24h', fecha24h, ventana);
      }

      // 2. Programar alerta 15 minutos antes
      const [hora, minuto] = ventana.hora_inicio.split(':').map(Number);
      const fecha15min = new Date(ventana.fecha);
      fecha15min.setHours(hora, minuto - 15, 0, 0);

      if (fecha15min > new Date()) {
        await this.crearEntradaCola(docente.id_docente, 'alerta_15min', fecha15min, ventana);
      }
    }
  }

  private static async crearEntradaCola(id_docente: number, tipo: string, fecha: Date, ventana: any) {
    const mensajeBase = `Hola, te recordamos que tu ventana de atención para la selección de horarios es el ${ventana.fecha.toLocaleDateString()} a las ${ventana.hora_inicio}.`;

    // Programar Correo
    await prisma.colaNotificaciones.create({
      data: {
        id_docente,
        tipo_notificacion: tipo,
        canal: 'correo',
        fecha_programada: fecha,
        datos_mensaje: {
          asunto: `Recordatorio: Ventana de Atención - UNT`,
          html: `<p>${mensajeBase}</p><p>Por favor, asegúrate de tener tus cursos listos.</p>`
        }
      }
    });

    // Programar Telegram
    await prisma.colaNotificaciones.create({
      data: {
        id_docente,
        tipo_notificacion: tipo,
        canal: 'telegram',
        fecha_programada: fecha,
        datos_mensaje: {
          texto: `🔔 <b>RECORDATORIO</b>\n\n${mensajeBase}\n\n<i>Sistema de Horarios UNT</i>`
        }
      }
    });
  }
}
