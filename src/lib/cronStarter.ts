// src/lib/cronStarter.ts
import { iniciarCronJobs } from '@/lib/programadorTareas';

// Usar global para evitar múltiples instancias en desarrollo (Hot Module Replacement)
const globalForCron = global as unknown as { cronStarted?: boolean };

export function iniciarCronOnce() {
  if (globalForCron.cronStarted) return;
  
  globalForCron.cronStarted = true;
  console.log("Iniciando servicios en segundo plano (Singleton)...");

  // Ejecuta los cron jobs definidos en src/lib/programadorTareas.ts
  iniciarCronJobs();
}

