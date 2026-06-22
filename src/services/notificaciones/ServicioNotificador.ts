import { prisma } from '@/lib/prisma';
import { ServicioCorreo } from './ServicioCorreo';
import { ServicioTelegram } from './ServicioTelegram';
import type { HorarioAsignado, Docente, Curso, Grupo, Ambiente, PeriodoAcademico } from '@prisma/client';

export class ServicioNotificador {
  /**
   * Procesa la cola de notificaciones pendientes
   */
  static async procesarCola() {
    const ahora = new Date();
    console.log(`[Notificador] Iniciando procesamiento de cola a las ${ahora.toISOString()}`);
    
    try {
      const pendientes = await prisma.colaNotificaciones.findMany({
        where: {
          estado: 'pendiente',
          fecha_programada: { lte: ahora },
          intentos: { lt: 3 }
        },
        include: { docente: { include: { preferencias_notificacion: true } } },
        take: 20
      });

      console.log(`[Notificador] Encontradas ${pendientes.length} notificaciones pendientes para enviar.`);

      for (const notificacion of pendientes) {
        console.log(`[Notificador] Procesando id_cola: ${notificacion.id_cola} para docente: ${notificacion.docente.nombres} (${notificacion.canal})`);
        await this.enviarNotificacion(notificacion);
      }
      
      console.log(`[Notificador] Fin del procesamiento de cola.`);
    } catch (error) {
      console.error(`[Notificador] Error crítico en procesarCola:`, error);
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
        console.log(`Omitiendo envío de correo para alerta_15min según reglas del sistema.`);
        skip = true;
      }

      // 2. Verificar preferencias del docente
      const preferencias = (notif.docente as any).preferencias_notificacion || [];
      const pref = preferencias.find((p: any) => p.canal === notif.canal);
      
      if (!skip && pref && !pref.activo) {
        console.log(`Notificación omitida para docente ${notif.id_docente} por canal ${notif.canal} (desactivado por el usuario)`);
        skip = true;
      }

      // Preparar contenido que irá al historial (siempre intentamos conservar el cuerpo del mensaje)
      if (datos) {
        mensajeHistorial = datos.html || datos.texto || JSON.stringify(datos);
      }

      if (!skip) {
        if (notif.canal === 'correo') {
          const res = await ServicioCorreo.enviarCorreo(
            (notif.docente as any).correo_electronico,
            datos.asunto,
            datos.html
          );
          success = res.success;
          // mantener mensajeHistorial como el contenido real (datos.html)
        } else if (notif.canal === 'telegram') {
          if (pref && pref.verificado) {
            const res = await ServicioTelegram.enviarMensaje(
              (pref.datos_contacto as any).chat_id,
              datos.texto
            );
            success = res.success;
            // mensajeHistorial ya contiene datos.texto
          } else {
            success = false;
            console.warn(`Telegram no verificado para docente ${notif.id_docente}`);
          }
        }
      } else {
        // Si se omitió, mensajeHistorial ya preparado con contenido; success queda false
      }

      // Construir payload de actualización de la cola (incrementar intentos SOLO en fallo)
      const updateData: any = {
        estado: skip ? 'omitido' : (success ? 'completado' : 'fallido'),
        fecha_procesamiento: new Date()
      };

      if (!success && !skip) {
        updateData.intentos = { increment: 1 };
      }

      await prisma.colaNotificaciones.update({
        where: { id_cola: notif.id_cola },
        data: updateData
      });

      // Registrar en historial SIEMPRE (incluso omitido) y usando el contenido real del mensaje
      try {
        await prisma.historialNotificaciones.create({
          data: {
            id_docente: notif.id_docente,
            tipo_notificacion: notif.tipo_notificacion,
            canal: notif.canal,
            mensaje: mensajeHistorial,
            estado_envio: skip ? 'omitido' : (success ? 'enviado' : 'fallido'),
            fecha_envio: new Date()
          }
        });
      } catch (histErr) {
        console.error(`Error al crear historial para notificación ${notif.id_cola}:`, histErr);
      }

    } catch (error: any) {
      console.error(`Error procesando notificación ${notif.id_cola}:`, error);
      // Asegurar que no quede trabada en la cola
      try {
        await prisma.colaNotificaciones.update({
          where: { id_cola: notif.id_cola },
          data: { 
            estado: 'fallido', 
            intentos: { increment: 1 },
            fecha_procesamiento: new Date()
          }
        });
      } catch (uErr) {
        console.error(`Error actualizando cola tras excepción para ${notif.id_cola}:`, uErr);
      }

      // Intentar registrar en historial el error
      try {
        await prisma.historialNotificaciones.create({
          data: {
            id_docente: notif.id_docente,
            tipo_notificacion: notif.tipo_notificacion,
            canal: notif.canal,
            mensaje: `Error interno: ${error?.message || String(error)}`,
            estado_envio: 'fallido',
            fecha_envio: new Date()
          }
        });
      } catch (histErr) {
        console.error(`Error al crear historial tras excepción para ${notif.id_cola}:`, histErr);
      }
    }
  }

  /**
   * Programa notificaciones para una ventana de atención
   * @param id_ventana ID de la ventana
   * @param ids_docentes_especificos Lista opcional de IDs de docentes para notificar. Si no se provee, notifica a todos los de la categoría.
   * @param esAutomatico Si es true, envía notificación inmediata (solo para ventanas automáticas)
   */
  static async programarNotificacionesVentana(id_ventana: number, ids_docentes_especificos?: number[], esAutomatico: boolean = false) {
    const ventana = await prisma.ventanaAtencion.findUnique({
      where: { id_ventana },
      include: { periodo: true }
    });

    if (!ventana) return;

    // Obtener docentes que pertenecen a esta ventana
    const docentes = await prisma.docente.findMany({
      where: { 
        id_docente: ids_docentes_especificos ? { in: ids_docentes_especificos } : undefined,
        condicion: ids_docentes_especificos ? undefined : ventana.modalidad, 
        categoriaDocente: ids_docentes_especificos ? undefined : ventana.categoria,
        activo: true 
      }
    });

    for (const docente of docentes) {
      if (esAutomatico) {
        // MODO AUTOMÁTICO: Enviar notificación inmediata
        await this.programarNotificacionesVentanaCreada(ventana, [docente.id_docente]);
      } else {
        // MODO MANUAL: Enviar recordatorios 24h y 15min
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
  }

  /**
   * Programa notificación inmediata al crear una ventana de atención (modo automático)
   */
  private static async programarNotificacionesVentanaCreada(ventana: any, idsDocentes: number[]) {
    const ahora = new Date();

    for (const idDocente of idsDocentes) {
      try {
        const docente = await prisma.docente.findUnique({ where: { id_docente: idDocente } });
        if (!docente) continue;

        const replacePlaceholders = (text: string) => {
          if (!text) return "";
          return text
            .split('{{nombre_docente}}').join(`${docente.nombres} ${docente.apellidos}`)
            .split('{{fecha_inicio}}').join(new Date(ventana.fecha).toLocaleDateString('es-PE'))
            .split('{{hora_inicio}}').join(ventana.hora_inicio)
            .split('{{hora_fin}}').join(ventana.hora_fin);
        };

        // Obtener plantillas de la BD
        const tipoNotificacion = 'ventana_creada_inmediata';
        const configs = await prisma.configuracionNotificaciones.findMany({
          where: { tipo_notificacion: tipoNotificacion, activo: true }
        });
        const configCorreo = configs.find((conf: any) => conf.canal === 'correo');
        const configTelegram = configs.find((conf: any) => conf.canal === 'telegram');

        // Plantillas por defecto
        const asuntoDefault = `Ventana de Atención Creada - ${new Date(ventana.fecha).toLocaleDateString('es-PE')}`;
        const htmlDefault = `
          <p>Hola {{nombre_docente}},</p>
          <p>Tu ventana de atención se ha creado exitosamente:</p>
          <ul>
            <li><strong>Fecha:</strong> {{fecha_inicio}}</li>
            <li><strong>Hora:</strong> {{hora_inicio}} - {{hora_fin}}</li>
          </ul>
          <p>Podrás seleccionar/modificar tu horario durante esta ventana.</p>
          <p>Saludos,<br>Sistema de Horarios UNT</p>
        `;
        const textoDefault = `📅 <b>VENTANA DE ATENCIÓN CREADA</b>\n\nHola {{nombre_docente}},\nTu ventana de atención está lista:\n\n📆 Fecha: {{fecha_inicio}}\n⏰ Hora: {{hora_inicio}} - {{hora_fin}}\n\nPodrás seleccionar tu horario durante esta ventana.\n\n<i>Sistema de Horarios UNT</i>`;

        const asunto = configCorreo?.configuracion_adicional?.asunto || asuntoDefault;
        const html = replacePlaceholders(configCorreo?.plantilla_mensaje || htmlDefault);
        const texto = replacePlaceholders(configTelegram?.plantilla_mensaje || textoDefault);

        // Preferencias del docente
        const preferencias = await prisma.preferenciasNotificacionDocente.findMany({
          where: { id_docente: docente.id_docente, activo: true }
        });

        // Enviar por Correo
        const preferenciaCorreo = preferencias.find((p: any) => p.canal === 'correo');
        if (preferenciaCorreo) {
          await prisma.colaNotificaciones.create({
            data: {
              id_docente: docente.id_docente,
              tipo_notificacion: tipoNotificacion,
              canal: 'correo',
              fecha_programada: ahora,
              datos_mensaje: {
                asunto: asunto,
                html: html
              }
            }
          });
        }

        // Enviar por Telegram
        const preferenciaTelegram = preferencias.find((p: any) => p.canal === 'telegram' && p.verificado);
        if (preferenciaTelegram) {
          await prisma.colaNotificaciones.create({
            data: {
              id_docente: docente.id_docente,
              tipo_notificacion: tipoNotificacion,
              canal: 'telegram',
              fecha_programada: ahora,
              datos_mensaje: {
                texto: texto
              }
            }
          });
        }

      } catch (error) {
        console.error(`[Notificador] Error al programar notificación de ventana creada para docente ${idDocente}:`, error);
      }
    }

    console.log(`[Notificador] Programadas notificaciones inmediatas para ventana ${ventana.id_ventana}`);
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

      // EVITAR DUPLICADOS: No enviar más de un recordatorio de 24h por periodo/docente si ya existe uno programado para la misma fecha
      const margenError = 5 * 60 * 1000; // 5 minutos
      const existe = await prisma.colaNotificaciones.findFirst({
        where: { 
          id_docente, 
          tipo_notificacion: tipo, 
          canal: 'correo',
          fecha_programada: {
            gte: new Date(fecha.getTime() - margenError),
            lte: new Date(fecha.getTime() + margenError)
          }
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
              html: replacePlaceholders(configCorreo ? configCorreo.plantilla_mensaje : htmlDefault, docente),
              id_ventana: ventana.id_ventana
            }
          }
        });
      }
    }

    // 2. Programar Telegram (Tanto para 24h como 15min)
    const textoDefault = `🔔 <b>RECORDATORIO</b>\n\nHola {{nombre}}, tu ventana de atención es el {{fecha}} a las {{hora}}.\n\n<i>Sistema de Horarios UNT</i>`;

    // EVITAR DUPLICADOS: No enviar más de una alerta del mismo tipo si ya se envió una recientemente o está pendiente
    // Buscamos si ya existe una notificación para este docente, canal y tipo programada para la misma fecha (aprox)
    const margenErrorTelegram = 5 * 60 * 1000; // 5 minutos
    const existeTelegram = await prisma.colaNotificaciones.findFirst({
      where: { 
        id_docente, 
        tipo_notificacion: tipo, 
        canal: 'telegram',
        fecha_programada: {
          gte: new Date(fecha.getTime() - margenErrorTelegram),
          lte: new Date(fecha.getTime() + margenErrorTelegram)
        }
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
            texto: replacePlaceholders(configTelegram ? configTelegram.plantilla_mensaje : textoDefault, docente),
            id_ventana: ventana.id_ventana // Guardamos el ID de ventana en los metadatos
          }
        }
      });
    }
  }

  /**
   * Programa notificaciones para docente cuando se confirma un horario
   */
  static async programarNotificacionesHorarioConfirmado(
    horario: HorarioAsignado & {
      docente: Docente;
      curso: Curso;
      grupo: Grupo;
      ambiente: Ambiente;
      periodo: PeriodoAcademico;
    },
    esAutomatico: boolean = false
  ) {
    const docente = horario.docente;
    const ahora = new Date();

    const replacePlaceholders = (text: string) => {
      if (!text) return "";
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return text
        .split('{{nombre_docente}}').join(`${docente.nombres} ${docente.apellidos}`)
        .split('{{nombre_curso}}').join(horario.curso.nombre)
        .split('{{codigo_curso}}').join(horario.curso.codigo)
        .split('{{grupo}}').join(horario.grupo.codigo_grupo)
        .split('{{ambiente}}').join(`${horario.ambiente.codigo} - ${horario.ambiente.nombre}`)
        .split('{{dia_semana}}').join(diasSemana[horario.dia_semana])
        .split('{{hora_inicio}}').join(horario.hora_inicio)
        .split('{{hora_fin}}').join(horario.hora_fin)
        .split('{{periodo}}').join(horario.periodo.nombre);
    };

    // Obtener plantillas de la BD
    const tipoNotificacion = esAutomatico ? 'horario_asignado_automatico' : 'horario_confirmado_manual';
    const configs = await prisma.configuracionNotificaciones.findMany({
      where: { tipo_notificacion: tipoNotificacion, activo: true }
    });
    const configCorreo = configs.find((conf: any) => conf.canal === 'correo');
    const configTelegram = configs.find((conf: any) => conf.canal === 'telegram');

    // Plantillas por defecto
    const asuntoDefaultManual = 'Horario Confirmado - ' + horario.curso.nombre;
    const htmlDefaultManual = `
      <p>Hola {{nombre_docente}},</p>
      <p>Tu horario ha sido confirmado exitosamente:</p>
      <ul>
        <li><strong>Curso:</strong> {{nombre_curso}} ({{codigo_curso}})</li>
        <li><strong>Grupo:</strong> {{grupo}}</li>
        <li><strong>Ambiente:</strong> {{ambiente}}</li>
        <li><strong>Día:</strong> {{dia_semana}}</li>
        <li><strong>Horario:</strong> {{hora_inicio}} - {{hora_fin}}</li>
        <li><strong>Periodo:</strong> {{periodo}}</li>
      </ul>
      <p><strong>Descarga tu PDF de horario:</strong> Ve al dashboard, sección "Reportes" y selecciona "Horario por Docente".</p>
      <p>Saludos,<br>Sistema de Horarios UNT</p>
    `;

    const textoDefaultManual = `✅ <b>HORARIO CONFIRMADO</b>\n\nHola {{nombre_docente}},\nTu horario ha sido confirmado:\n\n📚 Curso: {{nombre_curso}} ({{codigo_curso}})\n👥 Grupo: {{grupo}}\n🏢 Ambiente: {{ambiente}}\n📅 Día: {{dia_semana}}\n⏰ Hora: {{hora_inicio}} - {{hora_fin}}\n📆 Periodo: {{periodo}}\n\n📄 Descarga tu PDF: Ve a Reportes → Horario por Docente.\n\n<i>Sistema de Horarios UNT</i>`;

    const asuntoDefaultAutomatico = 'Horario Asignado Automáticamente - ' + horario.curso.nombre;
    const htmlDefaultAutomatico = `
      <p>Hola {{nombre_docente}},</p>
      <p>Se te ha asignado un horario automáticamente:</p>
      <ul>
        <li><strong>Curso:</strong> {{nombre_curso}} ({{codigo_curso}})</li>
        <li><strong>Grupo:</strong> {{grupo}}</li>
        <li><strong>Ambiente:</strong> {{ambiente}}</li>
        <li><strong>Día:</strong> {{dia_semana}}</li>
        <li><strong>Horario:</strong> {{hora_inicio}} - {{hora_fin}}</li>
        <li><strong>Periodo:</strong> {{periodo}}</li>
      </ul>
      <p><strong>Descarga tu PDF de horario:</strong> Ve al dashboard, sección "Reportes" y selecciona "Horario por Docente".</p>
      <p>Si necesitas realizar cambios, por favor contacta al personal administrativo.</p>
      <p>Saludos,<br>Sistema de Horarios UNT</p>
    `;

    const textoDefaultAutomatico = `🔔 <b>HORARIO ASIGNADO AUTOMÁTICAMENTE</b>\n\nHola {{nombre_docente}},\nSe te ha asignado un horario:\n\n📚 Curso: {{nombre_curso}} ({{codigo_curso}})\n👥 Grupo: {{grupo}}\n🏢 Ambiente: {{ambiente}}\n📅 Día: {{dia_semana}}\n⏰ Hora: {{hora_inicio}} - {{hora_fin}}\n📆 Periodo: {{periodo}}\n\n📄 Descarga tu PDF: Ve a Reportes → Horario por Docente.\n\nSi necesitas cambios, contacta al personal administrativo.\n\n<i>Sistema de Horarios UNT</i>`;

    const asuntoDefault = esAutomatico ? asuntoDefaultAutomatico : asuntoDefaultManual;
    const htmlDefault = esAutomatico ? htmlDefaultAutomatico : htmlDefaultManual;
    const textoDefault = esAutomatico ? textoDefaultAutomatico : textoDefaultManual;

    // Preferencias del docente
    const preferencias = await prisma.preferenciasNotificacionDocente.findMany({
      where: { id_docente: docente.id_docente, activo: true }
    });

    // Enviar por Correo
    const preferenciaCorreo = preferencias.find((p: any) => p.canal === 'correo');
    if (preferenciaCorreo) {
      await prisma.colaNotificaciones.create({
        data: {
          id_docente: docente.id_docente,
          tipo_notificacion: tipoNotificacion,
          canal: 'correo',
          fecha_programada: ahora,
          datos_mensaje: {
            asunto: configCorreo?.configuracion_adicional?.asunto || asuntoDefault,
            html: replacePlaceholders(configCorreo?.plantilla_mensaje || htmlDefault)
          }
        }
      });
    }

    // Enviar por Telegram
    const preferenciaTelegram = preferencias.find((p: any) => p.canal === 'telegram' && p.verificado);
    if (preferenciaTelegram) {
      await prisma.colaNotificaciones.create({
        data: {
          id_docente: docente.id_docente,
          tipo_notificacion: tipoNotificacion,
          canal: 'telegram',
          fecha_programada: ahora,
          datos_mensaje: {
            texto: replacePlaceholders(configTelegram?.plantilla_mensaje || textoDefault)
          }
        }
      });
    }

    console.log(`[Notificador] Programadas notificaciones de horario confirmado para docente ${docente.id_docente}`);
  }
}
