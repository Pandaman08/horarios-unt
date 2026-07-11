import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ServicioTelegram } from '@/services/notificaciones/ServicioTelegram';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // El bot recibe mensajes tipo: /start <codigo_docente>
    const message = body.message;
    if (!message || !message.text) return NextResponse.json({ ok: true });

    const text = message.text;
    const chatId = message.chat.id.toString();

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const codigoDocente = parts[1];
        
        // Buscar docente por código o ID de usuario
        const docente = await prisma.docente.findFirst({
          where: {
            OR: [
              { codigo_docente: codigoDocente },
              { usuario: { codigo: codigoDocente } }
            ]
          }
        });

        if (docente) {
          // Registrar chat_id en las preferencias
          await prisma.preferenciasNotificacionDocente.upsert({
            where: {
              id_docente_canal: {
                id_docente: docente.id_docente,
                canal: 'telegram'
              }
            },
            update: {
              activo: true,
              datos_contacto: { chat_id: chatId, username: message.from.username },
              verificado: true,
              fecha_verificacion: new Date()
            },
            create: {
              id_docente: docente.id_docente,
              canal: 'telegram',
              activo: true,
              datos_contacto: { chat_id: chatId, username: message.from.username },
              verificado: true,
              fecha_verificacion: new Date()
            }
          });

          await ServicioTelegram.enviarMensaje(chatId, `✅ <b>¡Registro exitoso!</b>\nHola ${docente.nombres}, ahora recibirás notificaciones sobre tus ventanas de atención por este canal.`);
        } else {
          await ServicioTelegram.enviarMensaje(chatId, `❌ No se encontró un docente con el código <b>${codigoDocente}</b>. Asegúrate de escribirlo correctamente.`);
        }
      } else {
        await ServicioTelegram.enviarMensaje(chatId, `Bienvenido al Bot de Horarios UNT. Para registrarte, envía:\n<code>/start TU_CODIGO</code>`);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error en Webhook Telegram:', error);
    return NextResponse.json({ ok: true }); // Siempre devolver 200 a Telegram
  }
}
