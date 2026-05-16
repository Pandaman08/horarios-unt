import { prisma } from '@/lib/prisma';
import { addMinutes, format, parse, isAfter } from 'date-fns';

export class GestorVentanasAtencion {
  /**
   * Calcula cuántos docentes hay por cada categoría y modalidad
   */
  static async obtenerEstadisticasDocentes() {
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      select: {
        modalidad: true,
        categoria: true
      }
    });

    const stats: Record<string, Record<string, number>> = {
      nombrado: { principal: 0, asociado: 0, auxiliar: 0, jefe_practica: 0 },
      contratado: { principal: 0, asociado: 0, auxiliar: 0, jefe_practica: 0 }
    };

    docentes.forEach(d => {
      if (stats[d.modalidad] && stats[d.modalidad][d.categoria] !== undefined) {
        stats[d.modalidad][d.categoria]++;
      }
    });

    return stats;
  }

  /**
   * Programa automáticamente las ventanas de atención para un periodo
   */
  static async programarVentanasAutomaticas(params: {
    id_periodo: number;
    fecha_inicio: Date;
    hora_inicio_jornada: string; // "08:00"
    hora_fin_jornada: string;    // "18:00"
    intervalo_por_docente: number; // 15
  }) {
    const { id_periodo, fecha_inicio, hora_inicio_jornada, hora_fin_jornada, intervalo_por_docente } = params;
    
    // Obtener docentes ordenados por jerarquía
    const docentes = await prisma.docente.findMany({
      where: { activo: true },
      orderBy: [
        { modalidad: 'asc' }, // nombrado, contratado
        { categoria: 'asc' }, // principal, asociado, auxiliar, jefe_practica
        { antiguedad: 'desc' }
      ]
    });

    const ventanasCreadas = [];
    let fechaActual = new Date(fecha_inicio);
    let horaActual = parse(hora_inicio_jornada, 'HH:mm', fechaActual);
    const horaLimite = parse(hora_fin_jornada, 'HH:mm', fechaActual);

    // Agrupar docentes por modalidad y categoría para crear ventanas por bloques
    const grupos = this.agruparDocentesPorJerarquia(docentes);

    for (const grupo of grupos) {
      const { modalidad, categoria, listaDocentes } = grupo;
      const numDocentes = listaDocentes.length;
      if (numDocentes === 0) continue;

      const minutosNecesarios = numDocentes * intervalo_por_docente;
      let minutosRestantes = minutosNecesarios;

      while (minutosRestantes > 0) {
        // Calcular cuánto tiempo queda en la jornada de hoy
        const minutosDisponiblesHoy = (horaLimite.getTime() - horaActual.getTime()) / (1000 * 60);

        if (minutosDisponiblesHoy <= 0) {
          // Pasar al siguiente día hábil (asumiendo L-V por ahora)
          fechaActual = this.obtenerSiguienteDiaHabil(fechaActual);
          horaActual = parse(hora_inicio_jornada, 'HH:mm', fechaActual);
          continue;
        }

        const minutosAsignados = Math.min(minutosRestantes, minutosDisponiblesHoy);
        const horaFinVentana = addMinutes(horaActual, minutosAsignados);

        const ventana = await prisma.ventanaAtencion.create({
          data: {
            id_periodo,
            fecha: fechaActual,
            hora_inicio: format(horaActual, 'HH:mm'),
            hora_fin: format(horaFinVentana, 'HH:mm'),
            modalidad,
            categoria,
            intervalo_minutos: intervalo_por_docente,
            cantidad_docentes: Math.ceil(minutosAsignados / intervalo_por_docente),
            activo: true
          }
        });

        ventanasCreadas.push(ventana);
        minutosRestantes -= minutosAsignados;
        horaActual = horaFinVentana;

        // Si terminamos la jornada, resetear para el día siguiente
        if (horaActual.getTime() >= horaLimite.getTime()) {
          fechaActual = this.obtenerSiguienteDiaHabil(fechaActual);
          horaActual = parse(hora_inicio_jornada, 'HH:mm', fechaActual);
        }
      }
    }

    return ventanasCreadas;
  }

  private static agruparDocentesPorJerarquia(docentes: any[]) {
    const jerarquiaModalidad = ['nombrado', 'contratado'];
    const jerarquiaCategoria = ['principal', 'asociado', 'auxiliar', 'jefe_practica'];
    const grupos = [];

    for (const mod of jerarquiaModalidad) {
      for (const cat of jerarquiaCategoria) {
        const lista = docentes.filter(d => d.modalidad === mod && d.categoria === cat);
        if (lista.length > 0) {
          grupos.push({ modalidad: mod, categoria: cat, listaDocentes: lista });
        }
      }
    }
    return grupos;
  }

  private static obtenerSiguienteDiaHabil(fecha: Date) {
    const nuevaFecha = new Date(fecha);
    do {
      nuevaFecha.setDate(nuevaFecha.getDate() + 1);
    } while (nuevaFecha.getDay() === 0); // Omitir domingos (0)
    return nuevaFecha;
  }

  /**
   * Verifica si un docente tiene permiso para acceder en este momento
   */
  static async verificarAccesoDocente(id_docente: number) {
    const docente = await prisma.docente.findUnique({
      where: { id_docente }
    });

    if (!docente) return { tieneAcceso: false, mensaje: 'Docente no encontrado' };

    const ahora = new Date();
    const horaActualStr = format(ahora, 'HH:mm');
    const fechaActual = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    const ventanaActiva = await prisma.ventanaAtencion.findFirst({
      where: {
        activo: true,
        completado: false,
        fecha: {
          equals: fechaActual
        },
        hora_inicio: { lte: horaActualStr },
        hora_fin: { gte: horaActualStr },
        modalidad: docente.modalidad,
        categoria: docente.categoria
      }
    });

    if (ventanaActiva) {
      return { tieneAcceso: true, ventana: ventanaActiva };
    }

    // Buscar la próxima ventana para informar al docente
    const proximaVentana = await prisma.ventanaAtencion.findFirst({
      where: {
        activo: true,
        completado: false,
        OR: [
          {
            fecha: { gt: fechaActual }
          },
          {
            fecha: fechaActual,
            hora_inicio: { gt: horaActualStr }
          }
        ],
        modalidad: docente.modalidad,
        categoria: docente.categoria
      },
      orderBy: [
        { fecha: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    return { 
      tieneAcceso: false, 
      mensaje: proximaVentana 
        ? `Su ventana de atención está programada para el ${format(proximaVentana.fecha, 'dd/MM/yyyy')} a las ${proximaVentana.hora_inicio}.`
        : 'No tiene una ventana de atención programada actualmente.'
    };
  }
}
