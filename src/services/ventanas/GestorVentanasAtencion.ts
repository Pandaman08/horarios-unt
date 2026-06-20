import { prisma } from '@/lib/prisma';
import { addMinutes, format } from 'date-fns';
import { ServicioNotificador } from '@/services/notificaciones/ServicioNotificador';

const prioridadCategoria = ['jefe_practica', 'auxiliar', 'asociado', 'principal'];

export class GestorVentanasAtencion {
  static async obtenerDocentesAprobadosOrdenados(id_periodo: number) {
    const docentes = await prisma.docente.findMany({
      where: {
        activo: true,
        declaraciones_horarias: {
          some: {
            id_periodo,
            estado: 'APROBADO'
          }
        }
      }
    });

    return [...docentes].sort((a, b) => {
      if (a.modalidad === 'nombrado' && b.modalidad !== 'nombrado') return -1;
      if (b.modalidad === 'nombrado' && a.modalidad !== 'nombrado') return 1;

      const catA = prioridadCategoria.indexOf(a.categoria);
      const catB = prioridadCategoria.indexOf(b.categoria);
      if (catA !== catB) return catB - catA;

      if (a.fecha_ingreso && b.fecha_ingreso) {
        return new Date(a.fecha_ingreso).getTime() - new Date(b.fecha_ingreso).getTime();
      }
      return 0;
    });
  }

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

    docentes.forEach((d: { modalidad: string | number; categoria: string | number; }) => {
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
    
    console.log(`Iniciando programación automática: Periodo=${id_periodo}, FechaInicio=${format(fecha_inicio, 'yyyy-MM-dd')}`);

    // 1. Obtener docentes activos que tienen al menos un curso asignado
    const docentes = await prisma.docente.findMany({
      where: { 
        activo: true,
        docente_cursos: {
          some: {
            activo: true
          }
        }
      },
      orderBy: [
        { modalidad: 'asc' }, 
        { categoria: 'asc' }, 
        { fecha_ingreso: 'asc' }
      ]
    });

    console.log(`Docentes elegibles encontrados: ${docentes.length}`);

    // 2. Identificar docentes que ya tienen una ventana programada
    // Usamos la cola de notificaciones como referencia de quién ya fue programado
    const notificacionesExistentes = await prisma.colaNotificaciones.findMany({
      where: {
        tipo_notificacion: 'recordatorio_24h'
      },
      select: { id_docente: true }
    });
    const idsDocentesConVentana = new Set(notificacionesExistentes.map((n: any) => n.id_docente || 0));

    // Filtrar la lista para quedarnos solo con los que NO tienen ventana
    const docentesSinVentana = docentes.filter((d:any) => !idsDocentesConVentana.has(d.id_docente));
    console.log(`Docentes sin ventana previa: ${docentesSinVentana.length}`);

    if (docentesSinVentana.length === 0) {
      console.log("No hay nuevos docentes que requieran programación de ventanas.");
      return [];
    }

    // 3. Obtener ventanas existentes para el periodo (solo para saber dónde continuar el horario)
    const ventanasExistentes = await prisma.ventanaAtencion.findMany({
      where: { id_periodo, activo: true }
    });

    // Agrupar solo los docentes que faltan por jerarquía
    const gruposParaProcesar = this.agruparDocentesPorJerarquia(docentesSinVentana);
    
    const ventanasCreadas = [];
    
    // Buscar la última ventana para continuar desde ahí si es posible
    let fechaActual = new Date(fecha_inicio);
    let horaActual = this.parseHora(hora_inicio_jornada, fechaActual);

    let horaLimite = this.parseHora(hora_fin_jornada, fechaActual);
    let prioridadActual = 1;

    if (ventanasExistentes.length > 0) {
      const ultimaVentana = [...ventanasExistentes].sort((a, b) => {
        const dateA = new Date(a.fecha).getTime() + this.timeToMinutes(a.hora_fin);
        const dateB = new Date(b.fecha).getTime() + this.timeToMinutes(b.hora_fin);
        return dateB - dateA;
      })[0];

      fechaActual = new Date(ultimaVentana.fecha);
      horaActual = this.parseHora(ultimaVentana.hora_fin, fechaActual);
      prioridadActual = Math.max(...ventanasExistentes.map((v: any) => v.orden_prioridad || 0)) + 1;
    }

    horaLimite = this.parseHora(hora_fin_jornada, fechaActual);

    for (const grupo of gruposParaProcesar) {
      const { modalidad, categoria, listaDocentes } = grupo;
      const numDocentes = listaDocentes.length;

      const minutosNecesarios = numDocentes * intervalo_por_docente;
      let minutosRestantes = minutosNecesarios;
      let docentesProcesadosEnGrupo = 0;

      while (minutosRestantes > 0) {
        // Calcular cuánto tiempo queda en la jornada de hoy
        const minutosDisponiblesHoy = (horaLimite.getTime() - horaActual.getTime()) / (1000 * 60);

        if (minutosDisponiblesHoy <= 0) {
          // Pasar al siguiente día hábil
          fechaActual = this.obtenerSiguienteDiaHabil(fechaActual);
          horaActual = this.parseHora(hora_inicio_jornada, fechaActual);
          horaLimite = this.parseHora(hora_fin_jornada, fechaActual);
          console.log(`Cambiando al siguiente día: ${format(fechaActual, 'yyyy-MM-dd')}`);
          continue;
        }

        const minutosAsignados = Math.min(minutosRestantes, minutosDisponiblesHoy);
        const horaFinVentana = addMinutes(horaActual, minutosAsignados);
        const cantidadDocentesEnEstaVentana = Math.ceil(minutosAsignados / intervalo_por_docente);
        
        // Seleccionar los docentes específicos para esta ventana
        const docentesParaEstaVentana = listaDocentes.slice(
          docentesProcesadosEnGrupo, 
          docentesProcesadosEnGrupo + cantidadDocentesEnEstaVentana
        );

        const ventana = await prisma.ventanaAtencion.create({
          data: {
            id_periodo,
            fecha: fechaActual,
            hora_inicio: format(horaActual, 'HH:mm'),
            hora_fin: format(horaFinVentana, 'HH:mm'),
            modalidad,
            categoria,
            orden_prioridad: prioridadActual++,
            intervalo_minutos: intervalo_por_docente,
            cantidad_docentes: cantidadDocentesEnEstaVentana,
            activo: true
          }
        });

        ventanasCreadas.push(ventana);
        
        // Programar notificaciones SOLO para los docentes de esta ventana (modo automático)
        await ServicioNotificador.programarNotificacionesVentana(
          ventana.id_ventana, 
          docentesParaEstaVentana.map(d => d.id_docente),
          true // esAutomatico = true
        );
        
        minutosRestantes -= minutosAsignados;
        docentesProcesadosEnGrupo += cantidadDocentesEnEstaVentana;
        horaActual = horaFinVentana;

        // Si terminamos la jornada, resetear para el día siguiente
        if (horaActual.getTime() >= horaLimite.getTime() && minutosRestantes > 0) {
          fechaActual = this.obtenerSiguienteDiaHabil(fechaActual);
          horaActual = this.parseHora(hora_inicio_jornada, fechaActual);
          horaLimite = this.parseHora(hora_fin_jornada, fechaActual);
          console.log(`Jornada terminada. Cambiando al siguiente día: ${format(fechaActual, 'yyyy-MM-dd')}`);
        }
      }
    }

    console.log(`Programación finalizada. Ventanas creadas: ${ventanasCreadas.length}`);
    return ventanasCreadas;
  }

  private static timeToMinutes(horaStr: string): number {
    const [h, m] = horaStr.split(':').map(Number);
    return h * 60 + m;
  }

  private static parseHora(horaStr: string, fechaRef: Date): Date {
    const [horas, minutos] = horaStr.split(':').map(Number);
    const fecha = new Date(fechaRef);
    fecha.setHours(horas, minutos, 0, 0);
    return fecha;
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
   * Verifica si un docente tiene acceso en el momento actual
   */
  static async verificarAccesoDocente(id_docente: number) {
    const docente = await prisma.docente.findUnique({
      where: { id_docente }
    });

    if (!docente) return { tieneAcceso: false, mensaje: "Docente no encontrado" };

    // PRIMERO: Verificar si el docente ya tiene horarios confirmados o asignados
    // Si tiene horarios, permitir acceso en modo solo lectura para verlos
    const horariosConfirmados = await prisma.horarioAsignado.findMany({
      where: {
        id_docente: id_docente,
        estado: {
          in: ["confirmado", "definitivo", "asignado", "publicado"]
        }
      },
      take: 1
    });

    if (horariosConfirmados.length > 0) {
      return { 
        tieneAcceso: true, 
        soloLectura: true,
        mensaje: "Viendo horario confirmado" 
      };
    }

    const periodoActivo = await prisma.periodoAcademico.findFirst({
      where: { activo: true },
      orderBy: { id_periodo: 'desc' }
    });

    if (!periodoActivo) {
      return { 
        tieneAcceso: false, 
        soloLectura: false,
        mensaje: 'No hay período activo' 
      };
    }

    // Obtener y ordenar docentes (misma lógica robusta y filtro exacto)
    const docentesOrdenados = await this.obtenerDocentesAprobadosOrdenados(periodoActivo.id_periodo);

    const indexDocente = docentesOrdenados.findIndex((d: any) => d.id_docente === id_docente);
    const ventanas = await prisma.ventanaAtencion.findMany({
      where: { id_periodo: periodoActivo.id_periodo },
      orderBy: { orden_prioridad: 'asc' }
    });

    const ahora = new Date();
    const hoySoloFechaStr = format(ahora, 'yyyy-MM-dd');
    const horaActual = format(ahora, 'HH:mm');

    if (indexDocente !== -1 && ventanas.length > indexDocente) {
      const ventana = ventanas[indexDocente];
      const fechaInicio = new Date(ventana.fecha);
      const [horasInicio, minutosInicio] = ventana.hora_inicio.split(':').map(Number);
      const [horasFin, minutosFin] = ventana.hora_fin.split(':').map(Number);
      
      fechaInicio.setHours(horasInicio, minutosInicio, 0, 0);
      const fechaFin = new Date(fechaInicio);
      fechaFin.setHours(horasFin, minutosFin, 0, 0);

      if (ahora < fechaInicio) {
        return { 
          tieneAcceso: false, 
          soloLectura: false,
          mensaje: `Su turno está programado para el ${format(fechaInicio, 'dd/MM/yyyy')} a las ${ventana.hora_inicio}. (Hora del servidor: ${horaActual})` 
        };
      } else if (ahora >= fechaInicio && ahora <= fechaFin) {
        const segundosRestantes = Math.max(0, Math.floor((fechaFin.getTime() - ahora.getTime()) / 1000));
        return { 
          tieneAcceso: true, 
          segundos_restantes: segundosRestantes,
          id_ventana: ventana.id_ventana 
        };
      } else {
        return { 
          tieneAcceso: false, 
          soloLectura: true,
          mensaje: `Su ventana de atención finalizó el ${format(fechaFin, 'dd/MM/yyyy')} a las ${ventana.hora_fin}. El sistema está en modo solo lectura.` 
        };
      }
    }

    return { 
      tieneAcceso: false, 
      soloLectura: false,
      mensaje: `No tiene turnos programados en este periodo. (Fecha servidor: ${hoySoloFechaStr}, Hora servidor: ${horaActual})` 
    };
  }
}
