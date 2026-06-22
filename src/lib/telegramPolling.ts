import axios from 'axios';
import { prisma } from '@/lib/prisma';
import { ServicioTelegram } from '@/services/notificaciones/ServicioTelegram';

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const apiUrl = `https://api.telegram.org/bot${botToken}`;

// Usar global para evitar múltiples instancias en desarrollo
const globalForTelegram = global as unknown as { telegramPollingStarted?: boolean };

let offset = 0;

export async function iniciarTelegramPolling() {
  if (globalForTelegram.telegramPollingStarted) {
    return;
  }

  if (!botToken || botToken === 'tu_token_aqui' || botToken.length < 10) {
    console.warn('TELEGRAM_BOT_TOKEN no configurado o inválido. Polling omitido.');
    return;
  }

  globalForTelegram.telegramPollingStarted = true;
  console.log('Iniciando Telegram polling...');

  // Ejecutar en segundo plano
  const poll = async () => {
    while (globalForTelegram.telegramPollingStarted) {
      try {
        const response = await axios.get(`${apiUrl}/getUpdates`, {
          params: { offset, timeout: 30 },
          timeout: 35000 // Un poco más que el timeout de Telegram
        });

        const updates = response.data.result || [];

        for (const update of updates) {
          offset = update.update_id + 1;
          await procesarMensaje(update);
        }
      } catch (error: any) {
        // Si recibimos un 404 o 401, el token es inválido. Detenemos el polling.
        if (error.response?.status === 404 || error.response?.status === 401) {
          console.error('TOKEN de Telegram inválido (404/401). Deteniendo polling permanentemente.');
          globalForTelegram.telegramPollingStarted = false;
          break;
        }
        
        console.error('Error en Telegram polling:', error.message);
        // Esperar 10 segundos antes de reintentar para no saturar la consola
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
  };

  poll();
}

export function detenerTelegramPolling() {
  globalForTelegram.telegramPollingStarted = false;
  console.log('Telegram polling detenido');
}

async function procesarMensaje(update: any) {
  try {
    const message = update.message;
    if (!message || !message.text) return;

    const text = message.text;
    const chatId = message.chat.id.toString();

    console.log(`Mensaje recibido de ${chatId}: ${text}`);

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
              datos_contacto: { chat_id: chatId, username: message.from?.username },
              verificado: true,
              fecha_verificacion: new Date()
            },
            create: {
              id_docente: docente.id_docente,
              canal: 'telegram',
              activo: true,
              datos_contacto: { chat_id: chatId, username: message.from?.username },
              verificado: true,
              fecha_verificacion: new Date()
            }
          });

          console.log(`✅ Docente ${docente.nombres} registrado con chat_id ${chatId}`);
          await ServicioTelegram.enviarMensaje(chatId, `✅ <b>¡Registro exitoso!</b>\nHola ${docente.nombres}, ahora recibirás notificaciones sobre tus ventanas de atención por este canal.`);
        } else {
          console.log(`❌ No se encontró docente con código ${codigoDocente}`);
          await ServicioTelegram.enviarMensaje(chatId, `❌ No se encontró un docente con el código <b>${codigoDocente}</b>. Asegúrate de escribirlo correctamente.`);
        }
      } else {
        await ServicioTelegram.enviarMensaje(chatId, `Bienvenido al Bot de Horarios UNT. Para registrarte, envía:\n<code>/start TU_CODIGO</code>`);
      }
    }
  } catch (error) {
    console.error('Error procesando mensaje:', error);
  }
}
