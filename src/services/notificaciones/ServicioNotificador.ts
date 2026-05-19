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
    let skip = false;
    let mensajeHistorial = "";
    const datos = notif.datos_mensaje as any;

    try {
      // 1. Validar REGLA: Correo NO se envía para alertas de 15 minutos
      if (notif.canal === 'correo' && notif.tipo_notificacion === 'alerta_15min') {
        console.log(`Omitiendo correo para alerta_15min según reglas del sistema.`);
        skip = true;
      }

      // 2. Verificar preferencias del docente
      const preferencias = (notif.docente as any).preferencias_notificacion || [];
      const pref = preferencias.find((p: any) => p.canal === notif.canal);
      
      if (!skip && pref && !pref.activo) {
        console.log(`Notificación omitida para docente ${notif.id_docente} por canal ${notif.canal} (desactivado por el usuario)`);
        skip = true;
      }

      if (!skip) {
        if (notif.canal === 'correo') {
          const res = await ServicioCorreo.enviarCorreo(
            (notif.docente as any).correo_electronico,
            datos.asunto,
            datos.html
          );
          success = res.success;
          mensajeHistorial = success ? 'Enviado con éxito' : `Error SMTP: ${res.error || 'Desconocido'}`;
        } else if (notif.canal === 'telegram') {
          if (pref && pref.verificado) {
            const res = await ServicioTelegram.enviarMensaje(
              (pref.datos_contacto as any).chat_id,
              datos.texto
            );
            success = res.success;
            mensajeHistorial = success ? 'Enviado con éxito' : `Error Telegram: ${res.error || 'Desconocido'}`;
          } else {
            success = false;
            mensajeHistorial = 'Telegram no vinculado (use /start)';
            console.warn(`Telegram no verificado para docente ${notif.id_docente}`);
          }
        }
      }

      // Actualizar estado en la cola
      await prisma.colaNotificaciones.update({
        where: { id_cola: notif.id_cola },
        data: {
          estado: skip ? 'omitido' : (success ? 'completado' : 'fallido'),
          intentos: { increment: 1 },
          fecha_procesamiento: new Date()
        }
      });

      // Registrar en historial si no fue omitido
      if (!skip) {
        await prisma.historialNotificaciones.create({
          data: {
            id_docente: notif.id_docente,
            tipo_notificacion: notif.tipo_notificacion,
            canal: notif.canal,
            mensaje: mensajeHistorial,
            estado_envio: success ? 'enviado' : 'fallido',
            fecha_envio: new Date()
          }
        });
      }

    } catch (error: any) {
      console.error(`Error procesando notificación ${notif.id_cola}:`, error);
      // Asegurar que no quede trabada en la cola
      await prisma.colaNotificaciones.update({
        where: { id_cola: notif.id_cola },
        data: { 
          estado: 'fallido', 
          intentos: { increment: 1 },
          fecha_procesamiento: new Date()
        }
      });
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

      // Si la fecha ya pasó (ventana es mañana o hoy), enviarlo lo antes posible (ahora + 1 min)
      const programada24h = fecha24h > new Date() ? fecha24h : new Date(Date.now() + 60000);
      await this.crearEntradaCola(docente.id_docente, 'recordatorio_24h', programada24h, ventana, docente);

      // 2. Programar alerta 15 minutos antes
      const [hora, minuto] = ventana.hora_inicio.split(':').map(Number);
      const fecha15min = new Date(ventana.fecha);
      fecha15min.setHours(hora, minuto - 15, 0, 0);

      if (fecha15min > new Date()) {
        await this.crearEntradaCola(docente.id_docente, 'alerta_15min', fecha15min, ventana, docente);
      }
    }
  }

  private static async crearEntradaCola(id_docente: number, tipo: string, fecha: Date, ventana: any, docente: any) {
    // Buscar plantillas en la base de datos
    const configs = await prisma.configuracionNotificaciones.findMany({
      where: { tipo_notificacion: tipo, activo: true }
    });

    const configCorreo = configs.find((conf: any) => conf.canal === 'correo');
    const configTelegram = configs.find((conf: any) => conf.canal === 'telegram');

    const replacePlaceholders = (text: string, docente: any) => {
      if (!text) return "";
      return text
        .split('{{nombre}}').join(docente.nombres)
        .split('{{fecha}}').join(ventana.fecha.toLocaleDateString())
        .split('{{hora}}').join(ventana.hora_inicio)
        .split('{{modalidad}}').join(ventana.modalidad)
        .split('{{categoria}}').join(ventana.categoria);
    };

    // 1. Programar Correo (Solo para recordatorio 24h)
    if (tipo === 'recordatorio_24h') {
      const asuntoDefault = 'Recordatorio: Tu ventana de selección de horarios';
      const htmlDefault = `<p>Hola {{nombre}}, te recordamos que tu ventana de atención para la selección de horarios es el {{fecha}} a las {{hora}}.</p><p>Por favor, asegúrate de tener tus cursos listos.</p>`;

      // EVITAR DUPLICADOS: No enviar más de un recordatorio de 24h por periodo/docente si ya existe uno pendiente o enviado recientemente
      const existe = await prisma.colaNotificaciones.findFirst({
        where: { 
          id_docente, 
          tipo_notificacion: tipo, 
          canal: 'correo',
          fecha_creacion: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Creado en las últimas 24h
        }
      });

      if (!existe) {
        await prisma.colaNotificaciones.create({
          data: {
            id_docente,
            tipo_notificacion: tipo,
            canal: 'correo',
            fecha_programada: fecha,
            datos_mensaje: {
              asunto: configCorreo?.configuracion_adicional ? (configCorreo.configuracion_adicional as any).asunto : asuntoDefault,
              html: replacePlaceholders(configCorreo ? configCorreo.plantilla_mensaje : htmlDefault, docente)
            }
          }
        });
      }
    }

    // 2. Programar Telegram (Tanto para 24h como 15min)
    const textoDefault = `🔔 <b>RECORDATORIO</b>\n\nHola {{nombre}}, tu ventana de atención es el {{fecha}} a las {{hora}}.\n\n<i>Sistema de Horarios UNT</i>`;

    // EVITAR DUPLICADOS: No enviar más de una alerta del mismo tipo si ya se envió una recientemente
    const existeTelegram = await prisma.colaNotificaciones.findFirst({
      where: { 
        id_docente, 
        tipo_notificacion: tipo, 
        canal: 'telegram',
        fecha_creacion: { gte: new Date(Date.now() - 1 * 60 * 60 * 1000) } // Creado en la última hora
      }
    });

    if (!existeTelegram) {
      await prisma.colaNotificaciones.create({
        data: {
          id_docente,
          tipo_notificacion: tipo,
          canal: 'telegram',
          fecha_programada: fecha,
          datos_mensaje: {
            texto: replacePlaceholders(configTelegram ? configTelegram.plantilla_mensaje : textoDefault, docente)
          }
        }
      });
    }
  }
}
