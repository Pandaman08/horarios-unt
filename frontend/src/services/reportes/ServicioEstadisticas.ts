import { prisma } from '@/lib/prisma';
import { 
  calcularMedia, 
  calcularMediana, 
  calcularDesviacionEstandar, 
  calcularMinimo, 
  calcularMaximo 
} from '@/lib/estadisticas';

export class ServicioEstadisticas {
  static async obtenerEstadisticasGestion(id_periodo: number) {
    const asignaciones = await prisma.horarioAsignado.findMany({
      where: { id_periodo },
    });

    if (asignaciones.length === 0) return null;

    // Calcular horas por cada asignación
    const horas = asignaciones.map((a: any) => {
      const [h1, m1] = a.hora_inicio.split(':').map(Number);
      const [h2, m2] = a.hora_fin.split(':').map(Number);
      return (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    });

    const mean = calcularMedia(horas);
    const median = calcularMediana(horas);
    const stdDev = calcularDesviacionEstandar(horas, mean);

    return {
      total_asignaciones: asignaciones.length,
      media_horas: mean.toFixed(2),
      mediana_horas: median.toFixed(2),
      desviacion_estandar: stdDev.toFixed(2),
      min_horas: calcularMinimo(horas),
      max_horas: calcularMaximo(horas),
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
