import cron from 'node-cron';
import { GestorSeleccionTemporal } from '../services/horarios/GestorSeleccionTemporal';
import { ServicioNotificador } from '../services/notificaciones/ServicioNotificador';
import { ServicioTelegram } from '../services/notificaciones/ServicioTelegram';

export const iniciarCronJobs = () => {
  console.log("⏰ Iniciando cron jobs en el Backend...");

  // Telegram Polling (Solo en Backend)
  if (process.env.NODE_ENV !== 'production') {
    console.log("🤖 Iniciando polling de Telegram en Backend...");
    // Aquí deberías importar e iniciar tu polling si es necesario
  }

  // Limpieza de selecciones temporales cada 5 minutos
  cron.schedule('*/5 * * * *', async () => {
    console.log("🧹 Ejecutando limpieza de selecciones temporales...");
    try {
      const eliminados = await GestorSeleccionTemporal.limpiarExpirados();
      if (eliminados.length > 0) {
        console.log(`✅ Se eliminaron ${eliminados.length} selecciones expiradas.`);
      }
    } catch (error) {
      console.error("❌ Error en cron de limpieza:", error);
    }
  });

  // Procesar cola de notificaciones cada minuto
  cron.schedule('* * * * *', async () => {
    try {
      await ServicioNotificador.procesarCola();
    } catch (error) {
      console.error("❌ Error en cron de notificaciones:", error);
    }
  });
};
