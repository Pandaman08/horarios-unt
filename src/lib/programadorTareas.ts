import cron from 'node-cron';
import { GestorSeleccionTemporal } from '@/services/horarios/GestorSeleccionTemporal';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';
import { ServicioTelegram } from '@/services/notificaciones/ServicioTelegram';
import { iniciarTelegramPolling } from '@/lib/telegramPolling';

export const iniciarCronJobs = () => {
  console.log("[CronJobs] Iniciando cron jobs (solo entorno local)...");

  // Configurar Telegram según el entorno
  const isProd = process.env.NODE_ENV === 'production';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;

  if (isProd && appUrl) {
    const webhookUrl = `${appUrl.startsWith('http') ? '' : 'https://'}${appUrl}/api/telegram/webhook`;
    console.log(`[CronJobs] Configurando webhook de Telegram en: ${webhookUrl}`);
    ServicioTelegram.setWebhook(webhookUrl);
  } else {
    console.log("[CronJobs] Entorno local detectado, iniciando polling de Telegram...");
    iniciarTelegramPolling();
  }

  // Limpieza de selecciones temporales cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log("[CronJobs] Ejecutando limpieza de selecciones temporales...");
    try {
      const eliminados = await GestorSeleccionTemporal.limpiarExpirados();
      if (eliminados.length > 0) {
        console.log(`[CronJobs] Se eliminaron ${eliminados.length} selecciones expiradas.`);
      }
    } catch (error) {
      console.error("[CronJobs] Error en cron de limpieza:", error);
    }
  });

  // Procesar cola de notificaciones cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      await ServicioNotificador.procesarCola();
    } catch (error) {
      console.error("[CronJobs] Error en cron de notificaciones:", error);
    }
  });
};
