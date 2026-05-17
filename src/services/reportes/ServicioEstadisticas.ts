import { prisma } from '@/lib/prisma';

export class ServicioEstadisticas {
  static async obtenerEstadisticasGestion(id_periodo: number) {
    const asignaciones = await prisma.horarioAsignado.findMany({
      where: { id_periodo },
    });

    if (asignaciones.length === 0) return null;

    // Calcular horas por cada asignación
    const horas = asignaciones.map(a => {
      const [h1, m1] = a.hora_inicio.split(':').map(Number);
      const [h2, m2] = a.hora_fin.split(':').map(Number);
      return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    });

    const sum = horas.reduce((a, b) => a + b, 0);
    const mean = sum / horas.length;
    
    const sortedHoras = [...horas].sort((a, b) => a - b);
    const median = sortedHoras.length % 2 === 0 
      ? (sortedHoras[sortedHoras.length / 2 - 1] + sortedHoras[sortedHoras.length / 2]) / 2
      : sortedHoras[Math.floor(sortedHoras.length / 2)];

    const stdDev = Math.sqrt(horas.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / horas.length);

    return {
      total_asignaciones: asignaciones.length,
      media_horas: mean.toFixed(2),
      mediana_horas: median.toFixed(2),
      desviacion_estandar: stdDev.toFixed(2),
      min_horas: Math.min(...horas),
      max_horas: Math.max(...horas),
      observaciones: this.generarObservaciones(mean, stdDev)
    };
  }

  private static generarObservaciones(mean: number, stdDev: number): string[] {
    const obs = [];
    if (mean > 6) obs.push("La carga horaria promedio es alta (>6h).");
    if (stdDev > 2) obs.push("Existe una alta variabilidad en la distribución de horas entre docentes.");
    if (obs.length === 0) obs.push("Distribución horaria equilibrada según estándares.");
    return obs;
  }
}
