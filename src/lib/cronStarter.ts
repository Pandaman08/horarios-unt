// src/lib/cronStarter.ts
import { iniciarCronJobs } from '@/lib/programadorTareas';

let started = false;

export function iniciarCronOnce() {
  if (started) return;
  started = true;

  // Ejecuta los cron jobs definidos en src/lib/programadorTareas.ts
  iniciarCronJobs();
}

